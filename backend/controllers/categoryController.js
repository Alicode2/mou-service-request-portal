const RequestCategory = require('../models/RequestCategory');
const { asyncHandler } = require('../middleware/errorHandler');

// @desc   List categories (public to any authenticated user, used to populate forms)
// @route  GET /api/categories
// @access Private
const getCategories = asyncHandler(async (req, res) => {
  const categories = await RequestCategory.find({ isActive: true }).sort({ name: 1 });
  res.json({ success: true, categories });
});

// @desc   Create category
// @route  POST /api/categories
// @access Private (admin)
const createCategory = asyncHandler(async (req, res) => {
  const { name, description, defaultPriority } = req.body;
  const category = await RequestCategory.create({ name, description, defaultPriority });
  res.status(201).json({ success: true, category });
});

// @desc   Update category
// @route  PUT /api/categories/:id
// @access Private (admin)
const updateCategory = asyncHandler(async (req, res) => {
  const category = await RequestCategory.findById(req.params.id);
  if (!category) {
    return res.status(404).json({ success: false, message: 'Category not found' });
  }
  ['name', 'description', 'defaultPriority', 'isActive'].forEach((field) => {
    if (req.body[field] !== undefined) category[field] = req.body[field];
  });
  await category.save();
  res.json({ success: true, category });
});

// @desc   Delete category
// @route  DELETE /api/categories/:id
// @access Private (admin)
const deleteCategory = asyncHandler(async (req, res) => {
  const category = await RequestCategory.findById(req.params.id);
  if (!category) {
    return res.status(404).json({ success: false, message: 'Category not found' });
  }
  await category.deleteOne();
  res.json({ success: true, message: 'Category deleted' });
});

module.exports = { getCategories, createCategory, updateCategory, deleteCategory };
