const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
    },
    food: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Food',
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: 1,
      max: 5,
    },
    title: {
      type: String,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    comment: {
      type: String,
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
    },
    images: [
      {
        public_id: String,
        url: String,
      },
    ],
    isVerifiedPurchase: { type: Boolean, default: false },
    isApproved: { type: Boolean, default: true },
    helpfulVotes: { type: Number, default: 0 },
    aiSummary: String,
    reply: {
      text: String,
      repliedAt: Date,
      repliedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    },
  },
  { timestamps: true }
);

// Prevent duplicate reviews
reviewSchema.index({ user: 1, food: 1 }, { unique: true, sparse: true });
reviewSchema.index({ user: 1, restaurant: 1, order: 1 }, { unique: true, sparse: true });

// Update food/restaurant rating after review save
reviewSchema.post('save', async function () {
  await updateRatings(this);
});

reviewSchema.post('remove', async function () {
  await updateRatings(this);
});

async function updateRatings(review) {
  try {
    if (review.food) {
      const Food = mongoose.model('Food');
      const stats = await mongoose.model('Review').aggregate([
        { $match: { food: review.food } },
        { $group: { _id: '$food', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
      ]);
      if (stats.length > 0) {
        await Food.findByIdAndUpdate(review.food, {
          'rating.average': Math.round(stats[0].avgRating * 10) / 10,
          'rating.count': stats[0].count,
        });
      }
    }
    if (review.restaurant) {
      const Restaurant = mongoose.model('Restaurant');
      const stats = await mongoose.model('Review').aggregate([
        { $match: { restaurant: review.restaurant } },
        { $group: { _id: '$restaurant', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
      ]);
      if (stats.length > 0) {
        await Restaurant.findByIdAndUpdate(review.restaurant, {
          'rating.average': Math.round(stats[0].avgRating * 10) / 10,
          'rating.count': stats[0].count,
        });
      }
    }
  } catch (err) {
    console.error('Rating update error:', err);
  }
}

module.exports = mongoose.model('Review', reviewSchema);
