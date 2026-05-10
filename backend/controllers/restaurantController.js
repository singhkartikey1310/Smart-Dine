const Restaurant = require('../models/Restaurant');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const APIFeatures = require('../utils/apiFeatures');
const { deleteImage } = require('../config/cloudinary');

// @desc    Create restaurant
// @route   POST /api/restaurants
// @access  Private (restaurant_admin)
exports.createRestaurant = async (req, res, next) => {
  // Check if user already has a restaurant
  const existing = await Restaurant.findOne({ owner: req.user.id });
  if (existing && req.user.role !== 'super_admin') {
    return next(new ErrorResponse('You already have a restaurant', 400));
  }

  const restaurantData = { ...req.body, owner: req.user.id };

  if (req.files) {
    if (req.files.logo) {
      restaurantData.logo = { public_id: req.files.logo[0].filename, url: req.files.logo[0].path };
    }
    if (req.files.banner) {
      restaurantData.banner = { public_id: req.files.banner[0].filename, url: req.files.banner[0].path };
    }
  }

  const restaurant = await Restaurant.create(restaurantData);

  res.status(201).json({ success: true, message: 'Restaurant created successfully', restaurant });
};

// @desc    Get all restaurants
// @route   GET /api/restaurants
// @access  Public
exports.getRestaurants = async (req, res, next) => {
  const features = new APIFeatures(
    Restaurant.find({ isActive: true, isApproved: true }),
    req.query
  )
    .search(['name', 'description', 'cuisines'])
    .filter()
    .sort()
    .paginate(12);

  const [restaurants, total] = await Promise.all([
    features.query.populate('owner', 'name email'),
    Restaurant.countDocuments({ isActive: true, isApproved: true }),
  ]);

  res.status(200).json({
    success: true,
    total,
    page: features.page,
    limit: features.limit,
    totalPages: Math.ceil(total / features.limit),
    restaurants,
  });
};

// @desc    Get single restaurant
// @route   GET /api/restaurants/:id
// @access  Public
exports.getRestaurant = async (req, res, next) => {
  const restaurant = await Restaurant.findById(req.params.id).populate('owner', 'name email');

  if (!restaurant) {
    return next(new ErrorResponse('Restaurant not found', 404));
  }

  res.status(200).json({ success: true, restaurant });
};

// @desc    Get my restaurant
// @route   GET /api/restaurants/my
// @access  Private (restaurant_admin)
exports.getMyRestaurant = async (req, res, next) => {
  const restaurant = await Restaurant.findOne({ owner: req.user.id });

  if (!restaurant) {
    return next(new ErrorResponse('You do not have a restaurant yet', 404));
  }

  res.status(200).json({ success: true, restaurant });
};

// @desc    Update restaurant
// @route   PUT /api/restaurants/:id
// @access  Private
exports.updateRestaurant = async (req, res, next) => {
  let restaurant = await Restaurant.findById(req.params.id);

  if (!restaurant) {
    return next(new ErrorResponse('Restaurant not found', 404));
  }

  // Check ownership
  if (restaurant.owner.toString() !== req.user.id && req.user.role !== 'super_admin') {
    return next(new ErrorResponse('Not authorized to update this restaurant', 403));
  }

  const updates = { ...req.body };

  if (req.files) {
    if (req.files.logo) {
      if (restaurant.logo?.public_id) await deleteImage(restaurant.logo.public_id);
      updates.logo = { public_id: req.files.logo[0].filename, url: req.files.logo[0].path };
    }
    if (req.files.banner) {
      if (restaurant.banner?.public_id) await deleteImage(restaurant.banner.public_id);
      updates.banner = { public_id: req.files.banner[0].filename, url: req.files.banner[0].path };
    }
  }

  restaurant = await Restaurant.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({ success: true, message: 'Restaurant updated', restaurant });
};

// @desc    Delete restaurant
// @route   DELETE /api/restaurants/:id
// @access  Private (super_admin)
exports.deleteRestaurant = async (req, res, next) => {
  const restaurant = await Restaurant.findById(req.params.id);

  if (!restaurant) {
    return next(new ErrorResponse('Restaurant not found', 404));
  }

  if (restaurant.owner.toString() !== req.user.id && req.user.role !== 'super_admin') {
    return next(new ErrorResponse('Not authorized', 403));
  }

  if (restaurant.logo?.public_id) await deleteImage(restaurant.logo.public_id);
  if (restaurant.banner?.public_id) await deleteImage(restaurant.banner.public_id);

  await restaurant.deleteOne();

  res.status(200).json({ success: true, message: 'Restaurant deleted' });
};

// @desc    Approve/reject restaurant (super_admin)
// @route   PUT /api/restaurants/:id/approve
// @access  Private (super_admin)
exports.approveRestaurant = async (req, res, next) => {
  const restaurant = await Restaurant.findByIdAndUpdate(
    req.params.id,
    { isApproved: req.body.isApproved },
    { new: true }
  );

  if (!restaurant) {
    return next(new ErrorResponse('Restaurant not found', 404));
  }

  res.status(200).json({
    success: true,
    message: `Restaurant ${req.body.isApproved ? 'approved' : 'rejected'}`,
    restaurant,
  });
};

// @desc    Get featured restaurants
// @route   GET /api/restaurants/featured
// @access  Public
exports.getFeaturedRestaurants = async (req, res, next) => {
  const restaurants = await Restaurant.find({
    isActive: true,
    isApproved: true,
    isFeatured: true,
  }).limit(8);

  res.status(200).json({ success: true, restaurants });
};
