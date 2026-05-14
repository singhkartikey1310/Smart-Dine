const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  register,
  verifyOTP,
  resendOTP,
  sendLoginOTP,
  verifyLoginOTP,
  firebasePhoneLogin,
  sendDeleteAccountOTP,
  deleteAccount,
  login,
  logout,
  getProfile,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  toggleWishlist,
  toggleFavorite,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimiter');
const { uploadAvatar } = require('../config/cloudinary');

const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

const loginValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

// Multer error-handling wrapper — catches multer errors and passes them to Express
const handleAvatarUpload = (req, res, next) => {
  uploadAvatar.single('avatar')(req, res, (err) => {
    if (err) {
      console.error('Multer error:', err.message);
      return res.status(400).json({ success: false, message: err.message });
    }
    console.log('Multer OK — req.file:', req.file ? `${req.file.originalname} (${req.file.size} bytes)` : 'none');
    next();
  });
};

router.post('/register', authLimiter, registerValidation, validate, register);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', authLimiter, resendOTP);
router.post('/send-login-otp', authLimiter, sendLoginOTP);
router.post('/verify-login-otp', verifyLoginOTP);
router.post('/firebase-phone-login', firebasePhoneLogin);
router.post('/login', authLimiter, loginValidation, validate, login);
router.post('/logout', protect, logout);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, handleAvatarUpload, updateProfile);
router.put('/change-password', protect, changePassword);
router.post('/forgot-password', authLimiter, forgotPassword);
router.put('/reset-password/:token', resetPassword);
router.post('/wishlist/:foodId', protect, toggleWishlist);
router.post('/favorites/:restaurantId', protect, toggleFavorite);
router.post('/delete-account/send-otp', protect, sendDeleteAccountOTP);
router.delete('/delete-account', protect, deleteAccount);

module.exports = router;
