import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiStar, FiClock, FiTruck, FiMapPin, FiPhone, FiHeart, FiShare2 } from 'react-icons/fi';
import { fetchRestaurant } from '../../redux/slices/restaurantSlice';
import { fetchFoodsByRestaurant } from '../../redux/slices/foodSlice';
import FoodCard from '../../components/food/FoodCard';
import ReviewSection from '../../components/reviews/ReviewSection';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const RestaurantDetailPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { current: restaurant, loading } = useSelector((state) => state.restaurant);
  const { grouped, restaurantFoods } = useSelector((state) => state.food);
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [activeCategory, setActiveCategory] = useState(null);
  const [aiSummary, setAiSummary] = useState('');

  useEffect(() => {
    dispatch(fetchRestaurant(id));
    dispatch(fetchFoodsByRestaurant(id));
    // Get AI review summary
    api.get(`/ai/review-summary/${id}`).then(({ data }) => setAiSummary(data.summary)).catch(() => {});
  }, [id, dispatch]);

  const handleFavorite = async () => {
    if (!isAuthenticated) { toast.error('Please login first'); return; }
    try {
      const { data } = await api.post(`/auth/favorites/${id}`);
      toast.success(data.message);
    } catch { toast.error('Failed to update favorites'); }
  };

  const categories = Object.keys(grouped);

  if (loading || !restaurant) {
    return (
      <div className="page-container py-8">
        <div className="h-64 shimmer rounded-2xl mb-6" />
        <div className="h-8 shimmer rounded w-1/3 mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array(8).fill(0).map((_, i) => <div key={i} className="h-48 shimmer rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Banner */}
      <div className="relative h-64 md:h-80 overflow-hidden bg-gray-200 dark:bg-dark-card">
        {restaurant.banner?.url ? (
          <img src={restaurant.banner.url} alt={restaurant.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary-100 to-secondary-100 dark:from-primary-900/20 dark:to-secondary-900/20 flex items-center justify-center">
            <span className="text-8xl">🍽️</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
          <div className="flex items-center gap-4">
            {restaurant.logo?.url && (
              <img src={restaurant.logo.url} alt={restaurant.name} className="w-16 h-16 rounded-2xl border-2 border-white shadow-lg object-cover" />
            )}
            <div>
              <h1 className="font-display font-bold text-2xl md:text-3xl text-white">{restaurant.name}</h1>
              <p className="text-white/80 text-sm">{restaurant.cuisines?.join(' • ')}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleFavorite} className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-white hover:bg-white/30 transition-colors">
              <FiHeart className="w-5 h-5" />
            </button>
            <button className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-white hover:bg-white/30 transition-colors">
              <FiShare2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="page-container py-6">
        {/* Info Bar */}
        <div className="card p-4 mb-6 flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-1.5">
            <FiStar className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            <span className="font-bold text-gray-900 dark:text-white">{restaurant.rating?.average?.toFixed(1) || '4.0'}</span>
            <span className="text-gray-500 dark:text-gray-400 text-sm">({restaurant.rating?.count || 0} reviews)</span>
          </div>
          <div className="w-px h-5 bg-gray-200 dark:bg-dark-border" />
          <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
            <FiClock className="w-4 h-4" />
            <span>{restaurant.deliveryInfo?.estimatedTime || '30-45 min'}</span>
          </div>
          <div className="w-px h-5 bg-gray-200 dark:bg-dark-border" />
          <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
            <FiTruck className="w-4 h-4" />
            <span>{restaurant.deliveryInfo?.deliveryFee === 0 ? 'Free Delivery' : `₹${restaurant.deliveryInfo?.deliveryFee} delivery`}</span>
          </div>
          <div className="w-px h-5 bg-gray-200 dark:bg-dark-border" />
          <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
            <FiMapPin className="w-4 h-4" />
            <span>{restaurant.address?.city}</span>
          </div>
          {restaurant.contact?.phone && (
            <>
              <div className="w-px h-5 bg-gray-200 dark:bg-dark-border" />
              <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                <FiPhone className="w-4 h-4" />
                <span>{restaurant.contact.phone}</span>
              </div>
            </>
          )}
          <div className="ml-auto">
            <span className={`badge ${restaurant.isOpen ? 'badge-green' : 'badge-red'}`}>
              {restaurant.isOpen ? '● Open Now' : '● Closed'}
            </span>
          </div>
        </div>

        {/* AI Summary */}
        {aiSummary && aiSummary !== 'No reviews yet.' && (
          <div className="card p-4 mb-6 bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/10 dark:to-secondary-900/10 border border-primary-100 dark:border-primary-800/30">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🤖</span>
              <span className="font-semibold text-primary-600 dark:text-primary-400 text-sm">AI Review Summary</span>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300">{aiSummary}</p>
          </div>
        )}

        <div className="flex gap-8">
          {/* Category Sidebar */}
          {categories.length > 0 && (
            <div className="hidden lg:block w-48 flex-shrink-0">
              <div className="sticky top-24">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm">Menu</h3>
                <div className="space-y-1">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => {
                        setActiveCategory(cat);
                        document.getElementById(`cat-${cat}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        activeCategory === cat
                          ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-bg'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Menu */}
          <div className="flex-1">
            {categories.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-5xl mb-4">🍽️</div>
                <p className="text-gray-500 dark:text-gray-400">No menu items available yet</p>
              </div>
            ) : (
              categories.map((cat) => (
                <div key={cat} id={`cat-${cat}`} className="mb-8">
                  <h2 className="font-display font-bold text-xl text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-100 dark:border-dark-border">
                    {cat}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {grouped[cat].map((food) => (
                      <FoodCard key={food._id} food={food} />
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Reviews */}
        <div className="mt-10">
          <ReviewSection restaurantId={id} />
        </div>
      </div>
    </div>
  );
};

export default RestaurantDetailPage;
