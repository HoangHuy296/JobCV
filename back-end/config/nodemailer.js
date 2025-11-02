const nodemailer = require('nodemailer');
const Setting = require('../models/Setting');

// Create transporter using settings from database
const createTransporter = async () => {
  try {
    const emailService = await Setting.getValue('EMAIL_SERVICE', 'EMAIL', 'gmail');
    const emailUser = await Setting.getValue('EMAIL_USER', 'EMAIL', '');
    const emailPassword = await Setting.getValue('EMAIL_APP_PASSWORD', 'EMAIL', '');

    if (!emailUser || !emailPassword) {
      throw new Error('Email configuration not found in settings. Please configure EMAIL_USER and EMAIL_APP_PASSWORD.');
    }

    return nodemailer.createTransporter({
      service: emailService,
      auth: {
        user: emailUser,
        pass: emailPassword
      }
    });
  } catch (error) {
    console.error('Error creating email transporter:', error);
    throw error;
  }
};

// Send password reset email
const sendPasswordResetEmail = async (email, resetToken, userName) => {
  try {
    // Fetch required settings
    const [
      transporter,
      frontendUrl,
      emailUser,
      subject,
      body
    ] = await Promise.all([
      createTransporter(),
      Setting.getValue('FRONTEND_URL', 'DOMAIN', 'http://localhost:3000'),
      Setting.getValue('EMAIL_USER', 'EMAIL', ''),
      Setting.getValue('EMAIL_RESET_SUBJECT', 'EMAIL_TEMPLATE', 'Đặt lại mật khẩu - Job-CV'),
      Setting.getValue('EMAIL_RESET_BODY', 'EMAIL_TEMPLATE', 'Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn trên Job-CV Platform.')
    ]);

    const resetUrl = `${frontendUrl}/dat-lai-mat-khau?token=${resetToken}`;
    
    const mailOptions = {
      from: `"Job-CV Platform" <${emailUser}>`,
      to: email,
      subject: subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f9f9f9;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: white;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .button {
              display: inline-block;
              padding: 15px 30px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
              font-weight: bold;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              color: #666;
              font-size: 12px;
            }
            .warning {
              background-color: #fff3cd;
              border-left: 4px solid #ffc107;
              padding: 15px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Đặt Lại Mật Khẩu</h1>
            </div>
            <div class="content">
              <p>Xin chào <strong>${userName}</strong>,</p>
              
              <p>${body}</p>
              
              <p>Nhấp vào nút bên dưới để đặt lại mật khẩu của bạn:</p>
              
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Đặt Lại Mật Khẩu</a>
              </div>
              
              <p>Hoặc sao chép và dán liên kết sau vào trình duyệt của bạn:</p>
              <p style="word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 5px;">
                ${resetUrl}
              </p>
              
              <div class="warning">
                <strong>⚠️ Lưu ý quan trọng:</strong>
                <ul>
                  <li>Liên kết này sẽ hết hạn sau <strong>1 giờ</strong></li>
                  <li>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này</li>
                  <li>Không chia sẻ liên kết này với bất kỳ ai</li>
                </ul>
              </div>
              
              <p>Nếu bạn gặp bất kỳ vấn đề nào, vui lòng liên hệ với đội ngũ hỗ trợ của chúng tôi.</p>
              
              <p>Trân trọng,<br>
              <strong>Đội ngũ Job-CV</strong></p>
            </div>
            <div class="footer">
              <p>Email này được gửi tự động. Vui lòng không trả lời email này.</p>
              <p>&copy; ${new Date().getFullYear()} Job-CV Platform. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
};

// Send welcome email (optional)
const sendWelcomeEmail = async (email, userName) => {
  try {
    // Fetch required settings
    const [
      transporter,
      frontendUrl,
      emailUser,
      subject,
      body
    ] = await Promise.all([
      createTransporter(),
      Setting.getValue('FRONTEND_URL', 'DOMAIN', 'http://localhost:3000'),
      Setting.getValue('EMAIL_USER', 'EMAIL', ''),
      Setting.getValue('EMAIL_WELCOME_SUBJECT', 'EMAIL_TEMPLATE', 'Chào mừng đến với Job-CV! 🎉'),
      Setting.getValue('EMAIL_WELCOME_BODY', 'EMAIL_TEMPLATE', 'Cảm ơn bạn đã đăng ký tài khoản tại Job-CV Platform!')
    ]);
    
    const mailOptions = {
      from: `"Job-CV Platform" <${emailUser}>`,
      to: email,
      subject: subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f9f9f9;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: white;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .button {
              display: inline-block;
              padding: 15px 30px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Chào Mừng Đến Với Job-CV!</h1>
            </div>
            <div class="content">
              <p>Xin chào <strong>${userName}</strong>,</p>
              
              <p>${body}</p>
              
              <p>Bạn có thể bắt đầu:</p>
              <ul>
                <li>Tạo CV chuyên nghiệp với công cụ thiết kế của chúng tôi</li>
                <li>Tìm kiếm công việc phù hợp</li>
                <li>Theo dõi các công ty yêu thích</li>
                <li>Ứng tuyển vào các vị trí mơ ước</li>
              </ul>
              
              <div style="text-align: center;">
                <a href="${frontendUrl}/dang-nhap" class="button">Đăng Nhập Ngay</a>
              </div>
              
              <p>Chúc bạn thành công!</p>
              
              <p>Trân trọng,<br>
              <strong>Đội ngũ Job-CV</strong></p>
            </div>
          </div>
        </body>
        </html>
      `
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    // Don't throw error for welcome email - it's not critical
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendPasswordResetEmail,
  sendWelcomeEmail
};
