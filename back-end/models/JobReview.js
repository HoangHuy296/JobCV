const db = require('../config/db');
const { getLocalTimestamp } = require('../utils/dateUtils');

class JobReview {
  constructor(id, job_id, job_version_id, reviewer_id, status, feedback, created_at, updated_at) {
    this.id = id;
    this.job_id = job_id;
    this.job_version_id = job_version_id;
    this.reviewer_id = reviewer_id;
    this.status = status;
    this.feedback = feedback;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }

  // Create a new job review
  static async create(reviewData) {
    try {
      const [result] = await db.query('INSERT INTO job_reviews SET ?', reviewData);
      return { id: result.insertId, ...reviewData };
    } catch (error) {
      throw error;
    }
  }

  // Get review history for a job
  static async findByJobId(jobId) {
    try {
      const query = `
        SELECT r.*, u.name as reviewer_name
        FROM job_reviews r
        JOIN users u ON r.reviewer_id = u.id
        WHERE r.job_id = ?
        ORDER BY r.created_at DESC
      `;
      const [rows] = await db.query(query, [jobId]);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Get review history for a job version
  static async findByJobVersionId(jobVersionId) {
    try {
      const query = `
        SELECT r.*, u.name as reviewer_name
        FROM job_reviews r
        JOIN users u ON r.reviewer_id = u.id
        WHERE r.job_version_id = ?
        ORDER BY r.created_at DESC
      `;
      const [rows] = await db.query(query, [jobVersionId]);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Process job review with transaction (legacy method for backward compatibility)
  static async processReview(jobId, reviewerId, status, feedback) {
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // Get the current job version ID
      const [jobRows] = await connection.query(
        'SELECT current_version_id FROM jobs WHERE id = ?',
        [jobId]
      );
      
      if (!jobRows || jobRows.length === 0) {
        throw new Error('Job not found');
      }
      
      const currentVersionId = jobRows[0].current_version_id;
      
      if (!currentVersionId) {
        throw new Error('Job does not have a current version');
      }

      // Update job status
      await connection.query(
        'UPDATE jobs SET status = ? WHERE id = ?',
        [status, jobId]
      );

      // Update job version status to match
      await connection.query(
        'UPDATE job_versions SET status = ? WHERE id = ?',
        [status, currentVersionId]
      );

      if (status === 'approved') {
        // Ensure only the approved version is live
        await connection.query(
          'UPDATE job_versions SET is_live = FALSE WHERE job_id = ?',
          [jobId]
        );
        await connection.query(
          'UPDATE job_versions SET is_live = TRUE WHERE id = ?',
          [currentVersionId]
        );

        // Ensure job points to the approved version
        await connection.query(
          'UPDATE jobs SET current_version_id = ? WHERE id = ?',
          [currentVersionId, jobId]
        );
      } else {
        // Make sure non-approved reviews do not leave the version live
        await connection.query(
          'UPDATE job_versions SET is_live = FALSE WHERE id = ?',
          [currentVersionId]
        );
      }

      // Create review record
      const reviewData = {
        job_id: jobId,
        job_version_id: currentVersionId,
        reviewer_id: reviewerId,
        status,
        feedback: feedback || null,
        created_at: getLocalTimestamp()
      };

      const [result] = await connection.query(
        'INSERT INTO job_reviews SET ?',
        reviewData
      );

      await connection.commit();
      return { id: result.insertId, ...reviewData };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Update review by version and reviewer
  static async updateByVersionAndReviewer(versionId, reviewerId, updateData) {
    try {
      const [result] = await db.query(
        `UPDATE job_reviews
         SET status = ?, feedback = ?, updated_at = CURRENT_TIMESTAMP
         WHERE job_version_id = ? AND reviewer_id = ?`,
        [updateData.status, updateData.feedback, versionId, reviewerId]
      );
      return result;
    } catch (error) {
      throw error;
    }
  }

  // Create review for a specific version
  static async createForVersion(reviewData) {
    try {
      const [result] = await db.query(
        'INSERT INTO job_reviews (job_id, job_version_id, reviewer_id, status, feedback) VALUES (?, ?, ?, ?, ?)',
        [reviewData.job_id, reviewData.job_version_id, reviewData.reviewer_id, reviewData.status, reviewData.feedback || null]
      );
      return { id: result.insertId, ...reviewData };
    } catch (error) {
      throw error;
    }
  }

  // Get all pending reviews with version information
  static async findPendingReviewsWithVersions(limit, offset) {
    try {
      const query = `
        SELECT
          jr.id as review_id,
          jr.job_id,
          jr.job_version_id,
          jr.status as review_status,
          jr.feedback,
          jr.created_at as review_created_at,
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
          jv.created_by,
          c.name as company_name,
          i.name as industry_name,
          u.name as creator_name
        FROM job_reviews jr
        JOIN job_versions jv ON jr.job_version_id = jv.id
        LEFT JOIN companies c ON jv.company_id = c.id
        LEFT JOIN industries i ON jv.industry_id = i.id
        LEFT JOIN users u ON jv.created_by = u.id
        WHERE jr.status = 'pending'
        ORDER BY jr.created_at ASC
        LIMIT ? OFFSET ?
      `;

      const [rows] = await db.query(query, [limit, offset]);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Count pending reviews
  static async countPendingReviews() {
    try {
      const [rows] = await db.query(
        'SELECT COUNT(*) as count FROM job_reviews WHERE status = "pending"'
      );
      return rows[0].count;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = JobReview;
