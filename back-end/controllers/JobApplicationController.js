const JobApplication = require('../models/JobApplication');
const Notification = require('../models/Notification');
const db = require('../config/db');
const { sendApplicationConfirmationEmail, sendNewApplicationEmail, sendThresholdReachedEmail } = require('../config/nodemailer');
const aiProcessService = require('../utils/aiProcessService');

// Apply for a job
const applyForJob = async (req, res) => {
  try {
    const { job_id, cv_id, cover_letter } = req.body;
    const user_id = req.user.id;

    // Validate required fields
    if (!job_id) {
      return res.status(400).json({
        result: null,
        message: 'Job ID là bắt buộc'
      });
    }

    // Check if job exists and is still open
    const [jobResults] = await db.query(
      `SELECT j.id, j.title, j.date_end_register, j.status, j.created_by, j.is_closed,
              j.max_applicants, j.auto_close_on_threshold,
              u.name as recruiter_name, u.email as recruiter_email
       FROM jobs j
       LEFT JOIN users u ON j.created_by = u.id
       WHERE j.id = ? AND j.deleted_at IS NULL AND j.deleted = FALSE`,
      [job_id]
    );

    if (jobResults.length === 0) {
      return res.status(404).json({
        result: null,
        message: 'Công việc không tồn tại'
      });
    }

    const job = jobResults[0];

    // Check if job is closed
    if (job.is_closed) {
      return res.status(400).json({
        result: null,
        message: 'Công việc đã đóng, không thể ứng tuyển'
      });
    }

    // Check if job is approved
    if (job.status !== 'approved') {
      return res.status(400).json({
        result: null,
        message: 'Công việc chưa được phê duyệt'
      });
    }

    // Check if registration deadline has passed
    if (job.date_end_register) {
      const endDate = new Date(job.date_end_register);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (endDate < today) {
        return res.status(400).json({
          result: null,
          message: 'Hạn nộp hồ sơ đã kết thúc'
        });
      }
    }

    // Check if user has already applied
    const hasApplied = await JobApplication.hasApplied(job_id, user_id);
    if (hasApplied) {
      return res.status(400).json({
        result: null,
        message: 'Bạn đã ứng tuyển công việc này rồi'
      });
    }
    
    // Check if max applicants threshold has been reached
    if (job.max_applicants) {
      const [countResult] = await db.query(
        'SELECT COUNT(*) as count FROM job_applications WHERE job_id = ?',
        [job_id]
      );
      
      const currentApplicants = countResult[0].count;
      
      if (currentApplicants >= job.max_applicants) {
        return res.status(400).json({
          result: null,
          message: 'Công việc đã đạt số lượng ứng viên tối đa'
        });
      }
    }

    // If CV is provided, verify it belongs to the user
    if (cv_id) {
      const [cvResults] = await db.query(
        'SELECT id FROM cvs WHERE id = ? AND user_id = ? AND deleted_at IS NULL AND deleted = FALSE',
        [cv_id, user_id]
      );

      if (cvResults.length === 0) {
        return res.status(400).json({
          result: null,
          message: 'CV không tồn tại hoặc không thuộc về bạn'
        });
      }
    }

    // Create application
    const application = await JobApplication.create({
      job_id,
      user_id,
      cv_id: cv_id || null,
      cover_letter: cover_letter || null,
      status: 'pending'
    });

    // Send notification to recruiter (WebSocket is automatically sent by Notification.create)
    if (job.created_by) {
      await Notification.create({
        user_id: job.created_by,
        title: 'Ứng viên mới ứng tuyển',
        message: `${req.user.name} đã ứng tuyển vào công việc "${job.title}"`,
        type: 'application',
        link: `/nha-tuyen-dung/quan-ly-tin-tuyen-dung`
      });
      
      // Send email to recruiter (check email_notifications_enabled first)
      const [recruiterPrefs] = await db.query(
        'SELECT email_notifications_enabled FROM users WHERE id = ?',
        [job.created_by]
      );
      if (job.recruiter_email && recruiterPrefs[0]?.email_notifications_enabled) {
        await sendNewApplicationEmail(
          job.recruiter_email,
          job.recruiter_name,
          req.user.name,
          job.title
        );
      }
    }
    
    // Send confirmation email to user (check email_notifications_enabled first)
    if (req.user.email && req.user.email_notifications_enabled) {
      await sendApplicationConfirmationEmail(
        req.user.email,
        req.user.name,
        job.title
      );
    }
    
    // Check if threshold has been reached after this application
    if (job.max_applicants) {
      const [countResult] = await db.query(
        'SELECT COUNT(*) as count FROM job_applications WHERE job_id = ?',
        [job_id]
      );
      
      const currentApplicants = countResult[0].count;
      
      if (currentApplicants >= job.max_applicants) {
        // Threshold reached - always notify recruiter
        let notificationTitle = 'Đạt ngưỡng ứng viên';
        let notificationMessage = `Công việc "${job.title}" đã đạt ngưỡng ${job.max_applicants} ứng viên`;
        let notificationType = 'warning';
        
        // Auto-close if enabled
        if (job.auto_close_on_threshold) {
          await db.query(
            'UPDATE jobs SET is_closed = TRUE WHERE id = ?',
            [job_id]
          );
          
          notificationTitle = 'Công việc đã tự động đóng';
          notificationMessage = `Công việc "${job.title}" đã được tự động đóng sau khi đạt ${job.max_applicants} ứng viên`;
          notificationType = 'info';
        }
        
        // Send notification to recruiter (WebSocket is automatically sent by Notification.create)
        if (job.created_by) {
          await Notification.create({
            user_id: job.created_by,
            title: notificationTitle,
            message: notificationMessage,
            type: notificationType,
            link: `/nha-tuyen-dung/quan-ly-tin-tuyen-dung`
          });
        }
        
        // Send email notification to recruiter (check email_notifications_enabled first)
        const [recruiterPrefs] = await db.query(
          'SELECT email_notifications_enabled FROM users WHERE id = ?',
          [job.created_by]
        );
        if (job.recruiter_email && recruiterPrefs[0]?.email_notifications_enabled) {
          await sendThresholdReachedEmail(
            job.recruiter_email,
            job.recruiter_name,
            job.title,
            job.max_applicants,
            job.auto_close_on_threshold
          );
        }
      }
    }

    res.status(201).json({
      result: application,
      message: null
    });
  } catch (error) {
    console.error('Error applying for job:', error);
    res.status(500).json({
      result: null,
      message: 'Lỗi khi ứng tuyển công việc'
    });
  }
};

