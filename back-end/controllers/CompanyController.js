const Company = require('../models/Company');
const CompanySubscription = require('../models/CompanySubscription');
const Notification = require('../models/Notification');
const db = require('../config/db');
const aiProcessService = require('../utils/aiProcessService');

// Create a new company
const createCompany = async (req, res) => {
  try {
    const { name, description, industries, website, location, logo_id, employees, facebook, youtube, linkedin, twitter, instagram } = req.body;
    
    // Validate required fields
    if (!name) {
      return res.status(400).json({
        result: null, message: 'Tên công ty là bắt buộc'
      });
    }
    
    // Create company data
    const companyData = {
      name,
      description: description || '',
      industries: industries || [],
      website: website || '',
      location: location || '',
      logo_id: logo_id || null,
      employees: employees || '',
      facebook: facebook || '',
      youtube: youtube || '',
      linkedin: linkedin || '',
      twitter: twitter || '',
      instagram: instagram || '',
      created_by: req.user.id // Get user ID from authenticated user
    };
    
    // Create company
    const company = await Company.create(companyData);

    try {
      await Notification.createForAdmins({
        title: 'Công ty mới được tạo',
        message: `Người dùng "${req.user.name || 'Không rõ'}" đã tạo công ty "${name}".`,
        type: 'company_created',
        link: '/admin/quan-ly-cong-ty'
      });
    } catch (notificationError) {
      console.error('Error notifying admins about new company creation:', notificationError);
    }
    
    res.status(200).json({
      result: company, message: null
    });
  } catch (error) {
    console.error('Error creating company:', error);
    res.status(500).json({ result: null, message: 'Tạo công ty thất bại' });
  }
};

// Get all companies with pagination and filtering
const getAllCompanies = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const industry = req.query.industry || '';
    const offset = (page - 1) * limit;
    
    const filters = {};
    if (search) {
      filters.search = search;
    }
    if (industry) {
      filters.industry = industry;
    }
    
    const companies = await Company.findWithPagination(filters, limit, offset);
    const total = await Company.count(filters);
    
    res.status(200).json({
      result: {
        companies: companies,
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
    console.error('Error fetching companies:', error);
    res.status(500).json({ result: null, message: 'Lỗi khi tải danh sách công ty' });
  }
};

// Get company by ID
const getCompanyById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const company = await Company.findById(id);
    
    if (!company) {
      return res.status(404).json({
        result: null, message: 'Không tìm thấy công ty'
      });
    }
    
    res.status(200).json({
      result: company, message: null
    });
  } catch (error) {
    console.error('Error fetching company:', error);
    res.status(500).json({ result: null, message: 'Lỗi khi tải thông tin công ty' });
  }
};

// Get current user's company
const getMyCompany = async (req, res) => {
  try {
    const company = await Company.findByUserId(req.user.id);
    
    if (!company) {
      return res.status(200).json({
        result: null, message: null
      });
    }
    
    res.status(200).json({
      result: company, message: null
    });
  } catch (error) {
    console.error('Error fetching company:', error);
    res.status(500).json({ result: null, message: 'Lỗi khi tải thông tin công ty' });
  }
};

// Update company
const updateCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, industries, website, location, logo_id, employees, facebook, youtube, linkedin, twitter, instagram } = req.body;
    
    // Check if company exists
    const existingCompany = await Company.findById(id);
    if (!existingCompany) {
      return res.status(404).json({
        result: null, message: 'Không tìm thấy công ty'
      });
    }
    
    // Check if user is authorized to update this company
    // Allow admin users to update any company
    if (req.user.role?.name !== 'admin' 
      && req.user.id !== existingCompany.created_by
    ) {
      return res.status(403).json({
        result: null, message: 'Bạn không được phép cập nhật công ty này'
      });
    }
    
    // Update company data
    const companyData = {
      name: name || existingCompany.name,
      description: description || existingCompany.description,
      industries: industries || existingCompany.industries,
      website: website || existingCompany.website,
      location: location || existingCompany.location,
      employees: employees || existingCompany.employees,
      facebook: facebook || existingCompany.facebook,
      youtube: youtube || existingCompany.youtube,
      linkedin: linkedin || existingCompany.linkedin,
      twitter: twitter || existingCompany.twitter,
      instagram: instagram || existingCompany.instagram,
      logo_id: logo_id !== undefined ? logo_id : (existingCompany.logo ? existingCompany.logo.id : null)
    };
    
    // Update company
    const updatedCompany = await Company.update(id, companyData);
    
    if (!updatedCompany) {
      return res.status(500).json({
        result: null, message: 'Cập nhật công ty thất bại'
      });
    }
    
    res.status(200).json({
      result: updatedCompany, message: null
    });
  } catch (error) {
    console.error('Error updating company:', error);
    res.status(500).json({ result: null, message: 'Cập nhật công ty thất bại' });
  }
};

