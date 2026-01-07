const db = require('../config/db');

// Create ai_prompts table
const createAIPromptsTable = `
CREATE TABLE IF NOT EXISTS ai_prompts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  filename VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  category VARCHAR(100) DEFAULT 'general',
  variables JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  modified_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  deleted BOOLEAN DEFAULT FALSE,
  INDEX idx_filename (filename),
  INDEX idx_category (category),
  INDEX idx_deleted (deleted)
);
`;

// Create ai_processes table
const createAIProcessesTable = `
CREATE TABLE IF NOT EXISTS ai_processes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  prompt_id INT DEFAULT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  config JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  modified_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  deleted BOOLEAN DEFAULT FALSE,
  INDEX idx_code (code),
  INDEX idx_is_active (is_active),
  INDEX idx_prompt_id (prompt_id),
  INDEX idx_deleted (deleted)
);
`;

// Execute all queries
const queries = [
  { sql: createAIPromptsTable, name: 'ai_prompts table' },
  { sql: createAIProcessesTable, name: 'ai_processes table' }
];

async function runMigration() {
  try {
    // Execute each query in sequence
    for (const { sql, name } of queries) {
      try {
        await db.query(sql);
        console.log(`${name} created or already exists`);
      } catch (err) {
        console.error(`Error creating ${name}:`, err);
      }
    }
    
    // Insert default data
    await insertDefaultData();
    
    // Close the connection
    await db.end();
  } catch (error) {
    console.error('Error during migration:', error);
    await db.end();
    process.exit(1);
  }
}

