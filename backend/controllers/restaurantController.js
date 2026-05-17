const Restaurant = require('../models/Restaurant');
const Food = require('../models/Food');
const Order = require('../models/Order');
const Review = require('../models/Review');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const APIFeatures = require('../utils/apiFeatures');
const { deleteImage } = require('../config/cloudinary');

// @desc    Create restaurant
// @route   POST /api/restaurants
// @access  Private (restaurant_admin)
exports.createRestaurant = async (req, res, next) => {
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
  if (!restaurant) return next(new ErrorResponse('Restaurant not found', 404));
  res.status(200).json({ success: true, restaurant });
};

// @desc    Get my restaurant
// @route   GET /api/restaurants/my
// @access  Private (restaurant_admin)
exports.getMyRestaurant = async (req, res, next) => {
  const restaurant = await Restaurant.findOne({ owner: req.user.id });
  if (!restaurant) return next(new ErrorResponse('You do not have a restaurant yet', 404));
  res.status(200).json({ success: true, restaurant });
};

// @desc    Update restaurant
// @route   PUT /api/restaurants/:id
// @access  Private
exports.updateRestaurant = async (req, res, next) => {
  let restaurant = await Restaurant.findById(req.params.id);
  if (!restaurant) return next(new ErrorResponse('Restaurant not found', 404));

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

  restaurant = await Restaurant.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
  res.status(200).json({ success: true, message: 'Restaurant updated', restaurant });
};

// @desc    Delete restaurant
// @route   DELETE /api/restaurants/:id
// @access  Private (super_admin)
exports.deleteRestaurant = async (req, res, next) => {
  const restaurant = await Restaurant.findById(req.params.id);
  if (!restaurant) return next(new ErrorResponse('Restaurant not found', 404));

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
  if (!restaurant) return next(new ErrorResponse('Restaurant not found', 404));
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
  const restaurants = await Restaurant.find({ isActive: true, isApproved: true, isFeatured: true }).limit(8);
  res.status(200).json({ success: true, restaurants });
};

// @desc    Get restaurant food analytics (for restaurant owner)
// @route   GET /api/restaurants/my/analytics
// @access  Private (restaurant_admin)
exports.getRestaurantAnalytics = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user.id });
    if (!restaurant) return next(new ErrorResponse('Restaurant not found', 404));

    const restaurantId = restaurant._id;
    const days = parseInt(req.query.days) || 30;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Run all queries in parallel
    const [
      allFoods,
      totalOrders,
      totalRevenue,
      recentOrders,
      ordersByStatus,
      dailyOrders,
      topOrderedFoods,
      highestRatedFoods,
      lowestRatedFoods,
      recentReviews,
      ratingDistribution,
      categoryBreakdown,
    ] = await Promise.all([
      // All foods for this restaurant
      Food.find({ restaurant: restaurantId }).populate('category', 'name').lean(),

      // Total orders count
      Order.countDocuments({ restaurant: restaurantId }),

      // Total revenue
      Order.aggregate([
        { $match: { restaurant: restaurantId, paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),

      // Recent 10 orders
      Order.find({ restaurant: restaurantId })
        .populate('user', 'name')
        .sort('-createdAt')
        .limit(10)
        .lean(),

      // Orders by status
      Order.aggregate([
        { $match: { restaurant: restaurantId } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),

      // Daily orders for chart (last N days)
      Order.aggregate([
        { $match: { restaurant: restaurantId, createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            orders: { $sum: 1 },
            revenue: { $sum: '$total' },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // Top 5 most ordered foods
      Food.find({ restaurant: restaurantId })
        .sort('-totalOrders')
        .limit(5)
        .populate('category', 'name')
        .lean(),

      // Top 5 highest rated foods (min 2 reviews)
      Food.find({ restaurant: restaurantId, 'rating.count': { $gte: 2 } })
        .sort('-rating.average')
        .limit(5)
        .populate('category', 'name')
        .lean(),

      // Bottom 5 lowest rated foods (min 2 reviews)
      Food.find({ restaurant: restaurantId, 'rating.count': { $gte: 2 } })
        .sort('rating.average')
        .limit(5)
        .populate('category', 'name')
        .lean(),

      // Recent 5 reviews
      Review.find({ restaurant: restaurantId })
        .populate('user', 'name')
        .populate('food', 'name image')
        .sort('-createdAt')
        .limit(5)
        .lean(),

      // Rating distribution (1-5 stars)
      Review.aggregate([
        { $match: { restaurant: restaurantId } },
        { $group: { _id: '$rating', count: { $sum: 1 } } },
        { $sort: { _id: -1 } },
      ]),

      // Orders by food category
      Order.aggregate([
        { $match: { restaurant: restaurantId } },
        { $unwind: '$items' },
        {
          $lookup: {
            from: 'foods',
            localField: 'items.food',
            foreignField: '_id',
            as: 'foodData',
          },
        },
        { $unwind: { path: '$foodData', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'categories',
            localField: 'foodData.category',
            foreignField: '_id',
            as: 'categoryData',
          },
        },
        { $unwind: { path: '$categoryData', preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: '$categoryData.name',
            orders: { $sum: '$items.quantity' },
            revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          },
        },
        { $sort: { orders: -1 } },
        { $limit: 8 },
      ]),
    ]);

    // Compute summary stats
    const avgRating = restaurant.rating?.average || 0;
    const totalReviews = restaurant.rating?.count || 0;
    const revenue = totalRevenue[0]?.total || 0;

    // Foods with zero orders (not selling)
    const zeroOrderFoods = allFoods.filter((f) => f.totalOrders === 0);

    // Foods with low stock
    const lowStockFoods = allFoods.filter((f) => f.stock > 0 && f.stock <= 10);

    // Out of stock
    const outOfStockFoods = allFoods.filter((f) => f.stock === 0);

    res.status(200).json({
      success: true,
      analytics: {
        summary: {
          totalFoods: allFoods.length,
          totalOrders,
          totalRevenue: revenue,
          avgRating,
          totalReviews,
          availableFoods: allFoods.filter((f) => f.isAvailable).length,
        },
        charts: {
          dailyOrders,
          ordersByStatus,
          categoryBreakdown,
          ratingDistribution,
        },
        foods: {
          topOrdered: topOrderedFoods,
          highestRated: highestRatedFoods,
          lowestRated: lowestRatedFoods,
          zeroOrders: zeroOrderFoods.slice(0, 5),
          lowStock: lowStockFoods,
          outOfStock: outOfStockFoods,
        },
        recentOrders,
        recentReviews,
      },
    });
  } catch (error) {
    next(error);
  }
};
