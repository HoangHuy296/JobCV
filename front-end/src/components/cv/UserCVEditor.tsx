import React, { useState } from 'react';
import { 
  LuTrash2, LuChevronDown, LuChevronRight,
  LuUser, LuTarget, LuWrench, LuBriefcase, LuGraduationCap,
  LuAward, LuFolderGit2, LuHeart, LuUsers
} from 'react-icons/lu';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import type { CVSection } from '../../api/cvSectionService';

interface SectionPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface TemplateSectionData {
  section: CVSection;
  position: SectionPosition;
  is_visible: boolean;
  display_order: number;
}

interface UserCVEditorProps {
  templateImage: string;
  sections: TemplateSectionData[];
  userData?: Record<number, Record<string, any>>;
  onUserDataChange?: (data: Record<number, Record<string, any>>) => void;
}

const iconMap: Record<string, any> = {
  LuUser, LuTarget, LuWrench, LuBriefcase, LuGraduationCap,
  LuAward, LuFolderGit2, LuHeart, LuUsers
};

const UserCVEditor: React.FC<UserCVEditorProps> = ({
  templateImage,
  sections,
  userData = {},
  onUserDataChange
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());

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

  const updateUserData = (sectionId: number, fieldId: string, value: any) => {
    if (onUserDataChange) {
      const newData = { ...userData };
      if (!newData[sectionId]) {
        newData[sectionId] = {};
      }
      newData[sectionId][fieldId] = value;
      onUserDataChange(newData);
    }
  };

  return (
    <div className="flex gap-4 h-full">
      {/* Left Sidebar - User Input Fields */}
      <div className="w-[400px] bg-gradient-to-b from-gray-50 to-white border-r border-gray-200 p-4 space-y-4 overflow-y-auto">
        <div className="pb-3 border-b-2 border-gray-200">
          <h3 className="font-bold text-lg text-gray-900">Điền thông tin</h3>
          <p className="text-xs text-gray-600 mt-1">Nhập thông tin của bạn vào các trường bên dưới</p>
        </div>
        
        <div className="space-y-4">
          {sections.filter(s => s.is_visible).map((sectionData) => {
            const { section } = sectionData;
            const Icon = getIcon(section.icon);
            const sectionUserData = userData[section.id] || {};
            const isExpanded = expandedSections.has(section.id);
            
            return (
              <div key={section.id} className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center gap-2 p-3 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 transition-all"
                >
                  {isExpanded ? (
                    <LuChevronDown className="w-4 h-4 text-gray-600" />
                  ) : (
                    <LuChevronRight className="w-4 h-4 text-gray-600" />
                  )}
                  <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Icon className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="font-semibold text-gray-900 text-sm">{section.name}</span>
                </button>
                
                {isExpanded && (
                  <div className="p-4 space-y-3 bg-white">
                    {section.default_fields.fields.map((field: any) => (
                      <div key={field.id}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {field.label}
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        
                        {field.type === 'image' ? (
                          <div className="border-2 border-dashed border-gray-300 rounded p-2 bg-gray-50">
                            {sectionUserData[field.id] ? (
                              <div className="relative">
                                <img 
                                  src={sectionUserData[field.id]} 
                                  alt={field.label}
                                  className="w-full h-32 object-cover rounded"
                                />
                                <button
                                  onClick={() => updateUserData(section.id, field.id, null)}
                                  className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                                >
                                  <LuTrash2 className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onload = (e) => {
                                      updateUserData(section.id, field.id, e.target?.result);
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                                className="text-xs w-full"
                              />
                            )}
                          </div>
                        ) : (
                          <ReactQuill
                            value={sectionUserData[field.id] || ''}
                            onChange={(value) => updateUserData(section.id, field.id, value)}
                            placeholder={field.placeholder}
                            className="text-sm bg-white"
                            theme="snow"
                            modules={{
                              toolbar: [
                                ['bold', 'italic', 'underline'],
                                [{ list: 'ordered' }, { list: 'bullet' }]
                              ]
                            }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Canvas - Template Display */}
      <div className="flex-1 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg p-8 overflow-y-auto overflow-x-hidden">
        <div className="relative mx-auto">
          {/* Template Background Image */}
          <div
            className="relative bg-white mx-auto shadow-2xl rounded-sm"
            style={{
              width: '210mm',
              minHeight: '297mm'
            }}
          >
            {/* Background template image with reduced opacity */}
            {templateImage && (
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage: `url(${templateImage})`,
                  backgroundSize: 'contain',
                  backgroundPosition: 'top center',
                  backgroundRepeat: 'no-repeat',
                  pointerEvents: 'none'
                }}
              />
            )}
            
            {/* Render sections with user data */}
            {sections.map((sectionData, index) => {
              if (!sectionData.is_visible) return null;
              
              const { section, position } = sectionData;
              const sectionUserData = userData[section.id] || {};
              const Icon = getIcon(section.icon);
              
              // Check if section has any data
              const hasData = section.default_fields.fields.some((field: any) => {
                const value = sectionUserData[field.id];
                return value && value.trim && value.trim() !== '' && value !== '<p><br></p>';
              });
              
              return (
                <div
                  key={`${section.id}-${index}`}
                  className="absolute"
                  style={{
                    left: `${position.x}%`,
                    top: `${position.y}%`,
                    width: `${position.width}%`,
                    minHeight: `${position.height}%`,
                    userSelect: 'auto',
                    pointerEvents: 'auto'
                  }}
                >
                  <div className="w-full h-full p-2">
                    {/* Section Header */}
                    {hasData && (
                      <div className="flex items-center gap-2 mb-3 pb-2 border-b-2 border-blue-500">
                        <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center flex-shrink-0">
                          <Icon className="w-4 h-4 text-blue-600" />
                        </div>
                        <h3 className="font-bold text-sm text-gray-900 uppercase tracking-wide">
                          {section.name}
                        </h3>
                      </div>
                    )}
                    
                    {/* Section Content */}
                    <div className="space-y-2">
                      {section.default_fields.fields.map((field: any) => {
                        const value = sectionUserData[field.id];
                        if (!value || (value.trim && (value.trim() === '' || value === '<p><br></p>'))) return null;
                        
                        return (
                          <div key={field.id} className="text-gray-900">
                            {field.type === 'image' ? (
                              <img 
                                src={value} 
                                alt={field.label}
                                className="w-32 h-32 object-cover rounded-lg shadow-md border-2 border-gray-200"
                              />
                            ) : (
                              <div className="space-y-1">
                                <div className="text-xs font-semibold text-gray-600 uppercase">
                                  {field.label}
                                </div>
                                <div 
                                  className="text-sm leading-relaxed cv-content"
                                  dangerouslySetInnerHTML={{ __html: value }}
                                  style={{
                                    wordBreak: 'break-word',
                                    overflowWrap: 'break-word'
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserCVEditor;
