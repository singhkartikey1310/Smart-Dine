import { useEffect, useState } from 'react';
import { FiCheck, FiX, FiStar, FiEye } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const AdminRestaurants = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState('all'); // all, pending, approved

  const fetchRestaurants = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter === 'pending') params.isApproved = false;
      if (filter === 'approved') params.isApproved = true;
      const { data } = await api.get('/admin/restaurants', { params });
      setRestaurants(data.restaurants);
      setTotal(data.total);
    } catch {
      toast.error('Failed to load restaurants');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRestaurants(); }, [filter]);

  const handleApprove = async (id, isApproved) => {
    try {
      await api.put(`/restaurants/${id}/approve`, { isApproved });
      toast.success(`Restaurant ${isApproved ? 'approved' : 'rejected'}`);
      fetchRestaurants();
    } catch {
      toast.error('Failed to update restaurant');
    }
  };

  const handleFeature = async (id, isFeatured) => {
    try {
      await api.put(`/restaurants/${id}`, { isFeatured });
      toast.success(`Restaurant ${isFeatured ? 'featured' : 'unfeatured'}`);
      fetchRestaurants();
    } catch {
      toast.error('Failed to update');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-gray-900 dark:text-white">Restaurants</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{total} total restaurants</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {['all', 'pending', 'approved'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-all ${
              filter === f ? 'bg-primary-500 text-white' : 'bg-white dark:bg-dark-card text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-dark-border'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-dark-bg border-b border-gray-100 dark:border-dark-border">
              <tr>
                {['Restaurant', 'Owner', 'City', 'Rating', 'Orders', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-dark-border">
              {loading ? (
                Array(6).fill(0).map((_, i) => (
                  <tr key={i}>{Array(7).fill(0).map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 shimmer rounded" /></td>)}</tr>
                ))
              ) : restaurants.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400 dark:text-gray-500">No restaurants found</td></tr>
              ) : (
                restaurants.map((r) => (
                  <tr key={r._id} className="hover:bg-gray-50 dark:hover:bg-dark-bg transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {r.logo?.url ? (
                          <img src={r.logo.url} alt={r.name} className="w-9 h-9 rounded-lg object-cover" />
                        ) : (
                          <div className="w-9 h-9 bg-primary-100 dark:bg-primary-900/20 rounded-lg flex items-center justify-center text-lg">🍽️</div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{r.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{r.cuisines?.slice(0, 2).join(', ')}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{r.owner?.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{r.address?.city}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-sm">
                        <FiStar className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                        <span className="font-medium">{r.rating?.average?.toFixed(1) || '—'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{r.totalOrders}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${r.isApproved ? 'badge-green' : 'badge-yellow'}`}>
                        {r.isApproved ? 'Approved' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Link to={`/restaurants/${r._id}`} className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                          <FiEye className="w-4 h-4" />
                        </Link>
                        {!r.isApproved ? (
                          <button onClick={() => handleApprove(r._id, true)} className="p-1.5 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors">
                            <FiCheck className="w-4 h-4" />
                          </button>
                        ) : (
                          <button onClick={() => handleApprove(r._id, false)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                            <FiX className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleFeature(r._id, !r.isFeatured)}
                          className={`p-1.5 rounded-lg transition-colors ${r.isFeatured ? 'text-yellow-500 hover:bg-yellow-50' : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-bg'}`}
                          title={r.isFeatured ? 'Unfeature' : 'Feature'}
                        >
                          <FiStar className={`w-4 h-4 ${r.isFeatured ? 'fill-yellow-400' : ''}`} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminRestaurants;
