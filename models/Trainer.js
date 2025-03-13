const mongoose = require('mongoose');
const {TRAINER_STATUS} = require('../config/config');

const trainerSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    status: {
      type: String,
      enum: Object.values(TRAINER_STATUS),
      default: TRAINER_STATUS.PENDING,
    },
    hasVehicle: {
      type: Boolean,
      default: false,
      required: true,
    },
    vehicleType: {
      type: String,
      required: function () {
        return this.hasVehicle;
      },
    },
    vehicleModel: {
      type: String,
      required: function () {
        return this.hasVehicle;
      },
    },
    vehicleYear: {
      type: Number,
      required: function () {
        return this.hasVehicle;
      },
    },
    assignedTrainees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Trainee',
      },
    ],
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    specializations: [String],
    availability: {
      type: [
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
          slots: [
            {
              startTime: String,
              endTime: String,
              isBooked: {
                type: Boolean,
                default: false,
              },
            },
          ],
        },
      ],
      default: [],
    },
    profileImage: {
      type: String,
      default: '',
    },
    vehicleImage: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  },
);

const Trainer = mongoose.model('Trainer', trainerSchema);

module.exports = Trainer;
