const db = require('../config/db');

class Role {
  constructor(id, name, description, created_at, modified_at, deleted_at) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.created_at = created_at;
    this.modified_at = modified_at;
    this.deleted_at = deleted_at;
  }

  // Find role by name
  static async findByName(name) {
    try {
      const query = 'SELECT * FROM roles WHERE name = ? AND deleted_at IS NULL AND deleted = FALSE';
      const [rows] = await db.query(query, [name]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      throw error;
    }
  }

  // Find roles with pagination and filtering
  static async findWithPagination(filters = {}, limit = 10, offset = 0) {
    try {
      let query = 'SELECT * FROM roles WHERE deleted_at IS NULL AND deleted = FALSE';
      const values = [];
      
      // Add filtering conditions
      if (filters.name) {
        query += ' AND name LIKE ?';
        values.push(`%${filters.name}%`);
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

  // Count roles with filtering
  static async count(filters = {}) {
    try {
      let query = 'SELECT COUNT(*) as count FROM roles WHERE deleted_at IS NULL AND deleted = FALSE';
      const values = [];
      
      // Add filtering conditions
      if (filters.name) {
        query += ' AND name LIKE ?';
        values.push(`%${filters.name}%`);
      }
      
      const [rows] = await db.query(query, values);
      return rows[0].count;
    } catch (error) {
      throw error;
    }
  }

  // Get all roles
  static async findAll() {
    try {
      const query = 'SELECT * FROM roles WHERE deleted_at IS NULL AND deleted = FALSE ORDER BY name';
      const [rows] = await db.query(query);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Find role by ID
  static async findById(id) {
    try {
      const query = 'SELECT * FROM roles WHERE id = ? AND deleted_at IS NULL AND deleted = FALSE';
      const [rows] = await db.query(query, [id]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Role;
