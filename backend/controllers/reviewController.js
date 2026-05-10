const Review = require('../models/Review');
const Order = require('../models/Order');
const ErrorResponse = require('../utils/errorResponse');
const APIFeatures = require('../utils/apiFeatures');

// @desc    Create review
// @route   POST /api/reviews
// @access  Private
exports.createReview = async (req, res, next) => {
  const { restaurantId, foodId, orderId, rating, title, comment } = req.body;

  // Verify order belongs to user
  if (orderId) {
    const order = await Order.findById(orderId);
    if (!order || order.user.toString() !== req.user.id) {
      return next(new ErrorResponse('Invalid order', 400));
    }
    if (order.status !== 'delivered') {
      return next(new ErrorResponse('You can only review delivered orders', 400));
    }
  }

  const reviewData = {
    user: req.user.id,
    rating,
    title,
    comment,
    isVerifiedPurchase: !!orderId,
    order: orderId,
  };

  if (restaurantId) reviewData.restaurant = restaurantId;
  if (foodId) reviewData.food = foodId;

  if (req.files && req.files.length > 0) {
    reviewData.images = req.files.map((f) => ({ public_id: f.filename, url: f.path }));
  }

  const review = await Review.create(reviewData);
  await review.populate('user', 'name avatar');

  res.status(201).json({ success: true, message: 'Review submitted', review });
};

// @desc    Get reviews for restaurant/food
// @route   GET /api/reviews
// @access  Public
exports.getReviews = async (req, res, next) => {
  const query = {};
  if (req.query.restaurant) query.restaurant = req.query.restaurant;
  if (req.query.food) query.food = req.query.food;
  if (req.query.rating) query.rating = parseInt(req.query.rating);

  const features = new APIFeatures(Review.find({ ...query, isApproved: true }), req.query)
    .sort()
    .paginate(10);

  const [reviews, total] = await Promise.all([
    features.query.populate('user', 'name avatar'),
    Review.countDocuments({ ...query, isApproved: true }),
  ]);

  // Rating breakdown
  const breakdown = await Review.aggregate([
    { $match: query },
    { $group: { _id: '$rating', count: { $sum: 1 } } },
    { $sort: { _id: -1 } },
  ]);

  res.status(200).json({
    success: true,
    total,
    page: features.page,
    totalPages: Math.ceil(total / features.limit),
    reviews,
    breakdown,
  });
};

// @desc    Update review
// @route   PUT /api/reviews/:id
// @access  Private
exports.updateReview = async (req, res, next) => {
  let review = await Review.findById(req.params.id);

  if (!review) return next(new ErrorResponse('Review not found', 404));
  if (review.user.toString() !== req.user.id) return next(new ErrorResponse('Not authorized', 403));

  review = await Review.findByIdAndUpdate(
    req.params.id,
    { rating: req.body.rating, title: req.body.title, comment: req.body.comment },
    { new: true, runValidators: true }
  ).populate('user', 'name avatar');

  res.status(200).json({ success: true, message: 'Review updated', review });
};

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Private
exports.deleteReview = async (req, res, next) => {
  const review = await Review.findById(req.params.id);

  if (!review) return next(new ErrorResponse('Review not found', 404));
  if (review.user.toString() !== req.user.id && req.user.role !== 'super_admin') {
    return next(new ErrorResponse('Not authorized', 403));
  }

  await review.deleteOne();
  res.status(200).json({ success: true, message: 'Review deleted' });
};

// @desc    Reply to review (restaurant admin)
// @route   POST /api/reviews/:id/reply
// @access  Private (restaurant_admin)
exports.replyToReview = async (req, res, next) => {
  const review = await Review.findByIdAndUpdate(
    req.params.id,
    {
      reply: {
        text: req.body.text,
        repliedAt: Date.now(),
        repliedBy: req.user.id,
      },
    },
    { new: true }
  ).populate('user', 'name avatar');

  if (!review) return next(new ErrorResponse('Review not found', 404));

  res.status(200).json({ success: true, message: 'Reply added', review });
};
