import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useUser } from '../../contexts/UserContext';
import { createCompany, updateCompany, type CreateCompanyData } from '../../api/companyService';
import IndustrySelect from '../../components/common/IndustrySelect';
import LocationSelect from '../../components/common/LocationSelect';
import { toast } from 'react-toastify';
import CompanyForm from './company/CompanyForm';
import QuillEditor from '../../components/common/QuillEditor';

const RecruiterDashboard: React.FC = () => {
  const { user, company, setCompany, companyLoading } = useUser();
  const initialFormData = useMemo(() => ({
    name: '',
    description: '',
    location: '',
    employees: '',
    industries: [] as number[],
    logo_id: null,
    website: null,
  }), []);
  
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompanyFormOpen, setIsCompanyFormOpen] = useState(false);

  // Fetch industries on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Industries are now handled by IndustryContext, so we don't need to fetch them here
        // Locations are now handled by LocationContext, so we don't need to fetch them here
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };
    
    fetchData();
  }, []);

  // No need for useEffect since company is already loaded in UserContext

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  }, [errors]);


  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Vui lòng nhập tên công ty';
    }
    
    // For QuillEditor content, check if it has actual content (not just empty HTML tags)
    const descriptionText = formData.description.replace(/<[^>]*>/g, '').trim();
    if (!descriptionText) {
      newErrors.description = 'Vui lòng nhập mô tả ngắn';
    }
    
    if (!formData.employees.trim()) {
      newErrors.employees = 'Vui lòng nhập số lượng nhân viên';
    }
    
    if (!formData.location.trim()) {
      newErrors.location = 'Vui lòng chọn địa điểm';
    }
    
    if (formData.industries?.length === 0) {
      newErrors.industries = 'Vui lòng chọn ít nhất một ngành nghề';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);
  
  const handleCreateCompany = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Get the current formData inside the callback to avoid dependency on the entire formData object
      // This prevents unnecessary re-renders when formData changes
      const currentFormData = formData;
      
      // Create form data
      const dataToSend: CreateCompanyData = {
        name: currentFormData.name,
        description: currentFormData.description,
        location: currentFormData.location,
        employees: currentFormData.employees,
        industries: currentFormData.industries,  
      };

      if (currentFormData.logo_id) {
        dataToSend.logo_id = currentFormData.logo_id;
      }

      if (currentFormData.website) {
        dataToSend.website = currentFormData.website;
      }
      
      const response = await createCompany(dataToSend);
      
      if (response?.id) {
        // Update company in context
        setCompany(response);
        toast.success('Tạo công ty thành công');
        
        // Reset form data after successful submission
        setFormData(initialFormData);
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Có lỗi xảy ra khi tạo công ty');
    } finally {
      setIsSubmitting(false);
    }
  }, [validateForm, setCompany, setFormData, initialFormData]);
  
  const handleEditCompany = useCallback(async (values: Record<string, any>) => {
    setIsSubmitting(true);
    
    try {
      // Update user profile
      if (company) {
        const resp = await updateCompany(company.id, values);

        if (resp) {
          // Update company in context
          setCompany(resp);
          toast.success('Cập nhật thông tin công ty thành công');
        }
      }      
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsSubmitting(false);
      setIsCompanyFormOpen(false);
    }
  }, [company]);
  
  // Memoize the CompanyForm component to prevent unnecessary re-renders
  const companyFormComponent = useMemo(() => {
    if (!isCompanyFormOpen) return null;
    
    return (
      <CompanyForm
        isOpen={isCompanyFormOpen}
        onClose={() => setIsCompanyFormOpen(false)}
        onSubmit={handleEditCompany}
        initialValues={company || undefined}
        isSubmitting={isSubmitting}
      />
    );
  }, [isCompanyFormOpen, company, isSubmitting, handleEditCompany]);

  if (companyLoading) {
    return (
      <div className="min-h-[300px] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải thông tin công ty...</p>
          <p className="mt-2 text-gray-500 text-sm">Vui lòng đợi trong giây lát</p>
        </div>
      </div>
    );
  }

  // If no company is linked, show only the form
  if (!company) {
    return (
      <div className="bg-white rounded-lg shadow px-4 py-5 sm:p-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Chào mừng nhà tuyển dụng {user?.name}!</h1>
          <p className="text-gray-600 text-lg">Vui lòng nhập thông tin công ty của bạn để bắt đầu sử dụng hệ thống</p>
        </div>
        
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-8 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-100">
                <svg className="h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-blue-800">Thông tin công ty cần thiết</h3>
              <p className="mt-2 text-blue-700">
                Để sử dụng đầy đủ tính năng của hệ thống như đăng tin tuyển dụng, tìm kiếm hồ sơ ứng viên và quản lý công ty, bạn cần cung cấp thông tin công ty của mình.
              </p>
              <div className="mt-3 text-sm text-blue-600">
                <span>Thông tin của bạn sẽ chỉ được sử dụng để xác thực và hiển thị công khai trên trang công ty</span>
              </div>
            </div>
          </div>
        </div>
        
        <form onSubmit={handleCreateCompany} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left column - Big Image */}
            <div className="flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-200 p-8 rounded-2xl border border-blue-300 shadow-lg transform transition-all duration-500 hover:scale-[1.02] relative overflow-hidden group">
              {/* Enhanced animated background with particle effects */}
              <div className="absolute inset-0 overflow-hidden">
                {/* Animated gradient blobs */}
                <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-blue-300 opacity-20 blur-3xl animate-pulse-slow"></div>
                <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-indigo-300 opacity-20 blur-3xl animate-ping-slow"></div>
                <div className="absolute top-1/4 right-1/4 w-80 h-80 rounded-full bg-purple-300 opacity-25 blur-3xl animate-pulse-medium"></div>
                
                {/* Floating particles */}
                <div className="absolute top-1/3 left-1/4 w-4 h-4 rounded-full bg-blue-400 opacity-30 animate-float-slow"></div>
                <div className="absolute top-2/3 right-1/3 w-3 h-3 rounded-full bg-indigo-400 opacity-40 animate-float-medium"></div>
                <div className="absolute top-1/2 left-2/3 w-2 h-2 rounded-full bg-purple-400 opacity-50 animate-float-fast"></div>
                <div className="absolute bottom-1/3 left-1/3 w-3 h-3 rounded-full bg-blue-300 opacity-30 animate-float-medium"></div>
                <div className="absolute top-1/4 right-1/4 w-2 h-2 rounded-full bg-indigo-300 opacity-40 animate-float-slow"></div>
              </div>
              
              {/* Decorative corner elements with enhanced styling */}
              <div className="absolute top-6 left-6 text-blue-400 opacity-30 transform rotate-12 transition-all duration-300 group-hover:rotate-45 group-hover:scale-110">
                <svg className="w-14 h-14" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5.5 13a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 13H11V9.413l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13H5.5z" />
                  <path d="M9 13h2v5a1 1 0 11-2 0v-5z" />
                </svg>
              </div>
              <div className="absolute bottom-6 right-6 text-indigo-400 opacity-30 transform -rotate-12 transition-all duration-300 group-hover:-rotate-45 group-hover:scale-110">
                <svg className="w-14 h-14" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                </svg>
              </div>
              
              {/* Central animated element */}
              <div className="absolute top-1/2 left-0 transform -translate-y-1/2 -translate-x-1/2 text-purple-400 opacity-25 transition-all duration-500 group-hover:scale-125">
                <svg className="w-20 h-20" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              
              <div className="flex flex-col items-center w-full max-w-md relative z-10">
                {/* Enhanced icon container with glow effect */}
                <div className="relative flex items-center justify-center w-64 h-64 bg-white rounded-2xl shadow-xl mb-6 overflow-hidden group/icon transform transition-all duration-500 hover:shadow-2xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 opacity-10 group-hover/icon:opacity-20 transition-all duration-500"></div>
                  <div className="absolute inset-0 border-2 border-blue-200 rounded-2xl opacity-0 group-hover/icon:opacity-30 transition-all duration-500 animate-pulse"></div>
                  <svg className="h-36 w-36 text-blue-600 relative z-10 transform transition-all duration-500 group-hover/icon:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <div className="absolute top-4 right-4 w-5 h-5 bg-green-500 rounded-full animate-ping"></div>
                  <div className="absolute top-4 right-4 w-5 h-5 bg-green-500 rounded-full animate-pulse"></div>
                </div>
                
                <h2 className="text-4xl font-bold text-gray-900 mb-4 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                  Chào mừng đến với hệ thống
                </h2>
                <p className="text-gray-700 text-center mb-6 text-lg leading-relaxed">
                  Vui lòng nhập thông tin công ty của bạn để bắt đầu sử dụng hệ thống
                </p>
                
                {/* Enhanced animated dots */}
                <div className="flex items-center justify-center space-x-3 mb-6">
                  <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce transform transition-all duration-300 hover:scale-125" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-4 h-4 bg-indigo-500 rounded-full animate-bounce transform transition-all duration-300 hover:scale-125" style={{ animationDelay: '300ms' }}></div>
                  <div className="w-4 h-4 bg-purple-500 rounded-full animate-bounce transform transition-all duration-300 hover:scale-125" style={{ animationDelay: '600ms' }}></div>
                </div>
                
                {/* Enhanced call-to-action box with gradient */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5 w-full transform transition-all duration-300 hover:shadow-md hover:-translate-y-1">                      
                  <p className="text-blue-800 text-center font-medium">Bắt đầu ngay hôm nay để tìm kiếm những ứng viên tài năng nhất!</p>
                </div>
              </div>
            </div>
            
            {/* Right column - All required fields */}
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Thông tin công ty</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="name">
                    Tên công ty <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-blue-500 ${errors.name ? 'border-red-500' : ''}`}
                    placeholder="Nhập tên công ty"
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                </div>
                
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="description">
                    Mô tả ngắn <span className="text-red-500">*</span>
                  </label>
                  <QuillEditor
                    value={formData.description}
                    onChange={(value) => {
                      setFormData(prev => ({ ...prev, description: value }));
                      // Clear error when user types
                      if (errors.description) {
                        setErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors.description;
                          return newErrors;
                        });
                      }
                    }}
                    placeholder="Mô tả ngắn về công ty của bạn"
                    error={errors.description}
                  />
                  {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="employees">
                      Số lượng nhân viên <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="employees"
                      name="employees"
                      value={formData.employees}
                      onChange={handleChange}
                      className={`shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-blue-500 ${errors.employees ? 'border-red-500' : ''}`}
                      placeholder="Ví dụ: 50-100"
                    />
                    {errors.employees && <p className="mt-1 text-sm text-red-600">{errors.employees}</p>}
                  </div>
                
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      Ngành nghề <span className="text-red-500">*</span>
                    </label>
                    <IndustrySelect
                      selectedValues={formData.industries}
                      onChange={(values: number[]) => {
                        setFormData(prev => ({ ...prev, industries: values }));
                        // Clear error when user selects industries
                        if (errors.industries) {
                          setErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.industries;
                            return newErrors;
                          });
                        }
                      }}
                      error={errors.industries}
                    />
                    {errors.industries && <p className="mt-1 text-sm text-red-600">{errors.industries}</p>}
                  </div>
                </div>
              </div>
                  
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Địa điểm <span className="text-red-500">*</span>
                </label>
                <LocationSelect 
                  selectedValues={formData.location}
                  onChange={(values: string) => {
                    setFormData(prev => ({ ...prev, location: values || '' }));
                    // Clear error when user selects location
                    if (errors.location) {
                      setErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors.location;
                        return newErrors;
                      });
                    }
                  }}
                  error={errors.location}
                />
                {errors.location && <p className="mt-1 text-sm text-red-600">{errors.location}</p>}
              </div>
              
              <div className="flex justify-end mt-6">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Đang cập nhật...
                    </>
                  ) : (
                    'Cung cấp thông tin'
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    );
  }

  // If company is linked, show the full dashboard
  return (
    <div className="bg-white rounded-lg shadow px-4 py-5 sm:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Bảng điều khiển</h1>
      </div>
      
      {/* Main cards section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl shadow-sm p-6 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center mb-4">
            <div className="bg-blue-500 p-3 rounded-lg mr-4">
              <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Quản lý thông tin công ty</h2>
          </div>
          <p className="text-gray-700 mb-4">Cập nhật thông tin, logo và các chi tiết khác về công ty của bạn.</p>
          <button onClick={() => setIsCompanyFormOpen(true)} className="text-blue-600 hover:text-blue-800 font-medium flex items-center cursor-pointer">
            Quản lý thông tin <span className="ml-1">→</span>
          </button>
        </div>

        {companyFormComponent}
        
        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl shadow-sm p-6 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center mb-4">
            <div className="bg-green-500 p-3 rounded-lg mr-4">
              <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Đăng tin tuyển dụng</h2>
          </div>
          <p className="text-gray-700 mb-4">Tạo và quản lý các vị trí tuyển dụng của công ty bạn.</p>
          <button className="text-green-600 hover:text-green-800 font-medium flex items-center cursor-pointer">
            Đăng tin mới <span className="ml-1">→</span>
          </button>
        </div>
        
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl shadow-sm p-6 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center mb-4">
            <div className="bg-purple-500 p-3 rounded-lg mr-4">
              <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Tìm kiếm CV</h2>
          </div>
          <p className="text-gray-700 mb-4">Tìm kiếm và xem hồ sơ ứng viên phù hợp với yêu cầu của bạn.</p>
          <button className="text-purple-600 hover:text-purple-800 font-medium flex items-center cursor-pointer">
            Tìm kiếm CV <span className="ml-1">→</span>
          </button>
        </div>
      </div>
      
      {/* CV Suggestions section */}
      <div className="border-t border-gray-200 pt-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">CV đề xuất</h2>
          <button className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center cursor-pointer">
            Xem tất cả <span className="ml-1">→</span>
          </button>
        </div>
        <div className="flex bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
          <div className="flex-shrink-0 mr-6">
            {/* Placeholder for image */}
            <div className="bg-white border-2 border-dashed rounded-xl w-16 h-16 flex items-center justify-center">
              <svg className="h-8 w-8 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
          <div className="flex-1">
            <p className="text-gray-700 mb-4">
              Hệ thống đã tìm thấy các hồ sơ phù hợp với vị trí tuyển dụng của bạn. 
              Xem ngay để tìm ứng viên tiềm năng cho công ty của bạn.
            </p>
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 cursor-pointer">
              Xem tất cả CV đề xuất
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecruiterDashboard;
