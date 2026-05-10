import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FiSearch, FiFilter, FiStar } from 'react-icons/fi';
import { fetchRestaurants } from '../../redux/slices/restaurantSlice';
import RestaurantCard from '../../components/restaurant/RestaurantCard';
import SkeletonCard from '../../components/common/SkeletonCard';
import Pagination from '../../components/common/Pagination';

const CUISINES = ['All', 'Indian', 'Chinese', 'Italian', 'Mexican', 'Japanese', 'Thai', 'American', 'Mediterranean'];
const SORT_OPTIONS = [
  { value: '-rating.average', label: 'Top Rated' },
  { value: '-totalOrders', label: 'Most Popular' },
  { value: 'deliveryInfo.deliveryFee', label: 'Delivery Fee' },
  { value: '-createdAt', label: 'Newest' },
];

const RestaurantsPage = () => {
  const dispatch = useDispatch();
  const { restaurants, loading, total, totalPages } = useSelector((state) => state.restaurant);
  const [filters, setFilters] = useState({ keyword: '', cuisine: '', sort: '-rating.average', page: 1 });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const params = { ...filters };
    if (params.cuisine === 'All') delete params.cuisine;
    dispatch(fetchRestaurants(params));
  }, [filters, dispatch]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  return (
    <div className="page-container py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="section-title mb-2">All Restaurants</h1>
        <p className="text-gray-500 dark:text-gray-400">{total} restaurants available</p>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={filters.keyword}
            onChange={(e) => handleFilterChange('keyword', e.target.value)}
            placeholder="Search restaurants..."
            className="input-field pl-10"
          />
        </div>
        <select
          value={filters.sort}
          onChange={(e) => handleFilterChange('sort', e.target.value)}
          className="input-field w-full sm:w-48"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="btn-secondary flex items-center gap-2"
        >
          <FiFilter className="w-4 h-4" /> Filters
        </button>
      </div>

      {/* Cuisine Filter */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 mb-6">
        {CUISINES.map((cuisine) => (
          <button
            key={cuisine}
            onClick={() => handleFilterChange('cuisine', cuisine)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              filters.cuisine === cuisine || (cuisine === 'All' && !filters.cuisine)
                ? 'bg-primary-500 text-white'
                : 'bg-white dark:bg-dark-card text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-dark-border hover:border-primary-300'
            }`}
          >
            {cuisine}
          </button>
        ))}
      </div>

      {/* Restaurant Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array(8).fill(0).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : restaurants.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🍽️</div>
          <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400">No restaurants found</h3>
          <p className="text-gray-400 dark:text-gray-500 mt-2">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {restaurants.map((restaurant) => (
            <RestaurantCard key={restaurant._id} restaurant={restaurant} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8">
          <Pagination
            currentPage={filters.page}
            totalPages={totalPages}
            onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
          />
        </div>
      )}
    </div>
  );
};

export default RestaurantsPage;
