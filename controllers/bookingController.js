const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.getCheckoutSession = catchAsync(async (request, response, next) => {
  const tour = await Tour.findById(request.params.tourId);
  // creating session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    success_url: `${request.protocol}://${request.get('host')}/?tour=${
      request.params.tourId
    }&user=${request.user.id}&price=${tour.price}`,
    cancel_url: `${request.protocol}://${request.get('host')}/tour/${
      tour.slug
    }`,
    customer_email: request.user.email, // before this protect middleware will run so we'll get user from there
    client_reference_id: request.params.tourId,
    line_items: [
      {
        name: `${tour.name} Tour`,
        description: tour.summary,
        images: [`https://www.natours.dev/img/tours/${tour.imageCover}`], // this will work when our app will deploy
        amount: tour.price * 70, // convert dollars to rupees
        currency: 'inr',
        quantity: 1,
      },
    ],
  });
  response.status(200).json({
    status: 'success',
    session,
  });
  next();
});

exports.createBookingCheckout = catchAsync(async (request, response, next) => {
  //this is temporary. we'll change once app will deploy. after deploy we'll have access to session object.
  // and from which we can use details of user tour and price
  const { tour, user, price } = request.query; // in session above we have success url where we have home url and also query strings
  if (!tour && !user && !price) return next();

  await Booking.create({ tour, user, price });
  response.redirect(`${request.protocol}://${request.get('host')}/`);
  next();
});
