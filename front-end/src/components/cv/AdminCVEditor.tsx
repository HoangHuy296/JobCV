import React, { useState, useRef, useEffect } from 'react';
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

interface SectionLayout {
  row: number;           // Row index (0, 1, 2, ...)
  column_width: number;  // Width as fraction: 1 (full), 0.5 (1/2), 0.33 (1/3), 0.25 (1/4), 0.67 (2/3), 0.75 (3/4)
  min_height?: number;   // Optional minimum height in pixels
}

interface TemplateSectionData {
  section: CVSection;
  layout: SectionLayout;
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
  const [showSectionLibrary, setShowSectionLibrary] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());
  const [draggingFieldIndex, setDraggingFieldIndex] = useState<number | null>(null);
  const [draggingSectionIndex, setDraggingSectionIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasAutoAdded, setHasAutoAdded] = useState(false);

  // Column width options
  const COLUMN_WIDTHS = [
    { value: 1, label: 'Full (1/1)', display: '100%' },
    { value: 0.5, label: 'Half (1/2)', display: '50%' },
    { value: 0.33, label: 'Third (1/3)', display: '33%' },
    { value: 0.67, label: 'Two Thirds (2/3)', display: '67%' },
    { value: 0.25, label: 'Quarter (1/4)', display: '25%' },
    { value: 0.75, label: 'Three Quarters (3/4)', display: '75%' }
  ];

  // Auto-add specific sections with predefined layout on mount if no sections exist
  useEffect(() => {
    if (!hasAutoAdded && sections.length === 0 && availableSections.length > 0) {
      // Define sections to add with their row and column width
      const sectionsToAdd = [
        { keyName: 'personal_info', row: 0, columnWidth: 1, minHeight: 150 },
        { keyName: 'skills', row: 1, columnWidth: 0.5, minHeight: 200 },
        { keyName: 'hobbies', row: 1, columnWidth: 0.5, minHeight: 200 },
        { keyName: 'education', row: 2, columnWidth: 1, minHeight: 150 },
        { keyName: 'work_experience', row: 3, columnWidth: 1, minHeight: 300 },
        { keyName: 'references', row: 4, columnWidth: 1, minHeight: 100 }
      ];

      const newSections: TemplateSectionData[] = [];

      sectionsToAdd.forEach((sectionConfig, index) => {
        const section = availableSections.find(s => s.key_name === sectionConfig.keyName);
        if (section) {
          newSections.push({
            section,
            layout: {
              row: sectionConfig.row,
              column_width: sectionConfig.columnWidth,
              min_height: sectionConfig.minHeight
            },
            is_visible: true,
            display_order: index
          });
        }
      });

      onSectionsChange(newSections);
      setHasAutoAdded(true);
    }
  }, [availableSections, sections.length, hasAutoAdded, onSectionsChange]);

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
    // Find the highest row number and add to next row
    const maxRow = sections.length > 0 
      ? Math.max(...sections.map(s => s.layout.row))
      : -1;
    
    const newSection: TemplateSectionData = {
      section,
      layout: {
        row: maxRow + 1,
        column_width: 1,  // Default to full width
        min_height: 150
      },
      is_visible: true,
      display_order: sections.length
    };
    onSectionsChange([...sections, newSection]);
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

  const updateLayout = (index: number, updates: Partial<SectionLayout>) => {
    const newSections = [...sections];
    newSections[index] = {
      ...newSections[index],
      layout: {
        ...newSections[index].layout,
        ...updates
      }
    };
    
    // If column width changed, recalculate rows to respect width constraints
    if (updates.column_width !== undefined) {
      let currentRow = 0;
      let currentRowWidth = 0;
      
      newSections.forEach((section) => {
        const sectionWidth = section.layout.column_width;
        
        // Check if adding this section would exceed row width
        if (currentRowWidth + sectionWidth > 1.01) {
          currentRow++;
          currentRowWidth = 0;
        }
        
        section.layout.row = currentRow;
        currentRowWidth += sectionWidth;
        
        // If this section fills the row completely, move to next row
        if (currentRowWidth >= 0.99) {
          currentRow++;
          currentRowWidth = 0;
        }
      });
    }
    
    onSectionsChange(newSections);
  };

  // Move section up or down (change row number)
  const moveSectionUp = (index: number) => {
    const newSections = [...sections];
    const currentRow = newSections[index].layout.row;
    if (currentRow === 0) return;
    
    newSections[index] = {
      ...newSections[index],
      layout: {
        ...newSections[index].layout,
        row: currentRow - 1
      }
    };
    onSectionsChange(newSections);
  };

  const moveSectionDown = (index: number) => {
    const newSections = [...sections];
    const currentRow = newSections[index].layout.row;
    
    newSections[index] = {
      ...newSections[index],
      layout: {
        ...newSections[index].layout,
        row: currentRow + 1
      }
    };
    onSectionsChange(newSections);
  };

  // Group sections by row for rendering
  const groupSectionsByRow = () => {
    const rows: { [key: number]: { section: TemplateSectionData; index: number }[] } = {};
    
    // Sort sections by display_order first to maintain consistent ordering
    const sortedSections = [...sections].sort((a, b) => a.display_order - b.display_order);
    
    sortedSections.forEach((section, index) => {
      // Handle sections without layout (from old templates)
      if (!section.layout) {
        section.layout = { row: index, column_width: 1, min_height: 150 };
      }
      const rowNum = section.layout.row;
      if (!rows[rowNum]) {
        rows[rowNum] = [];
      }
      // Find original index
      const originalIndex = sections.findIndex(s => s === section);
      rows[rowNum].push({ section, index: originalIndex });
    });
    
    // Validate row widths and adjust if needed
    Object.keys(rows).forEach(rowKey => {
      const rowNum = Number(rowKey);
      const rowSections = rows[rowNum];
      const totalWidth = rowSections.reduce((sum, s) => sum + s.section.layout.column_width, 0);
      
      // If total width exceeds 1, split into multiple rows
      if (totalWidth > 1.01) {
        let currentRow = rowNum;
        let currentWidth = 0;
        const newRows: { [key: number]: typeof rowSections } = {};
        
        rowSections.forEach(item => {
          const width = item.section.layout.column_width;
          
          if (currentWidth + width > 1.01) {
            currentRow++;
            currentWidth = 0;
          }
          
          if (!newRows[currentRow]) {
            newRows[currentRow] = [];
          }
          newRows[currentRow].push(item);
          currentWidth += width;
          
          if (currentWidth >= 0.99) {
            currentRow++;
            currentWidth = 0;
          }
        });
        
        // Update the rows object
        delete rows[rowNum];
        Object.assign(rows, newRows);
      }
    });
    
    return rows;
  };

  // Drag and drop for reordering sections
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggingSectionIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggingSectionIndex === null || draggingSectionIndex === index) return;
    
    const newSections = [...sections];
    const draggedSection = newSections[draggingSectionIndex];
    newSections.splice(draggingSectionIndex, 1);
    newSections.splice(index, 0, draggedSection);
    
    // Recalculate row numbers based on new order and column widths
    let currentRow = 0;
    let currentRowWidth = 0;
    
    newSections.forEach((section, idx) => {
      const sectionWidth = section.layout.column_width;
      
      // Check if adding this section would exceed row width
      if (currentRowWidth + sectionWidth > 1.01) { // Small tolerance for floating point
        currentRow++;
        currentRowWidth = 0;
      }
      
      section.layout.row = currentRow;
      currentRowWidth += sectionWidth;
      
      // If this section fills the row completely, move to next row
      if (currentRowWidth >= 0.99) { // Small tolerance for floating point
        currentRow++;
        currentRowWidth = 0;
      }
    });
    
    setDraggingSectionIndex(index);
    onSectionsChange(newSections);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDraggingSectionIndex(null);
  };

  const handleDragEnd = () => {
    setDraggingSectionIndex(null);
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
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
                className={`border rounded-xl overflow-hidden transition-all ${
                  selectedSectionIndex === index ? 'border-blue-500 ring-2 ring-blue-200 shadow-lg' : 'border-gray-200 hover:border-gray-300 shadow-sm'
                } ${draggingSectionIndex === index ? 'opacity-50' : ''}`}
              >
                {/* Section Header */}
                <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 transition-all">
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
                  <LuGripVertical className="w-4 h-4 text-gray-400 cursor-move" />
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
                      <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">Layout & Kích thước</p>
                      
                      {/* Row controls */}
                      <div className="flex items-center gap-2">
                        <label className="block text-xs font-semibold text-gray-700 flex-shrink-0">Hàng:</label>
                        <input
                          type="number"
                          min="1"
                          value={sectionData.layout.row + 1}
                          onChange={(e) => updateLayout(index, { row: Number(e.target.value) - 1 })}
                          className="w-20 px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <div className="flex gap-1 ml-auto">
                          <button
                            onClick={() => moveSectionUp(index)}
                            disabled={index === 0}
                            className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded"
                            title="Di chuyển lên"
                          >
                            ↑
                          </button>
                          <button
                            onClick={() => moveSectionDown(index)}
                            disabled={index === sections.length - 1}
                            className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded"
                            title="Di chuyển xuống"
                          >
                            ↓
                          </button>
                        </div>
                      </div>

                      {/* Column width selector */}
                      <div>
                        <label className="block text-xs font-semibold mb-1.5 text-gray-700">Độ rộng cột</label>
                        <select
                          value={sectionData.layout.column_width}
                          onChange={(e) => updateLayout(index, { column_width: Number(e.target.value) })}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          {COLUMN_WIDTHS.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label} - {option.display}
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">Các mục cùng hàng sẽ hiển thị cạnh nhau</p>
                      </div>

                      {/* Min height */}
                      <div>
                        <label className="block text-xs font-semibold mb-1.5 text-gray-700">Chiều cao tối thiểu (px)</label>
                        <input
                          type="number"
                          min="50"
                          step="10"
                          value={sectionData.layout.min_height || 150}
                          onChange={(e) => updateLayout(index, { min_height: Number(e.target.value) })}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
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
          className="bg-white mx-auto shadow-2xl rounded-sm flex flex-col"
          style={{
            width: '210mm',
            minHeight: '297mm',
            backgroundImage: `url(${templateImage})`,
            backgroundSize: 'contain',
            backgroundPosition: 'top center',
            backgroundRepeat: 'no-repeat'
          }}
        >
          {/* Render sections grouped by rows */}
          {Object.entries(groupSectionsByRow())
            .sort(([rowA], [rowB]) => Number(rowA) - Number(rowB))
            .map(([rowNum, rowSections]) => {
              const totalRowWidth = rowSections.reduce((sum, s) => sum + s.section.layout.column_width, 0);
              
              return (
                <div key={`row-${rowNum}`} className="flex gap-2 w-full">
                  {rowSections.map(({ section: sectionData, index }) => {
                    const { section, layout } = sectionData;
                    const Icon = getIcon(section.icon);
                    console.log(rowSections.length)
                    return (
                      <div
                        key={`${section.id}-${index}`}
                        className={`transition-all ${
                          selectedSectionIndex === index ? 'ring-2 ring-blue-500 z-10' : ''
                        }`}
                        style={{
                          flex: `0 0 calc(${(layout.column_width / totalRowWidth) * 100}% - ${rowSections.length > 1 ? '4px' : '0px'})`,
                          minHeight: `${layout.min_height || 150}px`
                        }}
                        draggable
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragEnd={handleDragEnd}
                        onClick={() => setSelectedSectionIndex(index)}
                      >
                        <div className="w-full h-full border-2 border-dashed border-blue-400 bg-gradient-to-br from-blue-50 to-blue-100 bg-opacity-90 rounded-lg p-3 flex flex-col shadow-sm cursor-move">
                          <div className="flex items-center gap-2 mb-2">
                            <LuGripVertical className="w-4 h-4 text-blue-400" />
                            <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center">
                              <Icon className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-sm font-bold text-blue-900">{section.name}</span>
                            <span className="ml-auto text-xs text-blue-600 font-medium">
                              {Math.round((layout.column_width / totalRowWidth) * 100)}%
                            </span>
                          </div>
                          <div className="text-xs text-blue-700 font-medium">
                            {section.default_fields.fields.length} trường dữ liệu
                          </div>
                          <div className="text-xs text-blue-600 mt-1">
                            Hàng {layout.row + 1}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};

export default AdminCVEditor;
