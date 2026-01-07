import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllCompanies, createCompany, updateCompany, deleteCompany, type Company, type CreateCompanyData } from '../../../api/companyService';
import { uploadMedia, createMediaFromUrl } from '../../../api/mediaService';
import { toast } from 'react-toastify';
import { DataManagement } from '../../../components';
import { useIndustryContext } from '../../../contexts/IndustryContext';
import SelectWithSearch from '../../../components/common/SelectWithSearch';
import { getLogoUrl } from '../../../utils/mediaUtils';
import AIGenerateButton from '../../../components/common/AIGenerateButton';
import aiGenerationService from '../../../services/aiGenerationService';
import QuillEditor from '../../../components/common/QuillEditor';

const CompanyManagementRefactored: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const { industries } = useIndustryContext();
  const hasFetchedData = useRef(false);
  const navigate = useNavigate();
  const [currentFormData, setCurrentFormData] = useState<Record<string, any>>({});
  
  // Pagination and filtering state
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [industryFilter, setIndustryFilter] = useState<string>('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  // Fetch companies with pagination and filtering
  const fetchCompanies = useCallback(async (page: number = 1, reset: boolean = false, limit?: number) => {
    try {
      setLoading(true);
      
      // Reset filters and pagination if requested
      if (reset) {
        setSearchTerm('');
        setIndustryFilter('');
        page = 1;
      }     
      
      const response = await getAllCompanies(
        page, 
        limit ?? pagination.limit, 
        searchTerm, 
        industryFilter
      );
      
      setCompanies(response.companies || []);
      setPagination(response.pagination);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.limit, searchTerm, industryFilter]);



  // Load data on component mount
  useEffect(() => {
    // Prevent duplicate calls in development due to React Strict Mode
    if (hasFetchedData.current) return;
    hasFetchedData.current = true;
    
    // Reset filters and search terms on component mount
    setSearchTerm('');
    setIndustryFilter('');
    fetchCompanies(1);
  }, [fetchCompanies]);

  // Industry options for SelectWithSearch
  const industryOptions = useMemo(() => [
    { value: '', label: 'Tất cả ngành' },
    ...industries.map(industry => ({
      value: industry.id.toString(),
      label: industry.name
    }))
  ], [industries]);

  // Handle industry filter change
  const handleIndustryFilterChange = useCallback((selectedValues: any[]) => {
    setIndustryFilter(selectedValues.length > 0 ? selectedValues[0] : '');
  }, []);

  // Memoized additional filters
  const additionalFilters = useMemo(() => (
    <div className="w-full md:w-64">
      <label htmlFor="industryFilter" className="block text-sm font-medium text-gray-700 mb-1">
        Ngành nghề
      </label>
      <SelectWithSearch
        options={industryOptions}
        selectedValues={[industryFilter]}
        onChange={handleIndustryFilterChange}
        placeholder="Chọn ngành nghề"
        multiple={false}
        clearable={true}
      />
    </div>
  ), [industryFilter, industryOptions, handleIndustryFilterChange]);

  // Reset to first page when search term changes
  useEffect(() => {
    if (searchTerm !== '') {
      setCurrentPage(1);
    }
  }, [searchTerm]);

  // Memoized pagination data
  const paginationData = useMemo(() => {
    return {
      currentPage,
      totalPages: pagination.totalPages,
      totalItems: pagination.total,
      itemsPerPage: pagination.limit,
      onPageChange: fetchCompanies,
      onItemsPerPageChange: (newLimit: number) => {
        setPagination(prev => ({ ...prev, limit: newLimit }));
        fetchCompanies(1, false, newLimit);
      }
    };
  }, [currentPage, pagination, fetchCompanies]);

  // Memoized filter data
  const filterData = useMemo(() => ({
    searchTerm,
    onSearchChange: setSearchTerm,
    additionalFilters,
    onFilter: () => fetchCompanies(currentPage, false)
  }), [searchTerm, additionalFilters, currentPage, fetchCompanies]);

  const handleCreate = useCallback(async (values: Record<string, any>): Promise<Company | null> => {
    try {
      // Handle logo upload if a file is provided
      let logoId: number | undefined;
      if (values.logo && values.logo instanceof File) {
        try {
          const mediaResponse = await uploadMedia(values.logo);
          logoId = mediaResponse.id;
        } catch (uploadError) {
          console.error('Error uploading logo:', uploadError);
        }
      } else if (typeof values.logo === 'number') {
        logoId = values.logo;
      } else if (typeof values.logo === 'string' && values.logo.trim() !== '') {
        // If logo is a URL string, create a media record from the URL
        try {
          const mediaResponse = await createMediaFromUrl(values.logo);
          logoId = mediaResponse.id;
        } catch (urlError) {
          console.error('Error creating media from URL:', urlError);
          toast.error('Không thể tạo logo từ URL. Vui lòng kiểm tra URL.');
        }
      }
      
      const companyData: CreateCompanyData = {
        name: values.name,
        description: values.description,
        industries: Array.isArray(values.industries) ? values.industries.map(Number) : [],
        website: values.website,
        location: values.location,
        logo_id: logoId,
        employees: values.employees,
        facebook: values.facebook,
        youtube: values.youtube,
        linkedin: values.linkedin,
        twitter: values.twitter,
        instagram: values.instagram,
      };
      
      const createdCompany = await createCompany(companyData);

      if (createdCompany) {
        toast.success('Tạo công ty mới thành công');
        // Return the created company for edit mode
        return createdCompany;
      }
      return null;
    } catch (error) {
      console.error('Error creating company:', error);
      return null;
    }
  }, [fetchCompanies, currentPage]);

  const handleEdit = useCallback(async (updatedCompany: Company) => {
    try {
      // The DataManagement component merges the original record with form values
      // For editing, we need to handle the industries field from form values
      const industriesData = Array.isArray((updatedCompany as any).industries) 
        ? (updatedCompany as any).industries.map(Number) 
        : updatedCompany.industries || [];
      
      // Handle logo upload if a file is provided
      let logoId: number | undefined = updatedCompany.logo?.id ? updatedCompany.logo.id : undefined;
      if ((updatedCompany as any).logo && (updatedCompany as any).logo instanceof File) {
        try {
          const mediaResponse = await uploadMedia((updatedCompany as any).logo);
          logoId = mediaResponse.id;
        } catch (uploadError) {
          console.error('Error uploading logo:', uploadError);
        }
      } else if (typeof (updatedCompany as any).logo === 'number') {
        logoId = (updatedCompany as any).logo;
      } else if (typeof (updatedCompany as any).logo === 'string' && (updatedCompany as any).logo.trim() !== '') {
        // If logo is a URL string and different from current logo URL, create a media record from the URL
        const currentLogoUrl = updatedCompany.logo?.url || '';
        if ((updatedCompany as any).logo !== currentLogoUrl) {
          try {
            const mediaResponse = await createMediaFromUrl((updatedCompany as any).logo);
            logoId = mediaResponse.id;
          } catch (urlError) {
            console.error('Error creating media from URL:', urlError);
            toast.error('Không thể tạo logo từ URL. Vui lòng kiểm tra URL.');
          }
        }
      }
      
      // Update the company with the new industries array
      const resp = await updateCompany(updatedCompany.id, {
        name: updatedCompany.name,
        description: updatedCompany.description,
        industries: industriesData,
        website: updatedCompany.website,
        location: updatedCompany.location,
        logo_id: logoId,
        employees: updatedCompany.employees,
        facebook: updatedCompany.facebook,
        youtube: updatedCompany.youtube,
        linkedin: updatedCompany.linkedin,
        twitter: updatedCompany.twitter,
        instagram: updatedCompany.instagram,
      });
      
      if (resp) {
        toast.success('Cập nhật công ty thành công');
        fetchCompanies(currentPage);
      }
    } catch (error) {
      console.error('Error updating company:', error);
    }
  }, [fetchCompanies, currentPage]);

  // Function to navigate to the public company detail page
  const handleViewLive = useCallback((company: Company) => {
    // The company ID is encoded in base64 in the URL as seen in CompanyDetail.tsx
    const encodedId = btoa(company.id.toString());
    navigate(`/cong-ty/${encodedId}`);
  }, [navigate]);

  const handleDelete = async (record: Company) => {
    try {
      const resp = await deleteCompany(record.id);
      if (resp) {
        toast.success('Xóa công ty thành công');
        fetchCompanies(currentPage);
      }
    } catch (error) {
      console.error('Error deleting company:', error);
    }
  };

  // Memoized columns to prevent recreation on each render
  const columns = useMemo(() => [
    { 
      key: 'logo_url' as keyof Company, 
      title: 'Logo',
      render: (_value: any, record: Company) => {
        const logoUrl = getLogoUrl(record?.logo);
        return logoUrl ? (
          <img src={logoUrl} alt={record.name} className="h-10 w-10 object-contain" />
        ) : (
          <div className="h-10 w-10 bg-gray-200 rounded flex items-center justify-center">
            <span className="text-gray-500 text-xs">Không có</span>
          </div>
        );
      }
    },
    { key: 'name' as keyof Company, title: 'Tên công ty' },
    { 
      key: 'industries' as keyof Company, 
      title: 'Ngành nghề',
      render: (_value: any, record: Company) => {
        if (Array.isArray(record.industries) && record.industries.length > 0) {
          // Map industry IDs to industry names
          const industryNames = record.industries.map(industryId => {
            const industry = industries.find(i => i.id === industryId);
            return industry ? industry.name : `ID: ${industryId}`;
          });
          
          // Show first 2 industries and "..." if there are more
          if (industryNames.length > 2) {
            const displayedIndustries = industryNames.slice(0, 2).join(', ');
            const remainingIndustries = industryNames.slice(2).join(', ');
            return (
              <span title={remainingIndustries}>
                {displayedIndustries} và {industryNames.length - 2} ngành khác...
              </span>
            );
          }
          return industryNames.join(', ');
        }
        return 'Chưa có';
      }
    },
    { 
      key: 'website' as keyof Company, 
      title: 'Website',
      render: (value: any) => value ? (
        <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-900">
          {value}
        </a>
      ) : 'Chưa có'
    },
    { 
      key: 'location' as keyof Company, 
      title: 'Vị trí',
      render: (value: any) => {
        if (Array.isArray(value) && value.length > 0) {
          // Show only the first location
          return value[0];
        } else if (typeof value === 'string') {
          // If it's a string, show it as is
          return value;
        }
        return 'Chưa có';
      }
    },
    { 
      key: 'employees' as keyof Company, 
      title: 'Nhân viên',
      render: (value: any) => value || 'Chưa có'
    },
    { 
      key: 'created_at' as keyof Company, 
      title: 'Ngày tạo',
      render: (value: any) => new Date(value).toLocaleDateString('vi-VN')
    }
  ], [industries]);

  // AI Generation handlers
  const handleAIGenerateDescription = async (customContext?: string) => {
    const industryNames = Array.isArray(currentFormData.industries)
      ? currentFormData.industries.map((id: number) =>
          industries.find(ind => ind.id === id)?.name || ''
        ).filter(Boolean).join(', ')
      : '';

    return await aiGenerationService.generateCompanyDescription({
      name: currentFormData.name || '',
      industry: industryNames,
      size: currentFormData.employees || '',
      location: currentFormData.location || ''
    }, customContext);
  };

  // Memoized form fields to prevent recreation on each render
  const formFields = useMemo(() => [
    { 
      name: 'logo', 
      label: 'Logo công ty', 
      type: 'image' as const,
    },
    { 
      name: 'name', 
      label: 'Tên công ty', 
      type: 'textarea' as const, 
      required: true, 
      placeholder: 'Nhập tên công ty' 
    },
    { 
      name: 'description', 
      label: 'Mô tả', 
      type: 'custom' as const,
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
                onGenerate={handleAIGenerateDescription}
                onApply={(content) => {
                  onChange(content);
                  setCurrentFormData({ ...currentFormData, description: content });
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
                setCurrentFormData({ ...currentFormData, description: newValue });
              }}
              placeholder="Nhập mô tả công ty"
            />
          </div>
        );
      }
    },
    { 
      name: 'industries', 
      label: 'Ngành nghề', 
      type: 'industry' as const, 
      required: true
    },
    { 
      name: 'website', 
      label: 'Website', 
      type: 'text' as const, 
      placeholder: 'Nhập website công ty' 
    },
    { 
      name: 'employees', 
      label: 'Số lượng nhân viên', 
      type: 'text' as const, 
      placeholder: 'Nhập số lượng nhân viên (ví dụ: 50-100)' 
    },
    { 
      name: 'location', 
      label: 'Vị trí', 
      type: 'location' as const, 
      placeholder: 'Chọn vị trí công ty',
    },
    { 
      name: 'facebook', 
      label: 'Facebook', 
      type: 'text' as const, 
      placeholder: 'Nhập URL Facebook công ty' 
    },
    { 
      name: 'youtube', 
      label: 'YouTube', 
      type: 'text' as const, 
      placeholder: 'Nhập URL YouTube công ty' 
    },
    { 
      name: 'linkedin', 
      label: 'LinkedIn', 
      type: 'text' as const, 
      placeholder: 'Nhập URL LinkedIn công ty' 
    },
    { 
      name: 'twitter', 
      label: 'Twitter', 
      type: 'text' as const, 
      placeholder: 'Nhập URL Twitter công ty' 
    },
    { 
      name: 'instagram', 
      label: 'Instagram', 
      type: 'text' as const, 
      placeholder: 'Nhập URL Instagram công ty' 
    },
  ], [companies, currentFormData, industries]);

  return (
    <DataManagement<Company>
      title="Quản lý công ty"
      data={companies}
      columns={columns}
      formFields={formFields}
      loading={loading}
      onCreate={handleCreate}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onRefresh={() => fetchCompanies(1, true)}
      pagination={paginationData}
      filters={filterData}
      action={{
        additionalActions: (company: Company) => [
          {
            label: 'Xem trực tiếp',
            icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>,
            onClick: () => handleViewLive(company),
            className: 'text-blue-600 hover:text-blue-800 cursor-pointer',
            type: 'default'
          }
        ]
      }}
    />
  );
};

export default CompanyManagementRefactored;
