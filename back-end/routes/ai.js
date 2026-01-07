const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const {
  // Prompts
  getAllPrompts,
  getPromptById,
  createPrompt,
  updatePrompt,
  deletePrompt,
  listPromptFiles,
  
  // Processes
  getAllProcesses,
  getProcessById,
  getProcessByCode,
  createProcess,
  updateProcess,
  assignPromptToProcess,
  toggleProcessActive,
  deleteProcess
} = require('../controllers/AIController');

// All routes require authentication (role check will be in controller)
router.use(authenticate);

// ============ PROMPT ROUTES ============
router.get('/prompts', getAllPrompts);
router.get('/prompts/files', listPromptFiles);
router.get('/prompts/:id', getPromptById);
router.post('/prompts', createPrompt);
router.put('/prompts/:id', updatePrompt);
router.delete('/prompts/:id', deletePrompt);

// ============ PROCESS ROUTES ============
router.get('/processes', getAllProcesses);
router.get('/processes/:id', getProcessById);
router.get('/processes/code/:code', getProcessByCode);
router.post('/processes', createProcess);
router.put('/processes/:id', updateProcess);
router.post('/processes/assign-prompt', assignPromptToProcess);
router.patch('/processes/:id/toggle-active', toggleProcessActive);
router.delete('/processes/:id', deleteProcess);

module.exports = router;