// Delete company
const deleteCompany = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if company exists
    const existingCompany = await Company.findById(id);
    if (!existingCompany) {
      return res.status(404).json({
        result: null, message: 'Không tìm thấy công ty'
      });
    }
    
    // Check if user is authorized to delete this company
    // Allow admin users to delete any company
    if (req.user.role?.name !== 'admin' 
      && req.user.id !== existingCompany.created_by
    ) {
      return res.status(403).json({
        result: null, message: 'Bạn không được phép xóa công ty này'
      });
    }
    
    // Delete company
    const deleted = await Company.delete(id);
    
    if (!deleted) {
      return res.status(500).json({
        result: null, message: 'Xóa công ty thất bại'
      });
    }
    
    res.status(200).json({
      result: true, message: null
    });
  } catch (error) {
    console.error('Error deleting company:', error);
    res.status(500).json({ result: null, message: 'Xóa công ty thất bại' });
  }
};

// Subscribe to a company
const subscribeToCompany = async (req, res) => {
  try {
    const { companyId } = req.params;
    const userId = req.user.id;
    
    // Check if company exists
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({
        result: null, message: 'Không tìm thấy công ty'
      });
    }
    
    // Subscribe to company using CompanySubscription model
    await CompanySubscription.subscribeToCompany(userId, companyId);
    
    res.status(200).json({
      result: true, message: null
    });
  } catch (error) {
    console.error('Error subscribing to company:', error);
    if (error.message) {
      return res.status(400).json({ result: null, message: error.message });
    }
    res.status(500).json({ result: null, message: 'Lỗi khi đăng ký theo dõi công ty' });
  }
};

// Unsubscribe from a company
const unsubscribeFromCompany = async (req, res) => {
  try {
    const { companyId } = req.params;
    const userId = req.user.id;
    
    // Check if company exists
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({
        result: null, message: 'Không tìm thấy công ty'
      });
    }
    
    // Unsubscribe from company using CompanySubscription model
    await CompanySubscription.unsubscribeFromCompany(userId, companyId);
    
    res.status(200).json({
      result: true, message: null
    });
  } catch (error) {
    console.error('Error unsubscribing from company:', error);
    if (error.message) {
      return res.status(400).json({ result: null, message: error.message });
    }
    res.status(500).json({ result: null, message: 'Lỗi khi hủy đăng ký theo dõi công ty' });
  }
};

// Check subscription status
const checkSubscriptionStatus = async (req, res) => {
  try {
    const { companyId } = req.params;
    const userId = req.user.id;
    
    // Check if company exists
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({
        result: null, message: 'Không tìm thấy công ty'
      });
    }
    
    // Check subscription status using CompanySubscription model
    const isSubscribed = await CompanySubscription.checkSubscriptionStatus(userId, companyId);
    
    res.status(200).json({
      result: isSubscribed, message: null
    });
  } catch (error) {
    console.error('Error checking subscription status:', error);
    res.status(500).json({ result: null, message: 'Lỗi khi kiểm tra trạng thái đăng ký' });
  }
};

