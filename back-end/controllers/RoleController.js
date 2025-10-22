const Role = require('../models/Role');

// Get all roles with pagination and filtering
const getAllRoles = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const offset = (page - 1) * limit;
    
    const roles = await Role.findWithPagination({ name: search }, limit, offset);
    const total = await Role.count({ name: search });
    
    res.json({
      result: {
        roles: roles,
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
    console.error('Error fetching roles:', error);
    res.status(500).json({ result: null, message: 'Lấy danh sách vai trò thất bại' });
  }
};

// Get role by ID
const getRoleById = async (req, res) => {
  try {
    const { id } = req.params;
    const foundRole = await Role.findById(id);
    
    if (!foundRole) {
      return res.status(404).json({ result: null, message: 'Không tìm thấy vai trò' });
    }
    
    res.json({ result: foundRole, message: null });
  } catch (error) {
    console.error('Error fetching role:', error);
    res.status(500).json({ result: null, message: 'Lấy thông tin vai trò thất bại' });
  }
};

// Create a new role
const createRole = async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ result: null, message: 'Tên vai trò là bắt buộc' });
    }
    
    const newRole = await Role.create({ name, description });
    res.status(201).json({ result: newRole, message: null });
  } catch (error) {
    console.error('Error creating role:', error);
    res.status(500).json({ result: null, message: 'Tạo vai trò thất bại' });
  }
};

// Update a role
const updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    
    const isUpdated = await Role.update(id, { name, description });
    
    if (!isUpdated) {
      return res.status(404).json({ result: null, message: 'Không tìm thấy vai trò' });
    }
    
    // Fetch the updated role
    const updatedRole = await Role.findById(id);
    res.json({ result: updatedRole, message: null });
  } catch (error) {
    console.error('Error updating role:', error);
    res.status(500).json({ result: null, message: 'Cập nhật vai trò thất bại' });
  }
};

// Delete a role (soft delete)
const deleteRole = async (req, res) => {
  try {
    const { id } = req.params;
    
    const isDeleted = await Role.delete(id);
    
    if (!isDeleted) {
      return res.status(404).json({ result: null, message: 'Không tìm thấy vai trò' });
    }
    
    res.json({ result: true, message: null });
  } catch (error) {
    console.error('Error deleting role:', error);
    res.status(500).json({ result: null, message: 'Xóa vai trò thất bại' });
  }
};

module.exports = {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole
};
