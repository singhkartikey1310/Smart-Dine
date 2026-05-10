const OpenAI = require('openai');
const Food = require('../models/Food');
const Restaurant = require('../models/Restaurant');
const Review = require('../models/Review');
const ErrorResponse = require('../utils/errorResponse');

// Helper to call OpenAI
const callAI = async (messages, maxTokens = 500) => {
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key') {
    return 'AI features require an OpenAI API key. Please add OPENAI_API_KEY to your backend/.env file.';
  }
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages,
    max_tokens: maxTokens,
    temperature: 0.7,
  });
  return response.choices[0].message.content;
};

// @desc    AI food recommendations
// @route   POST /api/ai/recommendations
// @access  Private
exports.getFoodRecommendations = async (req, res, next) => {
  const { preferences, budget, cuisine, dietaryRestrictions } = req.body;

  const foods = await Food.find({ isAvailable: true })
    .populate('restaurant', 'name rating')
    .populate('category', 'name')
    .limit(50);

  const foodList = foods.map((f) => `${f.name} (${f.category?.name}, ₹${f.price}, ${f.isVeg ? 'Veg' : 'Non-Veg'})`).join('\n');

  const prompt = `You are a food recommendation AI for SmartDine. Based on the following preferences, recommend 5 food items from the list.

User Preferences:
- Taste: ${preferences || 'any'}
- Budget: ₹${budget || 'any'}
- Cuisine: ${cuisine || 'any'}
- Dietary: ${dietaryRestrictions || 'none'}

Available Foods:
${foodList}

Respond with a JSON array of recommended food names with brief reasons. Format: [{"name": "...", "reason": "..."}]`;

  const aiResponse = await callAI([{ role: 'user', content: prompt }]);

  let recommendations = [];
  try {
    recommendations = JSON.parse(aiResponse);
  } catch {
    recommendations = [{ name: 'AI Response', reason: aiResponse }];
  }

  // Get actual food objects
  const recommendedFoods = await Promise.all(
    recommendations.map(async (rec) => {
      const food = await Food.findOne({ name: { $regex: rec.name, $options: 'i' } })
        .populate('restaurant', 'name logo')
        .populate('category', 'name');
      return food ? { ...food.toObject(), aiReason: rec.reason } : null;
    })
  );

  res.status(200).json({
    success: true,
    recommendations: recommendedFoods.filter(Boolean),
  });
};

