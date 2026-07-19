const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorHandler');

// @desc   List all users (optionally filter by role), with pagination
// @route  GET /api/users
// @access Private (admin)
const getUsers = asyncHandler(async (req, res) => {
  const { role, search, page = 1, limit = 20 } = req.query;
  const query = {};
  if (role) query.role = role;
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

  const [users, total] = await Promise.all([
    User.find(query)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    User.countDocuments(query),
  ]);

  res.json({
    success: true,
    users: users.map((u) => u.toSafeObject()),
    pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) || 1 },
  });
});

// @desc   Admin creates a user of any role (e.g. maintenance officer, another admin)
// @route  POST /api/users
// @access Private (admin)
const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, department, phone } = req.body;

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(400).json({ success: false, message: 'An account with this email already exists' });
  }

  const user = await User.create({ name, email, password, role, department, phone });
  res.status(201).json({ success: true, user: user.toSafeObject() });
});

// @desc   Update a user's role, department, or active status
// @route  PUT /api/users/:id
// @access Private (admin)
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  const editableFields = ['name', 'role', 'department', 'phone', 'isActive'];
  editableFields.forEach((field) => {
    if (req.body[field] !== undefined) user[field] = req.body[field];
  });

  await user.save();
  res.json({ success: true, user: user.toSafeObject() });
});

// @desc   Delete (deactivate) a user
// @route  DELETE /api/users/:id
// @access Private (admin)
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  await user.deleteOne();
  res.json({ success: true, message: 'User deleted' });
});

module.exports = { getUsers, createUser, updateUser, deleteUser };
