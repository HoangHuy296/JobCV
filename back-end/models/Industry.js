const db = require('../config/db');

class Industry {
  constructor(id, name, created_at, modified_at, deleted_at) {
    this.id = id;
    this.name = name;
    this.created_at = created_at;
    this.modified_at = modified_at;
    this.deleted_at = deleted_at;
  }

  // Find industries with pagination and filtering
  static async findWithPagination(filters = {}, limit = 10, offset = 0, sortBy = 'name', sortOrder = 'ASC') {
    let query = 'SELECT * FROM industries WHERE deleted_at IS NULL AND deleted = FALSE';
    const values = [];
    
    // Add filtering conditions
    if (filters.search) {
      query += ' AND name LIKE ?';
      values.push(`%${filters.search}%`);
    }
    
    // Add sorting
    query += ` ORDER BY ${sortBy} ${sortOrder}`;
    
    // Add pagination
    query += ' LIMIT ? OFFSET ?';
    values.push(limit, offset);
    
    try {
      const [rows] = await db.query(query, values);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Count industries with filtering
  static async count(filters = {}) {
    let query = 'SELECT COUNT(*) as count FROM industries WHERE deleted_at IS NULL AND deleted = FALSE';
    const values = [];
    
    // Add filtering conditions
    if (filters.search) {
      query += ' AND name LIKE ?';
      values.push(`%${filters.search}%`);
    }
    
    try {
      const [rows] = await db.query(query, values);
      return rows[0].count;
    } catch (error) {
      throw error;
    }
  }

  // Get all industries with filtering and sorting
  static async findAll(filters = {}, sortBy = 'name', sortOrder = 'ASC') {
    try {
      let query = 'SELECT * FROM industries WHERE deleted_at IS NULL AND deleted = FALSE';
      const values = [];
      
      // Add filtering conditions
      if (filters.search) {
        query += ' AND name LIKE ?';
        values.push(`%${filters.search}%`);
      }
      
      // Add sorting
      query += ` ORDER BY ${sortBy} ${sortOrder}`;
      
      const [rows] = await db.query(query, values);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Get industry by ID
  static async findById(id) {
    try {
      const query = 'SELECT * FROM industries WHERE id = ? AND deleted_at IS NULL AND deleted = FALSE';
      const [rows] = await db.query(query, [id]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      throw error;
    }
  }

  // Create a new industry
  static async create(name) {
    const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
    
    try {
      const query = 'INSERT INTO industries (name, created_at, modified_at) VALUES (?, ?, ?)';
      const values = [name, timestamp, timestamp];
      
      const [result] = await db.query(query, values);
      return { id: result.insertId, name, created_at: timestamp, modified_at: timestamp };
    } catch (error) {
      throw error;
    }
  }

  // Update industry
  static async update(id, name) {
    const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
    
    try {
      const query = 'UPDATE industries SET name = ?, modified_at = ? WHERE id = ? AND deleted_at IS NULL AND deleted = FALSE';
      const values = [name, timestamp, id];
      
      const [result] = await db.query(query, values);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // Delete industry (soft delete)
  static async delete(id) {
    const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
    
    try {
      const query = 'UPDATE industries SET deleted_at = ?, deleted = TRUE WHERE id = ? AND deleted_at IS NULL AND deleted = FALSE';
      const [result] = await db.query(query, [timestamp, id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Industry;
