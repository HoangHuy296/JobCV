const db = require('../config/db');
const bcrypt = require('bcrypt');

class User {
  constructor(id, name, email, password, role_id, is_active, image, created_at, modified_at, deleted_at, role = null) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.password = password;
    this.role_id = role_id;
    this.is_active = is_active;
    this.image = image; // This is now a full image object, not just an ID
    this.created_at = created_at;
    this.modified_at = modified_at;
    this.deleted_at = deleted_at;
    this.role = role; // Add role object
  }

  // Custom method to find user by email
  static async findByEmail(email) {
    try {
      const query = 'SELECT * FROM users WHERE email = ? AND deleted_at IS NULL AND deleted = FALSE';
      const [rows] = await db.query(query, [email]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      throw error;
    }
  }

  // Get user with role information
  static async getUserWithRole(userId) {
    try {
      const query = `
        SELECT u.*, r.name as role_name,
               m.id as image_id, m.filename as image_filename, m.original_name as image_original_name,
               m.mime_type as image_mime_type, m.size as image_size,
               m.path as image_path, m.url as image_url
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id AND r.deleted_at IS NULL AND r.deleted = FALSE
        LEFT JOIN media m ON u.image_id = m.id
        WHERE u.id = ? AND u.deleted_at IS NULL AND u.deleted = FALSE
      `;
      
      const [rows] = await db.query(query, [userId]);
      
      if (rows.length > 0) {
        const userData = rows[0];
        
        // Create the image object if image data exists
        const imageObject = userData.image_id ? {
          id: userData.image_id,
          filename: userData.image_filename,
          original_name: userData.image_original_name,
          mime_type: userData.image_mime_type,
          size: userData.image_size,
          path: userData.image_path,
          url: userData.image_url
        } : null;

        // Add the image object to the user data
        userData.image = imageObject;
        
        // Add role information
        if (userData.role_id) {
          userData.role = {
            id: userData.role_id,
            name: userData.role_name,
          };
        }
        
        // Create and return a User instance
        const user = new User(
          userData.id,
          userData.name,
          userData.email,
          userData.password,
          userData.role_id,
          userData.is_active,
          userData.image,
          userData.created_at,
          userData.modified_at,
          userData.deleted_at,
          userData.role
        );
        
        return user;
      }
      return null;
    } catch (error) {
      throw error;
    }
  }

  // Assign a role to a user
  static async assignRole(userId, roleId) {
    try {
      const query = 'UPDATE users SET role_id = ? WHERE id = ? AND deleted_at IS NULL AND deleted = FALSE';
      const [result] = await db.query(query, [roleId, userId]);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // Set user active status
  static async setActiveStatus(userId, isActive) {
    try {
      const query = 'UPDATE users SET is_active = ? WHERE id = ? AND deleted_at IS NULL AND deleted = FALSE';
      const [result] = await db.query(query, [isActive, userId]);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // Check if user is active
  static async isActive(userId) {
    try {
      const query = 'SELECT is_active FROM users WHERE id = ? AND deleted_at IS NULL AND deleted = FALSE';
      const [rows] = await db.query(query, [userId]);
      return rows[0] ? rows[0].is_active : false;
    } catch (error) {
      throw error;
    }
  }

  // Find user by ID with image data as object
  static async findById(id) {
    try {
      const query = `
        SELECT u.*, r.name as role_name, r.description as role_description,
               m.id as image_id, m.filename as image_filename, m.original_name as image_original_name,
               m.mime_type as image_mime_type, m.size as image_size,
               m.path as image_path, m.url as image_url
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id AND r.deleted_at IS NULL AND r.deleted = FALSE
        LEFT JOIN media m ON u.image_id = m.id
        WHERE u.id = ? AND u.deleted_at IS NULL AND u.deleted = FALSE
      `;
      
      const [rows] = await db.query(query, [id]);
      
      if (rows.length > 0) {
        const userData = rows[0];
        
        // Create the image object if image data exists
        const imageObject = userData.image_id ? {
          id: userData.image_id,
          filename: userData.image_filename,
          original_name: userData.image_original_name,
          mime_type: userData.image_mime_type,
          size: userData.image_size,
          path: userData.image_path,
          url: userData.image_url
        } : null;

        // Add the image object to the user data
        userData.image = imageObject;
        
        // Create and return a User instance
        const user = new User(
          userData.id,
          userData.name,
          userData.email,
          userData.password,
          userData.role_id,
          userData.is_active,
          userData.image,
          userData.created_at,
          userData.modified_at,
          userData.deleted_at,
          userData.role // Pass the role object
        );
        
        return user;
      }
      return null;
    } catch (error) {
      throw error;
    }
  }

  // Hash password before saving
  static async hashPassword(password) {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  }

  // Verify password
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // Create password reset token
  static async createPasswordResetToken(userId, token, expiresAt) {
    try {
      const query = 'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)';
      const [result] = await db.query(query, [userId, token, expiresAt]);
      return result.insertId;
    } catch (error) {
      throw error;
    }
  }

  // Find valid password reset token
  static async findValidPasswordResetToken(token) {
    try {
      const query = `
        SELECT prt.*, u.email, u.name
        FROM password_reset_tokens prt
        JOIN users u ON prt.user_id = u.id
        WHERE prt.token = ? AND prt.expires_at > NOW() AND prt.used = FALSE AND u.deleted_at IS NULL AND u.deleted = FALSE
      `;
      
      const [rows] = await db.query(query, [token]);
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Mark password reset token as used
  static async markPasswordResetTokenAsUsed(tokenId) {
    try {
      const query = 'UPDATE password_reset_tokens SET used = TRUE WHERE id = ?';
      const [result] = await db.query(query, [tokenId]);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // Delete expired password reset tokens
  static async deleteExpiredPasswordResetTokens() {
    try {
      const query = 'DELETE FROM password_reset_tokens WHERE expires_at < NOW()';
      const [result] = await db.query(query);
      return result.affectedRows;
    } catch (error) {
      throw error;
    }
  }

  // Find users with pagination and filtering
  static async findWithPagination(filters = {}, limit = 10, offset = 0) {
    try {
      let query = `
        SELECT u.*, r.name as role_name,
               m.id as image_id, m.filename as image_filename, m.original_name as image_original_name,
               m.mime_type as image_mime_type, m.size as image_size,
               m.path as image_path, m.url as image_url
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id AND r.deleted_at IS NULL AND r.deleted = FALSE
        LEFT JOIN media m ON u.image_id = m.id
        WHERE u.deleted_at IS NULL AND u.deleted = FALSE
      `;
      const values = [];
      
      // Add filtering conditions
      if (filters.search) {
        query += ` AND (u.name LIKE ? OR u.email LIKE ?)`;
        values.push(`%${filters.search}%`, `%${filters.search}%`);
      }
      
      if (filters.is_active !== undefined) {
        query += ` AND u.is_active = ?`;
        values.push(filters.is_active);
      }
      
      if (filters.role_id !== undefined) {
        query += ` AND u.role_id = ?`;
        values.push(filters.role_id);
      }
      
      // Add pagination
      query += ` ORDER BY u.created_at DESC LIMIT ? OFFSET ?`;
      values.push(limit, offset);
      
      const [rows] = await db.query(query, values);
      
      // Transform results to format image data as an object
      return rows.map(userData => {
        // Create the image object if image data exists
        const imageObject = userData.image_id ? {
          id: userData.image_id,
          filename: userData.image_filename,
          original_name: userData.image_original_name,
          mime_type: userData.image_mime_type,
          size: userData.image_size,
          path: userData.image_path,
          url: userData.image_url
        } : null;
        
        // Add the image object to the user data
        userData.image = imageObject;
        
        // Add role information
        if (userData.role_id) {
          userData.role = {
            id: userData.role_id,
            name: userData.role_name,
            description: userData.role_description
          };
        }
        
        return userData;
      });
    } catch (error) {
      throw error;
    }
  }

  // Count users with filtering
  static async count(filters = {}) {
    try {
      let query = `SELECT COUNT(*) as count FROM users WHERE deleted_at IS NULL AND deleted = FALSE`;
      const values = [];
      
      // Add filtering conditions
      if (filters.search) {
        query += ` AND (name LIKE ? OR email LIKE ?)`;
        values.push(`%${filters.search}%`, `%${filters.search}%`);
      }
      
      if (filters.is_active !== undefined) {
        query += ` AND is_active = ?`;
        values.push(filters.is_active);
      }
      
      if (filters.role_id !== undefined) {
        query += ` AND role_id = ?`;
        values.push(filters.role_id);
      }
      
      const [rows] = await db.query(query, values);
      return rows[0].count;
    } catch (error) {
      throw error;
    }
  }

  // Create a new user
  static async create(userData) {
    const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const dataWithTimestamps = {
      ...userData,
      created_at: timestamp,
      modified_at: timestamp,
      deleted: false
    };

    try {
      const [result] = await db.query('INSERT INTO users SET ?', dataWithTimestamps);
      return { id: result.insertId, ...dataWithTimestamps };
    } catch (error) {
      throw error;
    }
  }

  // Update a user by ID
  static async update(id, userData) {
    const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const dataWithTimestamp = {
      ...userData,
      modified_at: timestamp
    };

    try {
      const [result] = await db.query('UPDATE users SET ? WHERE id = ? AND deleted_at IS NULL AND deleted = FALSE', [dataWithTimestamp, id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // Soft delete a user by ID
  static async delete(id) {
    const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');

    try {
      const [result] = await db.query('UPDATE users SET deleted_at = ?, deleted = TRUE WHERE id = ? AND deleted_at IS NULL AND deleted = FALSE', [timestamp, id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = User;
