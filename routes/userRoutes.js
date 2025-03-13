const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  getTrainers,
  updateTrainerStatus,
} = require('../controllers/userController');
const {protect} = require('../middleware/authMiddleware');
const {admin} = require('../middleware/roleMiddleware');

// Routes limited to admin users
router.use(protect, admin);

// @route   GET /api/users
router.get('/', getUsers);

// @route   GET /api/users/trainers
router.get('/trainers', getTrainers);

// @route   PUT /api/users/trainers/:id/status
router.put('/trainers/:id/status', updateTrainerStatus);

// @route   GET /api/users/:id
router.get('/:id', getUserById);

// @route   PUT /api/users/:id
router.put('/:id', updateUser);

// @route   DELETE /api/users/:id
router.delete('/:id', deleteUser);

module.exports = router;
