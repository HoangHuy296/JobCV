import React, { useState, useRef } from 'react';
import { 
  LuPlus, LuTrash2, LuEye, LuEyeOff, LuGripVertical, LuChevronDown, LuChevronRight,
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

interface UnifiedCVEditorProps {
  templateImage: string;
  sections: TemplateSectionData[];
  onSectionsChange: (sections: TemplateSectionData[]) => void;
  mode: 'admin' | 'user'; // admin = setup template, user = fill CV
  userData?: Record<number, Record<string, any>>; // {section_id: {field_id: value}}
  onUserDataChange?: (data: Record<number, Record<string, any>>) => void;
  availableSections?: CVSection[]; // Sections có sẵn để thêm
}

const iconMap: Record<string, any> = {
  LuUser, LuTarget, LuWrench, LuBriefcase, LuGraduationCap,
  LuAward, LuFolderGit2, LuHeart, LuUsers
};

const UnifiedCVEditor: React.FC<UnifiedCVEditorProps> = ({
  templateImage,
  sections,
  onSectionsChange,
  mode,
  userData = {},
  onUserDataChange,
  availableSections = []
}) => {
  const [selectedSectionIndex, setSelectedSectionIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
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

  // Get icon component
  const getIcon = (iconName: string) => {
    return iconMap[iconName] || LuUser;
  };

  // Add section
  const addSection = (section: CVSection) => {
    const newSection: TemplateSectionData = {
      section,
      position: {
        x: 10,
        y: 10 + sections.length * 5,
        width: 80,
        height: 20
      },
      is_visible: true,
      display_order: sections.length
    };
    onSectionsChange([...sections, newSection]);
    setShowSectionLibrary(false);
  };

  // Remove section
  const removeSection = (index: number) => {
    onSectionsChange(sections.filter((_, i) => i !== index));
    setSelectedSectionIndex(null);
  };

  // Toggle visibility
  const toggleVisibility = (index: number) => {
    const newSections = [...sections];
    newSections[index] = {
      ...newSections[index],
      is_visible: !newSections[index].is_visible
    };
    onSectionsChange(newSections);
  };

  // Handle drag start
  const handleMouseDown = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!containerRef.current) return;
    
    const container = containerRef.current.getBoundingClientRect();
    const sectionElement = e.currentTarget as HTMLElement;
    const sectionRect = sectionElement.getBoundingClientRect();
    
    const offsetX = e.clientX - sectionRect.left;
    const offsetY = e.clientY - sectionRect.top;
    
    setSelectedSectionIndex(index);
    setIsDragging(true);
    setDragOffset({ 
      x: (offsetX / container.width) * 100, 
      y: (offsetY / container.height) * 100 
    });
  };

  // Handle drag move
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || selectedSectionIndex === null || !containerRef.current) return;
    
    e.preventDefault();
    const container = containerRef.current.getBoundingClientRect();
    
    const mouseXPercent = ((e.clientX - container.left) / container.width) * 100;
    const mouseYPercent = ((e.clientY - container.top) / container.height) * 100;

    const newSections = [...sections];
    const section = newSections[selectedSectionIndex];
    const newX = mouseXPercent - dragOffset.x;
    const newY = mouseYPercent - dragOffset.y;
    
    newSections[selectedSectionIndex] = {
      ...section,
      position: {
        ...section.position,
        x: Math.max(0, Math.min(100 - section.position.width, newX)),
        y: Math.max(0, Math.min(100 - section.position.height, newY))
      }
    };
    
    onSectionsChange(newSections);
  };

  // Handle drag end
  const handleMouseUp = () => {
    setIsDragging(false);
    setDragOffset({ x: 0, y: 0 });
  };

  // Update section position
  const updatePosition = (index: number, updates: Partial<SectionPosition>) => {
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

  // Update user data
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
      {/* Sidebar */}
      <div className="w-80 bg-gradient-to-b from-gray-50 to-white border-r border-gray-200 p-4 space-y-4 overflow-y-auto">
        <div className="flex items-center justify-between sticky top-0 bg-white pb-3 border-b-2 border-gray-200 z-10">
          <h3 className="font-bold text-lg text-gray-900">Danh sách mục</h3>
          {mode === 'admin' && (
            <button
              onClick={() => setShowSectionLibrary(!showSectionLibrary)}
              className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-all shadow-sm hover:shadow-md text-sm font-medium"
            >
              <LuPlus className="w-4 h-4" />
              Thêm mục
            </button>
          )}
        </div>

        {/* Section Library */}
        {showSectionLibrary && mode === 'admin' && (
          <div className="border-2 border-blue-300 rounded-xl p-4 space-y-2 bg-gradient-to-br from-blue-50 to-blue-100 max-h-96 overflow-y-auto shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-blue-900">Thư viện mục</p>
              <button
                onClick={() => setShowSectionLibrary(false)}
                className="text-blue-600 hover:text-blue-800 text-xs font-medium"
              >
                Đóng
              </button>
            </div>
            {availableSections
              .filter(s => !sections.find(sec => sec.section.id === s.id))
              .map(section => {
                const Icon = getIcon(section.icon);
                return (
                  <button
                    key={section.id}
                    onClick={() => addSection(section)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 bg-white hover:bg-blue-50 rounded-lg transition-all text-left border border-gray-200 hover:border-blue-400 hover:shadow-sm"
                  >
                    <Icon className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{section.name}</p>
                      <p className="text-xs text-gray-600 truncate">{section.description}</p>
                    </div>
                  </button>
                );
              })}
            {availableSections.filter(s => !sections.find(sec => sec.section.id === s.id)).length === 0 && (
              <p className="text-sm text-blue-700 text-center py-3 font-medium">✓ Đã thêm tất cả các mục</p>
            )}
          </div>
        )}

        {/* Sections List */}
        <div className="space-y-2">
          {sections.map((sectionData, index) => {
            const { section } = sectionData;
            const Icon = getIcon(section.icon);
            const isExpanded = expandedSections.has(section.id);
            const sectionUserData = userData[section.id] || {};
            const filledFields = Object.keys(sectionUserData).length;
            const totalFields = section.default_fields.fields.length;
            
            return (
              <div
                key={`${section.id}-${index}`}
                className={`border rounded-xl overflow-hidden transition-all ${
                  selectedSectionIndex === index ? 'border-blue-500 ring-2 ring-blue-200 shadow-lg' : 'border-gray-200 hover:border-gray-300 shadow-sm'
                }`}
              >
                {/* Section Header */}
                <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 cursor-pointer transition-all">
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="p-0.5 hover:bg-gray-200 rounded"
                  >
                    {isExpanded ? (
                      <LuChevronDown className="w-4 h-4 text-gray-600" />
                    ) : (
                      <LuChevronRight className="w-4 h-4 text-gray-600" />
                    )}
                  </button>
                  {mode === 'admin' && <LuGripVertical className="w-4 h-4 text-gray-400" />}
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold block truncate text-gray-900">{section.name}</span>
                    {mode === 'user' && (
                      <span className="text-xs text-gray-600 font-medium">
                        {filledFields}/{totalFields} trường đã điền
                      </span>
                    )}
                  </div>
                  
                  {mode === 'user' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleVisibility(index);
                      }}
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      {sectionData.is_visible ? (
                        <LuEye className="w-4 h-4 text-gray-600" />
                      ) : (
                        <LuEyeOff className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  )}
                  
                  {mode === 'admin' && (
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
                  <div className="p-4 space-y-3 border-t bg-white">
                    {mode === 'admin' && (
                      <div className="space-y-3">
                        <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">Vị trí & Kích thước</p>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold mb-1.5 text-gray-700">X (%)</label>
                          <input
                            type="number"
                            value={sectionData.position.x}
                            onChange={(e) => updatePosition(index, { x: Number(e.target.value) })}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold mb-1.5 text-gray-700">Y (%)</label>
                          <input
                            type="number"
                            value={sectionData.position.y}
                            onChange={(e) => updatePosition(index, { y: Number(e.target.value) })}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold mb-1.5 text-gray-700">Rộng (%)</label>
                          <input
                            type="number"
                            value={sectionData.position.width}
                            onChange={(e) => updatePosition(index, { width: Number(e.target.value) })}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold mb-1.5 text-gray-700">Cao (%)</label>
                          <input
                            type="number"
                            value={sectionData.position.height}
                            onChange={(e) => updatePosition(index, { height: Number(e.target.value) })}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                          />
                        </div>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">Các trường dữ liệu</p>
                      {section.default_fields.fields.map((field: any) => (
                        <div key={field.id} className="flex items-center justify-between text-xs py-2 px-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200">
                          <span className="font-semibold text-gray-800">{field.label}</span>
                          <div className="flex items-center gap-2">
                            {field.required && <span className="text-red-500">*</span>}
                            {mode === 'user' && sectionUserData[field.id] && (
                              <span className="text-green-600">✓</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {sections.length === 0 && (
          <div className="text-center py-12 px-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <LuPlus className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-600 mb-3">Chưa có mục nào</p>
            {mode === 'admin' && (
              <button
                onClick={() => setShowSectionLibrary(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-all shadow-sm hover:shadow-md"
              >
                Thêm mục đầu tiên
              </button>
            )}
          </div>
        )}
      </div>

      {/* Canvas */}
      <div className="flex-1 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg p-8 overflow-y-auto overflow-x-hidden">
        <div
          ref={containerRef}
          className="relative bg-white mx-auto shadow-2xl rounded-sm"
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
          {sections.map((sectionData, index) => {
            if (mode === 'user' && !sectionData.is_visible) return null;
            
            const { section, position } = sectionData;
            const sectionUserData = userData[section.id] || {};
            const Icon = getIcon(section.icon);
            
            return (
              <div
                key={`${section.id}-${index}`}
                className={`absolute transition-shadow ${mode === 'admin' ? 'cursor-move' : ''} ${
                  selectedSectionIndex === index ? 'ring-2 ring-blue-500 z-10' : ''
                }`}
                style={{
                  left: `${position.x}%`,
                  top: `${position.y}%`,
                  width: `${position.width}%`,
                  height: `${position.height}%`,
                  userSelect: mode === 'admin' ? 'none' : 'auto',
                  pointerEvents: mode === 'user' ? 'auto' : undefined
                }}
                onMouseDown={(e) => mode === 'admin' ? handleMouseDown(e, index) : undefined}
              >
                {mode === 'admin' ? (
                  // Admin mode - Show placeholder
                  <div className="w-full h-full border-2 border-dashed border-blue-400 bg-gradient-to-br from-blue-50 to-blue-100 bg-opacity-90 rounded-lg p-3 flex flex-col shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center">
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-sm font-bold text-blue-900">{section.name}</span>
                    </div>
                    <div className="text-xs text-blue-700 font-medium">
                      {section.default_fields.fields.length} trường dữ liệu
                    </div>
                  </div>
                ) : (
                  // User mode - Show input fields
                  <div className="w-full h-full border-2 border-gray-300 rounded-lg bg-white shadow-md p-4 overflow-auto">
                    <div className="flex items-center gap-2 mb-3 pb-3 border-b-2 border-gray-200">
                      <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Icon className="w-4 h-4 text-blue-600" />
                      </div>
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
                          ) : field.type === 'richtext' ? (
                            <ReactQuill
                              value={sectionUserData[field.id] || ''}
                              onChange={(value) => updateUserData(section.id, field.id, value)}
                              placeholder={field.placeholder}
                              className="text-xs bg-white"
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
                              value={sectionUserData[field.id] || ''}
                              onChange={(e) => updateUserData(section.id, field.id, e.target.value)}
                              placeholder={field.placeholder}
                              className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
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

export default UnifiedCVEditor;
