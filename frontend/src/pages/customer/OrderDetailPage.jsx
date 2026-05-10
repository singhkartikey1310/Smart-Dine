import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiMapPin, FiPhone, FiDownload, FiArrowLeft } from 'react-icons/fi';
import { fetchOrder, cancelOrder } from '../../redux/slices/orderSlice';
import OrderStatusBadge from '../../components/orders/OrderStatusBadge';
import OrderTracker from '../../components/orders/OrderTracker';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const OrderDetailPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { current: order, loading } = useSelector((state) => state.order);

  useEffect(() => {
    dispatch(fetchOrder(id));
  }, [id, dispatch]);

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    dispatch(cancelOrder({ id, reason: 'Cancelled by customer' }));
  };

  const handleDownloadInvoice = async () => {
    try {
      const { data } = await api.get(`/payments/invoice/${id}`);
      const blob = new Blob([data.invoice], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${order.orderNumber}.html`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to download invoice');
    }
  };

  if (loading || !order) {
    return (
      <div className="page-container py-8">
        <div className="space-y-4">
          {Array(4).fill(0).map((_, i) => <div key={i} className="h-32 shimmer rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="page-container py-8">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/orders" className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-card transition-colors">
          <FiArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="section-title">Order #{order.orderNumber}</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
            Placed on {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <OrderStatusBadge status={order.status} />
          {order.paymentStatus === 'paid' && (
            <button onClick={handleDownloadInvoice} className="btn-secondary text-sm flex items-center gap-2">
              <FiDownload className="w-4 h-4" /> Invoice
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Order Tracker */}
          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Order Status</h2>
            <OrderTracker status={order.status} statusHistory={order.statusHistory} />
          </div>

          {/* Items */}
          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Order Items</h2>
            <div className="space-y-3">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-50 dark:border-dark-border last:border-0">
                  {item.image && (
                    <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white text-sm">{item.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">₹{item.price} × {item.quantity}</p>
                  </div>
                  <p className="font-semibold text-gray-900 dark:text-white">₹{item.price * item.quantity}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Address */}
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-3">
              <FiMapPin className="w-4 h-4 text-primary-500" />
              <h2 className="font-semibold text-gray-900 dark:text-white">Delivery Address</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {order.deliveryAddress.street}, {order.deliveryAddress.city},<br />
              {order.deliveryAddress.state} - {order.deliveryAddress.pincode}
            </p>
          </div>
        </div>

        {/* Right - Summary */}
        <div className="space-y-4">
          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Payment Summary</h2>
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>Subtotal</span><span>₹{order.subtotal}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>Tax</span><span>₹{order.tax}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>Delivery Fee</span><span>₹{order.deliveryFee}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span><span>-₹{order.discount}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-gray-900 dark:text-white pt-2 border-t border-gray-100 dark:border-dark-border">
                <span>Total</span><span>₹{order.total}</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-dark-border">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Payment Method</span>
                <span className="font-medium text-gray-900 dark:text-white capitalize">{order.paymentMethod}</span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-gray-500 dark:text-gray-400">Payment Status</span>
                <span className={`font-medium capitalize ${order.paymentStatus === 'paid' ? 'text-green-500' : 'text-yellow-500'}`}>
                  {order.paymentStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Restaurant Info */}
          {order.restaurant && (
            <div className="card p-6">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-3">Restaurant</h2>
              <div className="flex items-center gap-3">
                {order.restaurant.logo?.url && (
                  <img src={order.restaurant.logo.url} alt={order.restaurant.name} className="w-12 h-12 rounded-xl object-cover" />
                )}
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{order.restaurant.name}</p>
                  {order.restaurant.contact?.phone && (
                    <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                      <FiPhone className="w-3.5 h-3.5" />
                      <span>{order.restaurant.contact.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Cancel Button */}
          {['pending', 'accepted'].includes(order.status) && (
            <button onClick={handleCancel} className="w-full py-3 rounded-xl border-2 border-red-300 text-red-500 font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
              Cancel Order
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;
