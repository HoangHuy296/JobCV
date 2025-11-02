const User = require('../models/User');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { sendPasswordResetEmail, sendWelcomeEmail } = require('../config/nodemailer');
require('dotenv').config();

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ result: null, message: 'Email và mật khẩu là bắt buộc' });
    }
    
    // Find user by email
    const user = await User.findByEmail(email);
    
    if (!user) {
      return res.status(401).json({ result: null, message: 'Thông tin đăng nhập không hợp lệ' });
    }
    
    // Check if user is active
    if (!user.is_active) {
      return res.status(401).json({ result: null, message: 'Tài khoản đã bị vô hiệu hóa' });
    }
    
    // Verify password
    const isPasswordValid = await User.verifyPassword(password, user.password);
  
    if (!isPasswordValid) {
      return res.status(401).json({ result: null, message: 'Thông tin đăng nhập không hợp lệ' });
    }
    
    // Get user role information
    const userWithRole = await User.getUserWithRole(user.id);
  
    // Generate JWT token with more user information
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email,
        name: user.name,
        role: userWithRole.role,
        image: userWithRole.image,
        is_active: user.is_active
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '30d' }
    );
    
    res.json({ 
      result: { token },
      message: null
    });
  } catch (error) {
    console.error('Error during login:', error);
    // Provide more specific error messages
    if (error.code === 'ENOENT') {
      return res.status(500).json({ result: null, message: 'Không thể kết nối đến cơ sở dữ liệu' });
    }
    res.status(500).json({ result: null, message: 'Đăng nhập thất bại' });
  }
};

// Register user
const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ result: null, message: 'Tên, email và mật khẩu là bắt buộc' });
    }
    
    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    
    if (existingUser) {
      return res.status(409).json({ result: null, message: 'Người dùng với email này đã tồn tại' });
    }
    
    // Handle role assignment
    let roleId = null;
    if (role) {
      // Import Role model
      const Role = require('../models/Role');
      
      // Validate role - only allow 'user' and 'recruiter'
      if (role !== 'user' && role !== 'recruiter') {
        return res.status(400).json({ result: null, message: 'Vai trò không hợp lệ' });
      }
      
      // Find role by name
      const roleData = await Role.findByName(role);
      if (roleData) {
        roleId = roleData.id;
      }
    }
    
    // Hash the password
    const hashedPassword = await User.hashPassword(password);
    
    // Create new user with default active status and role
    const userData = { 
      name, 
      email, 
      password: hashedPassword, 
      is_active: true,
      role_id: roleId
    };
    
    await User.create(userData);
    
    // Send welcome email
    try {
      await sendWelcomeEmail(email, name);
      console.log(`Welcome email sent to ${email}`);
    } catch (emailError) {
      console.error('Error sending welcome email:', emailError);
      // Continue even if email fails - registration is still successful
    }
    
    res.status(201).json({
      result: true,
      message: null
    });
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ result: null, message: 'Đăng ký người dùng thất bại' });
  }
};

// Forgot password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    // Validate input
    if (!email) {
      return res.status(400).json({ result: null, message: 'Email là bắt buộc' });
    }
    
    // Find user by email
    const user = await User.findByEmail(email);
    
    if (!user) {
      // For security reasons, we don't reveal if the email exists
      return res.json({ result: true, message: null });
    }
    
    // Check if user is active
    if (!user.is_active) {
      // For security reasons, we don't reveal if the email exists
      return res.json({ result: true, message: null });
    }
    
    // Generate reset token
    const crypto = require('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour from now
    
    // Save token to database
    await User.createPasswordResetToken(user.id, resetToken, expiresAt);
    
    // Send password reset email
    try {
      await sendPasswordResetEmail(user.email, resetToken, user.name);
      console.log(`Password reset email sent to ${user.email}`);
    } catch (emailError) {
      console.error('Error sending password reset email:', emailError);
      // Continue even if email fails - token is still valid
      // In production, you might want to handle this differently
    }
    
    res.json({ result: true, message: null });
  } catch (error) {
    console.error('Error during forgot password:', error);
    res.status(500).json({ result: null, message: 'Xử lý yêu cầu quên mật khẩu thất bại' });
  }
};

// Reset password
const resetPassword = async (req, res) => {
  try {
    const { token, password, confirmPassword } = req.body;
    
    // Validate input
    if (!token || !password || !confirmPassword) {
      return res.status(400).json({ result: null, message: 'Token, mật khẩu và xác nhận mật khẩu là bắt buộc' });
    }
    
    if (password !== confirmPassword) {
      return res.status(400).json({ result: null, message: 'Mật khẩu không khớp' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ result: null, message: 'Mật khẩu phải có ít nhất 6 ký tự' });
    }
    
    // Find valid reset token
    const resetToken = await User.findValidPasswordResetToken(token);
    
    if (!resetToken) {
      return res.status(400).json({ result: null, message: 'Token đặt lại không hợp lệ hoặc đã hết hạn' });
    }
    
    const user = await User.findById(resetToken.user_id);
    
    if (!user) {
      return res.status(400).json({ result: null, message: 'Token không hợp lệ hoặc đã hết hạn' });
    }

    // Hash new password
    const hashedPassword = await User.hashPassword(password);
    
    // Update user password
    await User.update(user.id, { password: hashedPassword });
    
    // Mark token as used
    await User.markPasswordResetTokenAsUsed(resetToken.id);
    
    res.json({ result: true, message: null });
  } catch (error) {
    console.error('Error during password reset:', error);
    res.status(500).json({ result: null, message: 'Đặt lại mật khẩu thất bại' });
  }
};

module.exports = {
  login,
  register,
  forgotPassword,
  resetPassword
};
