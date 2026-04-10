const db = require('../config/db');
const { getLocalTimestamp } = require('../utils/dateUtils');

class APIKey {
  constructor(id, name, provider, api_key, is_active, usage_count, last_used_at, daily_limit, daily_usage, last_reset_date, priority, notes, created_at, modified_at, deleted_at) {
    this.id = id;
    this.name = name;
    this.provider = provider;
    this.api_key = api_key;
    this.is_active = is_active;
    this.usage_count = usage_count;
    this.last_used_at = last_used_at;
    this.daily_limit = daily_limit;
    this.daily_usage = daily_usage;
    this.last_reset_date = last_reset_date;
    this.priority = priority;
    this.notes = notes;
    this.created_at = created_at;
    this.modified_at = modified_at;
    this.deleted_at = deleted_at;
  }

  // Get all API keys with optional filters
  static async getAll(provider = null, activeOnly = false) {
    try {
      let query = `
        SELECT * FROM api_keys 
        WHERE deleted_at IS NULL AND deleted = FALSE
      `;
      const params = [];

      if (provider) {
        query += ' AND provider = ?';
        params.push(provider);
      }

      if (activeOnly) {
        query += ' AND is_active = TRUE';
      }

      query += ' ORDER BY priority DESC, id ASC';

      const [rows] = await db.query(query, params);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Get API key by ID
  static async getById(id) {
    try {
      const [rows] = await db.query(
        'SELECT * FROM api_keys WHERE id = ? AND deleted_at IS NULL AND deleted = FALSE',
        [id]
      );
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      throw error;
    }
  }

  // Get best available key (active, not rate limited, highest priority)
  static async getBestAvailableKey(provider = 'gemini') {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Reset daily usage if needed
      await db.query(`
        UPDATE api_keys 
        SET daily_usage = 0, last_reset_date = ?
        WHERE provider = ? 
          AND is_active = TRUE 
          AND deleted_at IS NULL 
          AND deleted = FALSE
          AND (last_reset_date IS NULL OR last_reset_date < ?)
      `, [today, provider, today]);

      // Get best available key
      // MySQL doesn't support NULLS FIRST, use COALESCE to handle NULLs
      const [rows] = await db.query(`
        SELECT * FROM api_keys
        WHERE provider = ?
          AND is_active = TRUE
          AND deleted_at IS NULL
          AND deleted = FALSE
          AND (daily_usage < daily_limit OR daily_limit = 0)
        ORDER BY priority DESC, daily_usage ASC, COALESCE(last_used_at, '1970-01-01') ASC
        LIMIT 1
      `, [provider]);

      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      throw error;
    }
  }

  // Create new API key
  static async create(data) {
    try {
      const timestamp = getLocalTimestamp();
      const { name, provider, api_key, is_active, daily_limit, priority, notes } = data;

      const [result] = await db.query(`
        INSERT INTO api_keys (name, provider, api_key, is_active, daily_limit, priority, notes, created_at, modified_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        name,
        provider || 'gemini',
        api_key,
        is_active !== undefined ? is_active : true,
        daily_limit || 1500,
        priority || 0,
        notes || null,
        timestamp,
        timestamp
      ]);

      return await this.getById(result.insertId);
    } catch (error) {
      throw error;
    }
  }

  // Update API key
  static async update(id, data) {
    try {
      const timestamp = getLocalTimestamp();
      const { name, api_key, is_active, daily_limit, priority, notes } = data;

      const updates = [];
      const values = [];

      if (name !== undefined) {
        updates.push('name = ?');
        values.push(name);
      }
      if (api_key !== undefined) {
        updates.push('api_key = ?');
        values.push(api_key);
      }
      if (is_active !== undefined) {
        updates.push('is_active = ?');
        values.push(is_active);
      }
      if (daily_limit !== undefined) {
        updates.push('daily_limit = ?');
        values.push(daily_limit);
      }
      if (priority !== undefined) {
        updates.push('priority = ?');
        values.push(priority);
      }
      if (notes !== undefined) {
        updates.push('notes = ?');
        values.push(notes);
      }

      if (updates.length === 0) {
        return await this.getById(id);
      }

      updates.push('modified_at = ?');
      values.push(timestamp);
      values.push(id);

      await db.query(
        `UPDATE api_keys SET ${updates.join(', ')} WHERE id = ?`,
        values
      );

      return await this.getById(id);
    } catch (error) {
      throw error;
    }
  }

  // Increment usage counters
  static async incrementUsage(id) {
    try {
      const timestamp = getLocalTimestamp();
      await db.query(`
        UPDATE api_keys 
        SET usage_count = usage_count + 1,
            daily_usage = daily_usage + 1,
            last_used_at = ?,
            modified_at = ?
        WHERE id = ?
      `, [timestamp, timestamp, id]);
    } catch (error) {
      throw error;
    }
  }

  // Soft delete
  static async delete(id) {
    try {
      const timestamp = getLocalTimestamp();
      await db.query(
        'UPDATE api_keys SET deleted_at = ?, deleted = TRUE, modified_at = ? WHERE id = ?',
        [timestamp, timestamp, id]
      );
    } catch (error) {
      throw error;
    }
  }

  // Toggle active status
  static async toggleActive(id) {
    try {
      const timestamp = getLocalTimestamp();
      await db.query(
        'UPDATE api_keys SET is_active = NOT is_active, modified_at = ? WHERE id = ?',
        [timestamp, id]
      );
      return await this.getById(id);
    } catch (error) {
      throw error;
    }
  }

  // Get usage statistics
  static async getUsageStats(provider = null) {
    try {
      let query = `
        SELECT 
          provider,
          COUNT(*) as total_keys,
          SUM(CASE WHEN is_active = TRUE THEN 1 ELSE 0 END) as active_keys,
          SUM(usage_count) as total_usage,
          SUM(daily_usage) as total_daily_usage,
          AVG(daily_usage) as avg_daily_usage
        FROM api_keys
        WHERE deleted_at IS NULL AND deleted = FALSE
      `;
      const params = [];

      if (provider) {
        query += ' AND provider = ?';
        params.push(provider);
      }

      query += ' GROUP BY provider';

      const [rows] = await db.query(query, params);
      return rows;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = APIKey;
