const APIKey = require('../models/APIKey');

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

// Mask API key for display (show only first 8 and last 4 characters)
const maskAPIKey = (key) => {
  if (!key || key.length < 12) return '***';
  return `${key.substring(0, 8)}...${key.substring(key.length - 4)}`;
};

// Get all API keys
const getAllAPIKeys = async (req, res) => {
  if (!checkAdminRole(req, res)) return;

  try {
    const provider = req.query.provider || null;
    const activeOnly = req.query.active === 'true';

    const keys = await APIKey.getAll(provider, activeOnly);

    // Mask API keys in response
    const maskedKeys = keys.map(key => ({
      ...key,
      api_key: maskAPIKey(key.api_key),
      api_key_preview: maskAPIKey(key.api_key)
    }));

    res.json({
      success: true,
      result: maskedKeys
    });
  } catch (error) {
    console.error('Error getting API keys:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get API keys',
      error: error.message
    });
  }
};

// Get API key by ID
const getAPIKeyById = async (req, res) => {
  if (!checkAdminRole(req, res)) return;

  try {
    const { id } = req.params;
    const key = await APIKey.getById(id);

    if (!key) {
      return res.status(404).json({
        success: false,
        message: 'API key not found'
      });
    }

    // Mask API key in response
    res.json({
      success: true,
      result: {
        ...key,
        api_key: maskAPIKey(key.api_key),
        api_key_preview: maskAPIKey(key.api_key)
      }
    });
  } catch (error) {
    console.error('Error getting API key:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get API key',
      error: error.message
    });
  }
};

// Create new API key
const createAPIKey = async (req, res) => {
  if (!checkAdminRole(req, res)) return;

  try {
    const { name, provider, api_key, is_active, daily_limit, priority, notes } = req.body;

    // Validate required fields
    if (!name || !api_key) {
      return res.status(400).json({
        success: false,
        message: 'Name and API key are required'
      });
    }

    // Validate provider
    const validProviders = ['gemini'];
    if (provider && !validProviders.includes(provider)) {
      return res.status(400).json({
        success: false,
        message: `Invalid provider. Must be one of: ${validProviders.join(', ')}`
      });
    }

    const newKey = await APIKey.create({
      name,
      provider: provider || 'gemini',
      api_key,
      is_active: is_active !== undefined ? is_active : true,
      daily_limit: daily_limit || 1500,
      priority: priority || 0,
      notes
    });

    res.status(201).json({
      success: true,
      result: {
        ...newKey,
        api_key: maskAPIKey(newKey.api_key),
        api_key_preview: maskAPIKey(newKey.api_key)
      }
    });
  } catch (error) {
    console.error('Error creating API key:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create API key',
      error: error.message
    });
  }
};

// Update API key
const updateAPIKey = async (req, res) => {
  if (!checkAdminRole(req, res)) return;

  try {
    const { id } = req.params;
    const { name, api_key, is_active, daily_limit, priority, notes } = req.body;

    const existingKey = await APIKey.getById(id);
    if (!existingKey) {
      return res.status(404).json({
        success: false,
        message: 'API key not found'
      });
    }

    const updatedKey = await APIKey.update(id, {
      name,
      api_key,
      is_active,
      daily_limit,
      priority,
      notes
    });

    res.json({
      success: true,
      result: {
        ...updatedKey,
        api_key: maskAPIKey(updatedKey.api_key),
        api_key_preview: maskAPIKey(updatedKey.api_key)
      }
    });
  } catch (error) {
    console.error('Error updating API key:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update API key',
      error: error.message
    });
  }
};

// Delete API key
const deleteAPIKey = async (req, res) => {
  if (!checkAdminRole(req, res)) return;

  try {
    const { id } = req.params;

    const existingKey = await APIKey.getById(id);
    if (!existingKey) {
      return res.status(404).json({
        success: false,
        message: 'API key not found'
      });
    }

    await APIKey.delete(id);

    res.json({
      success: true
    });
  } catch (error) {
    console.error('Error deleting API key:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete API key',
      error: error.message
    });
  }
};

// Toggle API key active status
const toggleAPIKeyActive = async (req, res) => {
  if (!checkAdminRole(req, res)) return;

  try {
    const { id } = req.params;

    const existingKey = await APIKey.getById(id);
    if (!existingKey) {
      return res.status(404).json({
        success: false,
        message: 'API key not found'
      });
    }

    const updatedKey = await APIKey.toggleActive(id);

    res.json({
      success: true,
      result: {
        ...updatedKey,
        api_key: maskAPIKey(updatedKey.api_key),
        api_key_preview: maskAPIKey(updatedKey.api_key)
      }
    });
  } catch (error) {
    console.error('Error toggling API key status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle API key status',
      error: error.message
    });
  }
};

// Get usage statistics
const getUsageStats = async (req, res) => {
  if (!checkAdminRole(req, res)) return;

  try {
    const provider = req.query.provider || null;
    const stats = await APIKey.getUsageStats(provider);

    res.json({
      success: true,
      result: stats
    });
  } catch (error) {
    console.error('Error getting usage stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get usage stats',
      error: error.message
    });
  }
};

module.exports = {
  getAllAPIKeys,
  getAPIKeyById,
  createAPIKey,
  updateAPIKey,
  deleteAPIKey,
  toggleAPIKeyActive,
  getUsageStats
};
