const nodemailer = require('nodemailer');
const Setting = require('../models/Setting');

// Create transporter using settings from database
const createTransporter = async () => {
  try {
    const emailService = await Setting.getValue('EMAIL_SERVICE', 'EMAIL', 'gmail');
    const emailUser = await Setting.getValue('EMAIL_USER', 'EMAIL', '');
    const emailPassword = await Setting.getValue('EMAIL_APP_PASSWORD', 'EMAIL', '');

    if (!emailUser || !emailPassword) {
      console.warn('Email configuration not found in settings. Skipping email sending.');
      return null;
    }

    return nodemailer.createTransport({
      service: emailService || 'gmail',
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

    if (!transporter) {
      console.warn('Email transporter unavailable. Password reset email will not be sent.');
      return { success: false, skipped: true, reason: 'EMAIL_NOT_CONFIGURED' };
    }

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

    if (!transporter) {
      console.warn('Email transporter unavailable. Welcome email will not be sent.');
      return { success: false, skipped: true, reason: 'EMAIL_NOT_CONFIGURED' };
    }
    
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

// Send email verification email
const sendEmailVerificationEmail = async (email, verificationToken, userName) => {
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
      Setting.getValue('EMAIL_VERIFICATION_SUBJECT', 'EMAIL_TEMPLATE', 'Xác thực tài khoản - Job-CV'),
      Setting.getValue('EMAIL_VERIFICATION_BODY', 'EMAIL_TEMPLATE', 'Cảm ơn bạn đã đăng ký tài khoản tại Job-CV Platform! Vui lòng xác thực email của bạn để hoàn tất quá trình đăng ký.')
    ]);

    if (!transporter) {
      console.warn('Email transporter unavailable. Verification email will not be sent.');
      return { success: false, skipped: true, reason: 'EMAIL_NOT_CONFIGURED' };
    }

    const verificationUrl = `${frontendUrl}/xac-thuc-email?token=${verificationToken}`;
    
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
              background-color: #e3f2fd;
              border-left: 4px solid #2196f3;
              padding: 15px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✉️ Xác Thực Email</h1>
            </div>
            <div class="content">
              <p>Xin chào <strong>${userName}</strong>,</p>
              
              <p>${body}</p>
              
              <p>Nhấp vào nút bên dưới để xác thực email của bạn:</p>
              
              <div style="text-align: center;">
                <a href="${verificationUrl}" class="button">Xác Thực Email</a>
              </div>
              
              <p>Hoặc sao chép và dán liên kết sau vào trình duyệt của bạn:</p>
              <p style="word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 5px;">
                ${verificationUrl}
              </p>
              
              <div class="warning">
                <strong>📌 Lưu ý:</strong>
                <ul>
                  <li>Liên kết này sẽ hết hạn sau <strong>24 giờ</strong></li>
                  <li>Bạn cần xác thực email để có thể đăng nhập vào hệ thống</li>
                  <li>Nếu bạn không đăng ký tài khoản này, vui lòng bỏ qua email này</li>
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
    console.log('Email verification email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email verification email:', error);
    throw error;
  }
};

// Send application confirmation email to user
const sendApplicationConfirmationEmail = async (userEmail, userName, jobTitle) => {
  try {
    const [
      transporter,
      frontendUrl,
      emailUser
    ] = await Promise.all([
      createTransporter(),
      Setting.getValue('FRONTEND_URL', 'DOMAIN', 'http://localhost:3000'),
      Setting.getValue('EMAIL_USER', 'EMAIL', '')
    ]);

    if (!transporter) {
      console.warn('Email transporter unavailable. Application confirmation email will not be sent.');
      return { success: false, skipped: true, reason: 'EMAIL_NOT_CONFIGURED' };
    }

    const mailOptions = {
      from: `"Job-CV Platform" <${emailUser}>`,
      to: userEmail,
      subject: 'Ứng tuyển thành công',
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
            .footer {
              text-align: center;
              margin-top: 20px;
              color: #666;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Ứng Tuyển Thành Công</h1>
            </div>
            <div class="content">
              <p>Xin chào <strong>${userName}</strong>,</p>
              
              <p>Bạn đã ứng tuyển thành công vào công việc <strong>"${jobTitle}"</strong>.</p>
              
              <p>Chúng tôi sẽ thông báo cho bạn khi có cập nhật về đơn ứng tuyển.</p>
              
              <p>Chúc bạn thành công!</p>
              
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
    console.log('Application confirmation email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending application confirmation email:', error);
    return { success: false, error: error.message };
  }
};

// Send new application notification email to recruiter
const sendNewApplicationEmail = async (recruiterEmail, recruiterName, applicantName, jobTitle) => {
  try {
    const [
      transporter,
      frontendUrl,
      emailUser
    ] = await Promise.all([
      createTransporter(),
      Setting.getValue('FRONTEND_URL', 'DOMAIN', 'http://localhost:3000'),
      Setting.getValue('EMAIL_USER', 'EMAIL', '')
    ]);

    if (!transporter) {
      console.warn('Email transporter unavailable. New application email will not be sent.');
      return { success: false, skipped: true, reason: 'EMAIL_NOT_CONFIGURED' };
    }

    const mailOptions = {
      from: `"Job-CV Platform" <${emailUser}>`,
      to: recruiterEmail,
      subject: 'Ứng viên mới ứng tuyển',
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
            .footer {
              text-align: center;
              margin-top: 20px;
              color: #666;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📋 Ứng Viên Mới</h1>
            </div>
            <div class="content">
              <p>Xin chào <strong>${recruiterName}</strong>,</p>
              
              <p><strong>${applicantName}</strong> đã ứng tuyển vào công việc <strong>"${jobTitle}"</strong>.</p>
              
              <p>Vui lòng đăng nhập vào hệ thống để xem chi tiết đơn ứng tuyển và hồ sơ của ứng viên.</p>
              
              <div style="text-align: center; margin: 20px 0;">
                <a href="${frontendUrl}/nha-tuyen-dung/quan-ly-cong-viec" style="display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Xem Đơn Ứng Tuyển</a>
              </div>
              
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
    console.log('New application email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending new application email:', error);
    return { success: false, error: error.message };
  }
};

// Send job closed notification email to applicant
const sendJobClosedEmail = async (applicantEmail, applicantName, jobTitle) => {
  try {
    const [
      transporter,
      frontendUrl,
      emailUser
    ] = await Promise.all([
      createTransporter(),
      Setting.getValue('FRONTEND_URL', 'DOMAIN', 'http://localhost:3000'),
      Setting.getValue('EMAIL_USER', 'EMAIL', '')
    ]);

    if (!transporter) {
      console.warn('Email transporter unavailable. Job closed email will not be sent.');
      return { success: false, skipped: true, reason: 'EMAIL_NOT_CONFIGURED' };
    }

    const mailOptions = {
      from: `"Job-CV Platform" <${emailUser}>`,
      to: applicantEmail,
      subject: 'Công việc đã đóng',
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
            .footer {
              text-align: center;
              margin-top: 20px;
              color: #666;
              font-size: 12px;
            }
            .info-box {
              background-color: #e3f2fd;
              border-left: 4px solid #2196f3;
              padding: 15px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔒 Công Việc Đã Đóng</h1>
            </div>
            <div class="content">
              <p>Xin chào <strong>${applicantName}</strong>,</p>
              
              <p>Công việc <strong>"${jobTitle}"</strong> đã đóng.</p>
              
              <div class="info-box">
                <strong>📌 Thông tin:</strong>
                <p>Đơn ứng tuyển của bạn đang được xem xét. Chúng tôi sẽ thông báo cho bạn khi có kết quả.</p>
              </div>
              
              <p>Cảm ơn bạn đã quan tâm đến vị trí này!</p>
              
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
    console.log('Job closed email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending job closed email:', error);
    return { success: false, error: error.message };
  }
};

// Send threshold reached notification email to recruiter
const sendThresholdReachedEmail = async (recruiterEmail, recruiterName, jobTitle, maxApplicants, autoCloseEnabled) => {
  try {
    const [
      transporter,
      frontendUrl,
      emailUser
    ] = await Promise.all([
      createTransporter(),
      Setting.getValue('FRONTEND_URL', 'DOMAIN', 'http://localhost:3000'),
      Setting.getValue('EMAIL_USER', 'EMAIL', '')
    ]);

    if (!transporter) {
      console.warn('Email transporter unavailable. Threshold reached email will not be sent.');
      return { success: false, skipped: true, reason: 'EMAIL_NOT_CONFIGURED' };
    }

    const subject = autoCloseEnabled ? 'Công việc đã tự động đóng' : 'Đạt ngưỡng ứng viên';
    const message = autoCloseEnabled
      ? `Công việc "${jobTitle}" đã được tự động đóng sau khi đạt ${maxApplicants} ứng viên.`
      : `Công việc "${jobTitle}" đã đạt ngưỡng ${maxApplicants} ứng viên.`;

    const mailOptions = {
      from: `"Job-CV Platform" <${emailUser}>`,
      to: recruiterEmail,
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
              <h1>${autoCloseEnabled ? '🔒' : '📊'} ${subject}</h1>
            </div>
            <div class="content">
              <p>Xin chào <strong>${recruiterName}</strong>,</p>
              
              <div class="warning">
                <strong>⚠️ Thông báo:</strong>
                <p>${message}</p>
              </div>
              
              <p>Vui lòng đăng nhập vào hệ thống để quản lý các đơn ứng tuyển và xem xét ứng viên.</p>
              
              <div style="text-align: center; margin: 20px 0;">
                <a href="${frontendUrl}/nha-tuyen-dung/quan-ly-cong-viec" style="display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Quản Lý Ứng Viên</a>
              </div>
              
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
    console.log('Threshold reached email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending threshold reached email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendEmailVerificationEmail,
  sendApplicationConfirmationEmail,
  sendNewApplicationEmail,
  sendJobClosedEmail,
  sendThresholdReachedEmail
};
