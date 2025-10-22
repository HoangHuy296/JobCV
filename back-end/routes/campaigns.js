/**
 * Campaign Routes
 * Routes for managing recruitment campaigns
 */

const express = require('express');
const router = express.Router();
const CampaignController = require('../controllers/CampaignController');
const authenticate = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Campaign CRUD
router.post('/', CampaignController.createCampaign);
router.get('/', CampaignController.getCampaigns);
router.get('/:id', CampaignController.getCampaign);
router.put('/:id', CampaignController.updateCampaign);
router.delete('/:id', CampaignController.deleteCampaign);

// Campaign jobs management
router.post('/:id/jobs', CampaignController.addJobToCampaign);
router.delete('/:id/jobs/:job_id', CampaignController.removeJobFromCampaign);
router.get('/:id/jobs', CampaignController.getCampaignJobs);

// Campaign statistics
router.get('/:id/stats', CampaignController.getCampaignStats);

module.exports = router;
