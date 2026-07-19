const ServiceRequest = require('../models/ServiceRequest');
const { asyncHandler } = require('../middleware/errorHandler');

// @desc   Summary stats for the admin dashboard
// @route  GET /api/reports/summary
// @access Private (admin)
const getSummary = asyncHandler(async (req, res) => {
  const [byStatus, byPriority, byCategory, total] = await Promise.all([
    ServiceRequest.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    ServiceRequest.aggregate([{ $group: { _id: '$priority', count: { $sum: 1 } } }]),
    ServiceRequest.aggregate([
      { $lookup: { from: 'requestcategories', localField: 'category', foreignField: '_id', as: 'cat' } },
      { $unwind: '$cat' },
      { $group: { _id: '$cat.name', count: { $sum: 1 } } },
    ]),
    ServiceRequest.countDocuments(),
  ]);

  res.json({ success: true, total, byStatus, byPriority, byCategory });
});

// @desc   Export all requests as CSV
// @route  GET /api/reports/export/csv
// @access Private (admin)
const exportCsv = asyncHandler(async (req, res) => {
  const requests = await ServiceRequest.find()
    .populate('category', 'name')
    .populate('submittedBy', 'name email')
    .sort({ createdAt: -1 });

  const header = [
    'ID',
    'Title',
    'Category',
    'Location',
    'Priority',
    'Status',
    'Submitted By',
    'Submitted Email',
    'Created At',
  ];

  const escapeCsv = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;

  const rows = requests.map((r) =>
    [
      r._id,
      r.title,
      r.category ? r.category.name : '',
      r.location,
      r.priority,
      r.status,
      r.submittedBy ? r.submittedBy.name : '',
      r.submittedBy ? r.submittedBy.email : '',
      r.createdAt.toISOString(),
    ]
      .map(escapeCsv)
      .join(',')
  );

  const csv = [header.map(escapeCsv).join(','), ...rows].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="service_requests_report.csv"');
  res.status(200).send(csv);
});

module.exports = { getSummary, exportCsv };
