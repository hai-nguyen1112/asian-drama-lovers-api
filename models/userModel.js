const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required!'],
      maxlength: [15, 'Username cannot be longer than 15 characters!'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required!'],
      unique: [true, 'Someone already registered with this email!'],
      lowercase: true,
      trim: true,
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
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
  },
  {
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id; // This is to not show _id in the response
        delete ret.__v; // THis is to not show __v in the response
      },
    }, // This is to enable adding virtual fields to the resopnse
    toObject: {
      virtuals: true,
      transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id; // This is to not show _id in the response
        delete ret.__v; // THis is to not show __v in the response
      },
    },
  }
);

/* Index middlewares */
/* End of index middlewares */

/* Virtual middlewares */
/* End of virtual middlewares */

/* Document middlewares - The this keyword points to the currently processed document */
// This is the middleware that is used to hash the password before saving it to the database
userSchema.pre('save', async function (next) {
  // If the password field is not modified, we do nothing
  if (!this.isModified('password')) return next();

  // Hash the password with the code of 12
  this.password = await bcrypt.hash(this.password, 12);

  // Get rid of passwordConfirm because we don't need to store it in the database
  this.passwordConfirm = undefined;

  next();
});

// This is an instance method which is available for every document of the User collection
userSchema.methods.comparePassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// This is an instance method which is availabe for every document of the User collection
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp;
  }

  return false;
};
/* End of document middlewares */

/* Query middlewares - The this keyword points to the currently processed query */
// This is the middleware that only select users with active as true
userSchema.pre(/^find/, function (next) {
  // this keyword points to the current query
  this.find({ active: { $ne: false } });
  next();
});
/* End of query middlewares */

/* Aggregation middlewares */
/* End of aggregation middlewares */

const User = mongoose.model('User', userSchema);

module.exports = User;
