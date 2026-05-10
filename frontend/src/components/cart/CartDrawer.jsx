import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { FiX, FiTrash2, FiPlus, FiMinus, FiShoppingBag } from 'react-icons/fi';
import { setCartOpen } from '../../redux/slices/uiSlice';
import { updateCartItem, removeFromCart } from '../../redux/slices/cartSlice';

const CartDrawer = () => {
  const dispatch = useDispatch();
  const { cartOpen } = useSelector((state) => state.ui);
  const { items, subtotal, tax, total, discount, restaurant } = useSelector((state) => state.cart);
  const { isAuthenticated } = useSelector((state) => state.auth);

  if (!cartOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
        onClick={() => dispatch(setCartOpen(false))}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white dark:bg-dark-card z-50 shadow-2xl flex flex-col animate-slide-down">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-dark-border">
          <div>
            <h2 className="font-display font-bold text-xl text-gray-900 dark:text-white">Your Cart</h2>
            {restaurant && (
              <p className="text-sm text-gray-500 dark:text-gray-400">{restaurant.name}</p>
            )}
          </div>
          <button
            onClick={() => dispatch(setCartOpen(false))}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-bg transition-colors"
          >
            <FiX className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-5">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <FiShoppingBag className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="font-semibold text-gray-600 dark:text-gray-400 text-lg">Your cart is empty</h3>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Add items to get started</p>
              <Link
                to="/restaurants"
                onClick={() => dispatch(setCartOpen(false))}
                className="btn-primary mt-6 text-sm"
              >
                Browse Restaurants
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.food?._id || item._id} className="flex gap-3 p-3 bg-gray-50 dark:bg-dark-bg rounded-xl">
                  {item.image && (
                    <img src={item.image} alt={item.name} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white text-sm truncate">{item.name}</p>
                    <p className="text-primary-500 font-semibold text-sm mt-0.5">₹{item.price}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => dispatch(updateCartItem({ foodId: item.food?._id || item.food, quantity: item.quantity - 1 }))}
                        className="w-7 h-7 rounded-lg bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border flex items-center justify-center hover:border-primary-500 transition-colors"
                      >
                        <FiMinus className="w-3 h-3" />
                      </button>
                      <span className="font-semibold text-sm w-6 text-center">{item.quantity}</span>
                      <button
                        onClick={() => dispatch(updateCartItem({ foodId: item.food?._id || item.food, quantity: item.quantity + 1 }))}
                        className="w-7 h-7 rounded-lg bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border flex items-center justify-center hover:border-primary-500 transition-colors"
                      >
                        <FiPlus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col items-end justify-between">
                    <button
                      onClick={() => dispatch(removeFromCart(item.food?._id || item.food))}
                      className="p-1.5 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                    <p className="font-bold text-gray-900 dark:text-white text-sm">
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Summary */}
        {items.length > 0 && (
          <div className="p-5 border-t border-gray-100 dark:border-dark-border bg-gray-50 dark:bg-dark-bg">
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>Subtotal</span><span>₹{subtotal?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>Tax (5%)</span><span>₹{tax?.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span><span>-₹{discount?.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-gray-900 dark:text-white pt-2 border-t border-gray-200 dark:border-dark-border">
                <span>Total</span><span>₹{total?.toFixed(2)}</span>
              </div>
            </div>
            <Link
              to={isAuthenticated ? '/checkout' : '/login'}
              onClick={() => dispatch(setCartOpen(false))}
              className="btn-primary w-full text-center block text-sm"
            >
              {isAuthenticated ? 'Proceed to Checkout' : 'Login to Checkout'}
            </Link>
          </div>
        )}
      </div>
    </>
  );
};

export default CartDrawer;
