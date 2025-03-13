const express = require('express');
const router = express.Router();
const {
  createSessionsBulk,
  getSessionById,
  updateSessionStatus,
  deleteSession,
} = require('../controllers/sessionController');
const {protect} = require('../middleware/authMiddleware');
const {admin, adminOrTrainer} = require('../middleware/roleMiddleware');

// All routes are protected
router.use(protect);

// Routes accessible by admin or trainer
router.get('/:id', adminOrTrainer, getSessionById);

// Admin only routes
router.post('/bulk', admin, createSessionsBulk);
router.put('/:id/status', admin, updateSessionStatus);
router.delete('/:id', admin, deleteSession);

module.exports = router;
