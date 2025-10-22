import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { toast } from 'react-toastify';
import DataManagement from '../../../components/core/DataManagement';
import SelectWithSearch from '../../../components/common/SelectWithSearch';
import { userService } from '../../../api/userService';
import { 
  getNotifications, 
  createNotification, 
  deleteNotification,
  markAsRead,
  type Notification 
} from '../../../api/notificationService';

interface User {
  id: number;
  name: string;
  email: string;
}


const NotificationManagement: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const hasFetchedData = useRef(false);
  
  // Pagination and filtering state
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  // Optimized fetch function with useCallback
  const fetchData = useCallback(async (page: number = 1, reset: boolean = false) => {
    try {
      setLoading(true);
      
      // Reset filters and pagination if requested
      if (reset) {
        setSearchTerm('');
        setTypeFilter('all');
        page = 1;
      }
      
      // Use getNotifications with filter parameter
      const filter = reset || typeFilter === 'all' ? 'all' : (typeFilter as 'all' | 'read' | 'unread');
      const notificationsResponse = await getNotifications(
        page, 
        pagination.limit, 
        filter
      );

      setNotifications(notificationsResponse.notifications || []);
      const paginationData = notificationsResponse.pagination;
      setPagination({
        page: paginationData.page,
        limit: paginationData.limit,
        total: paginationData.total,
        totalPages: Math.ceil(paginationData.total / paginationData.limit)
      });
      setCurrentPage(page);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Không thể tải dữ liệu thông báo');
    } finally {
      setLoading(false);
    }
  }, [pagination.limit, typeFilter, searchTerm]);

  // Fetch users for dropdown
  const fetchUsers = useCallback(async () => {
    try {
      const usersResponse = await userService.getAllUsers(1, 1000);
      setUsers(usersResponse.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  }, []);

  // Memoized pagination data
  const paginationData = useMemo(() => {
    return pagination.totalPages > 1
      ? {
          currentPage,
          totalPages: pagination.totalPages,
          totalItems: pagination.total,
          itemsPerPage: pagination.limit,
          onPageChange: fetchData
        }
      : undefined;
  }, [currentPage, pagination, fetchData]);

  // Load data on component mount
  useEffect(() => {
    // Prevent duplicate calls in development due to React Strict Mode
    if (hasFetchedData.current) return;
    hasFetchedData.current = true;
    
    // Reset filters and search terms on component mount
    setSearchTerm('');
    setTypeFilter('all');
    fetchData(1);
    fetchUsers();
  }, [fetchData, fetchUsers]);

  // Handle search term and type filter changes
  useEffect(() => {
    // Reset to first page when filters change
    if (searchTerm !== '' || typeFilter !== 'all') {
      setCurrentPage(1);
    }
  }, [searchTerm, typeFilter]);

  const handleCreate = useCallback(async (values: Record<string, any>): Promise<Notification | null> => {
    try {
      const notificationData = {
        user_id: parseInt(values.user_id),
        title: values.title,
        message: values.message,
        type: values.type || 'info',
        link: values.link || null
      };
      
      const createdNotification = await createNotification(notificationData);

      if (createdNotification) {
        toast.success('Tạo thông báo mới thành công');
        fetchData();
        return createdNotification;
      }
      return null;
    } catch (error) {
      console.error('Error creating notification:', error);
      toast.error('Không thể tạo thông báo');
      return null;
    }
  }, [fetchData]);

  const handleDelete = useCallback(async (notification: Notification) => {
    try {
      const resp = await deleteNotification(notification.id);
      
      if (resp) {
        toast.success('Xóa thông báo thành công');
        fetchData();
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Không thể xóa thông báo');
    }
  }, [fetchData]);

  const handleMarkAsRead = useCallback(async (notification: Notification) => {
    try {
      const resp = await markAsRead(notification.id);
      
      if (resp) {
        toast.success('Đánh dấu đã đọc thành công');
        fetchData();
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Không thể đánh dấu đã đọc');
    }
  }, [fetchData]);

  // Memoized columns to prevent recreation on each render
  const columns = useMemo(() => [
    { 
      key: 'user_name' as keyof Notification, 
      title: 'Người nhận',
      render: (value: string, row: Notification) => (
        <div className="max-w-xs truncate" title={value}>
          {value || `User #${row.user_id}`}
        </div>
      )
    },
    { 
      key: 'title' as keyof Notification, 
      title: 'Tiêu đề',
      render: (value: string) => (
        <div className="max-w-xs truncate font-medium" title={value}>
          {value}
        </div>
      )
    },
    { 
      key: 'message' as keyof Notification, 
      title: 'Nội dung',
      render: (value: string) => (
        <div className="max-w-md truncate" title={value}>
          {value}
        </div>
      )
    },
    { 
      key: 'type' as keyof Notification, 
      title: 'Loại',
      render: (value: string) => {
        const typeColors: Record<string, string> = {
          info: 'bg-blue-100 text-blue-800',
          success: 'bg-green-100 text-green-800',
          warning: 'bg-yellow-100 text-yellow-800',
          error: 'bg-red-100 text-red-800',
          job: 'bg-purple-100 text-purple-800',
          campaign: 'bg-indigo-100 text-indigo-800',
          review: 'bg-pink-100 text-pink-800',
          system: 'bg-gray-100 text-gray-800'
        };
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeColors[value] || typeColors.info}`}>
            {value}
          </span>
        );
      }
    },
    { 
      key: 'is_read' as keyof Notification, 
      title: 'Trạng thái',
      render: (value: boolean) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${value ? 'bg-gray-100 text-gray-800' : 'bg-blue-100 text-blue-800'}`}>
          {value ? 'Đã đọc' : 'Chưa đọc'}
        </span>
      )
    },
    { 
      key: 'created_at' as keyof Notification, 
      title: 'Ngày tạo',
      render: (value: string) => new Date(value).toLocaleString('vi-VN')
    }
  ], []);

  // Memoized form fields to prevent recreation on each render
  const formFields = useMemo(() => [
    { 
      name: 'user_id', 
      label: 'Người nhận', 
      type: 'select' as const, 
      required: true,
      options: users.map(user => ({ value: user.id.toString(), label: `${user.name} (${user.email})` })),
      placeholder: 'Chọn người nhận' 
    },
    { 
      name: 'title', 
      label: 'Tiêu đề', 
      type: 'text' as const, 
      required: true, 
      placeholder: 'Nhập tiêu đề thông báo' 
    },
    { 
      name: 'message', 
      label: 'Nội dung', 
      type: 'textarea' as const, 
      required: true, 
      placeholder: 'Nhập nội dung thông báo' 
    },
    { 
      name: 'type', 
      label: 'Loại thông báo', 
      type: 'select' as const, 
      required: true,
      options: [
        { value: 'info', label: 'Thông tin' },
        { value: 'success', label: 'Thành công' },
        { value: 'warning', label: 'Cảnh báo' },
        { value: 'error', label: 'Lỗi' },
        { value: 'job', label: 'Công việc' },
        { value: 'campaign', label: 'Chiến dịch' },
        { value: 'review', label: 'Đánh giá' },
        { value: 'system', label: 'Hệ thống' }
      ],
      placeholder: 'Chọn loại thông báo' 
    },
    { 
      name: 'link', 
      label: 'Liên kết', 
      type: 'text' as const,
      placeholder: 'Nhập đường dẫn liên kết (tùy chọn)' 
    }
  ], [users]);

  // Type options for SelectWithSearch
  const typeOptions = useMemo(() => [
    { value: 'all', label: 'Tất cả' },
    { value: 'info', label: 'Thông tin' },
    { value: 'success', label: 'Thành công' },
    { value: 'warning', label: 'Cảnh báo' },
    { value: 'error', label: 'Lỗi' },
    { value: 'job', label: 'Công việc' },
    { value: 'job_approved', label: 'Công việc được duyệt' },
    { value: 'job_rejected', label: 'Công việc bị từ chối' },
    { value: 'campaign', label: 'Chiến dịch' },
    { value: 'review', label: 'Đánh giá' },
    { value: 'review_request', label: 'Yêu cầu duyệt' },
    { value: 'review_canceled', label: 'Hủy yêu cầu duyệt' },
    { value: 'job_report', label: 'Báo cáo công việc' },
    { value: 'report_update', label: 'Cập nhật báo cáo' },
    { value: 'system', label: 'Hệ thống' }
  ], []);

  // Handle type filter change
  const handleTypeFilterChange = useCallback((selectedValues: any[]) => {
    // Take the first value or default to 'all'
    setTypeFilter(selectedValues.length > 0 ? selectedValues[0] : 'all');
  }, []);

  // Memoized additional filters to prevent recreation on each render
  const additionalFilters = useMemo(() => (
    <div className="w-full md:w-64">
      <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
        Loại thông báo
      </label>
      <SelectWithSearch
        options={typeOptions}
        selectedValues={[typeFilter]}
        onChange={handleTypeFilterChange}
        placeholder="Chọn loại"
        multiple={false}
        clearable={true}
      />
    </div>
  ), [typeFilter, typeOptions, handleTypeFilterChange]);

  // Memoized filter data
  const filterData = useMemo(() => ({
    searchTerm,
    onSearchChange: setSearchTerm,
    additionalFilters,
    onFilter: () => fetchData(currentPage, false)
  }), [searchTerm, additionalFilters, currentPage, fetchData])

  return (
    <DataManagement<Notification>
      title="Quản lý thông báo"
      data={notifications}
      columns={columns}
      formFields={formFields}
      loading={loading}
      onCreate={handleCreate}
      onDelete={handleDelete}
      onRefresh={() => fetchData(1, true)}
      pagination={paginationData}
      filters={filterData}
      action={{
        additionalActions: (notification: Notification) => {
          const actions = [];
          
          // Only show "Mark as Read" action if notification is unread
          if (!notification.is_read) {
            actions.push({
              label: 'Đánh dấu đã đọc',
              icon: (
                <svg 
                  className="w-4 h-4" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
                  />
                </svg>
              ),
              onClick: () => handleMarkAsRead(notification),
              className: 'text-blue-600 hover:text-blue-800 cursor-pointer',
              type: 'default'
            });
          }
          
          return actions;
        }
      }}
    />
  );
};

export default NotificationManagement;
