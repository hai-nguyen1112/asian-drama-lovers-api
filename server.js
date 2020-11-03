const mongoose = require('mongoose');
const dotenv = require('dotenv');

const app = require('./app');

// This is to handle uncaught expection errors. We must place it on top of the server file.
process.on('uncaughtException', (err) => {
  console.log(err);
  console.log('Uncaught Exception!. Shutting down...');
  // This is to terminate the server
  process.exit(1);
});

// 1) Allow NodeJS to run the config.env file
dotenv.config({ path: './config.env' });

// 2) Connect the database hosted on the cluster on Mongo Atlas to our Express application
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  })
  .then(() => {
    console.log(`Successfully connected to DB in ${process.env.NODE_ENV}`);
  });

// 3) Run the server
const port = process.env.PORT || 5000;
const server = app.listen(port, () => {
  console.log(`App is running on port ${port} in ${process.env.NODE_ENV}`);
});

// This is to handle unhandled rejection errors. We must close the server and shut the app.
process.on('unhandledRejection', (err) => {
  console.log(err);
  console.log('Unhandled Rejection!. Shutting down...');
  server.close(() => {
    // code 1 stands for unhandled rejection
    process.exit(1);
  });
});

process.on('SIGTERM', () => {
  console.log('SIGTERM RECEIVED. Shutting down gracefully.');
  server.close(() => {
    console.log('Process terminated!');
  });
});
