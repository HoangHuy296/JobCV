const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const {
  getAllAPIKeys,
  getAPIKeyById,
  createAPIKey,
  updateAPIKey,
  deleteAPIKey,
  toggleAPIKeyActive,
  getUsageStats
} = require('../controllers/APIKeyController');

// All routes require authentication and admin role
router.use(authenticate);

// API Keys management routes
router.get('/', getAllAPIKeys);
router.get('/stats', getUsageStats);
router.get('/:id', getAPIKeyById);
router.post('/', createAPIKey);
router.put('/:id', updateAPIKey);
router.delete('/:id', deleteAPIKey);
router.patch('/:id/toggle-active', toggleAPIKeyActive);

module.exports = router;
