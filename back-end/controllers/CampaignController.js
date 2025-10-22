/**
 * CampaignController.js
 * Controller for managing recruitment campaigns
 */

const Campaign = require('../models/Campaign');
const Company = require('../models/Company');

// Create a new campaign
exports.createCampaign = async (req, res) => {
  try {
    const { name, description, start_date, end_date, status, company_id } = req.body;

    // Validate required fields
    if (!name || !company_id) {
      return res.status(400).json({
        result: null,
        message: 'Tên chiến dịch và công ty là bắt buộc'
      });
    }

    // Check if company exists and user has permission
    const company = await Company.findById(company_id);
    if (!company) {
      return res.status(404).json({
        result: null,
        message: 'Không tìm thấy công ty'
      });
    }

    const isAdmin = req.user.role?.name === 'admin';
    const isCompanyOwner = company.created_by === req.user.id;

    if (!isAdmin && !isCompanyOwner) {
      return res.status(403).json({
        result: null,
        message: 'Bạn không được phép tạo chiến dịch cho công ty này'
      });
    }

    // Create campaign
    const campaignData = {
      name,
      description: description || '',
      start_date: start_date || null,
      end_date: end_date || null,
      status: status || 'draft',
      company_id,
      created_by: req.user.id
    };

    const campaign = await Campaign.create(campaignData);

    res.status(201).json({
      result: campaign,
      message: null
    });
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({
      result: null,
      message: 'Lỗi khi tạo chiến dịch'
    });
  }
};

// Get all campaigns for a company
exports.getCampaigns = async (req, res) => {
  try {
    const { company_id } = req.query;

    if (!company_id) {
      return res.status(400).json({
        result: null,
        message: 'Company ID là bắt buộc'
      });
    }

    // Check permission
    const company = await Company.findById(company_id);
    if (!company) {
      return res.status(404).json({
        result: null,
        message: 'Không tìm thấy công ty'
      });
    }

    const isAdmin = req.user.role?.name === 'admin';
    const isCompanyOwner = company.created_by === req.user.id;

    if (!isAdmin && !isCompanyOwner) {
      return res.status(403).json({
        result: null,
        message: 'Bạn không được phép xem chiến dịch của công ty này'
      });
    }

    const campaigns = await Campaign.findByCompany(company_id);

    res.json({
      result: campaigns,
      message: null
    });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({
      result: null,
      message: 'Lỗi khi lấy danh sách chiến dịch'
    });
  }
};

// Get campaign by ID
exports.getCampaign = async (req, res) => {
  try {
    const { id } = req.params;

    const campaign = await Campaign.findById(id);

    if (!campaign) {
      return res.status(404).json({
        result: null,
        message: 'Không tìm thấy chiến dịch'
      });
    }

    // Check permission
    const company = await Company.findById(campaign.company_id);
    const isAdmin = req.user.role?.name === 'admin';
    const isCompanyOwner = company && company.created_by === req.user.id;

    if (!isAdmin && !isCompanyOwner) {
      return res.status(403).json({
        result: null,
        message: 'Bạn không được phép xem chiến dịch này'
      });
    }

    res.json({
      result: campaign,
      message: null
    });
  } catch (error) {
    console.error('Error fetching campaign:', error);
    res.status(500).json({
      result: null,
      message: 'Lỗi khi lấy thông tin chiến dịch'
    });
  }
};

// Update campaign
exports.updateCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, start_date, end_date, status } = req.body;

    const campaign = await Campaign.findById(id);

    if (!campaign) {
      return res.status(404).json({
        result: null,
        message: 'Không tìm thấy chiến dịch'
      });
    }

    // Check permission
    const company = await Company.findById(campaign.company_id);
    const isAdmin = req.user.role?.name === 'admin';
    const isCompanyOwner = company && company.created_by === req.user.id;

    if (!isAdmin && !isCompanyOwner) {
      return res.status(403).json({
        result: null,
        message: 'Bạn không được phép cập nhật chiến dịch này'
      });
    }

    // Update campaign
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (start_date !== undefined) updateData.start_date = start_date;
    if (end_date !== undefined) updateData.end_date = end_date;
    if (status !== undefined) updateData.status = status;

    await Campaign.update(id, updateData);

    const updatedCampaign = await Campaign.findById(id);

    res.json({
      result: updatedCampaign,
      message: null
    });
  } catch (error) {
    console.error('Error updating campaign:', error);
    res.status(500).json({
      result: null,
      message: 'Lỗi khi cập nhật chiến dịch'
    });
  }
};

