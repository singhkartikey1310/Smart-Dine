import { Link } from 'react-router-dom';
import { FiStar, FiClock, FiTruck } from 'react-icons/fi';

const RestaurantCard = ({ restaurant }) => {
  const {
    _id, name, logo, banner, rating, cuisines, deliveryInfo,
    isOpen, isFeatured, tags,
  } = restaurant;

  return (
    <Link to={`/restaurants/${_id}`} className="card group overflow-hidden block">
      {/* Banner */}
      <div className="relative h-44 overflow-hidden bg-gray-100 dark:bg-dark-bg">
        {banner?.url ? (
          <img
            src={banner.url}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary-100 to-secondary-100 dark:from-primary-900/20 dark:to-secondary-900/20 flex items-center justify-center">
            <span className="text-5xl">🍽️</span>
          </div>
        )}
        {!isOpen && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-white text-gray-800 text-sm font-semibold px-3 py-1 rounded-full">Closed</span>
          </div>
        )}
        {isFeatured && (
          <div className="absolute top-3 left-3">
            <span className="badge-orange">⭐ Featured</span>
          </div>
        )}
        {/* Logo */}
        {logo?.url && (
          <div className="absolute bottom-3 left-3 w-12 h-12 rounded-xl overflow-hidden border-2 border-white shadow-md">
            <img src={logo.url} alt={name} className="w-full h-full object-cover" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-display font-semibold text-gray-900 dark:text-white text-base truncate group-hover:text-primary-500 transition-colors">
          {name}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate">
          {cuisines?.slice(0, 3).join(' • ')}
        </p>

        <div className="flex items-center gap-3 mt-3 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <FiStar className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
            <span className="font-semibold text-gray-700 dark:text-gray-300">{rating?.average?.toFixed(1) || '4.0'}</span>
            <span>({rating?.count || 0})</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1">
            <FiClock className="w-3.5 h-3.5" />
            <span>{deliveryInfo?.estimatedTime || '30-45 min'}</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1">
            <FiTruck className="w-3.5 h-3.5" />
            <span>{deliveryInfo?.deliveryFee === 0 ? 'Free' : `₹${deliveryInfo?.deliveryFee}`}</span>
          </div>
        </div>

        {deliveryInfo?.minOrder > 0 && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            Min. order: ₹{deliveryInfo.minOrder}
          </p>
        )}
      </div>
    </Link>
  );
};

export default RestaurantCard;