// Insert default prompts and processes
async function insertDefaultData() {
  // Insert default prompts
  const defaultPrompts = [
    {
      name: 'CV Information Extraction',
      filename: 'cv-extraction.txt',
      description: 'Extract structured information from CV/Resume images',
      category: 'cv_processing',
      variables: '[]'
    },
    {
      name: 'Job-CV Matching Analysis',
      filename: 'job-matching.txt',
      description: 'Analyze compatibility between candidate and job requirements',
      category: 'matching',
      variables: '["cv_data", "job_data"]'
    },
    {
      name: 'Cover Letter Generation',
      filename: 'cover-letter-generation.txt',
      description: 'Generate professional cover letters',
      category: 'generation',
      variables: '["cv_data", "job_data"]'
    },
    {
      name: 'Job Description Generator',
      filename: 'job-description-generator.txt',
      description: 'Generate comprehensive job descriptions from basic information',
      category: 'generation',
      variables: '["job_title", "company_name", "industry", "location", "years_experienced", "work_hours", "brief_description"]'
    },
    {
      name: 'Job-CV Matching Score',
      filename: 'job-cv-matching.txt',
      description: 'Detailed scoring and analysis of CV-Job compatibility',
      category: 'matching',
      variables: '["job_title", "job_requirements", "job_benefits", "years_experienced", "industry", "location", "cv_data"]'
    },
    {
      name: 'CV Summary Generator',
      filename: 'cv-summary-generator.txt',
      description: 'Generate professional summary for CV',
      category: 'cv_processing',
      variables: '["cv_data"]'
    },
    {
      name: 'CV Improvement Suggestions',
      filename: 'cv-improvement-suggestions.txt',
      description: 'Analyze CV and provide actionable improvement suggestions',
      category: 'cv_processing',
      variables: '["cv_data"]'
    },
    {
      name: 'Company Description Generator',
      filename: 'company-description-generator.txt',
      description: 'Generate professional company descriptions',
      category: 'generation',
      variables: '["company_name", "industry", "location", "company_size", "website", "brief_info"]'
    },
    {
      name: 'Application Ranking',
      filename: 'application-ranking.txt',
      description: 'Rank and analyze multiple job applications',
      category: 'matching',
      variables: '["job_info", "applications_data"]'
    }
  ];

  for (const prompt of defaultPrompts) {
    try {
      // Check if prompt already exists
      const checkQuery = 'SELECT id FROM ai_prompts WHERE filename = ? AND deleted_at IS NULL AND deleted = FALSE';
      const [results] = await db.query(checkQuery, [prompt.filename]);
      
      if (results.length > 0) {
        console.log(`Prompt '${prompt.name}' already exists. Skipping.`);
      } else {
        // Insert the prompt
        const insertQuery = `
          INSERT INTO ai_prompts (name, filename, description, category, variables, created_at, modified_at)
          VALUES (?, ?, ?, ?, ?, NOW(), NOW())
        `;
        await db.query(insertQuery, [
          prompt.name,
          prompt.filename,
          prompt.description,
          prompt.category,
          prompt.variables
        ]);
        console.log(`Inserted prompt: ${prompt.name}`);
      }
    } catch (err) {
      console.error(`Error processing prompt '${prompt.name}':`, err);
    }
  }

  // Insert default processes
  const defaultProcesses = [
    {
      name: 'CV Information Extraction',
      code: 'CV_EXTRACTION',
      description: 'Extract structured information from CV/Resume images using AI',
      filename: 'cv-extraction.txt',
      is_active: true,
      config: '{"model": "gemini-1.5-flash", "temperature": 0.1, "maxTokens": 2048}'
    },
    {
      name: 'Job-CV Matching',
      code: 'JOB_MATCHING',
      description: 'Analyze compatibility between candidate CV and job requirements',
      filename: 'job-matching.txt',
      is_active: false,
      config: '{"model": "gemini-1.5-pro", "temperature": 0.3, "maxTokens": 1024}'
    },
    {
      name: 'Cover Letter Generation',
      code: 'COVER_LETTER_GEN',
      description: 'Generate professional cover letters based on CV and job description',
      filename: 'cover-letter-generation.txt',
      is_active: false,
      config: '{"model": "gemini-1.5-flash", "temperature": 0.7, "maxTokens": 1024}'
    },
    {
      name: 'Job Description Generator',
      code: 'JOB_DESC_GEN',
      description: 'Generate comprehensive job descriptions from basic information',
      filename: 'job-description-generator.txt',
      is_active: true,
      config: '{"model": "gemini-1.5-flash", "temperature": 0.7, "maxTokens": 2048}'
    },
    {
      name: 'Job-CV Matching Score',
      code: 'JOB_CV_SCORE',
      description: 'Detailed scoring and analysis of CV-Job compatibility',
      filename: 'job-cv-matching.txt',
      is_active: true,
      config: '{"model": "gemini-1.5-pro", "temperature": 0.2, "maxTokens": 2048}'
    },
    {
      name: 'CV Summary Generator',
      code: 'CV_SUMMARY_GEN',
      description: 'Generate professional summary for CV',
      filename: 'cv-summary-generator.txt',
      is_active: true,
      config: '{"model": "gemini-1.5-flash", "temperature": 0.5, "maxTokens": 1024}'
    },
    {
      name: 'CV Improvement Suggestions',
      code: 'CV_IMPROVEMENT',
      description: 'Analyze CV and provide actionable improvement suggestions',
      filename: 'cv-improvement-suggestions.txt',
      is_active: true,
      config: '{"model": "gemini-1.5-pro", "temperature": 0.3, "maxTokens": 2048}'
    },
    {
      name: 'Company Description Generator',
      code: 'COMPANY_DESC_GEN',
      description: 'Generate professional company descriptions',
      filename: 'company-description-generator.txt',
      is_active: true,
      config: '{"model": "gemini-1.5-flash", "temperature": 0.7, "maxTokens": 1536}'
    },
    {
      name: 'Application Ranking',
      code: 'APP_RANKING',
      description: 'Rank and analyze multiple job applications',
      filename: 'application-ranking.txt',
      is_active: true,
      config: '{"model": "gemini-1.5-pro", "temperature": 0.2, "maxTokens": 3072}'
    }
  ];

  for (const process of defaultProcesses) {
    try {
      // Check if process already exists
      const checkQuery = 'SELECT id FROM ai_processes WHERE code = ? AND deleted_at IS NULL AND deleted = FALSE';
      const [results] = await db.query(checkQuery, [process.code]);
      
      if (results.length > 0) {
        console.log(`Process '${process.name}' already exists. Skipping.`);
      } else {
        // Get prompt_id from filename
        const getPromptQuery = 'SELECT id FROM ai_prompts WHERE filename = ? AND deleted_at IS NULL AND deleted = FALSE';
        const [promptResults] = await db.query(getPromptQuery, [process.filename]);
        
        const promptId = promptResults.length > 0 ? promptResults[0].id : null;
        
        // Insert the process
        const insertQuery = `
          INSERT INTO ai_processes (name, code, description, prompt_id, is_active, config, created_at, modified_at)
          VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
        `;
        await db.query(insertQuery, [
          process.name,
          process.code,
          process.description,
          promptId,
          process.is_active,
          process.config
        ]);
        console.log(`Inserted process: ${process.name}`);
      }
    } catch (err) {
      console.error(`Error processing process '${process.name}':`, err);
    }
  }
}

// Start the migration
runMigration();
