import React, { useState, useRef } from 'react';
import { 
  LuPlus, LuTrash2, LuMove, LuEye, LuEyeOff, LuGripVertical,
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

interface CVSectionWithPosition extends CVSection {
  position: SectionPosition;
  is_visible?: boolean;
  user_display_order?: number;
}

interface SectionBasedCVEditorProps {
  templateImage: string;
  sections: CVSectionWithPosition[];
  onSectionsChange: (sections: CVSectionWithPosition[]) => void;
  mode: 'edit' | 'preview'; // edit = admin setup template, preview = user filling data
  userData?: Record<string, Record<string, any>>; // {section_id: {field_id: value}}
  onUserDataChange?: (data: Record<string, Record<string, any>>) => void;
  availableSections?: CVSection[]; // For adding new sections
}

const iconMap: Record<string, any> = {
  LuUser,
  LuTarget,
  LuWrench,
  LuBriefcase,
  LuGraduationCap,
  LuAward,
  LuFolderGit2,
  LuHeart,
  LuUsers
};

const SectionBasedCVEditor: React.FC<SectionBasedCVEditorProps> = ({
  templateImage,
  sections,
  onSectionsChange,
  mode,
  userData = {},
  onUserDataChange,
  availableSections = []
}) => {
  const [selectedSection, setSelectedSection] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showSectionLibrary, setShowSectionLibrary] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  // Toggle section expansion
  const toggleSection = (sectionId: number) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  // Add section to template/CV
  const addSection = (section: CVSection) => {
    const newSection: CVSectionWithPosition = {
      ...section,
      position: {
        x: 10,
        y: 10 + sections.length * 5,
        width: 80,
        height: 20
      },
      is_visible: true,
      user_display_order: sections.length
    };
    onSectionsChange([...sections, newSection]);
    setShowSectionLibrary(false);
  };

  // Remove section
  const removeSection = (index: number) => {
    const newSections = sections.filter((_, i) => i !== index);
    onSectionsChange(newSections);
    setSelectedSection(null);
  };

  // Toggle section visibility (user mode)
  const toggleSectionVisibility = (index: number) => {
    const newSections = [...sections];
    newSections[index] = {
      ...newSections[index],
      is_visible: !newSections[index].is_visible
    };
    onSectionsChange(newSections);
  };

  // Handle drag
  const handleMouseDown = (e: React.MouseEvent, index: number) => {
    if (mode !== 'edit' && mode !== 'preview') return;
    e.preventDefault();
    e.stopPropagation();
    
    const section = sections[index];
    if (!section || !containerRef.current) return;
    
    const container = containerRef.current.getBoundingClientRect();
    const sectionElement = e.currentTarget as HTMLElement;
    const sectionRect = sectionElement.getBoundingClientRect();
    
    const offsetX = e.clientX - sectionRect.left;
    const offsetY = e.clientY - sectionRect.top;
    
    setSelectedSection(index);
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setDragOffset({ 
      x: (offsetX / container.width) * 100, 
      y: (offsetY / container.height) * 100 
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || selectedSection === null || !containerRef.current) return;
    
    e.preventDefault();
    const container = containerRef.current.getBoundingClientRect();
    
    const mouseXPercent = ((e.clientX - container.left) / container.width) * 100;
    const mouseYPercent = ((e.clientY - container.top) / container.height) * 100;

    const newSections = [...sections];
    const section = newSections[selectedSection];
    const newX = mouseXPercent - dragOffset.x;
    const newY = mouseYPercent - dragOffset.y;
    
    newSections[selectedSection] = {
      ...section,
      position: {
        ...section.position,
        x: Math.max(0, Math.min(100 - section.position.width, newX)),
        y: Math.max(0, Math.min(100 - section.position.height, newY))
      }
    };
    
    onSectionsChange(newSections);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragOffset({ x: 0, y: 0 });
  };

  // Update section position
  const updateSectionPosition = (index: number, updates: Partial<SectionPosition>) => {
    const newSections = [...sections];
    newSections[index] = {
      ...newSections[index],
      position: {
        ...newSections[index].position,
        ...updates
      }
    };
    onSectionsChange(newSections);
  };

  // Update user data for a field in a section
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

  // Get icon component
  const getIcon = (iconName: string) => {
    const IconComponent = iconMap[iconName] || LuUser;
    return IconComponent;
  };

  return (
    <div className="flex gap-4 h-full">
      {/* Sidebar - Only in edit/preview mode */}
      {(mode === 'edit' || mode === 'preview') && (
        <div className="w-80 bg-white rounded-lg shadow-lg p-4 space-y-4 overflow-y-auto max-h-screen">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg">Sections</h3>
            {mode === 'preview' && (
              <button
                onClick={() => setShowSectionLibrary(!showSectionLibrary)}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors text-sm"
              >
                <LuPlus className="w-4 h-4" />
                Thêm section
              </button>
            )}
          </div>

          {/* Section Library */}
          {showSectionLibrary && (
            <div className="border border-gray-200 rounded-lg p-3 space-y-2 max-h-64 overflow-y-auto">
              <p className="text-xs font-medium text-gray-600 mb-2">Chọn section để thêm:</p>
              {availableSections
                .filter(s => !sections.find(sec => sec.id === s.id))
                .map(section => {
                  const Icon = getIcon(section.icon);
                  return (
                    <button
                      key={section.id}
                      onClick={() => addSection(section)}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors text-left"
                    >
                      <Icon className="w-4 h-4 text-gray-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{section.name}</p>
                        <p className="text-xs text-gray-500">{section.description}</p>
                      </div>
                    </button>
                  );
                })}
            </div>
          )}

          {/* Sections List */}
          <div className="space-y-2">
            {sections.map((section, index) => {
              const Icon = getIcon(section.icon);
              const isExpanded = expandedSections.has(section.id);
              const sectionData = userData[section.id] || {};
              
              return (
                <div
                  key={`${section.id}-${index}`}
                  className={`border rounded-lg overflow-hidden transition-all ${
                    selectedSection === index ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
                  }`}
                >
                  {/* Section Header */}
                  <div
                    className="flex items-center gap-2 p-3 bg-gray-50 cursor-pointer hover:bg-gray-100"
                    onClick={() => toggleSection(section.id)}
                  >
                    <LuGripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                    <Icon className="w-4 h-4 text-gray-600" />
                    <span className="flex-1 text-sm font-medium">{section.name}</span>
                    
                    {mode === 'preview' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSectionVisibility(index);
                        }}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        {section.is_visible ? (
                          <LuEye className="w-4 h-4 text-gray-600" />
                        ) : (
                          <LuEyeOff className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    )}
                    
                    {mode === 'edit' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSection(index);
                        }}
                        className="p-1 hover:bg-red-100 rounded text-red-600"
                      >
                        <LuTrash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Section Content - Expanded */}
                  {isExpanded && (
                    <div className="p-3 space-y-3 border-t">
                      {mode === 'edit' && (
                        <>
                          {/* Position Controls */}
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs font-medium mb-1">X (%)</label>
                              <input
                                type="number"
                                value={section.position.x}
                                onChange={(e) => updateSectionPosition(index, { x: Number(e.target.value) })}
                                className="w-full px-2 py-1 text-sm border rounded"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium mb-1">Y (%)</label>
                              <input
                                type="number"
                                value={section.position.y}
                                onChange={(e) => updateSectionPosition(index, { y: Number(e.target.value) })}
                                className="w-full px-2 py-1 text-sm border rounded"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium mb-1">Width (%)</label>
                              <input
                                type="number"
                                value={section.position.width}
                                onChange={(e) => updateSectionPosition(index, { width: Number(e.target.value) })}
                                className="w-full px-2 py-1 text-sm border rounded"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium mb-1">Height (%)</label>
                              <input
                                type="number"
                                value={section.position.height}
                                onChange={(e) => updateSectionPosition(index, { height: Number(e.target.value) })}
                                className="w-full px-2 py-1 text-sm border rounded"
                              />
                            </div>
                          </div>
                        </>
                      )}

                      {mode === 'preview' && (
                        <>
                          {/* Fields Preview */}
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-gray-600">Các trường:</p>
                            {section.default_fields.fields.map((field: any) => (
                              <div key={field.id} className="text-xs">
                                <span className="font-medium">{field.label}</span>
                                {field.required && <span className="text-red-500 ml-1">*</span>}
                                {sectionData[field.id] && (
                                  <span className="ml-2 text-green-600">✓</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {sections.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <p className="text-sm">Chưa có section nào</p>
              {mode === 'preview' && (
                <button
                  onClick={() => setShowSectionLibrary(true)}
                  className="mt-2 text-blue-600 hover:text-blue-700 text-sm"
                >
                  Thêm section đầu tiên
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Canvas */}
      <div className="flex-1 bg-gray-100 rounded-lg p-8 overflow-auto">
        <div
          ref={containerRef}
          className="relative bg-white mx-auto shadow-2xl"
          style={{
            width: '210mm',
            minHeight: '297mm',
            backgroundImage: `url(${templateImage})`,
            backgroundSize: 'contain',
            backgroundPosition: 'top center',
            backgroundRepeat: 'no-repeat'
          }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Render sections */}
          {sections.map((section, index) => {
            if (mode === 'preview' && !section.is_visible) return null;
            
            const sectionData = userData[section.id] || {};
            const Icon = getIcon(section.icon);
            
            return (
              <div
                key={`${section.id}-${index}`}
                className={`absolute transition-shadow ${
                  mode === 'edit' || mode === 'preview' ? 'cursor-move' : ''
                } ${
                  selectedSection === index ? 'ring-2 ring-blue-500 z-10' : ''
                }`}
                style={{
                  left: `${section.position.x}%`,
                  top: `${section.position.y}%`,
                  width: `${section.position.width}%`,
                  height: `${section.position.height}%`,
                  userSelect: mode === 'edit' ? 'none' : 'auto'
                }}
                onMouseDown={(e) => handleMouseDown(e, index)}
              >
                {mode === 'edit' ? (
                  // Edit mode - Show placeholder
                  <div className="w-full h-full border-2 border-dashed border-blue-400 bg-blue-50 bg-opacity-50 rounded p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="w-5 h-5 text-blue-700" />
                      <span className="text-sm font-bold text-blue-700">{section.name}</span>
                    </div>
                    <div className="text-xs text-blue-600">
                      {section.default_fields.fields.length} trường
                    </div>
                  </div>
                ) : (
                  // Preview mode - Show input fields
                  <div className="w-full h-full border border-gray-300 rounded bg-white p-4 overflow-auto">
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b">
                      <Icon className="w-5 h-5 text-gray-700" />
                      <h3 className="text-sm font-bold text-gray-900">{section.name}</h3>
                    </div>
                    
                    <div className="space-y-3">
                      {section.default_fields.fields.map((field: any) => (
                        <div key={field.id}>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                          </label>
                          
                          {field.type === 'image' ? (
                            <div className="border-2 border-dashed border-gray-300 rounded p-2">
                              {sectionData[field.id] ? (
                                <img 
                                  src={sectionData[field.id]} 
                                  alt={field.label}
                                  className="w-full h-32 object-cover rounded"
                                />
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
                          ) : field.type === 'richtext' ? (
                            <ReactQuill
                              value={sectionData[field.id] || ''}
                              onChange={(value) => updateUserData(section.id, field.id, value)}
                              placeholder={field.placeholder}
                              className="text-xs"
                              theme="snow"
                              modules={{
                                toolbar: [
                                  ['bold', 'italic', 'underline'],
                                  [{ list: 'ordered' }, { list: 'bullet' }]
                                ]
                              }}
                            />
                          ) : (
                            <input
                              type="text"
                              value={sectionData[field.id] || ''}
                              onChange={(e) => updateUserData(section.id, field.id, e.target.value)}
                              placeholder={field.placeholder}
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SectionBasedCVEditor;
