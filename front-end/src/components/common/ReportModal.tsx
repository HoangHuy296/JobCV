import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { jobReviewService } from '../../api';
import SelectWithSearch from './SelectWithSearch';
import { useUser } from '../../contexts/UserContext';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: number;
  jobTitle?: string;
}

const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  jobId,
  jobTitle
}) => {
  const { isAuthenticated, user } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({
    report_type: '',
    description: '',
    name: '',
    email: '',
    phone: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        report_type: '',
        description: '',
        name: '',
        email: '',
        phone: ''
      });
      setErrors({});
    }
  }, [isOpen]);
  
  const reportTypes = [
    { value: 'misleading', label: 'Thông tin sai lệch' },
    { value: 'inappropriate', label: 'Nội dung không phù hợp' },
    { value: 'scam', label: 'Lừa đảo' },
    { value: 'duplicate', label: 'Trùng lặp' },
    { value: 'expired', label: 'Đã hết hạn' },
    { value: 'other', label: 'Khác' }
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  // Handle select with search change
  const handleSelectChange = (name: string, selectedValues: any[]) => {
    setFormData(prev => ({ ...prev, [name]: selectedValues[0] || '' }));
    
    // Clear error
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.report_type) {
      newErrors.report_type = 'Loại báo cáo là bắt buộc';
    }
    
    // Only validate these fields for unauthenticated users
    if (!isAuthenticated) {
      if (!formData.name) {
        newErrors.name = 'Tên là bắt buộc';
      }
      
      if (!formData.email) {
        newErrors.email = 'Email là bắt buộc';
      } else {
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
          newErrors.email = 'Định dạng email không hợp lệ';
        }
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setIsSubmitting(true);
      
      let resp;
      if (isAuthenticated) {
        // For authenticated users, use the authenticated endpoint
        const reportData = {
          report_type: formData.report_type,
          description: formData.description
        };
        
        resp = await jobReviewService.reportJob(jobId, reportData);
      } else {
        // For unauthenticated users, use the public endpoint with contact info
        const reportData = {
          report_type: formData.report_type,
          description: formData.description,
          name: formData.name,
          email: formData.email,
          phone: formData.phone
        };
        
        resp = await jobReviewService.reportJobPublic(jobId, reportData);
      }
      
      if (resp) {
        toast.success('Báo cáo đã được gửi thành công');
        onClose();
      }
    } catch (error) {
      console.error('Error submitting report:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black opacity-70 transition-opacity" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
          {/* Header */}
          <div className="bg-gray-50 px-4 py-6 sm:px-6">
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                Báo cáo tin tuyển dụng
              </h3>
            </div>
          </div>
          
          {/* Content */}
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                {/* Job Title Display */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tin tuyển dụng
                  </label>
                  <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                    {jobTitle || `Tin tuyển dụng #${jobId}`}
                  </div>
                  <input type="hidden" name="job_id" value={jobId} />
                </div>
                
                {/* Contact fields only for unauthenticated users */}
                {!isAuthenticated && (
                  <>
                    {/* Name Field */}
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                        Họ và tên <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Nhập họ và tên của bạn"
                        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                      />
                      {errors.name && (
                        <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                      )}
                    </div>
                    
                    {/* Email Field */}
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Nhập địa chỉ email của bạn"
                        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                      />
                      {errors.email && (
                        <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                      )}
                    </div>
                    
                    {/* Phone Field */}
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                        Số điện thoại
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="Nhập số điện thoại của bạn (không bắt buộc)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </>
                )}
                
                {/* User info display for authenticated users */}
                {isAuthenticated && user && (
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
                    <div className="flex items-center">
                      {user.image ? (
                        <img 
                          src={user.image?.url} 
                          alt={user.name} 
                          className="h-10 w-10 rounded-full mr-3 border-2 border-blue-200"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center mr-3 border-2 border-blue-200">
                          <span className="text-white font-medium text-sm">{user.name.charAt(0).toUpperCase()}</span>
                        </div>
                      )}
                      <div>
                        <p className="text-blue-800 font-medium">{user.name}</p>
                        <p className="text-xs text-blue-600">{user.email}</p>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-blue-700">
                      <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                      </svg>
                      <span>Báo cáo của bạn sẽ được gửi với thông tin tài khoản của bạn</span>
                    </div>
                  </div>
                )}
                
                {/* Report Type Select */}
                <div>
                  <label htmlFor="report_type" className="block text-sm font-medium text-gray-700 mb-1">
                    Loại báo cáo <span className="text-red-500">*</span>
                  </label>
                  <SelectWithSearch
                    options={reportTypes}
                    selectedValues={formData.report_type ? [formData.report_type] : []}
                    onChange={(selectedValues) => handleSelectChange('report_type', selectedValues)}
                    placeholder="Chọn loại báo cáo"
                    multiple={false}
                    error={errors.report_type}
                  />
                  {errors.report_type && (
                    <p className="mt-1 text-sm text-red-600">{errors.report_type}</p>
                  )}
                </div>
                
                {/* Description Textarea */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Mô tả chi tiết
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Vui lòng mô tả chi tiết vấn đề bạn gặp phải với tin tuyển dụng này"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              {/* Footer */}
              <div className="sm:flex sm:flex-row-reverse mt-5">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="cursor-pointer inline-flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Đang gửi...
                    </>
                  ) : 'Gửi báo cáo'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="cursor-pointer mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportModal;
