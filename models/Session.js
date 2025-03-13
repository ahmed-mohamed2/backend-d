const mongoose = require('mongoose');
const {SESSION_STATUS} = require('../config/config');

const sessionSchema = mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Booking',
    },
    trainee: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Trainee',
    },
    trainer: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Trainer',
    },
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Plan',
    },
    scheduledDate: {
      type: Date,
      required: [true, 'Please add a scheduled date for the session'],
    },
    startTime: {
      type: String,
      required: [true, 'Please add a start time for the session'],
    },
    endTime: {
      type: String,
      required: [true, 'Please add an end time for the session'],
    },
    duration: {
      type: Number,
      default: 50, // in minutes
    },
    status: {
      type: String,
      enum: Object.values(SESSION_STATUS),
      default: SESSION_STATUS.SCHEDULED,
    },
    actualStartTime: {
      type: Date,
    },
    actualEndTime: {
      type: Date,
    },
    notes: {
      type: String,
    },
    feedback: {
      rating: {
        type: Number,
        min: 1,
        max: 5,
      },
      comment: {
        type: String,
      },
      date: {
        type: Date,
      },
    },
    isRescheduled: {
      type: Boolean,
      default: false,
    },
    previousSchedule: {
      date: Date,
      startTime: String,
      endTime: String,
    },
    sessionOrder: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const Session = mongoose.model('Session', sessionSchema);

module.exports = Session;
