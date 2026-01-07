const db = require('../config/db');

async function up() {
  console.log('Creating api_keys table...');
  
  try {
    // Create api_keys table
    await db.query(`
      CREATE TABLE IF NOT EXISTS api_keys (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        provider VARCHAR(50) NOT NULL DEFAULT 'gemini',
        api_key TEXT NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        usage_count INT DEFAULT 0,
        last_used_at DATETIME NULL,
        daily_limit INT DEFAULT 1500,
        daily_usage INT DEFAULT 0,
        last_reset_date DATE NULL,
        priority INT DEFAULT 0,
        notes TEXT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        modified_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at DATETIME NULL,
        deleted BOOLEAN DEFAULT FALSE,
        INDEX idx_provider (provider),
        INDEX idx_is_active (is_active),
        INDEX idx_priority (priority),
        INDEX idx_deleted (deleted)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    console.log('api_keys table created successfully');
    
    // Insert default key from settings if exists
    console.log('Checking for existing GEMINI_API_KEY in settings...');
    const [settings] = await db.query(
      "SELECT setting_value FROM settings WHERE setting_key = 'GEMINI_API_KEY' AND setting_group = 'AI' AND deleted_at IS NULL LIMIT 1"
    );
    
    if (settings.length > 0 && settings[0].setting_value) {
      console.log('Migrating existing GEMINI_API_KEY to api_keys table...');
      await db.query(`
        INSERT INTO api_keys (name, provider, api_key, is_active, priority, notes, created_at, modified_at)
        VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, [
        'Default Gemini Key',
        'gemini',
        settings[0].setting_value,
        true,
        1,
        'Migrated from settings table'
      ]);
      console.log('Default key migrated successfully');
    } else {
      console.log('No existing GEMINI_API_KEY found in settings');
    }
    
    console.log('Migration completed successfully');
    await db.end();
  } catch (error) {
    console.error('Error during migration:', error);
    await db.end();
    process.exit(1);
  }
}

// Run migration
up();
