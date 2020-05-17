// In this file we'll have only middlewares which we want to apply on our Routes and Application

// 1-> Requiring Modules
const express = require('express');
const path = require('path');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const xssClean = require('xss-clean');
const cookieParser = require('cookie-parser');
const globalErrorHandler = require('./controllers/errorController');
const AppError = require('./utils/appError');

const tourRouter = require('./Routes/tourRoutes');
const userRouter = require('./Routes/userRoutes');
const reviewsRouter = require('./Routes/reviewRoutes');
const viewRouter = require('./Routes/viewRoutes');
const bookingRouter = require('./Routes/bookingRoutes');

//2-> Global Middlewares
const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public'))); // Express Middleware to access static files in browser.

app.use(helmet()); // set security http header.
const limiter = rateLimit({
  // global middleware for rate limiting
  max: 200, // max requests from a IP in 1 hour
  windowMs: 60 * 60 * 1000, // 1 hour in milli sec
  message: 'Too many request from this IP. Plese try again after some time',
});

app.use('/api', limiter);

if (process.env.NODE_ENV === 'development') {
  //see app file for env variables.
  // only for development environment we will use morgan.
  app.use(morgan('dev'));
}
app.use(express.json({ limit: '10kb' })); // Middleware for parsing data from body. Used for POST request. limiting data in request body to 10kb
app.use(cookieParser()); // this will parse the cookies in all request.

app.use(mongoSanitize()); // data sanitization against NoSql query injection
app.use(xssClean()); //data sanitization against malicious html code by user.
app.use(
  hpp({
    whitelist: [
      // fields for which duplicates are allowed in query string in url
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
); //prevent parameter pollution

//Our Own MIDDLEWARE. Adding date property to our request object.

app.use((request, response, next) => {
  request.requestTime = new Date().toISOString();
  next();
});

app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewsRouter);
app.use('/api/v1/bookings', bookingRouter);

app.all('*', (request, response, next) => {
  next(new AppError(`Can't find ${request.originalUrl} on the server`), 404); // to call error middleware
});

//global error Middleware
app.use(globalErrorHandler);

module.exports = app;
