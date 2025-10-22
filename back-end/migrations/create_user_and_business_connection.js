const db = require('../config/db');

// Create company_subscriptions table for user-company subscriptions
const createCompanySubscriptionsTable = `
CREATE TABLE IF NOT EXISTS company_subscriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  company_id INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_subscription (user_id, company_id),
  INDEX idx_user_id (user_id),
  INDEX idx_company_id (company_id)
);
`;

// Create job_likes table for user-job likes
const createJobLikesTable = `
CREATE TABLE IF NOT EXISTS job_likes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  job_id INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_like (user_id, job_id),
  INDEX idx_user_id (user_id),
  INDEX idx_job_id (job_id)
);
`;

// Create trigger to increment subscription_count when a user subscribes to a company
const createIncrementSubscriptionTrigger = `
CREATE TRIGGER increment_company_subscription_count
AFTER INSERT ON company_subscriptions
FOR EACH ROW
BEGIN
  UPDATE companies 
  SET subscription_count = subscription_count + 1 
  WHERE id = NEW.company_id;
END;
`;

// Create trigger to decrement subscription_count when a user unsubscribes from a company
const createDecrementSubscriptionTrigger = `
CREATE TRIGGER decrement_company_subscription_count
AFTER DELETE ON company_subscriptions
FOR EACH ROW
BEGIN
  UPDATE companies 
  SET subscription_count = GREATEST(0, subscription_count - 1) 
  WHERE id = OLD.company_id;
END;
`;

// Execute the queries using async/await with promises
async function runMigration() {
  try {
    // Create company_subscriptions table
    try {
      await db.query(createCompanySubscriptionsTable);
      console.log('Company_subscriptions table created or already exists');
    } catch (err) {
      console.error('Error creating company_subscriptions table:', err);
    }
    
    // Create job_likes table
    try {
      await db.query(createJobLikesTable);
      console.log('Job_likes table created or already exists');
    } catch (err) {
      console.error('Error creating job_likes table:', err);
    }
    
    // Create increment subscription trigger
    try {
      await db.query(createIncrementSubscriptionTrigger);
      console.log('Increment subscription trigger created successfully');
    } catch (err) {
      // Check if it's a trigger already exists error
      if (err.code === 'ER_TRG_ALREADY_EXISTS' || err.message.includes('trigger already exists')) {
        console.log('Increment subscription trigger already exists');
      } else {
        console.error('Error creating increment subscription trigger:', err);
      }
    }
    
    // Create decrement subscription trigger
    try {
      await db.query(createDecrementSubscriptionTrigger);
      console.log('Decrement subscription trigger created successfully');
    } catch (err) {
      // Check if it's a trigger already exists error
      if (err.code === 'ER_TRG_ALREADY_EXISTS' || err.message.includes('trigger already exists')) {
        console.log('Decrement subscription trigger already exists');
      } else {
        console.error('Error creating decrement subscription trigger:', err);
      }
    }
    
    console.log('User and business connection tables and triggers created or already exist: company_subscriptions, job_likes tables and subscription count triggers');
    
    // Close the connection
    await db.end();
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  }
}

// Run the migration
runMigration();
