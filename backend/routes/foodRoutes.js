const express = require('express');
const router = express.Router();
const {
  createFood, getFoods, getFood, updateFood, deleteFood,
  getPopularFoods, getFoodsByRestaurant,
} = require('../controllers/foodController');
const { protect, authorize } = require('../middleware/auth');
const { uploadFood } = require('../config/cloudinary');

router.get('/popular', getPopularFoods);
router.get('/restaurant/:restaurantId', getFoodsByRestaurant);
router.get('/', getFoods);
router.get('/:id', getFood);
router.post('/', protect, authorize('restaurant_admin', 'super_admin'), uploadFood.single('image'), createFood);
router.put('/:id', protect, authorize('restaurant_admin', 'super_admin'), uploadFood.single('image'), updateFood);
router.delete('/:id', protect, authorize('restaurant_admin', 'super_admin'), deleteFood);

module.exports = router;