// Get user's applications
const getMyApplications = async (req, res) => {
  try {
    const user_id = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const data = await JobApplication.findByUserId(user_id, page, limit);

    res.json({
      result: data,
      message: null
    });
  } catch (error) {
    console.error('Error fetching user applications:', error);
    res.status(500).json({
      result: null,
      message: 'Lỗi khi tải danh sách ứng tuyển'
    });
  }
};

// Get applications for a job (recruiter/admin only)
const getJobApplications = async (req, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status || null;

    // Check if user has permission to view applications
    const userRole = req.user.role.name;
    if (userRole !== 'admin' && userRole !== 'recruiter') {
      return res.status(403).json({
        result: null,
        message: 'Bạn không có quyền xem danh sách ứng tuyển'
      });
    }

    // If recruiter, verify they own the job
    if (userRole === 'recruiter') {
      const [jobResults] = await db.query(
        'SELECT created_by FROM jobs WHERE id = ? AND deleted_at IS NULL AND deleted = FALSE',
        [id]
      );

      if (jobResults.length === 0 || jobResults[0].created_by !== req.user.id) {
        return res.status(403).json({
          result: null,
          message: 'Bạn không có quyền xem danh sách ứng tuyển của công việc này'
        });
      }
    }

    const data = await JobApplication.findByJobId(id, page, limit, status);

    res.json({
      result: data,
      message: null
    });
  } catch (error) {
    console.error('Error fetching job applications:', error);
    res.status(500).json({
      result: null,
      message: 'Lỗi khi tải danh sách ứng tuyển'
    });
  }
};

