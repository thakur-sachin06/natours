const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Bookings = require('../models/bookingModel');

exports.getOverview = catchAsync(async (request, response, next) => {
  const tours = await Tour.find();
  response.status(200).render('overview', {
    title: 'All tours',
    tours,
  });
});

exports.getTour = catchAsync(async (request, response, next) => {
  const tour = await Tour.findOne({ slug: request.params.slug }).populate({
    path: 'reviews',
    fields: 'review rating user',
  });
  if (!tour) {
    return next(new AppError('No Tour found with this name', 404));
  }

  response.status(200).render('tour', {
    title: tour.name,
    tour,
  });
});

exports.getLoginForm = catchAsync(async (request, response) => {
  response.status(200).render('login', {
    title: 'Log into your account',
  });
});

exports.getAccount = catchAsync(async (request, response) => {
  response.status(200).render('account', {
    title: 'Your Account',
  });
});

exports.getMyBookings = catchAsync(async (request, response, next) => {
  const bookings = await Bookings.find({ user: request.user.id });
  const bookedTourIds = bookings.map((booking) => booking.tour); // booking.tour has tour id. see bookings model
  const bookedTours = await Tour.find({ _id: { $in: bookedTourIds } });
  response.status(200).render('overview', {
    title: 'My Bookings',
    tours: bookedTours,
  });
});