// @desc    AI chatbot
// @route   POST /api/ai/chat
// @access  Public
exports.aiChat = async (req, res, next) => {
  const { message, history = [] } = req.body;

  const systemPrompt = `You are SmartDine AI Assistant, a helpful chatbot for a food delivery platform. 
You help users with:
- Finding restaurants and food items
- Order tracking and support
- Food recommendations
- Payment and delivery queries
- General food-related questions

Be friendly, concise, and helpful. If asked about specific orders, ask for order number.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-10), // Keep last 10 messages for context
    { role: 'user', content: message },
  ];

  const response = await callAI(messages, 300);

  res.status(200).json({ success: true, response });
};

// @desc    AI menu description generator
// @route   POST /api/ai/generate-description
// @access  Private (restaurant_admin)
exports.generateMenuDescription = async (req, res, next) => {
  const { foodName, ingredients, category, isVeg } = req.body;

  const prompt = `Generate an appetizing, concise menu description (max 100 words) for a food item:
Name: ${foodName}
Category: ${category}
Ingredients: ${ingredients?.join(', ') || 'not specified'}
Type: ${isVeg ? 'Vegetarian' : 'Non-Vegetarian'}

Make it sound delicious and appealing for a restaurant menu. Be descriptive about taste, texture, and presentation.`;

  const description = await callAI([{ role: 'user', content: prompt }], 200);

  // Save to food if foodId provided
  if (req.body.foodId) {
    await Food.findByIdAndUpdate(req.body.foodId, { aiDescription: description });
  }

  res.status(200).json({ success: true, description });
};

// @desc    AI review summary
// @route   GET /api/ai/review-summary/:restaurantId
// @access  Public
exports.getReviewSummary = async (req, res, next) => {
  const reviews = await Review.find({ restaurant: req.params.restaurantId, isApproved: true })
    .select('rating comment')
    .limit(20);

  if (reviews.length === 0) {
    return res.status(200).json({ success: true, summary: 'No reviews yet.' });
  }

  const reviewText = reviews.map((r) => `Rating: ${r.rating}/5 - ${r.comment}`).join('\n');

  const prompt = `Summarize these restaurant reviews in 2-3 sentences, highlighting key positives and areas for improvement:

${reviewText}

Provide a balanced, helpful summary for potential customers.`;

  const summary = await callAI([{ role: 'user', content: prompt }], 200);

  res.status(200).json({ success: true, summary });
};

// @desc    AI smart food search
// @route   POST /api/ai/search
// @access  Public
exports.smartSearch = async (req, res, next) => {
  const { query } = req.body;

  // Extract search intent using AI
  const intentPrompt = `Extract search parameters from this natural language food search query: "${query}"
  
Return JSON with: { "keywords": ["..."], "isVeg": null/true/false, "maxPrice": null/number, "cuisine": null/"string", "category": null/"string" }`;

  const intentResponse = await callAI([{ role: 'user', content: intentPrompt }], 150);

  let searchParams = {};
  try {
    searchParams = JSON.parse(intentResponse);
  } catch {
    searchParams = { keywords: [query] };
  }

  // Build MongoDB query
  const mongoQuery = { isAvailable: true };
  if (searchParams.isVeg !== null && searchParams.isVeg !== undefined) {
    mongoQuery.isVeg = searchParams.isVeg;
  }
  if (searchParams.maxPrice) {
    mongoQuery.price = { $lte: searchParams.maxPrice };
  }

  const keywordRegex = searchParams.keywords?.join('|') || query;
  mongoQuery.$or = [
    { name: { $regex: keywordRegex, $options: 'i' } },
    { description: { $regex: keywordRegex, $options: 'i' } },
    { tags: { $in: [new RegExp(keywordRegex, 'i')] } },
    { ingredients: { $in: [new RegExp(keywordRegex, 'i')] } },
  ];

  const foods = await Food.find(mongoQuery)
    .populate('restaurant', 'name logo rating')
    .populate('category', 'name')
    .limit(20);

  res.status(200).json({ success: true, foods, searchParams });
};

// @desc    AI FAQ support
// @route   POST /api/ai/faq
// @access  Public
exports.getFAQAnswer = async (req, res, next) => {
  const { question } = req.body;

  const faqContext = `SmartDine AI FAQ Context:
- Delivery time: 30-45 minutes typically
- Payment methods: Razorpay (cards, UPI, netbanking, wallets), Cash on Delivery
- Cancellation: Orders can be cancelled within 2 minutes of placing
- Refunds: 5-7 business days for online payments
- Support: Available 24/7 via chat
- Minimum order: Varies by restaurant
- Delivery fee: Varies by restaurant and distance`;

  const response = await callAI([
    { role: 'system', content: `You are a helpful FAQ assistant for SmartDine AI food delivery platform. Use this context: ${faqContext}` },
    { role: 'user', content: question },
  ], 200);

  res.status(200).json({ success: true, answer: response });
};

// @desc    AI order assistance
// @route   POST /api/ai/order-assist
// @access  Private
exports.orderAssistance = async (req, res, next) => {
  const { orderDetails, question } = req.body;

  const prompt = `You are an order assistance AI. Help the user with their order question.

Order Details: ${JSON.stringify(orderDetails)}
User Question: ${question}

Provide helpful, specific assistance.`;

  const response = await callAI([{ role: 'user', content: prompt }], 250);

  res.status(200).json({ success: true, response });
};
