import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { toast } from 'react-toastify';
import { DataManagement } from '../../../components';
import { getAllMedia, deleteMedia, type Media } from '../../../api/mediaService';

const MediaManagement: React.FC = () => {
  const [mediaList, setMediaList] = useState<Media[]>([]);
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

  // Optimized fetch function with useCallback
  const fetchData = useCallback(async (page: number = 1, reset: boolean = false, limit?: number) => {
    try {
      setLoading(true);
      
      // Reset filters and pagination if requested
      if (reset) {
        setSearchTerm('');
        page = 1;
      }
      
      const mediaResponse = await getAllMedia(
        page, 
        limit ?? pagination.limit, reset ? '' : searchTerm);
      
      setMediaList(mediaResponse.media);
      setPagination(mediaResponse.pagination);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error fetching media:', error);
      toast.error('Lỗi khi tải danh sách media');
    } finally {
      setLoading(false);
    }
  }, [pagination.limit, searchTerm]);

  // Memoized pagination data
  const paginationData = useMemo(() => {
    return pagination.totalPages > 1
      ? {
          currentPage,
          totalPages: pagination.totalPages,
          totalItems: pagination.total,
          itemsPerPage: pagination.limit,
          onPageChange: fetchData,
          onItemsPerPageChange: (newLimit: number) => {
            setPagination(prev => ({ ...prev, limit: newLimit }));
            fetchData(1, false, newLimit);
          }
        }
      : undefined;
  }, [currentPage, pagination, fetchData]);

  // Load data on component mount
  useEffect(() => {
    // Prevent duplicate calls in development due to React Strict Mode
    if (hasFetchedData.current) return;
    hasFetchedData.current = true;
    
    // Reset search terms on component mount
    setSearchTerm('');
    fetchData(1);
  }, [fetchData]);

  // Handle search term changes
  useEffect(() => {
    // Reset to first page when search term changes
    if (searchTerm !== '') {
      setCurrentPage(1);
    }
  }, [searchTerm]);

  const handleDelete = useCallback(async (media: Media) => {
    try {
      await deleteMedia(media.id);
      toast.success('Xóa media thành công');
      fetchData();
    } catch (error) {
      console.error('Error deleting media:', error);
    }
  }, [fetchData]);

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get file type icon
  const getFileTypeIcon = (mimeType: string): string => {
    if (mimeType.startsWith('image/')) {
      return '🖼️';
    } else if (mimeType.startsWith('video/')) {
      return '🎬';
    } else if (mimeType.startsWith('audio/')) {
      return '🎵';
    } else if (mimeType.includes('pdf')) {
      return '📄';
    } else if (mimeType.includes('zip') || mimeType.includes('rar')) {
      return '📦';
    } else {
      return '📁';
    }
  };

  // Memoized columns to prevent recreation on each render
  const columns = useMemo(() => [
    { 
      key: 'filename' as keyof Media, 
      title: 'Tên file',
      render: (_value: string, record: Media) => (
        <div className="flex items-center">
          <span className="text-2xl mr-3">{getFileTypeIcon(record.mime_type)}</span>
          <div>
            <div className="font-medium">{record.original_name}</div>
            <div className="text-sm text-gray-500">{record.filename}</div>
          </div>
        </div>
      )
    },
    { 
      key: 'mime_type' as keyof Media, 
      title: 'Loại file'
    },
    { 
      key: 'size' as keyof Media, 
      title: 'Kích thước',
      render: (value: number) => formatFileSize(value)
    },
    { 
      key: 'created_at' as keyof Media, 
      title: 'Ngày tải lên',
      render: (value: string) => new Date(value).toLocaleDateString('vi-VN')
    },
    { 
      key: 'created_by' as keyof Media, 
      title: 'Người tải lên',
      render: (value: number | null) => value ? `User ID: ${value}` : 'Hệ thống'
    }
  ], []);

  // Memoized filter data
  const filterData = useMemo(() => ({
    searchTerm,
    onSearchChange: setSearchTerm,
    onFilter: () => fetchData(currentPage, false)
  }), [searchTerm]);

  return (
    <DataManagement<Media>
      title="Quản lý Media"
      data={mediaList}
      columns={columns}
      formFields={[]}
      loading={loading}
      onDelete={handleDelete}
      onRefresh={() => fetchData(1, true)}
      pagination={paginationData}
      filters={filterData}
      onCreate={undefined}
      onEdit={undefined}
    />
  );
};

export default MediaManagement;
