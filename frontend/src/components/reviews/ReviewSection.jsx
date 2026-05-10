import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { FiStar, FiThumbsUp } from 'react-icons/fi';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const StarRating = ({ rating, onRate, size = 'md' }) => {
  const [hover, setHover] = useState(0);
  const sizeClass = size === 'sm' ? 'w-4 h-4' : 'w-6 h-6';

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onRate && onRate(star)}
          onMouseEnter={() => onRate && setHover(star)}
          onMouseLeave={() => onRate && setHover(0)}
          className={`${sizeClass} transition-colors ${
            star <= (hover || rating) ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'
          }`}
        >
          <FiStar className={`${sizeClass} ${star <= (hover || rating) ? 'fill-yellow-400' : ''}`} />
        </button>
      ))}
    </div>
  );
};

const ReviewSection = ({ restaurantId, foodId }) => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [reviews, setReviews] = useState([]);
  const [total, setTotal] = useState(0);
  const [breakdown, setBreakdown] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ rating: 0, title: '', comment: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const params = restaurantId ? { restaurant: restaurantId } : { food: foodId };
      const { data } = await api.get('/reviews', { params });
      setReviews(data.reviews);
      setTotal(data.total);
      setBreakdown(data.breakdown);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReviews(); }, [restaurantId, foodId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.rating === 0) { toast.error('Please select a rating'); return; }
    setSubmitting(true);
    try {
      await api.post('/reviews', {
        restaurantId,
        foodId,
        rating: form.rating,
        title: form.title,
        comment: form.comment,
      });
      toast.success('Review submitted!');
      setForm({ rating: 0, title: '', comment: '' });
      setShowForm(false);
      fetchReviews();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="section-title">Reviews & Ratings</h2>
        {isAuthenticated && (
          <button onClick={() => setShowForm(!showForm)} className="btn-outline text-sm">
            {showForm ? 'Cancel' : 'Write a Review'}
          </button>
        )}
      </div>

      {/* Rating Summary */}
      {total > 0 && (
        <div className="card p-6 mb-6 flex flex-col sm:flex-row gap-6 items-center">
          <div className="text-center">
            <div className="font-display font-bold text-5xl text-gray-900 dark:text-white">{avgRating}</div>
            <StarRating rating={Math.round(avgRating)} size="sm" />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{total} reviews</p>
          </div>
          <div className="flex-1 w-full space-y-2">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = breakdown.find((b) => b._id === star)?.count || 0;
              const pct = total > 0 ? (count / total) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-3">
                  <span className="text-sm text-gray-500 w-3">{star}</span>
                  <FiStar className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                  <div className="flex-1 h-2 bg-gray-100 dark:bg-dark-bg rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-gray-400 w-6">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Review Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="card p-6 mb-6 animate-slide-down">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Your Review</h3>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Rating *</label>
            <StarRating rating={form.rating} onRate={(r) => setForm((p) => ({ ...p, rating: r }))} />
          </div>
          <div className="mb-4">
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="Review title (optional)"
              className="input-field"
            />
          </div>
          <div className="mb-4">
            <textarea
              value={form.comment}
              onChange={(e) => setForm((p) => ({ ...p, comment: e.target.value }))}
              placeholder="Share your experience..."
              rows={4}
              className="input-field resize-none"
            />
          </div>
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </form>
      )}

      {/* Reviews List */}
      {loading ? (
        <div className="space-y-4">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="card p-4 space-y-3">
              <div className="flex gap-3">
                <div className="w-10 h-10 shimmer rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 shimmer rounded w-1/4" />
                  <div className="h-3 shimmer rounded w-1/3" />
                </div>
              </div>
              <div className="h-3 shimmer rounded" />
              <div className="h-3 shimmer rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12 text-gray-400 dark:text-gray-500">
          <FiStar className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No reviews yet. Be the first to review!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review._id} className="card p-5">
              <div className="flex items-start gap-3">
                {review.user?.avatar?.url ? (
                  <img src={review.user.avatar.url} alt={review.user.name} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {review.user?.name?.[0]?.toUpperCase()}
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">{review.user?.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <StarRating rating={review.rating} size="sm" />
                        {review.isVerifiedPurchase && (
                          <span className="badge-green text-xs">✓ Verified</span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {review.title && (
                    <p className="font-medium text-gray-800 dark:text-gray-200 mt-2 text-sm">{review.title}</p>
                  )}
                  {review.comment && (
                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-1 leading-relaxed">{review.comment}</p>
                  )}
                  {review.images?.length > 0 && (
                    <div className="flex gap-2 mt-3">
                      {review.images.map((img, i) => (
                        <img key={i} src={img.url} alt="Review" className="w-16 h-16 rounded-lg object-cover" />
                      ))}
                    </div>
                  )}
                  {review.reply?.text && (
                    <div className="mt-3 p-3 bg-gray-50 dark:bg-dark-bg rounded-xl border-l-4 border-primary-500">
                      <p className="text-xs font-semibold text-primary-600 dark:text-primary-400 mb-1">Restaurant Reply</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{review.reply.text}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewSection;
