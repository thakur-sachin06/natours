const express = require('express');
const viewsController = require('../controllers/viewsController');
const authController = require('../controllers/authController');
const bookingController = require('../controllers/bookingController');

const router = express.Router();

router.get(
  '/',
  bookingController.createBookingCheckout,
  authController.isUserLoggedIn,
  viewsController.getOverview
);
router.get(
  '/tour/:slug',
  authController.isUserLoggedIn,
  viewsController.getTour
);
// authController.protect because of this now only logged n users can access tours detail page
router.get(
  '/login',
  authController.isUserLoggedIn,
  viewsController.getLoginForm
);
router.get('/me', authController.protect, viewsController.getAccount);
router.get('/my-tours', authController.protect, viewsController.getMyBookings);
module.exports = router;
