const asyncHandler = require('express-async-handler');
const Session = require('../models/Session');
const Booking = require('../models/Booking');
const Trainee = require('../models/Trainee');
const Plan = require('../models/Plan');
const {SESSION_STATUS} = require('../config/config');

// @desc    Create sessions for a booking
// @route   POST /api/sessions/bulk
// @access  Private/Admin
const createSessionsBulk = asyncHandler(async (req, res) => {
  const {bookingId, sessions} = req.body;

  if (!bookingId || !sessions || !Array.isArray(sessions)) {
    res.status(400);
    throw new Error('Please provide booking ID and sessions array');
  }

  // Find the booking
  const booking = await Booking.findById(bookingId);

  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }

  // Find the plan for duration
  const plan = await Plan.findById(booking.plan);

  if (!plan) {
    res.status(404);
    throw new Error('Plan not found');
  }

  // Create sessions
  const createdSessions = [];

  for (let i = 0; i < sessions.length; i++) {
    const {scheduledDate, startTime, endTime} = sessions[i];

    const newSession = await Session.create({
      booking: booking._id,
      trainee: booking.trainee,
      trainer: booking.trainer,
      plan: booking.plan,
      scheduledDate: new Date(scheduledDate),
      startTime,
      endTime,
      duration: plan.duration,
      status: SESSION_STATUS.SCHEDULED,
      sessionOrder: i + 1,
    });

    createdSessions.push(newSession);
  }

  // Update booking with session references
  booking.sessions = createdSessions.map(session => session._id);
  await booking.save();

  // Update trainee's activePlans
  const trainee = await Trainee.findById(booking.trainee);

  if (trainee) {
    const existingPlanIndex = trainee.activePlans.findIndex(
      p => p.plan.toString() === booking.plan.toString(),
    );

    if (existingPlanIndex === -1) {
      // Add new plan to trainee's activePlans
      trainee.activePlans.push({
        plan: booking.plan,
        completedSessions: 0,
        totalSessions: plan.numberOfSessions,
        startDate: new Date(),
        status: 'active',
      });
    } else {
      // Update existing plan
      trainee.activePlans[existingPlanIndex].totalSessions +=
        plan.numberOfSessions;
    }

    await trainee.save();
  }

  res.status(201).json(createdSessions);
});

// @desc    Get session by ID
// @route   GET /api/sessions/:id
// @access  Private
const getSessionById = asyncHandler(async (req, res) => {
  const session = await Session.findById(req.params.id)
    .populate({
      path: 'trainer',
      populate: {
        path: 'user',
        select: 'name phone',
      },
    })
    .populate({
      path: 'trainee',
      populate: {
        path: 'user',
        select: 'name phone',
      },
    })
    .populate('plan', 'nameAr nameEn duration')
    .exec();

  if (session) {
    res.json(session);
  } else {
    res.status(404);
    throw new Error('Session not found');
  }
});

// @desc    Update session status
// @route   PUT /api/sessions/:id/status
// @access  Private/Admin
const updateSessionStatus = asyncHandler(async (req, res) => {
  const {status} = req.body;

  if (!Object.values(SESSION_STATUS).includes(status)) {
    res.status(400);
    throw new Error('Invalid status');
  }

  const session = await Session.findById(req.params.id);

  if (!session) {
    res.status(404);
    throw new Error('Session not found');
  }

  session.status = status;

  // Add timestamps if status is changing to in_progress or completed
  if (status === SESSION_STATUS.IN_PROGRESS) {
    session.actualStartTime = new Date();
  } else if (status === SESSION_STATUS.COMPLETED) {
    session.actualEndTime = new Date();

    // Update trainee's completed sessions
    const trainee = await Trainee.findById(session.trainee);
    if (trainee) {
      const planIndex = trainee.activePlans.findIndex(
        p => p.plan.toString() === session.plan.toString(),
      );

      if (planIndex !== -1) {
        trainee.activePlans[planIndex].completedSessions += 1;

        // Check if all sessions are completed
        if (
          trainee.activePlans[planIndex].completedSessions >=
          trainee.activePlans[planIndex].totalSessions
        ) {
          trainee.activePlans[planIndex].status = 'completed';
          trainee.activePlans[planIndex].endDate = new Date();
        }

        await trainee.save();
      }
    }
  }

  const updatedSession = await session.save();
  res.json(updatedSession);
});

// @desc    Delete a session
// @route   DELETE /api/sessions/:id
// @access  Private/Admin
const deleteSession = asyncHandler(async (req, res) => {
  const session = await Session.findById(req.params.id);

  if (!session) {
    res.status(404);
    throw new Error('Session not found');
  }

  // Only allow deleting sessions that haven't started
  if (session.status !== SESSION_STATUS.SCHEDULED) {
    res.status(400);
    throw new Error(
      'Cannot delete a session that has already started or completed',
    );
  }

  // Remove reference from booking
  const booking = await Booking.findById(session.booking);
  if (booking) {
    booking.sessions = booking.sessions.filter(
      s => s.toString() !== session._id.toString(),
    );
    await booking.save();
  }

  await session.deleteOne();
  res.json({message: 'Session removed'});
});

module.exports = {
  createSessionsBulk,
  getSessionById,
  updateSessionStatus,
  deleteSession,
};
