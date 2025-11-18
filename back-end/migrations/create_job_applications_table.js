/**
 * Migration to create job_applications table
 * Allows users to apply for jobs with their CV
 */

const db = require('../config/db');

const createJobApplicationsTable = `
CREATE TABLE IF NOT EXISTS job_applications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  job_id INT NOT NULL,
  user_id INT NOT NULL,
  cv_id INT NULL,
  cover_letter TEXT,
  status ENUM('pending', 'reviewing', 'shortlisted', 'rejected', 'accepted') DEFAULT 'pending',
  applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  reviewed_at DATETIME NULL,
  reviewed_by INT NULL,
  notes TEXT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  modified_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_application (job_id, user_id),
  INDEX idx_job_id (job_id),
  INDEX idx_user_id (user_id),
  INDEX idx_cv_id (cv_id),
  INDEX idx_status (status),
  INDEX idx_applied_at (applied_at),
  INDEX idx_reviewed_by (reviewed_by)
);
`;

async function runMigration() {
  try {
    console.log('Creating job_applications table...');
    
    await db.query(createJobApplicationsTable);
    console.log('✓ Job applications table created or already exists');
    
    console.log('Job applications table migration completed successfully!');
    await db.end();
  } catch (error) {
    console.error('Error during job applications migration:', error);
    process.exit(1);
  }
}

runMigration();
