const express = require('express');
const router = express.Router();
const {
  getPlans,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan,
} = require('../controllers/planController');
const {protect} = require('../middleware/authMiddleware');
const {admin} = require('../middleware/roleMiddleware');

// Public routes
router.get('/', getPlans);
router.get('/:id', getPlanById);

// Admin routes
router.use(protect, admin);
router.post('/', createPlan);
router.put('/:id', updatePlan);
router.delete('/:id', deletePlan);

module.exports = router;
