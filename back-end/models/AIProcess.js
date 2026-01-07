const db = require('../config/db');
const { getLocalTimestamp } = require('../utils/dateUtils');

class AIProcess {
  constructor(id, name, code, description, prompt_id, is_active, config, created_at, modified_at, deleted_at) {
    this.id = id;
    this.name = name;
    this.code = code;
    this.description = description;
    this.prompt_id = prompt_id;
    this.is_active = is_active;
    this.config = config;
    this.created_at = created_at;
    this.modified_at = modified_at;
    this.deleted_at = deleted_at;
  }

  // Get all processes with their assigned prompts
  static async getAll() {
    try {
      const query = `
        SELECT 
          ap.*,
          aip.id as prompt_id,
          aip.name as prompt_name,
          aip.filename as prompt_filename,
          aip.category as prompt_category
        FROM ai_processes ap
        LEFT JOIN ai_prompts aip ON ap.prompt_id = aip.id AND aip.deleted_at IS NULL
        WHERE ap.deleted_at IS NULL
        ORDER BY ap.created_at DESC
      `;
      const [rows] = await db.query(query);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Get process by ID
  static async getById(id) {
    try {
      const query = `
        SELECT 
          ap.*,
          aip.id as prompt_id,
          aip.name as prompt_name,
          aip.filename as prompt_filename,
          aip.category as prompt_category
        FROM ai_processes ap
        LEFT JOIN ai_prompts aip ON ap.prompt_id = aip.id AND aip.deleted_at IS NULL
        WHERE ap.id = ? AND ap.deleted_at IS NULL
      `;
      const [rows] = await db.query(query, [id]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      throw error;
    }
  }

  // Get process by code
  static async getByCode(code) {
    try {
      const query = `
        SELECT 
          ap.*,
          aip.id as prompt_id,
          aip.name as prompt_name,
          aip.filename as prompt_filename,
          aip.category as prompt_category
        FROM ai_processes ap
        LEFT JOIN ai_prompts aip ON ap.prompt_id = aip.id AND aip.deleted_at IS NULL
        WHERE ap.code = ? AND ap.deleted_at IS NULL
      `;
      const [rows] = await db.query(query, [code]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      throw error;
    }
  }

  // Create new process
  static async create(data) {
    try {
      const timestamp = getLocalTimestamp();
      const { name, code, description, prompt_id, is_active, config } = data;

      // Check if code already exists
      const existing = await this.getByCode(code);
      if (existing) {
        throw new Error('Process with this code already exists');
      }

      const query = `
        INSERT INTO ai_processes (name, code, description, prompt_id, is_active, config, created_at, modified_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const [result] = await db.query(query, [
        name,
        code,
        description || null,
        prompt_id || null,
        is_active !== undefined ? is_active : true,
        JSON.stringify(config || {}),
        timestamp,
        timestamp
      ]);

      return await this.getById(result.insertId);
    } catch (error) {
      throw error;
    }
  }

  // Update process
  static async update(id, data) {
    try {
      const timestamp = getLocalTimestamp();
      const { name, description, prompt_id, is_active, config } = data;

      const query = `
        UPDATE ai_processes 
        SET name = ?, description = ?, prompt_id = ?, is_active = ?, config = ?, modified_at = ?
        WHERE id = ? AND deleted_at IS NULL
      `;

      const [result] = await db.query(query, [
        name,
        description || null,
        prompt_id || null,
        is_active !== undefined ? is_active : true,
        JSON.stringify(config || {}),
        timestamp,
        id
      ]);

      if (result.affectedRows === 0) {
        throw new Error('Process not found');
      }

      return await this.getById(id);
    } catch (error) {
      throw error;
    }
  }

  // Assign prompt to process
  static async assignPrompt(processId, promptId) {
    try {
      const timestamp = getLocalTimestamp();
      const query = `
        UPDATE ai_processes 
        SET prompt_id = ?, modified_at = ?
        WHERE id = ? AND deleted_at IS NULL
      `;

      const [result] = await db.query(query, [promptId, timestamp, processId]);

      if (result.affectedRows === 0) {
        throw new Error('Process not found');
      }

      return await this.getById(processId);
    } catch (error) {
      throw error;
    }
  }

  // Toggle active status
  static async toggleActive(id) {
    try {
      const timestamp = getLocalTimestamp();
      const process = await this.getById(id);
      
      if (!process) {
        throw new Error('Process not found');
      }

      const query = `
        UPDATE ai_processes 
        SET is_active = ?, modified_at = ?
        WHERE id = ? AND deleted_at IS NULL
      `;

      await db.query(query, [!process.is_active, timestamp, id]);
      return await this.getById(id);
    } catch (error) {
      throw error;
    }
  }

  // Delete process (soft delete)
  static async delete(id) {
    try {
      const timestamp = getLocalTimestamp();
      const query = 'UPDATE ai_processes SET deleted_at = ? WHERE id = ? AND deleted_at IS NULL';
      const [result] = await db.query(query, [timestamp, id]);

      if (result.affectedRows === 0) {
        throw new Error('Process not found');
      }

      return true;
    } catch (error) {
      throw error;
    }
  }

  // Get default processes (to be created on system initialization)
  static getDefaultProcesses() {
    return [
      {
        name: 'CV Information Extraction',
        code: 'CV_EXTRACTION',
        description: 'Extract structured information from CV/Resume images using AI',
        is_active: true,
        config: {
          model: 'gemini-1.5-flash',
          temperature: 0.1,
          maxTokens: 2048
        }
      },
      {
        name: 'Job-CV Matching',
        code: 'JOB_MATCHING',
        description: 'Analyze compatibility between candidate CV and job requirements',
        is_active: false,
        config: {
          model: 'gemini-1.5-pro',
          temperature: 0.3,
          maxTokens: 1024
        }
      },
      {
        name: 'Cover Letter Generation',
        code: 'COVER_LETTER_GEN',
        description: 'Generate professional cover letters based on CV and job description',
        is_active: false,
        config: {
          model: 'gemini-1.5-flash',
          temperature: 0.7,
          maxTokens: 1024
        }
      }
    ];
  }
}

module.exports = AIProcess;
