const db = require('../config/db');

// Define foreign key constraints as individual queries for better control and error handling
const foreignKeyConstraints = [
  // First add non-circular constraints
  {
    name: 'fk_companies_created_by',
    query: `ALTER TABLE companies 
            ADD CONSTRAINT fk_companies_created_by 
            FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE`
  },
  {
    name: 'fk_company_industries_company_id',
    query: `ALTER TABLE company_industries 
            ADD CONSTRAINT fk_company_industries_company_id 
            FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE`
  },
  {
    name: 'fk_company_industries_industry_id',
    query: `ALTER TABLE company_industries 
            ADD CONSTRAINT fk_company_industries_industry_id 
            FOREIGN KEY (industry_id) REFERENCES industries(id) ON DELETE CASCADE`
  },
  {
    name: 'fk_jobs_created_by',
    query: `ALTER TABLE jobs 
            ADD CONSTRAINT fk_jobs_created_by 
            FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE`
  },
  {
    name: 'fk_jobs_company_id',
    query: `ALTER TABLE jobs 
            ADD CONSTRAINT fk_jobs_company_id 
            FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE`
  },
  {
    name: 'fk_jobs_industry_id',
    query: `ALTER TABLE jobs 
            ADD CONSTRAINT fk_jobs_industry_id 
            FOREIGN KEY (industry_id) REFERENCES industries(id) ON DELETE CASCADE`
  },
  {
    name: 'fk_password_reset_tokens_user_id',
    query: `ALTER TABLE password_reset_tokens 
            ADD CONSTRAINT fk_password_reset_tokens_user_id 
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE`
  },
  {
    name: 'fk_cvs_user_id',
    query: `ALTER TABLE cvs 
            ADD CONSTRAINT fk_cvs_user_id 
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE`
  },
  {
    name: 'fk_job_reviews_job_id',
    query: `ALTER TABLE job_reviews 
            ADD CONSTRAINT fk_job_reviews_job_id 
            FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE`
  },
  {
    name: 'fk_job_reviews_reviewer_id',
    query: `ALTER TABLE job_reviews 
            ADD CONSTRAINT fk_job_reviews_reviewer_id 
            FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE`
  },
  {
    name: 'fk_job_reviews_job_version_id',
    query: `ALTER TABLE job_reviews 
            ADD CONSTRAINT fk_job_reviews_job_version_id 
            FOREIGN KEY (job_version_id) REFERENCES job_versions(id) ON DELETE CASCADE`
  },
  {
    name: 'fk_job_versions_job_id',
    query: `ALTER TABLE job_versions 
            ADD CONSTRAINT fk_job_versions_job_id 
            FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE`
  },
  {
    name: 'fk_jobs_current_version_id',
    query: `ALTER TABLE jobs 
            ADD CONSTRAINT fk_jobs_current_version_id 
            FOREIGN KEY (current_version_id) REFERENCES job_versions(id) ON DELETE SET NULL`
  },
  {
    name: 'fk_job_reports_job_id',
    query: `ALTER TABLE job_reports 
            ADD CONSTRAINT fk_job_reports_job_id 
            FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE`
  },
  {
    name: 'fk_job_reports_user_id',
    query: `ALTER TABLE job_reports 
            ADD CONSTRAINT fk_job_reports_user_id 
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL`
  },
  {
    name: 'fk_job_likes_job_id',
    query: `ALTER TABLE job_likes 
            ADD CONSTRAINT fk_job_likes_job_id 
            FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE`
  },
  {
    name: 'fk_job_likes_user_id',
    query: `ALTER TABLE job_likes 
            ADD CONSTRAINT fk_job_likes_user_id 
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE`
  },
  // Handle circular dependencies last
  {
    name: 'fk_media_created_by',
    query: `ALTER TABLE media 
            ADD CONSTRAINT fk_media_created_by 
            FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL`
  },
  {
    name: 'fk_users_image_id',
    query: `ALTER TABLE users 
            ADD CONSTRAINT fk_users_image_id 
            FOREIGN KEY (image_id) REFERENCES media(id) ON DELETE SET NULL`
  },
  {
    name: 'fk_companies_logo_id',
    query: `ALTER TABLE companies 
            ADD CONSTRAINT fk_companies_logo_id 
            FOREIGN KEY (logo_id) REFERENCES media(id) ON DELETE SET NULL`
  }
];

// Execute queries sequentially to handle dependencies properly
async function executeQueries() {
  console.log('Starting to add foreign key constraints...');
  
  for (let i = 0; i < foreignKeyConstraints.length; i++) {
    const constraint = foreignKeyConstraints[i];
    try {
      console.log(`Attempting to add constraint: ${constraint.name}`);
      
      try {
        await db.query(constraint.query);
        console.log(`Successfully added constraint: ${constraint.name}`);
      } catch (err) {
        // Check if constraint already exists
        if (err.code === 'ER_DUP_KEYNAME') {
          console.log(`Constraint ${constraint.name} already exists. Skipping.`);
        } else {
          console.error(`Error adding constraint ${constraint.name}:`, err.message);
          // Continue with next constraint instead of stopping
        }
      }
    } catch (error) {
      console.error(`Unexpected error with constraint ${constraint.name}:`, error);
    }
  }
  
  console.log('All foreign key constraints processed');
  // Close the connection only after all queries are done
  await db.end();
}

// Start the process
executeQueries();
