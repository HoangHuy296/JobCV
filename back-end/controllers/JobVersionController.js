/**
 * JobVersionController.js
 * Controller for managing job versions
 */

const Job = require('../models/Job');
const JobVersion = require('../models/JobVersion');
const JobReview = require('../models/JobReview');
const Notification = require('../models/Notification');
const User = require('../models/User');
const db = require('../config/db');
const { validateJobInput } = require('../middleware/jobValidation');

/**
 * Create a new version of a job
 */
exports.createJobVersion = async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const jobId = parseInt(req.params.jobId);
    const {
      title, brief_description, requirement, benefits, salary,
      date_end_register, years_experienced, work_hours, company_id,
      industry_id, location
    } = req.body;

    // Check if job exists and user has permission
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ result: null, message: 'Không tìm thấy công việc' });
    }

    // Check if user is authorized to create a new version
    const isAdmin = req.user.role?.name === 'admin';
    const isCreator = job.created_by === req.user.id;

    if (!isAdmin && !isCreator) {
      return res.status(403).json({
        result: null, message: 'Bạn không được phép cập nhật công việc này'
      });
    }

    // Get the next version number
    const newVersionNumber = job.version_count + 1;

    // Create the new version using JobVersion model
    // New versions always start as draft
    const versionData = {
      job_id: jobId,
      version_number: newVersionNumber,
      title,
      brief_description,
      requirement,
      benefits,
      salary,
      date_end_register,
      years_experienced,
      work_hours,
      company_id,
      industry_id,
      location,
      status: 'draft',
      is_live: false,
      created_by: req.user.id
    };

    const version = await JobVersion.create(versionData);
    const versionId = version.id;

    // Update the job's version count
    await Job.update(jobId, { version_count: newVersionNumber });

    await connection.commit();

    res.status(201).json({
      result: {
        id: versionId,
        job_id: jobId,
        version_number: newVersionNumber,
        status: 'draft'
      },
      message: null
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error creating job version:', error);
    res.status(500).json({ result: null, message: 'Lỗi máy chủ nội bộ' });
  } finally {
    connection.release();
  }
};

/**
 * Get all versions of a job
 */
exports.getJobVersions = async (req, res) => {
  try {
    const jobId = parseInt(req.params.jobId);

    // Check if job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ result: null, message: 'Không tìm thấy công việc' });
    }

    // Get all versions of the job using JobVersion model
    const versions = await JobVersion.findByJobId(jobId);

    res.json({
      result: {
        job_id: jobId,
        current_version_id: job.current_version_id,
        versions: versions
      },
      message: null
    });

  } catch (error) {
    console.error('Error fetching job versions:', error);
    res.status(500).json({ result: null, message: 'Lỗi máy chủ nội bộ' });
  }
};

/**
 * Get a specific version of a job
 */
exports.getJobVersion = async (req, res) => {
  try {
    const jobId = parseInt(req.params.jobId);
    const versionId = parseInt(req.params.versionId);

    // Get the specific version using JobVersion model
    const version = await JobVersion.findByIdAndJobId(versionId, jobId);

    if (!version) {
      return res.status(404).json({ result: null, message: 'Không tìm thấy phiên bản' });
    }

    res.json({
      result: version,
      message: null
    });

  } catch (error) {
    console.error('Error fetching job version:', error);
    res.status(500).json({ result: null, message: 'Lỗi máy chủ nội bộ' });
  }
};

/**
 * Set a specific version as live (only for admin)
 */
exports.setVersionLive = async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const jobId = parseInt(req.params.jobId);
    const versionId = parseInt(req.params.versionId);

    // Check if user is admin
    if (req.user.role?.name !== 'admin') {
      return res.status(403).json({
        result: null, message: 'Chỉ quản trị viên mới có thể thực hiện thao tác này'
      });
    }

    // Check if version exists and is approved
    const version = await JobVersion.findByIdAndJobId(versionId, jobId);
    if (!version || version.status !== 'approved') {
      return res.status(404).json({
        result: null,
        message: 'Không tìm thấy phiên bản hoặc phiên bản chưa được duyệt'
      });
    }

    // Set all versions to not live
    await JobVersion.setAllVersionsNotLive(jobId);

    // Set the selected version as live
    await JobVersion.setAsLive(versionId);

    // Update the job's current version
    await Job.update(jobId, { current_version_id: versionId });

    await connection.commit();

    res.json({
      result: true,
      message: null
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error setting version live:', error);
    res.status(500).json({ result: null, message: 'Lỗi máy chủ nội bộ' });
  } finally {
    connection.release();
  }
};

/**
 * Review a job version (only for admin)
 */
