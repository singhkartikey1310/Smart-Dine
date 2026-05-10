const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Food = require('../models/Food');
const Restaurant = require('../models/Restaurant');
const Coupon = require('../models/Coupon');
const Notification = require('../models/Notification');
const ErrorResponse = require('../utils/errorResponse');
const { sendOrderConfirmationEmail } = require('../utils/sendEmail');

// @desc    Place order
// @route   POST /api/orders
// @access  Private
exports.placeOrder = async (req, res, next) => {
  const { deliveryAddress, paymentMethod = 'online', specialInstructions, couponCode } = req.body;

  const cart = await Cart.findOne({ user: req.user.id }).populate('items.food');

  if (!cart || cart.items.length === 0) {
    return next(new ErrorResponse('Cart is empty', 400));
  }

  // Validate stock
  for (const item of cart.items) {
    if (!item.food.isAvailable || item.food.stock < item.quantity) {
      return next(new ErrorResponse(`${item.food.name} is not available in requested quantity`, 400));
    }
  }

  const restaurant = await Restaurant.findById(cart.restaurant);
  if (!restaurant || !restaurant.isOpen) {
    return next(new ErrorResponse('Restaurant is currently closed', 400));
  }

  const subtotal = cart.subtotal;
  const tax = Math.round(subtotal * 0.05 * 100) / 100;
  const deliveryFee = restaurant.deliveryInfo?.deliveryFee || 0;
  let discount = cart.discount || 0;

  // Validate coupon if provided
  if (couponCode) {
    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
    if (coupon && coupon.expiresAt > Date.now() && !coupon.usedBy.includes(req.user.id)) {
      coupon.usedCount += 1;
      coupon.usedBy.push(req.user.id);
      await coupon.save();
    }
  }

  const total = Math.round((subtotal + tax + deliveryFee - discount) * 100) / 100;

  const orderItems = cart.items.map((item) => ({
    food: item.food._id,
    name: item.food.name,
    image: item.food.image?.url,
    price: item.price,
    quantity: item.quantity,
  }));

  const order = await Order.create({
    user: req.user.id,
    restaurant: cart.restaurant,
    items: orderItems,
    deliveryAddress,
    paymentMethod,
    subtotal,
    tax,
    deliveryFee,
    discount,
    total,
    couponCode,
    specialInstructions,
    estimatedDeliveryTime: restaurant.deliveryInfo?.estimatedTime || '30-45 mins',
    statusHistory: [{ status: 'pending', note: 'Order placed' }],
  });

  // Update food stock and order count
  for (const item of cart.items) {
    await Food.findByIdAndUpdate(item.food._id, {
      $inc: { stock: -item.quantity, totalOrders: item.quantity },
    });
  }

  // Update restaurant stats
  await Restaurant.findByIdAndUpdate(cart.restaurant, {
    $inc: { totalOrders: 1 },
  });

  // Clear cart
  await Cart.findOneAndUpdate(
    { user: req.user.id },
    { items: [], restaurant: undefined, couponCode: undefined, discount: 0 }
  );

  // Create notification
  await Notification.create({
    user: req.user.id,
    title: 'Order Placed!',
    message: `Your order #${order.orderNumber} has been placed successfully.`,
    type: 'order',
    data: { orderId: order._id },
  });

  // Send confirmation email
  try {
    await sendOrderConfirmationEmail(req.user, order);
  } catch (err) {
    console.error('Order email failed:', err.message);
  }

  // Emit socket event
  if (req.app.get('io')) {
    req.app.get('io').to(`restaurant_${cart.restaurant}`).emit('new_order', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      total: order.total,
    });
  }

  await order.populate('restaurant', 'name logo');

  res.status(201).json({ success: true, message: 'Order placed successfully', order });
};

