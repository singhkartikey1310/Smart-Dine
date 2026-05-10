import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiStar, FiClock, FiPlus, FiMinus, FiHeart, FiArrowLeft } from 'react-icons/fi';
import { fetchFood } from '../../redux/slices/foodSlice';
import { addToCart } from '../../redux/slices/cartSlice';
import ReviewSection from '../../components/reviews/ReviewSection';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const FoodDetailPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { current: food } = useSelector((state) => state.food);
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [quantity, setQuantity] = useState(1);
  const [aiDesc, setAiDesc] = useState('');

  useEffect(() => {
    dispatch(fetchFood(id));
  }, [id, dispatch]);

  useEffect(() => {
    if (food?.aiDescription) setAiDesc(food.aiDescription);
  }, [food]);

  const handleAddToCart = () => {
    if (!isAuthenticated) { toast.error('Please login first'); return; }
    dispatch(addToCart({ foodId: id, quantity }));
  };

  const handleWishlist = async () => {
    if (!isAuthenticated) { toast.error('Please login first'); return; }
    try {
      const { data } = await api.post(`/auth/wishlist/${id}`);
      toast.success(data.message);
    } catch { toast.error('Failed'); }
  };

  if (!food) {
    return (
      <div className="page-container py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="aspect-square shimmer rounded-2xl" />
          <div className="space-y-4">
            <div className="h-8 shimmer rounded w-3/4" />
            <div className="h-4 shimmer rounded w-1/2" />
            <div className="h-20 shimmer rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container py-8">
      <Link to={`/restaurants/${food.restaurant?._id}`} className="flex items-center gap-2 text-gray-500 hover:text-primary-500 mb-6 transition-colors">
        <FiArrowLeft className="w-4 h-4" /> Back to {food.restaurant?.name}
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* Image */}
        <div className="relative">
          <div className="aspect-square rounded-2xl overflow-hidden bg-gray-100 dark:bg-dark-card">
            {food.image?.url ? (
              <img src={food.image.url} alt={food.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-8xl">🍽️</div>
            )}
          </div>
          <button
            onClick={handleWishlist}
            className="absolute top-4 right-4 w-10 h-10 bg-white dark:bg-dark-card rounded-full shadow-md flex items-center justify-center hover:text-red-500 transition-colors"
          >
            <FiHeart className="w-5 h-5" />
          </button>
        </div>

        {/* Details */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className={`badge ${food.isVeg ? 'badge-green' : 'badge-red'}`}>
              {food.isVeg ? '🟢 Veg' : '🔴 Non-Veg'}
            </span>
            {food.isPopular && <span className="badge-orange">🔥 Popular</span>}
          </div>

          <h1 className="font-display font-bold text-3xl text-gray-900 dark:text-white mb-2">{food.name}</h1>

          {food.restaurant && (
            <Link to={`/restaurants/${food.restaurant._id}`} className="text-primary-500 hover:text-primary-600 text-sm font-medium">
              {food.restaurant.name}
            </Link>
          )}

          <div className="flex items-center gap-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <FiStar className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span className="font-semibold text-gray-700 dark:text-gray-300">{food.rating?.average?.toFixed(1) || '4.0'}</span>
              <span>({food.rating?.count || 0})</span>
            </div>
            {food.preparationTime && (
              <div className="flex items-center gap-1">
                <FiClock className="w-4 h-4" />
                <span>{food.preparationTime} min prep</span>
              </div>
            )}
          </div>

          <p className="text-gray-600 dark:text-gray-400 mt-4 leading-relaxed">
            {aiDesc || food.description || 'A delicious dish prepared with fresh ingredients.'}
          </p>

          {food.ingredients?.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Ingredients:</p>
              <div className="flex flex-wrap gap-2">
                {food.ingredients.map((ing) => (
                  <span key={ing} className="px-2.5 py-1 bg-gray-100 dark:bg-dark-bg text-gray-600 dark:text-gray-400 rounded-full text-xs">
                    {ing}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Price & Add to Cart */}
          <div className="mt-6 flex items-center gap-4">
            <div>
              <span className="font-display font-bold text-3xl text-gray-900 dark:text-white">
                ₹{food.discountPrice || food.price}
              </span>
              {food.discountPrice && food.discountPrice < food.price && (
                <span className="text-gray-400 line-through ml-2 text-lg">₹{food.price}</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-3 bg-gray-100 dark:bg-dark-bg rounded-xl p-1">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-9 h-9 rounded-lg bg-white dark:bg-dark-card flex items-center justify-center hover:text-primary-500 transition-colors shadow-sm"
              >
                <FiMinus className="w-4 h-4" />
              </button>
              <span className="font-bold text-lg w-8 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(food.stock, quantity + 1))}
                className="w-9 h-9 rounded-lg bg-white dark:bg-dark-card flex items-center justify-center hover:text-primary-500 transition-colors shadow-sm"
              >
                <FiPlus className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={handleAddToCart}
              disabled={food.stock === 0}
              className="btn-primary flex-1 py-3 disabled:opacity-50"
            >
              {food.stock === 0 ? 'Out of Stock' : `Add to Cart • ₹${((food.discountPrice || food.price) * quantity).toFixed(2)}`}
            </button>
          </div>

          {food.stock > 0 && food.stock < 10 && (
            <p className="text-orange-500 text-sm mt-2">Only {food.stock} left!</p>
          )}
        </div>
      </div>

      {/* Reviews */}
      <ReviewSection foodId={id} />
    </div>
  );
};

export default FoodDetailPage;
