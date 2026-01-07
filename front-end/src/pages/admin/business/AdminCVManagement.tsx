import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { getAllCVs, type AdminCV } from '../../../api/adminCVService';
import { toast } from 'react-toastify';
import { DataManagement } from '../../../components';
import { formatDateLong } from '../../../utils/dateUtils';

const AdminCVManagement: React.FC = () => {
  const [cvs, setCvs] = useState<AdminCV[]>([]);
  const [loading, setLoading] = useState(true);
  const hasFetchedData = useRef(false);
  
  // Pagination and filtering state
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  // Optimized fetch function for CVs
  const fetchCVs = useCallback(async (page: number = 1, reset: boolean = false, limit?: number) => {
    try {
      setLoading(true);
      
      // Reset filters and pagination if requested
      if (reset) {
        setSearchTerm('');
        page = 1;
      }
      
      const response = await getAllCVs({
        page, 
        limit: limit ?? pagination.limit, 
        search: reset ? '' : searchTerm
      });
    
      setCvs(response.data);
      setPagination(response.pagination);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error fetching CVs:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.limit, searchTerm]);

  // Memoized pagination data
  const paginationData = useMemo(() => {
    return {
      currentPage,
      totalPages: pagination.totalPages,
      totalItems: pagination.total,
      itemsPerPage: pagination.limit,
      onPageChange: fetchCVs,
      onItemsPerPageChange: (newLimit: number) => {
        setPagination(prev => ({ ...prev, limit: newLimit }));
        fetchCVs(1, false, newLimit);
      }
    };
  }, [currentPage, pagination, fetchCVs]);

  // Load CVs on component mount
  useEffect(() => {
    // Prevent duplicate calls in development due to React Strict Mode
    if (hasFetchedData.current) return;
    hasFetchedData.current = true;
    
    // Reset filters and search terms on component mount
    setSearchTerm('');
    fetchCVs(1);
  }, [fetchCVs]);

  // Handle search term changes
  useEffect(() => {
    // Reset to first page when search term changes
    if (searchTerm !== '') {
      setCurrentPage(1);
    }
  }, [searchTerm]);

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const getFileTypeInfo = (fileName?: string, mimeType?: string) => {
    if (!fileName && !mimeType) return { color: 'blue', label: 'File' };
    
    const ext = fileName?.split('.').pop()?.toLowerCase();
    
    // PDF
    if (ext === 'pdf' || mimeType?.includes('pdf')) {
      return { color: 'red', label: 'PDF' };
    }
    // Word
    if (ext === 'doc' || ext === 'docx' || mimeType?.includes('word')) {
      return { color: 'blue', label: 'Word' };
    }
    // Images
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'heic', 'heif'].includes(ext || '') || mimeType?.includes('image')) {
      return { color: 'green', label: 'Image' };
    }
    
    return { color: 'gray', label: 'File' };
  };

  // Memoized columns to prevent recreation on each render
  const columns = useMemo(() => [
    { 
      key: 'title' as keyof AdminCV, 
      title: 'Tiêu đề CV',
      render: (value: string) => (
        <span className="font-medium text-gray-900">{value}</span>
      )
    },
    { 
      key: 'user_name' as keyof AdminCV, 
      title: 'Người dùng',
      render: (_value: any, record: AdminCV) => (
        <div>
          <div className="font-medium text-gray-900">{record.user_name}</div>
          <div className="text-sm text-gray-500">{record.user_email}</div>
        </div>
      )
    },
    { 
      key: 'file_name' as keyof AdminCV, 
      title: 'File',
      render: (_value: any, record: AdminCV) => {
        const fileInfo = getFileTypeInfo(record.file_name, record.mime_type);
        return (
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full bg-${fileInfo.color}-100 text-${fileInfo.color}-700`}>
                {fileInfo.label}
              </span>
            </div>
            {record.file_name && (
              <div className="text-xs text-gray-500 mt-1 truncate max-w-xs">{record.file_name}</div>
            )}
          </div>
        );
      }
    },
    { 
      key: 'file_size' as keyof AdminCV, 
      title: 'Kích thước',
      render: (value: number) => (
        <span className="text-sm text-gray-600">{formatFileSize(value)}</span>
      )
    },
    { 
      key: 'created_at' as keyof AdminCV, 
      title: 'Ngày tạo',
      render: (value: string) => (
        <span className="text-sm text-gray-600">{formatDateLong(value)}</span>
      )
    },
    { 
      key: 'file_url' as keyof AdminCV, 
      title: 'Thao tác',
      render: (_value: any, record: AdminCV) => (
        <div className="flex gap-2">
          {record.file_url && (
            <a
              href={record.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Xem
            </a>
          )}
        </div>
      )
    }
  ], []);

  return (
    <DataManagement
      title="Danh sách CV"
      data={cvs}
      columns={columns}
      formFields={[]}
      loading={loading}
      pagination={paginationData}
      filters={{
        searchTerm,
        onSearchChange: setSearchTerm
      }}
      onRefresh={() => fetchCVs(1, true)}
      action={{
        showAddAction: false,
        showEditAction: false,
        showDeleteAction: false
      }}
    />
  );
};

export default AdminCVManagement;
