const db = require('../config/db');
const JobReport = require('../models/JobReport');
const Job = require('../models/Job');
const User = require('../models/User');
const JobReview = require('../models/JobReview');
const Setting = require('../models/Setting');
const Notification = require('../models/Notification');

const submitForReview = async (req, res) => {
    try {
      const { jobId } = req.params;
      const userId = req.user.id;

      // Find the job using Job model
      const job = await Job.findById(jobId);
      
      // Check if job exists and belongs to the user
      if (!job || job.created_by !== userId) {
        return res.status(404).json({
          result: null,
          message: 'Job not found or you do not have permission to submit it for review'
        });
      }

      // Get current version status if exists
      let currentVersionStatus = null;
      if (job.current_version_id) {
        const JobVersion = require('../models/JobVersion');
        const [versionRows] = await db.query(
          'SELECT status FROM job_versions WHERE id = ?',
          [job.current_version_id]
        );
        if (versionRows && versionRows.length > 0) {
          currentVersionStatus = versionRows[0].status;
        }
      }

      // Check if current version is already submitted or approved
      // Use version status if available, otherwise fall back to job status
      const statusToCheck = currentVersionStatus || job.status;
      if (statusToCheck === 'pending_review' || statusToCheck === 'approved') {
        return res.status(400).json({
          result: null,
          message: `Job is already ${statusToCheck === 'pending_review' ? 'under review' : 'approved'}`
        });
      }

      // Update job status to pending_review using Job model
      const updated = await Job.update(jobId, { status: 'pending_review' });
      
      if (!updated) {
        return res.status(500).json({
          result: null,
          message: 'Failed to update job status'
        });
      }
      
      // Also update the current version's status to pending_review
      if (job.current_version_id) {
        const JobVersion = require('../models/JobVersion');
        await JobVersion.update(job.current_version_id, { status: 'pending_review' });
      }
      
      // Fetch the updated job with version status
      const [jobRows] = await db.query(
        `SELECT j.*, jv.status as version_status 
         FROM jobs j 
         LEFT JOIN job_versions jv ON j.current_version_id = jv.id 
         WHERE j.id = ?`,
        [jobId]
      );
      const updatedJob = jobRows[0];

      // Create notification for all admins
      await Notification.createForAdmins({
        title: 'Công việc mới cần duyệt',
        message: `Công việc "${job.title}" đã được gửi để duyệt.`,
        type: 'review_request',
        link: `/admin/quan-ly-cong-viec`
      });

      return res.status(200).json({
        result: updatedJob,
        message: null
      });
    } catch (error) {
      console.error('Error submitting job for review:', error);
      return res.status(500).json({
        result: null,
        message: 'Internal server error'
      });
    }
}

const getPendingReviews = async (req, res) => {
    try {
      // Only admin and reviewers can access this endpoint
      if (req.user.role?.name !== 'admin') {
        return res.status(403).json({
          result: null,
          message: 'Unauthorized access'
        });
      }

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;
      
      // Get jobs pending review using the Job model
      const { jobs, total } = await Job.findPendingReviews(limit, offset);
      const totalPages = Math.ceil(total / limit);

      return res.status(200).json({
        result: {
          jobs,
          pagination: {
            page,
            limit,
            total,
            totalPages
          }
        },
        message: null
      });
    } catch (error) {
      console.error('Error getting pending reviews:', error);
      return res.status(500).json({
        result: null,
        message: 'Internal server error'
      });
    }
}

