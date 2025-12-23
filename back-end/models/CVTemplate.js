const pool = require('../config/db');

class CVTemplate {
  // Lấy tất cả templates (có phân trang và filter)
  static async getAll(page = 1, limit = 10, filters = {}) {
    try {
      console.log('🔍 CVTemplate.getAll called with:', { page, limit, filters });
      
      const offset = (page - 1) * limit;
      let query = `
        SELECT 
          t.*,
          u.name as creator_name,
          u.email as creator_email
        FROM cv_templates t
        LEFT JOIN users u ON t.created_by = u.id
        WHERE t.deleted = FALSE
      `;
      const params = [];
    
    // Filter by published status
    if (filters.is_published !== undefined) {
      query += ` AND t.is_published = ?`;
      params.push(filters.is_published);
    }
    
    // Filter by category
    if (filters.category) {
      query += ` AND t.category = ?`;
      params.push(filters.category);
    }
    
    // Filter by creator
    if (filters.created_by) {
      query += ` AND t.created_by = ?`;
      params.push(filters.created_by);
    }
    
    // Search by name
    if (filters.search) {
      query += ` AND (t.name LIKE ? OR t.description LIKE ?)`;
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }
    
    // Order by
    const orderBy = filters.orderBy || 'created_at';
    const orderDir = filters.orderDir || 'DESC';
    query += ` ORDER BY t.${orderBy} ${orderDir}`;
    
    // Pagination
    query += ` LIMIT ? OFFSET ?`;
    params.push(limit, offset);
    
    const [templates] = await pool.query(query, params);
    
    // Get total count
    let countQuery = `
      SELECT COUNT(*) as total
      FROM cv_templates t
      WHERE t.deleted = FALSE
    `;
    const countParams = [];
    
    if (filters.is_published !== undefined) {
      countQuery += ` AND t.is_published = ?`;
      countParams.push(filters.is_published);
    }
    
    if (filters.category) {
      countQuery += ` AND t.category = ?`;
      countParams.push(filters.category);
    }
    
    if (filters.created_by) {
      countQuery += ` AND t.created_by = ?`;
      countParams.push(filters.created_by);
    }
    
    if (filters.search) {
      countQuery += ` AND (t.name LIKE ? OR t.description LIKE ?)`;
      countParams.push(`%${filters.search}%`, `%${filters.search}%`);
    }
    
      const [countResult] = await pool.query(countQuery, countParams);
      const total = countResult[0].total;
      
      console.log('✅ Query successful:', { 
        templatesFound: templates.length, 
        total 
      });
      
      return {
        templates,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('❌ Error in CVTemplate.getAll:', error);
      console.error('Error stack:', error.stack);
      throw error;
    }
  }
  
  // Lấy template theo ID
  static async getById(id) {
    const [templates] = await pool.query(
      `SELECT 
        t.*,
        u.name as creator_name,
        u.email as creator_email
      FROM cv_templates t
      LEFT JOIN users u ON t.created_by = u.id
      WHERE t.id = ? AND t.deleted = FALSE`,
      [id]
    );
    
    return templates[0];
  }
  
  // Tạo template mới
  static async create(templateData) {
    const {
      name,
      description,
      thumbnail_url,
      category,
      structure,
      layout,
      is_published,
      is_premium,
      created_by,
      is_public
    } = templateData;
    
    const [result] = await pool.query(
      `INSERT INTO cv_templates 
        (name, description, thumbnail_url, category, structure, layout, is_published, is_premium, created_by, is_public)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        description || null,
        thumbnail_url || null,
        category || 'general',
        JSON.stringify(structure),
        layout || 'single-column',
        is_published || false,
        is_premium || false,
        created_by || null,
        is_public !== false // Default true
      ]
    );
    
    return result.insertId;
  }
  
  // Cập nhật template
  static async update(id, templateData) {
    const fields = [];
    const values = [];
    
    if (templateData.name !== undefined) {
      fields.push('name = ?');
      values.push(templateData.name);
    }
    
    if (templateData.description !== undefined) {
      fields.push('description = ?');
      values.push(templateData.description);
    }
    
    if (templateData.thumbnail_url !== undefined) {
      fields.push('thumbnail_url = ?');
      values.push(templateData.thumbnail_url);
    }
    
    if (templateData.category !== undefined) {
      fields.push('category = ?');
      values.push(templateData.category);
    }
    
    if (templateData.structure !== undefined) {
      fields.push('structure = ?');
      values.push(JSON.stringify(templateData.structure));
    }
    
    if (templateData.layout !== undefined) {
      fields.push('layout = ?');
      values.push(templateData.layout);
    }
    
    if (templateData.is_published !== undefined) {
      fields.push('is_published = ?');
      values.push(templateData.is_published);
    }
    
    if (templateData.is_premium !== undefined) {
      fields.push('is_premium = ?');
      values.push(templateData.is_premium);
    }
    
    if (templateData.is_public !== undefined) {
      fields.push('is_public = ?');
      values.push(templateData.is_public);
    }
    
    if (fields.length === 0) {
      throw new Error('No fields to update');
    }
    
    values.push(id);
    
    const [result] = await pool.query(
      `UPDATE cv_templates SET ${fields.join(', ')} WHERE id = ? AND deleted = FALSE`,
      values
    );
    
    return result.affectedRows > 0;
  }
  
  // Xóa template (soft delete)
  static async delete(id) {
    const [result] = await pool.query(
      `UPDATE cv_templates 
       SET deleted = TRUE, deleted_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [id]
    );
    
    return result.affectedRows > 0;
  }
  
  // Tăng usage count
  static async incrementUsageCount(id) {
    await pool.query(
      `UPDATE cv_templates SET usage_count = usage_count + 1 WHERE id = ?`,
      [id]
    );
  }
  
  // Lấy các categories
  static async getCategories() {
    const [categories] = await pool.query(
      `SELECT DISTINCT category, COUNT(*) as count
       FROM cv_templates
       WHERE deleted = FALSE AND is_published = TRUE
       GROUP BY category
       ORDER BY category`
    );
    
    return categories;
  }
  
  // Duplicate template (cho user tạo bản copy)
  static async duplicate(id, userId) {
    const template = await this.getById(id);
    
    if (!template) {
      throw new Error('Template not found');
    }
    
    const newTemplateData = {
      name: `${template.name} (Copy)`,
      description: template.description,
      category: template.category,
      structure: JSON.parse(template.structure),
      layout: template.layout,
      is_published: false, // Copy không tự động publish
      is_premium: false,
      created_by: userId,
      is_public: false // Copy mặc định là private
    };
    
    return await this.create(newTemplateData);
  }
}

module.exports = CVTemplate;
