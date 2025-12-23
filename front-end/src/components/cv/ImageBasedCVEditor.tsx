import React, { useState, useRef } from 'react';
import { LuPlus, LuTrash2, LuMove, LuType, LuImage, LuAlignLeft } from 'react-icons/lu';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

interface TextField {
  id: string;
  type: 'text' | 'title' | 'richtext' | 'image';
  label: string;
  x: number; // Position in percentage
  y: number;
  width: number;
  height: number;
  fontSize?: number;
  fontWeight?: string;
  color?: string;
  align?: 'left' | 'center' | 'right';
  placeholder?: string;
}

interface ImageBasedCVEditorProps {
  templateImage: string;
  fields: TextField[];
  onFieldsChange: (fields: TextField[]) => void;
  mode: 'edit' | 'preview'; // edit = admin đang setup, preview = user đang điền
  userData?: Record<string, any>; // Data user đã điền
  onUserDataChange?: (data: Record<string, any>) => void;
}

const ImageBasedCVEditor: React.FC<ImageBasedCVEditorProps> = ({
  templateImage,
  fields,
  onFieldsChange,
  mode,
  userData = {},
  onUserDataChange
}) => {
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showFieldMenu, setShowFieldMenu] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Add new field
  const addField = (type: TextField['type']) => {
    const newField: TextField = {
      id: `field_${Date.now()}`,
      type,
      label: type === 'title' ? 'Tiêu đề' : type === 'image' ? 'Ảnh' : 'Văn bản',
      x: 10,
      y: 10,
      width: type === 'image' ? 20 : type === 'title' ? 40 : 50,
      height: type === 'image' ? 20 : type === 'title' ? 8 : 15,
      fontSize: type === 'title' ? 24 : 14,
      fontWeight: type === 'title' ? 'bold' : 'normal',
      color: '#000000',
      align: 'left',
      placeholder: `Nhập ${type === 'title' ? 'tiêu đề' : 'nội dung'}...`
    };
    onFieldsChange([...fields, newField]);
    setShowFieldMenu(false);
  };

  // Delete field
  const deleteField = (id: string) => {
    onFieldsChange(fields.filter(f => f.id !== id));
    setSelectedField(null);
  };

  // Update field position
  const handleMouseDown = (e: React.MouseEvent, fieldId: string) => {
    if (mode !== 'edit') return;
    e.preventDefault();
    e.stopPropagation();
    
    const field = fields.find(f => f.id === fieldId);
    if (!field || !containerRef.current) return;
    
    const container = containerRef.current.getBoundingClientRect();
    const fieldElement = e.currentTarget as HTMLElement;
    const fieldRect = fieldElement.getBoundingClientRect();
    
    // Calculate offset from mouse to field's top-left corner
    const offsetX = e.clientX - fieldRect.left;
    const offsetY = e.clientY - fieldRect.top;
    
    setSelectedField(fieldId);
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setDragOffset({ 
      x: (offsetX / container.width) * 100, 
      y: (offsetY / container.height) * 100 
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !selectedField || !containerRef.current) return;
    
    e.preventDefault();
    const container = containerRef.current.getBoundingClientRect();
    
    // Calculate new position based on mouse position minus offset
    const mouseXPercent = ((e.clientX - container.left) / container.width) * 100;
    const mouseYPercent = ((e.clientY - container.top) / container.height) * 100;

    onFieldsChange(fields.map(field => {
      if (field.id === selectedField) {
        const newX = mouseXPercent - dragOffset.x;
        const newY = mouseYPercent - dragOffset.y;
        
        return {
          ...field,
          x: Math.max(0, Math.min(100 - field.width, newX)),
          y: Math.max(0, Math.min(100 - field.height, newY))
        };
      }
      return field;
    }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragOffset({ x: 0, y: 0 });
  };

  // Update field properties
  const updateField = (id: string, updates: Partial<TextField>) => {
    onFieldsChange(fields.map(field => 
      field.id === id ? { ...field, ...updates } : field
    ));
  };

  // Update user data
  const updateUserData = (fieldId: string, value: any) => {
    if (onUserDataChange) {
      onUserDataChange({ ...userData, [fieldId]: value });
    }
  };

  return (
    <div className="flex gap-4 h-full">
      {/* Toolbar - Only in edit mode */}
      {mode === 'edit' && (
        <div className="w-64 bg-white rounded-lg shadow-lg p-4 space-y-4">
          <h3 className="font-bold text-lg mb-4">Công cụ</h3>
          
          {/* Add Field Menu */}
          <div className="space-y-2">
            <button
              onClick={() => addField('title')}
              className="w-full flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors"
            >
              <LuType className="w-4 h-4" />
              Thêm Tiêu đề
            </button>
            <button
              onClick={() => addField('text')}
              className="w-full flex items-center gap-2 px-4 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition-colors"
            >
              <LuAlignLeft className="w-4 h-4" />
              Thêm Text đơn giản
            </button>
            <button
              onClick={() => addField('richtext')}
              className="w-full flex items-center gap-2 px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg transition-colors"
            >
              <LuAlignLeft className="w-4 h-4" />
              Thêm Rich Text
            </button>
            <button
              onClick={() => addField('image')}
              className="w-full flex items-center gap-2 px-4 py-2 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg transition-colors"
            >
              <LuImage className="w-4 h-4" />
              Thêm Ảnh
            </button>
          </div>

          {/* Field Properties */}
          {selectedField && (
            <div className="border-t pt-4 mt-4">
              <h4 className="font-semibold mb-3">Thuộc tính</h4>
              {(() => {
                const field = fields.find(f => f.id === selectedField);
                if (!field) return null;

                return (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium mb-1">Nhãn</label>
                      <input
                        type="text"
                        value={field.label}
                        onChange={(e) => updateField(field.id, { label: e.target.value })}
                        className="w-full px-2 py-1 text-sm border rounded"
                      />
                    </div>

                    {field.type !== 'image' && (
                      <>
                        <div>
                          <label className="block text-xs font-medium mb-1">Cỡ chữ</label>
                          <input
                            type="number"
                            value={field.fontSize}
                            onChange={(e) => updateField(field.id, { fontSize: Number(e.target.value) })}
                            className="w-full px-2 py-1 text-sm border rounded"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium mb-1">Màu chữ</label>
                          <input
                            type="color"
                            value={field.color}
                            onChange={(e) => updateField(field.id, { color: e.target.value })}
                            className="w-full h-8 border rounded"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium mb-1">Căn lề</label>
                          <select
                            value={field.align}
                            onChange={(e) => updateField(field.id, { align: e.target.value as any })}
                            className="w-full px-2 py-1 text-sm border rounded"
                          >
                            <option value="left">Trái</option>
                            <option value="center">Giữa</option>
                            <option value="right">Phải</option>
                          </select>
                        </div>
                      </>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium mb-1">Rộng (%)</label>
                        <input
                          type="number"
                          value={field.width}
                          onChange={(e) => updateField(field.id, { width: Number(e.target.value) })}
                          className="w-full px-2 py-1 text-sm border rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Cao (%)</label>
                        <input
                          type="number"
                          value={field.height}
                          onChange={(e) => updateField(field.id, { height: Number(e.target.value) })}
                          className="w-full px-2 py-1 text-sm border rounded"
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => deleteField(field.id)}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition-colors"
                    >
                      <LuTrash2 className="w-4 h-4" />
                      Xóa
                    </button>
                  </div>
                );
              })()}
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
          {/* Render fields */}
          {fields.map(field => (
            <div
              key={field.id}
              className={`absolute transition-shadow ${
                mode === 'edit' ? 'cursor-move' : ''
              } ${
                selectedField === field.id && mode === 'edit' ? 'ring-2 ring-blue-500 z-10' : ''
              }`}
              style={{
                left: `${field.x}%`,
                top: `${field.y}%`,
                width: `${field.width}%`,
                height: `${field.height}%`,
                userSelect: mode === 'edit' ? 'none' : 'auto'
              }}
              onMouseDown={(e) => handleMouseDown(e, field.id)}
            >
              {mode === 'edit' ? (
                // Edit mode - Show placeholder
                <div className="w-full h-full border-2 border-dashed border-blue-400 bg-blue-50 bg-opacity-50 flex items-center justify-center p-2">
                  <span className="text-xs font-medium text-blue-700 text-center">
                    {field.label}
                  </span>
                </div>
              ) : (
                // Preview mode - Show input fields
                <div className="w-full h-full">
                  {field.type === 'image' ? (
                    <div className="w-full h-full border-2 border-gray-300 rounded overflow-hidden bg-gray-100">
                      {userData[field.id] ? (
                        <img 
                          src={userData[field.id]} 
                          alt={field.label}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (e) => {
                                  updateUserData(field.id, e.target?.result);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                            className="text-xs"
                          />
                        </div>
                      )}
                    </div>
                  ) : field.type === 'richtext' ? (
                    <ReactQuill
                      value={userData[field.id] || ''}
                      onChange={(value) => updateUserData(field.id, value)}
                      placeholder={field.placeholder}
                      className="h-full"
                      style={{
                        fontSize: `${field.fontSize}px`,
                        color: field.color,
                        textAlign: field.align
                      }}
                    />
                  ) : (
                    <input
                      type="text"
                      value={userData[field.id] || ''}
                      onChange={(e) => updateUserData(field.id, e.target.value)}
                      placeholder={field.placeholder}
                      className="w-full h-full bg-transparent border-none outline-none px-2"
                      style={{
                        fontSize: `${field.fontSize}px`,
                        fontWeight: field.fontWeight,
                        color: field.color,
                        textAlign: field.align
                      }}
                    />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ImageBasedCVEditor;
