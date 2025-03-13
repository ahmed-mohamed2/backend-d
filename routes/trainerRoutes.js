const express = require('express');
const router = express.Router();
const {
  getTrainerProfile,
  getAssignedTrainees,
  updateAvailability,
  getTrainerSessions,
  startSession,
  completeSession,
  rescheduleSession,
} = require('../controllers/trainerController');
const {protect} = require('../middleware/authMiddleware');
const {trainer} = require('../middleware/roleMiddleware');

// All routes are protected and require trainer role
router.use(protect, trainer);

// @route   GET /api/trainers/profile
router.get('/profile', getTrainerProfile);

// @route   GET /api/trainers/trainees
router.get('/trainees', getAssignedTrainees);

// @route   PUT /api/trainers/availability
router.put('/availability', updateAvailability);

// @route   GET /api/trainers/sessions
router.get('/sessions', getTrainerSessions);

// @route   PUT /api/trainers/sessions/:id/start
router.put('/sessions/:id/start', startSession);

// @route   PUT /api/trainers/sessions/:id/complete
router.put('/sessions/:id/complete', completeSession);

// @route   PUT /api/trainers/sessions/:id/reschedule
router.put('/sessions/:id/reschedule', rescheduleSession);

module.exports = router;
