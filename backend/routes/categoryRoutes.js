const express = require('express');
const router = express.Router();
const {
  getCategories, createCategory, updateCategory, deleteCategory,
} = require('../controllers/categoryController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', getCategories);
router.post('/', protect, authorize('super_admin'), createCategory);
router.put('/:id', protect, authorize('super_admin'), updateCategory);
router.delete('/:id', protect, authorize('super_admin'), deleteCategory);

module.exports = router;
