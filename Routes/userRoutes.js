const express = require('express');

const Router = express.Router();
const userController = require('../controllers/userControllers');
const authController = require('../controllers/authController');

Router.route('/signup').post(authController.signup);
Router.route('/login').post(authController.login);
Router.route('/logout').get(authController.logout);
Router.route('/forgotPassword').post(authController.forgetPassword);
Router.route('/resetPassword/:token').patch(authController.resetPassword);

/*we call authController.protect because only logged in user can update his password. 
JWT token should also need to be passed while requesting this.*/

Router.use(
  authController.protect
); /*protect is a middleware. and middlewares executed in sequence. 
  therefore all the routes after this are protected and only logged in user can perform the actions. */

Router.route('/updatePassword').patch(authController.updatePassword);

Router.route('/updateMe').patch(
  userController.uploadUserPhoto,
  userController.resizeImage,
  userController.updateMe
);

Router.route('/me').get(userController.getMe, userController.getUserById);

Router.route('/deleteMe').delete(userController.deleteMe);

Router.use(authController.restrictTo('admin'));
// middleware will run before next two. Only admin can perform next two functions.

Router.route('/').get(userController.getAllUsers);

Router.route('/:id')
  .get(userController.getUserById)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = Router;
