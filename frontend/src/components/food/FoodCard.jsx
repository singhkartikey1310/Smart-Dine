import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiStar, FiPlus, FiHeart } from 'react-icons/fi';
import { addToCart } from '../../redux/slices/cartSlice';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const FoodCard = ({ food, compact = false }) => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);

  const {
    _id, name, image, price, discountPrice, rating, isVeg, restaurant,
    preparationTime, category, stock,
  } = food;

  const handleAddToCart = (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Please login to add items to cart');
      return;
    }
    dispatch(addToCart({ foodId: _id, quantity: 1 }));
  };

  const handleWishlist = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Please login to add to wishlist');
      return;
    }
    try {
      const { data } = await api.post(`/auth/wishlist/${_id}`);
      toast.success(data.message);
    } catch {
      toast.error('Failed to update wishlist');
    }
  };

  if (compact) {
    return (
      <Link to={`/foods/${_id}`} className="card group overflow-hidden block">
        <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-dark-bg">
          {image?.url ? (
            <img src={image.url} alt={name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl">🍽️</div>
          )}
          <button onClick={handleAddToCart} className="absolute bottom-2 right-2 w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-primary-600 transition-colors opacity-0 group-hover:opacity-100">
            <FiPlus className="w-4 h-4" />
          </button>
        </div>
        <div className="p-2.5">
          <p className="font-medium text-gray-900 dark:text-white text-xs truncate">{name}</p>
          <p className="text-primary-500 font-bold text-sm mt-0.5">₹{discountPrice || price}</p>
        </div>
      </Link>
    );
  }

  return (
    <Link to={`/foods/${_id}`} className="card group overflow-hidden block">
      <div className="relative h-48 overflow-hidden bg-gray-100 dark:bg-dark-bg">
        {image?.url ? (
          <img src={image.url} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl">🍽️</div>
        )}
        <div className="absolute top-3 left-3 flex gap-2">
          <span className={`badge ${isVeg ? 'badge-green' : 'badge-red'}`}>
            {isVeg ? '🟢 Veg' : '🔴 Non-Veg'}
          </span>
        </div>
        <button
          onClick={handleWishlist}
          className="absolute top-3 right-3 w-8 h-8 bg-white/90 dark:bg-dark-card/90 rounded-full flex items-center justify-center shadow hover:bg-white transition-colors"
        >
          <FiHeart className="w-4 h-4 text-gray-500 hover:text-red-500 transition-colors" />
        </button>
        {stock === 0 && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-white text-gray-800 text-sm font-semibold px-3 py-1 rounded-full">Out of Stock</span>
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate group-hover:text-primary-500 transition-colors">
              {name}
            </h3>
            {restaurant?.name && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">{restaurant.name}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <FiStar className="w-3 h-3 text-yellow-400 fill-yellow-400" />
            <span>{rating?.average?.toFixed(1) || '4.0'}</span>
          </div>
          {preparationTime && (
            <>
              <span>•</span>
              <span>{preparationTime} min</span>
            </>
          )}
        </div>

        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-900 dark:text-white">₹{discountPrice || price}</span>
            {discountPrice && discountPrice < price && (
              <span className="text-xs text-gray-400 line-through">₹{price}</span>
            )}
          </div>
          <button
            onClick={handleAddToCart}
            disabled={stock === 0}
            className="flex items-center gap-1 bg-primary-500 hover:bg-primary-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiPlus className="w-3.5 h-3.5" /> Add
          </button>
        </div>
      </div>
    </Link>
  );
};

export default FoodCard;
