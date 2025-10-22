const db = require('../config/db');

// Create industries table
const createIndustriesTable = `
CREATE TABLE IF NOT EXISTS industries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  modified_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  deleted BOOLEAN DEFAULT FALSE,
  INDEX idx_name (name)
);
`;

// Create companies table
const createCompaniesTable = `
CREATE TABLE IF NOT EXISTS companies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  website VARCHAR(255),
  logo_id INT NULL,
  location TEXT NOT NULL,
  employees VARCHAR(255),
  facebook VARCHAR(255),
  youtube VARCHAR(255),
  linkedin VARCHAR(255),
  twitter VARCHAR(255),
  instagram VARCHAR(255),
  created_by INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  modified_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  deleted BOOLEAN DEFAULT FALSE,
  subscription_count INT DEFAULT 0,
  INDEX idx_name (name),
  INDEX idx_created_by (created_by),
  INDEX idx_created_at (created_at),
  INDEX idx_deleted (deleted)
);
`;

// Create company_industries table for many-to-many relationship
const createCompanyIndustriesTable = `
CREATE TABLE IF NOT EXISTS company_industries (
  company_id INT NOT NULL,
  industry_id INT NOT NULL,
  PRIMARY KEY (company_id, industry_id)
);
`;


// Create cvs table
const createCvsTable = `
CREATE TABLE IF NOT EXISTS cvs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  content JSON,
  file_path VARCHAR(500),
  file_name VARCHAR(255),
  file_size INT,
  mime_type VARCHAR(100),
  is_template BOOLEAN DEFAULT FALSE,
  is_published BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  modified_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  deleted BOOLEAN DEFAULT FALSE,
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at),
  INDEX idx_is_template (is_template),
  INDEX idx_is_published (is_published)
);
`;



// Insert default industries if they don't exist
const insertDefaultIndustries = `
  INSERT IGNORE INTO industries (name, description) VALUES 
  ('Công nghệ thông tin', 'Phát triển phần mềm, ứng dụng và hệ thống công nghệ'),
  ('Tài chính - Ngân hàng', 'Ngân hàng, bảo hiểm, chứng khoán và các dịch vụ tài chính'),
  ('Giáo dục - Đào tạo', 'Trường học, trung tâm đào tạo và giáo dục'),
  ('Y tế - Chăm sóc sức khỏe', 'Bệnh viện, phòng khám, dược phẩm'),
  ('Kinh doanh - Bán hàng', 'Bán lẻ, thương mại, kinh doanh'),
  ('Marketing - Truyền thông', 'Quảng cáo, truyền thông, báo chí'),
  ('Xây dựng - Kiến trúc', 'Xây dựng, thiết kế, kiến trúc'),
  ('Kỹ thuật - Cơ khí', 'Sản xuất, cơ khí, kỹ thuật'),
  ('Du lịch - Khách sạn', 'Du lịch, nhà hàng, khách sạn'),
  ('Nhân sự - Hành chính', 'Quản trị nhân sự, hành chính văn phòng'),
  ('Bất động sản', 'Môi giới, phát triển và quản lý bất động sản'),
  ('Ô tô - xe máy', 'Sản xuất, bảo dưỡng và sửa chữa phương tiện giao thông'),
  ('Thương mại điện tử', 'Bán hàng trực tuyến và nền tảng thương mại điện tử'),
  ('Nông nghiệp - Lâm nghiệp', 'Trồng trọt, chăn nuôi và lâm nghiệp'),
  ('Thủy sản', 'Khai thác, nuôi trồng và chế biến thủy sản'),
  ('Dệt may - Da giày', 'Sản xuất quần áo, giày dép và phụ kiện'),
  ('Hóa chất - Dược phẩm', 'Sản xuất hóa chất và dược phẩm'),
  ('Điện - Điện tử', 'Sản xuất thiết bị điện và điện tử'),
  ('Viễn thông', 'Dịch vụ viễn thông và mạng'),
  ('Vận tải - Logistics', 'Vận chuyển hàng hóa và dịch vụ logistics'),
  ('Luật - Pháp lý', 'Dịch vụ tư vấn và hỗ trợ pháp lý'),
  ('Môi trường - Xử lý chất thải', 'Bảo vệ môi trường và xử lý chất thải'),
  ('Năng lượng - Dầu khí', 'Sản xuất và phân phối năng lượng'),
  ('Thực phẩm - Đồ uống', 'Sản xuất và chế biến thực phẩm'),
  ('In ấn - Xuất bản', 'Dịch vụ in ấn và xuất bản'),
  ('Nghệ thuật - Giải trí', 'Sản xuất nội dung và giải trí'),
  ('Thể thao - Sức khỏe', 'Dịch vụ thể thao và chăm sóc sức khỏe'),
  ('Dịch vụ khách hàng', 'Hỗ trợ khách hàng và chăm sóc khách hàng'),
  ('Nghiên cứu - Phát triển', 'Nghiên cứu khoa học và phát triển sản phẩm'),
  ('An ninh - Bảo vệ', 'Dịch vụ an ninh và bảo vệ'),
  ('Công nghệ sinh học', 'Nghiên cứu và phát triển công nghệ sinh học'),
  ('Thời trang', 'Thiết kế, sản xuất và kinh doanh thời trang'),
  ('Tư vấn doanh nghiệp', 'Tư vấn chiến lược và phát triển doanh nghiệp'),
  ('Xuất nhập khẩu', 'Dịch vụ xuất nhập khẩu hàng hóa quốc tế'),
  ('Game - Ứng dụng', 'Phát triển trò chơi và ứng dụng di động'),
  ('Blockchain - Crypto', 'Công nghệ blockchain và tiền điện tử'),
  ('IoT - Internet vạn vật', 'Phát triển thiết bị và giải pháp IoT'),
  ('Trí tuệ nhân tạo', 'Nghiên cứu và phát triển AI và machine learning'),
  ('Bán lẻ', 'Kinh doanh bán lẻ và chuỗi cửa hàng'),
  ('Giáo dục trực tuyến', 'Nền tảng học tập và đào tạo trực tuyến');
`;

// Execute the queries using async/await with promises
async function runMigration() {
  try {
    // Create industries table
    await db.query(createIndustriesTable);
    console.log('Industries table created or already exists with soft delete functionality');
    
    // Insert default industries
    await db.query(insertDefaultIndustries);
    console.log('Default industries inserted or already exist');
    
    // Create companies table
    await db.query(createCompaniesTable);
    console.log('Companies table created or already exists with soft delete functionality');
    
    // Create company_industries table
    await db.query(createCompanyIndustriesTable);
    console.log('Company_Industries table created or already exists');
    
    // Create cvs table
    await db.query(createCvsTable);
    console.log('CVs table created or already exists with soft delete functionality');
    
    console.log('All business tables (industries, companies with subscription_count, company_industries, cvs) created or already exist with soft delete functionality');
    
    // Close the connection
    await db.end();
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  }
}

// Run the migration
runMigration();