// Get application details
const getApplicationById = async (req, res) => {
  try {
    const { id } = req.params;
    const application = await JobApplication.findById(id);

    if (!application) {
      return res.status(404).json({
        result: null,
        message: 'Đơn ứng tuyển không tồn tại'
      });
    }

    // Check permissions
    const userRole = req.user.role.name;
    const userId = req.user.id;

    if (userRole === 'user' && application.user_id !== userId) {
      return res.status(403).json({
        result: null,
        message: 'Bạn không có quyền xem đơn ứng tuyển này'
      });
    }

    if (userRole === 'recruiter') {
      const [jobResults] = await db.query(
        'SELECT created_by FROM jobs WHERE id = ?',
        [application.job_id]
      );

      if (jobResults.length === 0 || jobResults[0].created_by !== userId) {
        return res.status(403).json({
          result: null,
          message: 'Bạn không có quyền xem đơn ứng tuyển này'
        });
      }
    }

    res.json({
      result: application,
      message: null
    });
  } catch (error) {
    console.error('Error fetching application:', error);
    res.status(500).json({
      result: null,
      message: 'Lỗi khi tải thông tin đơn ứng tuyển'
    });
  }
};

// Update application status (recruiter/admin only)
const updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const reviewedBy = req.user.id;

    // Validate status
    const validStatuses = ['pending', 'reviewing', 'shortlisted', 'rejected', 'accepted'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        result: null,
        message: 'Trạng thái không hợp lệ'
      });
    }

    // Check permissions
    const userRole = req.user.role.name;
    if (userRole !== 'admin' && userRole !== 'recruiter') {
      return res.status(403).json({
        result: null,
        message: 'Bạn không có quyền cập nhật trạng thái ứng tuyển'
      });
    }

    // Get application
    const application = await JobApplication.findById(id);
    if (!application) {
      return res.status(404).json({
        result: null,
        message: 'Đơn ứng tuyển không tồn tại'
      });
    }

    // If recruiter, verify they own the job
    if (userRole === 'recruiter') {
      const [jobResults] = await db.query(
        'SELECT created_by FROM jobs WHERE id = ?',
        [application.job_id]
      );

      if (jobResults.length === 0 || jobResults[0].created_by !== req.user.id) {
        return res.status(403).json({
          result: null,
          message: 'Bạn không có quyền cập nhật đơn ứng tuyển này'
        });
      }
    }

    const updatedApplication = await JobApplication.updateStatus(id, status, reviewedBy, notes);

    res.json({
      result: updatedApplication,
      message: null
    });
  } catch (error) {
    console.error('Error updating application status:', error);
    res.status(500).json({
      result: null,
      message: 'Lỗi khi cập nhật trạng thái'
    });
  }
};

// Withdraw application (user only)
const withdrawApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const application = await JobApplication.findById(id);
    if (!application) {
      return res.status(404).json({
        result: null,
        message: 'Đơn ứng tuyển không tồn tại'
      });
    }

    if (application.user_id !== userId) {
      return res.status(403).json({
        result: null,
        message: 'Bạn không có quyền rút đơn ứng tuyển này'
      });
    }

    // Can only withdraw if status is pending or reviewing
    if (!['pending', 'reviewing'].includes(application.status)) {
      return res.status(400).json({
        result: null,
        message: 'Không thể rút đơn ứng tuyển ở trạng thái hiện tại'
      });
    }

    // Get job details for notification
    const [jobRows] = await db.query(
      `SELECT j.title, j.created_by
       FROM jobs j
       WHERE j.id = ?`,
      [application.job_id]
    );
    
    const job = jobRows[0];

    await JobApplication.delete(id);

    // Notify HR/recruiter about withdrawal (WebSocket is automatically sent by Notification.create)
    if (job && job.created_by) {
      await Notification.create({
        user_id: job.created_by,
        title: 'Ứng viên đã rút đơn ứng tuyển',
        message: `${req.user.name} đã rút đơn ứng tuyển cho công việc "${job.title}"`,
        type: 'info',
        link: `/nha-tuyen-dung/quan-ly-tin-tuyen-dung/${application.job_id}/ung-vien`
      });
    }

    res.json({
      result: true,
      message: null
    });
  } catch (error) {
    console.error('Error withdrawing application:', error);
    res.status(500).json({
      result: null,
      message: 'Lỗi khi rút đơn ứng tuyển'
    });
  }
};

