/**
 * Notification.js
 * Model for user notifications
 */

const db = require('../config/db');

class Notification {
  // Create a new notification
  static async create(notificationData) {
    const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const data = {
      user_id: notificationData.user_id,
      title: notificationData.title,
      message: notificationData.message,
      type: notificationData.type || 'info',
      link: notificationData.link || null,
      is_read: false,
      created_at: timestamp
    };

    try {
      const [result] = await db.query('INSERT INTO notifications SET ?', data);
      return { id: result.insertId, ...data };
    } catch (error) {
      throw error;
    }
  }

  // Get all notifications for a user
  static async findByUser(userId, limit = 50, offset = 0) {
    try {
      const query = `
        SELECT * FROM notifications
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `;
      const [rows] = await db.query(query, [userId, limit, offset]);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Get unread notifications for a user
  static async findUnreadByUser(userId) {
    try {
      const query = `
        SELECT * FROM notifications
        WHERE user_id = ? AND is_read = FALSE
        ORDER BY created_at DESC
      `;
      const [rows] = await db.query(query, [userId]);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Count unread notifications
  static async countUnread(userId) {
    try {
      const query = 'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE';
      const [rows] = await db.query(query, [userId]);
      return rows[0].count;
    } catch (error) {
      throw error;
    }
  }

  // Get read notifications for a user
  static async findReadByUser(userId, limit = 50, offset = 0) {
    try {
      const query = `
        SELECT * FROM notifications
        WHERE user_id = ? AND is_read = TRUE
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `;
      const [rows] = await db.query(query, [userId, limit, offset]);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Count read notifications
  static async countRead(userId) {
    try {
      const query = 'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = TRUE';
      const [rows] = await db.query(query, [userId]);
      return rows[0].count;
    } catch (error) {
      throw error;
    }
  }

  // Count all notifications for a user
  static async countByUser(userId) {
    try {
      const query = 'SELECT COUNT(*) as count FROM notifications WHERE user_id = ?';
      const [rows] = await db.query(query, [userId]);
      return rows[0].count;
    } catch (error) {
      throw error;
    }
  }

  // Mark notification as read
  static async markAsRead(id, userId) {
    const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
    
    try {
      const [result] = await db.query(
        'UPDATE notifications SET is_read = TRUE, read_at = ? WHERE id = ? AND user_id = ?',
        [timestamp, id, userId]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // Mark all notifications as read for a user
  static async markAllAsRead(userId) {
    const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
    
    try {
      const [result] = await db.query(
        'UPDATE notifications SET is_read = TRUE, read_at = ? WHERE user_id = ? AND is_read = FALSE',
        [timestamp, userId]
      );
      return result.affectedRows;
    } catch (error) {
      throw error;
    }
  }

  // Delete notification
  static async delete(id, userId) {
    try {
      const [result] = await db.query(
        'DELETE FROM notifications WHERE id = ? AND user_id = ?',
        [id, userId]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // Delete all read notifications for a user
  static async deleteAllRead(userId) {
    try {
      const [result] = await db.query(
        'DELETE FROM notifications WHERE user_id = ? AND is_read = TRUE',
        [userId]
      );
      return result.affectedRows;
    } catch (error) {
      throw error;
    }
  }

  // Create notification for multiple users
  static async createForUsers(userIds, notificationData) {
    const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const values = userIds.map(userId => [
      userId,
      notificationData.title,
      notificationData.message,
      notificationData.type || 'info',
      notificationData.link || null,
      false,
      timestamp
    ]);

    try {
      const query = `
        INSERT INTO notifications (user_id, title, message, type, link, is_read, created_at)
        VALUES ?
      `;
      const [result] = await db.query(query, [values]);
      return result.affectedRows;
    } catch (error) {
      throw error;
    }
  }

  // Create notification for all admins
  static async createForAdmins(notificationData) {
    try {
      // Get all admin users
      const [admins] = await db.query('SELECT id FROM users WHERE role_id = 1 AND is_active = TRUE');
      const adminIds = admins.map(admin => admin.id);
      
      if (adminIds.length > 0) {
        return await this.createForUsers(adminIds, notificationData);
      }
      return 0;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Notification;
