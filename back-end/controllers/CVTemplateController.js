const CVTemplate = require('../models/CVTemplate');
const pool = require('../config/db');
const path = require('path');

class CVTemplateController {
  // ============ ADMIN ENDPOINTS - IMAGE-BASED TEMPLATES ONLY ============
  
  // Upload hình ảnh template (admin)
  static async uploadTemplateImage(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng chọn file hình ảnh'
        });
      }

      // Generate full URL for the uploaded image
      const protocol = req.protocol;
      const host = req.get('host');
      const imageUrl = `${protocol}://${host}/uploads/templates/${req.file.filename}`;

      res.json({
        success: true,
        data: {
          url: imageUrl,
          filename: req.file.filename,
          size: req.file.size
        }
      });
    } catch (error) {
      console.error('❌ Error uploading template image:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi upload hình ảnh',
        error: error.message
      });
    }
  }
  
  // Lấy tất cả templates (admin)
  static async getAllTemplates(req, res) {
    try {
      console.log('📋 getAllTemplates called');
      console.log('Query params:', req.query);
      console.log('User:', req.user);
      
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      
      const filters = {
        is_published: req.query.is_published !== undefined ? req.query.is_published === 'true' : undefined,
        category: req.query.category,
        search: req.query.search,
        orderBy: req.query.orderBy || 'created_at',
        orderDir: req.query.orderDir || 'DESC'
      };
      
      console.log('Filters:', filters);
      
      const result = await CVTemplate.getAll(page, limit, filters);
      
      console.log('Result:', { 
        templatesCount: result.templates?.length,
        pagination: result.pagination 
      });
      
      res.json({
        success: true,
        data: result.templates,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('❌ Error getting templates:', error);
      console.error('Error stack:', error.stack);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách templates',
        error: error.message
      });
    }
  }
  
  // Lấy template theo ID (admin)
  static async getTemplateById(req, res) {
    try {
      const { id } = req.params;
      const template = await CVTemplate.getById(id);
      
      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy template'
        });
      }
      
      res.json({
        success: true,
        data: template
      });
    } catch (error) {
      console.error('Error getting template:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy thông tin template',
        error: error.message
      });
    }
  }
  
  // Tạo template mới (admin) - Image-based only
  static async createTemplate(req, res) {
    try {
      const {
        name,
        description,
        thumbnail_url,
        structure,
        is_published
      } = req.body;
      
      // Validation
      if (!name || !thumbnail_url) {
        return res.status(400).json({
          success: false,
          message: 'Tên template và hình ảnh là bắt buộc'
        });
      }

      if (!structure || !structure.fields || !Array.isArray(structure.fields)) {
        return res.status(400).json({
          success: false,
          message: 'Cấu trúc template phải chứa mảng fields'
        });
      }
      
      const templateId = await CVTemplate.create({
        name,
        description: description || '',
        thumbnail_url,
        category: 'general', // Fixed default
        structure,
        layout: 'image-based',
        is_published: is_published || false,
        is_premium: false, // Fixed default
        created_by: req.user.id,
        is_public: true
      });
      
      res.status(201).json({
        success: true,
        data: { id: templateId }
      });
    } catch (error) {
      console.error('Error creating template:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi tạo template',
        error: error.message
      });
    }
  }
  
  // Cập nhật template (admin)
  static async updateTemplate(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const template = await CVTemplate.getById(id);
      
      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy template'
        });
      }
      
      // Check permission (admin hoặc creator)
      if (req.user.role !== 'admin' && template.created_by !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền cập nhật template này'
        });
      }
      
      const updated = await CVTemplate.update(id, updateData);
      
      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Không thể cập nhật template'
        });
      }
      
      res.json({
        success: true
      });
    } catch (error) {
      console.error('Error updating template:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi cập nhật template',
        error: error.message
      });
    }
  }
  
  // Xóa template (admin)
  static async deleteTemplate(req, res) {
    try {
      const { id } = req.params;
      
      const template = await CVTemplate.getById(id);
      
      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy template'
        });
      }
      
      // Check permission (admin hoặc creator)
      if (req.user.role !== 'admin' && template.created_by !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền xóa template này'
        });
      }
      
      const deleted = await CVTemplate.delete(id);
      
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Không thể xóa template'
        });
      }
      
      res.json({
        success: true
      });
    } catch (error) {
      console.error('Error deleting template:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi xóa template',
        error: error.message
      });
    }
  }
  
  // ============ PUBLIC/USER ENDPOINTS ============
  
  // Lấy danh sách templates đã publish (public)
  static async getPublishedTemplates(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 12;
      
      const filters = {
        is_published: true,
        category: req.query.category,
        search: req.query.search,
        orderBy: req.query.orderBy || 'usage_count',
        orderDir: req.query.orderDir || 'DESC'
      };
      
      const result = await CVTemplate.getAll(page, limit, filters);
      
      res.json({
        success: true,
        data: result.templates,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Error getting published templates:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách templates',
        error: error.message
      });
    }
  }
  
  // Lấy template preview (public)
  static async getTemplatePreview(req, res) {
    try {
      const { id } = req.params;
      const template = await CVTemplate.getById(id);
      
      if (!template || (!template.is_published && req.user?.role !== 'admin')) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy template'
        });
      }
      
      res.json({
        success: true,
        data: template
      });
    } catch (error) {
      console.error('Error getting template preview:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy thông tin template',
        error: error.message
      });
    }
  }
  
  // Lấy categories
  static async getCategories(req, res) {
    try {
      const categories = await CVTemplate.getCategories();
      
      res.json({
        success: true,
        data: categories
      });
    } catch (error) {
      console.error('Error getting categories:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh mục',
        error: error.message
      });
    }
  }
  
  // Tạo CV từ template (user)
  static async createCVFromTemplate(req, res) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const { template_id, title, data, sections } = req.body;
      const userId = req.user.id;
      
      console.log('=== CREATE CV FROM TEMPLATE ===');
      console.log('User ID:', userId);
      console.log('Template ID:', template_id);
      console.log('Title:', title);
      console.log('Data type:', typeof data);
      console.log('Data keys:', data ? Object.keys(data) : 'null');
      console.log('Sections:', JSON.stringify(sections, null, 2));
      
      // Validation
      if (!template_id || !title) {
        console.log('Validation failed: Missing template_id or title');
        return res.status(400).json({
          success: false,
          message: 'Template ID và tiêu đề là bắt buộc'
        });
      }
      
      // Check template exists and is published
      const template = await CVTemplate.getById(template_id);
      console.log('Template found:', template ? template.name : 'null');
      console.log('Template is_published:', template ? template.is_published : 'null');
      
      if (!template || !template.is_published) {
        console.log('Template validation failed');
        return res.status(404).json({
          success: false,
          message: 'Template không tồn tại hoặc chưa được công bố'
        });
      }
      
      // Create CV with template image as file_path for preview
      console.log('Creating CV in database...');
      const [result] = await connection.query(
        `INSERT INTO cvs (user_id, title, template_id, template_data, file_path, mime_type, is_template, is_published)
         VALUES (?, ?, ?, ?, ?, ?, FALSE, FALSE)`,
        [userId, title, template_id, JSON.stringify(data || {}), template.thumbnail_url, 'image/png']
      );
      
      const cvId = result.insertId;
      console.log('CV created with ID:', cvId);
      
      // Save section data to cv_user_sections for better organization
      console.log('Saving section data...');
      if (data && typeof data === 'object') {
        const sectionEntries = Object.entries(data);
        console.log('Number of sections with data:', sectionEntries.length);
        
        for (let i = 0; i < sectionEntries.length; i++) {
          const [sectionId, sectionData] = sectionEntries[i];
          const sectionInfo = sections?.find(s => s.section_id == sectionId);
          
          console.log(`Processing section ${i + 1}:`, {
            sectionId,
            hasData: !!sectionData,
            dataKeys: sectionData ? Object.keys(sectionData) : [],
            hasSectionInfo: !!sectionInfo
          });
          
          if (sectionInfo) {
            await connection.query(
              `INSERT INTO cv_user_sections (cv_id, section_id, position, data, is_visible, display_order)
               VALUES (?, ?, ?, ?, ?, ?)`,
              [
                cvId,
                sectionId,
                JSON.stringify(sectionInfo.position || { x: 0, y: 0, width: 100, height: 20 }),
                JSON.stringify(sectionData),
                sectionInfo.is_visible !== false,
                sectionInfo.display_order || i
              ]
            );
            console.log(`Section ${sectionId} saved successfully`);
          } else {
            console.log(`Warning: No section info found for section ${sectionId}`);
          }
        }
      } else {
        console.log('No data to save or data is not an object');
      }
      
      // Increment template usage count
      console.log('Incrementing template usage count...');
      await connection.query(
        `UPDATE cv_templates SET usage_count = usage_count + 1 WHERE id = ?`,
        [template_id]
      );
      console.log('Template usage count incremented');
      
      console.log('Committing transaction...');
      await connection.commit();
      
      console.log('CV created successfully with ID:', cvId);
      console.log('=== END CREATE CV FROM TEMPLATE ===');
      
      res.status(201).json({
        success: true,
        data: { id: cvId }
      });
    } catch (error) {
      await connection.rollback();
      console.error('=== ERROR CREATING CV FROM TEMPLATE ===');
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.error('Error details:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi tạo CV từ template',
        error: error.message
      });
    } finally {
      connection.release();
    }
  }
  
  // Cập nhật CV từ template (user)
  static async updateCVFromTemplate(req, res) {
    try {
      const { id } = req.params;
      const { title, template_data } = req.body;
      const userId = req.user.id;
      
      // Check CV exists and belongs to user
      const [cvs] = await pool.query(
        `SELECT * FROM cvs WHERE id = ? AND user_id = ? AND deleted = FALSE`,
        [id, userId]
      );
      
      if (cvs.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy CV hoặc bạn không có quyền chỉnh sửa'
        });
      }
      
      const updateFields = [];
      const updateValues = [];
      
      if (title !== undefined) {
        updateFields.push('title = ?');
        updateValues.push(title);
      }
      
      if (template_data !== undefined) {
        updateFields.push('template_data = ?');
        updateValues.push(JSON.stringify(template_data));
      }
      
      if (updateFields.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Không có dữ liệu để cập nhật'
        });
      }
      
      updateValues.push(id, userId);
      
      await pool.query(
        `UPDATE cvs SET ${updateFields.join(', ')} WHERE id = ? AND user_id = ?`,
        updateValues
      );
      
      res.json({
        success: true
      });
    } catch (error) {
      console.error('Error updating CV from template:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi cập nhật CV',
        error: error.message
      });
    }
  }
  
}

module.exports = CVTemplateController;
