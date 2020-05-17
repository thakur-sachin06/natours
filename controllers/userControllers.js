const multer = require('multer');
const sharp = require('sharp');
const AppError = require('../utils/appError');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const factoryHandler = require('./handlerFactory');

exports.getAllUsers = factoryHandler.getAllDocuments(User);
exports.deleteUser = factoryHandler.deleteOne(User); // delete user by admin. Permanantly deleting from DB
exports.updateUser = factoryHandler.updateDocument(User);
exports.getUserById = factoryHandler.getDocumentById(User);

// add image to disk. but we wil store it in buffer. so that we can read image in sharp() efficiently
// const multerStorage = multer.diskStorage({
//   destination: (request, file, cb) => {
//     cb(null, 'public/img/users');
//   },
//   filename: (request, file, cb) => {
//     // request contains the current request with current user
//     const extension = file.mimetype.split('/')[1];
//     cb(null, `user-${request.user.id}-${Date.now()}.${extension}`);
//   },
// });

// instead of adding image to disk adding it to buffer

const multerStorage = multer.memoryStorage();

const multerFilter = (request, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only image', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadUserPhoto = upload.single('photo'); // 'photo' is the field name that contains the image name

const filterBody = (fields, ...allowedFiledsToUpdate) => {
  const newObj = {};
  Object.keys(fields).forEach((el) => {
    if (allowedFiledsToUpdate.includes(el)) {
      newObj[el] = fields[el];
    }
  });
  return newObj;
};

exports.resizeImage = catchAsync(async (request, response, next) => {
  if (!request.file) return next(); // if no file call next middleware
  request.file.filename = `user-${request.user.id}-${Date.now()}.jpeg`;
  await sharp(request.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${request.file.filename}`);

  next();
});

exports.updateMe = catchAsync(async (request, response, next) => {
  // if user try to update password here then create error because this is done in defferent route.
  if (request.body.password || request.body.passwordConfirm) {
    return next(new AppError(`Password can't be updated in this route!!`, 400));
  }
  const filteredBody = filterBody(request.body, 'name', 'email');
  if (request.file) {
    // if user upload his photo requestwill contain file object. and we are also adding photo field to filterBody
    filteredBody.photo = request.file.filename; // adding photo name to photo field so that we can update in DB
  }
  const updatedUser = await User.findByIdAndUpdate(
    request.user.id,
    filteredBody,
    {
      //we use findByIdAndUpdate() not save() to save updated document because here we don't want to run confirmPassword validators
      new: true, // so that updated user document returned.
      runValidators: true,
    }
  );

  response.status(200).json({
    status: 'success',
    data: {
      udatedUser: updatedUser,
    },
    message: 'Details updated',
  });
});

exports.deleteMe = catchAsync(async (request, response, next) => {
  // delete request by user
  await User.findByIdAndUpdate(request.user.id, { active: false });

  response.status(200).json({
    status: 'success',
    message:
      'Your account is not deleted but set to Inactive. You can activate your account at any time.',
  });
});

exports.getMe = catchAsync(async (request, response, next) => {
  request.params.id = request.user.id; // user we get from protect middleware called before this middleware in userRouter
  // in userRoute we call this middleware before calling getDocumentById of factoryMiddleware and we have assign id of user to params
  //so that getDocumentById can use it to find user in DB.
  next();
});
