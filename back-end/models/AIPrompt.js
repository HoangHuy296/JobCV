const db = require('../config/db');
const { getLocalTimestamp } = require('../utils/dateUtils');
const fs = require('fs').promises;
const path = require('path');

class AIPrompt {
  constructor(id, name, filename, description, category, variables, created_at, modified_at, deleted_at) {
    this.id = id;
    this.name = name;
    this.filename = filename;
    this.description = description;
    this.category = category;
    this.variables = variables;
    this.created_at = created_at;
    this.modified_at = modified_at;
    this.deleted_at = deleted_at;
  }

  static getPromptsDirectory() {
    return path.join(__dirname, '..', 'prompts');
  }

  // Get all prompts
  static async getAll() {
    try {
      const query = 'SELECT * FROM ai_prompts WHERE deleted_at IS NULL ORDER BY created_at DESC';
      const [rows] = await db.query(query);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Get prompt by ID
  static async getById(id) {
    try {
      const query = 'SELECT * FROM ai_prompts WHERE id = ? AND deleted_at IS NULL';
      const [rows] = await db.query(query, [id]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      throw error;
    }
  }

  // Get prompt by filename
  static async getByFilename(filename) {
    try {
      const query = 'SELECT * FROM ai_prompts WHERE filename = ? AND deleted_at IS NULL';
      const [rows] = await db.query(query, [filename]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      throw error;
    }
  }

  // Read prompt content from file
  static async readPromptContent(filename) {
    try {
      const filePath = path.join(this.getPromptsDirectory(), filename);
      const content = await fs.readFile(filePath, 'utf-8');
      return content;
    } catch (error) {
      throw new Error(`Failed to read prompt file: ${error.message}`);
    }
  }

  // Create new prompt
  static async create(data) {
    try {
      const timestamp = getLocalTimestamp();
      const { name, filename, description, category, variables } = data;

      // Check if filename already exists
      const existing = await this.getByFilename(filename);
      if (existing) {
        throw new Error('Prompt with this filename already exists');
      }

      const query = `
        INSERT INTO ai_prompts (name, filename, description, category, variables, created_at, modified_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      
      const [result] = await db.query(query, [
        name,
        filename,
        description || null,
        category || 'general',
        JSON.stringify(variables || []),
        timestamp,
        timestamp
      ]);

      return await this.getById(result.insertId);
    } catch (error) {
      throw error;
    }
  }

  // Update prompt
  static async update(id, data) {
    try {
      const timestamp = getLocalTimestamp();
      const { name, description, category, variables } = data;

      const query = `
        UPDATE ai_prompts 
        SET name = ?, description = ?, category = ?, variables = ?, modified_at = ?
        WHERE id = ? AND deleted_at IS NULL
      `;

      const [result] = await db.query(query, [
        name,
        description || null,
        category || 'general',
        JSON.stringify(variables || []),
        timestamp,
        id
      ]);

      if (result.affectedRows === 0) {
        throw new Error('Prompt not found');
      }

      return await this.getById(id);
    } catch (error) {
      throw error;
    }
  }

  // Update prompt content (file)
  static async updateContent(filename, content) {
    try {
      const filePath = path.join(this.getPromptsDirectory(), filename);
      await fs.writeFile(filePath, content, 'utf-8');
      
      // Update modified_at in database
      const prompt = await this.getByFilename(filename);
      if (prompt) {
        const timestamp = getLocalTimestamp();
        const query = 'UPDATE ai_prompts SET modified_at = ? WHERE id = ?';
        await db.query(query, [timestamp, prompt.id]);
      }

      return true;
    } catch (error) {
      throw new Error(`Failed to update prompt file: ${error.message}`);
    }
  }

  // Delete prompt (soft delete)
  static async delete(id) {
    try {
      const timestamp = getLocalTimestamp();
      const query = 'UPDATE ai_prompts SET deleted_at = ? WHERE id = ? AND deleted_at IS NULL';
      const [result] = await db.query(query, [timestamp, id]);

      if (result.affectedRows === 0) {
        throw new Error('Prompt not found');
      }

      return true;
    } catch (error) {
      throw error;
    }
  }

  // Create prompt file
  static async createPromptFile(filename, content) {
    try {
      const filePath = path.join(this.getPromptsDirectory(), filename);
      
      // Check if file already exists
      try {
        await fs.access(filePath);
        throw new Error('File already exists');
      } catch (err) {
        // File doesn't exist, continue
      }

      await fs.writeFile(filePath, content, 'utf-8');
      return true;
    } catch (error) {
      throw error;
    }
  }

  // List all prompt files in directory
  static async listPromptFiles() {
    try {
      const promptsDir = this.getPromptsDirectory();
      const files = await fs.readdir(promptsDir);
      return files.filter(file => file.endsWith('.txt'));
    } catch (error) {
      throw new Error(`Failed to list prompt files: ${error.message}`);
    }
  }
}

module.exports = AIPrompt;
