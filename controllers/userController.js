const User = require('../models/userModel');
const factory = require('../controllers/handlerFactory');

exports.getAllUsers = factory.getAll(User);
