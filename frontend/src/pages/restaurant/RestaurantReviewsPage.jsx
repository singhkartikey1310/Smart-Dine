import { useEffect, useState } from 'react';
import { FiStar, FiMessageSquare } from 'react-icons/fi';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const StarDisplay = ({ rating }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <FiStar key={s} className={`w-4 h-4 ${s <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} />
    ))}
  </div>
);

const RestaurantReviewsPage = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [restaurantId, setRestaurantId] = useState(null);
  const [replyText, setReplyText] = useState({});
  const [replyingTo, setReplyingTo] = useState(null);
  const [breakdown, setBreakdown] = useState([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const init = async () => {
      try {
        const { data: restData } = await api.get('/restaurants/my');
        const rid = restData.restaurant._id;
        setRestaurantId(rid);

        const { data } = await api.get('/reviews', { params: { restaurant: rid, limit: 50 } });
        setReviews(data.reviews);
        setBreakdown(data.breakdown);
        setTotal(data.total);
      } catch (err) {
        if (err.response?.status !== 404) toast.error('Failed to load reviews');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleReply = async (reviewId) => {
    const text = replyText[reviewId]?.trim();
    if (!text) { toast.error('Enter a reply'); return; }
    try {
      await api.post(`/reviews/${reviewId}/reply`, { text });
      toast.success('Reply posted');
      setReplyingTo(null);
      setReplyText((p) => ({ ...p, [reviewId]: '' }));
      // Refresh
      const { data } = await api.get('/reviews', { params: { restaurant: restaurantId, limit: 50 } });
      setReviews(data.reviews);
    } catch {
      toast.error('Failed to post reply');
    }
  };

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-gray-900 dark:text-white">Food Reviews</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Customer feedback for your restaurant</p>
      </div>

      {/* Rating summary */}
      {total > 0 && (
        <div className="card p-6 flex flex-col sm:flex-row gap-6 items-center">
          <div className="text-center">
            <div className="font-display font-bold text-5xl text-gray-900 dark:text-white">{avgRating}</div>
            <StarDisplay rating={Math.round(avgRating)} />
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

      {/* Reviews list */}
      {loading ? (
        <div className="space-y-4">
          {Array(4).fill(0).map((_, i) => <div key={i} className="h-32 shimmer rounded-2xl" />)}
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-20">
          <FiStar className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400">No reviews yet</h3>
          <p className="text-gray-400 dark:text-gray-500 mt-2">Reviews from customers will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review._id} className="card p-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {review.user?.name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">{review.user?.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <StarDisplay rating={review.rating} />
                        {review.isVerifiedPurchase && <span className="badge-green text-xs">✓ Verified</span>}
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {review.title && <p className="font-medium text-gray-800 dark:text-gray-200 mt-2 text-sm">{review.title}</p>}
                  {review.comment && <p className="text-gray-600 dark:text-gray-400 text-sm mt-1 leading-relaxed">{review.comment}</p>}

                  {review.images?.length > 0 && (
                    <div className="flex gap-2 mt-3">
                      {review.images.map((img, i) => (
                        <img key={i} src={img.url} alt="Review" className="w-16 h-16 rounded-lg object-cover" />
                      ))}
                    </div>
                  )}

                  {/* Existing reply */}
                  {review.reply?.text && (
                    <div className="mt-3 p-3 bg-primary-50 dark:bg-primary-900/10 rounded-xl border-l-4 border-primary-500">
                      <p className="text-xs font-semibold text-primary-600 dark:text-primary-400 mb-1">Your Reply</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{review.reply.text}</p>
                    </div>
                  )}

                  {/* Reply form */}
                  {!review.reply?.text && (
                    <div className="mt-3">
                      {replyingTo === review._id ? (
                        <div className="space-y-2">
                          <textarea
                            value={replyText[review._id] || ''}
                            onChange={(e) => setReplyText((p) => ({ ...p, [review._id]: e.target.value }))}
                            placeholder="Write a reply to this review..."
                            rows={2}
                            className="input-field resize-none text-sm"
                          />
                          <div className="flex gap-2">
                            <button onClick={() => handleReply(review._id)} className="btn-primary text-sm py-1.5 px-4">Post Reply</button>
                            <button onClick={() => setReplyingTo(null)} className="btn-secondary text-sm py-1.5 px-4">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setReplyingTo(review._id)}
                          className="flex items-center gap-1.5 text-xs text-primary-500 hover:text-primary-600 font-medium"
                        >
                          <FiMessageSquare className="w-3.5 h-3.5" /> Reply to review
                        </button>
                      )}
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

export default RestaurantReviewsPage;