exports.reviewJobVersion = async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const jobId = parseInt(req.params.jobId);
    const versionId = parseInt(req.params.versionId);
    const { status, feedback } = req.body;

    // Check if user is admin
    if (req.user.role?.name !== 'admin') {
      return res.status(403).json({
        result: null, message: 'Chỉ quản trị viên mới có thể duyệt công việc'
      });
    }

    // Validate status
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        result: null, message: 'Trạng thái không hợp lệ'
      });
    }

    // Check if job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ result: null, message: 'Không tìm thấy công việc' });
    }

    // Check if version exists
    const version = await JobVersion.findByIdAndJobId(versionId, jobId);
    if (!version) {
      return res.status(404).json({ result: null, message: 'Không tìm thấy phiên bản' });
    }

    const normalizedFeedback = feedback?.trim() ? feedback.trim() : null;

    // Update the version status
    await connection.query(
      'UPDATE job_versions SET status = ?, modified_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, versionId]
    );

    // Update or create review record
    const [existingReviewRows] = await connection.query(
      'SELECT id FROM job_reviews WHERE job_version_id = ? ORDER BY id DESC LIMIT 1',
      [versionId]
    );

    if (existingReviewRows.length > 0) {
      await connection.query(
        `UPDATE job_reviews
         SET status = ?, feedback = ?, reviewer_id = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [status, normalizedFeedback, req.user.id, existingReviewRows[0].id]
      );
    } else {
      await connection.query(
        `INSERT INTO job_reviews (job_id, job_version_id, reviewer_id, status, feedback, created_at)
         VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [jobId, versionId, req.user.id, status, normalizedFeedback]
      );
    }

    // Sync job + version live state similar to processReview
    await connection.query(
      'UPDATE jobs SET status = ? WHERE id = ?',
      [status, jobId]
    );

    if (status === 'approved') {
      await connection.query(
        'UPDATE job_versions SET is_live = FALSE WHERE job_id = ?',
        [jobId]
      );
      await connection.query(
        'UPDATE job_versions SET is_live = TRUE WHERE id = ?',
        [versionId]
      );
      await connection.query(
        'UPDATE jobs SET current_version_id = ? WHERE id = ?',
        [versionId, jobId]
      );
    } else {
      await connection.query(
        'UPDATE job_versions SET is_live = FALSE WHERE id = ?',
        [versionId]
      );
    }

    await connection.commit();

    const responsePayload = {
      result: {
        job_id: jobId,
        version_id: versionId,
        status,
        feedback: normalizedFeedback
      },
      message: null
    };

    const jobOwner = await User.findById(job.created_by);
    if (jobOwner) {
      const notificationTitle = status === 'approved'
        ? 'Công việc đã được duyệt'
        : 'Công việc bị từ chối';
      const jobTitle = version?.title || job.title;
      const notificationMessage = status === 'approved'
        ? `Công việc "${jobTitle}" của bạn đã được duyệt và đăng công khai.`
        : normalizedFeedback
          ? `Công việc "${jobTitle}" của bạn đã bị từ chối. Lý do: ${normalizedFeedback}`
          : `Công việc "${jobTitle}" của bạn đã bị từ chối.`;

      try {
        await Notification.create({
          user_id: job.created_by,
          title: notificationTitle,
          message: notificationMessage,
          type: status === 'approved' ? 'job_approved' : 'job_rejected',
          link: `/recruiter/jobs/${jobId}`
        });
      } catch (notificationError) {
        console.error('Error creating notification for job version review:', notificationError);
      }
    }

    res.json(responsePayload);

  } catch (error) {
    await connection.rollback();
    console.error('Error reviewing job version:', error);
    res.status(500).json({ result: null, message: 'Lỗi máy chủ nội bộ' });
  } finally {
    connection.release();
  }
};

/**
 * Set a version as the primary version
 * This changes which version is considered the current version of a job
 * without affecting the live status
 */
exports.setPrimaryVersion = async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const jobId = parseInt(req.params.jobId);
    const versionId = parseInt(req.params.versionId);

    // Check if job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ result: null, message: 'Không tìm thấy công việc' });
    }

    // Check if version exists
    const version = await JobVersion.findByIdAndJobId(versionId, jobId);
    if (!version) {
      return res.status(404).json({ result: null, message: 'Không tìm thấy phiên bản' });
    }

    // Check if user is authorized to set primary version
    const isAdmin = req.user.role?.name === 'admin';
    const isCreator = job.created_by === req.user.id;

    if (!isAdmin && !isCreator) {
      return res.status(403).json({
        result: null, message: 'Bạn không được phép thực hiện thao tác này'
      });
    }

    // Update the job's current version
    await Job.update(jobId, { current_version_id: versionId });

    await connection.commit();

    res.json({
      result: true,
      message: null
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error setting primary version:', error);
    res.status(500).json({ result: null, message: 'Lỗi máy chủ nội bộ' });
  } finally {
    connection.release();
  }
};

/**
 * Update a job version
 * Allows job creators or admins to update their versions
 */
