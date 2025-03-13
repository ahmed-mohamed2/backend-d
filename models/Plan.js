const mongoose = require('mongoose');

const planSchema = mongoose.Schema(
  {
    nameAr: {
      type: String,
      required: [true, 'Please add an Arabic name for the plan'],
      trim: true,
    },
    nameEn: {
      type: String,
      required: [true, 'Please add an English name for the plan'],
      trim: true,
    },
    descriptionAr: {
      type: String,
      required: [true, 'Please add an Arabic description'],
    },
    descriptionEn: {
      type: String,
      required: [true, 'Please add an English description'],
    },
    price: {
      type: Number,
      required: [true, 'Please add a price'],
    },
    numberOfSessions: {
      type: Number,
      required: [true, 'Please add number of sessions'],
    },
    duration: {
      type: Number,
      default: 50, // Default session duration in minutes
      required: [true, 'Please add the session duration in minutes'],
    },
    features: [
      {
        textAr: {
          type: String,
          required: true,
        },
        textEn: {
          type: String,
          required: true,
        },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    image: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'specialist'],
      default: 'beginner',
    },
  },
  {
    timestamps: true,
  },
);

const Plan = mongoose.model('Plan', planSchema);

module.exports = Plan;
