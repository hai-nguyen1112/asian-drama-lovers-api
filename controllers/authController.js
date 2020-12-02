const jwt = require('jsonwebtoken');
const { promisify } = require('util');

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

  const userObject = {};
  userObject['id'] = newUser.id;
  userObject['username'] = newUser.username;
  userObject['email'] = newUser.email;
  userObject['role'] = newUser.role;
  userObject['photo'] = newUser.photo;

  createSendToken(userObject, 201, req, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  // 2) Check if user exists and password is correct
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.comparePassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // 3) If everything is good, send token to client
  createSendToken(user, 200, req, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  // 1) Get token and check if it's there
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(new AppError('You are not logged in!', 401));
  }

  // 2) Validate token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) Check if user still exists
  const currentUser = await User.findById(decoded.id);

  if (!currentUser) {
    return next(new AppError('The user of this token no longer exists.', 401));
  }

  // 4) Check if user has changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please log in again.', 401)
    );
  }

  // 5) Grant access to protected route
  req.user = currentUser;
  //res.locals.user = currentUser // This is for server-side rendering

  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles = ['admin', 'user']
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action.', 403)
      );
    }

    next();
  };
};

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
