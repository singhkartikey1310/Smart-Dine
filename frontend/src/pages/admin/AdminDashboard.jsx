import { useEffect, useState } from 'react';
import { FiUsers, FiShoppingBag, FiPackage, FiDollarSign, FiTrendingUp } from 'react-icons/fi';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import api from '../../api/axios';
import OrderStatusBadge from '../../components/orders/OrderStatusBadge';

const StatCard = ({ title, value, icon: Icon, color, change }) => (
  <div className="card p-6">
    <div className="flex items-center justify-between mb-4">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      {change !== undefined && (
        <span className={`text-sm font-medium flex items-center gap-1 ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          <FiTrendingUp className={`w-3.5 h-3.5 ${change < 0 ? 'rotate-180' : ''}`} />
          {Math.abs(change)}%
        </span>
      )}
    </div>
    <p className="text-2xl font-display font-bold text-gray-900 dark:text-white">{value}</p>
    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{title}</p>
  </div>
);

const STATUS_COLORS = {
  pending: '#f59e0b',
  accepted: '#3b82f6',
  preparing: '#f97316',
  out_for_delivery: '#8b5cf6',
  delivered: '#10b981',
  cancelled: '#ef4444',
};

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/stats')
      .then(({ data }) => setStats(data.stats))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array(4).fill(0).map((_, i) => <div key={i} className="h-32 shimmer rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-72 shimmer rounded-2xl" />
          <div className="h-72 shimmer rounded-2xl" />
        </div>
      </div>
    );
  }

  const monthlyData = stats?.monthlyRevenue?.map((m) => ({
    name: new Date(2024, m._id.month - 1).toLocaleString('default', { month: 'short' }),
    revenue: Math.round(m.revenue),
    orders: m.orders,
  })) || [];

  const statusData = stats?.ordersByStatus?.map((s) => ({
    name: s._id?.replace(/_/g, ' '),
    value: s.count,
    color: STATUS_COLORS[s._id] || '#6b7280',
  })) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Welcome back! Here's what's happening.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Users" value={stats?.totalUsers?.toLocaleString() || 0} icon={FiUsers} color="bg-blue-500" />
        <StatCard title="Restaurants" value={stats?.totalRestaurants?.toLocaleString() || 0} icon={FiShoppingBag} color="bg-purple-500" />
        <StatCard title="Total Orders" value={stats?.totalOrders?.toLocaleString() || 0} icon={FiPackage} color="bg-orange-500" />
        <StatCard title="Total Revenue" value={`₹${(stats?.totalRevenue || 0).toLocaleString()}`} icon={FiDollarSign} color="bg-green-500" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Monthly Revenue</h2>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => [`₹${v.toLocaleString()}`, 'Revenue']} />
              <Line type="monotone" dataKey="revenue" stroke="#FF6B35" strokeWidth={2.5} dot={{ fill: '#FF6B35', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Orders by Status */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Orders by Status</h2>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                {statusData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend formatter={(v) => <span className="text-xs capitalize">{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Orders Chart */}
      <div className="card p-6">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Monthly Orders</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="orders" fill="#FF6B35" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Recent Orders</h2>
          <div className="space-y-3">
            {stats?.recentOrders?.slice(0, 6).map((order) => (
              <div key={order._id} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-dark-border last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">#{order.orderNumber}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{order.user?.name}</p>
                </div>
                <div className="text-right">
                  <OrderStatusBadge status={order.status} />
                  <p className="text-sm font-bold text-gray-900 dark:text-white mt-1">₹{order.total}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Popular Foods */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Popular Foods</h2>
          <div className="space-y-3">
            {stats?.popularFoods?.slice(0, 6).map((food, i) => (
              <div key={food._id} className="flex items-center gap-3">
                <span className="w-6 h-6 bg-primary-100 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center text-xs font-bold">
                  {i + 1}
                </span>
                {food.image?.url && (
                  <img src={food.image.url} alt={food.name} className="w-9 h-9 rounded-lg object-cover" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{food.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{food.restaurant?.name}</p>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">{food.totalOrders} orders</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
