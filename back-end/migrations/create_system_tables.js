const db = require('../config/db');
const Setting = require('../models/Setting');

// Create roles table
const createRolesTable = `
CREATE TABLE IF NOT EXISTS roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  modified_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  deleted BOOLEAN DEFAULT FALSE,
  INDEX idx_name (name),
  INDEX idx_deleted (deleted)
);
`;

// Create users table
const createUsersTable = `
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role_id INT,
  is_active BOOLEAN DEFAULT TRUE,
  image_id INT NULL,
  email_notifications_enabled BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  modified_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  deleted BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL,
  INDEX idx_name (name),
  INDEX idx_email (email),
  INDEX idx_role_id (role_id),
  INDEX idx_is_active (is_active),
  INDEX idx_created_at (created_at),
  INDEX idx_deleted (deleted),
  INDEX idx_email_notifications_enabled (email_notifications_enabled)
);
`;

// Create password_reset_tokens table
const createPasswordResetTokensTable = `
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_token (token),
  INDEX idx_user_id (user_id),
  INDEX idx_expires_at (expires_at)
);
`;

// Create email_verification_tokens table
const createEmailVerificationTokensTable = `
CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_token (token),
  INDEX idx_user_id (user_id),
  INDEX idx_expires_at (expires_at)
);
`;

// Create media table
const createMediaTable = `
CREATE TABLE IF NOT EXISTS media (
  id INT AUTO_INCREMENT PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  size INT NOT NULL,
  path VARCHAR(500) NOT NULL,
  url VARCHAR(500) NOT NULL,
  created_by INT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  modified_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  deleted BOOLEAN DEFAULT FALSE,
  INDEX idx_filename (filename),
  INDEX idx_original_name (original_name),
  INDEX idx_mime_type (mime_type),
  INDEX idx_created_by (created_by),
  INDEX idx_created_at (created_at),
  INDEX idx_deleted (deleted)
);
`;

// Create settings table
const createSettingsTable = `
CREATE TABLE IF NOT EXISTS settings (
  setting_key VARCHAR(255) NOT NULL,
  setting_group VARCHAR(100) NOT NULL,
  setting_value TEXT,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  modified_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  deleted BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (setting_group, setting_key),
  INDEX idx_setting_group (setting_group),
  INDEX idx_setting_key (setting_key),
  INDEX idx_created_at (created_at),
  INDEX idx_deleted (deleted)
);
`;

// Execute all queries
const queries = [
  { sql: createRolesTable, name: 'roles table' },
  { sql: createUsersTable, name: 'users table' },
  { sql: createPasswordResetTokensTable, name: 'password_reset_tokens table' },
  { sql: createEmailVerificationTokensTable, name: 'email_verification_tokens table' },
  { sql: createMediaTable, name: 'media table' },
  { sql: createSettingsTable, name: 'settings table' }
];

async function runMigration() {
  try {
    // Execute each query in sequence
    for (const { sql, name } of queries) {
      try {
        await db.query(sql);
        console.log(`${name} created or already exists with soft delete functionality`);
        
        // Insert default settings after table creation
        if (name === 'settings table') {
          await insertDefaultSettings();
        }
      } catch (err) {
        console.error(`Error creating ${name}:`, err);
      }
    }
    
    // Insert some default data
    await insertDefaultData();
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  }
}

// Start the migration
runMigration();

// Insert default roles
async function insertDefaultData() {
  // Insert default roles individually, checking if each exists
  const defaultRoles = [
    { name: 'admin', description: 'Administrator with full access' },
    { name: 'user', description: 'Regular user with limited access' },
    { name: 'recruiter', description: 'Recruiter with hiring permissions' }
  ];
  
  for (const role of defaultRoles) {
    try {
      // Check if role already exists
      const checkRoleQuery = 'SELECT id FROM roles WHERE name = ? AND deleted_at IS NULL AND deleted = FALSE';
      const [results] = await db.query(checkRoleQuery, [role.name]);
      
      if (results.length > 0) {
        console.log(`Role '${role.name}' already exists. Skipping.`);
      } else {
        // Insert the role
        const insertRoleQuery = 'INSERT INTO roles (name, description) VALUES (?, ?)';
        await db.query(insertRoleQuery, [role.name, role.description]);
        console.log(`Inserted role: ${role.name}`);
      }
    } catch (err) {
      console.error(`Error processing role '${role.name}':`, err);
    }
  }
  
  // Create default admin user after all roles are processed
  await createDefaultAdminUser();
}

// Create default admin user
async function createDefaultAdminUser() {
  try {
    // Get admin role ID
    const getAdminRoleId = `SELECT id FROM roles WHERE name = 'admin' AND deleted_at IS NULL AND deleted = FALSE LIMIT 1`;
    const [adminRoleResults] = await db.query(getAdminRoleId);
    
    if (adminRoleResults.length === 0) {
      console.error('Admin role not found');
      await db.end();
      return;
    }
    
    const adminRoleId = adminRoleResults[0].id;
    
    // Check if admin user already exists
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@cv.com';
    const checkUserExists = `SELECT id FROM users WHERE email = ? AND deleted_at IS NULL LIMIT 1`;
    
    const [userResults] = await db.query(checkUserExists, [adminEmail]);
    
    if (userResults.length > 0) {
      console.log('Default admin user already exists');
      await db.end();
      return;
    }
    
    // Hash password
    const bcrypt = require('bcrypt');
    const saltRounds = 10;
    
    // Get admin email and password from environment variables or use defaults
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin@@123';
    
    // Use promisify to convert bcrypt.hash to promise-based
    const { promisify } = require('util');
    const hashAsync = promisify(bcrypt.hash);
    
    const hashedPassword = await hashAsync(adminPassword, saltRounds);
    
    // Create admin user
    const createAdminUser = `
      INSERT INTO users (name, email, password, role_id, is_active, created_at, modified_at)
      VALUES (?, ?, ?, ?, ?, NOW(), NOW())
    `;
    
    const adminUserData = [
      'Admin User',
      adminEmail,
      hashedPassword,
      adminRoleId,
      1 // is_active = true
    ];
    
    await db.query(createAdminUser, adminUserData);
    console.log('Default admin user created successfully');
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    console.log('Please change the password after first login');
    
    // Close the connection
    await db.end();
  } catch (err) {
    console.error('Error creating admin user:', err);
    await db.end();
  }
}

// Insert default settings using the Setting model
async function insertDefaultSettings() {
  const defaultSettings = Setting.getDefaultSettings();
  
  let inserted = 0;
  const totalSettings = defaultSettings.length;
  
  for (const setting of defaultSettings) {
    try {
      await Setting.set(setting.key, setting.value, setting.group, setting.description);
      inserted++;
      console.log(`Default setting ${setting.key} in group ${setting.group} inserted or already exists`);
    } catch (err) {
      console.error(`Error inserting default setting ${setting.key}:`, err);
      inserted++;
    }
  }
  
  if (inserted === totalSettings) {
    console.log('All default settings inserted');
  } else {
    console.log('Default settings insertion completed with some errors');
  }
}
