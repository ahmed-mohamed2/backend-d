const express = require('express');
const router = express.Router();
const {
  getTraineeProfile,
  getAvailablePlans,
  getTraineeSessions,
  createBooking,
  getTraineeBookings,
  requestTrainerChange,
  provideSessionFeedback,
} = require('../controllers/traineeController');
const {protect} = require('../middleware/authMiddleware');
const {trainee} = require('../middleware/roleMiddleware');

// All routes are protected and require trainee role
router.use(protect, trainee);

// @route   GET /api/trainees/profile
router.get('/profile', getTraineeProfile);

// @route   GET /api/trainees/plans
router.get('/plans', getAvailablePlans);

// @route   GET /api/trainees/sessions
router.get('/sessions', getTraineeSessions);

// @route   POST /api/trainees/sessions/:id/feedback
router.post('/sessions/:id/feedback', provideSessionFeedback);

// @route   POST /api/trainees/bookings
router.post('/bookings', createBooking);

// @route   GET /api/trainees/bookings
router.get('/bookings', getTraineeBookings);

// @route   POST /api/trainees/bookings/:id/change-trainer
router.post('/bookings/:id/change-trainer', requestTrainerChange);

module.exports = router;
