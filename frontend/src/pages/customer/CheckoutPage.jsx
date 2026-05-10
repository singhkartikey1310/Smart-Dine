import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FiMapPin, FiCreditCard, FiTruck, FiTag } from 'react-icons/fi';
import { placeOrder } from '../../redux/slices/orderSlice';
import { applyCoupon } from '../../redux/slices/cartSlice';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const CheckoutPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, subtotal, tax, total, discount, couponCode, restaurant } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.auth);
  const { placing } = useSelector((state) => state.order);

  const [address, setAddress] = useState({
    street: user?.addresses?.[0]?.street || '',
    city: user?.addresses?.[0]?.city || '',
    state: user?.addresses?.[0]?.state || '',
    pincode: user?.addresses?.[0]?.pincode || '',
  });
  const [paymentMethod, setPaymentMethod] = useState('online');
  const [couponInput, setCouponInput] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  useEffect(() => {
    if (items.length === 0) navigate('/cart');
  }, [items, navigate]);

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setApplyingCoupon(true);
    await dispatch(applyCoupon(couponInput));
    setApplyingCoupon(false);
  };

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePlaceOrder = async () => {
    if (!address.street || !address.city || !address.state || !address.pincode) {
      toast.error('Please fill in the delivery address');
      return;
    }

    const orderData = {
      deliveryAddress: address,
      paymentMethod,
      specialInstructions,
      couponCode,
    };

    const result = await dispatch(placeOrder(orderData));
    if (placeOrder.fulfilled.match(result)) {
      const order = result.payload;

      if (paymentMethod === 'online') {
        // Razorpay payment
        const loaded = await loadRazorpay();
        if (!loaded) { toast.error('Payment gateway failed to load'); return; }

        try {
          const { data } = await api.post('/payments/create-order', { orderId: order._id });

          const options = {
            key: data.keyId,
            amount: data.amount,
            currency: data.currency,
            name: 'SmartDine AI',
            description: `Order #${order.orderNumber}`,
            order_id: data.razorpayOrderId,
            prefill: {
              name: data.user.name,
              email: data.user.email,
              contact: data.user.phone || '',
            },
            theme: { color: '#FF6B35' },
            handler: async (response) => {
              try {
                await api.post('/payments/verify', {
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  orderId: order._id,
                });
                toast.success('Payment successful!');
                navigate(`/orders/${order._id}`);
              } catch {
                toast.error('Payment verification failed');
              }
            },
            modal: {
              ondismiss: () => toast.error('Payment cancelled'),
            },
          };

          const rzp = new window.Razorpay(options);
          rzp.open();
        } catch (err) {
          toast.error('Failed to initiate payment');
        }
      } else {
        navigate(`/orders/${order._id}`);
      }
    }
  };

  const deliveryFee = restaurant?.deliveryInfo?.deliveryFee || 0;
  const finalTotal = subtotal + tax + deliveryFee - discount;

  return (
    <div className="page-container py-8">
      <h1 className="section-title mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left - Forms */}
        <div className="lg:col-span-2 space-y-6">
          {/* Delivery Address */}
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-4">
              <FiMapPin className="w-5 h-5 text-primary-500" />
              <h2 className="font-semibold text-gray-900 dark:text-white">Delivery Address</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Street Address *</label>
                <input
                  type="text"
                  value={address.street}
                  onChange={(e) => setAddress((p) => ({ ...p, street: e.target.value }))}
                  placeholder="House no., Street, Area"
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City *</label>
                <input
                  type="text"
                  value={address.city}
                  onChange={(e) => setAddress((p) => ({ ...p, city: e.target.value }))}
                  placeholder="City"
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">State *</label>
                <input
                  type="text"
                  value={address.state}
                  onChange={(e) => setAddress((p) => ({ ...p, state: e.target.value }))}
                  placeholder="State"
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pincode *</label>
                <input
                  type="text"
                  value={address.pincode}
                  onChange={(e) => setAddress((p) => ({ ...p, pincode: e.target.value }))}
                  placeholder="Pincode"
                  className="input-field"
                />
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-4">
              <FiCreditCard className="w-5 h-5 text-primary-500" />
              <h2 className="font-semibold text-gray-900 dark:text-white">Payment Method</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { value: 'online', label: 'Online Payment', desc: 'Cards, UPI, Netbanking', icon: '💳' },
                { value: 'cod', label: 'Cash on Delivery', desc: 'Pay when delivered', icon: '💵' },
              ].map((method) => (
                <label
                  key={method.value}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    paymentMethod === method.value
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-dark-border hover:border-primary-300'
                  }`}
                >
                  <input
                    type="radio"
                    value={method.value}
                    checked={paymentMethod === method.value}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="sr-only"
                  />
                  <span className="text-2xl">{method.icon}</span>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm">{method.label}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{method.desc}</p>
                  </div>
                  {paymentMethod === method.value && (
                    <div className="ml-auto w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full" />
                    </div>
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Special Instructions */}
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-4">
              <FiTruck className="w-5 h-5 text-primary-500" />
              <h2 className="font-semibold text-gray-900 dark:text-white">Special Instructions</h2>
            </div>
            <textarea
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="Any special requests for the restaurant or delivery..."
              rows={3}
              className="input-field resize-none"
            />
          </div>
        </div>

        {/* Right - Order Summary */}
        <div className="space-y-4">
          <div className="card p-6 sticky top-24">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Order Summary</h2>

            {/* Items */}
            <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
              {items.map((item) => (
                <div key={item._id} className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400 truncate flex-1">
                    {item.name} × {item.quantity}
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white ml-2">
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Coupon */}
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <FiTag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  placeholder="Coupon code"
                  className="input-field pl-9 text-sm py-2"
                />
              </div>
              <button
                onClick={handleApplyCoupon}
                disabled={applyingCoupon}
                className="btn-outline text-sm py-2 px-4"
              >
                {applyingCoupon ? '...' : 'Apply'}
              </button>
            </div>
            {couponCode && (
              <div className="badge-green mb-4 w-full justify-center py-2">
                ✓ Coupon "{couponCode}" applied
              </div>
            )}

            {/* Price Breakdown */}
            <div className="space-y-2 border-t border-gray-100 dark:border-dark-border pt-4">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>Subtotal</span><span>₹{subtotal?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>Tax (5%)</span><span>₹{tax?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>Delivery Fee</span>
                <span>{deliveryFee === 0 ? <span className="text-green-500">Free</span> : `₹${deliveryFee}`}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span><span>-₹{discount?.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-gray-900 dark:text-white text-lg pt-2 border-t border-gray-100 dark:border-dark-border">
                <span>Total</span><span>₹{finalTotal?.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={placing}
              className="btn-primary w-full mt-6 py-3"
            >
              {placing ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Placing Order...
                </span>
              ) : (
                `Place Order • ₹${finalTotal?.toFixed(2)}`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
