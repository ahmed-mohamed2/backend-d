const express = require('express');
const router = express.Router();
const {
  getBookings,
  getBookingById,
  confirmBooking,
  cancelBooking,
  processTrainerChangeRequest,
  completeBooking,
} = require('../controllers/bookingController');
const {protect} = require('../middleware/authMiddleware');
const {admin, adminOrTrainer} = require('../middleware/roleMiddleware');

// All routes are protected
router.use(protect);

// Admin only routes
router.get('/', admin, getBookings);
router.put('/:id/confirm', admin, confirmBooking);
router.put('/:id/trainer-change', admin, processTrainerChangeRequest);
router.put('/:id/complete', admin, completeBooking);

// Routes accessible by admin or trainer
router.get('/:id', adminOrTrainer, getBookingById);

// Route accessible by admin, trainer, or the trainee who owns the booking
router.put('/:id/cancel', cancelBooking);

module.exports = router;
