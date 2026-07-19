const mongoose = require('mongoose');

// Serves both the "Status Updates/Logs" entity requirement and the
// audit trail / activity log advanced feature.
const StatusLogSchema = new mongoose.Schema(
  {
    request: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceRequest', required: true },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fromStatus: { type: String, default: null },
    toStatus: { type: String, required: true },
    note: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('StatusLog', StatusLogSchema);
