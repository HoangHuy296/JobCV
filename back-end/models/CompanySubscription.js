const db = require('../config/db');

class CompanySubscription {
  constructor(id, user_id, company_id, created_at) {
    this.id = id;
    this.user_id = user_id;
    this.company_id = company_id;
    this.created_at = created_at;
  }

  // Subscribe to a company
  static async subscribeToCompany(userId, companyId) {
    try {
      // Check if already subscribed
      const checkQuery = 'SELECT id FROM company_subscriptions WHERE user_id = ? AND company_id = ?';
      const [existingSubscription] = await db.query(checkQuery, [userId, companyId]);
      
      if (existingSubscription.length > 0) {
        throw new Error('Bạn đã đăng ký theo dõi công ty này rồi');
      }
      
      // Create subscription
      const insertQuery = 'INSERT INTO company_subscriptions (user_id, company_id) VALUES (?, ?)';
      await db.query(insertQuery, [userId, companyId]);
      
      return true;
    } catch (error) {
      throw error;
    }
  }

  // Unsubscribe from a company
  static async unsubscribeFromCompany(userId, companyId) {
    try {
      // Check if subscription exists
      const checkQuery = 'SELECT id FROM company_subscriptions WHERE user_id = ? AND company_id = ?';
      const [existingSubscription] = await db.query(checkQuery, [userId, companyId]);
      
      if (existingSubscription.length === 0) {
        throw new Error('Bạn chưa đăng ký theo dõi công ty này');
      }
      
      // Delete subscription
      const deleteQuery = 'DELETE FROM company_subscriptions WHERE user_id = ? AND company_id = ?';
      await db.query(deleteQuery, [userId, companyId]);
      
      return true;
    } catch (error) {
      throw error;
    }
  }

  // Check subscription status
  static async checkSubscriptionStatus(userId, companyId) {
    try {
      const checkQuery = 'SELECT id FROM company_subscriptions WHERE user_id = ? AND company_id = ?';
      const [subscription] = await db.query(checkQuery, [userId, companyId]);
      
      return subscription.length > 0;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = CompanySubscription;
