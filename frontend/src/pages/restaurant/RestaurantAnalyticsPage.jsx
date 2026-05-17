import { useEffect, useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { FiStar, FiTrendingUp, FiShoppingBag, FiDollarSign, FiAlertTriangle, FiPackage } from 'react-icons/fi';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  pending: '#f59e0b', accepted: '#3b82f6', preparing: '#f97316',
  out_for_delivery: '#8b5cf6', delivered: '#10b981', cancelled: '#ef4444',
};

const CHART_COLORS = ['#FF6B35', '#F7931E', '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4'];

const StatCard = ({ icon: Icon, label, value, sub, color }) => (
  <div className="card p-5">
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 ${color}`}>
      <Icon className="w-5 h-5 text-white" />
    </div>
    <p className="font-display font-bold text-2xl text-gray-900 dark:text-white">{value}</p>
    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
    {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{sub}</p>}
  </div>
);

const FoodRow = ({ food, rank, showRating = false, showOrders = false, highlight }) => (
  <div className={`flex items-center gap-3 p-3 rounded-xl ${highlight ? 'bg-red-50 dark:bg-red-900/10' : 'hover:bg-gray-50 dark:hover:bg-dark-bg'} transition-colors`}>
    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
      rank === 1 ? 'bg-yellow-400 text-white' :
      rank === 2 ? 'bg-gray-300 text-gray-700' :
      rank === 3 ? 'bg-amber-600 text-white' :
      'bg-gray-100 dark:bg-dark-bg text-gray-500'
    }`}>
      {rank}
    </span>
    {food.image?.url && (
      <img src={food.image.url} alt={food.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
    )}
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{food.name}</p>
      <p className="text-xs text-gray-400 dark:text-gray-500">{food.category?.name}</p>
    </div>
    <div className="text-right flex-shrink-0">
      {showRating && (
        <div className="flex items-center gap-1 justify-end">
          <FiStar className={`w-3.5 h-3.5 ${highlight ? 'text-red-400' : 'text-yellow-400 fill-yellow-400'}`} />
          <span className={`text-sm font-bold ${highlight ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
            {food.rating?.average?.toFixed(1) || '—'}
          </span>
          <span className="text-xs text-gray-400">({food.rating?.count})</span>
        </div>
      )}
      {showOrders && (
        <p className="text-sm font-bold text-primary-500">{food.totalOrders} orders</p>
      )}
      <p className="text-xs text-gray-400">₹{food.price}</p>
    </div>
  </div>
);

const RestaurantAnalyticsPage = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    setLoading(true);
    api.get('/restaurants/my/analytics', { params: { days } })
      .then(({ data }) => setAnalytics(data.analytics))
      .catch(() => toast.error('Failed to load analytics'))
      .finally(() => setLoading(false));
  }, [days]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 shimmer rounded w-1/3" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array(4).fill(0).map((_, i) => <div key={i} className="h-28 shimmer rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array(4).fill(0).map((_, i) => <div key={i} className="h-72 shimmer rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  const { summary, charts, foods, recentOrders, recentReviews } = analytics;

  const statusData = charts.ordersByStatus.map((s) => ({
    name: s._id?.replace(/_/g, ' '),
    value: s.count,
    color: STATUS_COLORS[s._id] || '#6b7280',
  }));

  const ratingData = [5, 4, 3, 2, 1].map((star) => ({
    star: `${star}★`,
    count: charts.ratingDistribution.find((r) => r._id === star)?.count || 0,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-gray-900 dark:text-white">Food Analytics</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Performance insights for your restaurant</p>
        </div>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="input-field w-40"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FiPackage} label="Total Orders" value={summary.totalOrders.toLocaleString()} color="bg-blue-500" />
        <StatCard icon={FiDollarSign} label="Total Revenue" value={`₹${summary.totalRevenue.toLocaleString()}`} color="bg-green-500" />
        <StatCard icon={FiStar} label="Avg Rating" value={summary.avgRating?.toFixed(1) || '—'} sub={`${summary.totalReviews} reviews`} color="bg-yellow-500" />
        <StatCard icon={FiShoppingBag} label="Menu Items" value={summary.totalFoods} sub={`${summary.availableFoods} available`} color="bg-primary-500" />
      </div>

      {/* Alerts */}
      {(foods.outOfStock.length > 0 || foods.lowStock.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {foods.outOfStock.length > 0 && (
            <div className="card p-4 border-2 border-red-200 dark:border-red-800/40 bg-red-50 dark:bg-red-900/10">
              <div className="flex items-center gap-2 mb-2">
                <FiAlertTriangle className="w-4 h-4 text-red-500" />
                <span className="font-semibold text-red-600 dark:text-red-400 text-sm">Out of Stock ({foods.outOfStock.length})</span>
              </div>
              <div className="space-y-1">
                {foods.outOfStock.slice(0, 3).map((f) => (
                  <p key={f._id} className="text-xs text-red-600 dark:text-red-400">• {f.name}</p>
                ))}
                {foods.outOfStock.length > 3 && <p className="text-xs text-red-400">+{foods.outOfStock.length - 3} more</p>}
              </div>
            </div>
          )}
          {foods.lowStock.length > 0 && (
            <div className="card p-4 border-2 border-yellow-200 dark:border-yellow-800/40 bg-yellow-50 dark:bg-yellow-900/10">
              <div className="flex items-center gap-2 mb-2">
                <FiAlertTriangle className="w-4 h-4 text-yellow-500" />
                <span className="font-semibold text-yellow-600 dark:text-yellow-400 text-sm">Low Stock ({foods.lowStock.length})</span>
              </div>
              <div className="space-y-1">
                {foods.lowStock.slice(0, 3).map((f) => (
                  <p key={f._id} className="text-xs text-yellow-600 dark:text-yellow-400">• {f.name} — {f.stock} left</p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily orders chart */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">📈 Daily Orders & Revenue</h2>
          {charts.dailyOrders.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No order data for this period</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={charts.dailyOrders}>
                <defs>
                  <linearGradient id="ordersGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF6B35" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#FF6B35" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="_id" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v, n) => [n === 'revenue' ? `₹${v}` : v, n === 'revenue' ? 'Revenue' : 'Orders']} />
                <Area type="monotone" dataKey="orders" stroke="#FF6B35" strokeWidth={2} fill="url(#ordersGrad)" name="orders" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Orders by status pie */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">🥧 Orders by Status</h2>
          {statusData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No orders yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                  {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v, n) => [v, n]} />
                <Legend formatter={(v) => <span className="text-xs capitalize">{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category breakdown */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">🍽️ Orders by Category</h2>
          {charts.categoryBreakdown.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={charts.categoryBreakdown} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="_id" type="category" tick={{ fontSize: 11 }} width={80} />
                <Tooltip />
                <Bar dataKey="orders" radius={[0, 6, 6, 0]}>
                  {charts.categoryBreakdown.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Rating distribution */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">⭐ Rating Distribution</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={ratingData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="star" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {ratingData.map((entry, i) => (
                  <Cell key={i} fill={entry.star.startsWith('5') || entry.star.startsWith('4') ? '#10b981' : entry.star.startsWith('3') ? '#f59e0b' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Food performance tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Most ordered */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            🔥 Most Ordered
          </h2>
          {foods.topOrdered.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No orders yet</p>
          ) : (
            <div className="space-y-2">
              {foods.topOrdered.map((food, i) => (
                <FoodRow key={food._id} food={food} rank={i + 1} showOrders />
              ))}
            </div>
          )}
        </div>

        {/* Highest rated */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            ⭐ Highest Rated
          </h2>
          {foods.highestRated.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Need at least 2 reviews per dish</p>
          ) : (
            <div className="space-y-2">
              {foods.highestRated.map((food, i) => (
                <FoodRow key={food._id} food={food} rank={i + 1} showRating />
              ))}
            </div>
          )}
        </div>

        {/* Lowest rated */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            ⚠️ Needs Improvement
          </h2>
          {foods.lowestRated.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Need at least 2 reviews per dish</p>
          ) : (
            <div className="space-y-2">
              {foods.lowestRated.map((food, i) => (
                <FoodRow key={food._id} food={food} rank={i + 1} showRating highlight />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Zero orders + Recent reviews */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Not selling */}
        {foods.zeroOrders.length > 0 && (
          <div className="card p-5">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FiTrendingUp className="w-4 h-4 text-gray-400 rotate-180" />
              Not Selling (0 orders)
            </h2>
            <div className="space-y-2">
              {foods.zeroOrders.map((food, i) => (
                <div key={food._id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-bg">
                  {food.image?.url && <img src={food.image.url} alt={food.name} className="w-9 h-9 rounded-lg object-cover" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{food.name}</p>
                    <p className="text-xs text-gray-400">{food.category?.name} • ₹{food.price}</p>
                  </div>
                  <span className="badge-yellow text-xs">0 orders</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent reviews */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">💬 Recent Reviews</h2>
          {recentReviews.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No reviews yet</p>
          ) : (
            <div className="space-y-3">
              {recentReviews.map((review) => (
                <div key={review._id} className="flex gap-3 p-3 bg-gray-50 dark:bg-dark-bg rounded-xl">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {review.user?.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-gray-900 dark:text-white">{review.user?.name}</p>
                      <div className="flex items-center gap-0.5">
                        {[1,2,3,4,5].map((s) => (
                          <FiStar key={s} className={`w-3 h-3 ${s <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                        ))}
                      </div>
                    </div>
                    {review.comment && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{review.comment}</p>}
                    <p className="text-xs text-gray-400 mt-1">{new Date(review.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent orders */}
      <div className="card p-5">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-4">📦 Recent Orders</h2>
        {recentOrders.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No orders yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-dark-border">
                  {['Order #', 'Customer', 'Items', 'Total', 'Status', 'Date'].map((h) => (
                    <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-dark-border">
                {recentOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50 dark:hover:bg-dark-bg transition-colors">
                    <td className="px-3 py-2.5 text-xs font-mono text-gray-600 dark:text-gray-400">#{order.orderNumber}</td>
                    <td className="px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300">{order.user?.name}</td>
                    <td className="px-3 py-2.5 text-xs text-gray-500 dark:text-gray-400">{order.items?.length} items</td>
                    <td className="px-3 py-2.5 text-sm font-semibold text-gray-900 dark:text-white">₹{order.total}</td>
                    <td className="px-3 py-2.5">
                      <span className={`badge text-xs capitalize ${
                        order.status === 'delivered' ? 'badge-green' :
                        order.status === 'cancelled' ? 'badge-red' :
                        order.status === 'pending' ? 'badge-yellow' : 'badge-blue'
                      }`}>
                        {order.status?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default RestaurantAnalyticsPage;
