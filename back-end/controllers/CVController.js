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
    const offset = (page - 1) * limit;
    
    const filters = { user_id: userId };
    if (search) {
      filters.search = search;
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

// Upload a new CV file (PDF or image)
const uploadCV = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title } = req.body;
    
    if (!title) {
      return res.status(400).json({ result: null, message: 'Tiêu đề là bắt buộc' });
    }
    
    if (!req.file) {
      return res.status(400).json({ result: null, message: 'Chưa có tệp nào được tải lên' });
    }
    
    // Validate file type (PDF, Word documents, and images)
    const allowedMimeTypes = [
      // PDF
      'application/pdf',
      // Microsoft Word
      'application/msword', // .doc
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      // Images
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml', // .svg
      'image/heic', // iPhone photos
      'image/heif'
    ];
    
    if (!allowedMimeTypes.includes(req.file.mimetype)) {
      // Delete uploaded file if invalid
      try {
        await fs.unlink(req.file.path);
      } catch (err) {
        console.error('Error deleting invalid file:', err);
      }
      return res.status(400).json({ 
        result: null, 
        message: 'Chỉ chấp nhận file PDF, Word (DOC/DOCX) hoặc ảnh (JPG, PNG, GIF, WEBP, SVG, HEIC)' 
      });
    }
    
    const cvData = {
      user_id: userId,
      title,
      file_path: req.file.path,
      file_name: req.file.filename,
      file_size: req.file.size,
      mime_type: req.file.mimetype
    };
    
    const newCV = await CV.create(cvData);
    
    res.status(201).json({
      result: { cv: { ...newCV, file_path: undefined } }, message: null
    });
  } catch (error) {
    console.error('Error uploading CV:', error);
    // Clean up uploaded file on error
    if (req.file && req.file.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (err) {
        console.error('Error deleting file after error:', err);
      }
    }
    res.status(500).json({ result: null, message: 'Tải lên CV thất bại' });
  }
};

// Download a CV file
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
      if (!res.headersSent) {
        res.status(500).json({ result: null, message: 'Tải xuống CV thất bại' });
      }
    });
  } catch (error) {
    console.error('Error downloading CV:', error);
    res.status(500).json({ result: null, message: 'Tải xuống CV thất bại' });
  }
};

// Delete a CV file
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
    await CV.delete(id);
    
    res.json({ result: true, message: null });
  } catch (error) {
    console.error('Error deleting CV:', error);
    res.status(500).json({ result: null, message: 'Xóa CV thất bại' });
  }
};

module.exports = {
  getUserCVs,
  uploadCV,
  downloadCV,
  deleteCV
};
