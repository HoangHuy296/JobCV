const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const { jobValidationMiddleware } = require('../middleware/jobValidation');
const {
  createJob,
  getAllJobs,
  getJobById,
  updateJob,
  deleteJob,
  getUserJobs,
  getAllLocations,
  likeJob,
  unlikeJob,
  checkLikeStatus,
  getJobPreview,
  getUserLikedJobs,
  closeJob,
  generateJobDescription
} = require('../controllers/JobController');

// Import JobVersionController
const {
  createJobVersion,
  getJobVersions,
  getJobVersion,
  setVersionLive,
  reviewJobVersion,
  setPrimaryVersion,
  updateJobVersion,
  deleteJobVersion
} = require('../controllers/JobVersionController');

// Public routes (no authentication required)
router.get('/', getAllJobs);
router.get('/locations', getAllLocations);
router.get('/preview/:id', getJobPreview);
router.get('/:id', getJobById); // Allow guest access to job details

// Apply authentication middleware to protected routes
router.use(authenticate);

// User-specific routes (must come before protected /:id routes to avoid conflicts)
router.get('/user/my-jobs', getUserJobs);
router.get('/user/liked-jobs', getUserLikedJobs);

// Protected job-specific routes with ID parameter
router.put('/:id', updateJob);
router.delete('/:id', deleteJob);
router.put('/:id/close', closeJob);

// Create a new job
router.post('/', jobValidationMiddleware, createJob);

// Job Version routes - place before other :jobId routes to ensure proper matching
router.post('/:jobId/versions', jobValidationMiddleware, createJobVersion);
router.get('/:jobId/versions', getJobVersions);
router.get('/:jobId/versions/:versionId', getJobVersion);
router.put('/:jobId/versions/:versionId', jobValidationMiddleware, updateJobVersion);
router.delete('/:jobId/versions/:versionId', deleteJobVersion);
router.put('/:jobId/versions/:versionId/live', setVersionLive);
router.put('/:jobId/versions/:versionId/review', reviewJobVersion);
router.put('/:jobId/versions/:versionId/primary', setPrimaryVersion);

// Like routes
router.post('/:jobId/like', likeJob);
router.post('/:jobId/unlike', unlikeJob);
router.get('/:jobId/like-status', checkLikeStatus);

// AI-powered routes
router.post('/ai/generate-description', generateJobDescription);

module.exports = router;
