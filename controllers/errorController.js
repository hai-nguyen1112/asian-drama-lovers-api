const AppError = require('../utils/AppError');

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    error.message = err.message;

    // Handle invalid database IDs
    if (err.stack && err.stack.startsWith('CastError')) {
      error = handleCastErrorDB(err);
    }

    // Handle validation errors
    if (
      (err._message && err._message.includes('validation')) ||
      (err._message && err._message.includes('Validation'))
    ) {
      error = handleValidationErrorDB(err);
    }

    // Handle duplicated fields
    if (err.code === 11000) {
      error = handleDuplicateFieldsDB(err);
    }

    sendErrorProd(error, req, res);
  }
};

const sendErrorDev = (err, req, res) => {
  // First, we need to check if it is an API error or not
  // If it is an API error, we return a detailed response
  if (req.originalUrl.startsWith('/api')) {
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }

  // If it is a rendered website error (in case we use View for server-side rendering), we render the error page in the View folder
  // res.status(err.statusCode).render('error', {
  //   title: 'Something went wrong! Please try again later.',
  //   msg: err.message,
  // });
};

const sendErrorProd = (err, req, res) => {
  // Check if the error is an api error
  if (req.originalUrl.startsWith('/api')) {
    // Check if the error is an operational error
    if (err.isOperational) {
      // Send a nice error message to the client
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }
    // If the error is not an operational error
    // 1) Log the error
    console.log('ERROR: ', err);
    // 2) Send a generic message to the client
    return res.status(500).json({
      status: 'error',
      message: 'Something went wrong! Please try again later.',
    });
  }

  // If the error is NOT an api error
  // Check if the error is an operational error
  // if (err.isOperational) {
  // If the error is operational, render the error page in View folder
  //   return res.status(err.statusCode).render('error', {
  //     title: 'Something went wrong!',
  //     msg: err.message,
  //   });
  // }

  // If the error is not operational, render the error page with a generic message
  // console.log('ERROR: ', err);
  // return res.status(500).render('error', {
  //   title: 'Something went wrong!',
  //   msg: 'Please try again later',
  // });
};

const handleCastErrorDB = (err) => {
  return new AppError(`Invalid ${err.path}: ${err.value}`, 404);
};

const handleValidationErrorDB = (err) => {
  const errMessages = Object.values(err.errors)
    .map((error) => error.message)
    .join(' ');
  return new AppError(`Invalid input data. ${errMessages}`, 400);
};

const handleDuplicateFieldsDB = (err) => {
  if (Object.keys(err.keyValue)[0] === 'email') {
    return new AppError(
      'This email aleady exists in the database. If you forgot your password, please reset password!',
      400
    );
  }
  return new AppError(
    `Duplicate field value: [${Object.keys(err.keyValue)[0]}: ${
      Object.values(err.keyValue)[0]
    }]`,
    400
  );
};
