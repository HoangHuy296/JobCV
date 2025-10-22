const db = require('../config/db');

class JobReport {
  constructor(id, job_id, user_id, name, email, phone, report_type, description, status, admin_notes, created_at, updated_at) {
    this.id = id;
    this.job_id = job_id;
    this.user_id = user_id;
    this.name = name;
    this.email = email;
    this.phone = phone;
    this.report_type = report_type;
    this.description = description;
    this.status = status;
    this.admin_notes = admin_notes;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }

  // Create a new job report
  static async create(reportData) {
    try {
      const [result] = await db.query('INSERT INTO job_reports SET ?', reportData);
      return { id: result.insertId, ...reportData };
    } catch (error) {
      throw error;
    }
  }

  // Get a job report by ID
  static async findById(id) {
    try {
      const query = `
        SELECT r.*, j.title as job_title, u.name as reporter_name
        FROM job_reports r
        LEFT JOIN jobs j ON r.job_id = j.id
        LEFT JOIN users u ON r.user_id = u.id
        WHERE r.id = ?
      `;
      const [rows] = await db.query(query, [id]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      throw error;
    }
  }

  // Update a job report by ID
  static async update(id, reportData) {
    try {
      const [result] = await db.query('UPDATE job_reports SET ? WHERE id = ?', [reportData, id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // Find reports with pagination and filtering
  static async findWithPagination(filters = {}, limit = 10, offset = 0) {
    let query = `
      SELECT r.*, j.title as job_title, 
             IFNULL(u.name, r.name) as reporter_name
      FROM job_reports r
      LEFT JOIN jobs j ON r.job_id = j.id
      LEFT JOIN users u ON r.user_id = u.id
      WHERE 1=1
    `;
    const values = [];
    
    // Add filtering conditions
    if (filters.status) {
      query += ` AND r.status = ?`;
      values.push(filters.status);
    }
    
    if (filters.report_type) {
      query += ` AND r.report_type = ?`;
      values.push(filters.report_type);
    }
    
    if (filters.job_id) {
      query += ` AND r.job_id = ?`;
      values.push(filters.job_id);
    }
    
    if (filters.email) {
      query += ` AND r.email LIKE ?`;
      values.push(`%${filters.email}%`);
    }
    
    // Add pagination
    query += ` ORDER BY r.created_at DESC LIMIT ? OFFSET ?`;
    values.push(limit, offset);
    
    try {
      const [rows] = await db.query(query, values);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Count reports with filtering
  static async count(filters = {}) {
    let query = 'SELECT COUNT(*) as count FROM job_reports r WHERE 1=1';
    const values = [];
    
    // Add filtering conditions
    if (filters.status) {
      query += ` AND r.status = ?`;
      values.push(filters.status);
    }
    
    if (filters.report_type) {
      query += ` AND r.report_type = ?`;
      values.push(filters.report_type);
    }
    
    if (filters.job_id) {
      query += ` AND r.job_id = ?`;
      values.push(filters.job_id);
    }
    
    if (filters.email) {
      query += ` AND r.email LIKE ?`;
      values.push(`%${filters.email}%`);
    }
    
    try {
      const [rows] = await db.query(query, values);
      return rows[0].count;
    } catch (error) {
      throw error;
    }
  }

  // Check if a user has already reported a job
  static async findByUserAndJob(userId, jobId) {
    try {
      const [rows] = await db.query(
        'SELECT * FROM job_reports WHERE job_id = ? AND user_id = ?',
        [jobId, userId]
      );
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      throw error;
    }
  }
  
  // Count the number of reports by a user for a specific job
  static async countByUserAndJob(userId, jobId) {
    try {
      const [rows] = await db.query(
        'SELECT COUNT(*) as count FROM job_reports WHERE job_id = ? AND user_id = ?',
        [jobId, userId]
      );
      return rows[0].count;
    } catch (error) {
      throw error;
    }
  }
  
  // Count the number of reports by a user for a specific job within the current day
  static async countByUserAndJobToday(userId, jobId) {
    try {
      const [rows] = await db.query(
        'SELECT COUNT(*) as count FROM job_reports WHERE job_id = ? AND user_id = ? AND DATE(created_at) = CURDATE()',
        [jobId, userId]
      );
      return rows[0].count;
    } catch (error) {
      throw error;
    }
  }

  // Check if an email has already reported a job
  static async findByEmailAndJob(email, jobId) {
    try {
      const [rows] = await db.query(
        'SELECT * FROM job_reports WHERE job_id = ? AND email = ?',
        [jobId, email]
      );
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      throw error;
    }
  }
  
  // Count the number of reports by an email for a specific job
  static async countByEmailAndJob(email, jobId) {
    try {
      const [rows] = await db.query(
        'SELECT COUNT(*) as count FROM job_reports WHERE job_id = ? AND email = ?',
        [jobId, email]
      );
      return rows[0].count;
    } catch (error) {
      throw error;
    }
  }
  
  // Count the number of reports by an email for a specific job within the current day
  static async countByEmailAndJobToday(email, jobId) {
    try {
      const [rows] = await db.query(
        'SELECT COUNT(*) as count FROM job_reports WHERE job_id = ? AND email = ? AND DATE(created_at) = CURDATE()',
        [jobId, email]
      );
      return rows[0].count;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = JobReport;
