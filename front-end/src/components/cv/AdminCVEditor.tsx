import React, { useState, useRef } from 'react';
import { 
  LuPlus, LuTrash2, LuGripVertical, LuChevronDown, LuChevronRight,
  LuUser, LuTarget, LuWrench, LuBriefcase, LuGraduationCap,
  LuAward, LuFolderGit2, LuHeart, LuUsers, LuPencil, LuX
} from 'react-icons/lu';
import type { CVSection } from '../../api/cvSectionService';

interface FieldDefinition {
  id: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'textarea' | 'richtext' | 'image' | 'date';
  placeholder?: string;
  required: boolean;
}

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

interface AdminCVEditorProps {
  templateImage: string;
  sections: TemplateSectionData[];
  onSectionsChange: (sections: TemplateSectionData[]) => void;
  availableSections?: CVSection[];
}

const iconMap: Record<string, any> = {
  LuUser, LuTarget, LuWrench, LuBriefcase, LuGraduationCap,
  LuAward, LuFolderGit2, LuHeart, LuUsers
};

const AdminCVEditor: React.FC<AdminCVEditorProps> = ({
  templateImage,
  sections,
  onSectionsChange,
  availableSections = []
}) => {
  const [selectedSectionIndex, setSelectedSectionIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showSectionLibrary, setShowSectionLibrary] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());
  const [draggingFieldIndex, setDraggingFieldIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const addSection = (section: CVSection) => {
    const newSection: TemplateSectionData = {
      section,
      position: {
        x: 10,
        y: 10,
        width: 80,
        height: 20
      },
      is_visible: true,
      display_order: 0
    };
    onSectionsChange([newSection, ...sections]);
    setShowSectionLibrary(false);
  };

  const addFieldToSection = (sectionIndex: number) => {
    const newSections = [...sections];
    const section = newSections[sectionIndex];
    const newField: any = {
      id: `field_${Date.now()}`,
      label: 'New Field',
      type: 'text',
      placeholder: '',
      required: false
    };
    
    const currentFields = section.section.default_fields.fields || [];
    section.section.default_fields.fields = [newField, ...currentFields];
    onSectionsChange(newSections);
  };

  const removeFieldFromSection = (sectionIndex: number, fieldIndex: number) => {
    const newSections = [...sections];
    const section = newSections[sectionIndex];
    section.section.default_fields.fields = section.section.default_fields.fields.filter((_, i) => i !== fieldIndex);
    onSectionsChange(newSections);
  };

  const updateFieldInSection = (sectionIndex: number, fieldIndex: number, updates: Partial<FieldDefinition>) => {
    const newSections = [...sections];
    const section = newSections[sectionIndex];
    section.section.default_fields.fields[fieldIndex] = {
      ...section.section.default_fields.fields[fieldIndex],
      ...updates
    } as any;
    onSectionsChange(newSections);
  };

  const reorderFields = (sectionIndex: number, fromIndex: number, toIndex: number) => {
    const newSections = [...sections];
    const section = newSections[sectionIndex];
    const fields = [...section.section.default_fields.fields];
    const [movedField] = fields.splice(fromIndex, 1);
    fields.splice(toIndex, 0, movedField);
    section.section.default_fields.fields = fields;
    onSectionsChange(newSections);
  };

  const removeSection = (index: number) => {
    onSectionsChange(sections.filter((_, i) => i !== index));
    setSelectedSectionIndex(null);
  };

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

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragOffset({ x: 0, y: 0 });
  };

  return (
    <div className="flex gap-4 h-full">
      {/* Sidebar - Section List */}
      <div className="w-80 bg-gradient-to-b from-gray-50 to-white border-r border-gray-200 p-4 space-y-4 overflow-y-auto">
        <div className="flex items-center justify-between sticky top-0 bg-white pb-3 border-b-2 border-gray-200 z-10">
          <h3 className="font-bold text-lg text-gray-900">Danh sách mục</h3>
          <button
            onClick={() => setShowSectionLibrary(!showSectionLibrary)}
            className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-all shadow-sm hover:shadow-md text-sm font-medium"
          >
            <LuPlus className="w-4 h-4" />
            Thêm mục
          </button>
        </div>

        {/* Section Library */}
        {showSectionLibrary && (
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
                  <LuGripVertical className="w-4 h-4 text-gray-400" />
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold block truncate text-gray-900">{section.name}</span>
                  </div>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeSection(index);
                    }}
                    className="p-1 hover:bg-red-100 rounded text-red-600"
                  >
                    <LuTrash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Section Content - Expanded */}
                {isExpanded && (
                  <div className="p-4 space-y-3 border-t bg-white">
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

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">Các trường dữ liệu</p>
                        <button
                          onClick={() => addFieldToSection(index)}
                          className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1"
                        >
                          <LuPlus className="w-3 h-3" />
                          Thêm field
                        </button>
                      </div>
                      {section.default_fields.fields.map((field: any, fieldIdx: number) => (
                        <div 
                          key={field.id} 
                          className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200 p-3"
                          draggable={true}
                          onDragStart={(e) => {
                            setDraggingFieldIndex(fieldIdx);
                            e.dataTransfer.effectAllowed = 'move';
                          }}
                          onDragOver={(e) => {
                            if (draggingFieldIndex !== null && draggingFieldIndex !== fieldIdx) {
                              e.preventDefault();
                              e.dataTransfer.dropEffect = 'move';
                            }
                          }}
                          onDrop={(e) => {
                            if (draggingFieldIndex !== null) {
                              e.preventDefault();
                              reorderFields(index, draggingFieldIndex, fieldIdx);
                              setDraggingFieldIndex(null);
                            }
                          }}
                          onDragEnd={() => setDraggingFieldIndex(null)}
                          style={{
                            opacity: draggingFieldIndex === fieldIdx ? 0.5 : 1,
                            cursor: 'move'
                          }}
                        >
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-300">
                              <LuGripVertical className="w-4 h-4 text-gray-400" />
                              <span className="text-xs text-gray-500 font-medium">Kéo để sắp xếp</span>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Label</label>
                              <input
                                type="text"
                                value={field.label}
                                onChange={(e) => updateFieldInSection(index, fieldIdx, { label: e.target.value })}
                                placeholder="Label"
                                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                              <select
                                value={field.type}
                                onChange={(e) => updateFieldInSection(index, fieldIdx, { type: e.target.value as any })}
                                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              >
                                <option value="text">Text</option>
                                <option value="email">Email</option>
                                <option value="tel">Phone</option>
                                <option value="textarea">Textarea</option>
                                <option value="richtext">Rich Text</option>
                                <option value="image">Image</option>
                                <option value="date">Date</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Placeholder</label>
                              <input
                                type="text"
                                value={field.placeholder || ''}
                                onChange={(e) => updateFieldInSection(index, fieldIdx, { placeholder: e.target.value })}
                                placeholder="Placeholder"
                                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                            <div>
                              <label className="flex items-center justify-between text-xs font-medium text-gray-700 mb-1">
                                <span>Required</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newValue = !field.required;
                                    updateFieldInSection(index, fieldIdx, { required: newValue });
                                  }}
                                  className={`${field.required ? 'bg-blue-600' : 'bg-gray-200'}
                                    relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                                  role="switch"
                                  aria-checked={field.required}
                                >
                                  <span className="sr-only">Required</span>
                                  <span
                                    aria-hidden="true"
                                    className={`${field.required ? 'translate-x-4' : 'translate-x-0'}
                                      pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                                  />
                                </button>
                              </label>
                            </div>
                            <div className="pt-2 border-t border-gray-300">
                              <button
                                onClick={() => removeFieldFromSection(index, fieldIdx)}
                                className="w-full text-xs px-2 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 transition-colors flex items-center justify-center gap-1"
                              >
                                <LuTrash2 className="w-3 h-3" />
                                Xóa field
                              </button>
                            </div>
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
            <button
              onClick={() => setShowSectionLibrary(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-all shadow-sm hover:shadow-md"
            >
              Thêm mục đầu tiên
            </button>
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
            const { section, position } = sectionData;
            const Icon = getIcon(section.icon);
            
            return (
              <div
                key={`${section.id}-${index}`}
                className={`absolute transition-shadow cursor-move ${
                  selectedSectionIndex === index ? 'ring-2 ring-blue-500 z-10' : ''
                }`}
                style={{
                  left: `${position.x}%`,
                  top: `${position.y}%`,
                  width: `${position.width}%`,
                  height: `${position.height}%`,
                  userSelect: 'none'
                }}
                onMouseDown={(e) => handleMouseDown(e, index)}
                onClick={() => setSelectedSectionIndex(index)}
              >
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
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdminCVEditor;
