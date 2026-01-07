const db = require('../config/db');

console.log('Starting migration to layout system...');

/**
 * Migration script to add layout column and remove old position column
 * 
 * This migration:
 * 1. Adds layout column to cv_template_sections
 * 2. Drops old position column from cv_template_sections
 * 3. Adds layout column to cv_user_sections
 * 4. Drops old position column from cv_user_sections
 * 
 * Note: No data migration - old templates will be recreated with new layout system
 */

async function runMigration() {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Step 1: Add layout column to cv_template_sections
    console.log('\n1. Adding layout column to cv_template_sections...');
    try {
      await connection.query(`
        ALTER TABLE cv_template_sections 
        ADD COLUMN layout JSON COMMENT 'Layout info: {row, column_width, min_height}'
      `);
      console.log('✓ Added layout column');
    } catch (error) {
      if (error.errno === 1060) {
        console.log('  layout column already exists, skipping...');
      } else {
        throw error;
      }
    }
    
    // Step 2: Drop old position column from cv_template_sections
    console.log('\n2. Dropping old position column from cv_template_sections...');
    try {
      await connection.query(`
        ALTER TABLE cv_template_sections 
        DROP COLUMN position
      `);
      console.log('✓ Dropped position column');
    } catch (error) {
      if (error.errno === 1091) { // ER_CANT_DROP_FIELD_OR_KEY
        console.log('  position column does not exist, skipping...');
      } else {
        throw error;
      }
    }
    
    // Step 3: Add layout column to cv_user_sections
    console.log('\n3. Adding layout column to cv_user_sections...');
    try {
      await connection.query(`
        ALTER TABLE cv_user_sections 
        ADD COLUMN layout JSON COMMENT 'Layout info: {row, column_width, min_height}'
      `);
      console.log('✓ Added layout column');
    } catch (error) {
      if (error.errno === 1060) {
        console.log('  layout column already exists, skipping...');
      } else {
        throw error;
      }
    }
    
    // Step 4: Drop old position column from cv_user_sections
    console.log('\n4. Dropping old position column from cv_user_sections...');
    try {
      await connection.query(`
        ALTER TABLE cv_user_sections 
        DROP COLUMN position
      `);
      console.log('✓ Dropped position column');
    } catch (error) {
      if (error.errno === 1091) { // ER_CANT_DROP_FIELD_OR_KEY
        console.log('  position column does not exist, skipping...');
      } else {
        throw error;
      }
    }
    
    await connection.commit();
    console.log('\n✅ Migration completed successfully!');
    console.log('\n📝 Summary:');
    console.log('  - Added layout column to cv_template_sections');
    console.log('  - Dropped position column from cv_template_sections');
    console.log('  - Added layout column to cv_user_sections');
    console.log('  - Dropped position column from cv_user_sections');
    console.log('\n⚠️  Note: Old templates need to be recreated with new layout system');
    
  } catch (error) {
    await connection.rollback();
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    connection.release();
    await db.end();
  }
}

// Run migration
runMigration().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
