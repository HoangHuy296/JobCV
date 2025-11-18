/**
 * Migration to create all job-related tables with versioning support
 * This allows recruiters to submit new versions for review and roll back to previous versions
 */

const db = require('../config/db');

// Create jobs table with versioning support
const createJobsTable = `
CREATE TABLE IF NOT EXISTS jobs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  brief_description TEXT,
  requirement TEXT,
  benefits TEXT,
  salary VARCHAR(255),
  date_end_register DATE,
  years_experienced INT,
  work_hours VARCHAR(255),
  company_id INT NOT NULL,
  industry_id INT NOT NULL,
  location TEXT NOT NULL,
  status ENUM('draft', 'pending_review', 'approved', 'rejected') DEFAULT 'draft',
  created_by INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  modified_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  deleted BOOLEAN DEFAULT FALSE,
  current_version_id INT NULL,
  version_count INT DEFAULT 1,
  is_closed BOOLEAN DEFAULT FALSE,
  max_applicants INT DEFAULT NULL,
  auto_close_on_threshold BOOLEAN DEFAULT FALSE,
  INDEX idx_title (title),
  INDEX idx_company_id (company_id),
  INDEX idx_industry_id (industry_id),
  INDEX idx_status (status),
  INDEX idx_created_by (created_by),
  INDEX idx_created_at (created_at),
  INDEX idx_date_end_register (date_end_register),
  INDEX idx_deleted (deleted),
  INDEX idx_current_version_id (current_version_id),
  INDEX idx_is_closed (is_closed)
);
`;

// Create job_versions table to track all versions of a job
const createJobVersionsTable = `
CREATE TABLE IF NOT EXISTS job_versions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  job_id INT NOT NULL,
  version_number INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  brief_description TEXT,
  requirement TEXT,
  benefits TEXT,
  salary VARCHAR(255),
  date_end_register DATE,
  years_experienced INT,
  work_hours VARCHAR(255),
  company_id INT NOT NULL,
  industry_id INT NOT NULL,
  location TEXT NOT NULL,
  status ENUM('draft', 'pending_review', 'approved', 'rejected', 'archived') DEFAULT 'draft',
  is_live BOOLEAN DEFAULT FALSE,
  created_by INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  modified_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_job_id (job_id),
  INDEX idx_version_number (version_number),
  INDEX idx_status (status),
  INDEX idx_is_live (is_live),
  INDEX idx_created_by (created_by),
  INDEX idx_created_at (created_at)
);
`;

// Create job_reviews table with version support
const createJobReviewsTable = `
CREATE TABLE IF NOT EXISTS job_reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  job_id INT NOT NULL,
  job_version_id INT NOT NULL,
  reviewer_id INT NOT NULL,
  status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  feedback TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_job_id (job_id),
  INDEX idx_job_version_id (job_version_id),
  INDEX idx_reviewer_id (reviewer_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
);
`;

// Create job_reports table
const createJobReportsTable = `
CREATE TABLE IF NOT EXISTS job_reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  job_id INT NOT NULL,
  user_id INT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  report_type ENUM('misleading', 'inappropriate', 'scam', 'duplicate', 'expired', 'other') NOT NULL,
  description TEXT,
  status ENUM('pending', 'reviewed', 'resolved', 'dismissed') NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_job_id (job_id),
  INDEX idx_user_id (user_id),
  INDEX idx_report_type (report_type),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at),
  INDEX idx_email (email)
);
`;

// Create job_likes table
const createJobLikesTable = `
CREATE TABLE IF NOT EXISTS job_likes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  job_id INT NOT NULL,
  user_id INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_job_user (job_id, user_id),
  INDEX idx_job_id (job_id),
  INDEX idx_user_id (user_id)
);
`;

// Create a procedure to migrate existing jobs to the new versioning system
const dropMigrationProcedure = `
DROP PROCEDURE IF EXISTS migrate_existing_jobs_to_versions;
`;

const createMigrationProcedure = `
CREATE PROCEDURE migrate_existing_jobs_to_versions()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE job_id, created_by_val INT;
    DECLARE title_val VARCHAR(255);
    DECLARE brief_desc_val, requirement_val, benefits_val, location_val TEXT;
    DECLARE salary_val, work_hours_val VARCHAR(255);
    DECLARE date_end_val DATE;
    DECLARE years_exp_val INT;
    DECLARE company_id_val, industry_id_val INT;
    DECLARE status_val VARCHAR(20);
    DECLARE created_at_val DATETIME;

    -- Cursor to iterate through all jobs
    DECLARE cur CURSOR FOR
        SELECT id, title, brief_description, requirement, benefits, salary,
               date_end_register, years_experienced, work_hours, company_id,
               industry_id, location, status, created_by, created_at
        FROM jobs
        WHERE deleted = FALSE;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    OPEN cur;

    read_loop: LOOP
        FETCH cur INTO job_id, title_val, brief_desc_val, requirement_val,
                      benefits_val, salary_val, date_end_val, years_exp_val,
                      work_hours_val, company_id_val, industry_id_val,
                      location_val, status_val, created_by_val, created_at_val;

        IF done THEN
            LEAVE read_loop;
        END IF;

        -- Insert into job_versions
        -- Only set is_live = TRUE if the job status is 'approved'
        INSERT INTO job_versions (
            job_id, version_number, title, brief_description, requirement,
            benefits, salary, date_end_register, years_experienced,
            work_hours, company_id, industry_id, location, status,
            is_live, created_by, created_at
        ) VALUES (
            job_id, 1, title_val, brief_desc_val, requirement_val,
            benefits_val, salary_val, date_end_val, years_exp_val,
            work_hours_val, company_id_val, industry_id_val, location_val,
            status_val, IF(status_val = 'approved', TRUE, FALSE), created_by_val, created_at_val
        );

        -- Update the job with its current version
        UPDATE jobs
        SET current_version_id = LAST_INSERT_ID(),
            version_count = 1
        WHERE id = job_id;

        -- Migrate any existing reviews to reference the version
        UPDATE job_reviews
        SET job_version_id = LAST_INSERT_ID()
        WHERE job_id = job_id;
    END LOOP;

    CLOSE cur;
END;
`;

// Execute the queries using async/await with promises
console.log('Starting job tables creation with versioning support...');

async function runMigration() {
  try {
    // Create jobs table
    await db.query(createJobsTable);
    console.log('Jobs table created or already exists with versioning support');
    
    // Create job_versions table
    await db.query(createJobVersionsTable);
    console.log('Job_versions table created or already exists');
    
    // Create job_reviews table
    await db.query(createJobReviewsTable);
    console.log('Job_reviews table created or already exists');
    
    // Create job_reports table
    await db.query(createJobReportsTable);
    console.log('Job_reports table created or already exists');
    
    // Create job_likes table
    await db.query(createJobLikesTable);
    console.log('Job_likes table created or already exists');
    
    // Drop existing migration procedure if it exists
    await db.query(dropMigrationProcedure);
    console.log('Dropped existing migration procedure if it existed');
    
    // Create migration procedure
    await db.query(createMigrationProcedure);
    console.log('Migration procedure created');
    
    // Call the migration procedure to migrate existing jobs
    await db.query('CALL migrate_existing_jobs_to_versions()');
    console.log('Existing jobs migrated to versioning system');
    
    console.log('All job-related tables (jobs, job_versions, job_reviews, job_reports, job_likes) created successfully with versioning support');
    
    // Close the connection
    await db.end();
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  }
}

// Run the migration
runMigration();
