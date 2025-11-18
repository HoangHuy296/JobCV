const db = require('../config/db');

// Get admin dashboard statistics
const getAdminDashboardStats = async (req, res) => {
  try {
    // Get total counts
    const [userStats] = await db.query(`
      SELECT 
        COUNT(*) as total_users,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_users,
        SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) as inactive_users,
        SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) as new_users_today
      FROM users 
      WHERE deleted_at IS NULL AND deleted = FALSE
    `);

    const [jobStats] = await db.query(`
      SELECT 
        COUNT(*) as total_jobs,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_jobs,
        SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactive_jobs,
        SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) as new_jobs_today
      FROM jobs 
      WHERE deleted_at IS NULL AND deleted = FALSE
    `);

    const [companyStats] = await db.query(`
      SELECT 
        COUNT(*) as total_companies,
        COUNT(*) as active_companies,
        SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) as new_companies_today
      FROM companies 
      WHERE deleted_at IS NULL AND deleted = FALSE
    `);

    const [cvStats] = await db.query(`
      SELECT 
        COUNT(*) as total_cvs,
        SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) as new_cvs_today
      FROM cvs 
      WHERE deleted_at IS NULL AND deleted = FALSE
    `);

    const [campaignStats] = await db.query(`
      SELECT 
        COUNT(*) as total_campaigns,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_campaigns
      FROM campaigns 
      WHERE deleted_at IS NULL AND deleted = FALSE
    `);

    const [notificationStats] = await db.query(`
      SELECT 
        COUNT(*) as total_notifications,
        SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END) as unread_notifications,
        SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) as notifications_today
      FROM notifications
    `);

    // Get user growth data (last 7 days)
    const [userGrowth] = await db.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM users 
      WHERE deleted_at IS NULL AND deleted = FALSE
        AND created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);

    // Get job growth data (last 7 days)
    const [jobGrowth] = await db.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM jobs 
      WHERE deleted_at IS NULL AND deleted = FALSE
        AND created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);

    // Get user role distribution
    const [roleDistribution] = await db.query(`
      SELECT 
        r.name as role,
        COUNT(u.id) as count
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.deleted_at IS NULL AND u.deleted = FALSE
        AND r.deleted_at IS NULL AND r.deleted = FALSE
      GROUP BY r.name
    `);

    // Get top industries by job count
    const [topIndustries] = await db.query(`
      SELECT 
        i.name as industry,
        COUNT(j.id) as job_count
      FROM industries i
      LEFT JOIN jobs j ON i.id = j.industry_id AND j.deleted_at IS NULL AND j.deleted = FALSE
      WHERE i.deleted_at IS NULL AND i.deleted = FALSE
      GROUP BY i.id, i.name
      ORDER BY job_count DESC
      LIMIT 5
    `);

    // Get recent activities (last 10)
    const [recentActivities] = await db.query(`
      SELECT 
        'user' as type,
        u.name as title,
        u.email as description,
        u.created_at as timestamp
      FROM users u
      WHERE u.deleted_at IS NULL AND u.deleted = FALSE
      UNION ALL
      SELECT 
        'job' as type,
        j.title as title,
        c.name as description,
        j.created_at as timestamp
      FROM jobs j
      LEFT JOIN companies c ON j.company_id = c.id
      WHERE j.deleted_at IS NULL AND j.deleted = FALSE
      UNION ALL
      SELECT 
        'company' as type,
        c.name as title,
        c.location as description,
        c.created_at as timestamp
      FROM companies c
      WHERE c.deleted_at IS NULL AND c.deleted = FALSE
      ORDER BY timestamp DESC
      LIMIT 10
    `);

    res.json({
      result: {
        overview: {
          users: userStats[0],
          jobs: jobStats[0],
          companies: companyStats[0],
          cvs: cvStats[0],
          campaigns: campaignStats[0],
          notifications: notificationStats[0]
        },
        charts: {
          userGrowth,
          jobGrowth,
          roleDistribution,
          topIndustries
        },
        recentActivities
      },
      message: null
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ 
      result: null, 
      message: 'Lỗi khi tải thống kê dashboard' 
    });
  }
};

module.exports = {
  getAdminDashboardStats
};
