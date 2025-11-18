const Job = require('../models/Job');
const Company = require('../models/Company');
const Notification = require('../models/Notification');
const db = require('../config/db');
const { sendJobClosedEmail } = require('../config/nodemailer');

// Create a new job with versioning support
const createJob = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    
    const { title, brief_description, requirement, benefits, salary, date_end_register, years_experienced, work_hours, company_id, industry_id, location, status } = req.body;
    
    // Check if company exists and user has permission
    const company = await Company.findById(company_id);
    if (!company) {
      return res.status(404).json({ result: null, message: 'Không tìm thấy công ty' });
    }

    // Check if user is authorized to create jobs for this company
    const isAdmin = req.user.role?.name === 'admin';
    const isCompanyOwner = company.created_by === req.user.id;
    if (!isAdmin && !isCompanyOwner) {
      return res.status(403).json({ result: null, message: 'Bạn không được phép tạo công việc cho công ty này' });
    }
    
    // Create job record
    const [jobResult] = await connection.query(
      `INSERT INTO jobs (title, brief_description, requirement, benefits, salary, 
                        date_end_register, years_experienced, work_hours, company_id, 
                        industry_id, location, status, created_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, brief_description, requirement, benefits || '', salary || '', date_end_register || null, 
       years_experienced || 0, work_hours || '', company_id, industry_id, location || '', status || 'draft', req.user.id]
    );
    
    const jobId = jobResult.insertId;
    
    // Create initial version
    const [versionResult] = await connection.query(
      `INSERT INTO job_versions (job_id, version_number, title, brief_description, 
                               requirement, benefits, salary, date_end_register, 
                               years_experienced, work_hours, company_id, industry_id, 
                               location, status, is_live, created_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [jobId, 1, title, brief_description, requirement, benefits || '', salary || '', 
       date_end_register || null, years_experienced || 0, work_hours || '', company_id, 
       industry_id, location || '', status || 'draft', false, req.user.id]
    );
    
    const versionId = versionResult.insertId;
    
    // Update job with current version ID
    await connection.query(
      'UPDATE jobs SET current_version_id = ? WHERE id = ?',
      [versionId, jobId]
    );
    
    // If status is pending_review, create a review request
    if ((status || 'draft') === 'pending_review') {
      await connection.query(
        `INSERT INTO job_reviews (job_id, job_version_id, reviewer_id, status)
         SELECT ?, ?, id, 'pending' FROM users WHERE role_id = 1 LIMIT 1`,
        [jobId, versionId]
      );
    }
    
    await connection.commit();
    
    // Get the complete job with version info
    const [jobRows] = await connection.query(
      `SELECT j.*, jv.version_number, jv.status as version_status 
       FROM jobs j 
       JOIN job_versions jv ON j.current_version_id = jv.id 
       WHERE j.id = ?`,
      [jobId]
    );

    // Send notification to admins if job is pending review
    if ((status || 'draft') === 'pending_review') {
      await Notification.createForAdmins({
        title: 'Tin tuyển dụng mới cần duyệt',
        message: `Tin tuyển dụng "${title}" đang chờ phê duyệt`,
        type: 'review',
        link: `/admin/quan-ly-cong-viec`
      });
    }

    res.status(201).json({
      result: jobRows[0],
      message: null
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating job:', error);
    res.status(500).json({ result: null, message: 'Tạo công việc thất bại' });
  } finally {
    connection.release();
  }
};

// Get all jobs with pagination and filtering - returns jobs based on user role
const getAllJobs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const company_id = req.query.company || '';
    const location = req.query.location || '';
    const industry_id = req.query.industry || '';
    const status = req.query.status || '';
    const offset = (page - 1) * limit;
    
    const filters = {};
    if (search) {
      filters.search = search;
    }
    if (company_id) {
      filters.company = company_id;
    }
    if (location) {
      filters.location = location;
    }
    if (industry_id) {
      filters.industry = industry_id;
    }
    
    // Use query parameters for role-based filtering
    const role = req.query.role || 'guest';
    const user_id = req.query.user_id;

    // Apply different filters based on the role parameter
    if (role === 'admin') {
      // Admin can see all jobs (no additional filters)
      // If admin specifies a status filter, respect it
      if (status) {
        filters.status = status;
      }
      // If admin specifies a user_id filter, respect it
      if (user_id) {
        filters.user_id = user_id;
      }
    } 
    else if (role === 'recruiter' && user_id) {
      // Recruiters can only see their own jobs
      filters.user_id = user_id;
      // If recruiter specifies a status filter, respect it
      if (status) {
        filters.status = status;
      }
    }
    else {
      // Regular users and guests can only see approved jobs
      filters.status = 'approved';
    }

    const jobs = await Job.findWithPagination(filters, limit, offset);
    const total = await Job.count(filters);
    
    res.status(200).json({
      result: {
        jobs: jobs,
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
    console.error('Error fetching jobs:', error);
    res.status(500).json({ result: null, message: 'Lấy danh sách công việc thất bại' });
  }
};

// Get a specific job by ID - returns the job with access control based on user role
const getJobById = async (req, res) => {
  try {
    const jobId = req.params.id;
    // Get job with its current version details
    const [rows] = await db.query(
      `SELECT j.*, 
              jv.version_number, jv.title, jv.brief_description, jv.requirement, 
              jv.benefits, jv.salary, jv.date_end_register, jv.years_experienced, 
              jv.work_hours, jv.location, jv.status as version_status, jv.is_live,
              c.name as company_name, c.logo_id,
              i.name as industry_name
       FROM jobs j
       LEFT JOIN companies c ON j.company_id = c.id
       LEFT JOIN industries i ON j.industry_id = i.id
       LEFT JOIN job_versions jv ON j.current_version_id = jv.id
       WHERE j.id = ? AND j.deleted_at IS NULL AND j.deleted = FALSE`,
      [jobId]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({
        result: null, message: 'Không tìm thấy công việc'
      });
    }
    
    const job = rows[0];
    
    // Use query parameters for role-based access control
    const role = req.query.role || 'guest';
    const user_id = req.query.user_id;
    
    // 1. If the job is approved, anyone can see it
    if (job.version_status === 'approved') {
      // No restrictions needed - approved jobs are public
    }
    // 2. If the job is not approved, check permissions
    else {
      // Admin can see any job
      if (role === 'admin') {
        // Admin has full access - no restrictions
      }
      // Recruiters can only see their own jobs
      else if (role === 'recruiter' && user_id && parseInt(user_id) === job.created_by) {
        // Creator has access to their own job - no restrictions
      }
      // Other users cannot see unapproved jobs
      else {
        return res.status(403).json({
          result: null, message: 'Bạn không có quyền xem công việc này'
        });
      }
    }
    
    // Get likes count
    const [likesResult] = await db.query(
      'SELECT COUNT(*) as likes FROM job_likes WHERE job_id = ?',
      [jobId]
    );
    
    job.likes = likesResult[0].likes;
    
    res.json({
      result: job, 
      message: 'Lấy thông tin công việc thành công'
    });
  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json({ result: null, message: 'Lỗi máy chủ nội bộ' });
  }
};

// Update a job - now creates a new version instead of updating directly
const updateJob = async (req, res) => {
  // This function is now deprecated in favor of creating new versions
  // Redirect to the JobVersionController for creating a new version
  return res.status(301).json({
    result: null, 
    message: 'Để cập nhật công việc, vui lòng tạo phiên bản mới bằng cách gọi API /jobs/:id/versions'
  });
};

// Delete job with soft delete
const deleteJob = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if job exists
    const existingJob = await Job.findById(id);
    if (!existingJob) {
      return res.status(404).json({
        result: null, message: 'Không tìm thấy công việc'
      });
    }
    
    // Check if user is authorized to delete this job
    if (existingJob.created_by !== req.user.id && req.user.role?.name !== 'admin') {
      return res.status(403).json({
        result: null, message: 'Bạn không được phép xóa công việc này'
      });
    }
    
    // Soft delete the job - related data will be handled by application logic
    // when querying (filter out jobs where deleted = true)
    const deleted = await Job.delete(id);
    
    if (!deleted) {
      return res.status(500).json({
        result: null, message: 'Xóa công việc thất bại'
      });
    }
    
    res.status(200).json({
      result: { id: parseInt(id) }, message: null
    });
  } catch (error) {
    console.error('Error deleting job:', error);
    res.status(500).json({ result: null, message: 'Xóa công việc thất bại' });
  }
};

