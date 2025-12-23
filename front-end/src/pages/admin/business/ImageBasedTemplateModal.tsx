import React, { useState, useEffect, useCallback } from 'react';
import { LuX, LuUpload, LuSave } from 'react-icons/lu';
import ImageBasedCVEditor from '../../../components/cv/ImageBasedCVEditor';
import { toast } from 'react-toastify';
import { uploadTemplateImage } from '../../../api/cvTemplateService';

interface TextField {
  id: string;
  type: 'text' | 'title' | 'richtext' | 'image';
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize?: number;
  fontWeight?: string;
  color?: string;
  align?: 'left' | 'center' | 'right';
  placeholder?: string;
}

interface ImageBasedTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    description: string;
    thumbnail_url: string;
    structure: { fields: TextField[] };
    layout: 'image-based';
    is_published: boolean;
  }) => void;
  initialData?: {
    name: string;
    description: string;
    thumbnail_url: string;
    structure: any;
    is_published: boolean;
  };
}

const ImageBasedTemplateModal: React.FC<ImageBasedTemplateModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData
}) => {
  const [step, setStep] = useState<'upload' | 'design'>('upload');
  const [canProceedToDesign, setCanProceedToDesign] = useState(false);
  const [templateImage, setTemplateImage] = useState(initialData?.thumbnail_url || '');
  const [templateImageUrl, setTemplateImageUrl] = useState(initialData?.thumbnail_url || ''); // Server URL
  const [isUploading, setIsUploading] = useState(false);
  const [fields, setFields] = useState<TextField[]>(
    initialData?.structure?.fields || []
  );
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    is_published: initialData?.is_published || false
  });

  const resetModalState = useCallback(() => {
    setStep('upload');
    setTemplateImage(initialData?.thumbnail_url || '');
    setTemplateImageUrl(initialData?.thumbnail_url || '');
    setFields(initialData?.structure?.fields || []);
    setFormData({
      name: initialData?.name || '',
      description: initialData?.description || '',
      is_published: initialData?.is_published || false
    });
  }, [initialData]);

  useEffect(() => {
    if (!isOpen) return;
    resetModalState();
  }, [isOpen, resetModalState]);

  // Check if can proceed to design step
  useEffect(() => {
    setCanProceedToDesign(
      formData.name.trim() !== '' && templateImage !== ''
    );
  }, [formData.name, templateImage]);

  if (!isOpen) return null;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Vui lòng chọn file hình ảnh');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Kích thước file không được vượt quá 5MB');
        return;
      }

      // Show preview immediately
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setTemplateImage(result);
      };
      reader.readAsDataURL(file);

      // Upload to server
      setIsUploading(true);
      try {
        const response = await uploadTemplateImage(file);
        if (response.success) {
          setTemplateImageUrl(response.data.url);
          toast.success('Upload hình ảnh thành công!');
        } else {
          toast.error('Lỗi khi upload hình ảnh');
          setTemplateImage('');
        }
      } catch (error: any) {
        console.error('Error uploading image:', error);
        toast.error(error.response?.data?.message || 'Lỗi khi upload hình ảnh');
        setTemplateImage('');
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast.error('Vui lòng nhập tên template');
      return;
    }

    if (!templateImageUrl) {
      toast.error('Vui lòng upload hình template');
      return;
    }

    if (fields.length === 0) {
      toast.error('Vui lòng thêm ít nhất 1 field');
      return;
    }

    onSave({
      name: formData.name,
      description: formData.description,
      thumbnail_url: templateImageUrl, // Use server URL instead of base64
      structure: { fields },
      layout: 'image-based',
      is_published: formData.is_published
    });
  };

  const goToStep = (targetStep: 'upload' | 'design') => {
    if (targetStep === 'design' && !canProceedToDesign) {
      toast.warning('Vui lòng hoàn thành thông tin cơ bản và upload hình trước');
      return;
    }
    setStep(targetStep);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col">
          {/* Header */}
          <div className="border-b">
            <div className="flex items-center justify-between p-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {initialData ? 'Chỉnh sửa' : 'Tạo'} Template CV từ Hình ảnh
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LuX className="w-6 h-6" />
              </button>
            </div>
            
            {/* Step Indicators */}
            <div className="px-6 pb-4">
              <div className="flex items-center gap-4">
                {/* Step 1 */}
                <button
                  onClick={() => goToStep('upload')}
                  className={`flex items-center gap-3 flex-1 p-4 rounded-lg border-2 transition-all ${
                    step === 'upload'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                    step === 'upload'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    1
                  </div>
                  <div className="text-left">
                    <div className={`font-semibold ${
                      step === 'upload' ? 'text-blue-700' : 'text-gray-700'
                    }`}>
                      Thông tin cơ bản
                    </div>
                    <div className="text-xs text-gray-500">Tên, mô tả & hình ảnh</div>
                  </div>
                </button>

                {/* Arrow */}
                <div className="text-gray-400">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>

                {/* Step 2 */}
                <button
                  onClick={() => goToStep('design')}
                  disabled={!canProceedToDesign}
                  className={`flex items-center gap-3 flex-1 p-4 rounded-lg border-2 transition-all ${
                    step === 'design'
                      ? 'border-blue-500 bg-blue-50'
                      : canProceedToDesign
                      ? 'border-gray-200 bg-white hover:border-gray-300'
                      : 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                    step === 'design'
                      ? 'bg-blue-500 text-white'
                      : canProceedToDesign
                      ? 'bg-gray-200 text-gray-600'
                      : 'bg-gray-200 text-gray-400'
                  }`}>
                    2
                  </div>
                  <div className="text-left">
                    <div className={`font-semibold ${
                      step === 'design' ? 'text-blue-700' : 'text-gray-700'
                    }`}>
                      Thiết kế fields
                    </div>
                    <div className="text-xs text-gray-500">Vùng nhập liệu</div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {step === 'upload' ? (
              // Step 1: Upload Image
              <div className="h-full overflow-y-auto p-8">
                <div className="max-w-2xl mx-auto w-full space-y-6">
                  {/* Basic Info */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tên Template *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="VD: CV Thiết kế Đồ họa Modern"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mô tả
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Mô tả ngắn gọn về template..."
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label htmlFor="is_published" className="block text-sm font-medium text-gray-700 mb-2">
                        Công khai template
                      </label>
                      <button
                        type="button"
                        id="is_published"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, is_published: !prev.is_published }));
                        }}
                        className={`${formData.is_published ? 'bg-blue-600' : 'bg-gray-200'}
                          relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                        role="switch"
                        aria-checked={formData.is_published}
                      >
                        <span className="sr-only">Công khai template</span>
                        <span
                          aria-hidden="true"
                          className={`${formData.is_published ? 'translate-x-5' : 'translate-x-0'}
                            pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                        />
                      </button>
                      <p className="mt-1 text-sm text-gray-500">
                        {formData.is_published ? 'Template đang công khai cho user' : 'Template ở chế độ nháp'}
                      </p>
                    </div>
                  </div>

                  {/* Upload Area */}
                  <div className="space-y-3">
                    {/* Image Size Recommendations */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-blue-900 mb-1">Gợi ý kích thước hình ảnh</h4>
                          <ul className="text-sm text-blue-800 space-y-1">
                            <li className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                              <span><strong>Tỷ lệ A4:</strong> 210 × 297 mm (hoặc 794 × 1123 px)</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                              <span><strong>Độ phân giải:</strong> Tối thiểu 1240 × 1754 px (150 DPI)</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                              <span><strong>Định dạng:</strong> PNG (nền trong suốt) hoặc JPG</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                              <span><strong>Dung lượng:</strong> Tối đa 5MB</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-12">
                      {templateImage ? (
                        <div className="space-y-4">
                          <img 
                            src={templateImage} 
                            alt="Template preview"
                            className="max-h-96 mx-auto rounded-lg shadow-lg"
                          />
                          <div className="flex gap-3 justify-center">
                            <label className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 cursor-pointer transition-colors">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                                disabled={isUploading}
                              />
                              {isUploading ? 'Đang upload...' : 'Đổi hình khác'}
                            </label>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <LuUpload className="w-16 h-16 text-gray-400 mb-4" />
                          <span className="text-lg font-medium text-gray-700 mb-2">
                            Upload hình template CV
                          </span>
                          <span className="text-sm text-gray-500 mb-4">
                            PNG, JPG, WEBP (Max 5MB)
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                            disabled={isUploading}
                            id="template-image-upload"
                          />
                          <label 
                            htmlFor="template-image-upload"
                            className={`px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium cursor-pointer ${
                              isUploading ? 'bg-gray-400 cursor-not-allowed' : ''
                            }`}
                          >
                            {isUploading ? 'Đang upload...' : 'Chọn hình ảnh'}
                          </label>
                        </div>
                      )}
                  </div>
                </div>
              </div>
            </div>
            ) : (
              // Step 2: Design Fields
              <div className="h-full">
                <ImageBasedCVEditor
                  templateImage={templateImage}
                  fields={fields}
                  onFieldsChange={setFields}
                  mode="edit"
                />
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t bg-gray-50">
            <div>
              {step === 'design' && (
                <button
                  onClick={() => setStep('upload')}
                  className="flex items-center gap-2 px-5 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Quay lại
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-5 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Hủy
              </button>
              {step === 'upload' ? (
                <button
                  onClick={() => goToStep('design')}
                  disabled={!canProceedToDesign}
                  className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  Tiếp tục
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ) : (
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  <LuSave className="w-4 h-4" />
                  Lưu Template
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageBasedTemplateModal;
