const { GoogleGenerativeAI } = require('@google/generative-ai');
const Food = require('../models/Food');
const Restaurant = require('../models/Restaurant');
const Review = require('../models/Review');
const ErrorResponse = require('../utils/errorResponse');

// ── Gemini client ─────────────────────────────────────────────────────────────
const getGemini = () => {
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key') {
    return null;
  }
  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
};

// ── Helper: call Gemini ───────────────────────────────────────────────────────
const callAI = async (prompt, history = []) => {
  const genAI = getGemini();

  if (!genAI) {
    return 'AI features require a Gemini API key. Please add GEMINI_API_KEY to your backend/.env file. Get one free at https://aistudio.google.com/app/apikey';
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  // If history provided, use chat mode
  if (history.length > 0) {
    const chat = model.startChat({
      history: history.map((msg) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      })),
      generationConfig: { maxOutputTokens: 500, temperature: 0.7 },
    });
    const result = await chat.sendMessage(prompt);
    return result.response.text();
  }

  // Single prompt mode
  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { maxOutputTokens: 500, temperature: 0.7 },
  });
  return result.response.text();
};

// ─────────────────────────────────────────────────────────────────────────────

// @desc    AI food recommendations
// @route   POST /api/ai/recommendations
// @access  Private
exports.getFoodRecommendations = async (req, res, next) => {
  const { preferences, budget, cuisine, dietaryRestrictions } = req.body;

  const foods = await Food.find({ isAvailable: true })
    .populate('restaurant', 'name rating')
    .populate('category', 'name')
    .limit(50);

  const foodList = foods
    .map((f) => `${f.name} (${f.category?.name}, ₹${f.price}, ${f.isVeg ? 'Veg' : 'Non-Veg'})`)
    .join('\n');

  const prompt = `You are a food recommendation AI for SmartDine. Based on the following preferences, recommend 5 food items from the list below.

User Preferences:
- Taste: ${preferences || 'any'}
- Budget: ₹${budget || 'any'}
- Cuisine: ${cuisine || 'any'}
- Dietary: ${dietaryRestrictions || 'none'}

Available Foods:
${foodList}

Respond ONLY with a valid JSON array, no markdown, no explanation. Format:
[{"name": "...", "reason": "..."}]`;

  const aiResponse = await callAI(prompt);

  let recommendations = [];
  try {
    const cleaned = aiResponse.replace(/```json|```/g, '').trim();
    recommendations = JSON.parse(cleaned);
  } catch {
    recommendations = [{ name: 'AI Response', reason: aiResponse }];
  }

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

  const systemContext = `You are SmartDine AI Assistant, a helpful chatbot for a food delivery platform.
You help users with:
- Finding restaurants and food items
- Order tracking and support
- Food recommendations
- Payment and delivery queries
- General food-related questions
Be friendly, concise, and helpful. Keep responses under 150 words.`;

  // Prepend system context to the first message if no history
  const fullPrompt = history.length === 0
    ? `${systemContext}\n\nUser: ${message}`
    : message;

  const response = await callAI(fullPrompt, history.length > 0 ? [
    { role: 'user', content: systemContext },
    { role: 'assistant', content: 'Understood! I am SmartDine AI Assistant, ready to help.' },
    ...history.slice(-8),
  ] : []);

  res.status(200).json({ success: true, response });
};

// @desc    AI menu description generator
// @route   POST /api/ai/generate-description
// @access  Private (restaurant_admin)
exports.generateMenuDescription = async (req, res, next) => {
  const { foodName, ingredients, category, isVeg, foodId } = req.body;

  const prompt = `Generate an appetizing, concise menu description (max 80 words) for this food item:
Name: ${foodName}
Category: ${category || 'Main Course'}
Ingredients: ${Array.isArray(ingredients) ? ingredients.join(', ') : ingredients || 'not specified'}
Type: ${isVeg ? 'Vegetarian' : 'Non-Vegetarian'}

Write only the description. Make it sound delicious and appealing. No quotes, no labels.`;

  const description = await callAI(prompt);

  if (foodId) {
    await Food.findByIdAndUpdate(foodId, { aiDescription: description.trim() });
  }

  res.status(200).json({ success: true, description: description.trim() });
};

// @desc    AI review summary
// @route   GET /api/ai/review-summary/:restaurantId
// @access  Public
exports.getReviewSummary = async (req, res, next) => {
  const reviews = await Review.find({
    restaurant: req.params.restaurantId,
    isApproved: true,
  })
    .select('rating comment')
    .limit(20);

  if (reviews.length === 0) {
    return res.status(200).json({ success: true, summary: 'No reviews yet.' });
  }

  const reviewText = reviews
    .map((r) => `Rating: ${r.rating}/5 - ${r.comment || 'No comment'}`)
    .join('\n');

  const prompt = `Summarize these restaurant reviews in 2-3 sentences. Highlight key positives and any areas for improvement. Be balanced and helpful for potential customers.

Reviews:
${reviewText}

Write only the summary, no labels or headings.`;

  const summary = await callAI(prompt);

  res.status(200).json({ success: true, summary: summary.trim() });
};

// @desc    AI smart natural-language food search
// @route   POST /api/ai/search
// @access  Public
exports.smartSearch = async (req, res, next) => {
  const { query } = req.body;

  const prompt = `Extract search parameters from this natural language food search query: "${query}"

Return ONLY valid JSON, no markdown:
{"keywords": ["word1", "word2"], "isVeg": null, "maxPrice": null, "cuisine": null, "category": null}

Rules:
- isVeg: true if user wants veg, false if non-veg, null if not specified
- maxPrice: number or null
- keywords: 1-3 relevant food keywords
- cuisine/category: string or null`;

  const intentResponse = await callAI(prompt);

  let searchParams = { keywords: [query] };
  try {
    const cleaned = intentResponse.replace(/```json|```/g, '').trim();
    searchParams = JSON.parse(cleaned);
  } catch {
    searchParams = { keywords: [query] };
  }

  const mongoQuery = { isAvailable: true };

  if (searchParams.isVeg === true) mongoQuery.isVeg = true;
  if (searchParams.isVeg === false) mongoQuery.isVeg = false;
  if (searchParams.maxPrice) mongoQuery.price = { $lte: Number(searchParams.maxPrice) };

  const keywordRegex = (searchParams.keywords || [query]).join('|');
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

  const prompt = `You are a helpful FAQ assistant for SmartDine AI, a food delivery platform.

Platform info:
- Delivery time: 30-45 minutes typically
- Payment methods: Razorpay (cards, UPI, netbanking, wallets), Cash on Delivery
- Cancellation: Orders can be cancelled within 2 minutes of placing
- Refunds: 5-7 business days for online payments
- Support: Available 24/7 via chat
- Minimum order: Varies by restaurant

Answer this question concisely (max 80 words): ${question}`;

  const answer = await callAI(prompt);

  res.status(200).json({ success: true, answer: answer.trim() });
};

// @desc    AI order assistance
// @route   POST /api/ai/order-assist
// @access  Private
exports.orderAssistance = async (req, res, next) => {
  const { orderDetails, question } = req.body;

  const prompt = `You are an order assistance AI for SmartDine food delivery.

Order Details:
${JSON.stringify(orderDetails, null, 2)}

User Question: ${question}

Provide helpful, specific assistance in under 100 words.`;

  const response = await callAI(prompt);

  res.status(200).json({ success: true, response: response.trim() });
};
