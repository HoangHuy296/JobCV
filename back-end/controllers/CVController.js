const CV = require('../models/CV');
const path = require('path');
const fs = require('fs').promises;

// Get all CVs for the current user with pagination and filtering
const getUserCVs = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const isTemplate = req.query.is_template;
    const offset = (page - 1) * limit;
    
    const filters = { user_id: userId };
    if (search) {
      filters.search = search;
    }
    if (isTemplate !== undefined) {
      filters.is_template = isTemplate === 'true' || isTemplate === true;
    }
    
    const cvs = await CV.findWithPagination(filters, limit, offset);
    const total = await CV.count(filters);
    
    res.json({
      result: {
        cvs: cvs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      },
      message: null
    });
  } catch (error) {
    console.error('Error fetching CVs:', error);
    res.status(500).json({ result: null, message: 'Lấy danh sách CV thất bại' });
  }
};

// Upload a new CV
const uploadCV = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, content } = req.body;
    
    if (!title) {
      return res.status(400).json({ result: null, message: 'Tiêu đề là bắt buộc' });
    }
    
    // If content is provided, save as JSON template
    if (content) {
      const cvData = {
        user_id: userId,
        title,
        content: JSON.parse(content), // Parse the JSON string
        is_template: req.body.is_template === 'true' || req.body.is_template === true
      };
      
      const newCV = await CV.createCV(cvData);
      
      return res.status(201).json({
        result: { cv: newCV }, message: null
      });
    }
    
    // Otherwise, handle file upload as before
    if (!req.file) {
      return res.status(400).json({ result: null, message: 'Chưa có tệp nào được tải lên' });
    }
    
    const cvData = {
      user_id: userId,
      title,
      file_path: req.file.path,
      file_name: req.file.filename,
      file_size: req.file.size,
      mime_type: req.file.mimetype
    };
    
    const newCV = await CV.createCV(cvData);
    
    res.status(201).json({
      result: { cv: { ...newCV, file_path: undefined } }, message: null
    });
  } catch (error) {
    console.error('Error uploading CV:', error);
    res.status(500).json({ result: null, message: 'Tải lên CV thất bại' });
  }
};

// Download a CV
const downloadCV = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const cv = await CV.getByIdAndUserId(id, userId);
    
    if (!cv) {
      return res.status(404).json({ result: null, message: 'Không tìm thấy CV' });
    }
    
    if (cv.deleted_at) {
      return res.status(404).json({ result: null, message: 'Không tìm thấy CV' });
    }
    
    // If CV has JSON content, return it directly
    if (cv.content) {
      res.setHeader('Content-Type', 'application/json');
      return res.json({
        title: cv.title,
        content: cv.content
      });
    }
    
    // Otherwise, handle file download as before
    if (!cv.file_path) {
      return res.status(404).json({ result: null, message: 'Không tìm thấy tệp CV' });
    }
    
    // Check if file exists
    try {
      await fs.access(cv.file_path);
    } catch (err) {
      return res.status(404).json({ result: null, message: 'Không tìm thấy tệp CV' });
    }
    
    // Set headers for download
    res.setHeader('Content-Disposition', `attachment; filename="${cv.file_name}"`);
    res.setHeader('Content-Type', cv.mime_type || 'application/octet-stream');
    
    // Stream the file
    const fileStream = require('fs').createReadStream(cv.file_path);
    fileStream.pipe(res);
    
    fileStream.on('error', (err) => {
      console.error('Error streaming file:', err);
      res.status(500).json({ result: null, message: 'Tải xuống CV thất bại' });
    });
  } catch (error) {
    console.error('Error downloading CV:', error);
    res.status(500).json({ result: null, message: 'Tải xuống CV thất bại' });
  }
};

// Delete a CV
const deleteCV = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const cv = await CV.getByIdAndUserId(id, userId);
    
    if (!cv) {
      return res.status(404).json({ result: null, message: 'Không tìm thấy CV' });
    }
    
    // Delete the file from storage if it exists
    if (cv.file_path) {
      try {
        await fs.unlink(cv.file_path);
      } catch (err) {
        console.error('Error deleting CV file:', err);
        // Continue with database deletion even if file deletion fails
      }
    }
    
    // Soft delete the CV record
    await CV.deleteCV(id);
    
    res.json({ result: true, message: null });
  } catch (error) {
    console.error('Error deleting CV:', error);
    res.status(500).json({ result: null, message: 'Xóa CV thất bại' });
  }
};

// Get all public templates
const getPublicTemplates = async (req, res) => {
  try {
    const templates = await CV.getPublicTemplates();
    
    res.json({
      result: { templates }, message: null
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ result: null, message: 'Lấy danh sách mẫu thất bại' });
  }
};

// Get a specific template
const getTemplateById = async (req, res) => {
  try {
    const { id } = req.params;
    const template = await CV.getTemplateById(id);
    
    if (!template) {
      return res.status(404).json({ result: null, message: 'Không tìm thấy mẫu' });
    }
    
    res.json({
      result: { template }, message: null
    });
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({ result: null, message: 'Lấy thông tin mẫu thất bại' });
  }
};

// Create a template from an existing CV
const createTemplateFromCV = async (req, res) => {
  try {
    const { cvId, title } = req.body;
    const userId = req.user.id;
    
    if (!title) {
      return res.status(400).json({ result: null, message: 'Tiêu đề là bắt buộc' });
    }
    
    const result = await CV.createTemplateFromCV(cvId, userId, title);
    
    res.status(201).json({
      result: { templateId: result.insertId }, message: null
    });
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ result: null, message: 'Tạo mẫu thất bại' });
  }
};

module.exports = {
  getUserCVs,
  uploadCV,
  downloadCV,
  deleteCV,
  getPublicTemplates,
  getTemplateById,
  createTemplateFromCV
};
