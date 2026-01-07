const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const {
  getAllCompanies,
  createCompany,
  getCompanyById,
  getMyCompany,
  updateCompany,
  deleteCompany,
  subscribeToCompany,
  unsubscribeFromCompany,
  checkSubscriptionStatus,
  getUserSubscribedCompanies,
  getTopCompanies,
  generateCompanyDescription
} = require('../controllers/CompanyController');

// Public routes (no authentication required)
router.get('/', getAllCompanies);
router.get('/top', getTopCompanies);
router.get('/my-company', authenticate, getMyCompany);
router.get('/:id', getCompanyById);

// Protected routes (authentication required)
router.use(authenticate);
router.post('/', createCompany);
router.get('/my-company', getMyCompany);
router.get('/user/subscribed-companies', getUserSubscribedCompanies);
router.put('/:id', updateCompany);
router.delete('/:id', deleteCompany);
router.post('/:companyId/subscribe', subscribeToCompany);
router.post('/:companyId/unsubscribe', unsubscribeFromCompany);
router.get('/:companyId/subscription-status', checkSubscriptionStatus);

// AI-powered routes
router.post('/ai/generate-description', generateCompanyDescription);

module.exports = router;
