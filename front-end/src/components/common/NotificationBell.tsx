import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  type Notification
} from '../../api/notificationService';
import { toast } from 'react-toastify';
import {
  LuBell,
  LuBellRing,
  LuCircleCheck,
  LuTriangleAlert,
  LuCircleX,
  LuBriefcase,
  LuChartPie,
  LuFileCheck,
  LuSettings,
  LuInfo,
  LuX,
  LuLoader
} from 'react-icons/lu';

type FilterType = 'all' | 'unread' | 'read';

const NotificationBell: React.FC = React.memo(() => {
  const navigate = useNavigate();
  const { user } = useUser();
  const isAdmin = user?.role === 'admin';
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('unread');
  const [isChangingTab, setIsChangingTab] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isTabActiveRef = useRef(true);
  const tabChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch notifications based on filter
  const fetchNotifications = useCallback(async (filter: FilterType = activeFilter, showLoading = true, updateCount = true) => {
    try {
      if (showLoading) setLoading(true);
      
      const data = await getNotifications(1, 50, filter);
      setNotifications(data.notifications);
      
      // Only update count if requested (to avoid duplicate calls)
      if (updateCount) {
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Lỗi khi tải thông báo');
    } finally {
      if (showLoading) {
        setLoading(false);
        setIsChangingTab(false);
      }
    }
  }, [activeFilter]);

  // Handle tab change with debouncing
  const handleTabChange = useCallback((filter: FilterType) => {
    if (isChangingTab || filter === activeFilter) return;
    
    // Clear any pending tab change
    if (tabChangeTimeoutRef.current) {
      clearTimeout(tabChangeTimeoutRef.current);
    }
    
    setIsChangingTab(true);
    setActiveFilter(filter);
    
    // Set a timeout to re-enable tab changes if fetch takes too long
    tabChangeTimeoutRef.current = setTimeout(() => {
      setIsChangingTab(false);
    }, 3000); // Fallback timeout
  }, [activeFilter, isChangingTab]);

  // Fetch notifications when filter changes
  useEffect(() => {
    if (isOpen) {
      fetchNotifications(activeFilter);
    }
  }, [activeFilter, isOpen, fetchNotifications]);

  // Track tab visibility for optimized polling
  useEffect(() => {
    const handleVisibilityChange = () => {
      isTabActiveRef.current = !document.hidden;
      if (!document.hidden && isOpen) {
        // Fetch immediately when tab becomes active
        fetchNotifications(activeFilter, false, true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [fetchNotifications, activeFilter, isOpen]);

  // Poll for unread count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const count = await getUnreadCount();
        setUnreadCount(count);
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    };

    fetchUnreadCount();
    
    // Poll for new notifications every 30 seconds (only when tab is active)
    pollIntervalRef.current = setInterval(() => {
      if (isTabActiveRef.current) {
        fetchUnreadCount();
        if (isOpen) {
          fetchNotifications(activeFilter, false, false); // Don't update count, we just did
        }
      }
    }, 30000);
    
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      if (tabChangeTimeoutRef.current) {
        clearTimeout(tabChangeTimeoutRef.current);
      }
    };
  }, [fetchNotifications, activeFilter, isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle notification click
  const handleNotificationClick = useCallback(async (notification: Notification) => {
    try {
      if (!notification.is_read) {
        await markAsRead(notification.id);
        setUnreadCount(prev => Math.max(0, prev - 1));
        setNotifications(prev => 
          prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n)
        );
      }
      
      // Only admins can navigate via notification links
      if (notification.link && isAdmin) {
        navigate(notification.link);
        setIsOpen(false);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, [navigate, isAdmin]);

  // Handle mark all as read
  const handleMarkAllAsRead = useCallback(async () => {
    try {
      await markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast.success('Đã đánh dấu tất cả đã đọc');
      
      // Refresh if on unread tab
      if (activeFilter === 'unread') {
        fetchNotifications('unread');
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Lỗi khi đánh dấu đã đọc');
    }
  }, [activeFilter, fetchNotifications]);

  // Handle delete notification
  const handleDelete = useCallback(async (e: React.MouseEvent, notificationId: number) => {
    e.stopPropagation();
    
    try {
      await deleteNotification(notificationId);
      const deletedNotif = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      if (deletedNotif && !deletedNotif.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      toast.success('Đã xóa thông báo');
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Lỗi khi xóa thông báo');
    }
  }, [notifications]);

  // Memoized notification icon component
  const NotificationIcon = React.memo(({ type }: { type: string }) => {
    const iconConfig = {
      success: {
        bg: 'bg-green-100',
        color: 'text-green-600',
        Icon: LuCircleCheck
      },
      warning: {
        bg: 'bg-yellow-100',
        color: 'text-yellow-600',
        Icon: LuTriangleAlert
      },
      error: {
        bg: 'bg-red-100',
        color: 'text-red-600',
        Icon: LuCircleX
      },
      job: {
        bg: 'bg-blue-100',
        color: 'text-blue-600',
        Icon: LuBriefcase
      },
      campaign: {
        bg: 'bg-purple-100',
        color: 'text-purple-600',
        Icon: LuChartPie
      },
      review: {
        bg: 'bg-indigo-100',
        color: 'text-indigo-600',
        Icon: LuFileCheck
      },
      system: {
        bg: 'bg-gray-100',
        color: 'text-gray-600',
        Icon: LuSettings
      },
      info: {
        bg: 'bg-blue-100',
        color: 'text-blue-600',
        Icon: LuInfo
      }
    };

    const config = iconConfig[type as keyof typeof iconConfig] || iconConfig.info;
    const { Icon } = config;

    return (
      <div className={`flex-shrink-0 w-10 h-10 ${config.bg} rounded-full flex items-center justify-center transition-transform hover:scale-110`}>
        <Icon className={`w-5 h-5 ${config.color}`} />
      </div>
    );
  });

  // Memoized time ago formatter
  const timeAgo = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Vừa xong';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} phút trước`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} giờ trước`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  }, []);

  // Toggle dropdown
  const toggleDropdown = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  // Navigate to all notifications
  const handleViewAll = useCallback(() => {
    navigate('/admin/quan-ly-thong-bao');
    setIsOpen(false);
  }, [navigate]);

  // Memoized badge display
  const unreadBadge = useMemo(() => {
    if (unreadCount === 0) return null;
    return (
      <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full animate-pulse">
        {unreadCount > 99 ? '99+' : unreadCount}
      </span>
    );
  }, [unreadCount]);

  // Memoized notification items
  const notificationItems = useMemo(() => {
    return notifications.map((notification) => (
      <div
        key={notification.id}
        className={`px-4 py-3 hover:bg-gray-50 transition-colors group relative ${
          !notification.is_read ? 'bg-blue-50/30' : ''
        }`}
      >
        <div className="flex gap-3">
          <NotificationIcon type={notification.type} />
          
          <div 
            className={`flex-1 min-w-0 ${
              notification.link && isAdmin ? 'cursor-pointer' : ''
            }`}
            onClick={() => handleNotificationClick(notification)}
          >
            <div className="flex items-start justify-between gap-2">
              <p className={`text-sm font-medium text-gray-900 ${
                !notification.is_read ? 'font-semibold' : ''
              } ${
                notification.link && isAdmin ? 'hover:text-blue-600 transition-colors' : ''
              }`}>
                {notification.title}
                {notification.link && isAdmin && (
                  <span className="ml-1 text-blue-500 text-xs">→</span>
                )}
              </p>
              {!notification.is_read && (
                <span className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full"></span>
              )}
            </div>
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
              {notification.message}
            </p>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-gray-400">
                {timeAgo(notification.created_at)}
              </p>
              {notification.link && isAdmin && (
                <span className="text-xs text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  Nhấn để xem
                </span>
              )}
            </div>
          </div>

          {isAdmin && (
            <button
              onClick={(e) => handleDelete(e, notification.id)}
              className="flex-shrink-0 p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-all cursor-pointer"
              aria-label="Xóa thông báo"
              title="Xóa thông báo"
            >
              <LuX className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    ));
  }, [notifications, handleNotificationClick, handleDelete, timeAgo]);

  // Tab button component
  const TabButton = React.memo(({ 
    filter, 
    label, 
    count 
  }: { 
    filter: FilterType; 
    label: string; 
    count?: number;
  }) => (
    <button
      onClick={() => handleTabChange(filter)}
      disabled={isChangingTab}
      className={`flex-1 px-4 py-2 text-sm font-medium transition-all duration-200 relative ${
        activeFilter === filter
          ? 'text-blue-600 border-b-2 border-blue-600'
          : 'text-gray-600 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300'
      } ${isChangingTab ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span className="flex items-center justify-center gap-1">
        {label}
        {count !== undefined && count > 0 && (
          <span className={`inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold rounded-full ${
            activeFilter === filter
              ? 'bg-blue-100 text-blue-600'
              : 'bg-gray-100 text-gray-600'
          }`}>
            {count > 99 ? '99+' : count}
          </span>
        )}
      </span>
    </button>
  ));

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon */}
      <button
        onClick={toggleDropdown}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg transition-all hover:bg-gray-100 cursor-pointer"
        aria-label="Notifications"
      >
        {unreadCount > 0 ? (
          <LuBellRing className="w-4 h-4 animate-wiggle" />
        ) : (
          <LuBell className="w-4 h-4" />
        )}
        
        {/* Badge */}
        {unreadBadge}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 animate-fade-in">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LuBellRing className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Thông báo</h3>
              </div>
              {notifications.some(n => !n.is_read) && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors cursor-pointer"
                >
                  Đánh dấu tất cả đã đọc
                </button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 bg-white">
            <TabButton filter="unread" label="Chưa đọc" count={unreadCount} />
            <TabButton filter="all" label="Tất cả" />
            <TabButton filter="read" label="Đã đọc" />
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            {loading || isChangingTab ? (
              <div className="flex flex-col justify-center items-center py-12">
                <LuLoader className="w-8 h-8 text-blue-600 animate-spin" />
                <p className="mt-2 text-sm text-gray-500">Đang tải...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-12">
                <LuBell className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-3 text-sm font-medium text-gray-900">
                  {activeFilter === 'unread' && 'Không có thông báo chưa đọc'}
                  {activeFilter === 'read' && 'Không có thông báo đã đọc'}
                  {activeFilter === 'all' && 'Không có thông báo'}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {activeFilter === 'unread' && 'Bạn đã xem hết tất cả thông báo'}
                  {activeFilter === 'read' && 'Chưa có thông báo nào được đánh dấu đã đọc'}
                  {activeFilter === 'all' && 'Chưa có thông báo nào'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notificationItems}
              </div>
            )}
          </div>

          {/* Footer - Only visible to admins */}
          {isAdmin && (
            <div className="px-4 py-3 border-t border-gray-200 text-center bg-gray-50">
              <button
                onClick={handleViewAll}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors cursor-pointer"
              >
                Xem tất cả thông báo
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

NotificationBell.displayName = 'NotificationBell';

export default NotificationBell;
