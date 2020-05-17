const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const ApiFeatures = require('../utils/apiFeatures');

exports.getAllDocuments = (Model) =>
  catchAsync(async (request, response, next) => {
    let filter = {}; //this and next line is to allow nested get review for tours. see in reviewController
    if (request.params.tourId) filter = { tour: request.params.tourId };

    const features = new ApiFeatures(Model.find(filter), request.query) // Model.find() will give a query object which we have passes to class.
      .filter()
      .sort()
      .pagination()
      .limitFields();
    const documents = await features.query;
    response.status(200).json({
      status: 'success',
      // requestTime: request.requestTime,
      results: documents.length,
      data: { data: documents },
    });
  });

exports.getDocumentById = (
  Model,
  populateOptions // only from tour we will pass populate options
) =>
  catchAsync(async (request, response, next) => {
    let query = Model.findById(request.params.id);
    if (populateOptions) query = query.populate(populateOptions);
    const document = await query;
    if (!document) {
      return next(
        new AppError(
          `Document with id: ${request.params.id} does not exist.`,
          404
        )
      );
    }
    response.status(200).json({
      status: 'success',
      data: {
        data: document,
      },
    });
  });

exports.deleteOne = (Model) =>
  catchAsync(async (request, response, next) => {
    const document = await Model.findByIdAndDelete(request.params.id);
    if (!document) {
      return next(new AppError(`No document found for this id`, 404));
    }

    response.status(204).json({
      status: 'success',
    });
  });

exports.updateDocument = (Model, resource) =>
  catchAsync(async (request, response, next) => {
    const document = await Model.findByIdAndUpdate(
      request.params.id,
      request.body,
      {
        new: true,
        runValidators: true,
      }
    );
    if (!document) {
      return next(
        new AppError(
          `${resource} with id: ${request.params.id} does not exist.`,
          404
        )
      );
    }
    response.status(200).json({
      status: 'success',
      data: {
        data: document,
      },
    });
  });

exports.createDocument = (Model) =>
  catchAsync(async (request, response, next) => {
    const newDocument = await Model.create(request.body);
    //calling create on Tour model. It'll save the tour to DB and return a promise. we have used async await for that
    response.status(201).json({
      status: 'success',
      data: { data: newDocument },
    });
  });
