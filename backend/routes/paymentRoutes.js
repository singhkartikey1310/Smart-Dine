const express = require('express');
const router = express.Router();
const {
  createPaymentOrder, verifyPayment, getPaymentHistory, getInvoice,
} = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/create-order', createPaymentOrder);
router.post('/verify', verifyPayment);
router.get('/history', getPaymentHistory);
router.get('/invoice/:orderId', getInvoice);

module.exports = router;
