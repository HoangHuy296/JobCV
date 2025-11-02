import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadCV } from '../../api/cvService';
import { toast } from 'react-toastify';
import { LuArrowLeft } from 'react-icons/lu';
import CanvasCVBuilder from '../../components/resume/CanvasCVBuilder';

const ResumeBuilderCanvas: React.FC = () => {
  const navigate = useNavigate();
  const [cvTitle, setCvTitle] = useState('');

  const handleSaveCanvas = async (elements: any[], canvasImage: string) => {
    if (!cvTitle.trim()) {
      toast.error('Vui lòng nhập tiêu đề CV');
      return;
    }

    try {
      await uploadCV({
        title: cvTitle,
        content: JSON.stringify({ elements, canvasImage }),
        is_template: false
      });
      toast.success('Lưu CV thành công');
      navigate('/quan-ly-cv');
    } catch (error) {
      console.error('Error saving CV:', error);
      toast.error('Không thể lưu CV');
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm rounded-xl">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/quan-ly-cv')}
                className="p-2.5 hover:bg-gray-100 rounded-lg transition-all duration-200 cursor-pointer group"
                title="Quay lại Quản lý CV"
              >
                <LuArrowLeft className="w-5 h-5 text-gray-600 group-hover:text-gray-900" />
              </button>
              <div className="border-l border-gray-200 pl-4">
                <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  🎨 Thiết Kế CV Canvas
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">Kéo, thả và thiết kế CV hoàn hảo của bạn</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <input
                  type="text"
                  value={cvTitle}
                  onChange={(e) => setCvTitle(e.target.value)}
                  placeholder="Nhập tiêu đề CV..."
                  className="px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-80 transition-all"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Canvas Builder */}
      <div className="flex-1 overflow-hidden">
        <CanvasCVBuilder onSave={handleSaveCanvas} />
      </div>
    </div>
  );
};

export default ResumeBuilderCanvas;