// Get all jobs by review status (admin only)
const getJobsByStatus = async (req, res) => {
    try {
      // Only admin can access this endpoint
      if (req.user.role?.name !== 'admin') {
        return res.status(403).json({
          result: null,
          message: 'Unauthorized access'
        });
      }

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;
      const status = req.query.status || 'pending_review'; // pending_review, approved, rejected, all
      
      let query;
      let countQuery;
      
      if (status === 'all') {
        query = `
          SELECT j.*, 
                 c.name as company_name,
                 i.name as industry_name,
                 u.name as creator_name
          FROM jobs j
          LEFT JOIN companies c ON j.company_id = c.id
          LEFT JOIN industries i ON j.industry_id = i.id
          LEFT JOIN users u ON j.created_by = u.id
          WHERE j.deleted = 0 AND j.status IN ('pending_review', 'approved', 'rejected')
          ORDER BY j.created_at DESC
          LIMIT ? OFFSET ?
        `;
        countQuery = `
          SELECT COUNT(*) as total 
          FROM jobs 
          WHERE deleted = 0 AND status IN ('pending_review', 'approved', 'rejected')
        `;
      } else {
        query = `
          SELECT j.*, 
                 c.name as company_name,
                 i.name as industry_name,
                 u.name as creator_name
          FROM jobs j
          LEFT JOIN companies c ON j.company_id = c.id
          LEFT JOIN industries i ON j.industry_id = i.id
          LEFT JOIN users u ON j.created_by = u.id
          WHERE j.deleted = 0 AND j.status = ?
          ORDER BY j.created_at DESC
          LIMIT ? OFFSET ?
        `;
        countQuery = `
          SELECT COUNT(*) as total 
          FROM jobs 
          WHERE deleted = 0 AND status = ?
        `;
      }
      
      const [jobs] = status === 'all' 
        ? await db.query(query, [limit, offset])
        : await db.query(query, [status, limit, offset]);
        
      const [countResult] = status === 'all'
        ? await db.query(countQuery)
        : await db.query(countQuery, [status]);
        
      const total = countResult[0].total;
      const totalPages = Math.ceil(total / limit);

      return res.status(200).json({
        result: {
          jobs,
          pagination: {
            page,
            limit,
            total,
            totalPages
          }
        },
        message: null
      });
    } catch (error) {
      console.error('Error getting jobs by status:', error);
      return res.status(500).json({
        result: null,
        message: 'Internal server error'
      });
    }
}

