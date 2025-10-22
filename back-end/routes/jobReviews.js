const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const {
  submitForReview,
  cancelSubmitForReview,
  getPendingReviews,
  getJobsByStatus,
  reviewJob,
  getJobReviewHistory,
  getReviewStatistics,
  reportJob,
  reportJobPublic,
  getAllJobReports,
  updateReportStatus
} = require('../controllers/JobReviewController');

// Public routes (no authentication required)
router.post('/:jobId/report/public', reportJobPublic);

// Apply authentication middleware to protected routes
router.use(authenticate);

// Job review routes
router.post('/:jobId/submit', submitForReview);
router.post('/:jobId/cancel', cancelSubmitForReview);
router.get('/:jobId/history', getJobReviewHistory);
router.post('/:jobId/report', reportJob);

// Admin-only review routes
router.get('/pending', getPendingReviews);
router.get('/jobs', getJobsByStatus);
router.post('/:jobId/review', reviewJob);
router.get('/statistics', getReviewStatistics);

// Job reports routes (admin only)
router.get('/reports', getAllJobReports);
router.put('/reports/:reportId', updateReportStatus);

module.exports = router;
