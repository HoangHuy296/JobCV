/**
 * JobVersion.js
 * Model for job versions
 */

const BaseModel = require('./BaseModel');
const db = require('../config/db');

class JobVersion extends BaseModel {
  constructor() {
    super('job_versions');
  }

  /**
   * Create a new job version
   */
  async create(versionData) {
    // Add timestamps
    const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const data = {
      job_id: versionData.job_id,
      version_number: versionData.version_number,
      title: versionData.title,
      brief_description: versionData.brief_description,
      requirement: versionData.requirement,
      benefits: versionData.benefits || '',
      salary: versionData.salary || '',
      date_end_register: versionData.date_end_register || null,
      years_experienced: versionData.years_experienced || 0,
      work_hours: versionData.work_hours || '',
      company_id: versionData.company_id,
      industry_id: versionData.industry_id,
      location: versionData.location || '',
      status: versionData.status || 'draft',
      is_live: versionData.is_live || false,
      created_by: versionData.created_by,
      created_at: timestamp,
      modified_at: timestamp
    };

    // Use direct db.query instead of BaseModel's create to avoid the 'deleted' field issue
    const [result] = await db.query(`INSERT INTO ${this.table} SET ?`, data);
    return { ...data, id: result.insertId };
  }

  /**
   * Find all versions of a job
   */
  async findByJobId(jobId) {
    // First, get the latest version for each version_number
    const versionsQuery = `
      SELECT jv.*, u.name as creator_name
      FROM job_versions jv
      LEFT JOIN users u ON jv.created_by = u.id
      WHERE jv.job_id = ? AND jv.id IN (
        SELECT MAX(id) 
        FROM job_versions 
        WHERE job_id = ? 
        GROUP BY version_number
      )
      ORDER BY jv.version_number DESC
    `;
    
    // Execute the first query to get all versions
    const [versions] = await db.query(versionsQuery, [jobId, jobId]);
    
    // If there are no versions, return empty array
    if (versions.length === 0) {
      return [];
    }
    
    // Get all version IDs
    const versionIds = versions.map(v => v.id);
    
    // Get the latest review for each version
    const reviewsQuery = `
      SELECT jr.job_version_id, jr.status, jr.feedback, jr.updated_at
      FROM job_reviews jr
      WHERE jr.job_version_id IN (${versionIds.join(',')})
    `;
    
    // Execute the second query to get reviews
    const [reviews] = await db.query(reviewsQuery, []);
    
    // Create a map of version ID to review
    const reviewMap = {};
    reviews.forEach(review => {
      reviewMap[review.job_version_id] = review;
    });
    
    // Merge the reviews into the versions
    versions.forEach(version => {
      const review = reviewMap[version.id];
      if (review) {
        version.review_status = review.status;
        version.feedback = review.feedback;
        version.review_date = review.updated_at;
      } else {
        version.review_status = null;
        version.feedback = null;
        version.review_date = null;
      }
    });
    
    return versions;
  }

  /**
   * Find a specific version by ID and job ID
   */
  async findByIdAndJobId(versionId, jobId) {
    const query = `
      SELECT jv.*,
             u.name as creator_name,
             jr.status as review_status,
             jr.feedback,
             jr.updated_at as review_date
      FROM job_versions jv
      LEFT JOIN users u ON jv.created_by = u.id
      LEFT JOIN job_reviews jr ON jv.id = jr.job_version_id
      WHERE jv.job_id = ? AND jv.id = ?
    `;

    const [rows] = await db.query(query, [jobId, versionId]);
    return rows[0] || null;
  }

  /**
   * Update a job version
   */
  async update(versionId, updateData) {
    const allowedFields = [
      'title', 'brief_description', 'requirement', 'benefits', 'salary',
      'date_end_register', 'years_experienced', 'work_hours', 'company_id',
      'industry_id', 'location', 'status', 'is_live'
    ];

    // Filter updateData to only include allowed fields
    const filteredData = {};
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        filteredData[field] = updateData[field];
      }
    }

    // Add modified_at timestamp
    const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
    filteredData.modified_at = timestamp;

    // Use direct db.query instead of BaseModel's update to avoid potential 'deleted' field issues
    const [result] = await db.query(`UPDATE ${this.table} SET ? WHERE id = ?`, [filteredData, versionId]);
    return result.affectedRows > 0;
  }

  /**
   * Set all versions of a job to not live
   */
  async setAllVersionsNotLive(jobId) {
    const query = 'UPDATE job_versions SET is_live = FALSE WHERE job_id = ?';
    const [result] = await db.query(query, [jobId]);
    return result;
  }

  /**
   * Set a specific version as live
   */
  async setAsLive(versionId) {
    const query = 'UPDATE job_versions SET is_live = TRUE WHERE id = ?';
    const [result] = await db.query(query, [versionId]);
    return result;
  }

  /**
   * Count live versions for a job
   */
  async countLiveVersions(jobId) {
    const query = 'SELECT COUNT(*) as count FROM job_versions WHERE job_id = ? AND is_live = TRUE';
    const [rows] = await db.query(query, [jobId]);
    return rows[0].count;
  }

  /**
   * Get the latest version of a job
   */
  async findLatestVersion(jobId) {
    const query = `
      SELECT jv.*,
             u.name as creator_name,
             jr.status as review_status,
             jr.feedback,
             jr.updated_at as review_date
      FROM job_versions jv
      LEFT JOIN users u ON jv.created_by = u.id
      LEFT JOIN job_reviews jr ON jv.id = jr.job_version_id
      WHERE jv.job_id = ?
      ORDER BY jv.version_number DESC
      LIMIT 1
    `;

    const [rows] = await db.query(query, [jobId]);
    return rows[0] || null;
  }

  /**
   * Get all approved versions of a job
   */
  async findApprovedVersions(jobId) {
    const query = `
      SELECT jv.*,
             u.name as creator_name,
             jr.status as review_status,
             jr.feedback,
             jr.updated_at as review_date
      FROM job_versions jv
      LEFT JOIN users u ON jv.created_by = u.id
      LEFT JOIN job_reviews jr ON jv.id = jr.job_version_id
      WHERE jv.job_id = ? AND jv.status = 'approved'
      ORDER BY jv.version_number DESC
    `;

    const [rows] = await db.query(query, [jobId]);
    return rows;
  }
}

module.exports = new JobVersion();
