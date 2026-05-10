import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { FiPackage, FiChevronRight } from 'react-icons/fi';
import { fetchMyOrders } from '../../redux/slices/orderSlice';
import OrderStatusBadge from '../../components/orders/OrderStatusBadge';
import Pagination from '../../components/common/Pagination';

const STATUSES = ['all', 'pending', 'accepted', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];

const OrdersPage = () => {
  const dispatch = useDispatch();
  const { orders, loading, total, totalPages } = useSelector((state) => state.order);
  const [filters, setFilters] = useState({ status: '', page: 1 });

  useEffect(() => {
    const params = { page: filters.page };
    if (filters.status && filters.status !== 'all') params.status = filters.status;
    dispatch(fetchMyOrders(params));
  }, [filters, dispatch]);

  return (
    <div className="page-container py-8">
      <h1 className="section-title mb-6">My Orders</h1>

      {/* Status Filter */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 mb-6">
        {STATUSES.map((status) => (
          <button
            key={status}
            onClick={() => setFilters({ status, page: 1 })}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium capitalize transition-all ${
              filters.status === status || (status === 'all' && !filters.status)
                ? 'bg-primary-500 text-white'
                : 'bg-white dark:bg-dark-card text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-dark-border hover:border-primary-300'
            }`}
          >
            {status === 'all' ? 'All Orders' : status.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="card p-5 space-y-3">
              <div className="flex justify-between">
                <div className="h-4 shimmer rounded w-1/4" />
                <div className="h-4 shimmer rounded w-1/6" />
              </div>
              <div className="h-3 shimmer rounded w-1/3" />
              <div className="h-3 shimmer rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20">
          <FiPackage className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400">No orders yet</h3>
          <p className="text-gray-400 dark:text-gray-500 mt-2">Start ordering from your favorite restaurants!</p>
          <Link to="/restaurants" className="btn-primary mt-6 inline-block">Browse Restaurants</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link key={order._id} to={`/orders/${order._id}`} className="card p-5 block hover:shadow-card-hover transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-4">
                  {order.restaurant?.logo?.url ? (
                    <img src={order.restaurant.logo.url} alt={order.restaurant.name} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-14 h-14 bg-primary-100 dark:bg-primary-900/20 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">🍽️</div>
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{order.restaurant?.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                      {order.items.slice(0, 2).map((i) => i.name).join(', ')}
                      {order.items.length > 2 && ` +${order.items.length - 2} more`}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      #{order.orderNumber} • {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <OrderStatusBadge status={order.status} />
                  <p className="font-bold text-gray-900 dark:text-white">₹{order.total}</p>
                  <FiChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

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

export default OrdersPage;
