const CVSection = require('../models/CVSection');

class CVSectionController {
  // ============ ADMIN ENDPOINTS ============
  
  // Lấy tất cả sections (admin)
  static async getAllSections(req, res) {
    try {
      const filters = {
        category: req.query.category,
        is_active: req.query.is_active !== undefined ? req.query.is_active === 'true' : undefined,
        search: req.query.search
      };
      
      const sections = await CVSection.getAll(filters);
      
      res.json({
        success: true,
        data: sections
      });
    } catch (error) {
      console.error('Error getting sections:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách sections',
        error: error.message
      });
    }
  }
  
  // Lấy section theo ID (admin)
  static async getSectionById(req, res) {
    try {
      const { id } = req.params;
      const section = await CVSection.getById(id);
      
      if (!section) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy section'
        });
      }
      
      res.json({
        success: true,
        data: section
      });
    } catch (error) {
      console.error('Error getting section:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy thông tin section',
        error: error.message
      });
    }
  }
  
  // Tạo section mới (admin)
  static async createSection(req, res) {
    try {
      const {
        name,
        key_name,
        description,
        icon,
        default_fields,
        category,
        is_active,
        display_order
      } = req.body;
      
      // Validation
      if (!name || !key_name || !default_fields) {
        return res.status(400).json({
          success: false,
          message: 'Tên, key_name và default_fields là bắt buộc'
        });
      }
      
      // Check if key_name already exists
      const existing = await CVSection.getByKey(key_name);
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Key name đã tồn tại'
        });
      }
      
      const sectionId = await CVSection.create({
        name,
        key_name,
        description,
        icon,
        default_fields,
        category,
        is_active,
        display_order
      });
      
      res.status(201).json({
        success: true,
        data: { id: sectionId }
      });
    } catch (error) {
      console.error('Error creating section:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi tạo section',
        error: error.message
      });
    }
  }
  
  // Cập nhật section (admin)
  static async updateSection(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const section = await CVSection.getById(id);
      if (!section) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy section'
        });
      }
      
      // Check if updating key_name and it already exists
      if (updateData.key_name && updateData.key_name !== section.key_name) {
        const existing = await CVSection.getByKey(updateData.key_name);
        if (existing) {
          return res.status(400).json({
            success: false,
            message: 'Key name đã tồn tại'
          });
        }
      }
      
      const updated = await CVSection.update(id, updateData);
      
      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Không thể cập nhật section'
        });
      }
      
      res.json({
        success: true
      });
    } catch (error) {
      console.error('Error updating section:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi cập nhật section',
        error: error.message
      });
    }
  }
  
  // Xóa section (admin)
  static async deleteSection(req, res) {
    try {
      const { id } = req.params;
      
      const section = await CVSection.getById(id);
      if (!section) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy section'
        });
      }
      
      const deleted = await CVSection.delete(id);
      
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Không thể xóa section'
        });
      }
      
      res.json({
        success: true
      });
    } catch (error) {
      console.error('Error deleting section:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi xóa section',
        error: error.message
      });
    }
  }
  
  // ============ TEMPLATE SECTION MANAGEMENT (ADMIN) ============
  
  // Lấy sections của template
  static async getTemplateSections(req, res) {
    try {
      const { templateId } = req.params;
      const sections = await CVSection.getTemplateSections(templateId);
      
      res.json({
        success: true,
        data: sections
      });
    } catch (error) {
      console.error('Error getting template sections:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy sections của template',
        error: error.message
      });
    }
  }
  
  // Thêm section vào template
  static async addSectionToTemplate(req, res) {
    try {
      const { templateId } = req.params;
      const { section_id, layout, custom_fields, is_required, display_order } = req.body;
      
      if (!section_id || !layout) {
        return res.status(400).json({
          success: false,
          message: 'Section ID và layout là bắt buộc'
        });
      }
      
      const templateSectionId = await CVSection.addToTemplate(
        templateId,
        section_id,
        layout,
        custom_fields,
        is_required,
        display_order
      );
      
      res.status(201).json({
        success: true,
        data: { id: templateSectionId }
      });
    } catch (error) {
      console.error('Error adding section to template:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi thêm section vào template',
        error: error.message
      });
    }
  }
  
  // Cập nhật section trong template
  static async updateTemplateSection(req, res) {
    try {
      const { templateSectionId } = req.params;
      const updates = req.body;
      
      const updated = await CVSection.updateInTemplate(templateSectionId, updates);
      
      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Không thể cập nhật section'
        });
      }
      
      res.json({
        success: true
      });
    } catch (error) {
      console.error('Error updating template section:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi cập nhật section trong template',
        error: error.message
      });
    }
  }
  
  // Xóa section khỏi template
  static async removeSectionFromTemplate(req, res) {
    try {
      const { templateSectionId } = req.params;
      
      const deleted = await CVSection.removeFromTemplate(templateSectionId);
      
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Không thể xóa section'
        });
      }
      
      res.json({
        success: true
      });
    } catch (error) {
      console.error('Error removing section from template:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi xóa section khỏi template',
        error: error.message
      });
    }
  }
  
  // ============ PUBLIC/USER ENDPOINTS ============
  
  // Lấy active sections (public)
  static async getActiveSections(req, res) {
    try {
      const filters = {
        is_active: true,
        category: req.query.category,
        search: req.query.search
      };
      
      const sections = await CVSection.getAll(filters);
      
      res.json({
        success: true,
        data: sections
      });
    } catch (error) {
      console.error('Error getting active sections:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách sections',
        error: error.message
      });
    }
  }
  
  // Lấy user sections của CV
  static async getUserCVSections(req, res) {
    try {
      const { cvId } = req.params;
      const userId = req.user.id;
      
      // TODO: Verify CV belongs to user
      
      const sections = await CVSection.getUserSections(cvId);
      
      res.json({
        success: true,
        data: sections
      });
    } catch (error) {
      console.error('Error getting user CV sections:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy sections của CV',
        error: error.message
      });
    }
  }
  
  // Lưu user section
  static async saveUserCVSection(req, res) {
    try {
      const { cvId } = req.params;
      const { section_id, layout, data, is_visible, display_order } = req.body;
      const userId = req.user.id;
      
      if (!section_id || !layout || !data) {
        return res.status(400).json({
          success: false,
          message: 'Section ID, layout và data là bắt buộc'
        });
      }
      
      // Verify CV belongs to user
      const result = await CVSection.saveUserSection(
        cvId,
        section_id,
        layout,
        data,
        is_visible,
        display_order
      );
      
      res.json({
        success: true,
        data: { id: result }
      });
    } catch (error) {
      console.error('Error saving user CV section:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lưu section',
        error: error.message
      });
    }
  }
  
  // Cập nhật user section
  static async updateUserCVSection(req, res) {
    try {
      const { userSectionId } = req.params;
      const updates = req.body;
      const userId = req.user.id;
      
      // TODO: Verify section belongs to user's CV
      
      const updated = await CVSection.updateUserSection(userSectionId, updates);
      
      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Không thể cập nhật section'
        });
      }
      
      res.json({
        success: true
      });
    } catch (error) {
      console.error('Error updating user CV section:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi cập nhật section',
        error: error.message
      });
    }
  }
  
  // Xóa user section
  static async deleteUserCVSection(req, res) {
    try {
      const { userSectionId } = req.params;
      const userId = req.user.id;
      
      // TODO: Verify section belongs to user's CV
      
      const deleted = await CVSection.deleteUserSection(userSectionId);
      
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Không thể xóa section'
        });
      }
      
      res.json({
        success: true
      });
    } catch (error) {
      console.error('Error deleting user CV section:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi xóa section',
        error: error.message
      });
    }
  }
}

module.exports = CVSectionController;
