const jwt = require('jsonwebtoken');

const User = require('../models/userModel');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const filterObject = require('../utils/filterObject');

exports.signup = catchAsync(async (req, res, next) => {
  // This is to allow the user sign up with only username, email, password and passwordConfirm
  const filteredBody = filterObject(
    req.body,
    'username',
    'email',
    'password',
    'passwordConfirm'
  );

  const newUser = await User.create(filteredBody);

  if (!newUser) {
    return next(
      new AppError('Something went wrong! Please try again later.', 500)
    );
  }

  createSendToken(newUser, 201, req, res);
});

const createSendToken = (user, statusCode, req, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true, // this makes the cookie not be modified by the browser
  };

  if (process.env.NODE_ENV === 'production') {
    cookieOptions.secure = true; // this makes the cookie sent with encryption https
  }

  // if (req.secure || req.headers('x-forwarded-proto') === 'https')
  //   cookieOptions.secure = true; // this is for heroku only

  // send the cookie back to client
  res.cookie('jwt', token, cookieOptions);

  // remove password from the response
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: user,
  });
};

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};
