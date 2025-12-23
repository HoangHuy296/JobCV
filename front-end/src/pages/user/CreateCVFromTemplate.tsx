import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { LuSave, LuDownload, LuArrowLeft } from 'react-icons/lu';
import UnifiedCVEditor from '../../components/cv/UnifiedCVEditor';
import { getTemplateById, createCVFromTemplate } from '../../api/cvTemplateService';
import { getTemplateSections } from '../../api/cvSectionService';

interface SectionPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface TemplateSectionData {
  id?: number;
  section: any;
  position: SectionPosition;
  is_visible: boolean;
  display_order: number;
}

const CreateCVFromTemplate: React.FC = () => {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [template, setTemplate] = useState<any>(null);
  const [templateSections, setTemplateSections] = useState<TemplateSectionData[]>([]);
  const [userData, setUserData] = useState<Record<number, Record<string, any>>>({});
  const [cvTitle, setCvTitle] = useState('');

  useEffect(() => {
    fetchTemplate();
  }, [templateId]);

  const fetchTemplate = async () => {
    try {
      setLoading(true);
      const response = await getTemplateById(Number(templateId));
      setTemplate(response);
      
      // Load template sections
      const sectionsResponse = await getTemplateSections(Number(templateId));
      const sections = sectionsResponse.data || [];
      
      const editorSections = sections.map((ts: any) => ({
        id: ts.id,
        section: {
          id: ts.section_id,
          name: ts.name,
          key_name: ts.key_name,
          description: ts.description,
          icon: ts.icon,
          default_fields: typeof ts.default_fields === 'string' 
            ? JSON.parse(ts.default_fields) 
            : ts.default_fields
        },
        position: typeof ts.position === 'string' ? JSON.parse(ts.position) : ts.position,
        is_visible: ts.is_visible !== false,
        display_order: ts.display_order
      }));
      
      setTemplateSections(editorSections);
    } catch (error) {
      console.error('Error fetching template:', error);
      toast.error('Không thể tải template');
      navigate('/quan-ly-cv');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (!cvTitle.trim()) {
        toast.error('Vui lòng nhập tiêu đề CV');
        return;
      }

      // Validate required fields in sections
      let totalRequired = 0;
      let totalFilled = 0;
      
      templateSections.forEach(sectionData => {
        if (sectionData.is_visible) {
          const sectionUserData = userData[sectionData.section.id] || {};
          sectionData.section.default_fields.fields.forEach((field: any) => {
            if (field.required) {
              totalRequired++;
              if (sectionUserData[field.id]) {
                totalFilled++;
              }
            }
          });
        }
      });

      if (totalRequired > 0 && totalFilled < totalRequired) {
        toast.warning(`Còn ${totalRequired - totalFilled}/${totalRequired} trường bắt buộc chưa điền`);
      }

      setSaving(true);

      // Prepare sections info for backend
      const sectionsInfo = templateSections.map(s => ({
        section_id: s.section.id,
        position: s.position,
        is_visible: s.is_visible,
        display_order: s.display_order
      }));

      const cvData = {
        template_id: Number(templateId),
        title: cvTitle,
        data: userData,
        sections: sectionsInfo,
        is_public: false
      };

      await createCVFromTemplate(cvData);
      toast.success('Lưu CV thành công!');
      navigate('/quan-ly-cv');
    } catch (error: any) {
      console.error('Error saving CV:', error);
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi lưu CV');
    } finally {
      setSaving(false);
    }
  };

  const handleExportPDF = () => {
    // TODO: Implement PDF export
    toast.info('Tính năng xuất PDF đang được phát triển');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải template...</p>
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">Không tìm thấy template</p>
          <button
            onClick={() => navigate('/quan-ly-cv')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/quan-ly-cv')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LuArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Tạo CV từ: {template.name}
                </h1>
                <input
                  type="text"
                  value={cvTitle}
                  onChange={(e) => setCvTitle(e.target.value)}
                  placeholder="Nhập tiêu đề cho CV của bạn..."
                  className="mt-1 px-3 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleExportPDF}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <LuDownload className="w-4 h-4" />
                Xuất PDF
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
              >
                <LuSave className="w-4 h-4" />
                {saving ? 'Đang lưu...' : 'Lưu CV'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="p-4" style={{ height: 'calc(100vh - 120px)' }}>
        <div className="h-full bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {templateSections.length > 0 ? (
            <UnifiedCVEditor
              templateImage={template.thumbnail_url}
              sections={templateSections}
              onSectionsChange={setTemplateSections}
              mode="user"
              userData={userData}
              onUserDataChange={setUserData}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Đang tải các mục...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateCVFromTemplate;
