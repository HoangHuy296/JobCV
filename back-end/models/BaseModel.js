const db = require('../config/db');
const { getLocalTimestamp } = require('../utils/dateUtils');

class BaseModel {
  constructor(table) {
    this.table = table;
  }

  // Create a new record
  async create(data) {
    const timestamp = getLocalTimestamp();
    const dataWithTimestamps = {
      ...data,
      deleted: false, // Explicitly set deleted flag to FALSE by default
      created_at: timestamp,
      modified_at: timestamp
    };

    const columns = Object.keys(dataWithTimestamps);
    const values = Object.values(dataWithTimestamps);
    const placeholders = columns.map(() => '?').join(', ');
    
    const query = `INSERT INTO ${this.table} (${columns.join(', ')}) VALUES (${placeholders})`;
    
    const [result] = await db.query(query, values);
    return { id: result.insertId, ...dataWithTimestamps };
  }

  // Find all records (excluding deleted ones)
  async findAll() {
    const query = `SELECT * FROM ${this.table} WHERE deleted_at IS NULL AND deleted = FALSE`;
    const [results] = await db.query(query);
    return results;
  }

  // Find a record by ID (excluding deleted ones)
  async findById(id) {
    const query = `SELECT * FROM ${this.table} WHERE id = ? AND deleted_at IS NULL AND deleted = FALSE`;
    const [results] = await db.query(query, [id]);
    return results[0];
  }

  // Update a record by ID or conditions
  async update(conditions, data) {
    const timestamp = getLocalTimestamp();
    const dataWithTimestamp = {
      ...data,
      modified_at: timestamp
    };

    const columns = Object.keys(dataWithTimestamp);
    const values = Object.values(dataWithTimestamp);
    const setClause = columns.map(col => `${col} = ?`).join(', ');
    
    // Handle both single ID and composite key conditions
    let whereClause = '';
    let whereValues = [];
    
    if (typeof conditions === 'number' || typeof conditions === 'string') {
      // Single ID condition
      whereClause = 'id = ? AND deleted_at IS NULL AND deleted = FALSE';
      whereValues = [conditions];
    } else if (typeof conditions === 'object') {
      // Composite key conditions
      const conditionKeys = Object.keys(conditions);
      whereClause = conditionKeys.map(key => `${key} = ?`).join(' AND ') + ' AND deleted_at IS NULL AND deleted = FALSE';
      whereValues = Object.values(conditions);
    }
    
    const query = `UPDATE ${this.table} SET ${setClause} WHERE ${whereClause}`;
    
    const [result] = await db.query(query, [...values, ...whereValues]);
    return result.affectedRows > 0;
  }

  // Soft delete a record by ID or conditions
  async delete(conditions) {
    const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
    
    // Handle both single ID and composite key conditions
    let whereClause = '';
    let whereValues = [timestamp];
    
    if (typeof conditions === 'number' || typeof conditions === 'string') {
      // Single ID condition
      whereClause = 'id = ? AND deleted_at IS NULL AND deleted = FALSE';
      whereValues = [timestamp, conditions];
    } else if (typeof conditions === 'object') {
      // Composite key conditions
      const conditionKeys = Object.keys(conditions);
      whereClause = conditionKeys.map(key => `${key} = ?`).join(' AND ') + ' AND deleted_at IS NULL AND deleted = FALSE';
      whereValues = [timestamp, ...Object.values(conditions)];
    }
    
    const query = `UPDATE ${this.table} SET deleted_at = ?, deleted = TRUE WHERE ${whereClause}`;
    
    const [result] = await db.query(query, whereValues);
    return result.affectedRows > 0;
  }

  // Hard delete a record by ID
  async hardDelete(id) {
    const query = `DELETE FROM ${this.table} WHERE id = ?`;
    const [result] = await db.query(query, [id]);
    return result.affectedRows > 0;
  }

  // Find records with custom conditions
  async findWhere(conditions) {
    let query = `SELECT * FROM ${this.table} WHERE deleted_at IS NULL AND deleted = FALSE`;
    const values = [];
    
    if (Object.keys(conditions).length > 0) {
      const whereClause = Object.keys(conditions)
        .map(key => `${key} = ?`)
        .join(' AND ');
      query += ` AND ${whereClause}`;
      values.push(...Object.values(conditions));
    }
    
    const [results] = await db.query(query, values);
    return results;
  }

  // Find records with pagination and filtering
  async findWithPagination(filters = {}, limit = 10, offset = 0) {
    let query = `SELECT * FROM ${this.table} WHERE deleted_at IS NULL AND deleted = FALSE`;
    const values = [];
    
    // Add filtering conditions (generic implementation)
    // This should be overridden in child classes for specific filtering logic
    Object.keys(filters).forEach(key => {
      if (key !== 'search' && filters[key] !== undefined) {
        query += ` AND ${key} = ?`;
        values.push(filters[key]);
      }
    });
    
    // Add pagination
    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    values.push(limit, offset);
    
    const [results] = await db.query(query, values);
    return results;
  }

  // Count records with filtering
  async count(filters = {}) {
    let query = `SELECT COUNT(*) as count FROM ${this.table} WHERE deleted_at IS NULL AND deleted = FALSE`;
    const values = [];
    
    // Add filtering conditions (generic implementation)
    // This should be overridden in child classes for specific filtering logic
    Object.keys(filters).forEach(key => {
      if (key !== 'search' && filters[key] !== undefined) {
        query += ` AND ${key} = ?`;
        values.push(filters[key]);
      }
    });
    
    const [results] = await db.query(query, values);
    return results[0].count;
  }
}

module.exports = BaseModel;
