const asyncHandler = require('express-async-handler');
const Trainer = require('../models/Trainer');
const Trainee = require('../models/Trainee');
const Session = require('../models/Session');
const User = require('../models/User');
const {SESSION_STATUS} = require('../config/config');

// @desc    Get trainer profile
// @route   GET /api/trainers/profile
// @access  Private/Trainer
const getTrainerProfile = asyncHandler(async (req, res) => {
  const trainer = await Trainer.findOne({user: req.user._id})
    .populate('user', 'name email phone gender age')
    .populate({
      path: 'assignedTrainees',
      populate: {
        path: 'user',
        select: 'name phone email',
      },
    })
    .exec();

  if (trainer) {
    res.json(trainer);
  } else {
    res.status(404);
    throw new Error('Trainer profile not found');
  }
});

// @desc    Get list of trainees assigned to trainer
// @route   GET /api/trainers/trainees
// @access  Private/Trainer
const getAssignedTrainees = asyncHandler(async (req, res) => {
  const trainer = await Trainer.findOne({user: req.user._id});

  if (!trainer) {
    res.status(404);
    throw new Error('Trainer profile not found');
  }

  const trainees = await Trainee.find({_id: {$in: trainer.assignedTrainees}})
    .populate('user', 'name email phone gender age')
    .populate({
      path: 'activePlans.plan',
      select: 'nameAr nameEn numberOfSessions',
    })
    .exec();

  res.json(trainees);
});

// @desc    Update trainer availability
// @route   PUT /api/trainers/availability
// @access  Private/Trainer
const updateAvailability = asyncHandler(async (req, res) => {
  const {availability} = req.body;

  const trainer = await Trainer.findOne({user: req.user._id});

  if (!trainer) {
    res.status(404);
    throw new Error('Trainer profile not found');
  }

  trainer.availability = availability;
  const updatedTrainer = await trainer.save();

  res.json({
    _id: updatedTrainer._id,
    availability: updatedTrainer.availability,
  });
});

// @desc    Get trainer's upcoming sessions
// @route   GET /api/trainers/sessions
// @access  Private/Trainer
const getTrainerSessions = asyncHandler(async (req, res) => {
  const trainer = await Trainer.findOne({user: req.user._id});

  if (!trainer) {
    res.status(404);
    throw new Error('Trainer profile not found');
  }

  // Get filter parameters
  const {status, date, traineeId} = req.query;

  // Build query
  let filterQuery = {trainer: trainer._id};

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

  if (traineeId) {
    filterQuery.trainee = traineeId;
  }

  const sessions = await Session.find(filterQuery)
    .populate({
      path: 'trainee',
      populate: {
        path: 'user',
        select: 'name phone',
      },
    })
    .populate('plan', 'nameAr nameEn')
    .sort({scheduledDate: 1, startTime: 1})
    .exec();

  res.json(sessions);
});

// @desc    Start a session
// @route   PUT /api/trainers/sessions/:id/start
// @access  Private/Trainer
const startSession = asyncHandler(async (req, res) => {
  const session = await Session.findById(req.params.id);

  if (!session) {
    res.status(404);
    throw new Error('Session not found');
  }

  // Verify that this session belongs to the requesting trainer
  const trainer = await Trainer.findOne({user: req.user._id});

  if (!trainer || session.trainer.toString() !== trainer._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to access this session');
  }

  // Check if session is in the correct state to be started
  if (session.status !== SESSION_STATUS.SCHEDULED) {
    res.status(400);
    throw new Error(`Cannot start a session that is already ${session.status}`);
  }

  // Update session
  session.status = SESSION_STATUS.IN_PROGRESS;
  session.actualStartTime = new Date();
  const updatedSession = await session.save();

  res.json(updatedSession);
});

// @desc    Complete a session
// @route   PUT /api/trainers/sessions/:id/complete
// @access  Private/Trainer
const completeSession = asyncHandler(async (req, res) => {
  const session = await Session.findById(req.params.id);

  if (!session) {
    res.status(404);
    throw new Error('Session not found');
  }

  // Verify that this session belongs to the requesting trainer
  const trainer = await Trainer.findOne({user: req.user._id});

  if (!trainer || session.trainer.toString() !== trainer._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to access this session');
  }

  // Check if session is in the correct state to be completed
  if (session.status !== SESSION_STATUS.IN_PROGRESS) {
    res.status(400);
    throw new Error('Can only complete sessions that are in progress');
  }

  // Update session
  session.status = SESSION_STATUS.COMPLETED;
  session.actualEndTime = new Date();
  session.notes = req.body.notes || session.notes;
  const updatedSession = await session.save();

  // Update trainee's completed sessions count for the associated plan
  const trainee = await Trainee.findById(session.trainee);
  if (trainee) {
    const planIndex = trainee.activePlans.findIndex(
      p => p.plan.toString() === session.plan.toString(),
    );

    if (planIndex !== -1) {
      trainee.activePlans[planIndex].completedSessions += 1;

      // Check if all sessions for this plan are completed
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

  res.json(updatedSession);
});

// @desc    Reschedule a session
// @route   PUT /api/trainers/sessions/:id/reschedule
// @access  Private/Trainer
const rescheduleSession = asyncHandler(async (req, res) => {
  const {scheduledDate, startTime, endTime} = req.body;

  if (!scheduledDate || !startTime || !endTime) {
    res.status(400);
    throw new Error('Please provide all required fields');
  }

  const session = await Session.findById(req.params.id);

  if (!session) {
    res.status(404);
    throw new Error('Session not found');
  }

  // Verify that this session belongs to the requesting trainer
  const trainer = await Trainer.findOne({user: req.user._id});

  if (!trainer || session.trainer.toString() !== trainer._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to access this session');
  }

  // Save previous schedule
  session.previousSchedule = {
    date: session.scheduledDate,
    startTime: session.startTime,
    endTime: session.endTime,
  };

  // Update schedule
  session.scheduledDate = new Date(scheduledDate);
  session.startTime = startTime;
  session.endTime = endTime;
  session.isRescheduled = true;
  session.status = SESSION_STATUS.RESCHEDULED;

  const updatedSession = await session.save();

  res.json(updatedSession);
});

module.exports = {
  getTrainerProfile,
  getAssignedTrainees,
  updateAvailability,
  getTrainerSessions,
  startSession,
  completeSession,
  rescheduleSession,
};
