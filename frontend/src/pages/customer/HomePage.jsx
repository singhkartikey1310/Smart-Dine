import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { FiSearch, FiArrowRight, FiStar, FiClock, FiTruck, FiZap } from 'react-icons/fi';
import { fetchFeaturedRestaurants } from '../../redux/slices/restaurantSlice';
import { fetchPopularFoods } from '../../redux/slices/foodSlice';
import RestaurantCard from '../../components/restaurant/RestaurantCard';
import FoodCard from '../../components/food/FoodCard';
import CategoryFilter from '../../components/common/CategoryFilter';
import SkeletonCard from '../../components/common/SkeletonCard';
import api from '../../api/axios';

const HomePage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { featured, loading: restLoading } = useSelector((state) => state.restaurant);
  const { popular, loading: foodLoading } = useSelector((state) => state.food);
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    dispatch(fetchFeaturedRestaurants());
    dispatch(fetchPopularFoods());
    api.get('/categories').then(({ data }) => setCategories(data.categories)).catch(() => {});
  }, [dispatch]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
  };

  const stats = [
    { icon: '🏪', value: '500+', label: 'Restaurants' },
    { icon: '🍽️', value: '10K+', label: 'Menu Items' },
    { icon: '⭐', value: '4.8', label: 'Avg Rating' },
    { icon: '🚀', value: '30 min', label: 'Avg Delivery' },
  ];

  const features = [
    { icon: <FiZap className="w-6 h-6" />, title: 'AI Recommendations', desc: 'Personalized food suggestions powered by AI' },
    { icon: <FiClock className="w-6 h-6" />, title: 'Real-time Tracking', desc: 'Track your order live from kitchen to door' },
    { icon: <FiTruck className="w-6 h-6" />, title: 'Fast Delivery', desc: 'Average delivery time under 30 minutes' },
    { icon: <FiStar className="w-6 h-6" />, title: 'Top Rated', desc: 'Only the best restaurants on our platform' },
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-orange-50 via-white to-amber-50 dark:from-gray-900 dark:via-dark-bg dark:to-gray-900 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary-500/10 rounded-full blur-3xl" />
        </div>
        <div className="page-container py-16 md:py-24 relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <FiZap className="w-4 h-4" />
              AI-Powered Food Delivery
            </div>
            <h1 className="font-display font-bold text-4xl md:text-6xl text-gray-900 dark:text-white mb-6 leading-tight">
              Discover & Order
              <span className="gradient-text block">Amazing Food</span>
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-xl mx-auto">
              Order from the best restaurants near you with AI-powered recommendations, real-time tracking, and lightning-fast delivery.
            </p>

            {/* Search */}
            <form onSubmit={handleSearch} className="flex gap-3 max-w-lg mx-auto">
              <div className="relative flex-1">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for food or restaurants..."
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card text-gray-900 dark:text-white shadow-card focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                />
              </div>
              <button type="submit" className="btn-primary px-6 py-4 rounded-2xl">
                Search
              </button>
            </form>

            {/* Quick categories */}
            <div className="flex flex-wrap justify-center gap-2 mt-6">
              {['🍕 Pizza', '🍔 Burger', '🍜 Noodles', '🍣 Sushi', '🥗 Salad', '🍰 Desserts'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => navigate(`/search?q=${cat.split(' ')[1]}`)}
                  className="px-4 py-2 bg-white dark:bg-dark-card rounded-full text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm hover:shadow-md hover:text-primary-500 transition-all"
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white dark:bg-dark-card border-y border-gray-100 dark:border-dark-border">
        <div className="page-container py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl mb-1">{stat.icon}</div>
                <div className="font-display font-bold text-2xl text-gray-900 dark:text-white">{stat.value}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="page-container py-10">
          <h2 className="section-title mb-6">Browse by Category</h2>
          <CategoryFilter categories={categories} />
        </section>
      )}

      {/* Featured Restaurants */}
      <section className="page-container py-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="section-title">Featured Restaurants</h2>
          <Link to="/restaurants" className="flex items-center gap-1 text-primary-500 font-medium text-sm hover:gap-2 transition-all">
            View all <FiArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {restLoading
            ? Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />)
            : featured.map((restaurant) => (
                <RestaurantCard key={restaurant._id} restaurant={restaurant} />
              ))}
        </div>
      </section>

      {/* Popular Foods */}
      <section className="bg-gray-50 dark:bg-dark-bg py-10">
        <div className="page-container">
          <div className="flex items-center justify-between mb-6">
            <h2 className="section-title">Popular Right Now 🔥</h2>
            <Link to="/search?sort=-totalOrders" className="flex items-center gap-1 text-primary-500 font-medium text-sm hover:gap-2 transition-all">
              View all <FiArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {foodLoading
              ? Array(6).fill(0).map((_, i) => <SkeletonCard key={i} small />)
              : popular.slice(0, 6).map((food) => (
                  <FoodCard key={food._id} food={food} compact />
                ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="page-container py-16">
        <div className="text-center mb-12">
          <h2 className="section-title mb-3">Why Choose SmartDine?</h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
            We combine cutting-edge AI with the best restaurants to give you an unmatched food ordering experience.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature) => (
            <div key={feature.title} className="card p-6 text-center hover:-translate-y-1 transition-transform">
              <div className="w-14 h-14 bg-primary-50 dark:bg-primary-900/20 text-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                {feature.icon}
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-primary-500 to-secondary-500 py-16">
        <div className="page-container text-center">
          <h2 className="font-display font-bold text-3xl md:text-4xl text-white mb-4">
            Ready to Order?
          </h2>
          <p className="text-white/80 mb-8 max-w-md mx-auto">
            Join thousands of food lovers who order with SmartDine every day.
          </p>
          <Link to="/restaurants" className="inline-flex items-center gap-2 bg-white text-primary-500 font-semibold px-8 py-4 rounded-2xl hover:shadow-lg transition-shadow">
            Order Now <FiArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
