import React, { useState, useEffect } from 'react';
import SlideOver, { type FormField } from '../../../components/common/SlideOver';
import AIGenerateButton from '../../../components/common/AIGenerateButton';
import aiGenerationService from '../../../services/aiGenerationService';
import { useIndustryContext } from '../../../contexts/IndustryContext';
import QuillEditor from '@/components/common/QuillEditor';

interface CompanyFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: Record<string, any>) => void;
  initialValues?: Record<string, any>;
  isSubmitting?: boolean;
}

const CompanyForm: React.FC<CompanyFormProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit,
  initialValues = {},
  isSubmitting = false
}) => {
  const { industries } = useIndustryContext();
  const [formData, setFormData] = useState<Record<string, any>>(initialValues);

  useEffect(() => {
    setFormData(initialValues);
  }, [initialValues]);

  const handleAIGenerate = async (customContext?: string) => {
    const industryNames = Array.isArray(formData.industries) 
      ? formData.industries.map((id: number) => 
          industries.find(ind => ind.id === id)?.name || ''
        ).filter(Boolean).join(', ')
      : '';

    return await aiGenerationService.generateCompanyDescription({
      name: formData.name || '',
      industry: industryNames,
      size: formData.employees || '',
      location: formData.location || ''
    }, customContext);
  };


  // Define form fields for company information
  const fields: FormField[] = [
    {
      name: 'logo',
      label: 'Logo công ty',
      type: 'image'
    },
    {
      name: 'name',
      label: 'Tên công ty',
      type: 'text',
      required: true,
      placeholder: 'Nhập tên công ty'
    },
    {
      name: 'description',
      label: 'Mô tả công ty',
      type: 'custom',
      required: true,
      render: (value: any, onChange: (value: any) => void) => {
        return (
          <div className="space-y-2">
            {/* AI Helper Section */}
            <div className="p-3 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <span className="text-sm font-semibold text-purple-900">AI Assistant</span>
              </div>
              <AIGenerateButton
                label="Tạo mô tả với AI"
                onGenerate={handleAIGenerate}
                onApply={(content) => {
                  onChange(content);
                  setFormData({ ...formData, description: content });
                }}
                disabled={false}
                size="sm"
                contextPlaceholder="Ví dụ: Nhấn mạnh văn hóa công ty trẻ trung, công nghệ hiện đại, cơ hội phát triển..."
              />
              <p className="text-xs text-purple-600 mt-2">
                💡 AI sẽ sử dụng mô tả hiện tại để cải thiện nội dung. Bạn có thể thêm yêu cầu cụ thể trong popup nếu cần.
              </p>
            </div>
            
            {/* QuillEditor field */}
            <QuillEditor
              value={value || ''}
              onChange={(newValue) => {
                onChange(newValue);
                setFormData({ ...formData, description: newValue });
              }}
              placeholder="Nhập mô tả công ty"
            />
          </div>
        );
      }
    },
    {
      name: 'employees',
      label: 'Số lượng nhân viên',
      type: 'text',
      required: true,
      placeholder: 'Ví dụ: 50-100'
    },
    {
      name: 'location',
      label: 'Địa điểm',
      type: 'location',
      required: true
    },
    {
      name: 'industries',
      label: 'Ngành nghề',
      type: 'industry',
      required: true,
      placeholder: 'Chọn ngành nghề'
    },
    {
      name: 'website',
      label: 'Website',
      type: 'text',
      placeholder: 'https://www.example.com'
    },
    {
      name: 'facebook',
      label: 'Facebook',
      type: 'text',
      placeholder: 'https://www.facebook.com/...'
    },
    {
      name: 'youtube',
      label: 'YouTube',
      type: 'text',
      placeholder: 'https://www.youtube.com/...'
    },
    {
      name: 'linkedin',
      label: 'LinkedIn',
      type: 'text',
      placeholder: 'https://www.linkedin.com/...'
    },
    {
      name: 'twitter',
      label: 'Twitter',
      type: 'text',
      placeholder: 'https://twitter.com/...'
    },
    {
      name: 'instagram',
      label: 'Instagram',
      type: 'text',
      placeholder: 'https://www.instagram.com/...'
    },
  ];

  return (
    <SlideOver
      title="Chỉnh sửa thông tin công ty"
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={(values) => {
        onSubmit({ ...formData, ...values });
      }}
      fields={fields}
      initialValues={formData}
      isSubmitting={isSubmitting}
    />
  );
};

export default CompanyForm;
