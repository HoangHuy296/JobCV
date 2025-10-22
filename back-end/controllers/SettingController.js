const Setting = require('../models/Setting');

// Get all settings with pagination and filtering
const getAllSettings = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const group = req.query.group || '';
    const key = req.query.key || '';
    const offset = (page - 1) * limit;
    
    const filters = {};
    if (group) {
      filters.setting_group = group;
    }
    if (key) {
      filters.setting_key = key;
    }
    
    const settings = await Setting.findWithPagination(filters, limit, offset);
    const total = await Setting.count(filters);
    
    res.json({
      result: {
        settings: settings,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      },
      message: null
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ result: null, message: 'Lấy danh sách cài đặt thất bại' });
  }
};

// Get setting by key and group
const getSettingByKeyAndGroup = async (req, res) => {
  try {
    const { key, group } = req.params;
    const setting = await Setting.getByKeyAndGroup(key, group);
    
    if (!setting) {
      return res.status(404).json({ result: null, message: 'Không tìm thấy cài đặt' });
    }
    
    res.json({ result: setting, message: null });
  } catch (error) {
    console.error('Error fetching setting:', error);
    res.status(500).json({ result: null, message: 'Lấy thông tin cài đặt thất bại' });
  }
};

// Create or update a setting
const createOrUpdateSetting = async (req, res) => {
  try {
    const { key, value, group, description } = req.body;
    
    if (!key) {
      return res.status(400).json({ result: null, message: 'Khóa cài đặt là bắt buộc' });
    }
    
    const setting = await Setting.set(key, value, group, description);
    
    res.status(201).json({
      result: setting,
      message: null
    });
  } catch (error) {
    console.error('Error creating/updating setting:', error);
    res.status(500).json({ result: null, message: 'Lưu cài đặt thất bại' });
  }
};

// Delete a setting (soft delete)
const deleteSetting = async (req, res) => {
  try {
    const { key, group } = req.params;
    
    // Check if setting exists
    const setting = await Setting.getByKeyAndGroup(key, group);
    
    if (!setting) {
      return res.status(404).json({ result: null, message: 'Không tìm thấy cài đặt' });
    }
    
    await Setting.delete(key, group);
    
    res.json({ result: true, message: null });
  } catch (error) {
    console.error('Error deleting setting:', error);
    res.status(500).json({ result: null, message: 'Xóa cài đặt thất bại' });
  }
};

module.exports = {
  getAllSettings,
  getSettingByKeyAndGroup,
  createOrUpdateSetting,
  deleteSetting
};
