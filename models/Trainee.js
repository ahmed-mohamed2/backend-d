const mongoose = require('mongoose');

const traineeSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    assignedTrainer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trainer',
      default: null,
    },
    activePlans: [
      {
        plan: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Plan',
        },
        completedSessions: {
          type: Number,
          default: 0,
        },
        totalSessions: {
          type: Number,
          default: 0,
        },
        startDate: {
          type: Date,
          default: Date.now,
        },
        endDate: {
          type: Date,
        },
        status: {
          type: String,
          enum: ['active', 'completed', 'cancelled'],
          default: 'active',
        },
      },
    ],
    previousTrainers: [
      {
        trainer: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Trainer',
        },
        reason: {
          type: String,
        },
        date: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    preferredLanguage: {
      type: String,
      enum: ['en', 'ar'],
      default: 'en',
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

const Trainee = mongoose.model('Trainee', traineeSchema);

module.exports = Trainee;
