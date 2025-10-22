const Industry = require('../models/Industry');

// Get all industries with pagination, filtering, and sorting
const getAllIndustries = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const sortBy = req.query.sortBy || 'name';
    const sortOrder = req.query.sortOrder || 'ASC';
    
    // Special case: if limit is set to -1, return all industries
    const getAll = limit === -1;
    
    const filters = {};
    if (search) {
      filters.search = search;
    }
    
    let industries, total;
    
    if (getAll) {
      industries = await Industry.findAll(filters, sortBy, sortOrder);
      total = industries.length;
    } else {
      const offset = (page - 1) * limit;
      industries = await Industry.findWithPagination(filters, limit, offset, sortBy, sortOrder);
      total = await Industry.count(filters);
    }
    
    res.status(200).json({
      result: {
        industries: industries,
        pagination: {
          page,
          limit: getAll ? total : limit,
          total,
          totalPages: getAll ? 1 : Math.ceil(total / limit)
        }
      },
      message: null
    });
  } catch (error) {
    console.error('Error fetching industries:', error);
    res.status(500).json({ result: null, message: 'Lấy danh sách ngành thất bại' });
  }
};

// Get industry by ID
const getIndustryById = async (req, res) => {
  try {
    const { id } = req.params;
    const industry = await Industry.findById(id);
    
    if (!industry) {
      return res.status(404).json({ result: null, message: 'Không tìm thấy ngành' });
    }
    
    res.status(200).json({ result: industry, message: null });
  } catch (error) {
    console.error('Error fetching industry:', error);
    res.status(500).json({ result: null, message: 'Lấy thông tin ngành thất bại' });
  }
};

// Create a new industry
const createIndustry = async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ result: null, message: 'Tên ngành là bắt buộc' });
    }
    
    const industry = await Industry.create(name);
    res.status(201).json({ result: industry, message: null });
  } catch (error) {
    console.error('Error creating industry:', error);
    res.status(500).json({ result: null, message: 'Tạo ngành thất bại' });
  }
};

// Update industry
const updateIndustry = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ result: null, message: 'Tên ngành là bắt buộc' });
    }
    
    const updated = await Industry.update(id, name);
    
    if (!updated) {
      return res.status(404).json({ result: null, message: 'Không tìm thấy ngành' });
    }
    
    // Fetch the updated industry
    const updatedIndustry = await Industry.findById(id);
    
    res.status(200).json({ result: updatedIndustry, message: null });
  } catch (error) {
    console.error('Error updating industry:', error);
    res.status(500).json({ result: null, message: 'Cập nhật ngành thất bại' });
  }
};

// Delete industry
const deleteIndustry = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Industry.delete(id);
    
    if (!deleted) {
      return res.status(404).json({ result: null, message: 'Không tìm thấy ngành' });
    }
    
    res.status(200).json({ result: { id: parseInt(id) }, message: null });
  } catch (error) {
    console.error('Error deleting industry:', error);
    res.status(500).json({ result: null, message: 'Xóa ngành thất bại' });
  }
};

module.exports = {
  getAllIndustries,
  getIndustryById,
  createIndustry,
  updateIndustry,
  deleteIndustry
};
