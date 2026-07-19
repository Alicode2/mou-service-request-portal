const mongoose = require('mongoose');

const AssignmentSchema = new mongoose.Schema(
  {
    request: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceRequest', required: true },
    officer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    notes: { type: String, default: '' },
    active: { type: Boolean, default: true }, // false if reassigned
  },
  { timestamps: true }
);

module.exports = mongoose.model('Assignment', AssignmentSchema);
