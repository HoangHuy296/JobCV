import React, { useState, useEffect } from 'react';
import SlideOver, { type FormField } from '../../../components/common/SlideOver';
import AIGenerateButton from '../../../components/common/AIGenerateButton';
import aiGenerationService from '../../../services/aiGenerationService';
import { useIndustryContext } from '../../../contexts/IndustryContext';
import QuillEditor from '@/components/common/QuillEditor';

interface JobFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: Record<string, any>) => void;
  initialValues?: Record<string, any>;
  isSubmitting?: boolean;
}

const JobForm: React.FC<JobFormProps> = ({ 
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
    const industryName = industries.find(
      ind => ind.id.toString() === (Array.isArray(formData.industry_id) ? formData.industry_id[0] : formData.industry_id)?.toString()
    )?.name || '';

    return await aiGenerationService.generateJobDescription({
      title: formData.title || '',
      industry: industryName,
      location: formData.location || '',
      salary: formData.salary || '',
      yearsExperience: formData.years_experienced ? parseInt(formData.years_experienced) : undefined
    }, customContext);
  };


  // Define form fields for job posting
  const fields: FormField[] = [
    {
      name: 'is_published',
      label: 'Đăng tuyển công khai',
      type: 'checkbox',
      description: 'Khi chọn, tin tuyển dụng sẽ được gửi đi phê duyệt và hiển thị công khai sau khi được duyệt'
    },
    {
      name: 'title',
      label: 'Tiêu đề',
      type: 'textarea',
      required: true,
      placeholder: 'Nhập tiêu đề công việc'
    },
    {
      name: 'brief_description',
      label: 'Mô tả công việc',
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
                  setFormData({ ...formData, brief_description: content });
                }}
                disabled={false}
                size="sm"
                contextPlaceholder="Ví dụ: Nhấn mạnh cơ hội thăng tiến, môi trường trẻ trung, yêu cầu teamwork..."
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
                setFormData({ ...formData, brief_description: newValue });
              }}
              placeholder="Nhập mô tả công ty"
            />
          </div>
        );
      }
    },
    {
      name: 'requirement',
      label: 'Yêu cầu',
      type: 'editor',
      required: true,
      placeholder: 'Nhập yêu cầu công việc'
    },
    {
      name: 'benefits',
      label: 'Quyền lợi',
      type: 'editor',
      placeholder: 'Nhập quyền lợi công việc'
    },
    {
      name: 'salary',
      label: 'Mức lương',
      type: 'text',
      placeholder: 'Nhập mức lương (ví dụ: 10-15 triệu)'
    },
    {
      name: 'date_end_register',
      label: 'Hạn nộp hồ sơ',
      type: 'datetime'
    },
    {
      name: 'years_experienced',
      label: 'Số năm kinh nghiệm',
      type: 'number',
      placeholder: 'Nhập số năm kinh nghiệm yêu cầu'
    },
    {
      name: 'work_hours',
      label: 'Thời gian làm việc',
      type: 'text',
      placeholder: 'Nhập thời gian làm việc (ví dụ: 8h-17h, Thứ 2-Thứ 6)'
    },
    {
      name: 'industry_id',
      label: 'Ngành nghề',
      type: 'industry',
      multiple: false,
      required: true
    },
    {
      name: 'location',
      label: 'Vị trí',
      type: 'location',
      required: true,
      placeholder: 'Nhập vị trí'
    },
    {
      name: 'max_applicants',
      label: 'Số lượng ứng viên tối đa',
      type: 'number',
      placeholder: 'Để trống nếu không giới hạn',
      description: 'Số lượng ứng viên tối đa có thể ứng tuyển vào công việc này'
    },
    {
      name: 'auto_close_on_threshold',
      label: 'Tự động đóng khi đạt ngưỡng',
      type: 'checkbox',
      description: 'Tự động đóng tin tuyển dụng khi đạt số lượng ứng viên tối đa. Bạn sẽ luôn nhận được thông báo và email khi đạt ngưỡng.'
    },
  ];

  return (
    <SlideOver
      title="Đăng tin tuyển dụng mới"
      isOpen={isOpen}
      onClose={onClose}
      fields={fields}
      onSubmit={(values) => {
        onSubmit({ ...formData, ...values });
      }}
      initialValues={formData}
      isSubmitting={isSubmitting}
    />
  );
};

export default JobForm;
