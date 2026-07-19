const express = require('express');
const { getSummary, exportCsv } = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/summary', getSummary);
router.get('/export/csv', exportCsv);

module.exports = router;
