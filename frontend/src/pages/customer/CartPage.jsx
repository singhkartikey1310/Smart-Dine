import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { FiTrash2, FiPlus, FiMinus, FiShoppingBag, FiArrowRight } from 'react-icons/fi';
import { fetchCart, updateCartItem, removeFromCart, clearCart } from '../../redux/slices/cartSlice';

const CartPage = () => {
  const dispatch = useDispatch();
  const { items, restaurant, subtotal, tax, total, discount, loading } = useSelector((state) => state.cart);

  useEffect(() => {
    dispatch(fetchCart());
  }, [dispatch]);

  if (loading) {
    return (
      <div className="page-container py-8">
        <div className="space-y-4">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="card p-5 flex gap-4">
              <div className="w-20 h-20 shimmer rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="h-4 shimmer rounded w-1/2" />
                <div className="h-3 shimmer rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="page-container py-20 text-center">
        <FiShoppingBag className="w-20 h-20 text-gray-300 dark:text-gray-600 mx-auto mb-6" />
        <h2 className="font-display font-bold text-2xl text-gray-700 dark:text-gray-300 mb-3">Your cart is empty</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8">Add items from a restaurant to get started</p>
        <Link to="/restaurants" className="btn-primary inline-flex items-center gap-2">
          Browse Restaurants <FiArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="page-container py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="section-title">Your Cart</h1>
        <button
          onClick={() => dispatch(clearCart())}
          className="text-sm text-red-500 hover:text-red-600 font-medium flex items-center gap-1"
        >
          <FiTrash2 className="w-4 h-4" /> Clear Cart
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {/* Restaurant Info */}
          {restaurant && (
            <div className="flex items-center gap-3 p-4 bg-primary-50 dark:bg-primary-900/10 rounded-xl border border-primary-100 dark:border-primary-800/30">
              {restaurant.logo?.url && (
                <img src={restaurant.logo.url} alt={restaurant.name} className="w-10 h-10 rounded-lg object-cover" />
              )}
              <div>
                <p className="font-medium text-gray-900 dark:text-white text-sm">{restaurant.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {restaurant.deliveryInfo?.estimatedTime || '30-45 min'} •{' '}
                  {restaurant.deliveryInfo?.deliveryFee === 0 ? 'Free delivery' : `₹${restaurant.deliveryInfo?.deliveryFee} delivery`}
                </p>
              </div>
            </div>
          )}

          {items.map((item) => (
            <div key={item._id} className="card p-5 flex gap-4">
              {item.image ? (
                <img src={item.image} alt={item.name} className="w-20 h-20 rounded-xl object-cover flex-shrink-0" />
              ) : (
                <div className="w-20 h-20 bg-gray-100 dark:bg-dark-bg rounded-xl flex items-center justify-center text-3xl flex-shrink-0">🍽️</div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 dark:text-white truncate">{item.name}</h3>
                <p className="text-primary-500 font-bold mt-1">₹{item.price}</p>
                <div className="flex items-center gap-3 mt-3">
                  <div className="flex items-center gap-2 bg-gray-100 dark:bg-dark-bg rounded-lg p-1">
                    <button
                      onClick={() => dispatch(updateCartItem({ foodId: item.food?._id || item.food, quantity: item.quantity - 1 }))}
                      className="w-7 h-7 rounded-md bg-white dark:bg-dark-card flex items-center justify-center hover:text-primary-500 transition-colors shadow-sm"
                    >
                      <FiMinus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-bold w-6 text-center text-sm">{item.quantity}</span>
                    <button
                      onClick={() => dispatch(updateCartItem({ foodId: item.food?._id || item.food, quantity: item.quantity + 1 }))}
                      className="w-7 h-7 rounded-md bg-white dark:bg-dark-card flex items-center justify-center hover:text-primary-500 transition-colors shadow-sm"
                    >
                      <FiPlus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <button
                    onClick={() => dispatch(removeFromCart(item.food?._id || item.food))}
                    className="p-2 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-bold text-gray-900 dark:text-white text-lg">
                  ₹{(item.price * item.quantity).toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div>
          <div className="card p-6 sticky top-24">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Order Summary</h2>
            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
                <span>₹{subtotal?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>Tax (5%)</span>
                <span>₹{tax?.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span>
                  <span>-₹{discount?.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-gray-900 dark:text-white text-lg pt-3 border-t border-gray-100 dark:border-dark-border">
                <span>Total</span>
                <span>₹{total?.toFixed(2)}</span>
              </div>
            </div>
            <Link to="/checkout" className="btn-primary w-full text-center block py-3">
              Proceed to Checkout
            </Link>
            <Link to="/restaurants" className="btn-secondary w-full text-center block py-3 mt-3 text-sm">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
