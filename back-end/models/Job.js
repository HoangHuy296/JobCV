const db = require('../config/db');
const { getLocalTimestamp } = require('../utils/dateUtils');

class Job {
  constructor(id, title, brief_description, requirement, benefits, salary, date_end_register, years_experienced, work_hours, company_id, industry_id, location, created_by, created_at, modified_at, deleted_at, deleted, current_version_id, version_count) {
    this.id = id;
    this.title = title;
    this.brief_description = brief_description;
    this.requirement = requirement;
    this.benefits = benefits;
    this.salary = salary;
    this.date_end_register = date_end_register;
    this.years_experienced = years_experienced;
    this.work_hours = work_hours;
    this.company_id = company_id;
    this.industry_id = industry_id;
    this.location = location;
    this.created_by = created_by;
    this.created_at = created_at;
    this.modified_at = modified_at;
    this.deleted_at = deleted_at;
    this.deleted = deleted;
    this.current_version_id = current_version_id;
    this.version_count = version_count;
  }

  // Create a new job
  static async create(jobData) {
    const timestamp = getLocalTimestamp();
    const dataWithTimestamps = {
      ...jobData,
      created_at: timestamp,
      modified_at: timestamp
    };

    try {
      const [result] = await db.query('INSERT INTO jobs SET ?', dataWithTimestamps);
      return { id: result.insertId, ...dataWithTimestamps };
    } catch (error) {
      throw error;
    }
  }

