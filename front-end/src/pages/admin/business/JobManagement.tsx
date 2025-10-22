import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllJobs, createJob, updateJob, deleteJob, type Job, type CreateJobData } from '../../../api/jobService';
import { getJobVersions, reviewJobVersion, type JobVersion } from '../../../api/jobVersionService';
import SelectWithSearch from '../../../components/common/SelectWithSearch';
import ReviewJobVersionModal from '../../../components/common/ReviewJobVersionModal';

// Define JobForEdit locally since we're removing the import from JobVersionsModal
export interface JobForEdit extends Omit<Job, 'industry_id' | 'company_id'> {
  industry_id: number | number[];
  company_id: number | number[];
  current_version_id?: number;
  version_status?: string;
}

// Using JobForEdit from types/job.ts
import { getAllCompanies, type Company } from '../../../api/companyService';
import { toast } from 'react-toastify';
import { DataManagement } from '../../../components';
// import { useIndustryContext } from '../../../contexts/IndustryContext';

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const JobManagement: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobForEdit | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<JobVersion | null>(null);
  const [versions, setVersions] = useState<JobVersion[]>([]);
  const [loading, setLoading] = useState(true);
  // const { industries } = useIndustryContext();
  
  // Status options for filtering
  const statusOptions = useMemo(() => [
    { value: '', label: 'Tất cả trạng thái' },
    { value: 'draft', label: 'Bản nháp' },
    { value: 'pending_review', label: 'Chờ duyệt' },
    { value: 'approved', label: 'Đã duyệt' },
    { value: 'rejected', label: 'Từ chối' }
  ], []);
  const hasFetchedData = useRef(false);
  const navigate = useNavigate();

  // Pagination and filtering state
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  // Fetch jobs with pagination and filtering
  const fetchJobs = useCallback(async (page: number = 1, reset: boolean = false) => {
    try {
      setLoading(true);
      
      // Reset filters and pagination if requested
      if (reset) {
        setSearchTerm('');
        setCompanyFilter('');
        setStatusFilter('');
        page = 1;
      }
      
      // Build filters object for API call - admin can see all jobs
      const filters: Record<string, string> = {
        role: 'admin' // Pass the role as a query parameter
      };
      
      // No need to explicitly set user_id filter as admin can see all jobs
      
      const response = await getAllJobs(
        page, 
        pagination.limit, 
        reset ? '' : searchTerm,
        reset ? '' : companyFilter,
        '', // location parameter
        '', // industry parameter (empty string)
        {
          ...filters,
          status: reset ? '' : statusFilter // Add status filter
        }
      );

      setJobs(response.jobs);
      setPagination(response.pagination);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.limit, searchTerm, companyFilter, statusFilter]);

  // Fetch companies
  const fetchCompanies = useCallback(async () => {
    try {
      const response = await getAllCompanies(1, 1000); // Fetch all companies
      setCompanies(response?.companies || []);
    } catch (error) {
      console.error('Error fetching companies:', error);
      toast.error('Lỗi khi tải danh sách công ty');
    }
  }, []);


  // Load data on component mount
  useEffect(() => {
    // Prevent duplicate calls in development due to React Strict Mode
    if (hasFetchedData.current) return;
    hasFetchedData.current = true;
    
    // Reset filters and search terms on component mount
    setSearchTerm('');
    setCompanyFilter('');
    setStatusFilter('');
    fetchJobs(1);
    fetchCompanies();
  }, [fetchJobs, fetchCompanies]);

  // Handle search term and filter changes
  useEffect(() => {
    // Reset to first page when filters change
    if (searchTerm !== '' || companyFilter !== '' || statusFilter !== '') {
      setCurrentPage(1);
    }
  }, [searchTerm, companyFilter, statusFilter]);

  const handleCreate = useCallback(async (values: Record<string, any>): Promise<JobForEdit | null> => {
    try {
      // Handle industry_id and company_id which could be numbers or strings
      // If they're arrays (from the select component), take the first value
      let industryId = values.industry_id;
      let companyId = values.company_id;
      
      // Handle array case (from multi-select)
      if (Array.isArray(industryId)) {
        industryId = industryId[0];
      }
      if (Array.isArray(companyId)) {
        companyId = companyId[0];
      }
      
      // Ensure we have numbers
      industryId = typeof industryId === 'string' ? parseInt(industryId) : industryId;
      companyId = typeof companyId === 'string' ? parseInt(companyId) : companyId;
      
      const jobData: CreateJobData = {
        title: values.title,
        brief_description: values.brief_description,
        requirement: values.requirement,
        benefits: values.benefits || '',
        salary: values.salary || '',
        date_end_register: values.date_end_register || null,
        years_experienced: values.years_experienced ? parseInt(values.years_experienced) : 0,
        work_hours: values.work_hours || '',
        company_id: companyId,
        industry_id: industryId,
        location: values.location
      };
      
      const createdJob = await createJob(jobData);

      if (createdJob) {
        toast.success('Tạo công việc mới thành công');
        
        // Format the job for edit mode
        const formattedJob: JobForEdit = {
          ...createdJob,
          industry_id: [createdJob.industry_id],
          company_id: [createdJob.company_id]
        };
        
        // Return the formatted job for edit mode
        return formattedJob;
      }
      return null;
    } catch (error) {
      console.error('Error creating job:', error);
      return null;
    }
  }, [fetchJobs, companies]);

  const handleEdit = useCallback(async (updatedJob: JobForEdit) => {
    try {      
      // Handle industry_id and company_id which could be numbers or strings
      // If they're arrays (from the select component), take the first value
      let industryId = (updatedJob as any).industry_id;
      let companyId = (updatedJob as any).company_id;
      
      // Handle array case (from multi-select)
      if (Array.isArray(industryId)) {
        industryId = industryId[0];
      }
      if (Array.isArray(companyId)) {
        companyId = companyId[0];
      }
      
      // Ensure we have numbers
      industryId = typeof industryId === 'string' ? parseInt(industryId) : industryId;
      companyId = typeof companyId === 'string' ? parseInt(companyId) : companyId;
      
      // Update the job with the new data
      const resp = await updateJob(updatedJob.id, {
        title: updatedJob.title,
        brief_description: updatedJob.brief_description,
        requirement: updatedJob.requirement,
        benefits: updatedJob.benefits,
        salary: updatedJob.salary,
        date_end_register: updatedJob.date_end_register || "",
        years_experienced: updatedJob.years_experienced ? parseInt((updatedJob as any).years_experienced) : 0,
        work_hours: updatedJob.work_hours,
        company_id: companyId,
        industry_id: industryId,
        location: updatedJob.location
      });
      
      if (resp) {
        toast.success('Cập nhật công việc thành công');
        fetchJobs();
      }
    } catch (error) {
      console.error('Error updating job:', error);
    }
  }, [fetchJobs, currentPage, companies]);

  const handleDelete = async (record: JobForEdit) => {
    try {
      const resp = await deleteJob(record.id);
      
      if (resp) {
        toast.success('Xóa công việc thành công');
        fetchJobs();
      }
    } catch (error) {
      console.error('Error deleting job:', error);
    }
  };

  // Function to navigate to the public job detail page
  const handleViewLive = useCallback((job: JobForEdit) => {
    // The job ID is encoded in base64 in the URL as seen in JobDetail.tsx
    const encodedId = btoa(job.id.toString());
    navigate(`/viec-lam/${encodedId}`);
  }, [navigate]);

  // Function to preview job (including drafts and pending versions)
  const handlePreview = useCallback((job: JobForEdit) => {
    // Open the preview in a new tab
    window.open(`/viec-lam/preview/${job.id}${job.current_version_id ? `?version_id=${job.current_version_id}` : ''}`, '_blank');
  }, []);
  
  // Function to open the review modal for a job version
  const handleOpenReviewModal = useCallback(async (job: JobForEdit, versionId: number) => {
    try {
      setLoading(true);
      // Set the selected job
      setSelectedJob(job);
      
      // Check if we already have versions loaded
      let version = versions.find(v => v.id === versionId);
      
      // If not, fetch the versions for this job
      if (!version) {
        const versionsData = await getJobVersions(job.id);
        setVersions(versionsData.versions);
        version = versionsData.versions.find(v => v.id === versionId);
      }
      
      if (version) {
        setSelectedVersion(version);
        setShowReviewModal(true);
      } else {
        toast.error('Không tìm thấy phiên bản');
      }
    } catch (error) {
      console.error('Error opening review modal:', error);
      toast.error('Lỗi khi mở modal duyệt phiên bản');
    } finally {
      setLoading(false);
    }
  }, [versions]);

  // Function to review a job version
  const handleApproveVersion = useCallback(async (jobId: number, versionId: number, feedback?: string) => {
    try {
      setLoading(true);
      const result = await reviewJobVersion(jobId, versionId, 'approved', feedback);
      if (result) {
        toast.success('Phiên bản đã được duyệt thành công');
        fetchJobs();
        setShowReviewModal(false);
      }
    } catch (error) {
      console.error('Error approving job version:', error);
      toast.error('Lỗi khi duyệt phiên bản');
    } finally {
      setLoading(false);
    }
  }, [fetchJobs]);

  // Function to reject a job version
  const handleRejectVersion = useCallback(async (jobId: number, versionId: number, feedback: string) => {
    try {
      setLoading(true);
      const result = await reviewJobVersion(jobId, versionId, 'rejected', feedback);
      if (result) {
        toast.success('Phiên bản đã bị từ chối');
        fetchJobs();
        setShowReviewModal(false);
      }
    } catch (error) {
      console.error('Error rejecting job version:', error);
      toast.error('Lỗi khi từ chối phiên bản');
    } finally {
      setLoading(false);
    }
  }, [fetchJobs]);
  
    // Status badge configuration
    const STATUS_CONFIG = useMemo(() => ({
      draft: { 
        bg: 'bg-gray-100', 
        text: 'text-gray-800', 
        label: 'Bản nháp',
        icon: '📝'
      },
      pending_review: { 
        bg: 'bg-yellow-100', 
        text: 'text-yellow-800', 
        label: 'Chờ duyệt',
        icon: '⏳'
      },
      approved: { 
        bg: 'bg-green-100', 
        text: 'text-green-800', 
        label: 'Đã duyệt',
        icon: '✓'
      },
      rejected: { 
        bg: 'bg-red-100', 
        text: 'text-red-800', 
        label: 'Từ chối',
        icon: '✗'
      },
      archived: { 
        bg: 'bg-gray-100', 
        text: 'text-gray-800', 
        label: 'Lưu trữ',
        icon: '📦'
      }
    }), []);
  
    const getStatusBadge = useCallback((status: string) => {
      const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.draft;
      
      return (
        <span 
          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
          title={config.label}
        >
          <span aria-hidden="true">{config.icon}</span>
          <span>{config.label}</span>
        </span>
      );
    }, [STATUS_CONFIG]);

  // Table columns
  const columns = [
    {
      key: 'current_version_id' as keyof JobForEdit,
      title: 'Phiên bản ID',
      render: (value: number | undefined) => value ? value : 'Chưa có'
    },
    {
      key: 'version_status' as keyof JobForEdit,
      title: 'Trạng thái phiên bản',
      render: (value: string) => getStatusBadge(value)
    },
    { key: 'title' as keyof JobForEdit, title: 'Tiêu đề' },
    { 
      key: 'company_id' as keyof JobForEdit, 
      title: 'Công ty',
      render: (_value: any, record: JobForEdit) => {
        // Get the actual company_id value (could be array or number)
        const companyId = Array.isArray(record.company_id) ? record.company_id[0] : record.company_id;
        const company = companies.find(c => c.id === companyId);
        return company ? company.name : `ID: ${companyId}`;
      }
    },
      { 
      key: 'industry_id' as keyof JobForEdit, 
      title: 'Ngành nghề',
      render: (_value: any, record: JobForEdit) => {
        // Get the actual industry_id value (could be array or number)
        const industryId = Array.isArray(record.industry_id) ? record.industry_id[0] : record.industry_id;
        // Since we don't have industries context anymore, just show the ID
        return `ID: ${industryId}`;
      }
    },
    { key: 'salary' as keyof JobForEdit, title: 'Mức lương' },
    { key: 'location' as keyof JobForEdit, title: 'Vị trí' },
    {
      key: 'date_end_register' as keyof JobForEdit,
      title: 'Hạn nộp hồ sơ',
      render: (value: string) => value ? new Date(value).toLocaleDateString('vi-VN') : 'Chưa có'
    },
    {
      key: 'created_at' as keyof JobForEdit,
      title: 'Ngày tạo',
      render: (value: string) => new Date(value).toLocaleDateString('vi-VN')
    }
  ];

  // Memoized form fields to prevent recreation on each render
  const formFields = useMemo(() => [
    {
      name: 'title',
      label: 'Tiêu đề',
      type: 'textarea' as const,
      required: true,
      placeholder: 'Nhập tiêu đề công việc'
    },
    {
      name: 'brief_description',
      label: 'Mô tả công việc',
      type: 'editor' as const,
      required: true,
      placeholder: 'Nhập mô tả ngắn gọn về công việc'
    },
    {
      name: 'requirement',
      label: 'Yêu cầu',
      type: 'editor' as const,
      required: true,
      placeholder: 'Nhập yêu cầu công việc'
    },
    {
      name: 'benefits',
      label: 'Quyền lợi',
      type: 'editor' as const,
      placeholder: 'Nhập quyền lợi công việc'
    },
    {
      name: 'salary',
      label: 'Mức lương',
      type: 'text' as const,
      placeholder: 'Nhập mức lương (ví dụ: 10-15 triệu)'
    },
    {
      name: 'date_end_register',
      label: 'Hạn nộp hồ sơ',
      type: 'datetime' as const
    },
    {
      name: 'years_experienced',
      label: 'Số năm kinh nghiệm',
      type: 'number' as const,
      placeholder: 'Nhập số năm kinh nghiệm yêu cầu'
    },
    {
      name: 'work_hours',
      label: 'Thời gian làm việc',
      type: 'text' as const,
      placeholder: 'Nhập thời gian làm việc (ví dụ: 8h-17h, Thứ 2-Thứ 6)'
    },
    {
      name: 'industry_id',
      label: 'Ngành nghề',
      type: 'industry' as const,
      multiple: false,
      required: true,
      // Convert to number array for IndustrySelect component
      defaultValue: []
    },
    {
      name: 'company_id',
      label: 'Công ty',
      type: 'select' as const,
      required: true,
      options: companies.map(company => ({ value: company.id, label: company.name }))
    },
    {
      name: 'location',
      label: 'Vị trí',
      type: 'location' as const,
      required: true,
      placeholder: 'Nhập vị trí'
    }
  ], [companies]);

  // Company options for SelectWithSearch
  const companyOptions = useMemo(() => [
    { value: '', label: 'Tất cả công ty' },
    ...companies.map(company => ({
      value: company.name,
      label: company.name
    }))
  ], [companies]);

  // Handle company filter change
  const handleCompanyFilterChange = useCallback((selectedValues: any[]) => {
    setCompanyFilter(selectedValues.length > 0 ? selectedValues[0] : '');
  }, []);

  // Handle status filter change
  const handleStatusFilterChange = useCallback((selectedValues: any[]) => {
    setStatusFilter(selectedValues.length > 0 ? selectedValues[0] : '');
  }, []);

  // Memoized additional filters to prevent recreation on each render
  const additionalFilters = useMemo(() => (
    <>
      <div className="w-full md:w-64">
        <label htmlFor="companyFilter" className="block text-sm font-medium text-gray-700 mb-1">
          Công ty
        </label>
        <SelectWithSearch
          options={companyOptions}
          selectedValues={[companyFilter]}
          onChange={handleCompanyFilterChange}
          placeholder="Chọn công ty"
          multiple={false}
          clearable={true}
        />
      </div>
      <div className="w-full md:w-64">
        <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 mb-1">
          Trạng thái
        </label>
        <SelectWithSearch
          options={statusOptions}
          selectedValues={[statusFilter]}
          onChange={handleStatusFilterChange}
          placeholder="Chọn trạng thái"
          multiple={false}
          clearable={true}
        />
      </div>
    </>
  ), [companyFilter, statusFilter, companyOptions, statusOptions, handleCompanyFilterChange, handleStatusFilterChange]);

  // Memoized pagination data
  const paginationData = useMemo(() => {
    return pagination.totalPages > 1
      ? {
          currentPage,
          totalPages: pagination.totalPages,
          totalItems: pagination.total,
          itemsPerPage: pagination.limit,
          onPageChange: fetchJobs
        }
      : undefined;
  }, [currentPage, pagination, fetchJobs]);

  // Format jobs data for editing to ensure industry_id and company_id are in the correct format
  const formattedJobs = useMemo(() => {
    return jobs.map(job => ({
      ...job,
      // Convert industry_id to array format for IndustrySelect
      industry_id: [job.industry_id],
      // Convert company_id to array format for SelectWithSearch
      company_id: [job.company_id]
    })) as JobForEdit[];
  }, [jobs]);

  return (
    <>
      <DataManagement<JobForEdit>
        title="Quản lý tin tuyển dụng"
        data={formattedJobs}
        columns={columns}
        formFields={formFields}
        loading={loading}
        onCreate={handleCreate}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onRefresh={() => fetchJobs(1, true)}
        pagination={paginationData}
        filters={{
          searchTerm,
          onSearchChange: setSearchTerm,
          additionalFilters: additionalFilters,
          onFilter: () => fetchJobs(currentPage, false)
        }}
        action={{
          additionalActions: (job: JobForEdit) => {
            const actions = [];
            
            // Add review version action when status is pending_review (waiting for request)
            if (job.version_status === 'pending_review') {
              actions.push({
                label: 'Duyệt/Từ chối',
                icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
                onClick: () => handleOpenReviewModal(job, job.current_version_id!),
                className: 'text-green-600 hover:text-green-800 cursor-pointer',
                type: 'add'
              });
            }

            // Only show "Xem trực tiếp" if the job has an approved version that is live
            if (job.version_status === 'approved') {
              actions.push({
                label: 'Xem trực tiếp',
                icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>,
                onClick: () => handleViewLive(job),
                className: 'text-blue-600 hover:text-blue-800 cursor-pointer',
                type: 'default'
              });
            }
            
            // Always show preview button
            actions.push({
              label: 'Xem trước',
              icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>,
              onClick: () => handlePreview(job),
              className: 'text-green-600 hover:text-green-800 cursor-pointer',
              type: 'default'
            });
            
            return actions;
          }
        }}
      />  
      
      {/* Review Job Version Modal */}
      <ReviewJobVersionModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        job={selectedJob}
        version={selectedVersion}
        onApprove={handleApproveVersion}
        onReject={handleRejectVersion}
        isLoading={loading}
      />
    </>
  );
};

export default JobManagement;
