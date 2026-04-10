const CV = require('../models/CV');
const Notification = require('../models/Notification');
const path = require('path');
const fs = require('fs').promises;
const db = require('../config/db');
const { generateCVPDF } = require('../utils/pdfGenerator');
const { generateCVPDFFromHTML } = require('../utils/htmlToPdfGenerator');
const geminiService = require('../utils/geminiService');
const aiProcessService = require('../utils/aiProcessService');

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
      // Add is_template flag based on template_id
      cv.is_template = cv.template_id ? true : false;
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
      
      // Get template info to get thumbnail URL
      const [templates] = await db.query(
        'SELECT thumbnail_url FROM cv_templates WHERE id = ?',
        [cv.template_id]
      );
      const templateThumbnail = templates.length > 0 ? templates[0].thumbnail_url : null;
      
      // Get section data for this CV
      const [sections] = await db.query(
        `SELECT 
          cvs.section_id,
          cvs.data,
          cvs.layout,
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
        layout: typeof section.layout === 'string' ? JSON.parse(section.layout) : section.layout
      }));
      
      // Generate PDF with HTML renderer to preserve background
      const pdfBuffer = await generateCVPDFFromHTML(cv, parsedSections, templateThumbnail);
      
      // Set headers for PDF download
      const filename = `${cv.title.replace(/[^a-z0-9]/gi, '_')}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      
      // Send PDF buffer
      res.send(pdfBuffer);
      
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
    
    // DO NOT remove CV reference from job_applications
    // Recruiters need to see CV info even after user deletes it
    // Just notify recruiters about the deletion
    if (applications.length > 0) {
      const notifiedRecruiters = new Set();
      
      for (const app of applications) {
        if (app.recruiter_id && !notifiedRecruiters.has(app.recruiter_id)) {
          await Notification.create({
            user_id: app.recruiter_id,
            title: 'Ứng viên đã xóa CV',
            message: `${req.user.name} đã xóa CV được sử dụng trong đơn ứng tuyển cho công việc "${app.job_title}". CV vẫn có thể xem được từ hệ thống.`,
            type: 'info',
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

// Extract CV information using Gemini AI
const extractCVInfo = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role?.name;
    
    console.log('🤖 [Gemini AI] Extract CV Info Request');
    console.log('  - CV ID:', id);
    console.log('  - User ID:', userId);
    console.log('  - User Role:', userRole);
    
    // Get CV (without user restriction first)
    const [cvs] = await db.query(
      'SELECT * FROM cvs WHERE id = ? AND deleted = FALSE',
      [id]
    );
    
    if (cvs.length === 0) {
      console.log('  ❌ CV not found');
      return res.status(404).json({ 
        result: null, 
        message: 'Không tìm thấy CV' 
      });
    }
    
    const cv = cvs[0];
    
    // Check access: owner can access their CV, recruiter can access any CV
    const isOwner = cv.user_id === userId;
    const isRecruiter = userRole === 'recruiter' || userRole === 'admin';
    
    if (!isOwner && !isRecruiter) {
      console.log('  ❌ Access denied - not owner and not recruiter');
      return res.status(403).json({
        result: null,
        message: 'Bạn không có quyền truy cập CV này'
      });
    }
    
    console.log('  ✅ Access granted -', isOwner ? 'Owner' : 'Recruiter');
    
    // Check if CV is template-based
    if (cv.template_id) {
      // Get section data for this CV
      const [sections] = await db.query(
        `SELECT 
          cvs.section_id,
          cvs.data,
          cvs.layout,
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
        layout: typeof section.layout === 'string' ? JSON.parse(section.layout) : section.layout
      }));
      
      console.log('🤖 [Gemini AI] Extracting CV info from sections...');
      console.log('  - CV ID:', id);
      console.log('  - Template ID:', cv.template_id);
      console.log('  - Number of sections:', parsedSections.length);
      console.log('  - Sections:', parsedSections.map(s => s.section_name || s.key_name).join(', '));
      
      // Extract from sections
      const result = await geminiService.extractFromCVSections(parsedSections);
      
      console.log('🤖 [Gemini AI] Extraction result:', result.success ? '✅ Success' : '❌ Failed');
      if (!result.success) {
        console.error('  - Error:', result.error);
      } else {
        console.log('  - Extracted data keys:', Object.keys(result.data || {}));
      }
      
      if (result.success) {
        return res.json({
          result: result.data,
          message: null
        });
      } else {
        return res.status(500).json({
          result: null,
          message: `Không thể trích xuất thông tin: ${result.error}`
        });
      }
    }
    // Extract from image/PDF file
    else if (cv.file_path && cv.mime_type) {
      console.log('🤖 [Gemini AI] Extracting CV info from file...');
      console.log('  - CV ID:', id);
      console.log('  - File path:', cv.file_path);
      console.log('  - MIME type:', cv.mime_type);
      
      // Extract from image/PDF file
      const result = await geminiService.extractCVInfo(cv.file_path, cv.mime_type);
      
      console.log('🤖 [Gemini AI] Extraction result:', result.success ? '✅ Success' : '❌ Failed');
      if (!result.success) {
        console.error('  - Error:', result.error);
      } else {
        console.log('  - Extracted data keys:', Object.keys(result.data || {}));
      }
      
      if (result.success) {
        return res.json({
          result: result.data,
          message: null
        });
      } else {
        return res.status(500).json({
          result: null,
          message: `Không thể trích xuất thông tin: ${result.error}`
        });
      }
    }
    
    return res.status(400).json({
      result: null,
      message: 'CV không có dữ liệu để trích xuất'
    });
  } catch (error) {
    console.error('Error extracting CV info:', error);
    res.status(500).json({ 
      result: null, 
      message: 'Lỗi khi trích xuất thông tin CV' 
    });
  }
};

// AI-powered: Generate professional CV summary
const generateCVSummary = async (req, res) => {
  try {
    const cvId = req.params.id;
    const userId = req.user.id;

    // Get CV data
    const cv = await CV.findById(cvId);
    if (!cv) {
      return res.status(404).json({
        success: false,
        message: 'CV not found'
      });
    }

    // Check ownership
    if (cv.user_id !== userId && req.user.role?.name !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if AI process is available
    const isAvailable = await aiProcessService.isProcessAvailable('CV_SUMMARY_GEN');
    if (!isAvailable) {
      return res.status(503).json({
        success: false,
        message: 'AI CV summary generator is not available'
      });
    }

    // Prepare CV data
    const cvData = JSON.stringify({
      title: cv.title,
      extracted_info: cv.extracted_info
    });

    // Execute AI process
    const result = await aiProcessService.executeProcess(
      'CV_SUMMARY_GEN',
      { cv_data: cvData }
    );

    if (result.success) {
      res.json({
        success: true,
        data: result.data
      });
    } else {
      res.status(500).json({
        success: false,
        message: result.error || 'Failed to generate CV summary'
      });
    }
  } catch (error) {
    console.error('Error generating CV summary:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// AI-powered: Get CV improvement suggestions
const getCVImprovementSuggestions = async (req, res) => {
  try {
    const cvId = req.params.id;
    const userId = req.user.id;

    // Get CV data
    const cv = await CV.findById(cvId);
    if (!cv) {
      return res.status(404).json({
        success: false,
        message: 'CV not found'
      });
    }

    // Check ownership
    if (cv.user_id !== userId && req.user.role?.name !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if AI process is available
    const isAvailable = await aiProcessService.isProcessAvailable('CV_IMPROVEMENT');
    if (!isAvailable) {
      return res.status(503).json({
        success: false,
        message: 'AI CV improvement analyzer is not available'
      });
    }

    // Prepare CV data
    const cvData = JSON.stringify({
      title: cv.title,
      extracted_info: cv.extracted_info
    });

    // Execute AI process
    const result = await aiProcessService.executeProcess(
      'CV_IMPROVEMENT',
      { cv_data: cvData }
    );

    if (result.success) {
      res.json({
        success: true,
        data: result.data
      });
    } else {
      res.status(500).json({
        success: false,
        message: result.error || 'Failed to analyze CV'
      });
    }
  } catch (error) {
    console.error('Error analyzing CV:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getAllCVs,
  getUserCVs,
  uploadCV,
  downloadCV,
  deleteCV,
  checkCVInApplications,
  extractCVInfo,
  generateCVSummary,
  getCVImprovementSuggestions
};
