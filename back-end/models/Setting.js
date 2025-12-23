const db = require('../config/db');
const { getLocalTimestamp } = require('../utils/dateUtils');

class Setting {
  constructor(id, setting_key, setting_value, setting_group, description, created_at, modified_at, deleted_at) {
    this.id = id;
    this.setting_key = setting_key;
    this.setting_value = setting_value;
    this.setting_group = setting_group;
    this.description = description;
    this.created_at = created_at;
    this.modified_at = modified_at;
    this.deleted_at = deleted_at;
  }

  // Define default settings
  static getDefaultSettings() {
    return [
      // Domain settings
      { key: 'APP_URL', group: 'DOMAIN', value: '', description: 'Application URL' },
      { key: 'FRONTEND_URL', group: 'DOMAIN', value: 'http://localhost:3000', description: 'Frontend application URL' },
      
      // Application settings
      { key: 'APP_NAME', group: 'SYSTEM', value: 'Job CV Application', description: 'Application Name' },
      
      // Media settings
      { key: 'MEDIA_MAX_FILE_SIZE', group: 'SYSTEM', value: '5', description: 'Maximum file size for media uploads (in megabytes)' },
      
      // Report settings
      { key: 'MAX_JOB_REPORTS_PER_USER', group: 'REPORT', value: '3', description: 'Maximum number of times a user can report the same job' },
      
      // Email settings
      { key: 'EMAIL_USER', group: 'EMAIL', value: '', description: 'Email address for sending emails' },
      { key: 'EMAIL_APP_PASSWORD', group: 'EMAIL', value: '', description: 'Email app-specific password' },
      
      // Email template settings - Password Reset
      { key: 'EMAIL_RESET_SUBJECT', group: 'EMAIL_TEMPLATE', value: 'Đặt lại mật khẩu - Job-CV', description: 'Subject for password reset email' },
      { key: 'EMAIL_RESET_BODY', group: 'EMAIL_TEMPLATE', value: 'Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn trên Job-CV Platform.', description: 'Body text for password reset email' },
      
      // Email template settings - Welcome
      { key: 'EMAIL_WELCOME_SUBJECT', group: 'EMAIL_TEMPLATE', value: 'Chào mừng đến với Job-CV! 🎉', description: 'Subject for welcome email' },
      { key: 'EMAIL_WELCOME_BODY', group: 'EMAIL_TEMPLATE', value: 'Cảm ơn bạn đã đăng ký tài khoản tại Job-CV Platform!', description: 'Body text for welcome email' },
    ];
  }

  // Get setting by key and group
  static async getByKeyAndGroup(key, group) {
    try {
      const query = 'SELECT * FROM settings WHERE setting_key = ? AND setting_group = ? AND deleted_at IS NULL AND deleted = FALSE';
      const [rows] = await db.query(query, [key, group]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      throw error;
    }
  }

  // Get settings by group
  static async getByGroup(group) {
    try {
      const query = 'SELECT * FROM settings WHERE setting_group = ? AND deleted_at IS NULL AND deleted = FALSE';
      const [rows] = await db.query(query, [group]);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Get setting value by key with default
  static async getValue(key, group, defaultValue = null) {
    const setting = await Setting.getByKeyAndGroup(key, group);
    return setting ? setting.setting_value : defaultValue;
  }

  // Set a setting (create or update)
  static async set(key, value, group = 'general', description = '') {
    try {
      const existing = await Setting.getByKeyAndGroup(key, group);
      const timestamp = getLocalTimestamp();
      
      if (existing) {
        // Update existing setting
        const query = 'UPDATE settings SET setting_value = ?, description = ?, modified_at = ? WHERE setting_key = ? AND setting_group = ? AND deleted_at IS NULL AND deleted = FALSE';
        const [result] = await db.query(query, [value, description, timestamp, key, group]);
        return result.affectedRows > 0;
      } else {
        // Create new setting
        const query = 'INSERT INTO settings (setting_key, setting_value, setting_group, description, created_at, modified_at, deleted) VALUES (?, ?, ?, ?, ?, ?, FALSE)';
        const [result] = await db.query(query, [key, value, group, description, timestamp, timestamp]);
        return result.insertId;
      }
    } catch (error) {
      throw error;
    }
  }

  // Delete a setting (soft delete)
  static async delete(key, group) {
    try {
      const query = 'UPDATE settings SET deleted_at = ?, deleted = TRUE WHERE setting_key = ? AND setting_group = ? AND deleted_at IS NULL AND deleted = FALSE';
      const timestamp = getLocalTimestamp();
      const [result] = await db.query(query, [timestamp, key, group]);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // Find settings with pagination and filtering
  static async findWithPagination(filters = {}, limit = 10, offset = 0) {
    try {
      let query = 'SELECT * FROM settings WHERE deleted_at IS NULL AND deleted = FALSE';
      const values = [];
      
      // Add filtering conditions
      if (filters.setting_group) {
        query += ' AND setting_group = ?';
        values.push(filters.setting_group);
      }
      
      if (filters.setting_key) {
        query += ' AND setting_key LIKE ?';
        values.push(`%${filters.setting_key}%`);
      }
      
      // Add pagination
      query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      values.push(limit, offset);
      
      const [rows] = await db.query(query, values);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Count settings with filtering
  static async count(filters = {}) {
    try {
      let query = 'SELECT COUNT(*) as count FROM settings WHERE deleted_at IS NULL AND deleted = FALSE';
      const values = [];
      
      // Add filtering conditions
      if (filters.setting_group) {
        query += ' AND setting_group = ?';
        values.push(filters.setting_group);
      }
      
      if (filters.setting_key) {
        query += ' AND setting_key LIKE ?';
        values.push(`%${filters.setting_key}%`);
      }
      
      const [rows] = await db.query(query, values);
      return rows[0].count;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Setting;
