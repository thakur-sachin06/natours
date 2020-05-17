/* eslint-disable prettier/prettier */
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const Tour = require('./models/tourModel');

dotenv.config({ path: './config.env' }); // because of this you can use env variables from config file
const app = require('./app');

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
    useUnifiedTopology: true,
  })
  .then((con) => {
    console.log('connection with mongodb is successfull');
  });

const port = process.env.PORT || 8000; // all env variables are in process.env object.

app.listen(port, () => {});
