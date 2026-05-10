const Category = require('../models/Category');
const ErrorResponse = require('../utils/errorResponse');

exports.getCategories = async (req, res, next) => {
  const categories = await Category.find({ isActive: true }).sort('sortOrder name');
  res.status(200).json({ success: true, categories });
};

exports.createCategory = async (req, res, next) => {
  const category = await Category.create(req.body);
  res.status(201).json({ success: true, category });
};

exports.updateCategory = async (req, res, next) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!category) return next(new ErrorResponse('Category not found', 404));
  res.status(200).json({ success: true, category });
};

exports.deleteCategory = async (req, res, next) => {
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) return next(new ErrorResponse('Category not found', 404));
  res.status(200).json({ success: true, message: 'Category deleted' });
};
