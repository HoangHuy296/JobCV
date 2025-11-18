const Notification = require('../models/Notification');

// Get all notifications for current user with optional filter
const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    const filter = req.query.filter || 'all'; // 'all', 'read', 'unread'

    let notifications;
    let total;

    if (filter === 'unread') {
      notifications = await Notification.findUnreadByUser(userId);
      // Apply pagination manually for unread
      total = notifications.length;
      notifications = notifications.slice(offset, offset + limit);
    } else if (filter === 'read') {
      notifications = await Notification.findReadByUser(userId, limit, offset);
      total = await Notification.countRead(userId);
    } else {
      // 'all' - get all notifications
      notifications = await Notification.findByUser(userId, limit, offset);
      total = await Notification.countByUser(userId);
    }

    const unreadCount = await Notification.countUnread(userId);

    res.json({
      result: {
        notifications,
        unreadCount,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      },
      message: null
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ result: null, message: 'Lấy danh sách thông báo thất bại' });
  }
};

// Get unread notifications
const getUnreadNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const notifications = await Notification.findUnreadByUser(userId);

    res.json({ result: notifications, message: null });
  } catch (error) {
    console.error('Error fetching unread notifications:', error);
    res.status(500).json({ result: null, message: 'Lấy thông báo chưa đọc thất bại' });
  }
};

// Get unread count
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const count = await Notification.countUnread(userId);

    res.json({ result: count, message: null });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ result: null, message: 'Đếm thông báo chưa đọc thất bại' });
  }
};

// Mark notification as read
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const success = await Notification.markAsRead(parseInt(id), userId);

    if (!success) {
      return res.status(404).json({ result: null, message: 'Không tìm thấy thông báo' });
    }

    res.json({ result: true, message: null });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ result: null, message: 'Đánh dấu đã đọc thất bại' });
  }
};

// Mark all notifications as read
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const count = await Notification.markAllAsRead(userId);

    res.json({ result: count, message: null });
  } catch (error) {
    console.error('Error marking all as read:', error);
    res.status(500).json({ result: null, message: 'Đánh dấu tất cả đã đọc thất bại' });
  }
};

// Delete notification
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const success = await Notification.delete(parseInt(id), userId);

    if (!success) {
      return res.status(404).json({ result: null, message: 'Không tìm thấy thông báo' });
    }

    res.json({ result: true, message: null });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ result: null, message: 'Xóa thông báo thất bại' });
  }
};

// Delete all read notifications
const deleteAllRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const count = await Notification.deleteAllRead(userId);

    res.json({ result: count, message: null });
  } catch (error) {
    console.error('Error deleting read notifications:', error);
    res.status(500).json({ result: null, message: 'Xóa thông báo đã đọc thất bại' });
  }
};

// Create notification (admin only)
const createNotification = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role?.name !== 'admin') {
      return res.status(403).json({ result: null, message: 'Chỉ quản trị viên mới có thể tạo thông báo' });
    }

    const { user_id, title, message, type, link } = req.body;

    if (!user_id || !title || !message) {
      return res.status(400).json({ result: null, message: 'User ID, tiêu đề và nội dung là bắt buộc' });
    }

    // Validate user_id is a number
    const targetUserId = parseInt(user_id);
    if (isNaN(targetUserId)) {
      return res.status(400).json({ 
        result: null, 
        message: 'User ID phải là số hợp lệ' 
      });
    }

    const notification = await Notification.create({
      user_id: targetUserId,
      title,
      message,
      type: type || 'info',
      link: link || null
    });

    console.log(`[NotificationController] Created notification ${notification.id} for user ${targetUserId}`);

    // Send WebSocket notification to the user
    const notificationWS = req.app.get('notificationWS');
    if (notificationWS) {
      console.log(`[NotificationController] Sending WebSocket notification to user ${targetUserId}`);
      
      // Log connected users for debugging
      notificationWS.logConnectedUsers();
      
      const sent = notificationWS.sendToUser(targetUserId, notification);
      
      if (sent) {
        console.log(`[NotificationController] ✓ WebSocket notification delivered to user ${targetUserId}`);
      } else {
        console.log(`[NotificationController] ✗ User ${targetUserId} not connected. Notification saved to database.`);
      }
    } else {
      console.warn(`[NotificationController] WebSocket not available. Notification saved to database only.`);
    }

    res.status(201).json({
      result: notification,
      message: null
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ result: null, message: 'Tạo thông báo thất bại' });
  }
};

module.exports = {
  getNotifications,
  getUnreadNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllRead,
  createNotification
};
