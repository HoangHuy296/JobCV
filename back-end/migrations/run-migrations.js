const fs = require('fs');
const path = require('path');

// Get all migration files
const migrationsDir = __dirname;
const allMigrationFiles = fs.readdirSync(migrationsDir)
  .filter(file => file.endsWith('.js') && file !== 'run-migrations.js');

// Sort to ensure proper order:
// 1. Base tables first (system, business, user_and_business)
// 2. CV templates and sections (must be before their foreign keys)
// 3. Other tables
// 4. Foreign key constraints last
const migrationFiles = [
  ...allMigrationFiles.filter(file => 
    file.includes('system') || 
    file.includes('business') || 
    file.includes('user_and_business')
  ),
  ...allMigrationFiles.filter(file => 
    (file.includes('cv_templates') || file.includes('cv_sections')) &&
    !file.includes('foreign')
  ),
  ...allMigrationFiles.filter(file => 
    !file.includes('foreign') && 
    !file.includes('system') && 
    !file.includes('business') && 
    !file.includes('user_and_business') &&
    !file.includes('cv_templates') &&
    !file.includes('cv_sections')
  ),
  ...allMigrationFiles.filter(file => file.includes('foreign'))
];

console.log('Found migration files:', migrationFiles);

// Function to run a migration
function runMigration(file) {
  return new Promise((resolve, reject) => {
    console.log(`Running migration: ${file}`);
    
    // Use child process to run each migration
    const { spawn } = require('child_process');
    const migrationPath = path.join(migrationsDir, file);
    
    const child = spawn('node', [migrationPath], { stdio: 'inherit' });
    
    child.on('close', (code) => {
      if (code === 0) {
        console.log(`Migration ${file} completed successfully`);
        resolve();
      } else {
        console.error(`Migration ${file} failed with code ${code}`);
        reject(new Error(`Migration ${file} failed`));
      }
    });
    
    child.on('error', (error) => {
      console.error(`Error running migration ${file}:`, error);
      reject(error);
    });
  });
}

// Run all migrations sequentially
async function runAllMigrations() {
  console.log('Starting migrations...');
  
  try {
    for (const file of migrationFiles) {
      await runMigration(file);
    }
    
    console.log('All migrations completed successfully!');
  } catch (error) {
    console.error('Migration process failed:', error);
    process.exit(1);
  }
}

// Run migrations
runAllMigrations();
