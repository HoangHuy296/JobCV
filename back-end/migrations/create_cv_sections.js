const db = require('../config/db');

console.log('Starting CV Sections migration...');

// Create cv_sections table - Predefined sections library
const createCVSectionsTable = `
CREATE TABLE IF NOT EXISTS cv_sections (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL COMMENT 'Tên section (VD: Sơ bộ bản thân, Kỹ năng)',
  key_name VARCHAR(100) NOT NULL UNIQUE COMMENT 'Key duy nhất (VD: personal_info, skills)',
  description TEXT COMMENT 'Mô tả section',
  icon VARCHAR(50) COMMENT 'Icon name (LuUser, LuBriefcase...)',
  default_fields JSON NOT NULL COMMENT 'Cấu trúc fields mặc định cho section',
  category VARCHAR(50) DEFAULT 'general' COMMENT 'Category: basic, professional, additional',
  is_active BOOLEAN DEFAULT TRUE COMMENT 'Section có được sử dụng không',
  display_order INT DEFAULT 0 COMMENT 'Thứ tự hiển thị',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  modified_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  deleted BOOLEAN DEFAULT FALSE,
  INDEX idx_key_name (key_name),
  INDEX idx_category (category),
  INDEX idx_active (is_active),
  INDEX idx_deleted (deleted)
);
`;

// Create cv_template_sections table - Link templates with sections (without FK constraints)
const createTemplatesSectionsTable = `
CREATE TABLE IF NOT EXISTS cv_template_sections (
  id INT AUTO_INCREMENT PRIMARY KEY,
  template_id INT NOT NULL COMMENT 'ID của template',
  section_id INT NOT NULL COMMENT 'ID của section',
  position JSON NOT NULL COMMENT 'Vị trí section: {x, y, width, height}',
  custom_fields JSON COMMENT 'Fields tùy chỉnh cho section này (override default)',
  is_required BOOLEAN DEFAULT FALSE COMMENT 'Section bắt buộc không được xóa',
  display_order INT DEFAULT 0 COMMENT 'Thứ tự hiển thị trong template',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  modified_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_template_id (template_id),
  INDEX idx_section_id (section_id),
  UNIQUE KEY unique_template_section (template_id, section_id)
);
`;

// Create cv_user_sections table - User's customized sections in their CV
const createUserSectionsTable = `
CREATE TABLE IF NOT EXISTS cv_user_sections (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cv_id INT NOT NULL COMMENT 'ID của CV',
  section_id INT NOT NULL COMMENT 'ID của section gốc',
  position JSON NOT NULL COMMENT 'Vị trí section do user tùy chỉnh: {x, y, width, height}',
  data JSON NOT NULL COMMENT 'Dữ liệu user điền vào section',
  is_visible BOOLEAN DEFAULT TRUE COMMENT 'User có hiển thị section này không',
  display_order INT DEFAULT 0 COMMENT 'Thứ tự do user sắp xếp',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  modified_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (cv_id) REFERENCES cvs(id) ON DELETE CASCADE,
  FOREIGN KEY (section_id) REFERENCES cv_sections(id) ON DELETE CASCADE,
  INDEX idx_cv_id (cv_id),
  INDEX idx_section_id (section_id)
);
`;

