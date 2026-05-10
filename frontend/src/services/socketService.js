import { io } from 'socket.io-client';
import { store } from '../redux/store';
import { addNotification } from '../redux/slices/notificationSlice';
import { updateOrderStatus } from '../redux/slices/orderSlice';
import toast from 'react-hot-toast';

let socket = null;

export const initSocket = (token) => {
  if (socket?.connected) return socket;

  socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    console.log('🔌 Socket connected:', socket.id);
  });

  socket.on('disconnect', () => {
    console.log('🔌 Socket disconnected');
  });

  // Order updates
  socket.on('order_update', (data) => {
    store.dispatch(updateOrderStatus({ orderId: data.orderId, status: data.status }));
    store.dispatch(addNotification({
      _id: Date.now().toString(),
      title: 'Order Update',
      message: `Order #${data.orderNumber} is now ${data.status.replace(/_/g, ' ')}`,
      type: 'order',
      isRead: false,
      createdAt: new Date().toISOString(),
    }));
    toast.success(`Order ${data.status.replace(/_/g, ' ')}!`);
  });

  // New order (for restaurant admins)
  socket.on('new_order', (data) => {
    toast.success(`New order #${data.orderNumber} received!`);
  });

  // Payment received
  socket.on('payment_received', (data) => {
    toast.success(`Payment received for order #${data.orderNumber}`);
  });

  socket.on('connect_error', (err) => {
    console.error('Socket connection error:', err.message);
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const joinRestaurantRoom = (restaurantId) => {
  if (socket) {
    socket.emit('join_restaurant', restaurantId);
  }
};

export const trackOrder = (orderId) => {
  if (socket) {
    socket.emit('track_order', orderId);
  }
};

export const leaveOrderTracking = (orderId) => {
  if (socket) {
    socket.emit('leave_order', orderId);
  }
};
