const nodemailer = require('nodemailer');
const Setting = require('../models/Setting');

// Create transporter using SMTP settings
const createTransporter = async () => {
  try {
    console.log('Creating email transporter with SMTP settings');
    
    const emailUser = await Setting.getValue('EMAIL_USER', 'EMAIL', '');
    const emailPassword = await Setting.getValue('EMAIL_APP_PASSWORD', 'EMAIL', '');

    // Lấy thông tin từ setting
    const smtpHost = 'smtp.gmail.com';
    const smtpPort = 587;
    const smtpUser = emailUser;
    const smtpPass = emailPassword;
    
    console.log(`SMTP Server: ${smtpHost}:${smtpPort}`);
    console.log(`SMTP User: ${smtpUser}`);
    
    if (!smtpUser || !smtpPass) {
      console.warn('SMTP user or password is missing');
      return null;
    }
    
    // Tạo transporter với xác thực cơ bản
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort == 465, // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });
    
    // Verify connection
    await transporter.verify();
    console.log('SMTP connection verified successfully');
    
    return transporter;
  } catch (error) {
    console.error('Error creating mail transporter:', error);
    throw error;
  }
};

// Send password reset email
const sendPasswordResetEmail = async (email, resetToken, userName) => {
  try {
    console.log(`[PASSWORD_RESET] ========== START ==========`);
    console.log(`[PASSWORD_RESET] Recipient: ${email}`);
    console.log(`[PASSWORD_RESET] User: ${userName}`);
    console.log(`[PASSWORD_RESET] Token: ${resetToken.substring(0, 10)}...`);
    
    // Create transporter first to fail fast if email not configured
    const transporter = await createTransporter();
    
    if (!transporter) {
      console.warn('[PASSWORD_RESET] ⚠️  Email transporter unavailable - email not configured');
      console.log(`[PASSWORD_RESET] ========== END (SKIPPED) ==========`);
      return { success: false, skipped: true, reason: 'EMAIL_NOT_CONFIGURED' };
    }
    
    console.log(`[PASSWORD_RESET] ✓ Transporter created successfully`);
    
    // Fetch required settings
    const [
      frontendUrl,
      emailUser,
      subject,
      body
    ] = await Promise.all([
      Setting.getValue('FRONTEND_URL', 'DOMAIN', 'http://localhost:3000'),
      Setting.getValue('EMAIL_USER', 'EMAIL', ''),
      Setting.getValue('EMAIL_RESET_SUBJECT', 'EMAIL_TEMPLATE', 'Đặt lại mật khẩu - Job-CV'),
      Setting.getValue('EMAIL_RESET_BODY', 'EMAIL_TEMPLATE', 'Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn trên Job-CV Platform.')
    ]);

    console.log(`[PASSWORD_RESET] Settings loaded:`);
    console.log(`[PASSWORD_RESET]   - Frontend URL: ${frontendUrl}`);
    console.log(`[PASSWORD_RESET]   - Email User: ${emailUser}`);
    console.log(`[PASSWORD_RESET]   - Subject: ${subject}`);

    const resetUrl = `${frontendUrl}/dat-lai-mat-khau?token=${resetToken}`;
    console.log(`[PASSWORD_RESET] Reset URL: ${resetUrl}`);
    
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
    
    console.log(`[PASSWORD_RESET] Sending email...`);
    const info = await transporter.sendMail(mailOptions);
    console.log(`[PASSWORD_RESET] ✓ Email sent successfully!`);
    console.log(`[PASSWORD_RESET]   - Message ID: ${info.messageId}`);
    console.log(`[PASSWORD_RESET]   - Response: ${info.response}`);
    console.log(`[PASSWORD_RESET] ========== END (SUCCESS) ==========`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[PASSWORD_RESET] ✗ FAILED to send email');
    console.error('[PASSWORD_RESET] Error:', error.message);
    console.error('[PASSWORD_RESET] Code:', error.code);
    console.error('[PASSWORD_RESET] Command:', error.command);
    console.log(`[PASSWORD_RESET] ========== END (ERROR) ==========`);
    throw error;
  }
};

// Send welcome email (optional)
const sendWelcomeEmail = async (email, userName) => {
  try {
    console.log(`[WELCOME] ========== START ==========`);
    console.log(`[WELCOME] Recipient: ${email}`);
    console.log(`[WELCOME] User: ${userName}`);
    
    // Create transporter first to fail fast if email not configured
    const transporter = await createTransporter();
    
    if (!transporter) {
      console.warn('[WELCOME] ⚠️  Email transporter unavailable - email not configured');
      console.log(`[WELCOME] ========== END (SKIPPED) ==========`);
      return { success: false, skipped: true, reason: 'EMAIL_NOT_CONFIGURED' };
    }
    
    console.log(`[WELCOME] ✓ Transporter created successfully`);
    
    // Fetch required settings
    const [
      frontendUrl,
      emailUser,
      subject,
      body
    ] = await Promise.all([
      Setting.getValue('FRONTEND_URL', 'DOMAIN', 'http://localhost:3000'),
      Setting.getValue('EMAIL_USER', 'EMAIL', ''),
      Setting.getValue('EMAIL_WELCOME_SUBJECT', 'EMAIL_TEMPLATE', 'Chào mừng đến với Job-CV! 🎉'),
      Setting.getValue('EMAIL_WELCOME_BODY', 'EMAIL_TEMPLATE', 'Cảm ơn bạn đã đăng ký tài khoản tại Job-CV Platform!')
    ]);

    console.log(`[WELCOME] Settings loaded:`);
    console.log(`[WELCOME]   - Frontend URL: ${frontendUrl}`);
    console.log(`[WELCOME]   - Email User: ${emailUser}`);
    
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
    
    console.log(`[WELCOME] Sending email...`);
    const info = await transporter.sendMail(mailOptions);
    console.log(`[WELCOME] ✓ Email sent successfully!`);
    console.log(`[WELCOME]   - Message ID: ${info.messageId}`);
    console.log(`[WELCOME] ========== END (SUCCESS) ==========`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[WELCOME] ✗ FAILED to send email');
    console.error('[WELCOME] Error:', error.message);
    console.error('[WELCOME] Code:', error.code);
    console.log(`[WELCOME] ========== END (ERROR) ==========`);
    // Don't throw error for welcome email - it's not critical
    return { success: false, error: error.message };
  }
};

// Send email verification email
const sendEmailVerificationEmail = async (email, verificationToken, userName) => {
  try {
    console.log(`[VERIFICATION] ========== START ==========`);
    console.log(`[VERIFICATION] Recipient: ${email}`);
    console.log(`[VERIFICATION] User: ${userName}`);
    console.log(`[VERIFICATION] Token: ${verificationToken.substring(0, 10)}...`);
    
    // Create transporter first to fail fast if email not configured
    const transporter = await createTransporter();
    
    if (!transporter) {
      console.warn('[VERIFICATION] ⚠️  Email transporter unavailable - email not configured');
      console.log(`[VERIFICATION] ========== END (SKIPPED) ==========`);
      return { success: false, skipped: true, reason: 'EMAIL_NOT_CONFIGURED' };
    }
    
    console.log(`[VERIFICATION] ✓ Transporter created successfully`);
    
    // Fetch required settings
    const [
      frontendUrl,
      emailUser,
      subject,
      body
    ] = await Promise.all([
      Setting.getValue('FRONTEND_URL', 'DOMAIN', 'http://localhost:3000'),
      Setting.getValue('EMAIL_USER', 'EMAIL', ''),
      Setting.getValue('EMAIL_VERIFICATION_SUBJECT', 'EMAIL_TEMPLATE', 'Xác thực tài khoản - Job-CV'),
      Setting.getValue('EMAIL_VERIFICATION_BODY', 'EMAIL_TEMPLATE', 'Cảm ơn bạn đã đăng ký tài khoản tại Job-CV Platform! Vui lòng xác thực email của bạn để hoàn tất quá trình đăng ký.')
    ]);

    console.log(`[VERIFICATION] Settings loaded:`);
    console.log(`[VERIFICATION]   - Frontend URL: ${frontendUrl}`);
    console.log(`[VERIFICATION]   - Email User: ${emailUser}`);

    const verificationUrl = `${frontendUrl}/xac-thuc-email?token=${verificationToken}`;
    console.log(`[VERIFICATION] Verification URL: ${verificationUrl}`);
    
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
    
    console.log(`[VERIFICATION] Sending email...`);
    const info = await transporter.sendMail(mailOptions);
    console.log(`[VERIFICATION] ✓ Email sent successfully!`);
    console.log(`[VERIFICATION]   - Message ID: ${info.messageId}`);
    console.log(`[VERIFICATION]   - Response: ${info.response}`);
    console.log(`[VERIFICATION] ========== END (SUCCESS) ==========`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[VERIFICATION] ✗ FAILED to send email');
    console.error('[VERIFICATION] Error:', error.message);
    console.error('[VERIFICATION] Code:', error.code);
    console.error('[VERIFICATION] Command:', error.command);
    console.log(`[VERIFICATION] ========== END (ERROR) ==========`);
    throw error;
  }
};

// Send application confirmation email to user
const sendApplicationConfirmationEmail = async (userEmail, userName, jobTitle) => {
  try {
    console.log(`[APP_CONFIRM] ========== START ==========`);
    console.log(`[APP_CONFIRM] Recipient: ${userEmail}`);
    console.log(`[APP_CONFIRM] User: ${userName}`);
    console.log(`[APP_CONFIRM] Job: ${jobTitle}`);
    
    // Create transporter first to fail fast if email not configured
    const transporter = await createTransporter();
    
    if (!transporter) {
      console.warn('[APP_CONFIRM] ⚠️  Email transporter unavailable - email not configured');
      console.log(`[APP_CONFIRM] ========== END (SKIPPED) ==========`);
      return { success: false, skipped: true, reason: 'EMAIL_NOT_CONFIGURED' };
    }
    
    console.log(`[APP_CONFIRM] ✓ Transporter created successfully`);
    
    const [
      frontendUrl,
      emailUser
    ] = await Promise.all([
      Setting.getValue('FRONTEND_URL', 'DOMAIN', 'http://localhost:3000'),
      Setting.getValue('EMAIL_USER', 'EMAIL', '')
    ]);

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

    console.log(`[APP_CONFIRM] Sending email...`);
    const info = await transporter.sendMail(mailOptions);
    console.log(`[APP_CONFIRM] ✓ Email sent successfully!`);
    console.log(`[APP_CONFIRM]   - Message ID: ${info.messageId}`);
    console.log(`[APP_CONFIRM] ========== END (SUCCESS) ==========`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[APP_CONFIRM] ✗ FAILED to send email');
    console.error('[APP_CONFIRM] Error:', error.message);
    console.log(`[APP_CONFIRM] ========== END (ERROR) ==========`);
    return { success: false, error: error.message };
  }
};

// Send new application notification email to recruiter
const sendNewApplicationEmail = async (recruiterEmail, recruiterName, applicantName, jobTitle) => {
  try {
    console.log(`[NEW_APP] ========== START ==========`);
    console.log(`[NEW_APP] Recipient: ${recruiterEmail}`);
    console.log(`[NEW_APP] Recruiter: ${recruiterName}`);
    console.log(`[NEW_APP] Applicant: ${applicantName}`);
    console.log(`[NEW_APP] Job: ${jobTitle}`);
    
    // Create transporter first to fail fast if email not configured
    const transporter = await createTransporter();
    
    if (!transporter) {
      console.warn('[NEW_APP] ⚠️  Email transporter unavailable - email not configured');
      console.log(`[NEW_APP] ========== END (SKIPPED) ==========`);
      return { success: false, skipped: true, reason: 'EMAIL_NOT_CONFIGURED' };
    }
    
    console.log(`[NEW_APP] ✓ Transporter created successfully`);
    
    const [
      frontendUrl,
      emailUser
    ] = await Promise.all([
      Setting.getValue('FRONTEND_URL', 'DOMAIN', 'http://localhost:3000'),
      Setting.getValue('EMAIL_USER', 'EMAIL', '')
    ]);

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

    console.log(`[NEW_APP] Sending email...`);
    const info = await transporter.sendMail(mailOptions);
    console.log(`[NEW_APP] ✓ Email sent successfully!`);
    console.log(`[NEW_APP]   - Message ID: ${info.messageId}`);
    console.log(`[NEW_APP] ========== END (SUCCESS) ==========`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[NEW_APP] ✗ FAILED to send email');
    console.error('[NEW_APP] Error:', error.message);
    console.log(`[NEW_APP] ========== END (ERROR) ==========`);
    return { success: false, error: error.message };
  }
};

// Send job closed notification email to applicant
const sendJobClosedEmail = async (applicantEmail, applicantName, jobTitle) => {
  try {
    console.log(`[JOB_CLOSED] ========== START ==========`);
    console.log(`[JOB_CLOSED] Recipient: ${applicantEmail}`);
    console.log(`[JOB_CLOSED] User: ${applicantName}`);
    console.log(`[JOB_CLOSED] Job: ${jobTitle}`);
    
    // Create transporter first to fail fast if email not configured
    const transporter = await createTransporter();
    
    if (!transporter) {
      console.warn('[JOB_CLOSED] ⚠️  Email transporter unavailable - email not configured');
      console.log(`[JOB_CLOSED] ========== END (SKIPPED) ==========`);
      return { success: false, skipped: true, reason: 'EMAIL_NOT_CONFIGURED' };
    }
    
    console.log(`[JOB_CLOSED] ✓ Transporter created successfully`);
    
    const [
      frontendUrl,
      emailUser
    ] = await Promise.all([
      Setting.getValue('FRONTEND_URL', 'DOMAIN', 'http://localhost:3000'),
      Setting.getValue('EMAIL_USER', 'EMAIL', '')
    ]);

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

    console.log(`[JOB_CLOSED] Sending email...`);
    const info = await transporter.sendMail(mailOptions);
    console.log(`[JOB_CLOSED] ✓ Email sent successfully!`);
    console.log(`[JOB_CLOSED]   - Message ID: ${info.messageId}`);
    console.log(`[JOB_CLOSED] ========== END (SUCCESS) ==========`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[JOB_CLOSED] ✗ FAILED to send email');
    console.error('[JOB_CLOSED] Error:', error.message);
    console.log(`[JOB_CLOSED] ========== END (ERROR) ==========`);
    return { success: false, error: error.message };
  }
};

// Send threshold reached notification email to recruiter
const sendThresholdReachedEmail = async (recruiterEmail, recruiterName, jobTitle, maxApplicants, autoCloseEnabled) => {
  try {
    console.log(`[THRESHOLD] ========== START ==========`);
    console.log(`[THRESHOLD] Recipient: ${recruiterEmail}`);
    console.log(`[THRESHOLD] Recruiter: ${recruiterName}`);
    console.log(`[THRESHOLD] Job: ${jobTitle}`);
    console.log(`[THRESHOLD] Max Applicants: ${maxApplicants}`);
    console.log(`[THRESHOLD] Auto Close: ${autoCloseEnabled}`);
    
    // Create transporter first to fail fast if email not configured
    const transporter = await createTransporter();
    
    if (!transporter) {
      console.warn('[THRESHOLD] ⚠️  Email transporter unavailable - email not configured');
      console.log(`[THRESHOLD] ========== END (SKIPPED) ==========`);
      return { success: false, skipped: true, reason: 'EMAIL_NOT_CONFIGURED' };
    }
    
    console.log(`[THRESHOLD] ✓ Transporter created successfully`);
    
    const [
      frontendUrl,
      emailUser
    ] = await Promise.all([
      Setting.getValue('FRONTEND_URL', 'DOMAIN', 'http://localhost:3000'),
      Setting.getValue('EMAIL_USER', 'EMAIL', '')
    ]);

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

    console.log(`[THRESHOLD] Sending email...`);
    const info = await transporter.sendMail(mailOptions);
    console.log(`[THRESHOLD] ✓ Email sent successfully!`);
    console.log(`[THRESHOLD]   - Message ID: ${info.messageId}`);
    console.log(`[THRESHOLD] ========== END (SUCCESS) ==========`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[THRESHOLD] ✗ FAILED to send email');
    console.error('[THRESHOLD] Error:', error.message);
    console.log(`[THRESHOLD] ========== END (ERROR) ==========`);
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
