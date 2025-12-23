import React, { useState, useEffect } from 'react';
import { 
  LuUser, LuTarget, LuWrench, LuBriefcase, LuGraduationCap,
  LuAward, LuFolderGit2, LuHeart, LuUsers, LuChevronDown, LuChevronRight
} from 'react-icons/lu';
import { getUserCVSections } from '../../api/cvSectionService';

interface CVSectionViewerProps {
  cvId: number;
  templateImage?: string;
}

const iconMap: Record<string, any> = {
  LuUser, LuTarget, LuWrench, LuBriefcase, LuGraduationCap,
  LuAward, LuFolderGit2, LuHeart, LuUsers
};

const CVSectionViewer: React.FC<CVSectionViewerProps> = ({ cvId, templateImage }) => {
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchSections();
  }, [cvId]);

  const fetchSections = async () => {
    try {
      setLoading(true);
      const response = await getUserCVSections(cvId);
      const sectionsData = response.data || [];
      
      // Auto-expand all sections
      const allIds = new Set<number>(sectionsData.map((s: any) => Number(s.section_id)));
      setExpandedSections(allIds);
      
      setSections(sectionsData);
    } catch (error) {
      console.error('Error fetching CV sections:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (sectionId: number) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const getIcon = (iconName: string) => {
    return iconMap[iconName] || LuUser;
  };

  const renderFieldValue = (field: any, value: any) => {
    if (!value) return <span className="text-gray-400 italic">Chưa điền</span>;

    if (field.type === 'image') {
      return (
        <img 
          src={value} 
          alt={field.label}
          className="w-32 h-32 object-cover rounded-lg border border-gray-200"
        />
      );
    }

    if (field.type === 'richtext') {
      return (
        <div 
          className="prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: value }}
        />
      );
    }

    return <p className="text-gray-900">{value}</p>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (sections.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>CV này chưa có thông tin sections</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Template Preview (if available) */}
      {templateImage && (
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3">Preview Template</h3>
          <img 
            src={templateImage} 
            alt="CV Template"
            className="w-full max-w-md mx-auto rounded-lg border border-gray-300"
          />
        </div>
      )}

      {/* Sections Data */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Thông tin CV theo Sections</h3>
          <p className="text-sm text-gray-600 mt-1">
            Dữ liệu được tổ chức theo {sections.length} sections
          </p>
        </div>

        <div className="divide-y divide-gray-200">
          {sections
            .sort((a, b) => a.display_order - b.display_order)
            .map((section) => {
              const Icon = getIcon(section.icon);
              const isExpanded = expandedSections.has(section.section_id);
              const sectionData = typeof section.data === 'string' 
                ? JSON.parse(section.data) 
                : section.data;
              const defaultFields = typeof section.default_fields === 'string'
                ? JSON.parse(section.default_fields)
                : section.default_fields;

              return (
                <div key={section.id} className="p-4">
                  {/* Section Header */}
                  <button
                    onClick={() => toggleSection(section.section_id)}
                    className="w-full flex items-center gap-3 text-left hover:bg-gray-50 -m-2 p-2 rounded-lg transition-colors"
                  >
                    {isExpanded ? (
                      <LuChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                    ) : (
                      <LuChevronRight className="w-5 h-5 text-gray-500 flex-shrink-0" />
                    )}
                    <Icon className="w-6 h-6 text-blue-600 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{section.name}</h4>
                      {section.description && (
                        <p className="text-sm text-gray-600">{section.description}</p>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {Object.keys(sectionData).length} trường
                    </span>
                  </button>

                  {/* Section Content */}
                  {isExpanded && (
                    <div className="mt-4 ml-11 space-y-4">
                      {defaultFields.fields.map((field: any) => {
                        const value = sectionData[field.id];
                        
                        return (
                          <div key={field.id} className="border-l-2 border-blue-200 pl-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {field.label}
                              {field.required && <span className="text-red-500 ml-1">*</span>}
                            </label>
                            <div className="text-sm">
                              {renderFieldValue(field, value)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </div>

      {/* Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">Tóm tắt</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-blue-700">Tổng sections:</span>
            <span className="ml-2 font-medium text-blue-900">{sections.length}</span>
          </div>
          <div>
            <span className="text-blue-700">Sections hiển thị:</span>
            <span className="ml-2 font-medium text-blue-900">
              {sections.filter(s => s.is_visible).length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CVSectionViewer;
