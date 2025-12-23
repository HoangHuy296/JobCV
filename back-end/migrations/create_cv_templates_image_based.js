const db = require('../config/db');

console.log('Starting CV templates migration (IMAGE-BASED ONLY)...');

// Create cv_templates table - IMAGE-BASED ONLY
const createCVTemplatesTable = `
CREATE TABLE IF NOT EXISTS cv_templates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL COMMENT 'Tên template',
  description TEXT COMMENT 'Mô tả template',
  thumbnail_url VARCHAR(500) NOT NULL COMMENT 'URL hình ảnh template (bắt buộc)',
  category VARCHAR(100) DEFAULT 'general' COMMENT 'Danh mục: professional, modern, creative, general',
  structure JSON NOT NULL COMMENT 'Cấu trúc fields: {fields: [{id, type, label, x, y, width, height, ...}]}',
  layout VARCHAR(50) DEFAULT 'image-based' COMMENT 'Luôn là image-based',
  is_published BOOLEAN DEFAULT FALSE COMMENT 'Đã publish cho user sử dụng',
  is_premium BOOLEAN DEFAULT FALSE COMMENT 'Template premium',
  usage_count INT DEFAULT 0 COMMENT 'Số lần được sử dụng',
  created_by INT COMMENT 'Admin tạo template',
  is_public BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  modified_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  deleted BOOLEAN DEFAULT FALSE,
  INDEX idx_category (category),
  INDEX idx_published (is_published),
  INDEX idx_layout (layout),
  INDEX idx_created_by (created_by),
  INDEX idx_deleted (deleted),
  INDEX idx_created_at (created_at)
);
`;

// Update cvs table to support templates
const addTemplateIdColumn = `ALTER TABLE cvs ADD COLUMN template_id INT COMMENT 'ID của template được sử dụng'`;
const addTemplateDataColumn = `ALTER TABLE cvs ADD COLUMN template_data JSON COMMENT 'Dữ liệu user điền vào các fields'`;
const addTemplateIdIndex = `ALTER TABLE cvs ADD INDEX idx_template_id (template_id)`;

async function runMigration() {
  try {
    // Create cv_templates table
    await db.query(createCVTemplatesTable);
    console.log('✓ CV templates table created or already exists');
    
    // Update cvs table - add columns one by one
    try {
      await db.query(addTemplateIdColumn);
      console.log('✓ Added template_id column to cvs table');
    } catch (error) {
      if (error.errno === 1060) { // ER_DUP_FIELDNAME
        console.log('  template_id column already exists, skipping...');
      } else {
        throw error;
      }
    }
    
    try {
      await db.query(addTemplateDataColumn);
      console.log('✓ Added template_data column to cvs table');
    } catch (error) {
      if (error.errno === 1060) { // ER_DUP_FIELDNAME
        console.log('  template_data column already exists, skipping...');
      } else {
        throw error;
      }
    }
    
    try {
      await db.query(addTemplateIdIndex);
      console.log('✓ Added idx_template_id index to cvs table');
    } catch (error) {
      if (error.errno === 1061) { // ER_DUP_KEYNAME
        console.log('  idx_template_id index already exists, skipping...');
      } else {
        throw error;
      }
    }
    
    console.log('\n✅ All CV template tables created successfully');
    console.log('📝 Note: Admin can now create image-based templates from the admin panel');
    
    // Close the connection
    await db.end();
  } catch (error) {
    console.error('❌ Error during migration:', error);
    process.exit(1);
  }
}

// Run the migration
runMigration();
