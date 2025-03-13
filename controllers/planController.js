const asyncHandler = require('express-async-handler');
const Plan = require('../models/Plan');

// @desc    Get all plans
// @route   GET /api/plans
// @access  Public
const getPlans = asyncHandler(async (req, res) => {
  const {active} = req.query;

  let query = {};
  if (active === 'true') {
    query.isActive = true;
  } else if (active === 'false') {
    query.isActive = false;
  }

  const plans = await Plan.find(query).sort('price');
  res.json(plans);
});

// @desc    Get plan by ID
// @route   GET /api/plans/:id
// @access  Public
const getPlanById = asyncHandler(async (req, res) => {
  const plan = await Plan.findById(req.params.id);

  if (plan) {
    res.json(plan);
  } else {
    res.status(404);
    throw new Error('Plan not found');
  }
});

// @desc    Create a plan
// @route   POST /api/plans
// @access  Private/Admin
const createPlan = asyncHandler(async (req, res) => {
  const {
    nameAr,
    nameEn,
    descriptionAr,
    descriptionEn,
    price,
    numberOfSessions,
    duration,
    features,
    category,
    image,
  } = req.body;

  const plan = await Plan.create({
    nameAr,
    nameEn,
    descriptionAr,
    descriptionEn,
    price,
    numberOfSessions,
    duration: duration || 50, // Default to 50 minutes if not provided
    features: features || [],
    category: category || 'beginner',
    image: image || '',
    isActive: true,
  });

  res.status(201).json(plan);
});

// @desc    Update a plan
// @route   PUT /api/plans/:id
// @access  Private/Admin
const updatePlan = asyncHandler(async (req, res) => {
  const plan = await Plan.findById(req.params.id);

  if (plan) {
    plan.nameAr = req.body.nameAr || plan.nameAr;
    plan.nameEn = req.body.nameEn || plan.nameEn;
    plan.descriptionAr = req.body.descriptionAr || plan.descriptionAr;
    plan.descriptionEn = req.body.descriptionEn || plan.descriptionEn;
    plan.price = req.body.price || plan.price;
    plan.numberOfSessions = req.body.numberOfSessions || plan.numberOfSessions;
    plan.duration = req.body.duration || plan.duration;
    plan.features = req.body.features || plan.features;
    plan.category = req.body.category || plan.category;
    plan.image = req.body.image || plan.image;

    if (req.body.isActive !== undefined) {
      plan.isActive = req.body.isActive;
    }

    const updatedPlan = await plan.save();
    res.json(updatedPlan);
  } else {
    res.status(404);
    throw new Error('Plan not found');
  }
});

// @desc    Delete a plan
// @route   DELETE /api/plans/:id
// @access  Private/Admin
const deletePlan = asyncHandler(async (req, res) => {
  const plan = await Plan.findById(req.params.id);

  if (plan) {
    // Instead of actually deleting, just mark as inactive
    plan.isActive = false;
    await plan.save();
    res.json({message: 'Plan deactivated'});
  } else {
    res.status(404);
    throw new Error('Plan not found');
  }
});

module.exports = {
  getPlans,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan,
};