  // Get all jobs (excluding deleted ones) with related data
  static async findAll() {
    try {
      const query = `
        SELECT j.*, c.name as company_name, i.name as industry_name
        FROM jobs j
        LEFT JOIN companies c ON j.company_id = c.id
        LEFT JOIN industries i ON j.industry_id = i.id
        WHERE j.deleted_at IS NULL AND j.deleted = FALSE
        ORDER BY j.created_at DESC
      `;
      const [rows] = await db.query(query);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Get a job by ID (excluding deleted ones) with related data
  static async findById(id) {
    try {
      const query = `
        SELECT j.*, i.name as industry_name
        FROM jobs j
        LEFT JOIN industries i ON j.industry_id = i.id
        WHERE j.id = ? AND j.deleted_at IS NULL AND j.deleted = FALSE
      `;
      const [rows] = await db.query(query, [id]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      throw error;
    }
  }

  // Update a job by ID
  static async update(id, jobData) {
    const timestamp = getLocalTimestamp();
    const dataWithTimestamp = {
      ...jobData,
      modified_at: timestamp
    };

    try {
      const [result] = await db.query('UPDATE jobs SET ? WHERE id = ? AND deleted_at IS NULL AND deleted = FALSE', [dataWithTimestamp, id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // Soft delete a job by ID
  static async delete(id) {
    const timestamp = getLocalTimestamp();

    try {
      const [result] = await db.query('UPDATE jobs SET deleted_at = ?, deleted = TRUE WHERE id = ? AND deleted_at IS NULL AND deleted = FALSE', [timestamp, id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // Get jobs by user
  static async findByUser(userId) {
    try {
      const query = `
        SELECT j.*, c.name as company_name, i.name as industry_name
        FROM jobs j
        LEFT JOIN companies c ON j.company_id = c.id
        LEFT JOIN industries i ON j.industry_id = i.id
        WHERE j.created_by = ? AND j.deleted_at IS NULL AND j.deleted = FALSE
        ORDER BY j.created_at DESC
      `;
      const [rows] = await db.query(query, [userId]);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Find jobs with pagination and filtering
  static async findWithPagination(filters = {}, limit = 10, offset = 0) {
    let query = `
      SELECT j.*,
             c.name as company_name,
             m.url as company_logo,
             i.name as industry_name,
             jv.version_number,
             jv.status as version_status,
             u.name as creator_name
      FROM jobs j
      LEFT JOIN companies c ON j.company_id = c.id
      LEFT JOIN media m ON c.logo_id = m.id
      LEFT JOIN industries i ON j.industry_id = i.id
      LEFT JOIN job_versions jv ON j.current_version_id = jv.id
      LEFT JOIN users u ON j.created_by = u.id
      WHERE j.deleted_at IS NULL AND j.deleted = FALSE
    `;
    const values = [];

    // Add filtering conditions
    if (filters.search) {
      query += ` AND (j.title LIKE ? OR j.brief_description LIKE ? OR j.requirement LIKE ? OR jv.title LIKE ? OR jv.brief_description LIKE ? OR jv.requirement LIKE ?)`;
      values.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
    }

    if (filters.company) {
      query += ` AND j.company_id = ?`;
      values.push(filters.company);
    }

    if (filters.industry) {
      query += ` AND j.industry_id = ?`;
      values.push(filters.industry);
    }

    if (filters.location) {
      query += ` AND (j.location LIKE ? OR jv.location LIKE ?)`;
      values.push(`%${filters.location}%`, `%${filters.location}%`);
    }

    if (filters.user_id) {
      query += ` AND j.created_by = ?`;
      values.push(filters.user_id);
    }

    if (filters.status) {
      if (filters.status === 'approved') {
        // Show only jobs with approved current version
        query += ` AND jv.status = 'approved' AND jv.is_live = TRUE`;
      } else {
        // For other statuses, check job status
        query += ` AND j.status = ?`;
        values.push(filters.status);
      }
    }
    // No else block needed - the controller already handles the default filtering

    // Add pagination
    query += ` ORDER BY j.created_at DESC LIMIT ? OFFSET ?`;
    values.push(limit, offset);

    try {
      const [rows] = await db.query(query, values);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Count jobs with filtering
  static async count(filters = {}) {
    // Start with a base query that includes potential joins
    let query = 'SELECT COUNT(*) as count FROM jobs j';
    const values = [];
    
    // Add necessary joins based on filters
    let needsJobVersionJoin = false;
    
    // Check if we need to join job_versions table
    // We need the join if we're searching in version fields, checking location in versions,
    // or if we're filtering by status (especially 'approved')
    if (filters.search || 
        (filters.location && filters.location.trim() !== '') || 
        filters.status === 'approved') {
      needsJobVersionJoin = true;
    }
    
    // Add the join if needed
    if (needsJobVersionJoin) {
      query += ' LEFT JOIN job_versions jv ON j.current_version_id = jv.id';
    }
    
    // Now add the WHERE clause
    query += ' WHERE j.deleted_at IS NULL AND j.deleted = FALSE';

    // Add filtering conditions
    if (filters.search) {
      query += ' AND (j.title LIKE ? OR j.brief_description LIKE ? OR j.requirement LIKE ? OR jv.title LIKE ? OR jv.brief_description LIKE ? OR jv.requirement LIKE ?)';
      values.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
    }

    if (filters.company) {
      query += ' AND j.company_id = ?';
      values.push(filters.company);
    }

    if (filters.industry) {
      query += ' AND j.industry_id = ?';
      values.push(filters.industry);
    }

    if (filters.location) {
      if (needsJobVersionJoin) {
        query += ' AND (j.location LIKE ? OR jv.location LIKE ?)';
        values.push(`%${filters.location}%`, `%${filters.location}%`);
      } else {
        query += ' AND j.location LIKE ?';
        values.push(`%${filters.location}%`);
      }
    }

    if (filters.user_id) {
      query += ' AND j.created_by = ?';
      values.push(filters.user_id);
    }

    if (filters.status) {
      if (filters.status === 'approved') {
        query += ' AND jv.status = "approved" AND jv.is_live = TRUE';
      } else {
        query += ' AND j.status = ?';
        values.push(filters.status);
      }
    }
    // No else block needed - the controller already handles the default filtering

    try {
      const [rows] = await db.query(query, values);
      return rows[0].count;
    } catch (error) {
      throw error;
    }
  }

  // Get all industries
  static async getAllIndustries() {
    try {
      const query = 'SELECT * FROM industries WHERE deleted_at IS NULL AND deleted = FALSE ORDER BY name';
      const [rows] = await db.query(query);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Get jobs pending review with pagination (legacy method for backward compatibility)
  static async findPendingReviews(limit = 10, offset = 0) {
    try {
      // Get jobs pending review with company and industry information
      const query = `
        SELECT j.*, c.name as company_name, i.name as industry_name, u.name as recruiter_name
        FROM jobs j
        LEFT JOIN companies c ON j.company_id = c.id
        LEFT JOIN industries i ON j.industry_id = i.id
        LEFT JOIN users u ON j.created_by = u.id
        WHERE j.status = 'pending_review' AND j.deleted = 0
        ORDER BY j.created_at DESC
        LIMIT ? OFFSET ?
      `;

      const [jobs] = await db.query(query, [limit, offset]);

      // Get total count for pagination
      const countQuery = "SELECT COUNT(*) as total FROM jobs WHERE status = 'pending_review' AND deleted = 0";
      const [countResult] = await db.query(countQuery);

      return {
        jobs,
        total: countResult[0].total
      };
    } catch (error) {
      throw error;
    }
  }

  // Get jobs pending review with version information
  static async findPendingReviewsWithVersions(limit = 10, offset = 0) {
    try {
      const query = `
        SELECT
          j.id,
          j.created_by,
          j.created_at,
          jv.id as version_id,
          jv.version_number,
          jv.title,
          jv.brief_description,
          jv.requirement,
          jv.benefits,
          jv.salary,
          jv.date_end_register,
          jv.years_experienced,
          jv.work_hours,
          jv.location,
          jv.company_id,
          jv.industry_id,
          jv.status as version_status,
          jv.created_at as version_created_at,
          c.name as company_name,
          i.name as industry_name,
          u.name as creator_name
        FROM jobs j
        JOIN job_versions jv ON j.current_version_id = jv.id
        LEFT JOIN companies c ON jv.company_id = c.id
        LEFT JOIN industries i ON jv.industry_id = i.id
        LEFT JOIN users u ON j.created_by = u.id
        WHERE jv.status = 'pending_review' AND j.deleted = 0
        ORDER BY jv.created_at DESC
        LIMIT ? OFFSET ?
      `;

      const connection = await db.getConnection();
      try {
        const [jobs] = await connection.query(query, [limit, offset]);

        // Get total count for pagination
        const countQuery = `
          SELECT COUNT(*) as total FROM jobs j
          JOIN job_versions jv ON j.current_version_id = jv.id
          WHERE jv.status = 'pending_review' AND j.deleted = 0
        `;
        const [countResult] = await connection.query(countQuery);

        return {
          jobs,
          total: countResult[0].total
        };
      } finally {
        connection.release();
      }
    } catch (error) {
      throw error;
    }
  }

  // Update job version count
  static async updateVersionCount(jobId, versionCount) {
    try {
      const [result] = await db.query(
        'UPDATE jobs SET version_count = ? WHERE id = ? AND deleted = 0',
        [versionCount, jobId]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Job;