// Get jobs by user
const getUserJobs = async (req, res) => {
  try {
    const userId = req.user.id;
    const status = req.query.status || '';
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    const filters = {
      user_id: userId
    };
    
    if (status) {
      filters.status = status;
    }
    
    const jobs = await Job.findWithPagination(filters, limit, offset);
    const total = await Job.count(filters);
    
    res.status(200).json({
      result: {
        jobs: jobs,
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
    console.error('Error fetching user jobs:', error);
    res.status(500).json({ result: null, message: 'Lấy danh sách công việc của người dùng thất bại' });
  }
};

// Get all locations
const getAllLocations = async (req, res) => {
  try {
    // Import the vn-provinces library
    const vnProvinces = require('vn-provinces');
    
    // Get all wards
    const wards = vnProvinces.getDistricts();
    
    res.status(200).json({ result: wards.map(ward => ward.fullName), message: null });
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ result: null, message: 'Lấy danh sách địa điểm thất bại' });
  }
};

// Like a job
const likeJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user.id;
    
    // Check if job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        result: null, message: 'Không tìm thấy công việc'
      });
    }
    
    // Like job using JobLike model
    await JobLike.likeJob(userId, jobId);
    
    res.status(200).json({
      result: { jobId: parseInt(jobId), isLiked: true }, message: null
    });
  } catch (error) {
    console.error('Error liking job:', error);
    if (error.message) {
      return res.status(400).json({ result: null, message: error.message });
    }
    res.status(500).json({ result: null, message: 'Lỗi khi thích công việc' });
  }
};

