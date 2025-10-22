/**
 * Migration to create notifications table
 * Notifications for all authenticated users (admin, recruiter, user)
 */

const db = require('../config/db');

const createNotificationsTable = `
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('info', 'success', 'warning', 'error', 'job', 'campaign', 'review', 'system', 'review_request', 'job_approved', 'job_rejected', 'job_report', 'review_canceled', 'report_update') DEFAULT 'info',
  link VARCHAR(500),
  is_read BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  read_at DATETIME NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_is_read (is_read),
  INDEX idx_created_at (created_at),
  INDEX idx_type (type)
);
`;

async function runMigration() {
  try {
    console.log('Creating notifications table...');
    
    await db.query(createNotificationsTable);
    console.log('✓ Notifications table created or already exists');
    
    console.log('Notifications table migration completed successfully!');
    await db.end();
  } catch (error) {
    console.error('Error during notifications migration:', error);
    process.exit(1);
  }
}

runMigration();
