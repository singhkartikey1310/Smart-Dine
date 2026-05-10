const express = require('express');
const router = express.Router();
const {
  createReview, getReviews, updateReview, deleteReview, replyToReview,
} = require('../controllers/reviewController');
const { protect, authorize } = require('../middleware/auth');
const { uploadReview } = require('../config/cloudinary');

router.get('/', getReviews);
router.post('/', protect, uploadReview.array('images', 3), createReview);
router.put('/:id', protect, updateReview);
router.delete('/:id', protect, deleteReview);
router.post('/:id/reply', protect, authorize('restaurant_admin', 'super_admin'), replyToReview);

module.exports = router;