// Get job application statistics
const getJobApplicationStats = async (req, res) => {
  try {
    const { id } = req.params;

    // Check permissions
    const userRole = req.user.role.name;
    if (userRole !== 'admin' && userRole !== 'recruiter') {
      return res.status(403).json({
        result: null,
        message: 'Bạn không có quyền xem thống kê'
      });
    }

    // If recruiter, verify they own the job
    if (userRole === 'recruiter') {
      const [jobResults] = await db.query(
        'SELECT created_by FROM jobs WHERE id = ?',
        [id]
      );

      if (jobResults.length === 0 || jobResults[0].created_by !== req.user.id) {
        return res.status(403).json({
          result: null,
          message: 'Bạn không có quyền xem thống kê của công việc này'
        });
      }
    }

    const stats = await JobApplication.getJobStats(id);

    res.json({
      result: stats,
      message: null
    });
  } catch (error) {
    console.error('Error fetching application stats:', error);
    res.status(500).json({
      result: null,
      message: 'Lỗi khi tải thống kê'
    });
  }
};

// Update CV for application (user only, before job is closed)
const updateApplicationCV = async (req, res) => {
  try {
    const { id } = req.params;
    const { cv_id } = req.body;
    const userId = req.user.id;

    if (!cv_id) {
      return res.status(400).json({
        result: null,
        message: 'CV ID là bắt buộc'
      });
    }

    // Get application with job info
    const application = await JobApplication.findById(id);
    if (!application) {
      return res.status(404).json({
        result: null,
        message: 'Đơn ứng tuyển không tồn tại'
      });
    }

    // Check if user owns this application
    if (application.user_id !== userId) {
      return res.status(403).json({
        result: null,
        message: 'Bạn không có quyền cập nhật đơn ứng tuyển này'
      });
    }

    // Check if job is closed
    const [jobResults] = await db.query(
      'SELECT is_closed FROM jobs WHERE id = ?',
      [application.job_id]
    );

    if (jobResults.length === 0) {
      return res.status(404).json({
        result: null,
        message: 'Công việc không tồn tại'
      });
    }

    if (jobResults[0].is_closed) {
      return res.status(400).json({
        result: null,
        message: 'Không thể cập nhật CV khi công việc đã đóng'
      });
    }

    // Verify CV belongs to user
    const [cvResults] = await db.query(
      'SELECT id FROM cvs WHERE id = ? AND user_id = ? AND deleted_at IS NULL AND deleted = FALSE',
      [cv_id, userId]
    );

    if (cvResults.length === 0) {
      return res.status(400).json({
        result: null,
        message: 'CV không tồn tại hoặc không thuộc về bạn'
      });
    }

    // Update CV
    const updatedApplication = await JobApplication.updateCV(id, cv_id);

    res.json({
      result: updatedApplication,
      message: null
    });
  } catch (error) {
    console.error('Error updating application CV:', error);
    res.status(500).json({
      result: null,
      message: 'Lỗi khi cập nhật CV'
    });
  }
};

// Check if user has applied for a job
const checkApplicationStatus = async (req, res) => {
  try {
    const { jobId } = req.params;
    const user_id = req.user.id;

    const [results] = await db.query(
      `SELECT id, status, applied_at, cv_id, cover_letter
       FROM job_applications
       WHERE job_id = ? AND user_id = ?`,
      [jobId, user_id]
    );

    if (results.length === 0) {
      return res.json({
        result: { hasApplied: false, application: null },
        message: null
      });
    }

    res.json({
      result: { 
        hasApplied: true, 
        application: results[0]
      },
      message: null
    });
  } catch (error) {
    console.error('Error checking application status:', error);
    res.status(500).json({
      result: null,
      message: 'Lỗi khi kiểm tra trạng thái ứng tuyển'
    });
  }
};

