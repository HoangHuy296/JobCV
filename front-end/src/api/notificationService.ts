import api from './index';

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'job' | 'campaign' | 'review' | 'system';
  link: string | null;
  is_read: boolean;
  created_at: string;
  read_at: string | null;
}

// Get all notifications with optional filter
export const getNotifications = async (
  page: number = 1, 
  limit: number = 50, 
  filter: 'all' | 'read' | 'unread' = 'all'
): Promise<{
  notifications: Notification[];
  unreadCount: number;
  pagination: { page: number; limit: number; total: number };
}> => {
  try {
    const response = await api.get(`/notifications?page=${page}&limit=${limit}&filter=${filter}`);
    return response.data.result;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

// Get unread notifications
export const getUnreadNotifications = async (): Promise<Notification[]> => {
  try {
    const response = await api.get('/notifications/unread');
    return response.data.result;
  } catch (error) {
    console.error('Error fetching unread notifications:', error);
    throw error;
  }
};

// Get unread count
export const getUnreadCount = async (): Promise<number> => {
  try {
    const response = await api.get('/notifications/unread/count');
    return response.data.result;
  } catch (error) {
    console.error('Error fetching unread count:', error);
    throw error;
  }
};

// Mark notification as read
export const markAsRead = async (id: number): Promise<boolean> => {
  try {
    const response = await api.put(`/notifications/${id}/read`);
    return response.data.result;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

// Mark all as read
export const markAllAsRead = async (): Promise<number> => {
  try {
    const response = await api.put('/notifications/read-all');
    return response.data.result;
  } catch (error) {
    console.error('Error marking all as read:', error);
    throw error;
  }
};

// Delete notification
export const deleteNotification = async (id: number): Promise<boolean> => {
  try {
    const response = await api.delete(`/notifications/${id}`);
    return response.data.result;
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};

// Delete all read notifications
export const deleteAllRead = async (): Promise<number> => {
  try {
    const response = await api.delete('/notifications/read/all');
    return response.data.result;
  } catch (error) {
    console.error('Error deleting read notifications:', error);
    throw error;
  }
};

// Create notification (admin only)
export const createNotification = async (notificationData: {
  user_id: number;
  title: string;
  message: string;
  type?: string;
  link?: string;
}): Promise<Notification> => {
  try {
    const response = await api.post('/notifications', notificationData);
    return response.data.result;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};
