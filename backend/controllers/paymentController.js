const crypto = require('crypto');
const getRazorpay = require('../config/razorpay');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Notification = require('../models/Notification');
const ErrorResponse = require('../utils/errorResponse');
const generateInvoiceHTML = require('../utils/generateInvoice');

// @desc    Create Razorpay order
// @route   POST /api/payments/create-order
// @access  Private
exports.createPaymentOrder = async (req, res, next) => {
  const { orderId } = req.body;

  const order = await Order.findById(orderId);
  if (!order) return next(new ErrorResponse('Order not found', 404));
  if (order.user.toString() !== req.user.id) return next(new ErrorResponse('Not authorized', 403));

  const options = {
    amount: Math.round(order.total * 100), // in paise
    currency: 'INR',
    receipt: `receipt_${order.orderNumber}`,
    notes: {
      orderId: order._id.toString(),
      userId: req.user.id,
    },
  };

  const razorpayOrder = await getRazorpay().orders.create(options);

  // Save payment record
  const payment = await Payment.create({
    order: order._id,
    user: req.user.id,
    razorpayOrderId: razorpayOrder.id,
    amount: order.total,
    currency: 'INR',
    invoiceNumber: `INV-${order.orderNumber}`,
  });

  order.razorpayOrderId = razorpayOrder.id;
  await order.save();

  res.status(200).json({
    success: true,
    razorpayOrderId: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    keyId: process.env.RAZORPAY_KEY_ID,
    order: {
      id: order._id,
      orderNumber: order.orderNumber,
      total: order.total,
    },
    user: {
      name: req.user.name,
      email: req.user.email,
      phone: req.user.phone,
    },
  });
};

// @desc    Verify payment
// @route   POST /api/payments/verify
// @access  Private
exports.verifyPayment = async (req, res, next) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

  // Verify signature
  const body = razorpay_order_id + '|' + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    return next(new ErrorResponse('Payment verification failed', 400));
  }

  // Update payment record
  const payment = await Payment.findOneAndUpdate(
    { razorpayOrderId: razorpay_order_id },
    {
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      status: 'paid',
    },
    { new: true }
  );

  // Update order
  const order = await Order.findByIdAndUpdate(
    orderId,
    {
      paymentStatus: 'paid',
      razorpayPaymentId: razorpay_payment_id,
      status: 'accepted',
      $push: { statusHistory: { status: 'accepted', note: 'Payment received' } },
    },
    { new: true }
  );

  // Notify user
  await Notification.create({
    user: req.user.id,
    title: 'Payment Successful!',
    message: `Payment of ₹${order.total} for order #${order.orderNumber} was successful.`,
    type: 'payment',
    data: { orderId: order._id, paymentId: payment._id },
  });

  // Emit socket event
  if (req.app.get('io')) {
    req.app.get('io').to(`restaurant_${order.restaurant}`).emit('payment_received', {
      orderId: order._id,
      orderNumber: order.orderNumber,
    });
  }

  res.status(200).json({
    success: true,
    message: 'Payment verified successfully',
    order,
    payment,
  });
};

// @desc    Get payment history
// @route   GET /api/payments/history
// @access  Private
exports.getPaymentHistory = async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const [payments, total] = await Promise.all([
    Payment.find({ user: req.user.id })
      .populate('order', 'orderNumber total status')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit),
    Payment.countDocuments({ user: req.user.id }),
  ]);

  res.status(200).json({ success: true, total, page, totalPages: Math.ceil(total / limit), payments });
};

// @desc    Get invoice
// @route   GET /api/payments/invoice/:orderId
// @access  Private
exports.getInvoice = async (req, res, next) => {
  const order = await Order.findById(req.params.orderId)
    .populate('user', 'name email')
    .populate('restaurant', 'name');

  if (!order) return next(new ErrorResponse('Order not found', 404));
  if (order.user._id.toString() !== req.user.id && req.user.role !== 'super_admin') {
    return next(new ErrorResponse('Not authorized', 403));
  }

  const payment = await Payment.findOne({ order: order._id });
  const html = generateInvoiceHTML(order, order.user, payment);

  res.status(200).json({ success: true, invoice: html });
};
