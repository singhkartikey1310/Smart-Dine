const mongoose = require('mongoose');

let retryTimer = null;

const connectDB = async () => {
  // Clear any pending retry
  if (retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }

  try {
    mongoose.set('strictQuery', false);

    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });

    console.log(`✅ MongoDB Connected: ${mongoose.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);

    if (error.message.includes('<db_password>')) {
      console.error('');
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('  ACTION REQUIRED: Replace <db_password> in .env    ');
      console.error('  with your actual MongoDB Atlas password.           ');
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('');
      return; // Don't retry — user must fix the config
    }

    console.log('🔄 Retrying MongoDB connection in 5 seconds...');
    retryTimer = setTimeout(connectDB, 5000);
  }
};

// Only reconnect on unexpected disconnects (not on intentional close)
mongoose.connection.on('disconnected', () => {
  if (mongoose.connection.readyState !== 3) { // 3 = disconnecting (intentional)
    console.warn('⚠️  MongoDB disconnected unexpectedly. Reconnecting...');
    retryTimer = setTimeout(connectDB, 3000);
  }
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB runtime error:', err.message);
});

module.exports = connectDB;
