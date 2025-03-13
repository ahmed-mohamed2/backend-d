const {ROLES} = require('../config/config');

// Check if user has admin role
const admin = (req, res, next) => {
  if (req.user && req.user.role === ROLES.ADMIN) {
    next();
  } else {
    res.status(403);
    throw new Error('Not authorized as an admin');
  }
};

// Check if user has trainer role
const trainer = (req, res, next) => {
  if (req.user && req.user.role === ROLES.TRAINER) {
    next();
  } else {
    res.status(403);
    throw new Error('Not authorized as a trainer');
  }
};

// Check if user has trainee role
const trainee = (req, res, next) => {
  if (req.user && req.user.role === ROLES.TRAINEE) {
    next();
  } else {
    res.status(403);
    throw new Error('Not authorized as a trainee');
  }
};

// Check if user is admin or trainer
const adminOrTrainer = (req, res, next) => {
  if (
    req.user &&
    (req.user.role === ROLES.ADMIN || req.user.role === ROLES.TRAINER)
  ) {
    next();
  } else {
    res.status(403);
    throw new Error('Not authorized');
  }
};

module.exports = {admin, trainer, trainee, adminOrTrainer};
