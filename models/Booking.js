const mongoose = require('mongoose');
const {BOOKING_STATUS} = require('../config/config');

const bookingSchema = mongoose.Schema(
  {
    trainee: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Trainee',
    },
    trainer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trainer',
    },
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Plan',
    },
    preferredStartDate: {
      type: Date,
      required: [true, 'Please provide a preferred start date'],
    },
    preferredTimes: [
      {
        day: {
          type: String,
          enum: [
            'Sunday',
            'Monday',
            'Tuesday',
            'Wednesday',
            'Thursday',
            'Friday',
            'Saturday',
          ],
        },
        time: String,
      },
    ],
    status: {
      type: String,
      enum: Object.values(BOOKING_STATUS),
      default: BOOKING_STATUS.PENDING,
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    notes: {
      type: String,
    },
    trainerChangeRequest: {
      requested: {
        type: Boolean,
        default: false,
      },
      reason: {
        type: String,
      },
      date: {
        type: Date,
      },
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
      },
    },
    sessions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Session',
      },
    ],
  },
  {
    timestamps: true,
  },
);

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
