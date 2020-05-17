const express = require('express');
const tourController = require('../controllers/tourController'); //importing all functions in one object.
const authController = require('../controllers/authController');
const reviewRoute = require('./reviewRoutes');

const Router = express.Router();

Router.route('/')
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createTour
  );

Router.route('/:id')
  .get(tourController.getTourById)
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour
  )
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.uploadTourImages,
    tourController.resizeTourImages,
    tourController.updateTour
  );

Router.route('/top-5-cheap-tours').get(
  tourController.aliasTopTours,
  tourController.getAllTours
);

Router.route('/monthly-plan/:year').get(
  authController.protect,
  authController.restrictTo('admin', 'lead-guide'),
  tourController.monthlyPlan
);

Router.route('/tour-stats').get(tourController.tourStats);

Router.use('/:tourId/reviews', reviewRoute); // to create a review when tourid in url, we are going to reviewRoute

Router.route('/tours-within/:distance/center/:latlng/unit/:unit').get(
  tourController.getTourWithin
);

Router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);

module.exports = Router;
