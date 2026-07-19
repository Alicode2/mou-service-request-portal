const ServiceRequest = require('../models/ServiceRequest');
const Assignment = require('../models/Assignment');
const StatusLog = require('../models/StatusLog');
const { asyncHandler } = require('../middleware/errorHandler');

// @desc   Create a new service request (Student/Staff)
// @route  POST /api/requests
// @access Private (student_staff, admin)
const createRequest = asyncHandler(async (req, res) => {
  const { title, description, category, location, priority } = req.body;

  const evidenceFiles = (req.files || []).map((f) => ({
    filename: f.filename,
    originalName: f.originalname,
    path: `/uploads/${f.filename}`,
    mimetype: f.mimetype,
    size: f.size,
  }));

  const request = await ServiceRequest.create({
    title,
    description,
    category,
    location,
    priority,
    submittedBy: req.user._id,
    evidenceFiles,
  });

  await StatusLog.create({
    request: request._id,
    changedBy: req.user._id,
    fromStatus: null,
    toStatus: 'pending',
    note: 'Request submitted',
  });

  const populated = await request.populate([
    { path: 'category', select: 'name defaultPriority' },
    { path: 'submittedBy', select: 'name email role' },
  ]);

  res.status(201).json({ success: true, request: populated });
});

// @desc   List requests with search, filter, pagination.
//         Student/Staff see only their own; officers see assigned; admins see all.
// @route  GET /api/requests
// @access Private
const getRequests = asyncHandler(async (req, res) => {
  const { search, status, priority, category, page = 1, limit = 10 } = req.query;

  const query = {};

  if (req.user.role === 'student_staff') {
    query.submittedBy = req.user._id;
  } else if (req.user.role === 'maintenance_officer') {
    const assignments = await Assignment.find({ officer: req.user._id, active: true }).select('request');
    query._id = { $in: assignments.map((a) => a.request) };
  }
  // admin: no restriction, sees everything

  if (status) query.status = status;
  if (priority) query.priority = priority;
  if (category) query.category = category;
  if (search) query.$text = { $search: search };

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
  const skip = (pageNum - 1) * limitNum;

  const [requests, total] = await Promise.all([
    ServiceRequest.find(query)
      .populate('category', 'name defaultPriority')
      .populate('submittedBy', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    ServiceRequest.countDocuments(query),
  ]);

  res.json({
    success: true,
    requests,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1,
    },
  });
});

// @desc   Get a single request with its assignment and status history
// @route  GET /api/requests/:id
// @access Private
const getRequestById = asyncHandler(async (req, res) => {
  const request = await ServiceRequest.findById(req.params.id)
    .populate('category', 'name defaultPriority')
    .populate('submittedBy', 'name email role department');

  if (!request) {
    return res.status(404).json({ success: false, message: 'Service request not found' });
  }

  // Access control: student/staff can only view their own requests
  if (req.user.role === 'student_staff' && String(request.submittedBy._id) !== String(req.user._id)) {
    return res.status(403).json({ success: false, message: 'You do not have access to this request' });
  }

  const assignment = await Assignment.findOne({ request: request._id, active: true }).populate(
    'officer',
    'name email department'
  );

  if (req.user.role === 'maintenance_officer') {
    if (!assignment || String(assignment.officer._id) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'This request is not assigned to you' });
    }
  }

  const statusHistory = await StatusLog.find({ request: request._id })
    .populate('changedBy', 'name role')
    .sort({ createdAt: 1 });

  res.json({ success: true, request, assignment, statusHistory });
});

// @desc   Update request details (submitter can edit while pending; admin anytime)
// @route  PUT /api/requests/:id
// @access Private
const updateRequest = asyncHandler(async (req, res) => {
  const request = await ServiceRequest.findById(req.params.id);
  if (!request) {
    return res.status(404).json({ success: false, message: 'Service request not found' });
  }

  const isOwner = String(request.submittedBy) === String(req.user._id);
  if (req.user.role === 'student_staff' && (!isOwner || request.status !== 'pending')) {
    return res.status(403).json({
      success: false,
      message: 'You can only edit your own requests while they are still pending',
    });
  }
  if (req.user.role === 'maintenance_officer') {
    return res.status(403).json({ success: false, message: 'Officers cannot edit request details' });
  }

  const editableFields = ['title', 'description', 'category', 'location', 'priority'];
  editableFields.forEach((field) => {
    if (req.body[field] !== undefined) request[field] = req.body[field];
  });

  await request.save();
  res.json({ success: true, request });
});

// @desc   Assign a request to a maintenance officer
// @route  POST /api/requests/:id/assign
// @access Private (admin)
const assignRequest = asyncHandler(async (req, res) => {
  const { officerId, notes } = req.body;
  const request = await ServiceRequest.findById(req.params.id);
  if (!request) {
    return res.status(404).json({ success: false, message: 'Service request not found' });
  }

  // Deactivate any existing active assignment (reassignment case)
  await Assignment.updateMany({ request: request._id, active: true }, { $set: { active: false } });

  const assignment = await Assignment.create({
    request: request._id,
    officer: officerId,
    assignedBy: req.user._id,
    notes: notes || '',
  });

  const fromStatus = request.status;
  request.status = 'assigned';
  await request.save();

  await StatusLog.create({
    request: request._id,
    changedBy: req.user._id,
    fromStatus,
    toStatus: 'assigned',
    note: notes ? `Assigned to officer. ${notes}` : 'Assigned to officer',
  });

  const populated = await assignment.populate('officer', 'name email department');
  res.status(201).json({ success: true, assignment: populated, request });
});

// @desc   Officer updates progress / status of an assigned request
// @route  PATCH /api/requests/:id/status
// @access Private (maintenance_officer, admin)
const updateStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;
  const request = await ServiceRequest.findById(req.params.id);
  if (!request) {
    return res.status(404).json({ success: false, message: 'Service request not found' });
  }

  if (req.user.role === 'maintenance_officer') {
    const assignment = await Assignment.findOne({ request: request._id, active: true });
    if (!assignment || String(assignment.officer) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'This request is not assigned to you' });
    }
  }

  const validTransitions = ['pending', 'assigned', 'in_progress', 'completed', 'closed', 'rejected'];
  if (!validTransitions.includes(status)) {
    return res.status(400).json({ success: false, message: `Invalid status: ${status}` });
  }

  const fromStatus = request.status;
  request.status = status;
  await request.save();

  await StatusLog.create({
    request: request._id,
    changedBy: req.user._id,
    fromStatus,
    toStatus: status,
    note: note || '',
  });

  res.json({ success: true, request });
});

// @desc   Delete a request (admin only, or owner while pending)
// @route  DELETE /api/requests/:id
// @access Private
const deleteRequest = asyncHandler(async (req, res) => {
  const request = await ServiceRequest.findById(req.params.id);
  if (!request) {
    return res.status(404).json({ success: false, message: 'Service request not found' });
  }

  const isOwner = String(request.submittedBy) === String(req.user._id);
  const canDelete = req.user.role === 'admin' || (isOwner && request.status === 'pending');
  if (!canDelete) {
    return res.status(403).json({ success: false, message: 'You are not allowed to delete this request' });
  }

  await Promise.all([
    Assignment.deleteMany({ request: request._id }),
    StatusLog.deleteMany({ request: request._id }),
    request.deleteOne(),
  ]);

  res.json({ success: true, message: 'Service request deleted' });
});

module.exports = {
  createRequest,
  getRequests,
  getRequestById,
  updateRequest,
  assignRequest,
  updateStatus,
  deleteRequest,
};
