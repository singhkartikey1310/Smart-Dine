const express = require('express');
const router = express.Router();
const {
  getFoodRecommendations, aiChat, generateMenuDescription,
  getReviewSummary, smartSearch, getFAQAnswer, orderAssistance,
} = require('../controllers/aiController');
const { protect, authorize } = require('../middleware/auth');
const { aiLimiter } = require('../middleware/rateLimiter');

router.use(aiLimiter);

router.post('/recommendations', protect, getFoodRecommendations);
router.post('/chat', aiChat);
router.post('/generate-description', protect, authorize('restaurant_admin', 'super_admin'), generateMenuDescription);
router.get('/review-summary/:restaurantId', getReviewSummary);
router.post('/search', smartSearch);
router.post('/faq', getFAQAnswer);
router.post('/order-assist', protect, orderAssistance);

module.exports = router;
