const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const {
  getAllIndustries,
  getIndustryById,
  createIndustry,
  updateIndustry,
  deleteIndustry
} = require('../controllers/IndustryController');

// Public routes (no authentication required)
router.get('/', getAllIndustries);

// Protected routes (authentication required)
router.use(authenticate);
router.get('/:id', getIndustryById);
router.post('/', createIndustry);
router.put('/:id', updateIndustry);
router.delete('/:id', deleteIndustry);

module.exports = router;
