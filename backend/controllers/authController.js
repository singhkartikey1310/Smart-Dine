const crypto = require('crypto');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const sendToken = require('../utils/sendToken');
const { sendWelcomeEmail, sendPasswordResetEmail } = require('../utils/sendEmail');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  const { name, email, password, phone, role } = req.body;

  // Prevent self-assigning super_admin
  const userRole = role === 'restaurant_admin' ? 'restaurant_admin' : 'customer';

  const user = await User.create({ name, email, password, phone, role: userRole });

  try {
    await sendWelcomeEmail(user);
  } catch (err) {
    console.error('Welcome email failed:', err.message);
  }

  sendToken(user, 201, res, 'Registration successful');
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ErrorResponse('Please provide email and password', 400));
  }

  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    return next(new ErrorResponse('Invalid email or password', 401));
  }

  if (!user.isActive) {
    return next(new ErrorResponse('Your account has been deactivated. Contact support.', 401));
  }

  user.lastLogin = Date.now();
  await user.save({ validateBeforeSave: false });

  sendToken(user, 200, res, 'Login successful');
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({ success: true, message: 'Logged out successfully' });
};

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
exports.getProfile = async (req, res, next) => {
  const user = await User.findById(req.user.id)
    .populate('wishlist', 'name image price rating')
    .populate('favoriteRestaurants', 'name logo rating');

  res.status(200).json({ success: true, user });
};

// @desc    Update profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  const allowedFields = ['name', 'phone', 'addresses', 'preferredLanguage'];
  const updates = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  if (req.file) {
    updates.avatar = {
      public_id: req.file.filename,
      url: req.file.path,
    };
  }

  const user = await User.findByIdAndUpdate(req.user.id, updates, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({ success: true, message: 'Profile updated', user });
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user.id).select('+password');

  if (!(await user.comparePassword(currentPassword))) {
    return next(new ErrorResponse('Current password is incorrect', 400));
  }

  user.password = newPassword;
  await user.save();

  sendToken(user, 200, res, 'Password changed successfully');
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new ErrorResponse('No user found with that email', 404));
  }

  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

  try {
    await sendPasswordResetEmail(user, resetUrl);
    res.status(200).json({ success: true, message: 'Password reset email sent' });
  } catch (err) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new ErrorResponse('Email could not be sent', 500));
  }
};

// @desc    Reset password
// @route   PUT /api/auth/reset-password/:token
// @access  Public
exports.resetPassword = async (req, res, next) => {
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return next(new ErrorResponse('Invalid or expired reset token', 400));
  }

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  sendToken(user, 200, res, 'Password reset successful');
};

// @desc    Toggle wishlist
// @route   POST /api/auth/wishlist/:foodId
// @access  Private
exports.toggleWishlist = async (req, res, next) => {
  const user = await User.findById(req.user.id);
  const foodId = req.params.foodId;

  const index = user.wishlist.indexOf(foodId);
  if (index > -1) {
    user.wishlist.splice(index, 1);
  } else {
    user.wishlist.push(foodId);
  }

  await user.save();
  res.status(200).json({
    success: true,
    message: index > -1 ? 'Removed from wishlist' : 'Added to wishlist',
    wishlist: user.wishlist,
  });
};

// @desc    Toggle favorite restaurant
// @route   POST /api/auth/favorites/:restaurantId
// @access  Private
exports.toggleFavorite = async (req, res, next) => {
  const user = await User.findById(req.user.id);
  const restaurantId = req.params.restaurantId;

  const index = user.favoriteRestaurants.indexOf(restaurantId);
  if (index > -1) {
    user.favoriteRestaurants.splice(index, 1);
  } else {
    user.favoriteRestaurants.push(restaurantId);
  }

  await user.save();
  res.status(200).json({
    success: true,
    message: index > -1 ? 'Removed from favorites' : 'Added to favorites',
    favorites: user.favoriteRestaurants,
  });
};