// Unlike a job
const unlikeJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user.id;
    
    // Check if job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        result: null, message: 'Không tìm thấy công việc'
      });
    }
    
    // Unlike job using JobLike model
    await JobLike.unlikeJob(userId, jobId);
    
    res.status(200).json({
      result: { jobId: parseInt(jobId), isLiked: false }, message: null
    });
  } catch (error) {
    console.error('Error unliking job:', error);
    if (error.message) {
      return res.status(400).json({ result: null, message: error.message });
    }
    res.status(500).json({ result: null, message: 'Lỗi khi bỏ thích công việc' });
  }
};

// Check like status
const checkLikeStatus = async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user.id;
    
    // Check if job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        result: null, message: 'Không tìm thấy công việc'
      });
    }
    
    // Check like status using JobLike model
    const isLiked = await JobLike.checkLikeStatus(userId, jobId);
    
    res.status(200).json({
      result: { isLiked }, message: null
    });
  } catch (error) {
    console.error('Error checking like status:', error);
    res.status(500).json({ result: null, message: 'Lỗi khi kiểm tra trạng thái thích' });
  }
};

// Update job status
const updateJobStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Validate status
    if (!status || !['draft', 'pending_review', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        result: null, message: 'Trạng thái không hợp lệ'
      });
    }
    
    // Check if job exists
    const existingJob = await Job.findById(id);
    if (!existingJob) {
      return res.status(404).json({
        result: null, message: 'Không tìm thấy công việc'
      });
    }
    
    // Check permissions based on status change
    const isAdmin = req.user.role?.name === 'admin';
    const isReviewer = req.user.role?.name === 'reviewer';
    const isCreator = existingJob.created_by === req.user.id;
    
    // Only creator can submit for review
    if (status === 'pending_review' && !isCreator) {
      return res.status(403).json({
        result: null, message: 'Chỉ người tạo công việc mới có thể gửi yêu cầu duyệt'
      });
    }
    
    // Only admin/reviewer can approve or reject
    if ((status === 'approved' || status === 'rejected') && !isAdmin && !isReviewer) {
      return res.status(403).json({
        result: null, message: 'Bạn không có quyền duyệt hoặc từ chối công việc'
      });
    }
    
    // Update job status
    const updated = await Job.update(id, { status });
    
    if (!updated) {
      return res.status(500).json({
        result: null, message: 'Cập nhật trạng thái công việc thất bại'
      });
    }
    
    // Fetch the updated job
    const updatedJob = await Job.findById(id);
    
    res.status(200).json({
      result: updatedJob, message: null
    });
  } catch (error) {
    console.error('Error updating job status:', error);
    res.status(500).json({ result: null, message: 'Cập nhật trạng thái công việc thất bại' });
  }
};

