import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { toast } from 'react-toastify';
import { DataManagement } from '../../../components';
import { getAllMedia, deleteMedia, type Media } from '../../../api/mediaService';

const MediaManagement: React.FC = () => {
  const [mediaList, setMediaList] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const hasFetchedData = useRef(false);
  const [previewMedia, setPreviewMedia] = useState<Media | null>(null);
  
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
      key: 'used_by' as keyof Media, 
      title: 'Thuộc entity',
      render: (_value: unknown, record: Media) => (
        <div className="text-sm">
          {record.used_by && record.used_by.length > 0 ? (
            <div className="space-y-1">
              {record.used_by.map((entity, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                    {entity.entity_type === 'user' ? '👤' : '🏢'} {entity.entity_type}
                  </span>
                  <span className="text-gray-700">{entity.entity_name}</span>
                  {entity.entity_email && (
                    <span className="text-gray-500 text-xs">({entity.entity_email})</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <span className="text-gray-400">Chưa sử dụng</span>
          )}
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
    <>
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
        action={{
          additionalActions: (media: Media) => 
            media.mime_type.startsWith('image/') ? [
              {
                label: 'Xem trước',
                icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>,
                onClick: () => setPreviewMedia(media),
                className: 'text-blue-600 hover:text-blue-900 cursor-pointer',
                type: 'default' as const
              }
            ] : []
        }}
      />

      {previewMedia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black opacity-70 transition-opacity"
            onClick={() => setPreviewMedia(null)}
          ></div>
          
          <div 
            className="relative bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-auto shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">{previewMedia.original_name}</h3>
                <p className="text-sm text-gray-500">{previewMedia.filename}</p>
              </div>
              <button
                onClick={() => setPreviewMedia(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <img 
                  src={previewMedia.url} 
                  alt={previewMedia.original_name}
                  className="max-w-full h-auto rounded-lg shadow-lg"
                  style={{ maxHeight: '60vh' }}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-semibold">Loại file:</span> {previewMedia.mime_type}
                </div>
                <div>
                  <span className="font-semibold">Kích thước:</span> {formatFileSize(previewMedia.size)}
                </div>
                <div>
                  <span className="font-semibold">Ngày tải lên:</span> {new Date(previewMedia.created_at).toLocaleString('vi-VN')}
                </div>
                <div>
                  <span className="font-semibold">Người tải:</span> {previewMedia.created_by ? `User ID: ${previewMedia.created_by}` : 'Hệ thống'}
                </div>
                {previewMedia.used_by && previewMedia.used_by.length > 0 && (
                  <div className="col-span-2">
                    <span className="font-semibold">Đang được sử dụng bởi:</span>
                    <div className="mt-2 space-y-2">
                      {previewMedia.used_by.map((entity, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                          <span className="inline-flex items-center px-2 py-1 rounded text-sm font-medium bg-blue-100 text-blue-800">
                            {entity.entity_type === 'user' ? '👤 User' : '🏢 Company'}
                          </span>
                          <div>
                            <div className="font-medium">{entity.entity_name}</div>
                            {entity.entity_email && (
                              <div className="text-xs text-gray-500">{entity.entity_email}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MediaManagement;