// Delete campaign
exports.deleteCampaign = async (req, res) => {
  try {
    const { id } = req.params;

    const campaign = await Campaign.findById(id);

    if (!campaign) {
      return res.status(404).json({
        result: null,
        message: 'Không tìm thấy chiến dịch'
      });
    }

    // Check permission
    const company = await Company.findById(campaign.company_id);
    const isAdmin = req.user.role?.name === 'admin';
    const isCompanyOwner = company && company.created_by === req.user.id;

    if (!isAdmin && !isCompanyOwner) {
      return res.status(403).json({
        result: null,
        message: 'Bạn không được phép xóa chiến dịch này'
      });
    }

    await Campaign.delete(id);

    res.json({
      result: true,
      message: null
    });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    res.status(500).json({
      result: null,
      message: 'Lỗi khi xóa chiến dịch'
    });
  }
};

// Add job to campaign
exports.addJobToCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const { job_id } = req.body;

    if (!job_id) {
      return res.status(400).json({
        result: null,
        message: 'Job ID là bắt buộc'
      });
    }

    const campaign = await Campaign.findById(id);

    if (!campaign) {
      return res.status(404).json({
        result: null,
        message: 'Không tìm thấy chiến dịch'
      });
    }

    // Check permission
    const company = await Company.findById(campaign.company_id);
    const isAdmin = req.user.role?.name === 'admin';
    const isCompanyOwner = company && company.created_by === req.user.id;

    if (!isAdmin && !isCompanyOwner) {
      return res.status(403).json({
        result: null,
        message: 'Bạn không được phép thêm công việc vào chiến dịch này'
      });
    }

    await Campaign.addJob(id, job_id);

    res.json({
      result: true,
      message: null
    });
  } catch (error) {
    console.error('Error adding job to campaign:', error);
    res.status(500).json({
      result: null,
      message: 'Lỗi khi thêm công việc vào chiến dịch'
    });
  }
};

// Remove job from campaign
exports.removeJobFromCampaign = async (req, res) => {
  try {
    const { id, job_id } = req.params;

    const campaign = await Campaign.findById(id);

    if (!campaign) {
      return res.status(404).json({
        result: null,
        message: 'Không tìm thấy chiến dịch'
      });
    }

    // Check permission
    const company = await Company.findById(campaign.company_id);
    const isAdmin = req.user.role?.name === 'admin';
    const isCompanyOwner = company && company.created_by === req.user.id;

    if (!isAdmin && !isCompanyOwner) {
      return res.status(403).json({
        result: null,
        message: 'Bạn không được phép xóa công việc khỏi chiến dịch này'
      });
    }

    await Campaign.removeJob(id, job_id);

    res.json({
      result: true,
      message: null
    });
  } catch (error) {
    console.error('Error removing job from campaign:', error);
    res.status(500).json({
      result: null,
      message: 'Lỗi khi xóa công việc khỏi chiến dịch'
    });
  }
};

// Get jobs in campaign
exports.getCampaignJobs = async (req, res) => {
  try {
    const { id } = req.params;

    const campaign = await Campaign.findById(id);

    if (!campaign) {
      return res.status(404).json({
        result: null,
        message: 'Không tìm thấy chiến dịch'
      });
    }

    // Check permission
    const company = await Company.findById(campaign.company_id);
    const isAdmin = req.user.role?.name === 'admin';
    const isCompanyOwner = company && company.created_by === req.user.id;

    if (!isAdmin && !isCompanyOwner) {
      return res.status(403).json({
        result: null,
        message: 'Bạn không được phép xem công việc trong chiến dịch này'
      });
    }

    const jobs = await Campaign.getJobs(id);

    res.json({
      result: jobs,
      message: null
    });
  } catch (error) {
    console.error('Error fetching campaign jobs:', error);
    res.status(500).json({
      result: null,
      message: 'Lỗi khi lấy danh sách công việc trong chiến dịch'
    });
  }
};

// Get campaign statistics
exports.getCampaignStats = async (req, res) => {
  try {
    const { id } = req.params;

    const campaign = await Campaign.findById(id);

    if (!campaign) {
      return res.status(404).json({
        result: null,
        message: 'Không tìm thấy chiến dịch'
      });
    }

    // Check permission
    const company = await Company.findById(campaign.company_id);
    const isAdmin = req.user.role?.name === 'admin';
    const isCompanyOwner = company && company.created_by === req.user.id;

    if (!isAdmin && !isCompanyOwner) {
      return res.status(403).json({
        result: null,
        message: 'Bạn không được phép xem thống kê chiến dịch này'
      });
    }

    const stats = await Campaign.getStats(id);

    res.json({
      result: stats,
      message: null
    });
  } catch (error) {
    console.error('Error fetching campaign stats:', error);
    res.status(500).json({
      result: null,
      message: 'Lỗi khi lấy thống kê chiến dịch'
    });
  }
};
