const db = require('../config/db');

class JobLike {
  constructor(id, user_id, job_id, created_at) {
    this.id = id;
    this.user_id = user_id;
    this.job_id = job_id;
    this.created_at = created_at;
  }

  // Like a job
  static async likeJob(userId, jobId) {
    try {
      // Check if already liked
      const checkQuery = 'SELECT id FROM job_likes WHERE user_id = ? AND job_id = ?';
      const [existingLike] = await db.query(checkQuery, [userId, jobId]);
      
      if (existingLike.length > 0) {
        throw new Error('Bạn đã thích công việc này rồi');
      }
      
      // Create like
      const insertQuery = 'INSERT INTO job_likes (user_id, job_id) VALUES (?, ?)';
      await db.query(insertQuery, [userId, jobId]);
      
      return true;
    } catch (error) {
      throw error;
    }
  }

  // Unlike a job
  static async unlikeJob(userId, jobId) {
    try {
      // Check if like exists
      const checkQuery = 'SELECT id FROM job_likes WHERE user_id = ? AND job_id = ?';
      const [existingLike] = await db.query(checkQuery, [userId, jobId]);
      
      if (existingLike.length === 0) {
        throw new Error('Bạn chưa thích công việc này');
      }
      
      // Delete like
      const deleteQuery = 'DELETE FROM job_likes WHERE user_id = ? AND job_id = ?';
      await db.query(deleteQuery, [userId, jobId]);
      
      return true;
    } catch (error) {
      throw error;
    }
  }

  // Check like status
  static async checkLikeStatus(userId, jobId) {
    try {
      const checkQuery = 'SELECT id FROM job_likes WHERE user_id = ? AND job_id = ?';
      const [like] = await db.query(checkQuery, [userId, jobId]);
      
      return like.length > 0;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = JobLike;
