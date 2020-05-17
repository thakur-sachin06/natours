const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const crypto = require('crypto');
const AppError = require('../utils/appError');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const Email = require('../utils/email');

const jwtToken = (id) => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    // creating token
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, response) => {
  const token = jwtToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000 //converting to millisec.
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  response.cookie('jwt', token, cookieOptions); //attaching cookie to response object.

  // Remove password from output
  user.password = undefined;

  response.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (request, response, next) => {
  const {
    name,
    email,
    password,
    passwordConfirm,
    passwordChangedAt,
    role,
  } = request.body;
  const newUser = await User.create({
    name,
    email,
    password,
    passwordConfirm,
    passwordChangedAt,
    role,
  });
  const resetUrl = `${request.protocol}://${request.get('host')}/me`;
  await new Email(newUser, resetUrl).sendWelcome();
  createSendToken(newUser, 201, response);
});

exports.login = catchAsync(async (request, response, next) => {
  const { email, password } = request.body;
  //check if email and password are present.
  if (!email || !password) {
    return next(
      new AppError('Please provide valid email and password combination'),
      400
    );
  }
  //Check if user with given email is present in the DB or not
  const user = await User.findOne({ email }).select('+password');
  // + is used because in user model for password select is false.
  //To select a field for which select is false we have to use +
  if (!user) {
    return next(new AppError('No user exist for this email', 401));
  }

  const isPasswordMatched = await user.comparePasswords(
    password,
    user.password
  );
  if (!isPasswordMatched) {
    // if password sent by user and password stored in db dosen't matched
    //comparePasswords is instance method in userModel. available to call on every document of users.
    return next(new AppError('Incorrect email or password', 401));
  }
  createSendToken(user, 200, response);
  next();
});

exports.logout = (request, response) => {
  response.cookie('jwt', 'loggedout', {
    // instead of sending token we are sending random text
    // created cookie with same name of original cookie which will override original cookie
    httpOnly: true,
    expires: new Date(Date.now() + 10 * 1000),
  });
  response.status(200).json({
    status: 'success',
  });
};

exports.protect = catchAsync(async (request, response, next) => {
  let token;
  if (
    request.headers.authorization &&
    request.headers.authorization.startsWith('Bearer')
  ) {
    token = request.headers.authorization.split(' ')[1];
  } else if (request.cookies.jwt) {
    // if no token in authorization header, we'll check in cookies
    token = request.cookies.jwt;
  }
  if (!token) {
    return next(new AppError('You are not Logged in or Invalid JWT!', 401));
  }
  const decodedJWT = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  const currentUser = await User.findById(decodedJWT.id);
  if (!currentUser) {
    return next(new AppError(`JWT dosen't exist for this User`, 401));
  }
  if (currentUser.isPasswordChanged(decodedJWT.iat)) {
    // calling instance function in userModel.
    //if we get true means user have changed the password after JWT is assigned to him.
    return next(
      new AppError(
        'Password is changed recently. Please login again with valid token!'
      )
    );
  }
  request.user = currentUser; // storing current user document in request.user. we will use in restrictTo function
  response.locals.user = currentUser; // to use current user in all templates
  next();
});

exports.isUserLoggedIn = async (request, response, next) => {
  try {
    if (request.cookies.jwt) {
      const decodedJWT = await promisify(jwt.verify)(
        // verify JWT token
        request.cookies.jwt,
        process.env.JWT_SECRET
      );
      const currentUser = await User.findById(decodedJWT.id);

      if (!currentUser) {
        return next();
      }

      if (currentUser.isPasswordChanged(decodedJWT.iat)) {
        return next();
      }

      response.locals.user = currentUser;
      // every pug template have access to response.locals. We can check wheter user is present there or not
      return next();
    }
  } catch (error) {
    return next();
  }
  next();
};

exports.restrictTo = (...roles) => {
  //an array of passed roles as argument from tourRoutes will be created.
  // we have to pass arguments. we use restrictTo wrapper function which will return a middleware
  return (request, response, next) => {
    if (!roles.includes(request.user.role)) {
      return next(
        new AppError(`You don't have permissions to perform deletion!!`)
      );
    }
    next();
  };
};

exports.forgetPassword = async (request, response, next) => {
  const user = await User.findOne({ email: request.body.email });
  if (!user) {
    return next(
      new AppError(`User dosen't exist with ${request.body.email}`, 404)
    );
  }
  const resetToken = user.createPasswordResetToken(); //calling instance method on user document.
  await user.save({ validateBeforeSave: false }); // in instance methos we have saved data to passwordResetExpires and passwordResetToken

  //sending email tp user for password reset
  try {
    // this link will be sent to user to reset his password.
    const resetPasswordURL = `${request.protocol}://${request.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;
    await new Email(user, resetPasswordURL).sendPasswordReset();

    response.status(200).json({
      status: 'success',
      message: 'Password reset link sent.',
    });
  } catch (error) {
    //if email sent is failed we have to set these fields undefined.so that can be removed from the db for the current user.
    user.createPasswordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false }); //saving data for user in db. above we have set two fields as undefined.
    return next(
      new AppError('There as an error sending password reset link to user', 500)
    );
  }
};

exports.resetPassword = catchAsync(async (request, response, next) => {
  const hashedToken = crypto
    .createHash('sha256')
    .update(request.params.token)
    .digest('hex');

  const user = await User.findOne({
    //finding user by token and checking if token expires or not
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError('Invalid or Token expires!', 400));
  }

  user.password = request.body.password;
  user.passwordConfirm = request.body.passwordConfirm;
  user.passwordResetToken = undefined; //after reseting password no need of these 2 fields in db.
  user.passwordResetExpires = undefined;
  await user.save();

  //Updating changePasswordAt property of current user document. Done in userModel as a middleware.

  //After resetting password logging user in again by sending a JWT to user.
  createSendToken(user, 200, response);
});

exports.updatePassword = catchAsync(async (request, response, next) => {
  const user = await User.findById(request.user.id).select('+password');
  const isPasswordMatched = await user.comparePasswords(
    //comparePasswords is instance method in userModel. available to call on every document os users.
    request.body.currentPassword, //password sent by the user
    user.password
  );
  if (!isPasswordMatched) {
    // if password sent by user and password stored in db dosen't matched
    return next(new AppError('Please enter correct password', 401));
  }

  if (!user) {
    return next(new AppError('Incorrect password!', 400));
  }

  user.password = request.body.password;
  user.passwordConfirm = request.body.passwordConfirm;
  await user.save();
  createSendToken(user, 200, response);
});
