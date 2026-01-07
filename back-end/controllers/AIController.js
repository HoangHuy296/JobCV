const AIPrompt = require('../models/AIPrompt');
const AIProcess = require('../models/AIProcess');

// Helper function to check admin role
const checkAdminRole = (req, res) => {
  if (!req.user || req.user.role?.name !== 'admin') {
    res.status(403).json({
      success: false,
      message: 'Access denied. Admin role required.'
    });
    return false;
  }
  return true;
};

// ============ PROMPT MANAGEMENT ============

// Get all prompts
const getAllPrompts = async (req, res) => {
  if (!checkAdminRole(req, res)) return;
  
  try {
    const prompts = await AIPrompt.getAll();
    
    // Read content for each prompt
    const promptsWithContent = await Promise.all(
      prompts.map(async (prompt) => {
        try {
          const content = await AIPrompt.readPromptContent(prompt.filename);
          return {
            ...prompt,
            content,
            variables: typeof prompt.variables === 'string' ? JSON.parse(prompt.variables) : prompt.variables
          };
        } catch (error) {
          return {
            ...prompt,
            content: null,
            contentError: error.message,
            variables: typeof prompt.variables === 'string' ? JSON.parse(prompt.variables) : prompt.variables
          };
        }
      })
    );

    res.json({
      success: true,
      result: promptsWithContent
    });
  } catch (error) {
    console.error('Error getting prompts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get prompts',
      error: error.message
    });
  }
};

// Get prompt by ID
const getPromptById = async (req, res) => {
  if (!checkAdminRole(req, res)) return;
  
  try {
    const { id } = req.params;
    const prompt = await AIPrompt.getById(id);

    if (!prompt) {
      return res.status(404).json({
        success: false,
        message: 'Prompt not found'
      });
    }

    // Read prompt content
    const content = await AIPrompt.readPromptContent(prompt.filename);

    res.json({
      success: true,
      result: {
        ...prompt,
        content,
        variables: typeof prompt.variables === 'string' ? JSON.parse(prompt.variables) : prompt.variables
      }
    });
  } catch (error) {
    console.error('Error getting prompt:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get prompt',
      error: error.message
    });
  }
};

// Create new prompt
const createPrompt = async (req, res) => {
  if (!checkAdminRole(req, res)) return;
  
  try {
    const { name, filename, description, category, variables, content } = req.body;

    // Validate required fields
    if (!name || !filename || !content) {
      return res.status(400).json({
        success: false,
        message: 'Name, filename, and content are required'
      });
    }

    // Ensure filename ends with .txt
    const finalFilename = filename.endsWith('.txt') ? filename : `${filename}.txt`;

    // Create the prompt file first
    await AIPrompt.createPromptFile(finalFilename, content);

    // Create database record
    const prompt = await AIPrompt.create({
      name,
      filename: finalFilename,
      description,
      category,
      variables
    });

    res.status(201).json({
      success: true,
      result: prompt
    });
  } catch (error) {
    console.error('Error creating prompt:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create prompt',
      error: error.message
    });
  }
};

// Update prompt
const updatePrompt = async (req, res) => {
  if (!checkAdminRole(req, res)) return;
  
  try {
    const { id } = req.params;
    const { name, description, category, variables, content } = req.body;

    const prompt = await AIPrompt.getById(id);
    if (!prompt) {
      return res.status(404).json({
        success: false,
        message: 'Prompt not found'
      });
    }

    // Update prompt content if provided
    if (content !== undefined) {
      await AIPrompt.updateContent(prompt.filename, content);
    }

    // Update database record
    const updatedPrompt = await AIPrompt.update(id, {
      name,
      description,
      category,
      variables
    });

    res.json({
      success: true,
      result: updatedPrompt
    });
  } catch (error) {
    console.error('Error updating prompt:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update prompt',
      error: error.message
    });
  }
};

// Delete prompt
const deletePrompt = async (req, res) => {
  if (!checkAdminRole(req, res)) return;
  
  try {
    const { id } = req.params;

    await AIPrompt.delete(id);

    res.json({
      success: true
    });
  } catch (error) {
    console.error('Error deleting prompt:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete prompt',
      error: error.message
    });
  }
};

// List all prompt files
const listPromptFiles = async (req, res) => {
  if (!checkAdminRole(req, res)) return;
  
  try {
    const files = await AIPrompt.listPromptFiles();

    res.json({
      success: true,
      result: files
    });
  } catch (error) {
    console.error('Error listing prompt files:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list prompt files',
      error: error.message
    });
  }
};

