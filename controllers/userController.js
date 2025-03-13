const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Trainer = require('../models/Trainer');
const Trainee = require('../models/Trainee');
const {TRAINER_STATUS, ROLES} = require('../config/config');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find({});
  res.json(users);
});

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private/Admin
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  const lang = req.lang || 'en';

  if (user) {
    let additionalInfo = {};

    // Get role-specific information
    if (user.role === ROLES.TRAINER) {
      const trainer = await Trainer.findOne({user: user._id});

      if (trainer) {
        additionalInfo = {
          trainer: {
            _id: trainer._id,
            status: trainer.status,
            hasVehicle: trainer.hasVehicle,
            vehicleType: trainer.vehicleType,
            vehicleModel: trainer.vehicleModel,
            vehicleYear: trainer.vehicleYear,
            rating: trainer.rating,
            totalReviews: trainer.totalReviews,
            assignedTraineesCount: trainer.assignedTrainees.length,
            profileImage: trainer.profileImage || '',
            vehicleImage: trainer.vehicleImage || '',
          },
        };
      }
    } else if (user.role === ROLES.TRAINEE) {
      const trainee = await Trainee.findOne({user: user._id});

      if (trainee) {
        const langCap = lang.charAt(0).toUpperCase() + lang.slice(1);

        // Process active plans to return language-specific data
        const activePlans = trainee.activePlans
          ? trainee.activePlans.map(plan => {
              if (plan.plan && plan.plan.nameEn && plan.plan.nameAr) {
                return {
                  ...plan.toObject(),
                  planName: plan.plan[`name${langCap}`] || '',
                };
              }
              return plan;
            })
          : [];

        additionalInfo = {
          trainee: {
            _id: trainee._id,
            assignedTrainer: trainee.assignedTrainer,
            activePlansCount: trainee.activePlans.length,
            activePlans,
            preferredLanguage: trainee.preferredLanguage,
          },
        };
      }
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      gender: user.gender,
      age: user.age,
      role: user.role,
      language: user.language,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      ...additionalInfo,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  const lang = req.lang || 'en';

  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.phone = req.body.phone || user.phone;
    user.role = req.body.role || user.role;
    user.language = req.body.language || user.language;

    const updatedUser = await user.save();

    // Update role-specific information
    if (user.role === ROLES.TRAINER && req.body.trainer) {
      let trainer = await Trainer.findOne({user: user._id});

      if (!trainer && user.role === ROLES.TRAINER) {
        // Create trainer profile if it doesn't exist
        trainer = await Trainer.create({
          user: user._id,
          status: req.body.trainer.status || TRAINER_STATUS.PENDING,
          hasVehicle: req.body.trainer.hasVehicle || false,
          vehicleType: req.body.trainer.vehicleType || '',
          vehicleModel: req.body.trainer.vehicleModel || '',
          vehicleYear: req.body.trainer.vehicleYear || null,
          profileImage: req.body.trainer.profileImage || '',
          vehicleImage: req.body.trainer.vehicleImage || '',
        });
      } else if (trainer) {
        const {
          status,
          hasVehicle,
          vehicleType,
          vehicleModel,
          vehicleYear,
          profileImage,
          vehicleImage,
        } = req.body.trainer;

        if (status) trainer.status = status;
        if (hasVehicle !== undefined) trainer.hasVehicle = hasVehicle;
        if (vehicleType) trainer.vehicleType = vehicleType;
        if (vehicleModel) trainer.vehicleModel = vehicleModel;
        if (vehicleYear) trainer.vehicleYear = vehicleYear;
        if (profileImage) trainer.profileImage = profileImage;
        if (vehicleImage) trainer.vehicleImage = vehicleImage;

        await trainer.save();
      }
    } else if (user.role === ROLES.TRAINEE && req.body.trainee) {
      let trainee = await Trainee.findOne({user: user._id});

      if (!trainee && user.role === ROLES.TRAINEE) {
        // Create trainee profile if it doesn't exist
        trainee = await Trainee.create({
          user: user._id,
          preferredLanguage: req.body.trainee.preferredLanguage || lang,
        });
      } else if (trainee) {
        const {preferredLanguage, assignedTrainer} = req.body.trainee;

        if (preferredLanguage) trainee.preferredLanguage = preferredLanguage;
        if (assignedTrainer) trainee.assignedTrainer = assignedTrainer;

        await trainee.save();
      }
    }

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      gender: updatedUser.gender,
      age: updatedUser.age,
      role: updatedUser.role,
      language: updatedUser.language,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    // First delete associated profile
    if (user.role === ROLES.TRAINER) {
      await Trainer.deleteOne({user: user._id});
    } else if (user.role === ROLES.TRAINEE) {
      await Trainee.deleteOne({user: user._id});
    }

    // Then delete the user
    await user.deleteOne();
    res.json({message: 'User removed'});
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Get trainers (with filters)
// @route   GET /api/users/trainers
// @access  Private/Admin
const getTrainers = asyncHandler(async (req, res) => {
  const {status} = req.query;
  const lang = req.lang || 'en'; // Get language from middleware

  let filterQuery = {};
  if (status) {
    filterQuery.status = status;
  }

  const trainers = await Trainer.find(filterQuery)
    .populate('user', 'name email phone gender age')
    .exec();

  // Format response based on language preference if needed
  // This is a simple case as trainer data doesn't have language-specific fields
  // But you could add formatting if needed in the future

  res.json(trainers);
});

// @desc    Get all trainees
// @route   GET /api/users/trainees
// @access  Private/Admin
const getAllTrainees = asyncHandler(async (req, res) => {
  const {status} = req.query;
  const lang = req.lang || 'en'; // Get language from middleware
  const langCap = lang.charAt(0).toUpperCase() + lang.slice(1);

  let query = {};

  // Additional filters can be added here similar to trainers

  const trainees = await Trainee.find(query)
    .populate('user', 'name email phone gender age')
    .populate({
      path: 'assignedTrainer',
      populate: {
        path: 'user',
        select: 'name email phone',
      },
    })
    .populate({
      path: 'activePlans.plan',
      select: `name${langCap} description${langCap} numberOfSessions price`,
    })
    .exec();

  // Format response based on language
  const formattedTrainees = trainees.map(trainee => {
    const formattedTrainee = trainee.toObject();

    // Process active plans to return language-specific data
    if (
      formattedTrainee.activePlans &&
      formattedTrainee.activePlans.length > 0
    ) {
      formattedTrainee.activePlans = formattedTrainee.activePlans.map(plan => {
        if (plan.plan) {
          return {
            ...plan,
            planName: plan.plan[`name${langCap}`] || '',
            planDescription: plan.plan[`description${langCap}`] || '',
          };
        }
        return plan;
      });
    }

    return formattedTrainee;
  });

  res.json(formattedTrainees);
});

// @desc    Update trainer status
// @route   PUT /api/users/trainers/:id/status
// @access  Private/Admin
const updateTrainerStatus = asyncHandler(async (req, res) => {
  const {status} = req.body;

  if (!Object.values(TRAINER_STATUS).includes(status)) {
    res.status(400);
    throw new Error('Invalid status');
  }

  const trainer = await Trainer.findById(req.params.id);

  if (trainer) {
    trainer.status = status;
    const updatedTrainer = await trainer.save();

    res.json({
      _id: updatedTrainer._id,
      status: updatedTrainer.status,
    });
  } else {
    res.status(404);
    throw new Error('Trainer not found');
  }
});

module.exports = {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  getTrainers,
  getAllTrainees,
  updateTrainerStatus,
};
