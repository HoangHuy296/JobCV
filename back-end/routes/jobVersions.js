/**
 * Job Versions Routes
 * Routes for managing job versions
 */

const express = require('express');
const router = express.Router();
const JobVersionController = require('../controllers/JobVersionController');
const authenticate = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Create a new version of a job
router.post('/:jobId/versions', JobVersionController.createJobVersion);

// Get all versions of a job
router.get('/:jobId/versions', JobVersionController.getJobVersions);

// Get a specific version of a job
router.get('/:jobId/versions/:versionId', JobVersionController.getJobVersion);

// Set a version as live (admin only)
router.put('/:jobId/versions/:versionId/live', JobVersionController.setVersionLive);

// Review a job version (admin only)
router.put('/:jobId/versions/:versionId/review', JobVersionController.reviewJobVersion);

module.exports = router;
