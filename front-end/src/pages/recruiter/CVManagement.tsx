import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { getUserCVs, deleteCV, type CV } from '../../api/cvService';
import { toast } from 'react-toastify';
import { DataManagement } from '../../components';

const RecruiterCVManagement: React.FC = () => {
  const [cvs, setCVs] = useState<CV[]>([]);
  const [loading, setLoading] = useState(true);
  const hasFetchedData = useRef(false);
  
  // Pagination and filtering state
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [templateFilter, setTemplateFilter] = useState<string>('all');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  // Optimized fetch function for CVs only
  const fetchCVs = useCallback(async (page: number = 1, reset: boolean = false) => {
    try {
      setLoading(true);
      
      // Reset filters and pagination if requested
      if (reset) {
        setSearchTerm('');
        setTemplateFilter('all');
        page = 1;
      }
      
      const response = await getUserCVs(
        page, 
        pagination.limit, 
        reset ? '' : searchTerm, 
        reset || templateFilter === 'all' ? undefined : templateFilter
      );
      
      setCVs(response.cvs);
      setPagination(response.pagination);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error fetching CVs:', error);
      toast.error('Lỗi khi tải danh sách CV');
    } finally {
      setLoading(false);
    }
  }, [pagination.limit, searchTerm, templateFilter]);

  // Load CVs on component mount
  useEffect(() => {
    // Prevent duplicate calls in development due to React Strict Mode
    if (hasFetchedData.current) return;
    hasFetchedData.current = true;
    
    // Reset filters and search terms on component mount
    setSearchTerm('');
    setTemplateFilter('all');
    fetchCVs(1);
  }, [fetchCVs]);

  // Handle search term changes
  useEffect(() => {
    // Reset to first page when search term changes
    if (searchTerm !== '') {
      setCurrentPage(1);
    }
  }, [searchTerm]);

  const handleDelete = useCallback(async (cv: CV) => {
    try {
      await deleteCV(cv.id);
      toast.success('Xóa CV thành công');
      fetchCVs(currentPage);
    } catch (error) {
      console.error('Error deleting CV:', error);
      toast.error('Lỗi khi xóa CV');
    }
  }, [currentPage, fetchCVs]);

  // Memoized columns to prevent recreation on each render
  const columns = useMemo(() => [
    { key: 'title' as keyof CV, title: 'Tiêu đề' },
    { 
      key: 'user_id' as keyof CV, 
      title: 'Người dùng',
      render: (value: any) => `User ID: ${value}`
    },
    { 
      key: 'is_template' as keyof CV, 
      title: 'Loại',
      render: (value: any) => value ? 'Mẫu CV' : 'CV người dùng'
    },
    { 
      key: 'created_at' as keyof CV, 
      title: 'Ngày tạo',
      render: (value: any) => new Date(value).toLocaleDateString('vi-VN')
    },
    { key: 'file_name' as keyof CV, title: 'Tên tệp' }
  ], []);

  // Memoized form fields to prevent recreation on each render
  const formFields = useMemo(() => [
    { 
      name: 'title', 
      label: 'Tiêu đề', 
      type: 'text' as const, 
      required: true, 
      placeholder: 'Nhập tiêu đề CV' 
    }
  ], []);

  // Memoized additional filters to prevent recreation on each render
  const additionalFilters = useMemo(() => (
    <div>
      <label htmlFor="templateFilter" className="block text-sm font-medium text-gray-700 mb-1">
        Loại CV
      </label>
      <select
        id="templateFilter"
        value={templateFilter}
        onChange={(e) => setTemplateFilter(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="all">Tất cả</option>
        <option value="true">Mẫu CV</option>
        <option value="false">CV người dùng</option>
      </select>
    </div>
  ), [templateFilter]);

  return (
    <DataManagement<CV>
      title="Quản lý CV ứng viên"
      data={cvs}
      columns={columns}
      formFields={formFields}
      loading={loading}
      onDelete={handleDelete}
      onRefresh={() => fetchCVs(currentPage)}
      pagination={
        pagination.totalPages > 1
          ? {
              currentPage,
              totalPages: pagination.totalPages,
              totalItems: pagination.total,
              itemsPerPage: pagination.limit,
              onPageChange: fetchCVs
            }
          : undefined
      }
      filters={
        {
          searchTerm,
          onSearchChange: setSearchTerm,
          additionalFilters,
          onFilter: () => fetchCVs(currentPage, false)
        }
      }
      action={{
        showAddAction: false,
        showEditAction: false,
        showDeleteAction: true
      }}
    />
  );
};

export default RecruiterCVManagement;
