const User = require('../models/userModel');
const factory = require('../controllers/handlerFactory');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const filterObject = require('../utils/filterObject');

// getAllUsers middleware accepts three arguments
// 1) The User model
// 2) The populateOptions array. Ex: [{path: 'Reviews', select: 'content}]
// 3) The selectOptions string. Ex: '-__v'
exports.getAllUsers = factory.getAll(User, null, null);

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined! Please use /signup instead',
  });
};

// getUser middleware accepts three arguments
// 1) The User model
// 2) The populateOptions array. Ex: [{path: 'Reviews', select: 'content}]
// 3) The selectOptions string. Ex: '-__v'
exports.getUser = factory.getOne(User, null, null);

// updateUser middleware accepts two arguments
// 1) The User model
// 2) The notAllowedFields array. Ex: ['role', 'active']
// 3) The populateOptions array. Ex: [{path: 'Reviews', select: 'content}]
// 4) The selectOptions string. Ex: '-__v'
exports.updateUser = factory.updateOne(
  User,
  [
    '__v',
    'password',
    'passwordConfirm',
    'role',
    'active',
    'passwordChangedAt',
    'passwordResetToken',
    'passwordResetExpires',
  ],
  null,
  null
);

exports.deleteUser = factory.deleteOne(User);

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Create error if user tries to update password
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /update-my-password!',
        400
      )
    );
  }

  // 2) Filter out fields that are not allowed to update
  const filteredBody = filterObject(req.body, 'username', 'email');
  if (req.file) {
    filteredBody['photo'] = req.file.filename;
  }

  // 3) Update the document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  if (!updatedUser) {
    return next(
      new AppError(
        'Currently you cannot update your user data. Please try again later.',
        404
      )
    );
  }

  res.status(200).json({
    status: 'success',
    data: updatedUser,
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndDelete(req.user.id);

  res.status(204).json({
    status: 'success',
    data: null,
  });
});
