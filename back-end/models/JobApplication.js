const db = require('../config/db');

class JobApplication {
  // Create a new job application
  static async create(applicationData) {
    const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const dataWithTimestamps = {
      ...applicationData,
      applied_at: timestamp,
      created_at: timestamp,
      modified_at: timestamp
    };

    try {
      const [result] = await db.query('INSERT INTO job_applications SET ?', dataWithTimestamps);
      return { id: result.insertId, ...dataWithTimestamps };
    } catch (error) {
      throw error;
    }
  }

  // Check if user has already applied for a job
  static async hasApplied(jobId, userId) {
    try {
      const [results] = await db.query(
        'SELECT id FROM job_applications WHERE job_id = ? AND user_id = ?',
        [jobId, userId]
      );
      return results.length > 0;
    } catch (error) {
      throw error;
    }
  }

  // Get application by ID
  static async findById(id) {
    try {
      const [results] = await db.query(
        `SELECT 
          ja.*,
          u.name as user_name,
          u.email as user_email,
          j.title as job_title,
          c.name as company_name,
          cv.title as cv_title
        FROM job_applications ja
        LEFT JOIN users u ON ja.user_id = u.id
        LEFT JOIN jobs j ON ja.job_id = j.id
        LEFT JOIN companies c ON j.company_id = c.id
        LEFT JOIN cvs cv ON ja.cv_id = cv.id
        WHERE ja.id = ?`,
        [id]
      );
      return results[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Get all applications for a job
  static async findByJobId(jobId, page = 1, limit = 20, status = null) {
    try {
      const offset = (page - 1) * limit;
      let query = `
        SELECT 
          ja.*,
          u.name as user_name,
          u.email as user_email,
          u.image as user_image,
          cv.title as cv_title,
          cv.file_path as cv_file_path
        FROM job_applications ja
        LEFT JOIN users u ON ja.user_id = u.id
        LEFT JOIN cvs cv ON ja.cv_id = cv.id
        WHERE ja.job_id = ?
      `;
      const params = [jobId];

      if (status) {
        query += ' AND ja.status = ?';
        params.push(status);
      }

      query += ' ORDER BY ja.applied_at DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const [results] = await db.query(query, params);

      // Get total count
      let countQuery = 'SELECT COUNT(*) as total FROM job_applications WHERE job_id = ?';
      const countParams = [jobId];
      if (status) {
        countQuery += ' AND status = ?';
        countParams.push(status);
      }
      const [countResult] = await db.query(countQuery, countParams);

      return {
        applications: results,
        total: countResult[0].total,
        page,
        limit,
        totalPages: Math.ceil(countResult[0].total / limit)
      };
    } catch (error) {
      throw error;
    }
  }

  // Get all applications by a user
  static async findByUserId(userId, page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;
      const [results] = await db.query(
        `SELECT 
          ja.*,
          j.title as job_title,
          j.salary as job_salary,
          j.location as job_location,
          j.date_end_register,
          c.name as company_name,
          c.logo_id as company_logo_id,
          cv.title as cv_title
        FROM job_applications ja
        LEFT JOIN jobs j ON ja.job_id = j.id
        LEFT JOIN companies c ON j.company_id = c.id
        LEFT JOIN cvs cv ON ja.cv_id = cv.id
        WHERE ja.user_id = ?
        ORDER BY ja.applied_at DESC
        LIMIT ? OFFSET ?`,
        [userId, limit, offset]
      );

      // Get total count
      const [countResult] = await db.query(
        'SELECT COUNT(*) as total FROM job_applications WHERE user_id = ?',
        [userId]
      );

      return {
        applications: results,
        total: countResult[0].total,
        page,
        limit,
        totalPages: Math.ceil(countResult[0].total / limit)
      };
    } catch (error) {
      throw error;
    }
  }

  // Update application status
  static async updateStatus(id, status, reviewedBy = null, notes = null) {
    try {
      const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
      const updateData = {
        status,
        modified_at: timestamp
      };

      if (reviewedBy) {
        updateData.reviewed_by = reviewedBy;
        updateData.reviewed_at = timestamp;
      }

      if (notes) {
        updateData.notes = notes;
      }

      await db.query('UPDATE job_applications SET ? WHERE id = ?', [updateData, id]);
      return this.findById(id);
    } catch (error) {
      throw error;
    }
  }

  // Update CV for application
  static async updateCV(id, cvId) {
    try {
      const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
      await db.query(
        'UPDATE job_applications SET cv_id = ?, modified_at = ? WHERE id = ?',
        [cvId, timestamp, id]
      );
      return this.findById(id);
    } catch (error) {
      throw error;
    }
  }

  // Delete application
  static async delete(id) {
    try {
      await db.query('DELETE FROM job_applications WHERE id = ?', [id]);
      return true;
    } catch (error) {
      throw error;
    }
  }

  // Get application statistics for a job
  static async getJobStats(jobId) {
    try {
      const [results] = await db.query(
        `SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN status = 'reviewing' THEN 1 ELSE 0 END) as reviewing,
          SUM(CASE WHEN status = 'shortlisted' THEN 1 ELSE 0 END) as shortlisted,
          SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
          SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as accepted
        FROM job_applications
        WHERE job_id = ?`,
        [jobId]
      );
      return results[0];
    } catch (error) {
      throw error;
    }
  }
}

module.exports = JobApplication;
