const User = require('../models/userModel');
const factory = require('../controllers/handlerFactory');

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
