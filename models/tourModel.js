const mongoose = require('mongoose');
const slugify = require('slugify');

// Creating Schema
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A Tour must have a Name'],
      unique: true,
      trim: true,
      maxlength: [30, 'A Tour must have name with less than 30 characters'],
      minlength: [3, 'A Tour must have name with less than 3 characters'],
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A Tour must have a Duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A Tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A Tour must have a Difficulty level'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Diffyculty must be either: easy, medium or difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 3.5,
      max: [5, 'A Tour rating must be below 5'],
      min: [1, 'A Tour rating must be above 1'],
      set: (val) => Math.round(val * 10) / 10,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A Tour must have a Price'],
    },
    priceDiscount: {
      type: Number,
      // custom data validator
      validate: {
        validator: function (val) {
          return val < this.price;
        },
        message: 'Discounted Price must be less than actual Price',
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a summary'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    guides: [
      //child referencing for tour Guide and User
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
    locations: [
      // we used [] to create document inside a document.
      //this is document embedded in Tour document.Mongo will create a new locations document.
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
  },
  {
    // second argument to Schema()
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// creating virtual property
tourSchema.virtual('duration-weeks').get(function () {
  return this.duration / 7;
});

tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour', // tour id in reviewModel is in 'tour' field.
  localField: '_id', // tour id in tourModel is in '_id' field in DB. to connect them by id we give these two.
});

tourSchema.index({ price: 1, ratingsAverage: -1 }); // creating index
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });
// Adding Document Middleware

tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// Adding Query Middleware
tourSchema.pre(/^find/, function (next) {
  // this will run before a query starting with 'find' gets executed.
  this.find({ secretTour: { $ne: true } }); // in query middleware 'this' refers to current query.
  next();
});

//query Middleware to populate guides field in result
tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-_v -passwordChangedAt',
  });
  next();
});

// Adding Query Middleware. we comment this because geo near should be the first stage in pipeline added in tourController
// tourSchema.pre('aggregate', function (next) {
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//   next();
// });

// Creating model from above schema
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour; //exporting Tour Model
