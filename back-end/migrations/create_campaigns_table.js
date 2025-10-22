/**
 * Migration to create campaigns table
 * Campaigns allow recruiters to group multiple jobs together for better organization
 */

const db = require('../config/db');

const createCampaignsTable = `
CREATE TABLE IF NOT EXISTS campaigns (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  status ENUM('draft', 'active', 'paused', 'completed') DEFAULT 'draft',
  company_id INT NOT NULL,
  created_by INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  modified_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  deleted BOOLEAN DEFAULT FALSE,
  INDEX idx_company_id (company_id),
  INDEX idx_created_by (created_by),
  INDEX idx_status (status),
  INDEX idx_start_date (start_date),
  INDEX idx_end_date (end_date),
  INDEX idx_deleted (deleted)
);
`;

const createCampaignJobsTable = `
CREATE TABLE IF NOT EXISTS campaign_jobs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  campaign_id INT NOT NULL,
  job_id INT NOT NULL,
  added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_campaign_job (campaign_id, job_id),
  INDEX idx_campaign_id (campaign_id),
  INDEX idx_job_id (job_id)
);
`;

async function runMigration() {
  try {
    console.log('Creating campaigns tables...');
    
    await db.query(createCampaignsTable);
    console.log('✓ Campaigns table created or already exists');
    
    await db.query(createCampaignJobsTable);
    console.log('✓ Campaign_jobs table created or already exists');
    
    console.log('Campaign tables migration completed successfully!');
    await db.end();
  } catch (error) {
    console.error('Error during campaigns migration:', error);
    process.exit(1);
  }
}

runMigration();