// ============ PROCESS MANAGEMENT ============

// Get all processes
const getAllProcesses = async (req, res) => {
  if (!checkAdminRole(req, res)) return;
  
  try {
    const processes = await AIProcess.getAll();
    
    const processesWithParsedConfig = processes.map(process => ({
      ...process,
      config: typeof process.config === 'string' ? JSON.parse(process.config) : process.config
    }));

    res.json({
      success: true,
      result: processesWithParsedConfig
    });
  } catch (error) {
    console.error('Error getting processes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get processes',
      error: error.message
    });
  }
};

// Get process by ID
const getProcessById = async (req, res) => {
  if (!checkAdminRole(req, res)) return;
  
  try {
    const { id } = req.params;
    const process = await AIProcess.getById(id);

    if (!process) {
      return res.status(404).json({
        success: false,
        message: 'Process not found'
      });
    }

    res.json({
      success: true,
      result: {
        ...process,
        config: typeof process.config === 'string' ? JSON.parse(process.config) : process.config
      }
    });
  } catch (error) {
    console.error('Error getting process:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get process',
      error: error.message
    });
  }
};

// Get process by code
const getProcessByCode = async (req, res) => {
  if (!checkAdminRole(req, res)) return;
  
  try {
    const { code } = req.params;
    const process = await AIProcess.getByCode(code);

    if (!process) {
      return res.status(404).json({
        success: false,
        message: 'Process not found'
      });
    }

    // Read prompt content if assigned
    let promptContent = null;
    if (process.prompt_filename) {
      try {
        promptContent = await AIPrompt.readPromptContent(process.prompt_filename);
      } catch (error) {
        console.error('Error reading prompt content:', error);
      }
    }

    res.json({
      success: true,
      result: {
        ...process,
        config: typeof process.config === 'string' ? JSON.parse(process.config) : process.config,
        prompt_content: promptContent
      }
    });
  } catch (error) {
    console.error('Error getting process:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get process',
      error: error.message
    });
  }
};

// Create new process
const createProcess = async (req, res) => {
  if (!checkAdminRole(req, res)) return;
  
  try {
    const { name, code, description, prompt_id, is_active, config } = req.body;

    // Validate required fields
    if (!name || !code) {
      return res.status(400).json({
        success: false,
        message: 'Name and code are required'
      });
    }

    const process = await AIProcess.create({
      name,
      code,
      description,
      prompt_id,
      is_active,
      config
    });

    res.status(201).json({
      success: true,
      result: process
    });
  } catch (error) {
    console.error('Error creating process:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create process',
      error: error.message
    });
  }
};

// Update process
const updateProcess = async (req, res) => {
  if (!checkAdminRole(req, res)) return;
  
  try {
    const { id } = req.params;
    const { name, description, prompt_id, is_active, config } = req.body;

    const updatedProcess = await AIProcess.update(id, {
      name,
      description,
      prompt_id,
      is_active,
      config
    });

    res.json({
      success: true,
      result: updatedProcess
    });
  } catch (error) {
    console.error('Error updating process:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update process',
      error: error.message
    });
  }
};

// Assign prompt to process
const assignPromptToProcess = async (req, res) => {
  if (!checkAdminRole(req, res)) return;
  
  try {
    const { processId, promptId } = req.body;

    if (!processId || !promptId) {
      return res.status(400).json({
        success: false,
        message: 'Process ID and Prompt ID are required'
      });
    }

    const updatedProcess = await AIProcess.assignPrompt(processId, promptId);

    res.json({
      success: true,
      result: updatedProcess
    });
  } catch (error) {
    console.error('Error assigning prompt:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign prompt',
      error: error.message
    });
  }
};

// Toggle process active status
const toggleProcessActive = async (req, res) => {
  if (!checkAdminRole(req, res)) return;
  
  try {
    const { id } = req.params;

    const updatedProcess = await AIProcess.toggleActive(id);

    res.json({
      success: true,
      result: updatedProcess
    });
  } catch (error) {
    console.error('Error toggling process status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle process status',
      error: error.message
    });
  }
};

// Delete process
const deleteProcess = async (req, res) => {
  if (!checkAdminRole(req, res)) return;
  
  try {
    const { id } = req.params;

    await AIProcess.delete(id);

    res.json({
      success: true
    });
  } catch (error) {
    console.error('Error deleting process:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete process',
      error: error.message
    });
  }
};

module.exports = {
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
};
