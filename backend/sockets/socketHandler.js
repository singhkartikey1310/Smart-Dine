const jwt = require('jsonwebtoken');
const User = require('../models/User');

const socketHandler = (io) => {
  // Auth middleware for sockets
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = await User.findById(decoded.id).select('-password');
      }
      next();
    } catch (err) {
      next(); // Allow unauthenticated connections
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // Join user room
    if (socket.user) {
      socket.join(`user_${socket.user._id}`);
      console.log(`👤 User ${socket.user.name} joined room user_${socket.user._id}`);

      // Join restaurant room for admins
      if (socket.user.role === 'restaurant_admin') {
        socket.on('join_restaurant', (restaurantId) => {
          socket.join(`restaurant_${restaurantId}`);
          console.log(`🏪 Admin joined restaurant room: ${restaurantId}`);
        });
      }
    }

    // Order tracking
    socket.on('track_order', (orderId) => {
      socket.join(`order_${orderId}`);
    });

    socket.on('leave_order', (orderId) => {
      socket.leave(`order_${orderId}`);
    });

    // Typing indicator for chat
    socket.on('typing', (data) => {
      socket.broadcast.emit('user_typing', data);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });
};

module.exports = socketHandler;
