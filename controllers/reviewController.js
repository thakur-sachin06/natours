const Review = require('../models/reviewModel');
const factoryHandler = require('./handlerFactory');

exports.getAllReviews = factoryHandler.getAllDocuments(Review);
exports.deleteReview = factoryHandler.deleteOne(Review);
exports.updateReview = factoryHandler.updateDocument(Review);
exports.getReviewById = factoryHandler.getDocumentById(Review);
exports.setTourAndUserIds = (request, response, next) => {
  // middleware to add ids before creating review. In step 2. called in reviewRoutes before createReview function.
  if (!request.body.tour) request.body.tour = request.params.tourId;
  if (!request.body.user) request.body.user = request.user.id;
  next();
};

exports.createReview = factoryHandler.createDocument(Review);

// exports.getAllReviews = catchAsync(async (request, response, next) => {
//   let filter = {};
//   if (request.params.tourId) filter = { tour: request.params.tourId };

//   const reviews = await Review.find(filter);
//   // if user hit GET /api/v1/tour/1234/reviews filter will have tour id. and we will get reviews for this tour only.
//   // if user hit GET /api/v1/reviews then filter will be empty objevt. Sp we will get all the reviews for all tours
//   response.status(200).json({
//     status: 'success',
//     // requestTime: request.requestTime,
//     results: reviews.length,
//     data: { reviews: reviews },
//   });
// });

// exports.createReview = catchAsync(async (request, response, next) => {
//   // for nested routes
//   if (!request.body.tour) request.body.tour = request.params.tourId;       step 2
//   if (!request.body.user) request.body.user = request.user.id;
//   const newReview = await Review.create(request.body);

//   response.status(201).json({
//     status: 'success',
//     message: 'Review created successfully',
//     data: {
//       review: newReview,
//     },
//   });
// });