// Get user's subscribed companies
const getUserSubscribedCompanies = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Get subscribed companies with details
    const query = `
      SELECT 
        c.*,
        cs.created_at as subscribed_at,
        (SELECT COUNT(*) FROM jobs WHERE company_id = c.id AND status = 'approved') as job_count,
        m.id as logo_id,
        m.filename as logo_filename,
        m.original_name as logo_original_name,
        m.mime_type as logo_mime_type,
        m.size as logo_size,
        m.path as logo_path,
        m.url as logo_url
      FROM company_subscriptions cs
      INNER JOIN companies c ON cs.company_id = c.id
      LEFT JOIN media m ON c.logo_id = m.id
      WHERE cs.user_id = ?
      ORDER BY cs.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const [rows] = await db.query(query, [userId, limit, offset]);
    
    // Transform rows to include logo object
    const companies = rows.map(row => {
      const logo = row.logo_id ? {
        id: row.logo_id,
        filename: row.logo_filename,
        original_name: row.logo_original_name,
        mime_type: row.logo_mime_type,
        size: row.logo_size,
        path: row.logo_path,
        url: row.logo_url
      } : null;
      
      return {
        id: row.id,
        name: row.name,
        description: row.description,
        website: row.website,
        location: row.location,
        employees: row.employees,
        logo: logo,
        facebook: row.facebook,
        youtube: row.youtube,
        linkedin: row.linkedin,
        twitter: row.twitter,
        instagram: row.instagram,
        created_by: row.created_by,
        created_at: row.created_at,
        modified_at: row.modified_at,
        deleted_at: row.deleted_at,
        subscribed_at: row.subscribed_at,
        job_count: row.job_count
      };
    });

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM company_subscriptions cs
      INNER JOIN companies c ON cs.company_id = c.id
      WHERE cs.user_id = ?
    `;
    const [countResult] = await db.query(countQuery, [userId]);
    const total = countResult[0].total;

    res.json({
      result: {
        companies,
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
    console.error('Error fetching user subscribed companies:', error);
    res.status(500).json({ result: null, message: 'Lỗi khi lấy danh sách công ty đã theo dõi' });
  }
};

// Get top companies based on subscription count and job likes
const getTopCompanies = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    // Query to get top companies based on:
    // 1. Number of subscribers (primary ranking)
    // 2. Total likes on their jobs (secondary ranking)
    const query = `
      SELECT 
        c.*,
        COALESCE(sub_count.subscriber_count, 0) as subscriber_count,
        COALESCE(job_likes.total_likes, 0) as total_job_likes,
        COALESCE(job_count.active_jobs, 0) as active_jobs,
        m.id as logo_id,
        m.filename as logo_filename,
        m.original_name as logo_original_name,
        m.mime_type as logo_mime_type,
        m.size as logo_size,
        m.path as logo_path,
        m.url as logo_url
      FROM companies c
      LEFT JOIN (
        SELECT company_id, COUNT(*) as subscriber_count
        FROM company_subscriptions
        GROUP BY company_id
      ) sub_count ON c.id = sub_count.company_id
      LEFT JOIN (
        SELECT j.company_id, COUNT(jl.id) as total_likes
        FROM jobs j
        LEFT JOIN job_likes jl ON j.id = jl.job_id
        WHERE j.status = 'approved' AND j.deleted_at IS NULL
        GROUP BY j.company_id
      ) job_likes ON c.id = job_likes.company_id
      LEFT JOIN (
        SELECT company_id, COUNT(*) as active_jobs
        FROM jobs
        WHERE status = 'approved' AND deleted_at IS NULL
        GROUP BY company_id
      ) job_count ON c.id = job_count.company_id
      LEFT JOIN media m ON c.logo_id = m.id
      WHERE c.deleted_at IS NULL
      ORDER BY subscriber_count DESC, total_job_likes DESC, active_jobs DESC
      LIMIT ?
    `;
    
    const [rows] = await db.query(query, [limit]);
    
    // Transform rows to include logo object
    const companies = rows.map(row => {
      const logo = row.logo_id ? {
        id: row.logo_id,
        filename: row.logo_filename,
        original_name: row.logo_original_name,
        mime_type: row.logo_mime_type,
        size: row.logo_size,
        path: row.logo_path,
        url: row.logo_url
      } : null;
      
      return {
        id: row.id,
        name: row.name,
        description: row.description,
        website: row.website,
        location: row.location,
        employees: row.employees,
        industries: row.industries,
        logo: logo,
        facebook: row.facebook,
        youtube: row.youtube,
        linkedin: row.linkedin,
        twitter: row.twitter,
        instagram: row.instagram,
        created_by: row.created_by,
        created_at: row.created_at,
        modified_at: row.modified_at,
        deleted_at: row.deleted_at,
        subscriber_count: row.subscriber_count,
        total_job_likes: row.total_job_likes,
        active_jobs: row.active_jobs
      };
    });

    res.status(200).json({
      result: companies,
      message: null
    });
  } catch (error) {
    console.error('Error fetching top companies:', error);
    res.status(500).json({ result: null, message: 'Lỗi khi tải danh sách công ty hàng đầu' });
  }
};

// AI-powered: Generate professional company description
const generateCompanyDescription = async (req, res) => {
  try {
    const { name, industry, location, company_size, website, brief_info } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Company name is required'
      });
    }

    // Check if AI process is available
    const isAvailable = await aiProcessService.isProcessAvailable('COMPANY_DESC_GEN');
    if (!isAvailable) {
      return res.status(503).json({
        success: false,
        message: 'AI company description generator is not available'
      });
    }

    // Execute AI process
    const result = await aiProcessService.executeProcess(
      'COMPANY_DESC_GEN',
      {
        company_name: name,
        industry: industry || 'General',
        location: location || 'Vietnam',
        company_size: company_size || 'Unknown',
        website: website || '',
        brief_info: brief_info || 'A professional company'
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
        message: result.error || 'Failed to generate company description'
      });
    }
  } catch (error) {
    console.error('Error generating company description:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  createCompany,
  getAllCompanies,
  getCompanyById,
  getMyCompany,
  updateCompany,
  deleteCompany,
  subscribeToCompany,
  unsubscribeFromCompany,
  checkSubscriptionStatus,
  getUserSubscribedCompanies,
  getTopCompanies,
  generateCompanyDescription
};