// @desc    Get my orders
// @route   GET /api/orders/my-orders
// @access  Private
exports.getMyOrders = async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const query = { user: req.user.id };
  if (req.query.status) query.status = req.query.status;

  const [orders, total] = await Promise.all([
    Order.find(query)
      .populate('restaurant', 'name logo')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit),
    Order.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    orders,
  });
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
exports.getOrder = async (req, res, next) => {
  const order = await Order.findById(req.params.id)
    .populate('user', 'name email phone')
    .populate('restaurant', 'name logo contact');

  if (!order) return next(new ErrorResponse('Order not found', 404));

  // Check access
  if (
    order.user._id.toString() !== req.user.id &&
    req.user.role !== 'super_admin' &&
    req.user.role !== 'restaurant_admin'
  ) {
    return next(new ErrorResponse('Not authorized', 403));
  }

  res.status(200).json({ success: true, order });
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private (restaurant_admin / super_admin)
exports.updateOrderStatus = async (req, res, next) => {
  const { status, note } = req.body;

  const order = await Order.findById(req.params.id);
  if (!order) return next(new ErrorResponse('Order not found', 404));

  const validTransitions = {
    pending: ['accepted', 'cancelled'],
    accepted: ['preparing', 'cancelled'],
    preparing: ['out_for_delivery'],
    out_for_delivery: ['delivered'],
    delivered: [],
    cancelled: [],
  };

  if (!validTransitions[order.status]?.includes(status)) {
    return next(new ErrorResponse(`Cannot transition from ${order.status} to ${status}`, 400));
  }

  order.status = status;
  order.statusHistory.push({ status, note: note || `Status updated to ${status}` });

  if (status === 'delivered') {
    order.deliveredAt = Date.now();
    order.paymentStatus = 'paid';
    await Restaurant.findByIdAndUpdate(order.restaurant, {
      $inc: { totalRevenue: order.total },
    });
  }

  if (status === 'cancelled') {
    order.cancelledAt = Date.now();
    order.cancellationReason = note;
    // Restore stock
    for (const item of order.items) {
      await Food.findByIdAndUpdate(item.food, { $inc: { stock: item.quantity } });
    }
  }

  await order.save();

  // Notify user
  await Notification.create({
    user: order.user,
    title: 'Order Update',
    message: `Your order #${order.orderNumber} is now ${status.replace(/_/g, ' ')}.`,
    type: 'order',
    data: { orderId: order._id },
  });

  // Emit socket event
  if (req.app.get('io')) {
    req.app.get('io').to(`user_${order.user}`).emit('order_update', {
      orderId: order._id,
      status,
      orderNumber: order.orderNumber,
    });
  }

  res.status(200).json({ success: true, message: 'Order status updated', order });
};

// @desc    Cancel order (by customer)
// @route   PUT /api/orders/:id/cancel
// @access  Private
exports.cancelOrder = async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) return next(new ErrorResponse('Order not found', 404));
  if (order.user.toString() !== req.user.id) return next(new ErrorResponse('Not authorized', 403));
  if (!['pending', 'accepted'].includes(order.status)) {
    return next(new ErrorResponse('Order cannot be cancelled at this stage', 400));
  }

  order.status = 'cancelled';
  order.cancelledAt = Date.now();
  order.cancellationReason = req.body.reason || 'Cancelled by customer';
  order.statusHistory.push({ status: 'cancelled', note: order.cancellationReason });

  for (const item of order.items) {
    await Food.findByIdAndUpdate(item.food, { $inc: { stock: item.quantity } });
  }

  await order.save();

  res.status(200).json({ success: true, message: 'Order cancelled', order });
};

// @desc    Get restaurant orders (admin)
// @route   GET /api/orders/restaurant
// @access  Private (restaurant_admin)
exports.getRestaurantOrders = async (req, res, next) => {
  const restaurant = await require('../models/Restaurant').findOne({ owner: req.user.id });
  if (!restaurant) return next(new ErrorResponse('Restaurant not found', 404));

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const query = { restaurant: restaurant._id };
  if (req.query.status) query.status = req.query.status;

  const [orders, total] = await Promise.all([
    Order.find(query)
      .populate('user', 'name email phone')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit),
    Order.countDocuments(query),
  ]);

  res.status(200).json({ success: true, total, page, totalPages: Math.ceil(total / limit), orders });
};

// @desc    Get all orders (super_admin)
// @route   GET /api/orders/all
// @access  Private (super_admin)
exports.getAllOrders = async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const query = {};
  if (req.query.status) query.status = req.query.status;

  const [orders, total] = await Promise.all([
    Order.find(query)
      .populate('user', 'name email')
      .populate('restaurant', 'name')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit),
    Order.countDocuments(query),
  ]);

  res.status(200).json({ success: true, total, page, totalPages: Math.ceil(total / limit), orders });
};
