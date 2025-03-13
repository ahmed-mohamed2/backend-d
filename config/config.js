module.exports = {
  // Default session duration in minutes
  DEFAULT_SESSION_DURATION: 50,

  // User roles
  ROLES: {
    ADMIN: 'admin',
    TRAINER: 'trainer',
    TRAINEE: 'trainee',
  },

  // Trainer status
  TRAINER_STATUS: {
    PENDING: 'pending',
    ACTIVE: 'active',
    REJECTED: 'rejected',
  },

  // Booking status
  BOOKING_STATUS: {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
  },

  // Session status
  SESSION_STATUS: {
    SCHEDULED: 'scheduled',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    RESCHEDULED: 'rescheduled',
  },
};
