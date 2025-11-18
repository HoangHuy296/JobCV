const User = require('../models/User');

// Get all users with pagination and filtering
const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const isActive = req.query.is_active;
    const roleId = req.query.role_id;
    const offset = (page - 1) * limit;
    
    const filters = {};
    if (search) {
      filters.search = search;
    }
    if (isActive !== undefined) {
      filters.is_active = isActive == 1 || isActive === true;
    }
    if (roleId !== undefined) {
      filters.role_id = roleId;
    }
    
    const users = await User.findWithPagination(filters, limit, offset);
    const total = await User.count(filters);
    
    res.json({
      result: {
        users: users,
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
    console.error('Error fetching users:', error);
    res.status(500).json({ result: null, message: 'Lấy danh sách người dùng thất bại' });
  }
};

// Get user by ID
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const foundUser = await User.findById(id);
    
    if (!foundUser) {
      return res.status(404).json({ result: null, message: 'Không tìm thấy người dùng' });
    }
    
    res.json({ result: foundUser, message: null });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ result: null, message: 'Lấy thông tin người dùng thất bại' });
  }
};

// Create a new user
const createUser = async (req, res) => {
  try {
    const { name, email, password, is_active = true, image_id, role_id } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ result: null, message: 'Tên, email và mật khẩu là bắt buộc' });
    }
    
    // Hash the password
    const hashedPassword = await User.hashPassword(password);
    
    const userData = { name, email, password: hashedPassword, is_active };
    if (image_id !== undefined) userData.image_id = image_id;
    if (role_id !== undefined) userData.role_id = role_id;
    
    const newUser = await User.create(userData);
    res.status(201).json({ result: newUser, message: null });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ result: null, message: 'Tạo người dùng thất bại' });
  }
};

// Update a user
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, is_active, image_id, role_id, email_notifications_enabled } = req.body;
    
    // Prepare update data
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (image_id !== undefined) updateData.image_id = image_id;
    if (role_id !== undefined) updateData.role_id = role_id;
    if (email_notifications_enabled !== undefined) updateData.email_notifications_enabled = email_notifications_enabled;
    
    // Hash password if provided
    if (password) {
      updateData.password = await User.hashPassword(password);
    }
    
    const isUpdated = await User.update(id, updateData);
    
    if (!isUpdated) {
      return res.status(404).json({ result: null, message: 'Không tìm thấy người dùng' });
    }
    
    // Fetch the updated user
    const updatedUser = await User.findById(id);
    res.json({ result: updatedUser, message: null });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ result: null, message: 'Cập nhật người dùng thất bại' });
  }
};

// Delete a user (soft delete)
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    const isDeleted = await User.delete(id);
    
    if (!isDeleted) {
      return res.status(404).json({ result: null, message: 'Không tìm thấy người dùng' });
    }
    
    res.json({ result: true, message: null });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ result: null, message: 'Xóa người dùng thất bại' });
  }
};

// Set user active status
const setUserActiveStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;
    
    if (is_active === undefined) {
      return res.status(400).json({ result: null, message: 'Trường is_active là bắt buộc' });
    }
    
    const isUpdated = await User.setActiveStatus(id, is_active);
    
    if (!isUpdated) {
      return res.status(404).json({ result: null, message: 'Không tìm thấy người dùng' });
    }
    
    res.json({ result: true, message: null });
  } catch (error) {
    console.error('Error updating user active status:', error);
    res.status(500).json({ result: null, message: 'Cập nhật trạng thái người dùng thất bại' });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  setUserActiveStatus
};
