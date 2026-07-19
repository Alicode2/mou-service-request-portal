const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorHandler');

function signToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

// @desc   Register a new user (defaults to student_staff role unless admin creates otherwise)
// @route  POST /api/auth/register
// @access Public
const register = asyncHandler(async (req, res) => {
  const { name, email, password, department, phone } = req.body;

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(400).json({ success: false, message: 'An account with this email already exists' });
  }

  // Public registration is only ever allowed to create student_staff accounts.
  // Officer/admin accounts must be created by an admin via /api/users.
  const user = await User.create({
    name,
    email,
    password,
    department,
    phone,
    role: 'student_staff',
  });

  const token = signToken(user);
  res.status(201).json({ success: true, token, user: user.toSafeObject() });
});

// @desc   Login
// @route  POST /api/auth/login
// @access Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }
  if (!user.isActive) {
    return res.status(403).json({ success: false, message: 'This account has been deactivated. Contact admin.' });
  }

  const token = signToken(user);
  res.json({ success: true, token, user: user.toSafeObject() });
});

// @desc   Get current logged-in user
// @route  GET /api/auth/me
// @access Private
const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user.toSafeObject() });
});

module.exports = { register, login, getMe };
