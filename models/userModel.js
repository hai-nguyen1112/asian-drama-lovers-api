const mongoose = require('mongoose');
const validator = require('validator');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required!'],
      maxlength: [15, 'Username cannot be longer than 15 characters!'],
    },
    email: {
      type: String,
      required: [true, 'Email is required!'],
      unique: [true, 'Someone already registered with this email!'],
      lowercase: true,
      validate: [validator.isEmail, 'Invalid email!'],
    },
    password: {
      type: String,
      required: [true, 'Password is required!'],
      minlength: [8, 'Password must be at least 8 characters!'],
      select: false, // This is to not return password to the client
    },
    passwordConfirm: {
      type: String,
      required: [true, 'Please confirm your password!'],
      select: false,
      validate: {
        // This only works on CREATE and SAVE. It does not work on UPDATE.
        validator: function (passwordConfirm) {
          // this keyword points to current user
          return passwordConfirm === this.password;
        },
        message: 'Password confirmation does not match',
      },
    },
    photo: {
      type: String,
      default: 'default.jpg',
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    active: {
      type: Boolean,
      default: true,
      select: false,
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
  },
  {
    toJSON: { virtuals: true }, // This is to enable adding virtual fields to the resopnse
    toObject: { virtuals: true },
  }
);

/* Index middlewares */
/* End of index middlewares */

/* Virtual middlewares */
/* End of virtual middlewares */

/* Document middlewares */
/* End of document middlewares */

/* Query middlewares */
/* End of query middlewares */

/* Aggregation middlewares */
/* End of aggregation middlewares */

const User = mongoose.model('User', userSchema);

module.exports = User;
