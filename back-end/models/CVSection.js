const pool = require('../config/db');

class CVSection {
  // Lấy tất cả sections (có filter)
  static async getAll(filters = {}) {
    try {
      let query = `
        SELECT * FROM cv_sections
        WHERE deleted = FALSE
      `;
      const params = [];
      
      if (filters.category) {
        query += ` AND category = ?`;
        params.push(filters.category);
      }
      
      if (filters.is_active !== undefined) {
        query += ` AND is_active = ?`;
        params.push(filters.is_active);
      }
      
      if (filters.search) {
        query += ` AND (name LIKE ? OR description LIKE ?)`;
        params.push(`%${filters.search}%`, `%${filters.search}%`);
      }
      
      query += ` ORDER BY display_order ASC, created_at ASC`;
      
      const [sections] = await pool.query(query, params);
      return sections;
    } catch (error) {
      throw error;
    }
  }
  
  // Lấy section theo ID
  static async getById(id) {
    const [sections] = await pool.query(
      `SELECT * FROM cv_sections WHERE id = ? AND deleted = FALSE`,
      [id]
    );
    return sections[0];
  }
  
  // Lấy section theo key_name
  static async getByKey(keyName) {
    const [sections] = await pool.query(
      `SELECT * FROM cv_sections WHERE key_name = ? AND deleted = FALSE`,
      [keyName]
    );
    return sections[0];
  }
  
  // Tạo section mới
  static async create(sectionData) {
    const {
      name,
      key_name,
      description,
      icon,
      default_fields,
      category,
      is_active,
      display_order
    } = sectionData;
    
    const [result] = await pool.query(
      `INSERT INTO cv_sections 
        (name, key_name, description, icon, default_fields, category, is_active, display_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        key_name,
        description || null,
        icon || null,
        JSON.stringify(default_fields),
        category || 'general',
        is_active !== false,
        display_order || 0
      ]
    );
    
    return result.insertId;
  }
  
  // Cập nhật section
  static async update(id, sectionData) {
    const fields = [];
    const values = [];
    
    if (sectionData.name !== undefined) {
      fields.push('name = ?');
      values.push(sectionData.name);
    }
    
    if (sectionData.key_name !== undefined) {
      fields.push('key_name = ?');
      values.push(sectionData.key_name);
    }
    
    if (sectionData.description !== undefined) {
      fields.push('description = ?');
      values.push(sectionData.description);
    }
    
    if (sectionData.icon !== undefined) {
      fields.push('icon = ?');
      values.push(sectionData.icon);
    }
    
    if (sectionData.default_fields !== undefined) {
      fields.push('default_fields = ?');
      values.push(JSON.stringify(sectionData.default_fields));
    }
    
    if (sectionData.category !== undefined) {
      fields.push('category = ?');
      values.push(sectionData.category);
    }
    
    if (sectionData.is_active !== undefined) {
      fields.push('is_active = ?');
      values.push(sectionData.is_active);
    }
    
    if (sectionData.display_order !== undefined) {
      fields.push('display_order = ?');
      values.push(sectionData.display_order);
    }
    
    if (fields.length === 0) {
      throw new Error('No fields to update');
    }
    
    values.push(id);
    
    const [result] = await pool.query(
      `UPDATE cv_sections SET ${fields.join(', ')} WHERE id = ? AND deleted = FALSE`,
      values
    );
    
    return result.affectedRows > 0;
  }
  
  // Xóa section (soft delete)
  static async delete(id) {
    const [result] = await pool.query(
      `UPDATE cv_sections 
       SET deleted = TRUE, deleted_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [id]
    );
    
    return result.affectedRows > 0;
  }
  
  // Lấy sections của một template
  static async getTemplateSections(templateId) {
    const [sections] = await pool.query(
      `SELECT 
        ts.*,
        s.name,
        s.key_name,
        s.description,
        s.icon,
        s.default_fields,
        s.category
      FROM cv_template_sections ts
      JOIN cv_sections s ON ts.section_id = s.id
      WHERE ts.template_id = ? AND s.deleted = FALSE
      ORDER BY ts.display_order ASC`,
      [templateId]
    );
    
    return sections;
  }
  
