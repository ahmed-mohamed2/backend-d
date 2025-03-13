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
  uploadProfileImage,
  uploadVehicleImage,
} = require('../controllers/trainerController');
const {protect} = require('../middleware/authMiddleware');
const {trainer} = require('../middleware/roleMiddleware');
const {
  uploadTrainerImage,
  uploadVehicleImageMiddleware,
} = require('../middleware/uploadMiddleware');

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

// Image upload routes
// @route   POST /api/trainers/upload/profile
router.post(
  '/upload/profile',
  uploadTrainerImage.single('image'),
  uploadProfileImage,
);

// @route   POST /api/trainers/upload/vehicle
router.post(
  '/upload/vehicle',
  uploadVehicleImageMiddleware.single('image'),
  uploadVehicleImage,
);

module.exports = router;
