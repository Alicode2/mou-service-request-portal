jest.setTimeout(10000); // 10 seconds
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;
let app;
let RequestCategory;

let studentToken;
let officerToken;
let adminToken;
let officerId;
let categoryId;
let createdRequestId;

beforeAll(async () => {
  process.env.JWT_SECRET = 'test_secret';
  process.env.NODE_ENV = 'test';
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongoServer.getUri();
  await mongoose.connect(process.env.MONGO_URI);
  app = require('../server');
  RequestCategory = require('../models/RequestCategory');

  const category = await RequestCategory.create({ name: 'Electrical', description: 'Wiring issues' });
  categoryId = category._id.toString();

  // Register a student/staff user
  const studentRes = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Student One', email: 'student1@campus.edu', password: 'password123' });
  studentToken = studentRes.body.token;

  // Register an admin directly via User model (bootstrap, since /api/users requires an admin)
  const User = require('../models/User');
  const admin = await User.create({
    name: 'Admin One',
    email: 'admin1@campus.edu',
    password: 'password123',
    role: 'admin',
  });
  const adminLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin1@campus.edu', password: 'password123' });
  adminToken = adminLogin.body.token;

  // Admin creates a maintenance officer
  const officerRes = await request(app)
    .post('/api/users')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: 'Officer One', email: 'officer1@campus.edu', password: 'password123', role: 'maintenance_officer' });
  officerId = officerRes.body.user.id;

  const officerLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'officer1@campus.edu', password: 'password123' });
  officerToken = officerLogin.body.token;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Service request lifecycle', () => {
  test('student can create a service request', async () => {
    const res = await request(app)
      .post('/api/requests')
      .set('Authorization', `Bearer ${studentToken}`)
      .field('title', 'Broken socket in Room 204')
      .field('description', 'Power socket sparks when plugged in')
      .field('category', categoryId)
      .field('location', 'Block A, Room 204')
      .field('priority', 'high');

    expect(res.statusCode).toBe(201);
    expect(res.body.request.status).toBe('pending');
    createdRequestId = res.body.request._id;
  });

  test('rejects creation with missing required fields', async () => {
    const res = await request(app)
      .post('/api/requests')
      .set('Authorization', `Bearer ${studentToken}`)
      .field('title', 'Missing stuff');
    expect(res.statusCode).toBe(400);
  });

  test('officer cannot create a request (RBAC)', async () => {
    const res = await request(app)
      .post('/api/requests')
      .set('Authorization', `Bearer ${officerToken}`)
      .field('title', 'Should fail')
      .field('description', 'desc')
      .field('category', categoryId)
      .field('location', 'Block B');
    expect(res.statusCode).toBe(403);
  });

  test('student sees only their own requests', async () => {
    const res = await request(app).get('/api/requests').set('Authorization', `Bearer ${studentToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.requests.length).toBeGreaterThan(0);
    res.body.requests.forEach((r) => {
      expect(r.submittedBy).toBeDefined();
    });
  });

  test('admin can assign the request to the officer', async () => {
    const res = await request(app)
      .post(`/api/requests/${createdRequestId}/assign`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ officerId, notes: 'Please check today' });
    expect(res.statusCode).toBe(201);
    expect(res.body.request.status).toBe('assigned');
  });

  test('officer can update status of their assigned request', async () => {
    const res = await request(app)
      .patch(`/api/requests/${createdRequestId}/status`)
      .set('Authorization', `Bearer ${officerToken}`)
      .send({ status: 'in_progress', note: 'Started work' });
    expect(res.statusCode).toBe(200);
    expect(res.body.request.status).toBe('in_progress');
  });

  test('a different officer cannot update a request not assigned to them', async () => {
    const otherOfficer = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Officer Two', email: 'officer2@campus.edu', password: 'password123', role: 'maintenance_officer' });
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'officer2@campus.edu', password: 'password123' });

    const res = await request(app)
      .patch(`/api/requests/${createdRequestId}/status`)
      .set('Authorization', `Bearer ${login.body.token}`)
      .send({ status: 'completed' });
    expect(res.statusCode).toBe(403);
  });

  test('search and pagination params are accepted', async () => {
    const res = await request(app)
      .get('/api/requests?search=socket&page=1&limit=5')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.pagination).toBeDefined();
    expect(res.body.pagination.page).toBe(1);
  });

  test('request detail includes status history', async () => {
    const res = await request(app)
      .get(`/api/requests/${createdRequestId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.statusHistory.length).toBeGreaterThanOrEqual(3); // created, assigned, in_progress
  });
});