const reviewJob = async (req, res) => {
    try {
      const { jobId } = req.params;
      const { status, feedback } = req.body;
      const reviewerId = req.user.id;

      // Validate input
      if (!status || !['approved', 'rejected'].includes(status)) {
        return res.status(400).json({
          result: null,
          message: 'Invalid status. Must be "approved" or "rejected"'
        });
      }

      if (status === 'rejected' && !feedback) {
        return res.status(400).json({
          result: null,
          message: 'Feedback is required when rejecting a job'
        });
      }

      // Only admin and reviewers can review jobs
      if (req.user.role?.name !== 'admin') {
        return res.status(403).json({
          result: null,
          message: 'Unauthorized access'
        });
      }

      // Check if job exists and is pending review
      const job = await Job.findById(jobId);

      if (!job || job.status !== 'pending_review') {
        return res.status(404).json({
          result: null,
          message: 'Job not found or not pending review'
        });
      }

      try {
        // Process the review using JobReview model
        const review = await JobReview.processReview(jobId, reviewerId, status, feedback);
        // Get the updated job
        const updatedJob = await Job.findById(jobId);
        
        // Get the job owner's information
        const jobOwner = await User.findById(job.created_by);
        
        if (jobOwner) {
          // Create notification for the job owner
          const notificationTitle = status === 'approved' 
            ? 'Công việc đã được duyệt' 
            : 'Công việc bị từ chối';
          
          const notificationMessage = status === 'approved'
            ? `Công việc "${job.title}" của bạn đã được duyệt và đăng công khai.`
            : `Công việc "${job.title}" của bạn đã bị từ chối. Lý do: ${feedback}`;
          
          await Notification.create({
            user_id: job.created_by,
            title: notificationTitle,
            message: notificationMessage,
            type: status === 'approved' ? 'job_approved' : 'job_rejected',
            link: `/recruiter/jobs/${jobId}`
          });
        } 
        
        // Return both the review and updated job
        return res.status(200).json({
          result: {
            review,
            job: updatedJob
          },
          message: null
        });
      } catch (error) {
        console.error('Transaction error:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error reviewing job:', error);
      return res.status(500).json({
        result: null,
        message: 'Internal server error'
      });
    }
}

const getJobReviewHistory = async (req, res) => {
    try {
      const { jobId } = req.params;
      const userId = req.user.id;

      // Check if job exists using Job model
      const job = await Job.findById(jobId);

      if (!job) {
        return res.status(404).json({
          result: null,
          message: 'Job not found'
        });
      }

      // Check permissions: must be the job creator, an admin, or a reviewer
      if (job.created_by !== userId && req.user.role?.name !== 'admin') {
        return res.status(403).json({
          result: null,
          message: 'Unauthorized access'
        });
      }

      // Get review history using JobReview model
      const reviews = await JobReview.findByJobId(jobId);

      return res.status(200).json({
        result: reviews,
        message: null
      });
    } catch (error) {
      console.error('Error getting job review history:', error);
      return res.status(500).json({
        result: null,
        message: 'Internal server error'
      });
    }
}

const getReviewStatistics = async (req, res) => {
    try {
      // Only admin can access this endpoint
      if (req.user.role?.name !== 'admin') {
        return res.status(403).json({
          result: null,
          message: 'Unauthorized access'
        });
      }

      // Get counts for different statuses
      const [stats] = await db.query(
        `SELECT 
          SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft_count,
          SUM(CASE WHEN status = 'pending_review' THEN 1 ELSE 0 END) as pending_count,
          SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_count,
          SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_count
         FROM jobs
         WHERE deleted = 0`
      );

      return res.status(200).json({
        result: stats[0],
        message: null
      });
    } catch (error) {
      console.error('Error getting review statistics:', error);
      return res.status(500).json({
        result: null,
        message: 'Internal server error'
      });
    }
}

/**
 * Report a job (authenticated user)
 * 
 * Users can report a job multiple times up to a configurable daily limit (default: 3)
 * The limit is controlled by the MAX_JOB_REPORTS_PER_USER setting in the REPORT group
 * The limit resets each day
 */
const reportJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { report_type, description } = req.body;
    const userId = req.user.id;
    
    // Validate required fields
    if (!report_type || !['misleading', 'inappropriate', 'scam', 'duplicate', 'expired', 'other'].includes(report_type)) {
      return res.status(400).json({
        result: null, 
        message: 'Loại báo cáo không hợp lệ. Phải là một trong các giá trị: misleading, inappropriate, scam, duplicate, expired, other'
      });
    }
    
    // Check if job exists using Job model
    const job = await Job.findById(jobId);
    
    if (!job) {
      return res.status(404).json({
        result: null,
        message: 'Không tìm thấy công việc'
      });
    }
    
    // Get the maximum number of reports allowed per user per day from settings
    const maxReportsSetting = await Setting.getByKeyAndGroup('MAX_JOB_REPORTS_PER_USER', 'REPORT');
    const maxReports = maxReportsSetting ? parseInt(maxReportsSetting.setting_value) : 3; // Default to 3 if setting not found
    
    // Count how many times this user has already reported this job today
    const reportCount = await JobReport.countByUserAndJobToday(userId, jobId);
    
    if (reportCount >= maxReports) {
      return res.status(400).json({
        result: null,
        message: `Bạn đã báo cáo công việc này ${maxReports} lần trong hôm nay, vui lòng thử lại vào ngày mai`
      });
    }
    
    // Get user information using User model
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        result: null,
        message: 'Không tìm thấy thông tin người dùng'
      });
    }
    
    // Create report
    const reportData = {
      job_id: jobId,
      user_id: userId,
      name: user.name,
      email: user.email,
      report_type,
      description: description || '',
      status: 'pending'
    };
    
    const createdReport = await JobReport.create(reportData);
    
    // Create notification for all admins
    await Notification.createForAdmins({
      title: 'Báo cáo công việc mới',
      message: `Công việc "${job.title}" đã bị báo cáo với lý do: ${report_type}`,
      type: 'job_report',
      link: `/admin/quan-ly-cong-viec`
    });
    
    return res.status(201).json({
      result: createdReport,
      message: null
    });
  } catch (error) {
    console.error('Error reporting job:', error);
    return res.status(500).json({
      result: null,
      message: 'Lỗi hệ thống khi báo cáo công việc'
    });
  }
};

