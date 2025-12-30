const db = require('../config/db');

console.log('Adding foreign key constraints for CV sections...');

// Add foreign key for cv_template_sections.template_id
const addTemplateSectionTemplateFK = `
ALTER TABLE cv_template_sections 
ADD CONSTRAINT fk_template_sections_template 
FOREIGN KEY (template_id) REFERENCES cv_templates(id) ON DELETE CASCADE;
`;

// Add foreign key for cv_template_sections.section_id
const addTemplateSectionSectionFK = `
ALTER TABLE cv_template_sections 
ADD CONSTRAINT fk_template_sections_section 
FOREIGN KEY (section_id) REFERENCES cv_sections(id) ON DELETE CASCADE;
`;

async function runMigration() {
  try {
    // Add template_id foreign key
    try {
      await db.query(addTemplateSectionTemplateFK);
      console.log('✓ Added foreign key: cv_template_sections.template_id -> cv_templates.id');
    } catch (error) {
      if (error.errno === 1826 || error.errno === 1061) { // FK already exists
        console.log('  Foreign key fk_template_sections_template already exists, skipping...');
      } else {
        throw error;
      }
    }
    
    // Add section_id foreign key
    try {
      await db.query(addTemplateSectionSectionFK);
      console.log('✓ Added foreign key: cv_template_sections.section_id -> cv_sections.id');
    } catch (error) {
      if (error.errno === 1826 || error.errno === 1061) { // FK already exists
        console.log('  Foreign key fk_template_sections_section already exists, skipping...');
      } else {
        throw error;
      }
    }
    
    console.log('\n✅ CV sections foreign keys added successfully');
    
    // Close the connection
    await db.end();
  } catch (error) {
    console.error('❌ Error during migration:', error);
    process.exit(1);
  }
}

// Run the migration
runMigration();
