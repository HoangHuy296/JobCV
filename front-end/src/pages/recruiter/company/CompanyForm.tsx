import React from 'react';
import SlideOver, { type FormField } from '../../../components/common/SlideOver';

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
      type: 'editor',
      required: true,
      placeholder: 'Mô tả ngắn về công ty'
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
      onSubmit={onSubmit}
      fields={fields}
      initialValues={initialValues}
      isSubmitting={isSubmitting}
    />
  );
};

export default CompanyForm;
