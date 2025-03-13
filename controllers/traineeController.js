const asyncHandler = require('express-async-handler');
const Trainee = require('../models/Trainee');
const Trainer = require('../models/Trainer');
const Booking = require('../models/Booking');
const Session = require('../models/Session');
const Plan = require('../models/Plan');
const {BOOKING_STATUS} = require('../config/config');

// @desc    Get trainee profile
// @route   GET /api/trainees/profile
// @access  Private/Trainee
const getTraineeProfile = asyncHandler(async (req, res) => {
  const trainee = await Trainee.findOne({user: req.user._id})
    .populate('user', 'name email phone gender age')
    .populate({
      path: 'assignedTrainer',
      populate: {
        path: 'user',
        select: 'name phone',
      },
    })
    .populate({
      path: 'activePlans.plan',
      select: 'nameAr nameEn numberOfSessions price duration features',
    })
    .exec();

  if (trainee) {
    res.json(trainee);
  } else {
    res.status(404);
    throw new Error('Trainee profile not found');
  }
});

// @desc    Get all available plans
// @route   GET /api/trainees/plans
// @access  Private/Trainee
const getAvailablePlans = asyncHandler(async (req, res) => {
  const plans = await Plan.find({isActive: true}).sort('price');
  res.json(plans);
});

// @desc    Get trainee's upcoming sessions
// @route   GET /api/trainees/sessions
// @access  Private/Trainee
const getTraineeSessions = asyncHandler(async (req, res) => {
  const trainee = await Trainee.findOne({user: req.user._id});

  if (!trainee) {
    res.status(404);
    throw new Error('Trainee profile not found');
  }

  // Get filter parameters
  const {status, date} = req.query;

  // Build query
  let filterQuery = {trainee: trainee._id};

  if (status) {
    filterQuery.status = status;
  }

  if (date) {
    const selectedDate = new Date(date);
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);

    filterQuery.scheduledDate = {
      $gte: selectedDate,
      $lt: nextDay,
    };
  }

  const sessions = await Session.find(filterQuery)
    .populate({
      path: 'trainer',
      populate: {
        path: 'user',
        select: 'name phone',
      },
    })
    .populate('plan', 'nameAr nameEn duration')
    .sort({scheduledDate: 1, startTime: 1})
    .exec();

  res.json(sessions);
});

// @desc    Create a booking
// @route   POST /api/trainees/bookings
// @access  Private/Trainee
const createBooking = asyncHandler(async (req, res) => {
  const {planId, preferredStartDate, preferredTimes, notes} = req.body;

  const trainee = await Trainee.findOne({user: req.user._id});

  if (!trainee) {
    res.status(404);
    throw new Error('Trainee profile not found');
  }

  // Verify that the plan exists and is active
  const plan = await Plan.findOne({_id: planId, isActive: true});

  if (!plan) {
    res.status(404);
    throw new Error('Plan not found or is not active');
  }

  // Create booking
  const booking = await Booking.create({
    trainee: trainee._id,
    plan: plan._id,
    preferredStartDate: new Date(preferredStartDate),
    preferredTimes: preferredTimes || [],
    status: BOOKING_STATUS.PENDING,
    totalPrice: plan.price,
    notes: notes || '',
  });

  res.status(201).json(booking);
});

// @desc    Get trainee's bookings
// @route   GET /api/trainees/bookings
// @access  Private/Trainee
const getTraineeBookings = asyncHandler(async (req, res) => {
  const trainee = await Trainee.findOne({user: req.user._id});

  if (!trainee) {
    res.status(404);
    throw new Error('Trainee profile not found');
  }

  const bookings = await Booking.find({trainee: trainee._id})
    .populate('plan', 'nameAr nameEn price numberOfSessions')
    .populate({
      path: 'trainer',
      populate: {
        path: 'user',
        select: 'name phone',
      },
    })
    .sort('-createdAt')
    .exec();

  res.json(bookings);
});

// @desc    Request to change trainer
// @route   POST /api/trainees/bookings/:id/change-trainer
// @access  Private/Trainee
const requestTrainerChange = asyncHandler(async (req, res) => {
  const {reason} = req.body;

  if (!reason) {
    res.status(400);
    throw new Error('Please provide a reason for changing the trainer');
  }

  const trainee = await Trainee.findOne({user: req.user._id});

  if (!trainee) {
    res.status(404);
    throw new Error('Trainee profile not found');
  }

  const booking = await Booking.findOne({
    _id: req.params.id,
    trainee: trainee._id,
  });

  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }

  // Check if the booking is eligible for trainer change
  if (booking.status !== BOOKING_STATUS.CONFIRMED) {
    res.status(400);
    throw new Error('Can only request trainer change for confirmed bookings');
  }

  // Update booking with change request
  booking.trainerChangeRequest = {
    requested: true,
    reason,
    date: new Date(),
    status: 'pending',
  };

  const updatedBooking = await booking.save();

  res.json(updatedBooking);
});

// @desc    Provide session feedback
// @route   POST /api/trainees/sessions/:id/feedback
// @access  Private/Trainee
const provideSessionFeedback = asyncHandler(async (req, res) => {
  const {rating, comment} = req.body;

  if (!rating || rating < 1 || rating > 5) {
    res.status(400);
    throw new Error('Please provide a valid rating (1-5)');
  }

  const trainee = await Trainee.findOne({user: req.user._id});

  if (!trainee) {
    res.status(404);
    throw new Error('Trainee profile not found');
  }

  const session = await Session.findOne({
    _id: req.params.id,
    trainee: trainee._id,
  });

  if (!session) {
    res.status(404);
    throw new Error('Session not found');
  }

  // Update session with feedback
  session.feedback = {
    rating,
    comment: comment || '',
    date: new Date(),
  };

  const updatedSession = await session.save();

  // Update trainer's overall rating
  const trainer = await Trainer.findById(session.trainer);
  if (trainer) {
    const totalRating = trainer.rating * trainer.totalReviews;
    trainer.totalReviews += 1;
    trainer.rating = (totalRating + rating) / trainer.totalReviews;
    await trainer.save();
  }

  res.json(updatedSession);
});

module.exports = {
  getTraineeProfile,
  getAvailablePlans,
  getTraineeSessions,
  createBooking,
  getTraineeBookings,
  requestTrainerChange,
  provideSessionFeedback,
};
