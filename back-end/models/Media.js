const db = require('../config/db');
const BaseModel = require('./BaseModel');

class Media extends BaseModel {
  static get table() {
    return 'media';
  }

  static async create(mediaData) {
    try {
      const query = `
        INSERT INTO ${this.table} 
        (filename, original_name, mime_type, size, path, url, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      
      const values = [
        mediaData.filename,
        mediaData.original_name,
        mediaData.mime_type,
        mediaData.size,
        mediaData.path,
        mediaData.url,
        mediaData.created_by || null
      ];
      
      const [result] = await db.query(query, values);
      return result.insertId;
    } catch (error) {
      throw error;
    }
  }

  static async findById(id) {
    try {
      const query = `SELECT * FROM ${this.table} WHERE id = ? AND deleted = FALSE`;
      const [rows] = await db.query(query, [id]);
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  static async findByFilename(filename) {
    try {
      const query = `SELECT * FROM ${this.table} WHERE filename = ? AND deleted = FALSE`;
      const [rows] = await db.query(query, [filename]);
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  static async findAllByUser(userId) {
    try {
      const query = `SELECT * FROM ${this.table} WHERE created_by = ? AND deleted = FALSE ORDER BY created_at DESC`;
      const [rows] = await db.query(query, [userId]);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  static async update(id, updateData) {
    try {
      const fields = [];
      const values = [];
      
      for (const [key, value] of Object.entries(updateData)) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
      
      values.push(id);
      
      const query = `UPDATE ${this.table} SET ${fields.join(', ')} WHERE id = ?`;
      const [result] = await db.query(query, values);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  static async delete(id) {
    try {
      // Soft delete - mark as deleted instead of removing from database
      const query = `UPDATE ${this.table} SET deleted = TRUE, deleted_at = NOW() WHERE id = ?`;
      const [result] = await db.query(query, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  static async deletePermanently(id) {
    try {
      const query = `DELETE FROM ${this.table} WHERE id = ?`;
      const [result] = await db.query(query, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // Get all media with pagination and search
  static async getAllMedia(page = 1, limit = 10, search = '') {
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT m.*,
        u.id as user_id, u.name as user_name, u.email as user_email,
        c.id as company_id, c.name as company_name
      FROM ${this.table} m
      LEFT JOIN users u ON m.id = u.image_id AND u.deleted = FALSE
      LEFT JOIN companies c ON m.id = c.logo_id AND c.deleted = FALSE
      WHERE m.deleted = FALSE
    `;
    const params = [];
    
    if (search) {
      query += ' AND (m.filename LIKE ? OR m.original_name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    
    query += ' ORDER BY m.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const [rows] = await db.query(query, params);
    
    // Transform results to include entity information
    const media = rows.map(row => {
      const mediaData = {
        id: row.id,
        filename: row.filename,
        original_name: row.original_name,
        mime_type: row.mime_type,
        size: row.size,
        path: row.path,
        url: row.url,
        storage_type: row.storage_type,
        created_by: row.created_by,
        created_at: row.created_at,
        modified_at: row.modified_at,
        used_by: []
      };
      
      if (row.user_id) {
        mediaData.used_by.push({
          entity_type: 'user',
          entity_id: row.user_id,
          entity_name: row.user_name,
          entity_email: row.user_email
        });
      }
      
      if (row.company_id) {
        mediaData.used_by.push({
          entity_type: 'company',
          entity_id: row.company_id,
          entity_name: row.company_name
        });
      }
      
      return mediaData;
    });
    
    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM ${this.table} WHERE deleted = FALSE`;
    const countParams = [];
    
    if (search) {
      countQuery += ' AND (filename LIKE ? OR original_name LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`);
    }
    
    const [countResult] = await db.query(countQuery, countParams);
    const total = countResult[0].total;
    
    return { media, total };
  }
}

module.exports = Media;
