const Food = require('../models/Food');
const Restaurant = require('../models/Restaurant');
const ErrorResponse = require('../utils/errorResponse');
const APIFeatures = require('../utils/apiFeatures');
const { deleteImage } = require('../config/cloudinary');

// @desc    Create food item
// @route   POST /api/foods
// @access  Private (restaurant_admin)
exports.createFood = async (req, res, next) => {
  const restaurant = await Restaurant.findOne({ owner: req.user.id });

  if (!restaurant && req.user.role !== 'super_admin') {
    return next(new ErrorResponse('You need a restaurant to add food items', 400));
  }

  const foodData = {
    ...req.body,
    restaurant: req.body.restaurantId || restaurant?._id,
  };

  if (req.file) {
    foodData.image = { public_id: req.file.filename, url: req.file.path };
  }

  // Parse arrays if sent as strings
  if (typeof foodData.ingredients === 'string') {
    foodData.ingredients = foodData.ingredients.split(',').map((i) => i.trim());
  }
  if (typeof foodData.tags === 'string') {
    foodData.tags = foodData.tags.split(',').map((t) => t.trim());
  }

  const food = await Food.create(foodData);
  await food.populate('category', 'name');

  res.status(201).json({ success: true, message: 'Food item created', food });
};

// @desc    Get all foods
// @route   GET /api/foods
// @access  Public
exports.getFoods = async (req, res, next) => {
  const baseQuery = { isAvailable: true };

  if (req.query.restaurant) baseQuery.restaurant = req.query.restaurant;
  if (req.query.category) baseQuery.category = req.query.category;
  if (req.query.isVeg) baseQuery.isVeg = req.query.isVeg === 'true';
  if (req.query.isVegan) baseQuery.isVegan = req.query.isVegan === 'true';

  const features = new APIFeatures(Food.find(baseQuery), req.query)
    .search(['name', 'description', 'tags'])
    .sort()
    .paginate(20);

  const [foods, total] = await Promise.all([
    features.query
      .populate('category', 'name')
      .populate('restaurant', 'name logo rating deliveryInfo'),
    Food.countDocuments(baseQuery),
  ]);

  res.status(200).json({
    success: true,
    total,
    page: features.page,
    limit: features.limit,
    totalPages: Math.ceil(total / features.limit),
    foods,
  });
};

// @desc    Get single food
// @route   GET /api/foods/:id
// @access  Public
exports.getFood = async (req, res, next) => {
  const food = await Food.findById(req.params.id)
    .populate('category', 'name')
    .populate('restaurant', 'name logo rating deliveryInfo address');

  if (!food) {
    return next(new ErrorResponse('Food item not found', 404));
  }

  res.status(200).json({ success: true, food });
};

// @desc    Update food item
// @route   PUT /api/foods/:id
// @access  Private (restaurant_admin)
exports.updateFood = async (req, res, next) => {
  let food = await Food.findById(req.params.id).populate('restaurant');

  if (!food) {
    return next(new ErrorResponse('Food item not found', 404));
  }

  // Check ownership
  if (
    food.restaurant.owner.toString() !== req.user.id &&
    req.user.role !== 'super_admin'
  ) {
    return next(new ErrorResponse('Not authorized to update this food item', 403));
  }

  const updates = { ...req.body };

  if (req.file) {
    if (food.image?.public_id) await deleteImage(food.image.public_id);
    updates.image = { public_id: req.file.filename, url: req.file.path };
  }

  if (typeof updates.ingredients === 'string') {
    updates.ingredients = updates.ingredients.split(',').map((i) => i.trim());
  }
  if (typeof updates.tags === 'string') {
    updates.tags = updates.tags.split(',').map((t) => t.trim());
  }

  food = await Food.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  }).populate('category', 'name');

  res.status(200).json({ success: true, message: 'Food item updated', food });
};

// @desc    Delete food item
// @route   DELETE /api/foods/:id
// @access  Private (restaurant_admin)
exports.deleteFood = async (req, res, next) => {
  const food = await Food.findById(req.params.id).populate('restaurant');

  if (!food) {
    return next(new ErrorResponse('Food item not found', 404));
  }

  if (
    food.restaurant.owner.toString() !== req.user.id &&
    req.user.role !== 'super_admin'
  ) {
    return next(new ErrorResponse('Not authorized', 403));
  }

  if (food.image?.public_id) await deleteImage(food.image.public_id);
  await food.deleteOne();

  res.status(200).json({ success: true, message: 'Food item deleted' });
};

// @desc    Get popular foods
// @route   GET /api/foods/popular
// @access  Public
exports.getPopularFoods = async (req, res, next) => {
  const foods = await Food.find({ isAvailable: true, isPopular: true })
    .populate('category', 'name')
    .populate('restaurant', 'name logo')
    .limit(12)
    .sort('-totalOrders');

  res.status(200).json({ success: true, foods });
};

// @desc    Get foods by restaurant
// @route   GET /api/foods/restaurant/:restaurantId
// @access  Public
exports.getFoodsByRestaurant = async (req, res, next) => {
  const foods = await Food.find({
    restaurant: req.params.restaurantId,
    isAvailable: true,
  }).populate('category', 'name').sort('category name');

  // Group by category
  const grouped = foods.reduce((acc, food) => {
    const catName = food.category?.name || 'Other';
    if (!acc[catName]) acc[catName] = [];
    acc[catName].push(food);
    return acc;
  }, {});

  res.status(200).json({ success: true, foods, grouped });
};
