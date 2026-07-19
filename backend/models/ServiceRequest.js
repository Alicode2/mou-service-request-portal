const mongoose = require('mongoose');

const ServiceRequestSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Title is required'], trim: true },
    description: { type: String, required: [true, 'Description is required'] },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'RequestCategory', required: true },
    location: { type: String, required: [true, 'Location is required'] },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['pending', 'assigned', 'in_progress', 'completed', 'closed', 'rejected'],
      default: 'pending',
    },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    evidenceFiles: [
      {
        filename: String,
        originalName: String,
        path: String,
        mimetype: String,
        size: Number,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

ServiceRequestSchema.index({ title: 'text', description: 'text', location: 'text' });

module.exports = mongoose.model('ServiceRequest', ServiceRequestSchema);
