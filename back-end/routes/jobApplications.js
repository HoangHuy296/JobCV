const express = require('express');
const router = express.Router();
const {
  applyForJob,
  getMyApplications,
  getJobApplications,
  getApplicationById,
  updateApplicationStatus,
  withdrawApplication,
  getJobApplicationStats,
  updateApplicationCV,
  checkApplicationStatus
} = require('../controllers/JobApplicationController');
const authenticate = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Job Applications
 *   description: Job application management
 */

/**
 * @swagger
 * /api/job-applications/apply:
 *   post:
 *     summary: Apply for a job
 *     tags: [Job Applications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - job_id
 *             properties:
 *               job_id:
 *                 type: integer
 *               cv_id:
 *                 type: integer
 *               cover_letter:
 *                 type: string
 *     responses:
 *       201:
 *         description: Application submitted successfully
 *       400:
 *         description: Invalid request or job closed
 *       401:
 *         description: Unauthorized
 */
router.post('/apply', authenticate, applyForJob);

/**
 * @swagger
 * /api/job-applications/my-applications:
 *   get:
 *     summary: Get current user's applications
 *     tags: [Job Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of user applications
 *       401:
 *         description: Unauthorized
 */
router.get('/my-applications', authenticate, getMyApplications);

/**
 * @swagger
 * /api/job-applications/job/{id}:
 *   get:
 *     summary: Get applications for a job (recruiter/admin only)
 *     tags: [Job Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Job ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, reviewing, shortlisted, rejected, accepted]
 *     responses:
 *       200:
 *         description: List of applications
 *       403:
 *         description: Forbidden
 */
router.get('/job/:id', authenticate, getJobApplications);

/**
 * @swagger
 * /api/job-applications/job/{id}/stats:
 *   get:
 *     summary: Get application statistics for a job
 *     tags: [Job Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Application statistics
 */
router.get('/job/:id/stats', authenticate, getJobApplicationStats);

/**
 * @swagger
 * /api/job-applications/{id}:
 *   get:
 *     summary: Get application details
 *     tags: [Job Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Application details
 *       404:
 *         description: Application not found
 */
router.get('/:id', authenticate, getApplicationById);

/**
 * @swagger
 * /api/job-applications/{id}/status:
 *   put:
 *     summary: Update application status (recruiter/admin only)
 *     tags: [Job Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, reviewing, shortlisted, rejected, accepted]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Status updated successfully
 *       403:
 *         description: Forbidden
 */
router.put('/:id/status', authenticate, updateApplicationStatus);

/**
 * @swagger
 * /api/job-applications/{id}/withdraw:
 *   delete:
 *     summary: Withdraw application (user only)
 *     tags: [Job Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Application withdrawn successfully
 *       403:
 *         description: Forbidden
 */
router.delete('/:id/withdraw', authenticate, withdrawApplication);

/**
 * @swagger
 * /api/job-applications/check/{jobId}:
 *   get:
 *     summary: Check if user has applied for a job
 *     tags: [Job Applications]
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Application status
 */
router.get('/check/:jobId', authenticate, checkApplicationStatus);

/**
 * @swagger
 * /api/job-applications/{id}/update-cv:
 *   put:
 *     summary: Update CV for application (user only, before job is closed)
 *     tags: [Job Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cv_id
 *             properties:
 *               cv_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: CV updated successfully
 *       400:
 *         description: Job is closed or invalid CV
 *       403:
 *         description: Forbidden
 */
router.put('/:id/update-cv', authenticate, updateApplicationCV);

module.exports = router;
