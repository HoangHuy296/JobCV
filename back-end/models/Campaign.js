/**
 * Campaign.js
 * Model for recruitment campaigns
 */

const db = require('../config/db');

class Campaign {
  // Create a new campaign
  static async create(campaignData) {
    const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const data = {
      ...campaignData,
      created_at: timestamp,
      modified_at: timestamp,
      deleted: false
    };

    try {
      const [result] = await db.query('INSERT INTO campaigns SET ?', data);
      return { id: result.insertId, ...data };
    } catch (error) {
      throw error;
    }
  }

  // Get all campaigns for a company
  static async findByCompany(companyId) {
    try {
      const query = `
        SELECT c.*, 
               u.name as creator_name,
               COUNT(DISTINCT cj.job_id) as job_count
        FROM campaigns c
        LEFT JOIN users u ON c.created_by = u.id
        LEFT JOIN campaign_jobs cj ON c.id = cj.campaign_id
        WHERE c.company_id = ? AND c.deleted = FALSE
        GROUP BY c.id
        ORDER BY c.created_at DESC
      `;
      const [rows] = await db.query(query, [companyId]);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Get campaign by ID
  static async findById(id) {
    try {
      const query = `
        SELECT c.*, 
               u.name as creator_name,
               COUNT(DISTINCT cj.job_id) as job_count
        FROM campaigns c
        LEFT JOIN users u ON c.created_by = u.id
        LEFT JOIN campaign_jobs cj ON c.id = cj.campaign_id
        WHERE c.id = ? AND c.deleted = FALSE
        GROUP BY c.id
      `;
      const [rows] = await db.query(query, [id]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      throw error;
    }
  }

  // Update campaign
  static async update(id, campaignData) {
    const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const data = {
      ...campaignData,
      modified_at: timestamp
    };

    try {
      const [result] = await db.query(
        'UPDATE campaigns SET ? WHERE id = ? AND deleted = FALSE',
        [data, id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // Soft delete campaign
  static async delete(id) {
    const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');

    try {
      const [result] = await db.query(
        'UPDATE campaigns SET deleted_at = ?, deleted = TRUE WHERE id = ? AND deleted = FALSE',
        [timestamp, id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // Add job to campaign
  static async addJob(campaignId, jobId) {
    try {
      const [result] = await db.query(
        'INSERT IGNORE INTO campaign_jobs (campaign_id, job_id) VALUES (?, ?)',
        [campaignId, jobId]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // Remove job from campaign
  static async removeJob(campaignId, jobId) {
    try {
      const [result] = await db.query(
        'DELETE FROM campaign_jobs WHERE campaign_id = ? AND job_id = ?',
        [campaignId, jobId]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // Get all jobs in a campaign
  static async getJobs(campaignId) {
    try {
      const query = `
        SELECT j.*, 
               c.name as company_name,
               i.name as industry_name,
               jv.status as version_status,
               cj.added_at
        FROM campaign_jobs cj
        JOIN jobs j ON cj.job_id = j.id
        LEFT JOIN companies c ON j.company_id = c.id
        LEFT JOIN industries i ON j.industry_id = i.id
        LEFT JOIN job_versions jv ON j.current_version_id = jv.id
        WHERE cj.campaign_id = ? AND j.deleted = FALSE
        ORDER BY cj.added_at DESC
      `;
      const [rows] = await db.query(query, [campaignId]);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Get campaign statistics
  static async getStats(campaignId) {
    try {
      const query = `
        SELECT 
          COUNT(DISTINCT cj.job_id) as total_jobs,
          COUNT(DISTINCT CASE WHEN jv.status = 'approved' THEN cj.job_id END) as approved_jobs,
          COUNT(DISTINCT CASE WHEN jv.status = 'draft' THEN cj.job_id END) as draft_jobs,
          COUNT(DISTINCT CASE WHEN jv.status = 'pending_review' THEN cj.job_id END) as pending_jobs
        FROM campaign_jobs cj
        LEFT JOIN jobs j ON cj.job_id = j.id
        LEFT JOIN job_versions jv ON j.current_version_id = jv.id
        WHERE cj.campaign_id = ? AND j.deleted = FALSE
      `;
      const [rows] = await db.query(query, [campaignId]);
      return rows[0];
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Campaign;
