const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const Food = require('../models/Food');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Review = require('../models/Review');
const Coupon = require('../models/Coupon');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get dashboard stats
// @route   GET /api/admin/stats
// @access  Private (super_admin)
exports.getDashboardStats = async (req, res, next) => {
  const [
    totalUsers,
    totalRestaurants,
    totalOrders,
    totalRevenue,
    recentOrders,
    popularFoods,
    ordersByStatus,
    monthlyRevenue,
  ] = await Promise.all([
    User.countDocuments({ role: 'customer' }),
    Restaurant.countDocuments({ isApproved: true }),
    Order.countDocuments(),
    Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),
    Order.find().populate('user', 'name').populate('restaurant', 'name').sort('-createdAt').limit(10),
    Food.find({ isAvailable: true }).sort('-totalOrders').limit(8).populate('restaurant', 'name'),
    Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Order.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 6)) },
          paymentStatus: 'paid',
        },
      },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          revenue: { $sum: '$total' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
  ]);

  res.status(200).json({
    success: true,
    stats: {
      totalUsers,
      totalRestaurants,
      totalOrders,
      totalRevenue: totalRevenue[0]?.total || 0,
      recentOrders,
      popularFoods,
      ordersByStatus,
      monthlyRevenue,
    },
  });
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (super_admin)
exports.getAllUsers = async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const query = {};
  if (req.query.role) query.role = req.query.role;
  if (req.query.keyword) {
    query.$or = [
      { name: { $regex: req.query.keyword, $options: 'i' } },
      { email: { $regex: req.query.keyword, $options: 'i' } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(query).sort('-createdAt').skip(skip).limit(limit),
    User.countDocuments(query),
  ]);

  res.status(200).json({ success: true, total, page, totalPages: Math.ceil(total / limit), users });
};

// @desc    Update user (activate/deactivate, change role)
// @route   PUT /api/admin/users/:id
// @access  Private (super_admin)
exports.updateUser = async (req, res, next) => {
  const allowedUpdates = ['isActive', 'role'];
  const updates = {};
  allowedUpdates.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

  const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true });
  if (!user) return next(new ErrorResponse('User not found', 404));

  res.status(200).json({ success: true, message: 'User updated', user });
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private (super_admin)
exports.deleteUser = async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new ErrorResponse('User not found', 404));
  if (user.role === 'super_admin') return next(new ErrorResponse('Cannot delete super admin', 400));

  await user.deleteOne();
  res.status(200).json({ success: true, message: 'User deleted' });
};

// @desc    Get all restaurants (admin)
// @route   GET /api/admin/restaurants
// @access  Private (super_admin)
exports.getAdminRestaurants = async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const query = {};
  if (req.query.isApproved !== undefined) query.isApproved = req.query.isApproved === 'true';

  const [restaurants, total] = await Promise.all([
    Restaurant.find(query).populate('owner', 'name email').sort('-createdAt').skip(skip).limit(limit),
    Restaurant.countDocuments(query),
  ]);

  res.status(200).json({ success: true, total, page, totalPages: Math.ceil(total / limit), restaurants });
};

// @desc    Create coupon
// @route   POST /api/admin/coupons
// @access  Private (super_admin)
exports.createCoupon = async (req, res, next) => {
  const coupon = await Coupon.create({ ...req.body, createdBy: req.user.id });
  res.status(201).json({ success: true, message: 'Coupon created', coupon });
};

// @desc    Get all coupons
// @route   GET /api/admin/coupons
// @access  Private (super_admin)
exports.getCoupons = async (req, res, next) => {
  const coupons = await Coupon.find().sort('-createdAt');
  res.status(200).json({ success: true, coupons });
};

// @desc    Update coupon
// @route   PUT /api/admin/coupons/:id
// @access  Private (super_admin)
exports.updateCoupon = async (req, res, next) => {
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!coupon) return next(new ErrorResponse('Coupon not found', 404));
  res.status(200).json({ success: true, coupon });
};

// @desc    Delete coupon
// @route   DELETE /api/admin/coupons/:id
// @access  Private (super_admin)
exports.deleteCoupon = async (req, res, next) => {
  const coupon = await Coupon.findByIdAndDelete(req.params.id);
  if (!coupon) return next(new ErrorResponse('Coupon not found', 404));
  res.status(200).json({ success: true, message: 'Coupon deleted' });
};

// @desc    Get sales analytics
// @route   GET /api/admin/analytics
// @access  Private (super_admin)
exports.getAnalytics = async (req, res, next) => {
  const days = parseInt(req.query.days) || 30;
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [dailyRevenue, topRestaurants, topFoods, userGrowth] = await Promise.all([
    Order.aggregate([
      { $match: { createdAt: { $gte: startDate }, paymentStatus: 'paid' } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$total' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Restaurant.find({ isApproved: true }).sort('-totalRevenue').limit(5).select('name totalRevenue totalOrders'),
    Food.find().sort('-totalOrders').limit(10).select('name totalOrders restaurant').populate('restaurant', 'name'),
    User.aggregate([
      { $match: { createdAt: { $gte: startDate }, role: 'customer' } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  res.status(200).json({ success: true, analytics: { dailyRevenue, topRestaurants, topFoods, userGrowth } });
};
