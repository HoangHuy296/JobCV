import React from 'react';
import SlideOver, { type FormField } from '../../../components/common/SlideOver';

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
      type: 'editor',
      required: true,
      placeholder: 'Nhập mô tả ngắn gọn về công việc'
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
      onSubmit={onSubmit}
      initialValues={initialValues}
      isSubmitting={isSubmitting}
    />
  );
};

export default JobForm;
