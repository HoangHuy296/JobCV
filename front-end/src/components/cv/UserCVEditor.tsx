import React, { useState, useEffect } from 'react';
import { 
  LuTrash2, LuChevronDown, LuChevronRight, LuUpload,
  LuUser, LuTarget, LuWrench, LuBriefcase, LuGraduationCap,
  LuAward, LuFolderGit2, LuHeart, LuUsers
} from 'react-icons/lu';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import type { CVSection } from '../../api/cvSectionService';
import { uploadMedia } from '../../api/mediaService';
import { toast } from 'react-toastify';

interface SectionLayout {
  row: number;
  column_width: number;
  min_height?: number;
}

interface TemplateSectionData {
  section: CVSection;
  layout: SectionLayout;
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
  const [uploadingImages, setUploadingImages] = useState<Set<string>>(new Set());

  // Auto-expand all sections on mount
  useEffect(() => {
    const allSectionIds = sections.filter(s => s.is_visible).map(s => s.section.id);
    setExpandedSections(new Set(allSectionIds));
  }, [sections]);

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
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
                            {sectionUserData[field.id] ? (
                              <div className="relative">
                                <img 
                                  src={sectionUserData[field.id]} 
                                  alt={field.label}
                                  className="w-full h-40 object-cover rounded-lg shadow-sm"
                                />
                                <button
                                  onClick={() => updateUserData(section.id, field.id, null)}
                                  className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-md transition-colors"
                                  title="Xóa ảnh"
                                >
                                  <LuTrash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <label className="flex flex-col items-center justify-center cursor-pointer py-6">
                                {uploadingImages.has(`${section.id}-${field.id}`) ? (
                                  <>
                                    <svg className="animate-spin h-8 w-8 text-blue-600 mb-2" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span className="text-sm text-blue-600 mb-1">Đang tải ảnh lên...</span>
                                  </>
                                ) : (
                                  <>
                                    <LuUpload className="w-8 h-8 text-gray-400 mb-2" />
                                    <span className="text-sm text-gray-600 mb-1">Nhấp để tải ảnh lên</span>
                                    <span className="text-xs text-gray-400">PNG, JPG, GIF (max 5MB)</span>
                                  </>
                                )}
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      if (file.size > 5 * 1024 * 1024) {
                                        toast.error('Kích thước ảnh không được vượt quá 5MB');
                                        return;
                                      }
                                      
                                      const uploadKey = `${section.id}-${field.id}`;
                                      setUploadingImages(prev => new Set(prev).add(uploadKey));
                                      
                                      try {
                                        // Upload to media table
                                        const media = await uploadMedia(file);
                                        // Save media URL to user data
                                        updateUserData(section.id, field.id, media.url);
                                        toast.success('Ảnh đã được tải lên thành công!');
                                      } catch (error: any) {
                                        console.error('Error uploading image:', error);
                                        toast.error(error.message || 'Không thể tải ảnh lên');
                                      } finally {
                                        setUploadingImages(prev => {
                                          const newSet = new Set(prev);
                                          newSet.delete(uploadKey);
                                          return newSet;
                                        });
                                      }
                                    }
                                  }}
                                  className="hidden"
                                  disabled={uploadingImages.has(`${section.id}-${field.id}`)}
                                />
                              </label>
                            )}
                          </div>
                        ) : field.type === 'tel' || field.type === 'email' ? (
                          <input
                            type={field.type || 'text'}
                            value={sectionUserData[field.id] || ''}
                            onChange={(e) => updateUserData(section.id, field.id, e.target.value)}
                            placeholder={field.placeholder}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          />
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
            
            {/* Render sections with user data - grouped by rows */}
            <div className="relative flex flex-col gap-2 p-4">
              {(() => {
                // Group sections by row and validate widths
                const rowGroups: { [key: number]: typeof sections } = {};
                
                // Sort sections by display_order to maintain consistent ordering
                const sortedSections = [...sections]
                  .filter(s => s.is_visible && s.layout)
                  .sort((a, b) => a.display_order - b.display_order);
                
                sortedSections.forEach(sectionData => {
                  const row = sectionData.layout.row;
                  if (!rowGroups[row]) rowGroups[row] = [];
                  rowGroups[row].push(sectionData);
                });

                return Object.entries(rowGroups)
                  .sort(([rowA], [rowB]) => Number(rowA) - Number(rowB))
                  .map(([rowNum, rowSections]) => {
                    // Sort sections within the row by display_order
                    const sortedRowSections = [...rowSections].sort((a, b) => a.display_order - b.display_order);
                    const totalRowWidth = sortedRowSections.reduce((sum, s) => sum + s.layout.column_width, 0);
                    
                    return (
                      <div key={`row-${rowNum}`} className="flex gap-2 w-full">
                        {sortedRowSections.map((sectionData, index) => {
                          const { section, layout } = sectionData;
                          const sectionUserData = userData[section.id] || {};
                          const Icon = getIcon(section.icon);
                          
                          // Check if section has any data
                          const hasData = section.default_fields.fields.some((field: any) => {
                            const value = sectionUserData[field.id];
                            if (!value) return false;
                            if (typeof value === 'string') {
                              return value.trim() !== '' && value !== '<p><br></p>';
                            }
                            return true; // For non-string values (like image URLs)
                          });
                          
                          return (
                            <div
                              key={`${section.id}-${index}`}
                              style={{
                                flex: `0 0 calc(${(layout.column_width / totalRowWidth) * 100}% - ${rowSections.length > 1 ? '4px' : '0px'})`,
                                minHeight: `${layout.min_height || 150}px`
                              }}
                            >
                              <div className="w-full h-full p-2">
                                {/* Section Header - Always show if section has data */}
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
                                    if (!value) return null;
                                    if (typeof value === 'string' && (value.trim() === '' || value === '<p><br></p>')) return null;
                                    
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
                                            <div className="text-sm font-bold text-gray-800 uppercase">
                                              {field.label}
                                            </div>
                                            <div 
                                              className="text-xs leading-relaxed cv-content"
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
                    );
                  });
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserCVEditor;
