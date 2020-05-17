// file to import data from file to DB. This will run only once and indepedent of
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const fs = require('fs');
const Tour = require('../../models/tourModel');
const User = require('../../models/userModel');
const Review = require('../../models/reviewModel');

dotenv.config({ path: './config.env' }); // because of this you can use env variables from config file

const DB = process.env.DATABASE.replace(
  // getting connection string from config.env and replacing PASSWORD placeholder with password in that file only
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then((con) => {});

const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`));
const reviews = JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`));

const importTourData = async () => {
  try {
    await Tour.create(tours); // save tours readed from file in DB
    process.exit();
  } catch (error) {
    console.log(error);
  }
};

// Delete all data from DB

const deleteTourData = async () => {
  try {
    await Tour.deleteMany(); // save tours readed from file in DB
    process.exit();
  } catch (error) {
    console.log(error);
  }
};

const importUserData = async () => {
  try {
    await User.create(users, { validateBeforeSave: false }); // save tours readed from file in DB
    process.exit();
  } catch (error) {
    console.log(error);
  }
};

// Delete all data from DB

const deleteUserData = async () => {
  try {
    await User.deleteMany(); // save tours readed from file in DB
    process.exit();
  } catch (error) {
    console.log(error);
  }
};

const importReviewData = async () => {
  try {
    await Review.create(reviews); // save tours readed from file in DB
    process.exit();
  } catch (error) {
    console.log(error);
  }
};

// Delete all data from DB

const deleteReviewData = async () => {
  try {
    await Review.deleteMany(); // save tours readed from file in DB
    process.exit();
  } catch (error) {
    console.log(error);
  }
};

if (process.argv[2] === '--importTour') {
  importTourData();
} else if (process.argv[2] === '--deleteTour') {
  deleteTourData();
} else if (process.argv[2] === '--importUser') {
  importUserData();
} else if (process.argv[2] === '--deleteUser') {
  deleteUserData();
} else if (process.argv[2] === '--importReview') {
  importReviewData();
} else if (process.argv[2] === '--deleteReview') {
  deleteReviewData();
}

// to delete all data from DB---->> node ./dev-data/data/import-dev-data.js --deleteTour
// to import all data from file to DB--->>> node ./dev-data/data/import-dev-data.js --importTour