  // Thêm section vào template
  static async addToTemplate(templateId, sectionId, position, customFields = null, isRequired = false, displayOrder = 0) {
    const [result] = await pool.query(
      `INSERT INTO cv_template_sections 
        (template_id, section_id, position, custom_fields, is_required, display_order)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [
        templateId,
        sectionId,
        JSON.stringify(position),
        customFields ? JSON.stringify(customFields) : null,
        isRequired,
        displayOrder
      ]
    );
    
    return result.insertId;
  }
  
  // Cập nhật section trong template
  static async updateInTemplate(templateSectionId, updates) {
    const fields = [];
    const values = [];
    
    if (updates.position !== undefined) {
      fields.push('position = ?');
      values.push(JSON.stringify(updates.position));
    }
    
    if (updates.custom_fields !== undefined) {
      fields.push('custom_fields = ?');
      values.push(updates.custom_fields ? JSON.stringify(updates.custom_fields) : null);
    }
    
    if (updates.is_required !== undefined) {
      fields.push('is_required = ?');
      values.push(updates.is_required);
    }
    
    if (updates.display_order !== undefined) {
      fields.push('display_order = ?');
      values.push(updates.display_order);
    }
    
    if (fields.length === 0) {
      throw new Error('No fields to update');
    }
    
    values.push(templateSectionId);
    
    const [result] = await pool.query(
      `UPDATE cv_template_sections SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    
    return result.affectedRows > 0;
  }
  
  // Xóa section khỏi template
  static async removeFromTemplate(templateSectionId) {
    const [result] = await pool.query(
      `DELETE FROM cv_template_sections WHERE id = ?`,
      [templateSectionId]
    );
    
    return result.affectedRows > 0;
  }
  
  // Lấy user sections của một CV
  static async getUserSections(cvId) {
    const [sections] = await pool.query(
      `SELECT 
        us.*,
        s.name,
        s.key_name,
        s.icon,
        s.default_fields,
        s.category
      FROM cv_user_sections us
      JOIN cv_sections s ON us.section_id = s.id
      WHERE us.cv_id = ? AND s.deleted = FALSE
      ORDER BY us.display_order ASC`,
      [cvId]
    );
    
    return sections;
  }
  
  // Lưu user section
  static async saveUserSection(cvId, sectionId, position, data, isVisible = true, displayOrder = 0) {
    const [result] = await pool.query(
      `INSERT INTO cv_user_sections 
        (cv_id, section_id, position, data, is_visible, display_order)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        position = VALUES(position),
        data = VALUES(data),
        is_visible = VALUES(is_visible),
        display_order = VALUES(display_order)`,
      [
        cvId,
        sectionId,
        JSON.stringify(position),
        JSON.stringify(data),
        isVisible,
        displayOrder
      ]
    );
    
    return result.insertId || result.affectedRows;
  }
  
  // Cập nhật user section
  static async updateUserSection(userSectionId, updates) {
    const fields = [];
    const values = [];
    
    if (updates.position !== undefined) {
      fields.push('position = ?');
      values.push(JSON.stringify(updates.position));
    }
    
    if (updates.data !== undefined) {
      fields.push('data = ?');
      values.push(JSON.stringify(updates.data));
    }
    
    if (updates.is_visible !== undefined) {
      fields.push('is_visible = ?');
      values.push(updates.is_visible);
    }
    
    if (updates.display_order !== undefined) {
      fields.push('display_order = ?');
      values.push(updates.display_order);
    }
    
    if (fields.length === 0) {
      throw new Error('No fields to update');
    }
    
    values.push(userSectionId);
    
    const [result] = await pool.query(
      `UPDATE cv_user_sections SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    
    return result.affectedRows > 0;
  }
  
  // Xóa user section
  static async deleteUserSection(userSectionId) {
    const [result] = await pool.query(
      `DELETE FROM cv_user_sections WHERE id = ?`,
      [userSectionId]
    );
    
    return result.affectedRows > 0;
  }
}

module.exports = CVSection;
