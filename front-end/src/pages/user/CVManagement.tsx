import React, { useState, useEffect, useCallback } from 'react';
import { getUserCVs, uploadCV, deleteCV, downloadCV, type CV } from '../../api/cvService';
import { toast } from 'react-toastify';
import { 
  LuFileText, 
  LuUpload, 
  LuTrash2, 
  LuDownload, 
  LuLoader,
  LuFile,
  LuCalendar,
  LuX
} from 'react-icons/lu';

const CVManagement: React.FC = () => {
  const [cvs, setCvs] = useState<CV[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadData, setUploadData] = useState({
    title: '',
    file: null as File | null
  });

  const fetchCVs = useCallback(async (page: number = 1, search: string = '') => {
    try {
      setLoading(true);
      const response = await getUserCVs(page, 10, search);
      setCvs(response.cvs);
      setPagination(response.pagination);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error fetching CVs:', error);
      toast.error('Không thể tải danh sách CV');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCVs(1, searchTerm);
  }, [fetchCVs, searchTerm]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type (PDF, Word documents, and images)
      const allowedTypes = [
        'application/pdf',
        'application/msword', // .doc
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml',
        'image/heic',
        'image/heif'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        toast.error('Chỉ chấp nhận file PDF, Word (DOC/DOCX) hoặc ảnh (JPG, PNG, GIF, WEBP, SVG, HEIC)');
        return;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Kích thước file không được vượt quá 10MB');
        return;
      }

      setUploadData(prev => ({ ...prev, file }));
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!uploadData.title.trim()) {
      toast.error('Vui lòng nhập tiêu đề CV');
      return;
    }

    if (!uploadData.file) {
      toast.error('Vui lòng chọn file CV');
      return;
    }

    try {
      setUploading(true);
      await uploadCV({
        title: uploadData.title,
        file: uploadData.file
      });
      toast.success('Tải CV lên thành công');
      setIsUploadModalOpen(false);
      setUploadData({ title: '', file: null });
      fetchCVs(currentPage, searchTerm);
    } catch (error) {
      console.error('Error uploading CV:', error);
      toast.error('Không thể tải CV lên');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (cv: CV) => {
    try {
      const blob = await downloadCV(cv.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = cv.file_name || `${cv.title}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Tải xuống CV thành công');
    } catch (error) {
      console.error('Error downloading CV:', error);
      toast.error('Không thể tải xuống CV');
    }
  };

  const handleDelete = async (cvId: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa CV này?')) {
      return;
    }

    try {
      await deleteCV(cvId);
      toast.success('Xóa CV thành công');
      fetchCVs(currentPage, searchTerm);
    } catch (error) {
      console.error('Error deleting CV:', error);
      toast.error('Không thể xóa CV');
    }
  };


  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getFileTypeInfo = (fileName?: string, mimeType?: string) => {
    if (!fileName && !mimeType) return { icon: LuFile, color: 'blue', label: 'File' };
    
    const ext = fileName?.split('.').pop()?.toLowerCase();
    
    // PDF
    if (ext === 'pdf' || mimeType?.includes('pdf')) {
      return { icon: LuFileText, color: 'red', label: 'PDF' };
    }
    // Word
    if (ext === 'doc' || ext === 'docx' || mimeType?.includes('word')) {
      return { icon: LuFileText, color: 'blue', label: 'Word' };
    }
    // Images
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'heic', 'heif'].includes(ext || '') || mimeType?.includes('image')) {
      return { icon: LuFile, color: 'green', label: 'Image' };
    }
    
    return { icon: LuFile, color: 'gray', label: 'File' };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý CV</h1>
          <p className="text-gray-600 mt-1">Quản lý và tải lên CV của bạn</p>
        </div>
        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
        >
          <LuUpload className="w-5 h-5" />
          Tải CV lên
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <input
          type="text"
          placeholder="Tìm kiếm CV theo tiêu đề..."
          value={searchTerm}
          onChange={handleSearch}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* CV List */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <LuLoader className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : cvs.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <LuFileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Chưa có CV nào</h3>
          <p className="text-gray-600 mb-6">Bắt đầu bằng cách tải CV đầu tiên của bạn lên</p>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
          >
            <LuUpload className="w-5 h-5" />
            Tải CV lên
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cvs.map((cv) => (
            <div
              key={cv.id}
              className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {(() => {
                    const fileInfo = getFileTypeInfo(cv.file_name, cv.mime_type);
                    const FileIcon = fileInfo.icon;
                    const bgColor = `bg-${fileInfo.color}-100`;
                    const textColor = `text-${fileInfo.color}-600`;
                    return (
                      <div className={`w-12 h-12 ${bgColor} rounded-lg flex items-center justify-center`}>
                        <FileIcon className={`w-6 h-6 ${textColor}`} />
                      </div>
                    );
                  })()}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{cv.title}</h3>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full bg-${getFileTypeInfo(cv.file_name, cv.mime_type).color}-100 text-${getFileTypeInfo(cv.file_name, cv.mime_type).color}-700`}>
                        {getFileTypeInfo(cv.file_name, cv.mime_type).label}
                      </span>
                      <p className="text-sm text-gray-500">{formatFileSize(cv.file_size)}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <LuCalendar className="w-4 h-4" />
                  <span>{formatDate(cv.created_at)}</span>
                </div>
                {cv.file_name && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <LuFileText className="w-4 h-4" />
                    <span className="truncate">{cv.file_name}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleDownload(cv)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer"
                  title="Tải xuống"
                >
                  <LuDownload className="w-4 h-4" />
                  <span className="text-sm font-medium">Tải xuống</span>
                </button>
                <button
                  onClick={() => handleDelete(cv.id)}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors cursor-pointer"
                  title="Xóa"
                >
                  <LuTrash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button
            onClick={() => fetchCVs(currentPage - 1, searchTerm)}
            disabled={currentPage === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            Trước
          </button>
          <span className="text-gray-600">
            Trang {currentPage} / {pagination.totalPages}
          </span>
          <button
            onClick={() => fetchCVs(currentPage + 1, searchTerm)}
            disabled={currentPage === pagination.totalPages}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            Sau
          </button>
        </div>
      )}

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Tải CV lên</h2>
              <button
                onClick={() => {
                  setIsUploadModalOpen(false);
                  setUploadData({ title: '', file: null });
                }}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <LuX className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tiêu đề CV <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={uploadData.title}
                  onChange={(e) => setUploadData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Ví dụ: CV Lập trình viên"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  File CV <span className="text-red-500">*</span>
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp,.svg,.heic,.heif"
                    onChange={handleFileChange}
                    className="hidden"
                    id="cv-file-input"
                    required
                  />
                  <label
                    htmlFor="cv-file-input"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <LuUpload className="w-8 h-8 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {uploadData.file ? uploadData.file.name : 'Chọn file CV của bạn'}
                    </span>
                    <span className="text-xs text-gray-500 mt-1">
                      Hỗ trợ: PDF, Word (DOC/DOCX), Ảnh (JPG, PNG, GIF, WEBP, SVG, HEIC)
                    </span>
                    <span className="text-xs text-gray-500">Tối đa 10MB</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsUploadModalOpen(false);
                    setUploadData({ title: '', file: null });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  disabled={uploading}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? (
                    <>
                      <LuLoader className="w-5 h-5 animate-spin" />
                      Đang tải lên...
                    </>
                  ) : (
                    <>
                      <LuUpload className="w-5 h-5" />
                      Tải lên
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default CVManagement;
