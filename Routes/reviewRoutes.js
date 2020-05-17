const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

const Router = express.Router({ mergeParams: true });

Router.use(authController.protect);
//this middleware will run first therefore no one can access next routes without login.

Router.route('/').get(reviewController.getAllReviews).post(
  authController.restrictTo('user'), // only 'user' roles are allowed to create a review.
  reviewController.setTourAndUserIds,
  reviewController.createReview
);

Router.route('/:id')
  .get(reviewController.getReviewById)
  .patch(
    authController.restrictTo('user', 'admin'),
    reviewController.updateReview
  )
  .delete(
    authController.restrictTo('user', 'admin'),
    reviewController.deleteReview
  );

module.exports = Router;
