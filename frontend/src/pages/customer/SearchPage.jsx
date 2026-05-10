import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FiSearch, FiZap } from 'react-icons/fi';
import { useDispatch, useSelector } from 'react-redux';
import { fetchFoods } from '../../redux/slices/foodSlice';
import FoodCard from '../../components/food/FoodCard';
import SkeletonCard from '../../components/common/SkeletonCard';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const dispatch = useDispatch();
  const { foods, loading, total } = useSelector((state) => state.food);
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [aiSearching, setAiSearching] = useState(false);
  const [aiResults, setAiResults] = useState(null);
  const [filters, setFilters] = useState({ isVeg: '', sort: '' });

  useEffect(() => {
    const q = searchParams.get('q');
    const category = searchParams.get('category');
    if (q || category) {
      dispatch(fetchFoods({ keyword: q, category, ...filters }));
    }
  }, [searchParams, filters, dispatch]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      setSearchParams({ q: query });
      setAiResults(null);
    }
  };

  const handleAISearch = async () => {
    if (!query.trim()) return;
    setAiSearching(true);
    try {
      const { data } = await api.post('/ai/search', { query });
      setAiResults(data.foods);
      toast.success('AI search complete!');
    } catch {
      toast.error('AI search failed');
    } finally {
      setAiSearching(false);
    }
  };

  const displayFoods = aiResults || foods;

  return (
    <div className="page-container py-8">
      <h1 className="section-title mb-6">Search Food</h1>

      {/* Search Bar */}
      <div className="flex gap-3 mb-6">
        <form onSubmit={handleSearch} className="flex-1 flex gap-3">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for food, ingredients, cuisine..."
              className="input-field pl-10"
            />
          </div>
          <button type="submit" className="btn-primary px-6">Search</button>
        </form>
        <button
          onClick={handleAISearch}
          disabled={aiSearching || !query.trim()}
          className="btn-secondary flex items-center gap-2 px-4"
          title="AI-powered natural language search"
        >
          <FiZap className="w-4 h-4 text-primary-500" />
          {aiSearching ? 'Searching...' : 'AI Search'}
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <select
          value={filters.isVeg}
          onChange={(e) => setFilters((p) => ({ ...p, isVeg: e.target.value }))}
          className="input-field w-40"
        >
          <option value="">All Types</option>
          <option value="true">Veg Only</option>
          <option value="false">Non-Veg</option>
        </select>
        <select
          value={filters.sort}
          onChange={(e) => setFilters((p) => ({ ...p, sort: e.target.value }))}
          className="input-field w-48"
        >
          <option value="">Sort By</option>
          <option value="-rating.average">Top Rated</option>
          <option value="-totalOrders">Most Popular</option>
          <option value="price">Price: Low to High</option>
          <option value="-price">Price: High to Low</option>
        </select>
      </div>

      {/* Results */}
      {aiResults && (
        <div className="flex items-center gap-2 mb-4 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-xl">
          <FiZap className="w-4 h-4 text-primary-500" />
          <span className="text-sm text-primary-600 dark:text-primary-400 font-medium">
            AI found {aiResults.length} results for "{query}"
          </span>
          <button onClick={() => setAiResults(null)} className="ml-auto text-xs text-gray-500 hover:text-gray-700">
            Clear AI results
          </button>
        </div>
      )}

      {loading || aiSearching ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array(10).fill(0).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : displayFoods.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400">No results found</h3>
          <p className="text-gray-400 dark:text-gray-500 mt-2">Try different keywords or use AI Search</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{total || displayFoods.length} results found</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {displayFoods.map((food) => (
              <FoodCard key={food._id} food={food} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default SearchPage;
