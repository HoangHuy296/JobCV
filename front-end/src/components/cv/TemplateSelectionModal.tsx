import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { LuSearch, LuEye, LuArrowRight, LuX } from 'react-icons/lu';
import {
  getPublishedTemplates,
  getTemplatePreview
} from '../../api/cvTemplateService';
import { getActiveSections, getTemplateSections, type CVSection } from '../../api/cvSectionService';
import UnifiedCVEditor from './UnifiedCVEditor';

interface CVTemplate {
  id: number;
  name: string;
  description: string;
  category: string;
  thumbnail_url: string;
  layout: string;
  usage_count: number;
  structure: string;
}

interface TemplateSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void; // Callback to refresh CV list
}

const TemplateSelectionModal: React.FC<TemplateSelectionModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<CVTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [previewTemplate, setPreviewTemplate] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  
  // Editor mode states
  const [showEditor, setShowEditor] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [templateSections, setTemplateSections] = useState<any[]>([]);
  const [availableSections, setAvailableSections] = useState<CVSection[]>([]);
  const [userData, setUserData] = useState<Record<number, Record<string, any>>>({});
  const [cvTitle, setCvTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [isPublic, setIsPublic] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
    }
  }, [isOpen, page, searchTerm]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const params: any = {
        page,
        limit: 12,
        search: searchTerm || undefined,
        orderBy: 'usage_count',
        orderDir: 'DESC'
      };
      
      const response = await getPublishedTemplates(params);
      setTemplates(response.data);
      setTotalPages(response.pagination.totalPages);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi khi tải danh sách templates');
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async (templateId: number) => {
    try {
      const response = await getTemplatePreview(templateId);
      setPreviewTemplate(response.data);
      setShowPreview(true);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi khi xem preview');
    }
  };

  const handleUseTemplate = async (templateId: number) => {
    try {
      setLoading(true);
      
      // Load template info
      const templateResponse = await getTemplatePreview(templateId);
      setEditingTemplate(templateResponse.data);
      
      // Load template sections
      const sectionsResponse = await getTemplateSections(templateId);
      const sections = sectionsResponse.data || [];
      
      // Transform to editor format
      const editorSections = sections.map((ts: any) => ({
        section: {
          id: ts.section_id,
          name: ts.name,
          key_name: ts.key_name,
          description: ts.description,
          icon: ts.icon,
          default_fields: typeof ts.default_fields === 'string' ? JSON.parse(ts.default_fields) : ts.default_fields,
          category: ts.category,
          is_active: true,
          display_order: ts.display_order,
          created_at: '',
          modified_at: ''
        },
        position: typeof ts.position === 'string' ? JSON.parse(ts.position) : ts.position,
        is_visible: true,
        display_order: ts.display_order
      }));
      
      setTemplateSections(editorSections);
      
      // Load available sections
      const availableResponse = await getActiveSections();
      setAvailableSections(availableResponse.data || []);
      
      setUserData({});
      setCvTitle('');
      setIsPublic(false);
      setShowEditor(true);
    } catch (error) {
      console.error('Error loading template:', error);
      toast.error('Không thể tải template');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black opacity-70 transition-opacity"></div>

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Chọn Template CV</h2>
            <p className="text-gray-600 mt-1">Chọn một template phù hợp và tạo CV chuyên nghiệp của bạn</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <LuX className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-gray-200">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <div className="relative">
                <LuSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Tìm kiếm template..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

            {/* Templates Grid */}
            <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Đang tải templates...</p>
            </div>
          ) : templates.length === 0 ? (
            <div className="bg-gray-50 rounded-lg p-12 text-center">
              <p className="text-gray-500 text-lg">Không tìm thấy template nào</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200 group"
                  >
                    {/* Template Preview Image */}
                    <div className="w-full h-56 bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
                      {template.thumbnail_url ? (
                        <div
                          className="w-full h-full cursor-pointer relative group"
                          onClick={() => handlePreview(template.id)}
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
                        <div className="flex items-center justify-center h-full">
                          <div className="text-center p-6">
                            <div className="text-4xl font-bold text-gray-300 mb-2">CV</div>
                            <div className="text-sm text-gray-400">{template.name}</div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Template Info */}
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {template.name}
                          </h3>
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {template.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                          {template.usage_count} người dùng
                        </span>
                      </div>

                      <button
                        onClick={() => handleUseTemplate(template.id)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                      >
                        Sử dụng template
                        <LuArrowRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-6 py-3 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 font-medium transition-colors"
                  >
                    Trước
                  </button>
                  <span className="px-6 py-3 text-gray-700 font-medium">
                    Trang {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-6 py-3 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 font-medium transition-colors"
                  >
                    Sau
                  </button>
                </div>
              )}
            </>
          )}
        </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && previewTemplate && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black opacity-70 transition-opacity" onClick={() => setShowPreview(false)}></div>
          
          <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10">
              <div>
                <h2 className="text-xl font-semibold">{previewTemplate.name}</h2>
                <p className="text-sm text-gray-600 mt-1">{previewTemplate.description}</p>
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <LuX className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Thông tin template</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Layout:</span>
                    <span className="ml-2 font-medium">{previewTemplate.layout}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Số người dùng:</span>
                    <span className="ml-2 font-medium">{previewTemplate.usage_count}</span>
                  </div>
                </div>
              </div>

              {previewTemplate.thumbnail_url && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Xem trước template</h3>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <img
                      src={previewTemplate.thumbnail_url}
                      alt={previewTemplate.name}
                      className="w-full h-auto"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => setShowPreview(false)}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                Đóng
              </button>
              <button
                onClick={() => {
                  setShowPreview(false);
                  handleUseTemplate(previewTemplate.id);
                }}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
              >
                Sử dụng template
                <LuArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateSelectionModal;
