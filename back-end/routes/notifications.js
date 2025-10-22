const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const {
  getNotifications,
  getUnreadNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllRead,
  createNotification
} = require('../controllers/NotificationController');

// All routes require authentication
router.use(authenticate);

router.get('/', getNotifications);
router.get('/unread', getUnreadNotifications);
router.get('/unread/count', getUnreadCount);
router.put('/:id/read', markAsRead);
router.put('/read-all', markAllAsRead);
router.delete('/:id', deleteNotification);
router.delete('/read/all', deleteAllRead);
router.post('/', createNotification);

module.exports = router;
