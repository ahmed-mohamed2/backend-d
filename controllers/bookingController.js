const asyncHandler = require('express-async-handler');
const Booking = require('../models/Booking');
const Trainee = require('../models/Trainee');
const Trainer = require('../models/Trainer');
const Session = require('../models/Session');
const {BOOKING_STATUS} = require('../config/config');

// @desc    Get all bookings
// @route   GET /api/bookings
// @access  Private/Admin
const getBookings = asyncHandler(async (req, res) => {
  const {status} = req.query;

  let query = {};
  if (status) {
    query.status = status;
  }

  const bookings = await Booking.find(query)
    .populate('trainee', 'user')
    .populate({
      path: 'trainer',
      populate: {
        path: 'user',
        select: 'name phone',
      },
    })
    .populate('plan', 'nameAr nameEn price numberOfSessions')
    .sort('-createdAt')
    .exec();

  res.json(bookings);
});

// @desc    Get booking by ID
// @route   GET /api/bookings/:id
// @access  Private
const getBookingById = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate({
      path: 'trainee',
      populate: {
        path: 'user',
        select: 'name email phone gender age',
      },
    })
    .populate({
      path: 'trainer',
      populate: {
        path: 'user',
        select: 'name phone',
      },
    })
    .populate('plan', 'nameAr nameEn price numberOfSessions duration')
    .populate('sessions')
    .exec();

  if (booking) {
    res.json(booking);
  } else {
    res.status(404);
    throw new Error('Booking not found');
  }
});

// @desc    Confirm a booking and assign trainer
// @route   PUT /api/bookings/:id/confirm
// @access  Private/Admin
const confirmBooking = asyncHandler(async (req, res) => {
  const {trainerId} = req.body;

  if (!trainerId) {
    res.status(400);
    throw new Error('Please provide a trainer ID');
  }

  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }

  if (booking.status !== BOOKING_STATUS.PENDING) {
    res.status(400);
    throw new Error(`Booking is already ${booking.status}`);
  }

  // Check if trainer exists and is active
  const trainer = await Trainer.findById(trainerId);

  if (!trainer) {
    res.status(404);
    throw new Error('Trainer not found');
  }

  if (trainer.status !== 'active') {
    res.status(400);
    throw new Error('Selected trainer is not active');
  }

  // Update booking
  booking.trainer = trainerId;
  booking.status = BOOKING_STATUS.CONFIRMED;
  const updatedBooking = await booking.save();

  // Update trainer's assigned trainees
  if (!trainer.assignedTrainees.includes(booking.trainee)) {
    trainer.assignedTrainees.push(booking.trainee);
    await trainer.save();
  }

  // Update trainee's assigned trainer
  const trainee = await Trainee.findById(booking.trainee);
  if (trainee) {
    trainee.assignedTrainer = trainerId;
    await trainee.save();
  }

  res.json(updatedBooking);
});

// @desc    Cancel a booking
// @route   PUT /api/bookings/:id/cancel
// @access  Private
const cancelBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }

  // Can only cancel pending or confirmed bookings
  if (
    ![BOOKING_STATUS.PENDING, BOOKING_STATUS.CONFIRMED].includes(booking.status)
  ) {
    res.status(400);
    throw new Error(`Cannot cancel a booking that is ${booking.status}`);
  }

  // Update booking
  booking.status = BOOKING_STATUS.CANCELLED;
  const updatedBooking = await booking.save();

  // Cancel any associated sessions that are still scheduled
  await Session.updateMany(
    {
      booking: booking._id,
      status: 'scheduled',
    },
    {
      status: 'cancelled',
    },
  );

  res.json(updatedBooking);
});

// @desc    Process trainer change request
// @route   PUT /api/bookings/:id/trainer-change
// @access  Private/Admin
const processTrainerChangeRequest = asyncHandler(async (req, res) => {
  const {status, newTrainerId} = req.body;

  if (!status || !['approved', 'rejected'].includes(status)) {
    res.status(400);
    throw new Error('Please provide a valid status (approved or rejected)');
  }

  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }

  if (!booking.trainerChangeRequest.requested) {
    res.status(400);
    throw new Error('No trainer change request found for this booking');
  }

  // Update the request status
  booking.trainerChangeRequest.status = status;

  if (status === 'approved') {
    if (!newTrainerId) {
      res.status(400);
      throw new Error(
        'Please provide a new trainer ID when approving a change request',
      );
    }

    // Check if new trainer exists and is active
    const newTrainer = await Trainer.findById(newTrainerId);

    if (!newTrainer) {
      res.status(404);
      throw new Error('New trainer not found');
    }

    if (newTrainer.status !== 'active') {
      res.status(400);
      throw new Error('Selected trainer is not active');
    }

    // Get the old trainer
    const oldTrainerId = booking.trainer;

    // Update booking with new trainer
    booking.trainer = newTrainerId;

    // Update trainee's assigned trainer
    const trainee = await Trainee.findById(booking.trainee);
    if (trainee) {
      // Add previous trainer to history
      if (oldTrainerId) {
        trainee.previousTrainers.push({
          trainer: oldTrainerId,
          reason: booking.trainerChangeRequest.reason,
          date: new Date(),
        });
      }

      // Update to new trainer
      trainee.assignedTrainer = newTrainerId;
      await trainee.save();
    }

    // Update old trainer's assigned trainees list
    if (oldTrainerId) {
      const oldTrainer = await Trainer.findById(oldTrainerId);
      if (oldTrainer) {
        oldTrainer.assignedTrainees = oldTrainer.assignedTrainees.filter(
          t => t.toString() !== booking.trainee.toString(),
        );
        await oldTrainer.save();
      }
    }

    // Update new trainer's assigned trainees list
    if (!newTrainer.assignedTrainees.includes(booking.trainee)) {
      newTrainer.assignedTrainees.push(booking.trainee);
      await newTrainer.save();
    }

    // Update sessions with new trainer
    await Session.updateMany(
      {
        booking: booking._id,
        status: {$in: ['scheduled', 'rescheduled']},
      },
      {
        trainer: newTrainerId,
      },
    );
  }

  const updatedBooking = await booking.save();
  res.json(updatedBooking);
});

// @desc    Mark booking as completed
// @route   PUT /api/bookings/:id/complete
// @access  Private/Admin
const completeBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }

  if (booking.status !== BOOKING_STATUS.CONFIRMED) {
    res.status(400);
    throw new Error(`Cannot complete a booking that is ${booking.status}`);
  }

  // Check if all sessions are completed
  const sessions = await Session.find({booking: booking._id});
  const allCompleted = sessions.every(
    session => session.status === 'completed',
  );

  if (!allCompleted) {
    res.status(400);
    throw new Error('Cannot complete booking until all sessions are completed');
  }

  // Update booking
  booking.status = BOOKING_STATUS.COMPLETED;
  const updatedBooking = await booking.save();

  res.json(updatedBooking);
});

module.exports = {
  getBookings,
  getBookingById,
  confirmBooking,
  cancelBooking,
  processTrainerChangeRequest,
  completeBooking,
};
