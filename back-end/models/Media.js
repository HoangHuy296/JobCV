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
    
    let query = `SELECT * FROM ${this.table} WHERE deleted = FALSE`;
    const params = [];
    
    if (search) {
      query += ' AND (filename LIKE ? OR original_name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const [media] = await db.query(query, params);
    
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
