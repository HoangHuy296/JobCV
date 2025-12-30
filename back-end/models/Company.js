class Company {
  constructor(id, name, description, industries, website, location, employees, logo, created_by, created_at, modified_at, deleted_at, facebook, youtube, linkedin, twitter, instagram) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.industries = industries || [];
    this.website = website;
    this.location = location;
    this.employees = employees || '';
    this.logo = logo; // This is now a full logo object, not just an ID
    this.created_by = created_by;
    this.created_at = created_at;
    this.modified_at = modified_at;
    this.deleted_at = deleted_at;
    this.facebook = facebook || '';
    this.youtube = youtube || '';
    this.linkedin = linkedin || '';
    this.twitter = twitter || '';
    this.instagram = instagram || '';
  }

  // Find companies with pagination and filtering
  static async findWithPagination(filters = {}, limit = 10, offset = 0) {
    const db = require('../config/db');
    let query = `
      SELECT c.*, 
             GROUP_CONCAT(ci.industry_id) as industry_ids,
             m.id as logo_id,
             m.filename as logo_filename,
             m.original_name as logo_original_name,
             m.mime_type as logo_mime_type,
             m.size as logo_size,
             m.path as logo_path,
             m.url as logo_url
      FROM companies c
      LEFT JOIN company_industries ci ON c.id = ci.company_id
      LEFT JOIN media m ON c.logo_id = m.id AND m.deleted = FALSE
      WHERE c.deleted_at IS NULL AND c.deleted = FALSE
    `;
    const values = [];
    
    // Add filtering conditions
    if (filters.search) {
      query += ' AND (c.name LIKE ? OR c.description LIKE ?)';
      values.push(`%${filters.search}%`, `%${filters.search}%`);
    }
    
    if (filters.industry) {
      query += ' AND ci.industry_id = ?';
      values.push(filters.industry);
    }
    
    // Group by company to handle the join
    query += ' GROUP BY c.id';
    
    // Add pagination
    query += ' ORDER BY c.created_at DESC LIMIT ? OFFSET ?';
    values.push(limit, offset);
    
    try {
      const [rows] = await db.query(query, values);
      return rows.map(row => {
        // Create logo object if logo data exists
        const logo = row.logo_id ? {
          id: row.logo_id,
          filename: row.logo_filename,
          original_name: row.logo_original_name,
          mime_type: row.logo_mime_type,
          size: row.logo_size,
          path: row.logo_path,
          url: row.logo_url
        } : null;
        
        return new Company(
          row.id,
          row.name,
          row.description,
          row.industry_ids ? row.industry_ids.split(',').map(id => parseInt(id)) : [],
          row.website,
          row.location,
          row.employees,
          logo, // Use the logo object instead of just logo_id
          row.created_by,
          row.created_at,
          row.modified_at,
          row.deleted_at,
          row.facebook || '',
          row.youtube || '',
          row.linkedin || '',
          row.twitter || '',
          row.instagram || ''
        );
      });
    } catch (error) {
      throw error;
    }
  }

  // Count companies with filtering
  static async count(filters = {}) {
    const db = require('../config/db');
    let query = `
      SELECT COUNT(DISTINCT c.id) as count
      FROM companies c
      LEFT JOIN company_industries ci ON c.id = ci.company_id
      WHERE c.deleted_at IS NULL AND c.deleted = FALSE
    `;
    const values = [];
    
    // Add filtering conditions
    if (filters.search) {
      query += ' AND (c.name LIKE ? OR c.description LIKE ?)';
      values.push(`%${filters.search}%`, `%${filters.search}%`);
    }
    
    if (filters.industry) {
      query += ' AND ci.industry_id = ?';
      values.push(filters.industry);
    }
    
    try {
      const [rows] = await db.query(query, values);
      return rows[0].count;
    } catch (error) {
      throw error;
    }
  }

  // Create a new company
  static async create(companyData) {
    const db = require('../config/db');
    const connection = await db.getConnection();
    
    const query = `
      INSERT INTO companies (
        name, description, website, location, employees, facebook, youtube, linkedin, twitter, instagram, logo_id, created_by, deleted
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const values = [
      companyData.name,
      companyData.description || '',
      companyData.website || '',
      companyData.location || '',
      companyData.employees || '',
      companyData.facebook || '',
      companyData.youtube || '',
      companyData.linkedin || '',
      companyData.twitter || '',
      companyData.instagram || '',
      companyData.logo_id,
      companyData.created_by,
      false
    ];
    
    try {
      await connection.beginTransaction();
      
      const [result] = await connection.query(query, values);
      const companyId = result.insertId;
      
      // Insert company industries
      if (companyData.industries && companyData.industries.length > 0) {
        const industryQuery = 'INSERT INTO company_industries (company_id, industry_id) VALUES ?';
        const industryValues = companyData.industries.map(industryId => [companyId, industryId]);
        await connection.query(industryQuery, [industryValues]);
      }
      
      await connection.commit();
      
      // Get the created company with logo information
      return await Company.findById(companyId);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Get all companies
  static async findAll() {
    const db = require('../config/db');
    const query = `
      SELECT c.*, 
             GROUP_CONCAT(ci.industry_id) as industry_ids,
             m.id as logo_id,
             m.filename as logo_filename,
             m.original_name as logo_original_name,
             m.mime_type as logo_mime_type,
             m.size as logo_size,
             m.path as logo_path,
             m.url as logo_url
      FROM companies c
      LEFT JOIN company_industries ci ON c.id = ci.company_id
      LEFT JOIN media m ON c.logo_id = m.id AND m.deleted = FALSE
      WHERE c.deleted_at IS NULL AND c.deleted = FALSE
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `;
    
    try {
      const [rows] = await db.query(query);
      return rows.map(row => {
        // Create logo object if logo data exists
        const logo = row.logo_id ? {
          id: row.logo_id,
          filename: row.logo_filename,
          original_name: row.logo_original_name,
          mime_type: row.logo_mime_type,
          size: row.logo_size,
          path: row.logo_path,
          url: row.logo_url
        } : null;
        
        return new Company(
          row.id,
          row.name,
          row.description,
          row.industry_ids ? row.industry_ids.split(',').map(id => parseInt(id)) : [],
          row.website,
          row.location,
          row.employees,
          logo,
          row.created_by,
          row.created_at,
          row.modified_at,
          row.deleted_at,
          row.facebook || '',
          row.youtube || '',
          row.linkedin || '',
          row.twitter || '',
          row.instagram || ''
        );
      });
    } catch (error) {
      throw error;
    }
  }

  // Find a company by ID
  static async findById(id) {
    const db = require('../config/db');
    const query = `
      SELECT c.*, 
             GROUP_CONCAT(ci.industry_id) as industry_ids,
             m.id as logo_id,
             m.filename as logo_filename,
             m.original_name as logo_original_name,
             m.mime_type as logo_mime_type,
             m.size as logo_size,
             m.path as logo_path,
             m.url as logo_url
      FROM companies c
      LEFT JOIN company_industries ci ON c.id = ci.company_id
      LEFT JOIN media m ON c.logo_id = m.id AND m.deleted = FALSE
      WHERE c.id = ? AND c.deleted_at IS NULL AND c.deleted = FALSE
      GROUP BY c.id
    `;
    
    try {
      const [rows] = await db.query(query, [id]);
      if (rows.length === 0) return null;
      const row = rows[0];
      
      // Create logo object if logo data exists
      const logo = row.logo_id ? {
        id: row.logo_id,
        filename: row.logo_filename,
        original_name: row.logo_original_name,
        mime_type: row.logo_mime_type,
        size: row.logo_size,
        path: row.logo_path,
        url: row.logo_url
      } : null;
      
      return new Company(
        row.id,
        row.name,
        row.description,
        row.industry_ids ? row.industry_ids.split(',').map(id => parseInt(id)) : [],
        row.website,
        row.location,
        row.employees,
        logo,
        row.created_by,
        row.created_at,
        row.modified_at,
        row.deleted_at,
        row.facebook || '',
        row.youtube || '',
        row.linkedin || '',
        row.twitter || '',
        row.instagram || ''
      );
    } catch (error) {
      throw error;
    }
  }

  // Find a company by user ID (creator)
  static async findByUserId(userId) {
    const db = require('../config/db');
    const query = `
      SELECT c.*, 
             GROUP_CONCAT(ci.industry_id) as industry_ids,
             m.id as logo_id,
             m.filename as logo_filename,
             m.original_name as logo_original_name,
             m.mime_type as logo_mime_type,
             m.size as logo_size,
             m.path as logo_path,
             m.url as logo_url
      FROM companies c
      LEFT JOIN company_industries ci ON c.id = ci.company_id
      LEFT JOIN media m ON c.logo_id = m.id AND m.deleted = FALSE
      WHERE c.created_by = ? AND c.deleted_at IS NULL AND c.deleted = FALSE
      GROUP BY c.id
    `;
    
    try {
      const [rows] = await db.query(query, [userId]);
      if (rows.length === 0) return null;
      const row = rows[0];
      
      // Create logo object if logo data exists
      const logo = row.logo_id ? {
        id: row.logo_id,
        filename: row.logo_filename,
        original_name: row.logo_original_name,
        mime_type: row.logo_mime_type,
        size: row.logo_size,
        path: row.logo_path,
        url: row.logo_url
      } : null;
      
      return new Company(
        row.id,
        row.name,
        row.description,
        row.industry_ids ? row.industry_ids.split(',').map(id => parseInt(id)) : [],
        row.website,
        row.location,
        row.employees,
        logo,
        row.created_by,
        row.created_at,
        row.modified_at,
        row.deleted_at,
        row.facebook || '',
        row.youtube || '',
        row.linkedin || '',
        row.twitter || '',
        row.instagram || ''
      );
    } catch (error) {
      throw error;
    }
  }

  // Update a company
  static async update(id, companyData) {
    const db = require('../config/db');
    const connection = await db.getConnection();
    
    const query = `
      UPDATE companies SET 
        name = ?, 
        description = ?, 
        website = ?, 
        location = ?, 
        employees = ?,
        facebook = ?,
        youtube = ?,
        linkedin = ?,
        twitter = ?,
        instagram = ?,
        logo_id = ?,
        modified_at = NOW()
      WHERE id = ? AND deleted_at IS NULL AND deleted = FALSE
    `;
    
    const values = [
      companyData.name,
      companyData.description || '',
      companyData.website || '',
      companyData.location || '',
      companyData.employees || '',
      companyData.facebook || '',
      companyData.youtube || '',
      companyData.linkedin || '',
      companyData.twitter || '',
      companyData.instagram || '',
      companyData.logo_id,
      id
    ];
    
    try {
      await connection.beginTransaction();
      
      // Update company details
      const [result] = await connection.query(query, values);
      
      // Delete existing company industries
      await connection.query('DELETE FROM company_industries WHERE company_id = ?', [id]);
      
      // Insert new company industries
      if (companyData.industries && companyData.industries.length > 0) {
        const industryQuery = 'INSERT INTO company_industries (company_id, industry_id) VALUES ?';
        const industryValues = companyData.industries.map(industryId => [id, industryId]);
        await connection.query(industryQuery, [industryValues]);
      }
      
      await connection.commit();
      
      // Return the updated company with logo information
      return await Company.findById(id);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Delete company (soft delete)
  static async delete(id) {
    const db = require('../config/db');
    const query = 'UPDATE companies SET deleted_at = NOW(), deleted = TRUE WHERE id = ? AND deleted_at IS NULL AND deleted = FALSE';
    
    try {
      const [result] = await db.query(query, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Company;