exports.updateJobVersion = async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const jobId = parseInt(req.params.jobId);
    const versionId = parseInt(req.params.versionId);
    const {
      title, brief_description, requirement, benefits, salary,
      date_end_register, years_experienced, work_hours, company_id,
      industry_id, location
    } = req.body;

    // Validate input
    const validationErrors = validateJobInput(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ result: null, message: validationErrors.join(', ') });
    }

    // Check if job and version exist
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ result: null, message: 'Không tìm thấy công việc' });
    }

    const version = await JobVersion.findByIdAndJobId(versionId, jobId);
    if (!version) {
      return res.status(404).json({ result: null, message: 'Không tìm thấy phiên bản' });
    }

    // Check if user is authorized to update this version
    const isAdmin = req.user.role?.name === 'admin';
    const isCreator = job.created_by === req.user.id;
    const isVersionCreator = version.created_by === req.user.id;

    if (!isAdmin && !isCreator && !isVersionCreator) {
      return res.status(403).json({
        result: null, message: 'Bạn không được phép cập nhật phiên bản này'
      });
    }

    // Update the version
    const updateData = {
      title,
      brief_description,
      requirement,
      benefits: benefits || '',
      salary: salary || '',
      date_end_register: date_end_register || null,
      years_experienced: years_experienced || 0,
      work_hours: work_hours || '',
      company_id,
      industry_id,
      location: location || '',
      // Reset status to pending_review if it was rejected before
      status: version.status === 'rejected' ? 'pending_review' : version.status
    };

    await JobVersion.update(versionId, updateData);

    // If this is the current version, update the job record to sync data
    if (job.current_version_id === versionId) {
      await Job.update(jobId, {
        title,
        brief_description,
        requirement,
        benefits: benefits || '',
        salary: salary || '',
        date_end_register: date_end_register || null,
        years_experienced: years_experienced || 0,
        work_hours: work_hours || '',
        company_id,
        industry_id,
        location: location || '',
        status: updateData.status
      });
    }

    // If status changed to pending_review, update or create a review request
    if (version.status === 'rejected' && updateData.status === 'pending_review') {
      // Find an admin user to be the reviewer
      const [adminUsers] = await db.query('SELECT id FROM users WHERE role_id = 1 LIMIT 1');
      
      let reviewerId;
      if (adminUsers.length > 0) {
        reviewerId = adminUsers[0].id;
      } else {
        // If no admin found, use the current user as fallback
        reviewerId = req.user.id;
      }
      
      // Check if a review already exists
      const [existingReviews] = await db.query(
        'SELECT id FROM job_reviews WHERE job_version_id = ? LIMIT 1',
        [versionId]
      );
      
      if (existingReviews.length > 0) {
        // Update existing review
        await JobReview.update(existingReviews[0].id, {
          reviewer_id: reviewerId,
          status: 'pending',
          feedback: null
        });
      } else {
        // Create a new review request
        await JobReview.create({
          job_id: jobId,
          job_version_id: versionId,
          reviewer_id: reviewerId,
          status: 'pending'
        });
      }
    }

    await connection.commit();

    // Get the updated version
    const updatedVersion = await JobVersion.findByIdAndJobId(versionId, jobId);

    res.json({
      result: updatedVersion,
      message: null
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error updating job version:', error);
    res.status(500).json({ result: null, message: 'Lỗi máy chủ nội bộ' });
  } finally {
    connection.release();
  }
};

/**
 * Delete a job version
 * Allows job creators or admins to delete versions that are not live or current
 */
exports.deleteJobVersion = async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const jobId = parseInt(req.params.jobId);
    const versionId = parseInt(req.params.versionId);

    // Check if job and version exist
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ result: null, message: 'Không tìm thấy công việc' });
    }

    const version = await JobVersion.findByIdAndJobId(versionId, jobId);
    if (!version) {
      return res.status(404).json({ result: null, message: 'Không tìm thấy phiên bản' });
    }

    // Check if user is authorized to delete this version
    const isAdmin = req.user.role?.name === 'admin';
    const isCreator = job.created_by === req.user.id;
    const isVersionCreator = version.created_by === req.user.id;

    if (!isAdmin && !isCreator && !isVersionCreator) {
      return res.status(403).json({
        result: null, message: 'Bạn không được phép xóa phiên bản này'
      });
    }

    // Cannot delete if it's the current version or live version
    if (version.id === job.current_version_id) {
      return res.status(400).json({
        result: null, message: 'Không thể xóa phiên bản chính hiện tại'
      });
    }

    if (version.is_live) {
      return res.status(400).json({
        result: null, message: 'Không thể xóa phiên bản đang live'
      });
    }

    // Delete related reviews first
    await db.query('DELETE FROM job_reviews WHERE job_version_id = ?', [versionId]);
    
    // Delete the version
    await db.query('DELETE FROM job_versions WHERE id = ?', [versionId]);

    await connection.commit();

    res.json({
      result: true,
      message: null
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error deleting job version:', error);
    res.status(500).json({ result: null, message: 'Lỗi máy chủ nội bộ' });
  } finally {
    connection.release();
  }
};
