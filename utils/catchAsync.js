const catchAsync = (fn) => {
  return (request, response, next) => {
    fn(request, response, next).catch(next);
    // catch will automatically pass error as argument to next. so, global error middleware will called to send errors to the user
  };
};

module.exports = catchAsync;
