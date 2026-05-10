const express = require('express');
const router = express.Router();
const {
  getDashboardStats, getAllUsers, updateUser, deleteUser,
  getAdminRestaurants, createCoupon, getCoupons, updateCoupon, deleteCoupon, getAnalytics,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('super_admin'));

router.get('/stats', getDashboardStats);
router.get('/analytics', getAnalytics);
router.get('/users', getAllUsers);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.get('/restaurants', getAdminRestaurants);
router.get('/coupons', getCoupons);
router.post('/coupons', createCoupon);
router.put('/coupons/:id', updateCoupon);
router.delete('/coupons/:id', deleteCoupon);

module.exports = router;
