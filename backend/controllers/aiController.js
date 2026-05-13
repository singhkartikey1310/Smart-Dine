const { GoogleGenerativeAI } = require('@google/generative-ai');
const Food = require('../models/Food');
const Restaurant = require('../models/Restaurant');
const Review = require('../models/Review');
const ErrorResponse = require('../utils/errorResponse');

// ── Gemini client ─────────────────────────────────────────────────────────────
const getGemini = () => {
  if (
    !process.env.GEMINI_API_KEY ||
    process.env.GEMINI_API_KEY === 'your_gemini_api_key'
  ) {
    return null;
  }

  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
};

// ── Helper: call Gemini ───────────────────────────────────────────────────────
const callAI = async (prompt) => {
  try {
    const genAI = getGemini();

    if (!genAI) {
      return 'Gemini API key missing';
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
    });

    const result = await model.generateContent(prompt);

    return result.response.text();
  }  catch (error) {
  console.error('Gemini Error:', error);
  return error.message;
  }
};

// ─────────────────────────────────────────────────────────────────────────────

// @desc    AI food recommendations
// @route   POST /api/ai/recommendations
// @access  Private
exports.getFoodRecommendations = async (req, res, next) => {
  try {
    const { preferences, budget, cuisine, dietaryRestrictions } = req.body;

    const foods = await Food.find({ isAvailable: true })
      .populate('restaurant', 'name rating')
      .populate('category', 'name')
      .limit(50);

    const foodList = foods
      .map(
        (f) =>
          `${f.name} (${f.category?.name}, ₹${f.price}, ${
            f.isVeg ? 'Veg' : 'Non-Veg'
          })`
      )
      .join('\n');

    const prompt = `
You are a food recommendation AI for SmartDine.

User Preferences:
- Taste: ${preferences || 'any'}
- Budget: ₹${budget || 'any'}
- Cuisine: ${cuisine || 'any'}
- Dietary: ${dietaryRestrictions || 'none'}

Available Foods:
${foodList}

Recommend 5 suitable food items.
`;

    const aiResponse = await callAI(prompt);

    res.status(200).json({
      success: true,
      response: aiResponse,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    AI chatbot
// @route   POST /api/ai/chat
// @access  Public
exports.aiChat = async (req, res, next) => {
  try {
    const { message } = req.body;

    const prompt = `
You are SmartDine AI Assistant, a helpful chatbot for a food delivery platform.

You help users with:
- Food recommendations
- Restaurant suggestions
- Delivery support
- Order assistance
- General food queries

User Question:
${message}

Reply in a friendly and concise way.
`;

    const response = await callAI(prompt);

    res.status(200).json({
      success: true,
      response,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: 'AI chatbot failed',
    });
  }
};

// @desc    AI menu description generator
// @route   POST /api/ai/generate-description
// @access  Private
exports.generateMenuDescription = async (req, res, next) => {
  try {
    const { foodName, ingredients, category, isVeg, foodId } = req.body;

    const prompt = `
Generate an attractive menu description.

Food Name: ${foodName}
Category: ${category || 'Main Course'}
Ingredients: ${
      Array.isArray(ingredients)
        ? ingredients.join(', ')
        : ingredients || 'Not specified'
    }
Type: ${isVeg ? 'Vegetarian' : 'Non-Vegetarian'}

Keep it under 80 words.
`;

    const description = await callAI(prompt);

    if (foodId) {
      await Food.findByIdAndUpdate(foodId, {
        aiDescription: description.trim(),
      });
    }

    res.status(200).json({
      success: true,
      description: description.trim(),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    AI review summary
// @route   GET /api/ai/review-summary/:restaurantId
// @access  Public
exports.getReviewSummary = async (req, res, next) => {
  try {
    const reviews = await Review.find({
      restaurant: req.params.restaurantId,
      isApproved: true,
    })
      .select('rating comment')
      .limit(20);

    if (reviews.length === 0) {
      return res.status(200).json({
        success: true,
        summary: 'No reviews yet.',
      });
    }

    const reviewText = reviews
      .map((r) => `Rating: ${r.rating}/5 - ${r.comment || 'No comment'}`)
      .join('\n');

    const prompt = `
Summarize these restaurant reviews:

${reviewText}

Keep summary concise and balanced.
`;

    const summary = await callAI(prompt);

    res.status(200).json({
      success: true,
      summary: summary.trim(),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    AI smart search
// @route   POST /api/ai/search
// @access  Public
exports.smartSearch = async (req, res, next) => {
  try {
    const { query } = req.body;

    const foods = await Food.find({
      isAvailable: true,
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
      ],
    })
      .populate('restaurant', 'name logo rating')
      .populate('category', 'name')
      .limit(20);

    res.status(200).json({
      success: true,
      foods,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    AI FAQ support
// @route   POST /api/ai/faq
// @access  Public
exports.getFAQAnswer = async (req, res, next) => {
  try {
    const { question } = req.body;

    const prompt = `
You are SmartDine FAQ assistant.

Question:
${question}

Answer briefly and clearly.
`;

    const answer = await callAI(prompt);

    res.status(200).json({
      success: true,
      answer: answer.trim(),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    AI order assistance
// @route   POST /api/ai/order-assist
// @access  Private
exports.orderAssistance = async (req, res, next) => {
  try {
    const { orderDetails, question } = req.body;

    const prompt = `
You are SmartDine Order Assistant.

Order Details:
${JSON.stringify(orderDetails, null, 2)}

Customer Question:
${question}

Provide a helpful response.
`;

    const response = await callAI(prompt);

    res.status(200).json({
      success: true,
      response: response.trim(),
    });
  } catch (error) {
    next(error);
  }
};