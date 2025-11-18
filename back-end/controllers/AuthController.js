const User = require('../models/User');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { sendPasswordResetEmail, sendWelcomeEmail, sendEmailVerificationEmail } = require('../config/nodemailer');
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
      return res.status(403).json({ 
        result: null, 
        message: 'Tài khoản chưa được kích hoạt. Vui lòng kiểm tra email để xác thực tài khoản.',
        code: 'ACCOUNT_NOT_ACTIVATED'
      });
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
    
    // Create new user with inactive status (requires email verification) and role
    const userData = { 
      name, 
      email, 
      password: hashedPassword, 
      is_active: false,
      role_id: roleId
    };
    
    const newUser = await User.create(userData);
    
    // Generate verification token
    const crypto = require('crypto');
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 86400000); // 24 hours from now
    
    // Save verification token to database
    await User.createEmailVerificationToken(newUser.id, verificationToken, expiresAt);
    
    // Send verification email
    try {
      await sendEmailVerificationEmail(email, verificationToken, name);
      console.log(`Verification email sent to ${email}`);
    } catch (emailError) {
      console.error('Error sending verification email:', emailError);
      // Continue even if email fails - user can request resend
    }
    
    res.status(201).json({
      result: true,
      message: 'Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.'
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

// Verify email
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;
    
    // Validate input
    if (!token) {
      return res.status(400).json({ result: null, message: 'Token xác thực là bắt buộc' });
    }
    
    // Find valid verification token
    const verificationToken = await User.findValidEmailVerificationToken(token);
    
    if (!verificationToken) {
      return res.status(400).json({ result: null, message: 'Token xác thực không hợp lệ hoặc đã hết hạn' });
    }
    
    // Activate user account
    await User.activateAccount(verificationToken.user_id);
    
    // Mark token as used
    await User.markEmailVerificationTokenAsUsed(verificationToken.id);
    
    // Send welcome email
    try {
      await sendWelcomeEmail(verificationToken.email, verificationToken.name);
      console.log(`Welcome email sent to ${verificationToken.email}`);
    } catch (emailError) {
      console.error('Error sending welcome email:', emailError);
      // Continue even if email fails
    }
    
    res.json({ result: true, message: 'Xác thực email thành công! Bạn có thể đăng nhập ngay bây giờ.' });
  } catch (error) {
    console.error('Error during email verification:', error);
    res.status(500).json({ result: null, message: 'Xác thực email thất bại' });
  }
};

// Resend verification email
const resendVerification = async (req, res) => {
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
      return res.json({ result: true, message: 'Nếu email tồn tại, một email xác thực mới đã được gửi.' });
    }
    
    // Check if user is already active
    if (user.is_active) {
      return res.status(400).json({ result: null, message: 'Tài khoản đã được kích hoạt' });
    }
    
    // Generate new verification token
    const crypto = require('crypto');
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 86400000); // 24 hours from now
    
    // Save verification token to database
    await User.createEmailVerificationToken(user.id, verificationToken, expiresAt);
    
    // Send verification email
    try {
      await sendEmailVerificationEmail(user.email, verificationToken, user.name);
      console.log(`Verification email resent to ${user.email}`);
    } catch (emailError) {
      console.error('Error sending verification email:', emailError);
      return res.status(500).json({ result: null, message: 'Không thể gửi email xác thực' });
    }
    
    res.json({ result: true, message: 'Email xác thực đã được gửi lại. Vui lòng kiểm tra hộp thư của bạn.' });
  } catch (error) {
    console.error('Error during resend verification:', error);
    res.status(500).json({ result: null, message: 'Gửi lại email xác thực thất bại' });
  }
};

module.exports = {
  login,
  register,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification
};
