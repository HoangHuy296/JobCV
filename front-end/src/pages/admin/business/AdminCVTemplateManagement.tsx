import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { LuPlus, LuPencil, LuTrash2, LuEye, LuSave, LuX, LuUpload, LuImage, LuRefreshCw, LuEyeOff, LuArrowLeft } from 'react-icons/lu';
import { 
  getAllTemplates, 
  createTemplate, 
  updateTemplate, 
  deleteTemplate,
  uploadTemplateImage 
} from '../../../api/cvTemplateService';
import { 
  getActiveSections, 
  getTemplateSections,
  addSectionToTemplate,
  updateTemplateSection,
  removeTemplateSection,
  type CVSection 
} from '../../../api/cvSectionService';
import AdminCVEditor from '../../../components/cv/AdminCVEditor';

interface Template {
  id: number;
  name: string;
  description: string;
  thumbnail_url: string;
  is_published: boolean;
  usage_count: number;
  created_at: string;
}

const AdminCVTemplateManagement: React.FC = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  
  // Editor states
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [templateImage, setTemplateImage] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [templateSections, setTemplateSections] = useState<any[]>([]);
  const [availableSections, setAvailableSections] = useState<CVSection[]>([]);
  const [saving, setSaving] = useState(false);
  const [isPublished, setIsPublished] = useState(false);

  useEffect(() => {
    fetchTemplates();
    fetchAvailableSections();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await getAllTemplates({ page: 1, limit: 100 });
      console.log('Templates response:', response);
      // Backend returns { success, data: [...templates], pagination }
      const templatesList = response.data || [];
      console.log('Templates list:', templatesList);
      setTemplates(templatesList);
    } catch (error: any) {
      console.error('Error fetching templates:', error);
      toast.error(error.response?.data?.message || 'Không thể tải danh sách templates');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSections = async () => {
    try {
      const response = await getActiveSections();
      setAvailableSections(response.data || []);
    } catch (error) {
      console.error('Error fetching sections (mục):', error);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file ảnh');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Kích thước ảnh không được vượt quá 5MB');
      return;
    }

    try {
      setUploadingImage(true);
      const response = await uploadTemplateImage(file);
      setTemplateImage(response.data.url);
      toast.success('Upload ảnh thành công!');
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast.error(error.response?.data?.message || 'Lỗi khi upload ảnh');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCreateNew = () => {
    setEditingTemplate(null);
    setTemplateName('');
    setTemplateDescription('');
    setTemplateImage('');
    setTemplateSections([]);
    setIsPublished(false);
    setShowEditor(true);
  };

  const handleEdit = async (template: Template) => {
    try {
      setLoading(true);
      setEditingTemplate(template);
      setTemplateName(template.name);
      setTemplateDescription(template.description);
      setTemplateImage(template.thumbnail_url);
      setIsPublished(template.is_published);

      // Tải các mục của template
      const sectionsResponse = await getTemplateSections(template.id);
      const sections = sectionsResponse.data || [];
      
      const editorSections = sections.map((ts: any) => ({
        id: ts.id, // template_section_id
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
      setShowEditor(true);
    } catch (error) {
      console.error('Error loading template:', error);
      toast.error('Không thể tải template');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      // Validation
      if (!templateName.trim()) {
        toast.error('Vui lòng nhập tên template');
        return;
      }

      if (!templateImage) {
        toast.error('Vui lòng upload ảnh template');
        return;
      }

      if (templateSections.length === 0) {
        toast.error('Vui lòng thêm ít nhất 1 mục');
        return;
      }

      setSaving(true);

      if (editingTemplate) {
        // Update existing template
        await updateTemplate(editingTemplate.id, {
          name: templateName,
          description: templateDescription,
          thumbnail_url: templateImage,
          is_published: isPublished
        });

        // Cập nhật các mục
        // 1. Xóa các mục cũ
        const existingSections = templateSections.filter(s => s.id);
        const newSections = templateSections.filter(s => !s.id);
        
        // 2. Thêm mục mới
        for (const sectionData of newSections) {
          await addSectionToTemplate(editingTemplate.id, {
            section_id: sectionData.section.id,
            position: sectionData.position,
            display_order: sectionData.display_order
          });
        }

        // 3. Cập nhật mục hiện tại
        for (const sectionData of existingSections) {
          await updateTemplateSection(sectionData.id, {
            position: sectionData.position,
            display_order: sectionData.display_order
          });
        }

        toast.success('Cập nhật template thành công!');
      } else {
        // Create new template
        const templateResponse = await createTemplate({
          name: templateName,
          description: templateDescription,
          thumbnail_url: templateImage,
          structure: { fields: [] },
          layout: 'image-based',
          is_published: isPublished
        });

        const templateId = templateResponse.data.id;

        // Thêm các mục vào template
        for (const sectionData of templateSections) {
          await addSectionToTemplate(templateId, {
            section_id: sectionData.section.id,
            position: sectionData.position,
            display_order: sectionData.display_order
          });
        }

        toast.success('Tạo template thành công!');
      }

      setShowEditor(false);
      fetchTemplates();
    } catch (error: any) {
      console.error('Error saving template:', error);
      toast.error(error.response?.data?.message || 'Lỗi khi lưu template');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa template này?')) return;

    try {
      await deleteTemplate(id);
      toast.success('Xóa template thành công!');
      fetchTemplates();
    } catch (error: any) {
      console.error('Error deleting template:', error);
      toast.error(error.response?.data?.message || 'Lỗi khi xóa template');
    }
  };

  const handleTogglePublish = async (template: Template) => {
    try {
      await updateTemplate(template.id, {
        is_published: !template.is_published
      });
      toast.success(template.is_published ? 'Đã ẩn template' : 'Đã công khai template');
      fetchTemplates();
    } catch (error: any) {
      console.error('Error toggling publish:', error);
      toast.error(error.response?.data?.message || 'Lỗi khi cập nhật trạng thái');
    }
  };

  if (showEditor) {
    return (
      <div className="flex flex-col ">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200 rounded-sm">
          <div className="px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <LuImage className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">
                    {editingTemplate ? 'Chỉnh sửa Template' : 'Tạo Template Mới'}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {editingTemplate ? 'Cập nhật thông tin và các mục của template' : 'Upload ảnh template và thêm các mục'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  <LuSave className="w-5 h-5" />
                  <span>{saving ? 'Đang lưu...' : 'Lưu Template'}</span>
                </button>
                <button
                  onClick={() => setShowEditor(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  title="Đóng"
                >
                  <LuX className="w-6 h-6 text-gray-500" />
                </button>
              </div>
            </div>
          </div>

          {/* Template Info */}
          <div className="px-6 py-5 bg-gray-50 border-t border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Thông tin Template</h3>
            <div className="flex gap-6">
              {/* Left: Image Upload */}
              <div className="flex-shrink-0">
                {templateImage ? (
                  <div className="relative group">
                    <div className="bg-white p-3 rounded-xl shadow-md">
                      <img 
                        src={templateImage} 
                        alt="Template" 
                        className="w-48 h-64 object-contain rounded-lg"
                      />
                    </div>
                    <button
                      onClick={() => setTemplateImage('')}
                      className="absolute -top-2 -right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-all"
                      title="Xóa ảnh"
                    >
                      <LuTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-48 h-64 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all bg-white group">
                    <div className="flex flex-col items-center">
                      <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-blue-200 transition-all">
                        <LuUpload className="w-7 h-7 text-blue-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-700 mb-1 text-center px-2">Upload ảnh</span>
                      <span className="text-xs text-gray-500 text-center px-2">PNG, JPG (max 5MB)</span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      className="hidden"
                    />
                  </label>
                )}
                {uploadingImage && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-blue-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span>Đang upload...</span>
                  </div>
                )}
              </div>

              {/* Right: Form Fields */}
              <div className="flex-1">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Tên Template <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      placeholder="VD: CV Chuyên nghiệp"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Trạng thái
                    </label>
                    <div className="flex items-center gap-3 h-[42px]">
                      <button
                        type="button"
                        onClick={() => setIsPublished(!isPublished)}
                        className={`${isPublished ? 'bg-blue-600' : 'bg-gray-200'}
                          relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                        role="switch"
                        aria-checked={isPublished}
                      >
                        <span className="sr-only">Công khai template</span>
                        <span
                          aria-hidden="true"
                          className={`${isPublished ? 'translate-x-5' : 'translate-x-0'}
                            pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                        />
                      </button>
                      <span className="text-sm font-medium text-gray-700">
                        {isPublished ? 'Công khai' : 'Nháp'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Mô tả
                  </label>
                  <textarea
                    value={templateDescription}
                    onChange={(e) => setTemplateDescription(e.target.value)}
                    placeholder="Mô tả chi tiết về template này..."
                    rows={4}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white shadow-sm resize-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Editor Section */}
        <div className="flex-1 overflow-hidden">
          <div className="min-h-[600px] h-full pt-6">
            <div className="h-full bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              {templateImage ? (
                <AdminCVEditor
                  templateImage={templateImage}
                  sections={templateSections}
                  onSectionsChange={setTemplateSections}
                  availableSections={availableSections}
                />
              ) : (
                <div className="min-h-[600px] flex items-center justify-center h-full bg-gradient-to-br from-gray-50 to-gray-100">
                  <div className="text-center">
                    <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <LuImage className="w-12 h-12 text-blue-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Chưa có ảnh template</h3>
                    <p className="text-sm text-gray-600 mb-4">Vui lòng upload ảnh template ở phần trên để bắt đầu</p>
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">
                      <LuUpload className="w-4 h-4" />
                      <span>Upload ảnh ở trên</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý CV Templates</h1>
          <p className="text-gray-600 mt-1">Tạo và quản lý các template CV cho người dùng</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchTemplates}
            disabled={loading}
            className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Tải lại"
          >
            <LuRefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleCreateNew}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <LuPlus className="w-5 h-5" />
            Tạo Template Mới
          </button>
        </div>
      </div>

      {/* Templates Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 mt-2">Đang tải...</p>
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
          <LuImage className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">Chưa có template nào</p>
          <button
            onClick={handleCreateNew}
            className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
          >
            Tạo template đầu tiên
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {templates.map((template) => (
            <div
              key={template.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow flex flex-col"
            >
              <div className="relative">
                <img
                  src={template.thumbnail_url}
                  alt={template.name}
                  className="w-full h-64 object-cover"
                />
                <div className="absolute top-2 right-2 flex gap-2">
                  <button
                    onClick={() => handleTogglePublish(template)}
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      template.is_published
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {template.is_published ? 'Công khai' : 'Nháp'}
                  </button>
                </div>
              </div>
              <div className="p-4 flex flex-col flex-1">
                <h3 className="font-bold text-lg text-gray-900 mb-1">{template.name}</h3>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{template.description}</p>
                <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                  <span>Đã dùng: {template.usage_count} lần</span>
                </div>
                <div className="flex gap-2 mt-auto">
                  <button
                    onClick={() => handleEdit(template)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <LuPencil className="w-4 h-4" />
                    Sửa
                  </button>
                  <button
                    onClick={() => handleDelete(template.id)}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <LuTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default AdminCVTemplateManagement;