// AI-powered: Analyze job-CV match for an application
const analyzeApplicationMatch = async (req, res) => {
  try {
    const applicationId = req.params.id;
    const userId = req.user.id;

    // Get application with job and CV data
    const [applications] = await db.query(
      `SELECT 
        ja.*,
        j.title as job_title, j.requirement, j.benefits, j.years_experienced, j.location,
        i.name as industry_name,
        c.extracted_info as cv_data
       FROM job_applications ja
       JOIN jobs j ON ja.job_id = j.id
       LEFT JOIN industries i ON j.industry_id = i.id
       LEFT JOIN cvs c ON ja.cv_id = c.id
       WHERE ja.id = ? AND ja.deleted_at IS NULL`,
      [applicationId]
    );

    if (applications.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    const application = applications[0];

    // Check permission
    if (application.user_id !== userId && req.user.role?.name !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if AI process is available
    const isAvailable = await aiProcessService.isProcessAvailable('JOB_CV_SCORE');
    if (!isAvailable) {
      return res.status(503).json({
        success: false,
        message: 'AI matching analyzer is not available'
      });
    }

    // Execute AI process
    const result = await aiProcessService.executeProcess(
      'JOB_CV_SCORE',
      {
        job_title: application.job_title,
        job_requirements: application.requirement || '',
        job_benefits: application.benefits || '',
        years_experienced: application.years_experienced?.toString() || '0',
        industry: application.industry_name || '',
        location: application.location || '',
        cv_data: JSON.stringify(application.cv_data || {})
      }
    );

    if (result.success) {
      res.json({
        success: true,
        data: result.data
      });
    } else {
      res.status(500).json({
        success: false,
        message: result.error || 'Failed to analyze match'
      });
    }
  } catch (error) {
    console.error('Error analyzing application match:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// AI-powered: Rank all applications for a job
const rankJobApplications = async (req, res) => {
  try {
    const jobId = req.params.jobId;

    // Check if user has permission (admin or job owner)
    const [jobs] = await db.query(
      'SELECT created_by FROM jobs WHERE id = ? AND deleted_at IS NULL',
      [jobId]
    );

    if (jobs.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    const isAdmin = req.user.role?.name === 'admin';
    const isJobOwner = jobs[0].created_by === req.user.id;

    if (!isAdmin && !isJobOwner) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Get job details
    const [jobDetails] = await db.query(
      `SELECT j.*, i.name as industry_name, c.name as company_name
       FROM jobs j
       LEFT JOIN industries i ON j.industry_id = i.id
       LEFT JOIN companies c ON j.company_id = c.id
       WHERE j.id = ?`,
      [jobId]
    );

    // Get all applications with CV data
    const [applications] = await db.query(
      `SELECT 
        ja.id, ja.user_id, ja.status, ja.created_at,
        u.name as candidate_name, u.email as candidate_email,
        c.extracted_info as cv_data
       FROM job_applications ja
       JOIN users u ON ja.user_id = u.id
       LEFT JOIN cvs c ON ja.cv_id = c.id
       WHERE ja.job_id = ? AND ja.deleted_at IS NULL
       ORDER BY ja.created_at DESC`,
      [jobId]
    );

    if (applications.length === 0) {
      return res.json({
        success: true,
        data: {
          ranked_applications: [],
          summary: {
            total_applications: 0,
            strong_candidates: 0,
            potential_candidates: 0,
            not_recommended: 0
          }
        }
      });
    }

    // Check if AI process is available
    const isAvailable = await aiProcessService.isProcessAvailable('APP_RANKING');
    if (!isAvailable) {
      return res.status(503).json({
        success: false,
        message: 'AI application ranking is not available'
      });
    }

    // Prepare data for AI
    const jobInfo = JSON.stringify({
      title: jobDetails[0].title,
      requirement: jobDetails[0].requirement,
      benefits: jobDetails[0].benefits,
      years_experienced: jobDetails[0].years_experienced,
      industry: jobDetails[0].industry_name,
      location: jobDetails[0].location,
      company: jobDetails[0].company_name
    });

    const applicationsData = JSON.stringify(
      applications.map(app => ({
        application_id: app.id,
        candidate_name: app.candidate_name,
        cv_data: app.cv_data,
        applied_at: app.created_at
      }))
    );

    // Execute AI process
    const result = await aiProcessService.executeProcess(
      'APP_RANKING',
      {
        job_info: jobInfo,
        applications_data: applicationsData
      }
    );

    if (result.success) {
      res.json({
        success: true,
        data: result.data
      });
    } else {
      res.status(500).json({
        success: false,
        message: result.error || 'Failed to rank applications'
      });
    }
  } catch (error) {
    console.error('Error ranking applications:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  applyForJob,
  getMyApplications,
  getJobApplications,
  getApplicationById,
  updateApplicationStatus,
  withdrawApplication,
  getJobApplicationStats,
  updateApplicationCV,
  checkApplicationStatus,
  analyzeApplicationMatch,
  rankJobApplications
};
