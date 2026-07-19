const express = require('express');
const { body } = require('express-validator');
const {
  createRequest,
  getRequests,
  getRequestById,
  updateRequest,
  assignRequest,
  updateStatus,
  deleteRequest,
} = require('../controllers/requestController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const upload = require('../middleware/upload');

const router = express.Router();

router.use(protect); // every route below requires authentication

router.get('/', getRequests);

router.post(
  '/',
  authorize('student_staff', 'admin'),
  upload.array('evidence', 5),
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('category').notEmpty().withMessage('Category is required'),
    body('location').trim().notEmpty().withMessage('Location is required'),
  ],
  validate,
  createRequest
);

router.get('/:id', getRequestById);

router.put(
  '/:id',
  [
    body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
    body('description').optional().trim().notEmpty().withMessage('Description cannot be empty'),
  ],
  validate,
  updateRequest
);

router.post(
  '/:id/assign',
  authorize('admin'),
  [body('officerId').notEmpty().withMessage('officerId is required')],
  validate,
  assignRequest
);

router.patch(
  '/:id/status',
  authorize('maintenance_officer', 'admin'),
  [body('status').notEmpty().withMessage('status is required')],
  validate,
  updateStatus
);

router.delete('/:id', deleteRequest);

module.exports = router;
