const Cart = require('../models/Cart');
const Food = require('../models/Food');
const Coupon = require('../models/Coupon');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get cart
// @route   GET /api/cart
// @access  Private
exports.getCart = async (req, res, next) => {
  const cart = await Cart.findOne({ user: req.user.id })
    .populate('items.food', 'name image price isAvailable stock')
    .populate('restaurant', 'name logo deliveryInfo');

  if (!cart) {
    return res.status(200).json({ success: true, cart: { items: [], subtotal: 0, tax: 0, total: 0 } });
  }

  res.status(200).json({ success: true, cart });
};

// @desc    Add item to cart
// @route   POST /api/cart/add
// @access  Private
exports.addToCart = async (req, res, next) => {
  const { foodId, quantity = 1 } = req.body;

  const food = await Food.findById(foodId);
  if (!food) return next(new ErrorResponse('Food item not found', 404));
  if (!food.isAvailable) return next(new ErrorResponse('Food item is not available', 400));
  if (food.stock < quantity) return next(new ErrorResponse('Insufficient stock', 400));

  let cart = await Cart.findOne({ user: req.user.id });

  if (cart) {
    // Check if adding from different restaurant
    if (cart.restaurant && cart.restaurant.toString() !== food.restaurant.toString() && cart.items.length > 0) {
      return next(new ErrorResponse('Cannot add items from different restaurants. Clear cart first.', 400));
    }

    const existingItem = cart.items.find((item) => item.food.toString() === foodId);

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({
        food: foodId,
        quantity,
        price: food.discountPrice || food.price,
        name: food.name,
        image: food.image?.url,
      });
    }

    cart.restaurant = food.restaurant;
  } else {
    cart = new Cart({
      user: req.user.id,
      restaurant: food.restaurant,
      items: [
        {
          food: foodId,
          quantity,
          price: food.discountPrice || food.price,
          name: food.name,
          image: food.image?.url,
        },
      ],
    });
  }

  await cart.save();
  await cart.populate('items.food', 'name image price');
  await cart.populate('restaurant', 'name logo deliveryInfo');

  res.status(200).json({ success: true, message: 'Item added to cart', cart });
};

// @desc    Update cart item quantity
// @route   PUT /api/cart/update
// @access  Private
exports.updateCartItem = async (req, res, next) => {
  const { foodId, quantity } = req.body;

  const cart = await Cart.findOne({ user: req.user.id });
  if (!cart) return next(new ErrorResponse('Cart not found', 404));

  const item = cart.items.find((i) => i.food.toString() === foodId);
  if (!item) return next(new ErrorResponse('Item not in cart', 404));

  if (quantity <= 0) {
    cart.items = cart.items.filter((i) => i.food.toString() !== foodId);
  } else {
    item.quantity = quantity;
  }

  if (cart.items.length === 0) {
    cart.restaurant = undefined;
    cart.couponCode = undefined;
    cart.discount = 0;
  }

  await cart.save();
  await cart.populate('items.food', 'name image price');

  res.status(200).json({ success: true, message: 'Cart updated', cart });
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/remove/:foodId
// @access  Private
exports.removeFromCart = async (req, res, next) => {
  const cart = await Cart.findOne({ user: req.user.id });
  if (!cart) return next(new ErrorResponse('Cart not found', 404));

  cart.items = cart.items.filter((i) => i.food.toString() !== req.params.foodId);

  if (cart.items.length === 0) {
    cart.restaurant = undefined;
    cart.couponCode = undefined;
    cart.discount = 0;
  }

  await cart.save();
  res.status(200).json({ success: true, message: 'Item removed', cart });
};

// @desc    Clear cart
// @route   DELETE /api/cart/clear
// @access  Private
exports.clearCart = async (req, res, next) => {
  await Cart.findOneAndUpdate(
    { user: req.user.id },
    { items: [], restaurant: undefined, couponCode: undefined, discount: 0 }
  );

  res.status(200).json({ success: true, message: 'Cart cleared' });
};

// @desc    Apply coupon
// @route   POST /api/cart/coupon
// @access  Private
exports.applyCoupon = async (req, res, next) => {
  const { code } = req.body;

  const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });

  if (!coupon) return next(new ErrorResponse('Invalid coupon code', 400));
  if (coupon.expiresAt < Date.now()) return next(new ErrorResponse('Coupon has expired', 400));
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    return next(new ErrorResponse('Coupon usage limit reached', 400));
  }
  if (coupon.usedBy.includes(req.user.id)) {
    return next(new ErrorResponse('You have already used this coupon', 400));
  }

  const cart = await Cart.findOne({ user: req.user.id });
  if (!cart) return next(new ErrorResponse('Cart is empty', 400));

  if (cart.subtotal < coupon.minOrderAmount) {
    return next(new ErrorResponse(`Minimum order amount is ₹${coupon.minOrderAmount}`, 400));
  }

  let discount = 0;
  if (coupon.discountType === 'percentage') {
    discount = (cart.subtotal * coupon.discountValue) / 100;
    if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
  } else {
    discount = coupon.discountValue;
  }

  cart.couponCode = coupon.code;
  cart.discount = Math.round(discount * 100) / 100;
  await cart.save();

  res.status(200).json({
    success: true,
    message: `Coupon applied! You save ₹${cart.discount}`,
    discount: cart.discount,
    cart,
  });
};
