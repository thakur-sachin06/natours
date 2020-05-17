const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review can not be empty'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    tour: {
      // parent referencing to Tour
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'A Review must belongs to a tour'],
    },
    user: {
      // parent referencing to User
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'A Review must belongs to a user'],
    },
  },
  {
    // second argument to Schema()
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

//no user can post multiple reviews for a tour. tour and user are tour id and user id from above schema
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function (next) {
  //populate tour and user while getting reviews
  //   this.populate({
  //     path: 'tour', // field name in reviewModel we want to populate
  //     select: 'name',
  //   }).populate({
  //     path: 'user',
  //     select: 'name photo',
  //   });
  //   next();
  // });

  this.populate({
    // above we have populated tours also but don't need them so we remove here
    path: 'user',
    select: 'name photo',
  });
  next();
});

reviewSchema.statics.calAverageRatings = async function (tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        ratingCount: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);
  await Tour.findByIdAndUpdate(tourId, {
    ratingsAverage: stats[0].avgRating,
    ratingsQuantity: stats[0].ratingCount,
  });
};

reviewSchema.post('save', function () {
  //calculate avg rating when new review is added
  this.constructor.calAverageRatings(this.tour);
});

reviewSchema.pre(/^findOneAnd/, async function (next) {
  this.currentReview = await this.findOne();
  next();
});

reviewSchema.post(/^findOneAnd/, async function () {
  await this.currentReview.constructor.calAverageRatings(
    this.currentReview.tour
  );
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
