import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserCVs, uploadCV, deleteCV, downloadCV, checkCVInApplications, type CV } from '../../api/cvService';
import { toast } from 'react-toastify';
import { formatDateLong } from '../../utils/dateUtils';
import { 
  LuFileText, 
  LuUpload, 
  LuTrash2, 
  LuDownload, 
  LuLoader,
  LuFile,
  LuCalendar,
  LuX,
  LuPlus,
  LuEye,
  LuPencil,
  LuPalette,
  LuImage,
  LuSearch,
  LuFilter,
  LuRefreshCw
} from 'react-icons/lu';
import ConfirmModal from '../../components/common/ConfirmModal';
import TemplateSelectionModal from '../../components/cv/TemplateSelectionModal';
import CVPreviewModal from '../../components/cv/CVPreviewModal';
import SelectWithSearch from '../../components/common/SelectWithSearch';

const CVManagement: React.FC = () => {
  const navigate = useNavigate();
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
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadData, setUploadData] = useState({
    title: '',
    file: null as File | null
  });
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [cvToDelete, setCvToDelete] = useState<number | null>(null);
  const [affectedApplications, setAffectedApplications] = useState<Array<{
    id: number;
    job_id: number;
    job_title: string;
    status: string;
  }>>([]);
  const [checkingApplications, setCheckingApplications] = useState(false);
  const [imagePreviewModal, setImagePreviewModal] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingCvId, setEditingCvId] = useState<number | null>(null);
  const [showCVPreviewModal, setShowCVPreviewModal] = useState(false);
  const [previewCvId, setPreviewCvId] = useState<number | null>(null);

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

      // Create preview URL for images and PDFs
      if (filePreviewUrl) {
        URL.revokeObjectURL(filePreviewUrl);
      }
      const previewUrl = URL.createObjectURL(file);
      setFilePreviewUrl(previewUrl);
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
      if (filePreviewUrl) {
        URL.revokeObjectURL(filePreviewUrl);
        setFilePreviewUrl(null);
      }
      fetchCVs(currentPage, searchTerm);
    } catch (error) {
      console.error('Error uploading CV:', error);
      toast.error('Không thể tải CV lên');
    } finally {
      setUploading(false);
    }
  };

  const handlePreview = (cv: CV) => {
    if (cv.template_id) {
      setPreviewCvId(cv.id);
      setShowCVPreviewModal(true);
    } else {
      toast.info('Preview chỉ khả dụng cho CV từ template');
    }
  };

  const handleDownload = async (cv: CV) => {
    try {
      const blob = await downloadCV(cv.id);
      
      // Check if response is actually a blob (not JSON error)
      if (blob.type === 'application/json') {
        const text = await blob.text();
        const error = JSON.parse(text);
        toast.error(error.message || 'Không thể tải xuống CV');
        return;
      }
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Set proper filename based on CV type
      if (cv.template_id) {
        a.download = `${cv.title.replace(/[^a-z0-9]/gi, '_')}.pdf`;
      } else {
        a.download = cv.file_name || `${cv.title}.pdf`;
      }
      
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

  const handleDeleteClick = async (cvId: number) => {
    setCvToDelete(cvId);
    setCheckingApplications(true);
    
    try {
      const result = await checkCVInApplications(cvId);
      setAffectedApplications(result.applications);
      setShowConfirmDelete(true);
    } catch (error) {
      console.error('Error checking CV applications:', error);
      toast.error('Không thể kiểm tra đơn ứng tuyển');
    } finally {
      setCheckingApplications(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!cvToDelete) return;

    try {
      await deleteCV(cvToDelete);
      toast.success('Xóa CV thành công');
      setShowConfirmDelete(false);
      setCvToDelete(null);
      fetchCVs(currentPage, searchTerm);
    } catch (error) {
      console.error('Error deleting CV:', error);
      toast.error('Không thể xóa CV');
    }
  };

  const handleCancelDelete = () => {
    setShowConfirmDelete(false);
    setCvToDelete(null);
    setAffectedApplications([]);
  };


  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
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

  const handleViewImage = (cv: CV) => {
    if (cv.file_url) {
      setPreviewImageUrl(cv.file_url);
      setImagePreviewModal(true);
    }
  };

  const handleEditCV = (cvId: number) => {
    setEditingCvId(cvId);
    setShowTemplateModal(true);
  };

  // Filter CVs based on search and type
  const filteredCVs = React.useMemo(() => {
    let filtered = cvs;
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(cv =>
        cv.title?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter(cv => {
        if (typeFilter === 'template') {
          return cv.template_id !== null && cv.template_id !== undefined;
        } else if (typeFilter === 'upload') {
          return !cv.template_id;
        }
        return true;
      });
    }
    
    return filtered;
  }, [cvs, searchTerm, typeFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý CV</h1>
          <p className="text-gray-600 mt-1">Quản lý và tải lên CV của bạn</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => fetchCVs(currentPage, searchTerm)}
            className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
            title="Tải lại"
          >
            <LuRefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowTemplateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer"
          >
            <LuPalette className="w-5 h-5" />
            Tạo CV từ template
          </button>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
          >
            <LuUpload className="w-5 h-5" />
            Tải CV lên
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center gap-2 mb-4">
          <LuFilter className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Bộ lọc</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <LuSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm CV theo tiêu đề..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Type Filter */}
          <div>
            <SelectWithSearch
              options={[
                { value: 'all', label: 'Tất cả loại CV' },
                { value: 'template', label: 'CV từ Template' },
                { value: 'upload', label: 'CV đã tải lên' }
              ]}
              selectedValues={[typeFilter]}
              onChange={(values) => setTypeFilter(values[0] || 'all')}
              placeholder="Chọn loại CV"
              multiple={false}
              clearable={false}
            />
          </div>
        </div>

        {/* Filter Summary */}
        {(searchTerm || typeFilter !== 'all') && (
          <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
            <span>Hiển thị {filteredCVs.length} / {cvs.length} CV</span>
            {(searchTerm || typeFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setTypeFilter('all');
                }}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Xóa bộ lọc
              </button>
            )}
          </div>
        )}
      </div>

      {/* CV List */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <LuLoader className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : filteredCVs.length === 0 && cvs.length > 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <LuFileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Không tìm thấy CV phù hợp</h3>
          <p className="text-gray-600 mb-6">Thử thay đổi bộ lọc để tìm kiếm CV khác</p>
          <button
            onClick={() => {
              setSearchTerm('');
              setTypeFilter('all');
            }}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Xóa bộ lọc
          </button>
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
          {filteredCVs.map((cv) => (
            <div
              key={cv.id}
              className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-200 flex flex-col"
            >
              {/* CV Preview */}
              <div className="relative bg-gray-50 h-64 flex items-center justify-center overflow-hidden rounded-t-xl border-b">
                {/* Type Badge Overlay */}
                <div className="absolute top-3 left-3 z-1">
                  {cv.template_id ? (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white text-xs font-bold rounded-lg shadow-lg">
                      <LuPalette className="w-4 h-4" />
                      CV Template
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg shadow-lg">
                      <LuImage className="w-4 h-4" />
                      CV Đã tải lên
                    </div>
                  )}
                </div>
                {cv.file_url ? (
                  (() => {
                    const fileInfo = getFileTypeInfo(cv.file_name, cv.mime_type);
                    
                    // Show image preview for image files
                    if (fileInfo.label === 'Image') {
                      return (
                        <div 
                          className="w-full h-full cursor-pointer relative group"
                          onClick={() => cv.template_id ? handlePreview(cv) : handleViewImage(cv)}
                        >
                          <img
                            src={cv.file_url}
                            alt={cv.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.parentElement!.innerHTML = '<div class="flex flex-col items-center justify-center"><svg class="w-16 h-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg><p class="text-xs text-gray-500 mt-2">Image</p></div>';
                            }}
                          />
                          <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-70 transition-all flex items-center justify-center">
                            <LuEye className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      );
                    }
                    // Show PDF preview for PDF files
                    if (fileInfo.label === 'PDF') {
                      return (
                        <embed
                          src={cv.file_url}
                          type="application/pdf"
                          className="w-full h-full"
                        />
                      );
                    }
                    // Show icon for Word files
                    const FileIcon = fileInfo.icon;
                    return (
                      <div className="flex flex-col items-center justify-center">
                        <FileIcon className="w-16 h-16 text-gray-400" />
                        <p className="text-xs text-gray-500 mt-2">{fileInfo.label}</p>
                      </div>
                    );
                  })()
                ) : (
                  <LuFileText className="w-16 h-16 text-gray-400" />
                )}
              </div>

              {/* CV Info */}
              <div className="p-6 flex flex-col flex-1">
                <div className="mb-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 truncate flex-1">{cv.title}</h3>
                    {cv.template_id ? (
                      <span className="flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 text-xs font-semibold rounded-full border border-purple-200 ml-2 whitespace-nowrap">
                        <LuPalette className="w-3.5 h-3.5" />
                        Template
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 text-xs font-semibold rounded-full border border-blue-200 ml-2 whitespace-nowrap">
                        <LuImage className="w-3.5 h-3.5" />
                        Tải lên
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full bg-${getFileTypeInfo(cv.file_name, cv.mime_type).color}-100 text-${getFileTypeInfo(cv.file_name, cv.mime_type).color}-700`}>
                      {getFileTypeInfo(cv.file_name, cv.mime_type).label}
                    </span>
                    <p className="text-sm text-gray-500">{formatFileSize(cv.file_size)}</p>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <LuCalendar className="w-4 h-4" />
                  <span>{formatDateLong(cv.created_at)}</span>
                </div>
                  {cv.file_name && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <LuFileText className="w-4 h-4" />
                      <span className="truncate">{cv.file_name}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 mt-auto">
                  <button
                    onClick={() => handleDownload(cv)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer font-medium text-sm"
                  >
                    <LuDownload className="w-4 h-4" />
                    Tải xuống
                  </button>
                  {cv.template_id && (
                    <button
                      onClick={() => handleEditCV(cv.id)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer font-medium text-sm"
                    >
                      <LuPencil className="w-4 h-4" />
                      Chỉnh sửa
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteClick(cv.id)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer font-medium text-sm"
                  >
                    <LuTrash2 className="w-4 h-4" />
                    Xóa CV
                  </button>
                </div>
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
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Tải CV lên</h2>
              <button
                onClick={() => {
                  setIsUploadModalOpen(false);
                  setUploadData({ title: '', file: null });
                  if (filePreviewUrl) {
                    URL.revokeObjectURL(filePreviewUrl);
                    setFilePreviewUrl(null);
                  }
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

              {/* File Preview */}
              {uploadData.file && filePreviewUrl && (
                <div className="border border-gray-300 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Xem trước
                  </label>
                  {uploadData.file.type.startsWith('image/') ? (
                    <div className="flex justify-center">
                      <img
                        src={filePreviewUrl}
                        alt="Preview"
                        className="max-h-64 rounded-lg object-contain"
                      />
                    </div>
                  ) : uploadData.file.type === 'application/pdf' ? (
                    <div className="w-full h-64 border border-gray-200 rounded-lg overflow-hidden">
                      <embed
                        src={filePreviewUrl}
                        type="application/pdf"
                        className="w-full h-full"
                      />
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <LuFileText className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm">Không thể xem trước file Word</p>
                      <p className="text-xs mt-1">File: {uploadData.file.name}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsUploadModalOpen(false);
                    setUploadData({ title: '', file: null });
                    if (filePreviewUrl) {
                      URL.revokeObjectURL(filePreviewUrl);
                      setFilePreviewUrl(null);
                    }
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

      {/* Image Preview Modal */}
      {imagePreviewModal && (
        <div className="fixed inset-0 bg-black flex items-center justify-center z-50 p-4" onClick={() => setImagePreviewModal(false)}>
          <div className="relative max-w-6xl max-h-[90vh] w-full h-full flex items-center justify-center">
            <button
              onClick={() => setImagePreviewModal(false)}
              className="absolute top-4 right-0 p-2 bg-white rounded-full text-gray-700 hover:bg-gray-100 transition-colors z-10"
              title="Đóng"
            >
              <LuX className="w-6 h-6" />
            </button>
            <img
              src={previewImageUrl || ''}
              alt="CV Preview"
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={showConfirmDelete}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Xác nhận xóa CV"
        message={
          affectedApplications.length > 0
            ? `CV này đang được sử dụng trong ${affectedApplications.length} đơn ứng tuyển:\n\n${affectedApplications.map(app => `- ${app.job_title} (${app.status})`).join('\n')}\n\nNếu bạn xóa CV này, các đơn ứng tuyển sẽ không còn CV đính kèm và nhà tuyển dụng sẽ được thông báo. Bạn có chắc chắn muốn tiếp tục?`
            : 'Bạn có chắc chắn muốn xóa CV này? Hành động này không thể hoàn tác.'
        }
        confirmText="Xóa"
        cancelText="Hủy"
        type="danger"
      />

      {/* Template Selection Modal */}
      <TemplateSelectionModal
        isOpen={showTemplateModal}
        onClose={() => {
          setShowTemplateModal(false);
          setEditingCvId(null);
        }}
        onSuccess={() => {
          fetchCVs(currentPage, searchTerm);
          setEditingCvId(null);
        }}
        editingCvId={editingCvId}
      />

      {/* CV Preview Modal */}
      {previewCvId && (
        <CVPreviewModal
          isOpen={showCVPreviewModal}
          onClose={() => {
            setShowCVPreviewModal(false);
            setPreviewCvId(null);
          }}
          cvId={previewCvId}
        />
      )}
    </div>
  );
};

export default CVManagement;
