const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const {ROLES} = require('../config/config');

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'],
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true,
      match: [
        /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/,
        'Please add a valid email',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please add a password'],
      minlength: 6,
      select: false,
    },
    phone: {
      type: String,
      required: [true, 'Please add a phone number'],
    },
    gender: {
      type: String,
      enum: ['male', 'female'],
      required: [true, 'Please specify gender'],
    },
    age: {
      type: Number,
      required: [true, 'Please add age'],
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.TRAINEE,
    },
    language: {
      type: String,
      enum: ['en', 'ar'],
      default: 'en',
    },
    avatar: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  },
);

// Encrypt password using bcrypt
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
