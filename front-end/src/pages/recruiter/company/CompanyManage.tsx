import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../../contexts/UserContext';
import { updateCompany, type UpdateCompanyData } from '../../../api/companyService';
import { uploadMedia, createMediaFromUrl } from '../../../api/mediaService';
import { toast } from 'react-toastify';
import IndustrySelect from '../../../components/common/IndustrySelect';
import LocationSelect from '../../../components/common/LocationSelect';
import QuillEditor from '../../../components/common/QuillEditor';
import CompanyDetail from '../../public/CompanyDetail';
import AIGenerateButton from '../../../components/common/AIGenerateButton';
import aiGenerationService from '../../../services/aiGenerationService';
import { useIndustryContext } from '../../../contexts/IndustryContext';

const CompanyManage: React.FC = () => {
  const { company, setCompany, companyLoading } = useUser();
  const { industries } = useIndustryContext();
  const navigate = useNavigate();
  
  // Initialize form data with company data or empty values
  const initialFormData = {
    name: company?.name || '',
    description: company?.description || '',
    industries: company?.industries || [],
    website: company?.website || '',
    location: company?.location || '',
    employees: company?.employees || '',
    facebook: company?.facebook || '',
    youtube: company?.youtube || '',
    linkedin: company?.linkedin || '',
    twitter: company?.twitter || '',
    instagram: company?.instagram || '',
    logo_id: company?.logo?.id || null,
  };
  
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(company?.logo?.url || null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoUrl, setLogoUrl] = useState<string>(company?.logo?.url || '');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  
  // Update form when company data changes
  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name || '',
        description: company.description || '',
        industries: company.industries || [],
        website: company.website || '',
        location: company.location || '',
        employees: company.employees || '',
        facebook: company.facebook || '',
        youtube: company.youtube || '',
        linkedin: company.linkedin || '',
        twitter: company.twitter || '',
        instagram: company.instagram || '',
        logo_id: company.logo?.id || null,
      });
      setImagePreview(company.logo?.url || null);
      setLogoUrl(company.logo?.url || '');
    }
  }, [company]);
  
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
  
  const handleIndustryChange = useCallback((selectedValues: number[]) => {
    setFormData(prev => ({ ...prev, industries: selectedValues }));
    
    // Clear error when user selects industries
    if (errors.industries) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.industries;
        return newErrors;
      });
    }
  }, [errors]);
  
  const handleLocationChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, location: value || '' }));
    
    // Clear error when user selects location
    if (errors.location) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.location;
        return newErrors;
      });
    }
  }, [errors]);
  
  const handleDescriptionChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, description: value }));
    
    // Clear error when user types
    if (errors.description) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.description;
        return newErrors;
      });
    }
  }, [errors]);

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

  const handleAIApply = (content: string) => {
    setFormData(prev => ({ ...prev, description: content }));
  };
  
  const handleImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setLogoUrl(''); // Clear URL when file is selected
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setImagePreview(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
      
      // Clear error when user selects a file
      if (errors.logo) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.logo;
          return newErrors;
        });
      }
    } else {
      setLogoFile(null);
      setImagePreview(company?.logo?.url || null);
    }
  }, [errors, company?.logo?.url]);
  
  const handleLogoUrlChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setLogoUrl(url);
    
    // If URL is provided, clear the file
    if (url) {
      setLogoFile(null);
      setImagePreview(url);
    } else {
      setImagePreview(company?.logo?.url || null);
    }
    
    // Clear error when user types
    if (errors.logo) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.logo;
        return newErrors;
      });
    }
  }, [errors, company?.logo?.url]);
  
  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Vui lòng nhập tên công ty';
    }
    
    // For QuillEditor content, check if it has actual content (not just empty HTML tags)
    const descriptionText = formData.description.replace(/<[^>]*>/g, '').trim();
    if (!descriptionText) {
      newErrors.description = 'Vui lòng nhập mô tả công ty';
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
  
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !company) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Prepare data for submission
      const dataToSend: UpdateCompanyData = {};
      
      // Include all fields
      dataToSend.name = formData.name;
      dataToSend.description = formData.description;
      dataToSend.industries = formData.industries;
      dataToSend.website = formData.website || undefined;
      dataToSend.location = formData.location;
      dataToSend.employees = formData.employees || undefined;
      dataToSend.facebook = formData.facebook || undefined;
      dataToSend.youtube = formData.youtube || undefined;
      dataToSend.linkedin = formData.linkedin || undefined;
      dataToSend.twitter = formData.twitter || undefined;
      dataToSend.instagram = formData.instagram || undefined;
      
      // Handle logo update
      if (logoFile) {
        try {
          const mediaResponse = await uploadMedia(logoFile);
          dataToSend.logo_id = mediaResponse.id;
        } catch (uploadError) {
          console.error('Error uploading logo:', uploadError);
          toast.error('Có lỗi xảy ra khi tải lên logo');
          setIsSubmitting(false);
          return;
        }
      } else if (logoUrl && logoUrl !== company?.logo?.url) {
        // Create media from URL if URL is different from current logo
        try {
          const mediaResponse = await createMediaFromUrl(logoUrl);
          dataToSend.logo_id = mediaResponse.id;
        } catch (urlError) {
          console.error('Error creating media from URL:', urlError);
          toast.error('Có lỗi xảy ra khi tạo media từ URL');
          setIsSubmitting(false);
          return;
        }
      }
      
      // Submit all data
      const response = await updateCompany(company.id, dataToSend);
      
      if (response) {
        // Update company in context
        setCompany(response);
        toast.success('Cập nhật thông tin công ty thành công');
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Có lỗi xảy ra khi cập nhật thông tin công ty');
    } finally {
      setIsSubmitting(false);
    }
  }, [validateForm, company, formData, logoFile, logoUrl, setCompany]);
  
  if (companyLoading) {
    return (
      <div className="min-h-[300px] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải thông tin công ty...</p>
        </div>
      </div>
    );
  }
  
  if (!company) {
    return (
      <div className="bg-white rounded-lg shadow px-4 py-5 sm:p-6">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Không tìm thấy thông tin công ty</h2>
          <p className="text-gray-600 mb-6">Vui lòng tạo công ty trước khi quản lý thông tin.</p>
          <button 
            onClick={() => navigate('/nha-tuyen-dung/bang-dieu-khien')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer"
          >
            Quay lại bảng điều khiển
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow px-4 pb-6 sm:px-6">            
      {/* Action Buttons */}
      <div className="sticky top-16 z-40 bg-white border-b border-gray-200 px-4 py-6 sm:px-6 -mx-4 sm:-mx-6 rounded-tl-lg rounded-tr-lg">
        <div className="flex justify-center space-x-3">
          <button
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            className={`px-4 py-2 border rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer ${isPreviewMode ? 'border-transparent bg-blue-600 text-white hover:bg-blue-700' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'} transition-colors duration-200`}
          >
            {isPreviewMode ? 'Chỉnh sửa' : 'Xem trước'}
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            onClick={handleSubmit}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Đang lưu...
              </>
            ) : (
              'Lưu thay đổi'
            )}
          </button>
        </div>
      </div>

      {isPreviewMode ? (
        <div className="mt-[64px]">
          <CompanyDetail id={btoa(company.id.toString())} />
        </div>
      ) : (
        <form className="mt-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Quản lý thông tin công ty</h1>
            <p className="text-gray-600 mt-1">Cập nhật thông tin công ty của bạn</p>
          </div>
          <div className="flex items-start space-x-6">
            <div className="flex-shrink-0">
              {imagePreview ? (
                <img 
                  src={imagePreview} 
                  alt="Company logo preview" 
                  className="h-32 w-32 rounded-lg object-cover border border-gray-300"
                />
              ) : (
                <div className="bg-gray-200 border-2 border-dashed rounded-xl w-32 h-32 flex items-center justify-center text-gray-500">
                  Không có logo
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tải lên logo mới
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
                />
                <p className="mt-1 text-sm text-gray-500">JPG, PNG hoặc GIF (tối đa 5MB)</p>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hoặc nhập URL logo
                </label>
                <input
                  type="text"
                  value={logoUrl}
                  onChange={handleLogoUrlChange}
                  placeholder="https://example.com/logo.png"
                  className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
                />
                <p className="mt-1 text-sm text-gray-500">Nhập URL trực tiếp đến hình ảnh logo</p>
              </div>
              {errors.logo && <p className="mt-1 text-sm text-red-600">{errors.logo}</p>}
            </div>
          </div>
          
          {/* Basic Information Section */}
          <div className="mt-6 border-b border-gray-200 pb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Thông tin cơ bản</h2>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="name">
                  Tên công ty <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Nhập tên công ty"
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="description">
                  Mô tả công ty <span className="text-red-500">*</span>
                </label>
                
                {/* AI Helper Section */}
                <div className="mb-3 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-purple-900 mb-1">AI Assistant</h3>
                      <p className="text-sm text-purple-700 mb-3">
                        Sử dụng AI để tạo mô tả công ty chuyên nghiệp dựa trên tên và thông tin bạn đã nhập.
                      </p>
                      <AIGenerateButton
                        label="Tạo mô tả với AI"
                        onGenerate={handleAIGenerate}
                        onApply={handleAIApply}
                        disabled={false}
                        size="sm"
                        contextPlaceholder="Ví dụ: Nhấn mạnh văn hóa công ty trẻ trung, công nghệ hiện đại, cơ hội phát triển..."
                      />
                      <p className="text-xs text-purple-600 mt-2">
                        💡 AI sẽ sử dụng mô tả hiện tại để cải thiện nội dung. Bạn có thể thêm yêu cầu cụ thể trong popup nếu cần.
                      </p>
                    </div>
                  </div>
                </div>
                
                <QuillEditor
                  value={formData.description}
                  onChange={handleDescriptionChange}
                  placeholder="Mô tả chi tiết về công ty của bạn"
                  error={errors.description}
                />
                {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="employees">
                    Số lượng nhân viên <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="employees"
                    name="employees"
                    value={formData.employees}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.employees ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="Ví dụ: 50-100"
                  />
                  {errors.employees && <p className="mt-1 text-sm text-red-600">{errors.employees}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="website">
                    Website
                  </label>
                  <input
                    type="text"
                    id="website"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.website ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="https://www.example.com"
                  />
                  {errors.website && <p className="mt-1 text-sm text-red-600">{errors.website}</p>}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ngành nghề <span className="text-red-500">*</span>
                </label>
                <IndustrySelect
                  selectedValues={formData.industries}
                  onChange={handleIndustryChange}
                  error={errors.industries}
                />
                {errors.industries && <p className="mt-1 text-sm text-red-600">{errors.industries}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Địa điểm <span className="text-red-500">*</span>
                </label>
                <LocationSelect 
                  selectedValues={formData.location}
                  onChange={handleLocationChange}
                  error={errors.location}
                />
                {errors.location && <p className="mt-1 text-sm text-red-600">{errors.location}</p>}
              </div>
            </div>
          </div>
          
          {/* Social Media Section */}
          <div className="mt-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Mạng xã hội</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="facebook">
                  Facebook
                </label>
                <input
                  type="text"
                  id="facebook"
                  name="facebook"
                  value={formData.facebook}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.facebook ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="https://www.facebook.com/..."
                />
                {errors.facebook && <p className="mt-1 text-sm text-red-600">{errors.facebook}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="youtube">
                  YouTube
                </label>
                <input
                  type="text"
                  id="youtube"
                  name="youtube"
                  value={formData.youtube}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.youtube ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="https://www.youtube.com/..."
                />
                {errors.youtube && <p className="mt-1 text-sm text-red-600">{errors.youtube}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="linkedin">
                  LinkedIn
                </label>
                <input
                  type="text"
                  id="linkedin"
                  name="linkedin"
                  value={formData.linkedin}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.linkedin ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="https://www.linkedin.com/..."
                />
                {errors.linkedin && <p className="mt-1 text-sm text-red-600">{errors.linkedin}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="twitter">
                  Twitter
                </label>
                <input
                  type="text"
                  id="twitter"
                  name="twitter"
                  value={formData.twitter}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.twitter ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="https://twitter.com/..."
                />
                {errors.twitter && <p className="mt-1 text-sm text-red-600">{errors.twitter}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="instagram">
                  Instagram
                </label>
                <input
                  type="text"
                  id="instagram"
                  name="instagram"
                  value={formData.instagram}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.instagram ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="https://www.instagram.com/..."
                />
                {errors.instagram && <p className="mt-1 text-sm text-red-600">{errors.instagram}</p>}
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default CompanyManage;