/**
 * Report a job (public - no authentication required)
 * 
 * Public users can report a job multiple times up to a configurable daily limit (default: 3)
 * The limit is controlled by the MAX_JOB_REPORTS_PER_USER setting in the REPORT group
 * The limit resets each day
 */
const reportJobPublic = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { report_type, description, name, email, phone } = req.body;
    
    // Validate required fields
    if (!report_type || !['misleading', 'inappropriate', 'scam', 'duplicate', 'expired', 'other'].includes(report_type)) {
      return res.status(400).json({
        result: null, 
        message: 'Loại báo cáo không hợp lệ. Phải là một trong các giá trị: misleading, inappropriate, scam, duplicate, expired, other'
      });
    }
    
    if (!name || !email) {
      return res.status(400).json({
        result: null,
        message: 'Tên và email là bắt buộc'
      });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        result: null,
        message: 'Định dạng email không hợp lệ'
      });
    }
    
    // Check if job exists using Job model
    const job = await Job.findById(jobId);
    
    if (!job) {
      return res.status(404).json({
        result: null,
        message: 'Không tìm thấy công việc'
      });
    }
    
    // Get the maximum number of reports allowed per email per day from settings
    const maxReportsSetting = await Setting.getByKeyAndGroup('MAX_JOB_REPORTS_PER_USER', 'REPORT');
    const maxReports = maxReportsSetting ? parseInt(maxReportsSetting.setting_value) : 3; // Default to 3 if setting not found
    
    // Count how many times this email has already reported this job today
    const reportCount = await JobReport.countByEmailAndJobToday(email, jobId);
    
    if (reportCount >= maxReports) {
      return res.status(400).json({
        result: null,
        message: `Email này đã được sử dụng để báo cáo công việc này ${maxReports} lần trong hôm nay, vui lòng thử lại vào ngày mai`
      });
    }
    
    // Create report
    const reportData = {
      job_id: jobId,
      user_id: null, // No user account
      name,
      email,
      phone: phone || null,
      report_type,
      description: description || '',
      status: 'pending'
    };
  
    const createdReport = await JobReport.create(reportData);
    
    // Create notification for all admins
    await Notification.createForAdmins({
      title: 'Báo cáo công việc mới',
      message: `Công việc "${job.title}" đã bị báo cáo bởi người dùng không đăng nhập với lý do: ${report_type}`,
      type: 'job_report',
      link: `/admin/quan-ly-cong-viec`
    });
    
    return res.status(201).json({
      result: createdReport,
      message: null
    });
  } catch (error) {
    console.error('Error reporting job (public):', error);
    return res.status(500).json({
      result: null,
      message: 'Lỗi hệ thống khi báo cáo công việc'
    });
  }
};

// Get all job reports (admin only)
const getAllJobReports = async (req, res) => {
  try {
    // Only admin can access this endpoint
    if (req.user.role_name !== 'admin') {
      return res.status(403).json({
        result: null,
        message: 'Không có quyền truy cập'
      });
    }
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status || '';
    const report_type = req.query.report_type || '';
    const offset = (page - 1) * limit;
    
    // Build filters object
    const filters = {};
    if (status) filters.status = status;
    if (report_type) filters.report_type = report_type;
    
    // Get reports using the model
    const reports = await JobReport.findWithPagination(filters, limit, offset);
    
    // Get total count for pagination
    const total = await JobReport.count(filters);
    const totalPages = Math.ceil(total / limit);
    
    return res.status(200).json({
      result: {
        reports,
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      },
      message: null
    });
  } catch (error) {
    console.error('Error getting job reports:', error);
    return res.status(500).json({
      result: null,
      message: 'Lỗi hệ thống khi lấy danh sách báo cáo'
    });
  }
};

