const express = require('express');
const router = express.Router();
const {
  placeOrder, getMyOrders, getOrder, updateOrderStatus,
  cancelOrder, getRestaurantOrders, getAllOrders,
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.post('/', placeOrder);
router.get('/my-orders', getMyOrders);
router.get('/restaurant', authorize('restaurant_admin', 'super_admin'), getRestaurantOrders);
router.get('/all', authorize('super_admin'), getAllOrders);
router.get('/:id', getOrder);
router.put('/:id/status', authorize('restaurant_admin', 'super_admin'), updateOrderStatus);
router.put('/:id/cancel', cancelOrder);

module.exports = router;
