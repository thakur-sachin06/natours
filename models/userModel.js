const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    maxlength: [20, 'Name is required'],
  },
  email: {
    type: String,
    validate: [validator.isEmail, 'Please provide a valid Email id'],
    required: true,
    unique: true,
    lowercase: true, // transform to lower case if user enter in uppercase
  },
  passwordResetToken: String,
  passwordResetExpires: Date,
  photo: {
    type: String,
    default: 'default.jpg',
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false, // with this password will never shown in any response to users
  },
  passwordChangedAt: Date,
  role: {
    type: String,
    enum: ['user', 'admin', 'guide', 'lead-guide'],
    default: 'user',
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    require: true,
    validate: {
      //validators will run only for create and save not for update. When you want to use passwords and validators always
      //use .save() not findByIdAndUpdate() to update a document.
      validator: function (el) {
        // el will be the passwordConfirm field value of current document
        return el === this.password;
      },
      message: 'Password and Confirm Password are not same',
    },
  },
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

//Encrypting users password using bcryptjs.
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined; // No need to save passwordConfirm field in Db. We use this only for validation
});

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) {
    //if password is not modified or a new document is created then we don't have to run this middleware
    return next();
  }
  this.passwordChangedAt = Date.now() - 1000; //saving to db is slow then assigning JWT. we subtract 1sec i.e 1000msec.
  next();
});

userSchema.pre(/^find/, function (next) {
  //query middleware so that before any find query runs this will run and we want to filter all Inactive accounts. We want only active accounts.
  this.find({ active: { $ne: false } }); //in current query object we selecting only active accounts.
  //this points to current query.
  next();
});

userSchema.methods.comparePasswords = async function (
  // instance method. this will be available on every document of a collection. here we define it on useScema therefore available on everu user document
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// instance method so every user document have access to it to check whether user have changed password
//after JWT is assigned to him. it is called in authController.
userSchema.methods.isPasswordChanged = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const passwordChangedAtTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < passwordChangedAtTimestamp;
  }
  return false; //if passwordChangedAt not in document means user never changed his password return false.
};

//instace methos to creater and encrypt token. called in authControoler ForgotPassword
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // adding 10min in millisec.
  return resetToken; // we will return the plain token to user. Encrypted one is saved in DBs
};

const User = mongoose.model('User', userSchema); // mongodb will create Collection with "User" name

module.exports = User;
