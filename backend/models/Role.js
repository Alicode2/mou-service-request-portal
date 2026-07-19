const mongoose = require('mongoose');

// Roles entity: a reference collection describing each role in the system.
// The User model stores the role key (student_staff / maintenance_officer / admin);
// this collection lets admins view/manage role descriptions and permissions from the DB.
const RoleSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      enum: ['student_staff', 'maintenance_officer', 'admin'],
    },
    label: { type: String, required: true },
    description: { type: String, default: '' },
    permissions: [{ type: String }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Role', RoleSchema);
