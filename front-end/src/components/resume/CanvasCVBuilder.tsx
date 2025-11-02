import React, { useState, useRef } from 'react';
import { Stage, Layer, Text, Rect, Circle, Image as KonvaImage, Transformer } from 'react-konva';
import { LuPlus, LuType, LuImage, LuSquare, LuCircle, LuTrash2, LuDownload, LuPalette } from 'react-icons/lu';

interface CanvasElement {
  id: string;
  type: 'text' | 'rect' | 'circle' | 'image';
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  text?: string;
  fontSize?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  draggable: boolean;
}

interface CanvasCVBuilderProps {
  onSave: (elements: CanvasElement[], canvasImage: string) => void;
}

const CanvasCVBuilder: React.FC<CanvasCVBuilderProps> = ({ onSave }) => {
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [canvasColor, setCanvasColor] = useState('#F8FAFC');
  const stageRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Template presets
  const applyTemplate = (templateName: string) => {
    let templateElements: CanvasElement[] = [];
    
    if (templateName === 'modern') {
      templateElements = [
        // Header background
        { id: 'header-bg', type: 'rect', x: 0, y: 0, width: 794, height: 200, fill: '#3B82F6', draggable: false },
        // Name
        { id: 'name', type: 'text', x: 50, y: 50, text: 'TÊN CỦA BẠN', fontSize: 36, fill: '#FFFFFF', draggable: true },
        // Title
        { id: 'title', type: 'text', x: 50, y: 100, text: 'Chức Danh Nghề Nghiệp', fontSize: 20, fill: '#E0E7FF', draggable: true },
        // Contact info
        { id: 'email', type: 'text', x: 50, y: 140, text: '📧 email@example.com', fontSize: 14, fill: '#FFFFFF', draggable: true },
        { id: 'phone', type: 'text', x: 300, y: 140, text: '📱 0123-456-789', fontSize: 14, fill: '#FFFFFF', draggable: true },
        // Section: About
        { id: 'about-title', type: 'text', x: 50, y: 240, text: 'VỀ TÔI', fontSize: 24, fill: '#1F2937', draggable: true },
        { id: 'about-line', type: 'rect', x: 50, y: 275, width: 100, height: 3, fill: '#3B82F6', draggable: true },
        { id: 'about-text', type: 'text', x: 50, y: 295, text: 'Mô tả ngắn gọn về bản thân...', fontSize: 14, fill: '#4B5563', draggable: true },
        // Section: Experience
        { id: 'exp-title', type: 'text', x: 50, y: 380, text: 'KINH NGHIỆM', fontSize: 24, fill: '#1F2937', draggable: true },
        { id: 'exp-line', type: 'rect', x: 50, y: 415, width: 100, height: 3, fill: '#3B82F6', draggable: true },
        // Circle decoration
        { id: 'circle-1', type: 'circle', x: 700, y: 100, radius: 40, fill: '#60A5FA', stroke: '#3B82F6', strokeWidth: 3, draggable: true },
      ];
    } else if (templateName === 'creative') {
      templateElements = [
        // Sidebar
        { id: 'sidebar', type: 'rect', x: 0, y: 0, width: 250, height: 1123, fill: '#7C3AED', draggable: false },
        // Profile circle
        { id: 'profile-bg', type: 'circle', x: 125, y: 100, radius: 60, fill: '#FFFFFF', draggable: true },
        // Name
        { id: 'name', type: 'text', x: 280, y: 50, text: 'TÊN CỦA BẠN', fontSize: 32, fill: '#1F2937', draggable: true },
        // Title
        { id: 'title', type: 'text', x: 280, y: 95, text: 'Chức Danh', fontSize: 18, fill: '#7C3AED', draggable: true },
        // Sidebar sections
        { id: 'contact-title', type: 'text', x: 30, y: 200, text: 'LIÊN HỆ', fontSize: 16, fill: '#FFFFFF', draggable: true },
        { id: 'email', type: 'text', x: 30, y: 235, text: 'email@example.com', fontSize: 12, fill: '#E9D5FF', draggable: true },
        { id: 'phone', type: 'text', x: 30, y: 260, text: '0123-456-789', fontSize: 12, fill: '#E9D5FF', draggable: true },
        // Skills section
        { id: 'skills-title', type: 'text', x: 30, y: 320, text: 'KỸ NĂNG', fontSize: 16, fill: '#FFFFFF', draggable: true },
        // Main content
        { id: 'exp-title', type: 'text', x: 280, y: 180, text: 'KINH NGHIỆM', fontSize: 22, fill: '#1F2937', draggable: true },
        { id: 'exp-line', type: 'rect', x: 280, y: 215, width: 80, height: 3, fill: '#7C3AED', draggable: true },
      ];
    } else if (templateName === 'minimal') {
      templateElements = [
        // Name
        { id: 'name', type: 'text', x: 50, y: 50, text: 'TÊN CỦA BẠN', fontSize: 40, fill: '#000000', draggable: true },
        // Divider
        { id: 'divider', type: 'rect', x: 50, y: 110, width: 694, height: 1, fill: '#000000', draggable: true },
        // Title
        { id: 'title', type: 'text', x: 50, y: 130, text: 'Chức Danh Nghề Nghiệp', fontSize: 18, fill: '#6B7280', draggable: true },
        // Contact
        { id: 'contact', type: 'text', x: 50, y: 170, text: 'email@example.com | 0123-456-789', fontSize: 14, fill: '#9CA3AF', draggable: true },
        // Sections
        { id: 'exp-title', type: 'text', x: 50, y: 230, text: 'Kinh Nghiệm', fontSize: 20, fill: '#000000', draggable: true },
        { id: 'edu-title', type: 'text', x: 50, y: 450, text: 'Học Vấn', fontSize: 20, fill: '#000000', draggable: true },
      ];
    }
    
    setElements(templateElements);
    setSelectedId(null);
  };

  const addTextElement = () => {
    const newElement: CanvasElement = {
      id: `text-${Date.now()}`,
      type: 'text',
      x: 100,
      y: 150 + elements.length * 30,
      text: 'New Text',
      fontSize: 16,
      fill: '#000000',
      draggable: true,
    };
    setElements([...elements, newElement]);
  };

  const addRectElement = () => {
    const newElement: CanvasElement = {
      id: `rect-${Date.now()}`,
      type: 'rect',
      x: 100,
      y: 150,
      width: 200,
      height: 100,
      fill: '#3B82F6',
      stroke: '#1E40AF',
      strokeWidth: 2,
      draggable: true,
    };
    setElements([...elements, newElement]);
  };

  const addCircleElement = () => {
    const newElement: CanvasElement = {
      id: `circle-${Date.now()}`,
      type: 'circle',
      x: 150,
      y: 150,
      radius: 50,
      fill: '#10B981',
      stroke: '#059669',
      strokeWidth: 2,
      draggable: true,
    };
    setElements([...elements, newElement]);
  };

  const deleteSelected = () => {
    if (selectedId) {
      setElements(elements.filter(el => el.id !== selectedId));
      setSelectedId(null);
    }
  };

  const updateElement = (id: string, updates: Partial<CanvasElement>) => {
    setElements(elements.map(el =>
      el.id === id ? { ...el, ...updates } : el
    ));
  };

  const handleSelect = (id: string) => {
    setSelectedId(id);
  };

  const handleExport = () => {
    if (stageRef.current) {
      const uri = stageRef.current.toDataURL();
      onSave(elements, uri);
    }
  };

  const downloadImage = () => {
    if (stageRef.current) {
      const uri = stageRef.current.toDataURL();
      const link = document.createElement('a');
      link.download = 'cv-design.png';
      link.href = uri;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const selectedElement = elements.find(el => el.id === selectedId);

  return (
    <div className="flex gap-6 h-full pt-6">
      {/* Toolbar */}
      <div className="w-80 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden flex flex-col">
        {/* Toolbar Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
          <h3 className="font-bold text-white text-lg flex items-center gap-2">
            <LuPlus className="w-5 h-5" />
            Công Cụ Thiết Kế
          </h3>
          <p className="text-blue-100 text-sm mt-1">Nhấp để thêm phần tử vào canvas</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Template Selection */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">🎨 Chọn Mẫu CV</h4>
            <div className="space-y-2">
              <button
                onClick={() => applyTemplate('modern')}
                className="w-full p-3 border-2 border-blue-200 rounded-lg hover:border-blue-500 transition-all cursor-pointer bg-gradient-to-br from-blue-50 to-blue-100 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-16 bg-blue-600 rounded flex items-center justify-center text-white text-xs font-bold group-hover:scale-110 transition-transform">
                    CV
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-bold text-blue-900">Modern</div>
                    <div className="text-xs text-blue-600">Header màu xanh, hiện đại</div>
                  </div>
                </div>
              </button>
              <button
                onClick={() => applyTemplate('creative')}
                className="w-full p-3 border-2 border-purple-200 rounded-lg hover:border-purple-500 transition-all cursor-pointer bg-gradient-to-br from-purple-50 to-purple-100 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-16 bg-purple-600 rounded flex items-center justify-center text-white text-xs font-bold group-hover:scale-110 transition-transform">
                    CV
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-bold text-purple-900">Creative</div>
                    <div className="text-xs text-purple-600">Sidebar tím, sáng tạo</div>
                  </div>
                </div>
              </button>
              <button
                onClick={() => applyTemplate('minimal')}
                className="w-full p-3 border-2 border-gray-200 rounded-lg hover:border-gray-500 transition-all cursor-pointer bg-gradient-to-br from-gray-50 to-gray-100 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-16 bg-gray-800 rounded flex items-center justify-center text-white text-xs font-bold group-hover:scale-110 transition-transform">
                    CV
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-bold text-gray-900">Minimal</div>
                    <div className="text-xs text-gray-600">Đơn giản, tối giản</div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Add Elements Section */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">➕ Thêm Phần Tử</h4>
            <div className="space-y-2">
              <button
                onClick={addTextElement}
                className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 rounded-lg hover:from-blue-100 hover:to-blue-200 transition-all duration-200 cursor-pointer shadow-sm hover:shadow group"
              >
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <LuType className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">Văn Bản</div>
                  <div className="text-xs text-blue-600">Thêm chữ</div>
                </div>
              </button>
              <button
                onClick={addRectElement}
                className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 rounded-lg hover:from-purple-100 hover:to-purple-200 transition-all duration-200 cursor-pointer shadow-sm hover:shadow group"
              >
                <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <LuSquare className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">Hình Chữ Nhật</div>
                  <div className="text-xs text-purple-600">Thêm hình</div>
                </div>
              </button>
              <button
                onClick={addCircleElement}
                className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-green-50 to-green-100 text-green-700 rounded-lg hover:from-green-100 hover:to-green-200 transition-all duration-200 cursor-pointer shadow-sm hover:shadow group"
              >
                <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <LuCircle className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">Hình Tròn</div>
                  <div className="text-xs text-green-600">Thêm hình tròn</div>
                </div>
              </button>
            </div>
          </div>

          {/* Canvas Background */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Cài Đặt Canvas</h4>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <LuPalette className="w-4 h-4" />
                Màu Nền
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={canvasColor}
                  onChange={(e) => setCanvasColor(e.target.value)}
                  className="w-16 h-16 rounded-lg cursor-pointer border-2 border-gray-300"
                />
                <div className="flex-1">
                  <div className="text-sm font-mono text-gray-600">{canvasColor}</div>
                  <div className="text-xs text-gray-500 mt-1">Nhấp để thay đổi</div>
                </div>
              </div>
            </div>
          </div>

          {/* Element Properties */}
          {selectedElement && (
            <div className="border-t border-gray-200 pt-6">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Phần Tử Đã Chọn</h4>
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-4 border border-indigo-200 space-y-4">
                {selectedElement.type === 'text' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nội Dung</label>
                      <input
                        type="text"
                        value={selectedElement.text || ''}
                        onChange={(e) => updateElement(selectedElement.id, { text: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Kích Thước Chữ</label>
                      <input
                        type="number"
                        value={selectedElement.fontSize || 16}
                        onChange={(e) => updateElement(selectedElement.id, { fontSize: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </>
                )}

                {(selectedElement.type === 'rect' || selectedElement.type === 'circle') && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Màu Nền</label>
                      <input
                        type="color"
                        value={selectedElement.fill || '#000000'}
                        onChange={(e) => updateElement(selectedElement.id, { fill: e.target.value })}
                        className="w-full h-10 rounded cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Màu Viền</label>
                      <input
                        type="color"
                        value={selectedElement.stroke || '#000000'}
                        onChange={(e) => updateElement(selectedElement.id, { stroke: e.target.value })}
                        className="w-full h-10 rounded cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Kích Thước Viền</label>
                      <input
                        type="number"
                        value={selectedElement.strokeWidth || 0}
                        onChange={(e) => updateElement(selectedElement.id, { strokeWidth: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vị Trí X</label>
                  <input
                    type="number"
                    value={Math.round(selectedElement.x)}
                    onChange={(e) => updateElement(selectedElement.id, { x: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vị Trí Y</label>
                  <input
                    type="number"
                    value={Math.round(selectedElement.y)}
                    onChange={(e) => updateElement(selectedElement.id, { y: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  onClick={deleteSelected}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md"
                >
                  <LuTrash2 className="w-5 h-5" />
                  <span className="font-semibold">Xóa Phần Tử</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="border-t border-gray-200 p-6 bg-gray-50 space-y-3">
          <button
            onClick={downloadImage}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg font-semibold"
          >
            <LuDownload className="w-5 h-5" />
            Tải Xuống PNG
          </button>
          <button
            onClick={handleExport}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg font-semibold"
          >
            <LuDownload className="w-5 h-5" />
            Lưu CV
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl shadow-inner p-8 overflow-auto">
        <div className="bg-white rounded-xl shadow-2xl inline-block border-4 border-gray-300">
          <Stage
            width={794}
            height={1123}
            ref={stageRef}
            onClick={(e) => {
              if (e.target === e.target.getStage()) {
                setSelectedId(null);
              }
            }}
          >
            <Layer>
              {/* Background */}
              <Rect
                x={0}
                y={0}
                width={794}
                height={1123}
                fill={canvasColor}
              />

              {/* Elements */}
              {elements.map((element) => {
                if (element.type === 'text') {
                  return (
                    <Text
                      key={element.id}
                      id={element.id}
                      x={element.x}
                      y={element.y}
                      text={element.text}
                      fontSize={element.fontSize}
                      fill={element.fill}
                      draggable={element.draggable}
                      onClick={() => handleSelect(element.id)}
                      onDragEnd={(e) => {
                        updateElement(element.id, {
                          x: e.target.x(),
                          y: e.target.y(),
                        });
                      }}
                    />
                  );
                } else if (element.type === 'rect') {
                  return (
                    <Rect
                      key={element.id}
                      id={element.id}
                      x={element.x}
                      y={element.y}
                      width={element.width}
                      height={element.height}
                      fill={element.fill}
                      stroke={element.stroke}
                      strokeWidth={element.strokeWidth}
                      draggable={element.draggable}
                      onClick={() => handleSelect(element.id)}
                      onDragEnd={(e) => {
                        updateElement(element.id, {
                          x: e.target.x(),
                          y: e.target.y(),
                        });
                      }}
                    />
                  );
                } else if (element.type === 'circle') {
                  return (
                    <Circle
                      key={element.id}
                      id={element.id}
                      x={element.x}
                      y={element.y}
                      radius={element.radius}
                      fill={element.fill}
                      stroke={element.stroke}
                      strokeWidth={element.strokeWidth}
                      draggable={element.draggable}
                      onClick={() => handleSelect(element.id)}
                      onDragEnd={(e) => {
                        updateElement(element.id, {
                          x: e.target.x(),
                          y: e.target.y(),
                        });
                      }}
                    />
                  );
                }
                return null;
              })}
            </Layer>
          </Stage>
        </div>
      </div>
    </div>
  );
};

export default CanvasCVBuilder;
