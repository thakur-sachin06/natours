const multer = require('multer');
const sharp = require('sharp');
const Tour = require('../models/tourModel'); // importing tour model
const AppError = require('../utils/appError');
const factoryHandler = require('./handlerFactory');
const catchAsync = require('../utils/catchAsync');

// const tours = JSON.parse(   // reading from file but we will do now from Database.
//   //parsing JSON object to JS object.
//   fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
// );

const multerStorage = multer.memoryStorage();

const multerFilter = (request, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only image', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxcount: 3 },
]);

exports.resizeTourImages = catchAsync(async (request, response, next) => {
  if (!request.files.imageCover || !request.files.images) return next();
  const imageCoverFilename = `tour-${
    request.params.id
  }-${Date.now()}-cover.jpeg`;
  // processing cover image
  await sharp(request.files.imageCover[0].buffer) // processing cover image
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${imageCoverFilename}`);

  request.body.imageCover = imageCoverFilename;
  // to update tour we used updateDocument in handleFactory. it will update data from request.body
  //therefore we have added filename to it. This will update the tour document with new image

  //processing images on tour detail page
  request.body.images = [];

  await Promise.all(
    request.files.images.map(async (file, i) => {
      const filename = `tour-${request.params.id}-${Date.now()}-${i + 1}.jpeg`;
      await sharp(file.buffer) // processing cover image
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${filename}`);

      request.body.images.push(filename);
    })
  );
  next();
});

exports.aliasTopTours = (request, response, next) => {
  request.query.limit = '5';
  request.query.sort = 'price,-ratingsAverage';
  request.query.fields = 'name,price,difficulty,summary,ratingsAverage';
  next();
};

exports.tourStats = catchAsync(async (request, response) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 3.5 } },
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { avgPrice: 1 },
    },
    {
      $addFields: { difficultyLevel: '$_id' },
    },
    {
      $project: { _id: 0 },
    },
  ]);
  response.status(200).json({
    status: 'success',
    data: { stats: stats },
  });
});

exports.monthlyPlan = catchAsync(async (request, response) => {
  const year = request.params.year * 1;
  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          // because of this now we will have tours of a specific year
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numOfTours: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    {
      $project: { _id: 0 },
    },
    {
      $sort: { numOfTours: 1 },
    },
  ]);
  response.status(200).json({
    status: 'success',
    number: plan.length,
    data: { plan },
  });
});

// exports.getAllTours = catchAsync(async (request, response, next) => {
//   const features = new ApiFeatures(Tour.find(), request.query) // Tour.find() will give a query object which we have passes to class.
//     .filter()
//     .sort()
//     .pagination()
//     .limitFields();
//   const tours = await features.query;
//   response.status(200).json({
//     status: 'success',
//     // requestTime: request.requestTime,
//     results: tours.length,
//     data: { tours: tours },
//   });
// });
exports.getAllTours = factoryHandler.getAllDocuments(Tour);
exports.getTourById = factoryHandler.getDocumentById(Tour, { path: 'reviews' }); //in path we pass which field we want to populte
exports.updateTour = factoryHandler.updateDocument(Tour, 'tour');
exports.deleteTour = factoryHandler.deleteOne(Tour); // Tour Model is passed.
exports.createTour = factoryHandler.createDocument(Tour);

exports.getTourWithin = catchAsync(async (request, response, next) => {
  const { distance, latlng, unit } = request.params;
  const [lat, lng] = latlng.split(','); // split will return array and we destructure this array.
  const radius = unit === 'miles' ? distance / 3963.2 : distance / 6378.1;
  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitude and longitude in the format: lat, lng',
        400
      )
    );
  }
  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });
  response.status(200).json({
    status: 'success',
    result: tours.length,
    data: {
      tours,
    },
  });
});

exports.getDistances = catchAsync(async (request, response, next) => {
  const { latlng, unit } = request.params;
  const [lat, lng] = latlng.split(','); // split will return array and we destructure this array.
  const multiplier = unit === 'miles' ? 0.000621371 : 0.001;
  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitude and longitude in the format: lat, lng',
        400
      )
    );
  }
  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier,
      },
    },
    {
      $project: {
        // we only want distance and name of tour in response.
        distance: 1,
        name: 1,
      },
    },
  ]);
  response.status(200).json({
    status: 'success',
    data: {
      distances,
    },
  });
});

// exports.getTourById = catchAsync(async (request, response, next) => {
//   const tour = await Tour.findById(request.params.id).populate('reviews');
//   if (!tour) {
//     return next(
//       new AppError(`Tour with id: ${request.params.id} does not exist.`, 404)
//     );
//   }
//   response.status(200).json({
//     status: 'success',
//     data: {
//       tour: tour,
//     },
//   });
// });

// exports.updateTour = catchAsync(async (request, response, next) => {
//   const tour = await Tour.findByIdAndUpdate(request.params.id, request.body, {
//     new: true,
//     runValidators: true,
//   });
//   if (!tour) {
//     return next(
//       new AppError(`Tour with id: ${request.params.id} does not exist.`, 404)
//     );
//   }
//   response.status(200).json({
//     status: 'success',
//     data: {
//       tour: tour,
//     },
//   });
// });

// exports.deleteTour = catchAsync(async (request, response, next) => {
//   const tour = await Tour.findByIdAndDelete(request.params.id);
//   if (!tour) {
//     return next(
//       new AppError(`Tour with id: ${request.params.id} does not exist.`, 404)
//     );
//   }
//   response.status(204).json({
//     status: 'success',
//   });
// });

//instead of above delete handler using generic delete hander from factoryHandler

// exports.createTour = catchAsync(async (request, response, next) => {
//   const newTour = await Tour.create(request.body);
//   //calling create on Tour model. It'll save the tour to DB and return a promise. we have used async await for that
//   response.status(201).json({
//     status: 'success',
//     data: { tours: newTour },
//   });
// });
