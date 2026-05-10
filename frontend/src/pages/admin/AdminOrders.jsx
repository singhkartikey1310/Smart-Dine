import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { FiSearch, FiEye } from 'react-icons/fi';
import api from '../../api/axios';
import OrderStatusBadge from '../../components/orders/OrderStatusBadge';
import toast from 'react-hot-toast';

const STATUSES = ['all', 'pending', 'accepted', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];

const AdminOrders = () => {
  const { user } = useSelector((state) => state.auth);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', page: 1, keyword: '' });
  const [total, setTotal] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const endpoint = user?.role === 'super_admin' ? '/orders/all' : '/orders/restaurant';

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = { page: filters.page };
      if (filters.status && filters.status !== 'all') params.status = filters.status;
      const { data } = await api.get(endpoint, { params });
      setOrders(data.orders);
      setTotal(data.total);
    } catch (err) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, [filters.status, filters.page]);

  const handleStatusUpdate = async (orderId, status) => {
    setUpdatingStatus(true);
    try {
      await api.put(`/orders/${orderId}/status`, { status });
      toast.success('Order status updated');
      fetchOrders();
      setSelectedOrder(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const NEXT_STATUS = {
    pending: 'accepted',
    accepted: 'preparing',
    preparing: 'out_for_delivery',
    out_for_delivery: 'delivered',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-gray-900 dark:text-white">Orders</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{total} total orders</p>
        </div>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {STATUSES.map((status) => (
          <button
            key={status}
            onClick={() => setFilters((p) => ({ ...p, status, page: 1 }))}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium capitalize transition-all ${
              filters.status === status || (status === 'all' && !filters.status)
                ? 'bg-primary-500 text-white'
                : 'bg-white dark:bg-dark-card text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-dark-border hover:border-primary-300'
            }`}
          >
            {status === 'all' ? 'All' : status.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-dark-bg border-b border-gray-100 dark:border-dark-border">
              <tr>
                {['Order #', 'Customer', 'Restaurant', 'Items', 'Total', 'Status', 'Date', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-dark-border">
              {loading ? (
                Array(8).fill(0).map((_, i) => (
                  <tr key={i}>
                    {Array(8).fill(0).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 shimmer rounded" /></td>
                    ))}
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-400 dark:text-gray-500">
                    No orders found
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50 dark:hover:bg-dark-bg transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">#{order.orderNumber}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{order.user?.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{order.restaurant?.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{order.items?.length} items</td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">₹{order.total}</td>
                    <td className="px-4 py-3"><OrderStatusBadge status={order.status} /></td>
                    <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        >
                          <FiEye className="w-4 h-4" />
                        </button>
                        {NEXT_STATUS[order.status] && (
                          <button
                            onClick={() => handleStatusUpdate(order._id, NEXT_STATUS[order.status])}
                            disabled={updatingStatus}
                            className="text-xs px-2 py-1 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
                          >
                            → {NEXT_STATUS[order.status].replace(/_/g, ' ')}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedOrder(null)}>
          <div className="bg-white dark:bg-dark-card rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900 dark:text-white">Order #{selectedOrder.orderNumber}</h2>
              <OrderStatusBadge status={selectedOrder.status} />
            </div>
            <div className="space-y-3 mb-4">
              {selectedOrder.items?.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">{item.name} × {item.quantity}</span>
                  <span className="font-medium">₹{item.price * item.quantity}</span>
                </div>
              ))}
              <div className="border-t border-gray-100 dark:border-dark-border pt-2 flex justify-between font-bold">
                <span>Total</span><span>₹{selectedOrder.total}</span>
              </div>
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                <strong>Address:</strong> {selectedOrder.deliveryAddress?.street}, {selectedOrder.deliveryAddress?.city}
              </p>
              {selectedOrder.specialInstructions && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  <strong>Note:</strong> {selectedOrder.specialInstructions}
                </p>
              )}
            </div>
            {NEXT_STATUS[selectedOrder.status] && (
              <button
                onClick={() => handleStatusUpdate(selectedOrder._id, NEXT_STATUS[selectedOrder.status])}
                disabled={updatingStatus}
                className="btn-primary w-full"
              >
                Mark as {NEXT_STATUS[selectedOrder.status].replace(/_/g, ' ')}
              </button>
            )}
            {selectedOrder.status === 'pending' && (
              <button
                onClick={() => handleStatusUpdate(selectedOrder._id, 'cancelled')}
                className="w-full mt-2 py-2.5 rounded-xl border-2 border-red-300 text-red-500 font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm"
              >
                Cancel Order
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
