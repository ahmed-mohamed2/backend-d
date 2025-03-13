const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Trainer = require('../models/Trainer');
const Trainee = require('../models/Trainee');
const generateToken = require('../utils/generateToken');
const {ROLES} = require('../config/config');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const {name, email, password, phone, gender, age, role, language} = req.body;

  // Check if user already exists
  const userExists = await User.findOne({email});

  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    phone,
    gender,
    age,
    role: role || ROLES.TRAINEE,
    language: language || 'en',
  });

  if (user) {
    // Create trainer or trainee profile based on role
    if (user.role === ROLES.TRAINER) {
      const {hasVehicle, vehicleType, vehicleModel, vehicleYear} = req.body;

      await Trainer.create({
        user: user._id,
        hasVehicle: hasVehicle || false,
        vehicleType: vehicleType || '',
        vehicleModel: vehicleModel || '',
        vehicleYear: vehicleYear || null,
      });
    } else if (user.role === ROLES.TRAINEE) {
      await Trainee.create({
        user: user._id,
        preferredLanguage: language || 'en',
      });
    }

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      gender: user.gender,
      age: user.age,
      role: user.role,
      language: user.language,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const {email, password} = req.body;

  // Check for user email
  const user = await User.findOne({email}).select('+password');

  if (!user) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  // Check if password matches
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  // If user is a trainer, check if they're active
  if (user.role === ROLES.TRAINER) {
    const trainer = await Trainer.findOne({user: user._id});
    if (trainer && trainer.status !== 'active') {
      res.status(403);
      throw new Error(
        `Your trainer account is ${trainer.status}. Please contact the administrator.`,
      );
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
    token: generateToken(user._id),
  });
});

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    let additionalInfo = {};

    // Get role-specific information
    if (user.role === ROLES.TRAINER) {
      const trainer = await Trainer.findOne({user: user._id})
        .populate('assignedTrainees', 'user')
        .exec();

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
            assignedTrainees: trainer.assignedTrainees,
          },
        };
      }
    } else if (user.role === ROLES.TRAINEE) {
      const trainee = await Trainee.findOne({user: user._id})
        .populate({
          path: 'assignedTrainer',
          select: 'user',
          populate: {
            path: 'user',
            select: 'name phone',
          },
        })
        .populate({
          path: 'activePlans.plan',
          select: 'nameAr nameEn numberOfSessions price',
        })
        .exec();

      if (trainee) {
        additionalInfo = {
          trainee: {
            _id: trainee._id,
            assignedTrainer: trainee.assignedTrainer,
            activePlans: trainee.activePlans,
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
      ...additionalInfo,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.phone = req.body.phone || user.phone;
    user.language = req.body.language || user.language;

    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    // Update role-specific information
    if (user.role === ROLES.TRAINER && req.body.trainer) {
      const trainer = await Trainer.findOne({user: user._id});

      if (trainer) {
        const {hasVehicle, vehicleType, vehicleModel, vehicleYear} =
          req.body.trainer;

        if (hasVehicle !== undefined) trainer.hasVehicle = hasVehicle;
        if (vehicleType) trainer.vehicleType = vehicleType;
        if (vehicleModel) trainer.vehicleModel = vehicleModel;
        if (vehicleYear) trainer.vehicleYear = vehicleYear;

        await trainer.save();
      }
    } else if (user.role === ROLES.TRAINEE && req.body.trainee) {
      const trainee = await Trainee.findOne({user: user._id});

      if (trainee) {
        const {preferredLanguage} = req.body.trainee;

        if (preferredLanguage) trainee.preferredLanguage = preferredLanguage;

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
      token: generateToken(updatedUser._id),
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
};
