import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { FiHeart } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import FoodCard from '../../components/food/FoodCard';

const WishlistPage = () => {
  const { user } = useSelector((state) => state.auth);
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        const { data } = await api.get('/auth/profile');
        setFoods(data.user.wishlist || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchWishlist();
  }, []);

  return (
    <div className="page-container py-8">
      <h1 className="section-title mb-8">My Wishlist</h1>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array(8).fill(0).map((_, i) => (
            <div key={i} className="card overflow-hidden">
              <div className="h-48 shimmer" />
              <div className="p-4 space-y-2">
                <div className="h-4 shimmer rounded w-3/4" />
                <div className="h-3 shimmer rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : foods.length === 0 ? (
        <div className="text-center py-20">
          <FiHeart className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400">Your wishlist is empty</h3>
          <p className="text-gray-400 dark:text-gray-500 mt-2">Save your favorite dishes here</p>
          <Link to="/restaurants" className="btn-primary mt-6 inline-block">Explore Food</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {foods.map((food) => (
            <FoodCard key={food._id} food={food} />
          ))}
        </div>
      )}
    </div>
  );
};

export default WishlistPage;
