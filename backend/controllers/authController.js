const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const sendToken = require('../utils/sendToken');
const sendOTP = require('../utils/sendotp');
const { sendPasswordResetEmail } = require('../utils/sendEmail');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, phone, role } = req.body;

    // Check existing user
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists',
      });
    }

    // Prevent self-assigning super_admin
    const userRole =
      role === 'restaurant_admin'
        ? 'restaurant_admin'
        : 'customer';

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      phone,
      role: userRole,

      otp,
      otpExpiry: Date.now() + 5 * 60 * 1000,

      isVerified: false,
    });

    // Send OTP email
    await sendOTP(email, otp);

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
      email,
    });

  } catch (error) {
    next(error);
  }
};

exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    if (user.otpExpiry < Date.now()) {
      return res.status(400).json({ success: false, message: 'OTP has expired. Please register again.' });
    }

    // Mark verified
    user.isVerified = true;
    user.isEmailVerified = true;
    user.otp = null;
    user.otpExpiry = null;
    await user.save({ validateBeforeSave: false });

    // Use sendToken for consistent token + cookie response
    sendToken(user, 200, res, 'Email verified successfully! Welcome to SmartDine.');

  } catch (error) {
    console.error('verifyOTP error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Send OTP for login (email)
// @route   POST /api/auth/send-login-otp
// @access  Public
exports.sendLoginOTP = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found with this email' });
    }

    if (!user.isVerified) {
      return res.status(400).json({ success: false, message: 'Please verify your email first' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpiry = Date.now() + 5 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    await sendOTP(email, otp);

    res.status(200).json({ success: true, message: 'OTP sent to your email' });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify login OTP (email)
// @route   POST /api/auth/verify-login-otp
// @access  Public
exports.verifyLoginOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.otp !== otp) return res.status(400).json({ success: false, message: 'Invalid OTP' });
    if (user.otpExpiry < Date.now()) return res.status(400).json({ success: false, message: 'OTP has expired' });

    user.otp = null;
    user.otpExpiry = null;
    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false });

    sendToken(user, 200, res, `Welcome back, ${user.name}!`);
  } catch (error) {
    next(error);
  }
};

// @desc    Firebase phone OTP login — verify Firebase token, return app JWT
// @route   POST /api/auth/firebase-phone-login
// @access  Public
exports.firebasePhoneLogin = async (req, res, next) => {
  try {
    const { firebaseToken, phone } = req.body;

    // Verify Firebase token using Firebase Admin SDK
    const admin = require('../config/firebaseAdmin');
    const decoded = await admin.auth().verifyIdToken(firebaseToken);

    const phoneNumber = decoded.phone_number || phone;
    if (!phoneNumber) {
      return res.status(400).json({ success: false, message: 'Phone number not found in token' });
    }

    // Find or create user by phone
    let user = await User.findOne({ phone: phoneNumber.replace('+91', '').replace('+', '') });

    if (!user) {
      // Auto-create account for new phone users
      user = await User.create({
        name: `User${phoneNumber.slice(-4)}`,
        email: `phone_${phoneNumber.replace(/\+/g, '')}@smartdine.temp`,
        password: crypto.randomBytes(16).toString('hex'),
        phone: phoneNumber.replace('+91', '').replace('+', ''),
        role: 'customer',
        isVerified: true,
        isEmailVerified: false,
      });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Account deactivated' });
    }

    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false });

    sendToken(user, 200, res, `Welcome back!`);
  } catch (error) {
    console.error('Firebase phone login error:', error.message);
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ success: false, message: 'Session expired, please try again' });
    }
    next(error);
  }
};

// @desc    Resend OTP
// @route   POST /api/auth/resend-otp
// @access  Public
exports.resendOTP = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'Email already verified' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpiry = Date.now() + 5 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    await sendOTP(email, otp);

    res.status(200).json({ success: true, message: 'OTP resent successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(
      new ErrorResponse('Please provide email and password', 400)
    );
  }

  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    return next(
      new ErrorResponse('Invalid email or password', 401)
    );
  }

  if (!user.isActive) {
    return next(
      new ErrorResponse(
        'Your account has been deactivated. Contact support.',
        401
      )
    );
  }

  // OTP Verification Check
  if (!user.isVerified) {
    return next(
      new ErrorResponse(
        'Please verify OTP before login',
        401
      )
    );
  }

  user.lastLogin = Date.now();

  await user.save({
    validateBeforeSave: false,
  });

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
    const isCloudinaryUrl = req.file.path && req.file.path.startsWith('http');
    updates.avatar = {
      public_id: req.file.filename || '',
      url: isCloudinaryUrl
        ? req.file.path
        : `${process.env.SERVER_URL || 'http://localhost:5000'}/${req.file.path.replace(/\\/g, '/')}`,
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
