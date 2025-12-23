const db = require('../config/db');
const { getLocalTimestamp } = require('../utils/dateUtils');

class CV {
  constructor(id, user_id, title, content, is_template, created_at, modified_at, deleted_at) {
    this.id = id;
    this.user_id = user_id;
    this.title = title;
    this.content = content;
    this.is_template = is_template;
    this.created_at = created_at;
    this.modified_at = modified_at;
    this.deleted_at = deleted_at;
  }

  // Get all CVs for a user
  static async getByUserId(userId) {
    try {
      const query = 'SELECT * FROM cvs WHERE user_id = ? AND deleted_at IS NULL AND deleted = FALSE ORDER BY created_at DESC';
      const [rows] = await db.query(query, [userId]);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Get a specific CV by ID and user ID
  static async getByIdAndUserId(id, userId) {
    try {
      const query = 'SELECT * FROM cvs WHERE id = ? AND user_id = ? AND deleted_at IS NULL AND deleted = FALSE';
      const [rows] = await db.query(query, [id, userId]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      throw error;
    }
  }

  // Create a new CV
  static async create(cvData) {
    const timestamp = getLocalTimestamp();
    const dataWithTimestamps = {
      ...cvData,
      created_at: timestamp,
      modified_at: timestamp,
      deleted: false
    };

    try {
      const [result] = await db.query('INSERT INTO cvs SET ?', dataWithTimestamps);
      return { id: result.insertId, ...dataWithTimestamps };
    } catch (error) {
      throw error;
    }
  }

  // Update a CV
  static async update(id, cvData) {
    const timestamp = getLocalTimestamp();
    const dataWithTimestamp = {
      ...cvData,
      modified_at: timestamp
    };

    try {
      const [result] = await db.query('UPDATE cvs SET ? WHERE id = ? AND deleted_at IS NULL AND deleted = FALSE', [dataWithTimestamp, id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // Soft delete a CV
  static async delete(id) {
    const timestamp = getLocalTimestamp();

    try {
      const [result] = await db.query('UPDATE cvs SET deleted_at = ?, deleted = TRUE WHERE id = ? AND deleted_at IS NULL AND deleted = FALSE', [timestamp, id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // Get all non-deleted CVs for a user (alias for getByUserId)
  static async getActiveByUserId(userId) {
    return await CV.getByUserId(userId);
  }

  // Find CVs with pagination and filtering
  static async findWithPagination(filters = {}, limit = 10, offset = 0) {
    try {
      let query = 'SELECT * FROM cvs WHERE deleted_at IS NULL AND deleted = FALSE';
      const values = [];
      
      // Add filtering conditions
      if (filters.user_id) {
        query += ' AND user_id = ?';
        values.push(filters.user_id);
      }
      
      if (filters.search) {
        query += ' AND title LIKE ?';
        values.push(`%${filters.search}%`);
      }
      
      if (filters.is_template !== undefined) {
        query += ' AND is_template = ?';
        values.push(filters.is_template);
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

  // Count CVs with filtering
  static async count(filters = {}) {
    try {
      let query = 'SELECT COUNT(*) as count FROM cvs WHERE deleted_at IS NULL AND deleted = FALSE';
      const values = [];
      
      // Add filtering conditions
      if (filters.user_id) {
        query += ' AND user_id = ?';
        values.push(filters.user_id);
      }
      
      if (filters.search) {
        query += ' AND title LIKE ?';
        values.push(`%${filters.search}%`);
      }
      
      if (filters.is_template !== undefined) {
        query += ' AND is_template = ?';
        values.push(filters.is_template);
      }
      
      const [rows] = await db.query(query, values);
      return rows[0].count;
    } catch (error) {
      throw error;
    }
  }

  // Get all public templates
  static async getPublicTemplates() {
    try {
      const query = 'SELECT * FROM cvs WHERE is_template = TRUE AND deleted_at IS NULL AND deleted = FALSE ORDER BY created_at DESC';
      const [rows] = await db.query(query);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Get a template by ID
  static async getTemplateById(id) {
    try {
      const query = 'SELECT * FROM cvs WHERE id = ? AND is_template = TRUE AND deleted_at IS NULL AND deleted = FALSE';
      const [rows] = await db.query(query, [id]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      throw error;
    }
  }

  // Create a template from an existing CV
  static async createTemplateFromCV(cvId, userId, title) {
    try {
      const query = `
        INSERT INTO cvs (user_id, title, content, is_template, created_at, modified_at, deleted)
        SELECT user_id, ?, content, TRUE, NOW(), NOW(), FALSE
        FROM cvs 
        WHERE id = ? AND user_id = ? AND deleted_at IS NULL AND deleted = FALSE
      `;
      
      const [result] = await db.query(query, [title, cvId, userId]);
      return result.insertId;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = CV;
