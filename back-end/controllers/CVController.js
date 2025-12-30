const CV = require('../models/CV');
const Notification = require('../models/Notification');
const path = require('path');
const fs = require('fs').promises;
const db = require('../config/db');
const { generateCVPDF } = require('../utils/pdfGenerator');

// Get all CVs for admin with pagination and filtering
const getAllCVs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const offset = (page - 1) * limit;
    
    const filters = {};
    if (search) {
      filters.search = search;
    }
    
    // Get CVs with user information
    let query = `
      SELECT 
        cvs.*,
        users.name as user_name,
        users.email as user_email
      FROM cvs
      LEFT JOIN users ON cvs.user_id = users.id
      WHERE cvs.deleted_at IS NULL AND cvs.deleted = FALSE
    `;
    const values = [];
    
    if (search) {
      query += ' AND (cvs.title LIKE ? OR users.name LIKE ? OR users.email LIKE ?)';
      values.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    query += ' ORDER BY cvs.created_at DESC LIMIT ? OFFSET ?';
    values.push(limit, offset);
    
    const [cvs] = await db.query(query, values);
    const total = await CV.count(filters);
    
    // Add full URL to each CV
    const protocol = req.protocol;
    const host = req.get('host');
    const baseUrl = `${protocol}://${host}`;
    
    const cvsWithUrl = cvs.map(cv => {
      if (cv.file_path) {
        const uploadsIndex = cv.file_path.indexOf('uploads');
        const relativePath = uploadsIndex !== -1 ? cv.file_path.substring(uploadsIndex) : cv.file_path;
        cv.file_url = `${baseUrl}/${relativePath.replace(/\\/g, '/')}`;
      }
      return cv;
    });
    
    res.json({
      success: true,
      data: cvsWithUrl,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching all CVs:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi khi lấy danh sách CV' 
    });
  }
};

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
    
    // Add full URL to each CV
    const protocol = req.protocol;
    const host = req.get('host');
    const baseUrl = `${protocol}://${host}`;
    
    const cvsWithUrl = cvs.map(cv => {
      if (cv.file_path) {
        // Extract relative path from absolute path
        const uploadsIndex = cv.file_path.indexOf('uploads');
        const relativePath = uploadsIndex !== -1 ? cv.file_path.substring(uploadsIndex) : cv.file_path;
        cv.file_url = `${baseUrl}/${relativePath.replace(/\\/g, '/')}`;
      }
      return cv;
    });
    
    res.json({
      result: {
        cvs: cvsWithUrl,
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
    
    // Generate full URL with protocol and host (like Media controller)
    const protocol = req.protocol;
    const host = req.get('host');
    const baseUrl = `${protocol}://${host}`;
    
    // Extract relative path from absolute path
    const uploadsIndex = req.file.path.indexOf('uploads');
    const relativePath = uploadsIndex !== -1 ? req.file.path.substring(uploadsIndex) : req.file.path;
    const relativeUrl = `/${relativePath.replace(/\\/g, '/')}`;
    const fullUrl = `${baseUrl}${relativeUrl}`;
    
    const cvData = {
      user_id: userId,
      title,
      file_path: req.file.path,
      file_name: req.file.filename,
      file_size: req.file.size,
      mime_type: req.file.mimetype
    };
    
    const cvId = await CV.create(cvData);
    
    // Return CV data with full URL (like Media controller)
    const responseData = {
      id: cvId,
      ...cvData,
      file_url: fullUrl,
      file_path: undefined // Don't expose absolute path
    };
    
    res.status(201).json({
      result: { cv: responseData }, 
      message: null
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
    const userId = req.user?.id; // Optional for public access
    
    // Get CV - allow public access for template-based CVs
    let cv;
    if (userId) {
      cv = await CV.getByIdAndUserId(id, userId);
    } else {
      // For public access, get CV without user check
      const [cvs] = await db.query(
        'SELECT * FROM cvs WHERE id = ? AND deleted_at IS NULL AND deleted = FALSE',
        [id]
      );
      cv = cvs.length > 0 ? cvs[0] : null;
    }
    
    if (!cv) {
      return res.status(404).json({ result: null, message: 'Không tìm thấy CV' });
    }
    
    if (cv.deleted_at) {
      return res.status(404).json({ result: null, message: 'Không tìm thấy CV' });
    }
    
    // Check access permission
    if (userId && cv.user_id !== userId && !cv.is_published) {
      return res.status(403).json({ result: null, message: 'Bạn không có quyền tải CV này' });
    }
    
    // Check if this is a template-based CV
    if (cv.template_id) {
      console.log('Generating PDF for template-based CV:', id);
      
      // Get section data for this CV
      const [sections] = await db.query(
        `SELECT 
          cvs.section_id,
          cvs.data,
          cvs.position,
          cvs.is_visible,
          cvs.display_order,
          s.name as section_name,
          s.key_name,
          s.icon
         FROM cv_user_sections cvs
         LEFT JOIN cv_sections s ON cvs.section_id = s.id
         WHERE cvs.cv_id = ?
         ORDER BY cvs.display_order ASC`,
        [id]
      );
      
      // Parse JSON fields
      const parsedSections = sections.map(section => ({
        ...section,
        data: typeof section.data === 'string' ? JSON.parse(section.data) : section.data,
        position: typeof section.position === 'string' ? JSON.parse(section.position) : section.position
      }));
      
      // Generate PDF
      const pdfDoc = generateCVPDF(cv, parsedSections);
      
      // Set headers for PDF download
      const filename = `${cv.title.replace(/[^a-z0-9]/gi, '_')}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      // Pipe PDF to response
      pdfDoc.pipe(res);
      pdfDoc.end();
      
      return;
    }
    
    // For regular uploaded CVs
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
    if (!res.headersSent) {
      res.status(500).json({ result: null, message: 'Tải xuống CV thất bại' });
    }
  }
};

// Check if CV is used in job applications
const checkCVInApplications = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const cv = await CV.getByIdAndUserId(id, userId);
    
    if (!cv) {
      return res.status(404).json({ result: null, message: 'Không tìm thấy CV' });
    }
    
    // Check if CV is used in any job applications
    const [applications] = await db.query(
      `SELECT ja.id, ja.job_id, ja.status, j.title as job_title, j.created_by as recruiter_id,
              u.name as recruiter_name
       FROM job_applications ja
       LEFT JOIN jobs j ON ja.job_id = j.id
       LEFT JOIN users u ON j.created_by = u.id
       WHERE ja.cv_id = ? AND ja.user_id = ?`,
      [id, userId]
    );
    
    res.json({
      result: {
        isUsed: applications.length > 0,
        applications: applications.map(app => ({
          id: app.id,
          job_id: app.job_id,
          job_title: app.job_title,
          status: app.status,
          recruiter_id: app.recruiter_id,
          recruiter_name: app.recruiter_name
        }))
      },
      message: null
    });
  } catch (error) {
    console.error('Error checking CV in applications:', error);
    res.status(500).json({ result: null, message: 'Kiểm tra CV thất bại' });
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
    
    // Check if CV is used in any job applications and notify recruiters
    const [applications] = await db.query(
      `SELECT ja.id, ja.job_id, j.title as job_title, j.created_by as recruiter_id
       FROM job_applications ja
       LEFT JOIN jobs j ON ja.job_id = j.id
       WHERE ja.cv_id = ? AND ja.user_id = ?`,
      [id, userId]
    );
    
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
    
    // Update job applications to remove CV reference
    if (applications.length > 0) {
      await db.query(
        'UPDATE job_applications SET cv_id = NULL WHERE cv_id = ? AND user_id = ?',
        [id, userId]
      );
      
      // Notify recruiters about CV deletion (WebSocket is automatically sent by Notification.create)
      const notifiedRecruiters = new Set();
      
      for (const app of applications) {
        if (app.recruiter_id && !notifiedRecruiters.has(app.recruiter_id)) {
          await Notification.create({
            user_id: app.recruiter_id,
            title: 'Ứng viên đã xóa CV',
            message: `${req.user.name} đã xóa CV được sử dụng trong đơn ứng tuyển cho công việc "${app.job_title}"`,
            type: 'warning',
            link: `/nha-tuyen-dung/quan-ly-tin-tuyen-dung`
          });
          
          notifiedRecruiters.add(app.recruiter_id);
        }
      }
    }
    
    res.json({ 
      result: { 
        deleted: true,
        affectedApplications: applications.length 
      }, 
      message: null 
    });
  } catch (error) {
    console.error('Error deleting CV:', error);
    res.status(500).json({ result: null, message: 'Xóa CV thất bại' });
  }
};

module.exports = {
  getAllCVs,
  getUserCVs,
  uploadCV,
  downloadCV,
  deleteCV,
  checkCVInApplications
};