// Insert default sections
const insertDefaultSections = `
INSERT INTO cv_sections (name, key_name, description, icon, default_fields, category, display_order) VALUES
('Sơ bộ bản thân', 'personal_info', 'Thông tin cá nhân cơ bản: tên, email, số điện thoại, địa chỉ', 'LuUser', 
  JSON_OBJECT(
    'fields', JSON_ARRAY(
      JSON_OBJECT('id', 'avatar', 'type', 'image', 'label', 'Ảnh đại diện', 'required', false),
      JSON_OBJECT('id', 'full_name', 'type', 'text', 'label', 'Họ và tên', 'placeholder', 'Nguyễn Văn A', 'required', true),
      JSON_OBJECT('id', 'email', 'type', 'email', 'label', 'Email', 'placeholder', 'example@email.com', 'required', true),
      JSON_OBJECT('id', 'phone', 'type', 'tel', 'label', 'Số điện thoại', 'placeholder', '0123456789', 'required', true),
      JSON_OBJECT('id', 'address', 'type', 'text', 'label', 'Địa chỉ', 'placeholder', 'Hà Nội, Việt Nam', 'required', false),
      JSON_OBJECT('id', 'goal', 'type', 'text', 'label', 'Mục tiêu nghề nghiệp', 'required', false)
    )
  ),
  'basic', 1),

('Sở thích', 'hobbies', 'Sở thích cá nhân', 'LuHeart',
  JSON_OBJECT(
    'fields', JSON_ARRAY(
      JSON_OBJECT('id', 'hobbies_info', 'type', 'richtext', 'label', 'Sở thích', 'placeholder', 'Đọc sách, du lịch...', 'required', false)
    )
  ),
  'additional', 2),

('Học vấn', 'education', 'Trình độ học vấn và bằng cấp', 'LuGraduationCap',
  JSON_OBJECT(
    'fields', JSON_ARRAY(
      JSON_OBJECT('id', 'education_info', 'type', 'richtext', 'label', 'Học vấn', 'placeholder', 'Trường, chuyên ngành, thời gian...', 'required', false)
    )
  ),
  'professional', 3),

('Kỹ năng', 'skills', 'Các kỹ năng chuyên môn và kỹ năng mềm', 'LuWrench',
  JSON_OBJECT(
    'fields', JSON_ARRAY(
      JSON_OBJECT('id', 'technical_skills', 'type', 'richtext', 'label', 'Kỹ năng chuyên môn', 'placeholder', 'JavaScript, React, Node.js...', 'required', false),
      JSON_OBJECT('id', 'soft_skills', 'type', 'richtext', 'label', 'Kỹ năng mềm', 'placeholder', 'Làm việc nhóm, giao tiếp...', 'required', false)
    )
  ),
  'professional', 4),

('Kinh nghiệm làm việc', 'work_experience', 'Lịch sử làm việc và kinh nghiệm', 'LuBriefcase',
  JSON_OBJECT(
    'fields', JSON_ARRAY(
      JSON_OBJECT('id', 'experiences', 'type', 'richtext', 'label', 'Kinh nghiệm làm việc', 'placeholder', 'Liệt kê các vị trí đã làm việc...', 'required', false)
    )
  ),
  'professional', 5),

('Người tham chiếu', 'references', 'Thông tin người tham chiếu', 'LuUsers',
  JSON_OBJECT(
    'fields', JSON_ARRAY(
      JSON_OBJECT('id', 'references_info', 'type', 'richtext', 'label', 'Người tham chiếu', 'placeholder', 'Tên, vị trí, liên hệ...', 'required', false)
    )
  ),
  'additional', 6)
ON DUPLICATE KEY UPDATE 
  name=VALUES(name),
  description=VALUES(description),
  icon=VALUES(icon),
  default_fields=VALUES(default_fields),
  category=VALUES(category),
  display_order=VALUES(display_order);
`;

async function runMigration() {
  try {
    // Create cv_sections table
    await db.query(createCVSectionsTable);
    console.log('✓ cv_sections table created or already exists');
    
    // Create cv_template_sections table
    await db.query(createTemplatesSectionsTable);
    console.log('✓ cv_template_sections table created or already exists');
    
    // Create cv_user_sections table
    await db.query(createUserSectionsTable);
    console.log('✓ cv_user_sections table created or already exists');
    
    // Insert default sections
    await db.query(insertDefaultSections);
    console.log('✓ Default sections inserted');
    
    console.log('\n✅ CV Sections migration completed successfully');
    console.log('📝 Sections available:');
    console.log('   - Sơ bộ bản thân (personal_info)');
    console.log('   - Mục tiêu nghề nghiệp (career_objective)');
    console.log('   - Kỹ năng (skills)');
    console.log('   - Kinh nghiệm làm việc (work_experience)');
    console.log('   - Học vấn (education)');
    console.log('   - Chứng chỉ (certifications)');
    console.log('   - Dự án (projects)');
    console.log('   - Sở thích (hobbies)');
    console.log('   - Người tham chiếu (references)');
    
    // Close the connection
    await db.end();
  } catch (error) {
    console.error('❌ Error during migration:', error);
    process.exit(1);
  }
}

// Run the migration
runMigration();