// Preview a job without checking approval status
const getJobPreview = async (req, res) => {
  const { id } = req.params;
  const { version_id } = req.query; // Optional version_id parameter
  
  try {
    // Get the job with its current version
    const [rows] = await db.query(
      `
      SELECT j.*,
             c.name as company_name,
             c.logo_id,
             i.name as industry_name,
             jv.version_number,
             jv.status as version_status,
             jv.is_live,
             jv.title as version_title,
             jv.brief_description as version_brief_description,
             jv.requirement as version_requirement,
             jv.benefits as version_benefits,
             jv.location as version_location,
             jv.salary as version_salary,
             jv.years_experienced as version_years_experienced,
             jv.work_hours as version_work_hours,
             jv.date_end_register as version_date_end_register,
             u.name as creator_name,
             u.email as creator_email
      FROM jobs j
      LEFT JOIN companies c ON j.company_id = c.id
      LEFT JOIN industries i ON j.industry_id = i.id
      LEFT JOIN users u ON j.created_by = u.id
      LEFT JOIN job_versions jv ON ${version_id ? 'jv.id = ?' : 'j.current_version_id = jv.id'}
      WHERE j.id = ? AND j.deleted_at IS NULL AND j.deleted = FALSE`,
      version_id ? [version_id, id] : [id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({
        result: null, message: 'Không tìm thấy công việc'
      });
    }
    
    const job = rows[0];
    
    // Get company logo if available
    if (job.logo_id) {
      const [logoRows] = await db.query(
        'SELECT * FROM media WHERE id = ?',
        [job.logo_id]
      );
      if (logoRows.length > 0) {
        job.company_logo = logoRows[0];
      }
    }
    
    // Get likes count
    const [likesResult] = await db.query(
      'SELECT COUNT(*) as likes FROM job_likes WHERE job_id = ?',
      [id]
    );
    job.likes = likesResult[0].likes;
    
    // Get if current user has liked this job
    if (req.query.user_id) {
      const [userLikeResult] = await db.query(
        'SELECT * FROM job_likes WHERE job_id = ? AND user_id = ?',
        [id, req.query.user_id]
      );
      job.is_liked = userLikeResult.length > 0;
    } else {
      job.is_liked = false;
    }
    
    // Merge version data with job data for the response
    if (job.version_title) job.title = job.version_title;
    if (job.version_brief_description) job.brief_description = job.version_brief_description;
    if (job.version_requirement) job.requirement = job.version_requirement;
    if (job.version_benefits) job.benefits = job.version_benefits;
    if (job.version_location) job.location = job.version_location;
    if (job.version_salary) job.salary = job.version_salary;
    if (job.version_years_experienced) job.years_experienced = job.version_years_experienced;
    if (job.version_work_hours) job.work_hours = job.version_work_hours;
    if (job.version_date_end_register) job.date_end_register = job.version_date_end_register;
    
    res.status(200).json({
      result: job, message: null
    });
  } catch (error) {
    console.error('Error in getJobPreview:', error);
    res.status(500).json({
      result: null, message: 'Lỗi khi lấy thông tin công việc'
    });
  }
};

// Get user's liked jobs
const getUserLikedJobs = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Get liked jobs with job details
    const query = `
      SELECT 
        j.*,
        c.name as company_name,
        m.url as company_logo,
        jl.created_at as liked_at
      FROM job_likes jl
      INNER JOIN jobs j ON jl.job_id = j.id
      LEFT JOIN companies c ON j.company_id = c.id
      LEFT JOIN media m ON c.logo_id = m.id
      WHERE jl.user_id = ? AND j.status = 'approved'
      ORDER BY jl.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const [jobs] = await db.query(query, [userId, limit, offset]);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM job_likes jl
      INNER JOIN jobs j ON jl.job_id = j.id
      WHERE jl.user_id = ? AND j.status = 'approved'
    `;
    const [countResult] = await db.query(countQuery, [userId]);
    const total = countResult[0].total;

    res.json({
      result: {
        jobs,
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
    console.error('Error fetching user liked jobs:', error);
    res.status(500).json({ result: null, message: 'Lỗi khi lấy danh sách công việc đã thích' });
  }
};

// Close a job and notify all applicants
const closeJob = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if job exists
    const existingJob = await Job.findById(id);
    if (!existingJob) {
      return res.status(404).json({
        result: null, message: 'Không tìm thấy công việc'
      });
    }
    
    // Check if user is authorized to close this job
    if (existingJob.created_by !== req.user.id && req.user.role?.name !== 'admin') {
      return res.status(403).json({
        result: null, message: 'Bạn không được phép đóng công việc này'
      });
    }
    
    // Update job to closed status
    await db.query(
      'UPDATE jobs SET is_closed = TRUE WHERE id = ?',
      [id]
    );
    
    // Get all applicants for this job with their email addresses and preferences
    const [applicants] = await db.query(
      `SELECT DISTINCT ja.user_id, u.name as user_name, u.email as user_email,
              u.email_notifications_enabled
       FROM job_applications ja
       LEFT JOIN users u ON ja.user_id = u.id
       WHERE ja.job_id = ? AND ja.status IN ('pending', 'reviewing')`,
      [id]
    );
    
    // Send notifications and emails to all applicants
    if (applicants.length > 0) {
      const notificationWS = req.app.get('notificationWS');
      
      for (const applicant of applicants) {
        // Create notification
        const notification = await Notification.create({
          user_id: applicant.user_id,
          title: 'Công việc đã đóng',
          message: `Công việc "${existingJob.title}" đã đóng. Đơn ứng tuyển của bạn đang được xem xét.`,
          type: 'info',
          link: `/bang-dieu-khien`
        });
        
        // Send WebSocket notification
        if (notificationWS) {
          notificationWS.sendToUser(applicant.user_id, notification);
        }
        
        // Send email to applicant (only if they have email notifications enabled)
        if (applicant.user_email && applicant.email_notifications_enabled) {
          await sendJobClosedEmail(
            applicant.user_email,
            applicant.user_name,
            existingJob.title
          );
        }
      }
    }
    
    res.status(200).json({
      result: { id: parseInt(id), is_closed: true }, 
      message: 'Đóng công việc thành công'
    });
  } catch (error) {
    console.error('Error closing job:', error);
    res.status(500).json({ result: null, message: 'Đóng công việc thất bại' });
  }
};

module.exports = {
  createJob,
  getAllJobs,
  getJobById,
  updateJob,
  deleteJob,
  getUserJobs,
  getAllLocations,
  likeJob,
  unlikeJob,
  checkLikeStatus,
  updateJobStatus,
  getJobPreview,
  getUserLikedJobs,
  closeJob
};
