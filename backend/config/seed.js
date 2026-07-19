// Seeds the database with roles, default categories, and one demo account per role.
// Run with: npm run seed
require('dotenv').config();
const connectDB = require('./db');
const User = require('../models/User');
const Role = require('../models/Role');
const RequestCategory = require('../models/RequestCategory');

const roles = [
  {
    key: 'student_staff',
    label: 'Student / Staff',
    description: 'Can submit and track their own service requests.',
    permissions: ['create_request', 'view_own_requests'],
  },
  {
    key: 'maintenance_officer',
    label: 'Maintenance Officer',
    description: 'Can view assigned requests and update their progress.',
    permissions: ['view_assigned_requests', 'update_request_status'],
  },
  {
    key: 'admin',
    label: 'Administrator',
    description: 'Manages users, assigns requests, monitors status, generates reports.',
    permissions: ['manage_users', 'assign_requests', 'view_all_requests', 'generate_reports', 'manage_categories'],
  },
];

const categories = [
  { name: 'Electrical', description: 'Faulty wiring, lighting, sockets, power outages', defaultPriority: 'high' },
  { name: 'Plumbing', description: 'Leaking pipes, blocked drains, water supply issues', defaultPriority: 'high' },
  { name: 'Furniture', description: 'Damaged desks, chairs, cabinets', defaultPriority: 'low' },
  { name: 'Internet/Network', description: 'Wi-Fi, LAN, connectivity issues', defaultPriority: 'medium' },
  { name: 'Classroom Equipment', description: 'Projectors, whiteboards, AC units', defaultPriority: 'medium' },
  { name: 'Hostel Maintenance', description: 'General hostel/dormitory maintenance complaints', defaultPriority: 'medium' },
];

const demoUsers = [
  { name: 'Amaka Student', email: 'student@miva.edu.ng', password: 'password123', role: 'student_staff', department: 'Computer Science' },
  { name: 'Tunde Officer', email: 'officer@miva.edu.ng', password: 'password123', role: 'maintenance_officer', department: 'Facilities' },
  { name: 'Chidi Admin', email: 'admin@miva.edu.ng', password: 'password123', role: 'admin', department: 'Facilities Management' },
];

async function seed() {
  await connectDB();

  await Role.deleteMany({});
  await Role.insertMany(roles);
  console.log(`Seeded ${roles.length} roles`);

  await RequestCategory.deleteMany({});
  await RequestCategory.insertMany(categories);
  console.log(`Seeded ${categories.length} categories`);

  for (const u of demoUsers) {
    const exists = await User.findOne({ email: u.email });
    if (!exists) {
      await User.create(u);
      console.log(`Created demo user: ${u.email} / password123 (${u.role})`);
    } else {
      console.log(`Demo user already exists: ${u.email}`);
    }
  }

  console.log('Seeding complete.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
