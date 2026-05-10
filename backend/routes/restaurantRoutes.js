const express = require('express');
const router = express.Router();
const {
  createRestaurant, getRestaurants, getRestaurant, getMyRestaurant,
  updateRestaurant, deleteRestaurant, approveRestaurant, getFeaturedRestaurants,
} = require('../controllers/restaurantController');
const { protect, authorize } = require('../middleware/auth');
const { uploadRestaurant } = require('../config/cloudinary');
const multer = require('multer');

const upload = uploadRestaurant.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'banner', maxCount: 1 },
]);

router.get('/featured', getFeaturedRestaurants);
router.get('/my', protect, authorize('restaurant_admin', 'super_admin'), getMyRestaurant);
router.get('/', getRestaurants);
router.get('/:id', getRestaurant);
router.post('/', protect, authorize('restaurant_admin', 'super_admin'), upload, createRestaurant);
router.put('/:id', protect, authorize('restaurant_admin', 'super_admin'), upload, updateRestaurant);
router.delete('/:id', protect, authorize('restaurant_admin', 'super_admin'), deleteRestaurant);
router.put('/:id/approve', protect, authorize('super_admin'), approveRestaurant);

module.exports = router;