// Update job report status (admin only)
const updateReportStatus = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { status, admin_notes } = req.body;
    
    // Only admin can access this endpoint
    if (req.user.role_name !== 'admin') {
      return res.status(403).json({
        result: null,
        message: 'Không có quyền truy cập'
      });
    }
    
    // Validate status
    if (!status || !['pending', 'reviewed', 'resolved', 'dismissed'].includes(status)) {
      return res.status(400).json({
        result: null,
        message: 'Trạng thái không hợp lệ. Phải là một trong các giá trị: pending, reviewed, resolved, dismissed'
      });
    }
    
    // Check if report exists
    const report = await JobReport.findById(reportId);
    
    if (!report) {
      return res.status(404).json({
        result: null,
        message: 'Không tìm thấy báo cáo'
      });
    }
    
    // Update report status
    const reportData = {
      status,
      admin_notes: admin_notes || null,
      updated_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
    };
    
    await JobReport.update(reportId, reportData);
    
    // Fetch the updated report
    const updatedReport = await JobReport.findById(reportId);
    
    // If the report was submitted by a registered user, notify them about the status change
    if (updatedReport.user_id) {
      const job = await Job.findById(updatedReport.job_id);
      const statusText = {
        'reviewed': 'đang xem xét',
        'resolved': 'đã giải quyết',
        'dismissed': 'đã bỏ qua'
      };
      
      await Notification.create({
        user_id: updatedReport.user_id,
        title: 'Cập nhật báo cáo công việc',
        message: `Báo cáo của bạn về công việc "${job ? job.title : 'Đã xóa'}" đã được ${statusText[status] || 'cập nhật'}.`,
        type: 'report_update',
        link: `/jobs/${updatedReport.job_id}`
      });
    }
    
    return res.status(200).json({
      result: updatedReport,
      message: null
    });
  } catch (error) {
    console.error('Error updating report status:', error);
    return res.status(500).json({
      result: null,
      message: 'Lỗi hệ thống khi cập nhật trạng thái báo cáo'
    });
  }
};

/**
 * Cancel a job review submission
 * 
 * This allows a recruiter to cancel their own job review submission
 * Only jobs in 'pending_review' status can be canceled
 */
const cancelSubmitForReview = async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user.id;

    // Find the job using Job model
    const job = await Job.findById(jobId);
    
    // Check if job exists and belongs to the user
    if (!job || job.created_by !== userId) {
      return res.status(404).json({
        result: null,
        message: 'Job not found or you do not have permission to cancel its review'
      });
    }

    // Check if job is in pending_review status
    if (job.status !== 'pending_review') {
      return res.status(400).json({
        result: null,
        message: 'Only jobs in pending review status can be canceled'
      });
    }

    // Update job status back to draft using Job model
    const updated = await Job.update(jobId, { status: 'draft' });
    
    if (!updated) {
      return res.status(500).json({
        result: null,
        message: 'Failed to update job status'
      });
    }
    
    // Also update the current version's status back to draft
    if (job.current_version_id) {
      const JobVersion = require('../models/JobVersion');
      await JobVersion.update(job.current_version_id, { status: 'draft' });
    }
    
    // Fetch the updated job with version status
    const [jobRows] = await db.query(
      `SELECT j.*, jv.status as version_status 
       FROM jobs j 
       LEFT JOIN job_versions jv ON j.current_version_id = jv.id 
       WHERE j.id = ?`,
      [jobId]
    );
    const updatedJob = jobRows[0];

    // Create notification for all admins about the cancellation
    await Notification.createForAdmins({
      title: 'Yêu cầu duyệt công việc đã bị hủy',
      message: `Yêu cầu duyệt công việc "${job.title}" đã bị hủy bởi người tạo.`,
      type: 'review_canceled',
      link: `/admin/quan-ly-cong-viec`
    });

    return res.status(200).json({
      result: updatedJob,
      message: null
    });
  } catch (error) {
    console.error('Error canceling job review submission:', error);
    return res.status(500).json({
      result: null,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  submitForReview,
  cancelSubmitForReview,
  getPendingReviews,
  getJobsByStatus,
  reviewJob,
  getJobReviewHistory,
  getReviewStatistics,
  reportJob,
  reportJobPublic,
  getAllJobReports,
  updateReportStatus
};
