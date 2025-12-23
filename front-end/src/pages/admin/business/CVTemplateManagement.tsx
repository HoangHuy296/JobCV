import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { LuPlus, LuPencil, LuTrash2, LuEye, LuImage, LuRefreshCw, LuX } from 'react-icons/lu';
import {
  getAllTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate
} from '../../../api/cvTemplateService';
import ConfirmModal from '../../../components/common/ConfirmModal';
import ImageBasedTemplateModal from './ImageBasedTemplateModal';
import SelectWithSearch from '../../../components/common/SelectWithSearch';

interface CVTemplate {
  id: number;
  name: string;
  description: string;
  category: string;
  thumbnail_url: string;
  structure: any;
  styles: any;
  layout: string;
  is_published: boolean;
  is_premium: boolean;
  usage_count: number;
  created_at: string;
  creator_name: string;
}

const CVTemplateManagement: React.FC = () => {
  const [templates, setTemplates] = useState<CVTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPublished, setFilterPublished] = useState<string>('');
  const [previewTemplate, setPreviewTemplate] = useState<CVTemplate | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  
  const [showImageBasedModal, setShowImageBasedModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CVTemplate | null>(null);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<number | null>(null);
  const [reloadTrigger, setReloadTrigger] = useState(0);

  useEffect(() => {
    fetchTemplates();
  }, [page, searchTerm, filterPublished, reloadTrigger]);

  const handleReload = () => {
    // Reset all filters
    setSearchTerm('');
    setFilterPublished('');
    setPage(1);
    // Trigger reload even if filters are already empty
    setReloadTrigger(prev => prev + 1);
  };

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const params: any = {
        page,
        limit: 10,
        search: searchTerm || undefined,
        is_published: filterPublished !== '' ? filterPublished === 'true' : undefined
      };
      
      const response = await getAllTemplates(params);console.log(response.data)
      setTemplates(response.data);
      setTotalPages(response.pagination.totalPages);
    } catch (error: any) {
      console.error('Error fetching templates:', error);
      console.error('Error response:', error.response);
      toast.error(error.response?.data?.message || 'Lỗi khi tải danh sách templates');
    } finally {
      setLoading(false);
    }
  };


  const handleOpenCreateModal = () => {
    setEditingTemplate(null);
    setShowImageBasedModal(true);
  };

  const handleOpenEditModal = (template: CVTemplate) => {
    setEditingTemplate(template);
    setShowImageBasedModal(true);
  };

  const handleOpenPreview = (template: CVTemplate) => {
    setPreviewTemplate(template);
    setShowPreview(true);
  };

  const handleSaveTemplate = async (templateData: any) => {
    try {
      if (editingTemplate) {
        await updateTemplate(editingTemplate.id, templateData);
        toast.success('Cập nhật template thành công');
      } else {
        await createTemplate(templateData);
        toast.success('Tạo template thành công');
      }

      setShowImageBasedModal(false);
      setEditingTemplate(null);
      fetchTemplates();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleDelete = async () => {
    if (!templateToDelete) return;

    try {
      await deleteTemplate(templateToDelete);
      toast.success('Xóa template thành công');
      setDeleteConfirmModal(false);
      setTemplateToDelete(null);
      fetchTemplates();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi khi xóa template');
    }
  };


  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý CV Templates</h1>
        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Thêm mới
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Tìm kiếm template..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <SelectWithSearch
            options={[
              { value: '', label: 'Tất cả trạng thái' },
              { value: 'true', label: 'Đã publish' },
              { value: 'false', label: 'Chưa publish' }
            ]}
            selectedValues={filterPublished ? [filterPublished] : ['']}
            onChange={(values) => setFilterPublished(values[0] || '')}
            placeholder="Chọn trạng thái"
            multiple={false}
            clearable={false}
          />
          </div>
          
          {/* Reload button */}
          <div className="flex justify-end">
            <button
              onClick={handleReload}
              disabled={loading}
              className={`p-2 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 cursor-pointer'}`}
              title="Làm mới"
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <LuRefreshCw className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Templates List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : templates.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <p className="text-gray-500">Chưa có template nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div key={template.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              {/* Template Preview/Thumbnail */}
              <div className="w-full h-56 bg-gray-100 flex items-center justify-center overflow-hidden">
                {template.thumbnail_url ? (
                  <div
                    className="w-full h-full cursor-pointer relative group"
                    onClick={() => handleOpenPreview(template)}
                  >
                    <img
                      src={template.thumbnail_url}
                      alt={template.name}
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
                ) : (
                  <div className="flex flex-col items-center justify-center">
                    <LuImage className="w-16 h-16 text-gray-400" />
                    <p className="text-xs text-gray-500 mt-2">No Image</p>
                  </div>
                )}
              </div>

              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{template.description}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    template.is_published 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {template.is_published ? 'Published' : 'Draft'}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
                    {template.layout}
                  </span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                    {template.usage_count} lượt dùng
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenEditModal(template)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <LuPencil className="w-4 h-4" />
                    Sửa
                  </button>
                  <button
                    onClick={() => {
                      setTemplateToDelete(template.id);
                      setDeleteConfirmModal(true);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <LuTrash2 className="w-4 h-4" />
                    Xóa
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Trước
          </button>
          <span className="px-4 py-2 text-gray-700">
            Trang {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Sau
          </button>
        </div>
      )}

      {/* Image Based Template Modal */}
      <ImageBasedTemplateModal
        isOpen={showImageBasedModal}
        onClose={() => {
          setShowImageBasedModal(false);
          setEditingTemplate(null);
        }}
        onSave={handleSaveTemplate}
        initialData={editingTemplate ? {
          name: editingTemplate.name,
          description: editingTemplate.description || '',
          thumbnail_url: editingTemplate.thumbnail_url,
          structure: typeof editingTemplate.structure === 'string' 
            ? JSON.parse(editingTemplate.structure) 
            : editingTemplate.structure,
          is_published: editingTemplate.is_published
        } : undefined}
      />

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={deleteConfirmModal}
        onClose={() => setDeleteConfirmModal(false)}
        onConfirm={handleDelete}
        title="Xác nhận xóa"
        message="Bạn có chắc chắn muốn xóa template này? Hành động này không thể hoàn tác."
        confirmText="Xóa"
        cancelText="Hủy"
        type="danger"
      />

      {showPreview && previewTemplate?.thumbnail_url && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black opacity-70 transition-opacity"
            onClick={() => {
              setShowPreview(false);
              setPreviewTemplate(null);
            }}
          ></div>

          <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-gray-900 truncate">{previewTemplate.name}</h2>
              </div>
              <button
                onClick={() => {
                  setShowPreview(false);
                  setPreviewTemplate(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                type="button"
              >
                <LuX className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <div className="p-4 bg-gray-50">
              <img
                src={previewTemplate.thumbnail_url}
                alt={previewTemplate.name}
                className="w-full max-h-[75vh] object-contain bg-white rounded"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CVTemplateManagement;
