import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../../contexts/UserContext';
import { useIndustryContext } from '../../../contexts/IndustryContext';
import { getAllJobs, createJob, deleteJob, closeJob, type Job } from '../../../api/jobService';
import { submitJobForReview, cancelJobReview } from '../../../api/jobReviewService';
import { getJobVersions, setVersionLive, setPrimaryVersion, createJobVersion, updateJobVersion, deleteJobVersion, type JobVersion } from '../../../api/jobVersionService';
import { toast } from 'react-toastify';
import { formatDate } from '../../../utils/dateUtils';
import { DataManagement } from '../../../components';
import SelectWithSearch from '../../../components/common/SelectWithSearch';
import JobVersionsModal from '../../../components/common/JobVersionsModal';
import ConfirmModal from '../../../components/common/ConfirmModal';

// Extended job type for the edit form
interface JobForEdit extends Omit<Job, 'industry_id'> {
  industry_id: number | number[];
  is_published?: boolean; // For checkbox in form
}

const JobManagement: React.FC = () => {
  const navigate = useNavigate();
  const { user, company } = useUser();
  const { industries } = useIndustryContext();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const hasFetchedData = useRef(false);
  
  // Version modal state
  const [showVersionsModal, setShowVersionsModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobForEdit | null>(null);
  const [versions, setVersions] = useState<JobVersion[]>([]);
  
  // Close job modal state
  const [showCloseJobModal, setShowCloseJobModal] = useState(false);
  const [jobToClose, setJobToClose] = useState<JobForEdit | null>(null);

  // Pagination and filtering state
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  // Fetch jobs with pagination and filtering
  const fetchJobs = useCallback(async (page: number = 1, reset: boolean = false, limit?: number) => {
    if (!user?.id || !company?.id) return;
    
    try {
      setLoading(true);
      
      // Reset filters and pagination if requested
      if (reset) {
        setSearchTerm('');
        setIndustryFilter('');
        setStatusFilter('');
        page = 1;
      }
      
      // Build filters object for API call
      const filters: Record<string, string> = {
        role: 'recruiter', // Pass the role as a query parameter
        user_id: user.id.toString() // Pass the user_id as a query parameter
      };
      
      if (!reset && statusFilter) {
        filters.status = statusFilter;
      }
      const response = await getAllJobs(
        page, 
        limit ?? pagination.limit, 
        reset ? '' : searchTerm,
        company?.id?.toString(), // Always filter by recruiter's company
        '', // location parameter
        reset ? '' : industryFilter,
        filters
      );
      
      setJobs(response.jobs);
      setPagination(response.pagination);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast.error('Lỗi khi tải danh sách tin tuyển dụng');
    } finally {
      setLoading(false);
    }
  }, [user?.id, company?.id, pagination.limit, searchTerm, industryFilter, statusFilter]);

  // Load data on component mount
  useEffect(() => {
    // Prevent duplicate calls in development due to React Strict Mode
    if (hasFetchedData.current || !user?.id) return;
    hasFetchedData.current = true;
    
    // Reset filters and search terms on component mount
    setSearchTerm('');
    setIndustryFilter('');
    fetchJobs(1);
  }, [fetchJobs, user?.id]);

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
  
  // Handle status filter change
  const handleStatusFilterChange = useCallback((selectedValues: any[]) => {
    setStatusFilter(selectedValues.length > 0 ? selectedValues[0] : '');
  }, []);

  // Status options for filter - recruiters can only see their own statuses
  const statusOptions = useMemo(() => [
    { value: '', label: 'Tất cả trạng thái' },
    { value: 'draft', label: 'Bản nháp' },
    { value: 'pending_review', label: 'Đang chờ duyệt' },
    { value: 'approved', label: 'Đã duyệt' },
    { value: 'rejected', label: 'Bị từ chối' }
  ], []);

  // Memoized additional filters
  const additionalFilters = useMemo(() => (
    <div className="flex flex-col md:flex-row gap-4">
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
    </div>
  ), [industryFilter, industryOptions, handleIndustryFilterChange, statusFilter, statusOptions, handleStatusFilterChange]);

  // Reset to first page when search term or filter changes
  useEffect(() => {
    if (searchTerm !== '' || industryFilter !== '' || statusFilter !== '') {
      setCurrentPage(1);
    }
  }, [searchTerm, industryFilter, statusFilter]);

  const handleCreate = useCallback(async (values: Record<string, any>): Promise<JobForEdit | null> => {
    if (!user?.id) return null;
    
    try {
      setLoading(true);
      // Handle industry_id which could be a number, string, or array
      let industryId = values.industry_id;
      
      // Handle array case (from multi-select)
      if (Array.isArray(industryId)) {
        industryId = industryId[0];
      }
      
      // Ensure we have a number
      industryId = typeof industryId === 'string' ? parseInt(industryId) : industryId;
      
      const jobData = {
        title: values.title,
        brief_description: values.brief_description,
        requirement: values.requirement,
        benefits: values.benefits || '',
        salary: values.salary || '',
        date_end_register: values.date_end_register || null,
        years_experienced: values.years_experienced ? parseInt(values.years_experienced) : 0,
        work_hours: values.work_hours || '',
        company_id: (company?.id || 0), // For recruiter, use their own ID as company_id
        industry_id: industryId,
        location: values.location || '',
        status: values.is_published ? 'pending_review' as const : 'draft' as const // Set status based on is_published checkbox
      };
      
      const createdJob = await createJob(jobData);
      
      if (createdJob) {
        let message = 'Tạo tin tuyển dụng mới thành công';
        if (values.is_published) {
          message += ' & Tin tuyển dụng đã được gửi đi phê duyệt!';
        }
        toast.success(message);
        
        // Format the job for edit mode (convert industry_id to array format)
        const formattedJob: JobForEdit = {
          ...createdJob,
          industry_id: [createdJob.industry_id],
          is_published: createdJob.status === 'pending_review' || createdJob.status === 'approved'
        };
        
        // Return the formatted job for edit mode
        return formattedJob;
      }
      return null;
    } catch (error) {
      console.error('Error creating job:', error);
      toast.error('Lỗi khi tạo tin tuyển dụng');
      setLoading(false); // Make sure to reset loading state on error
      return null;
    }
  }, [fetchJobs, user?.id, company?.id]);

  const handleEdit = useCallback(async (updatedJob: JobForEdit) => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      
      // Check if job has a current version
      if (!updatedJob.current_version_id) {
        toast.error('Không tìm thấy phiên bản hiện tại của tin tuyển dụng');
        setLoading(false);
        return;
      }
      
      // Handle industry_id which could be a number, string, or array
      let industryId = updatedJob.industry_id;
      
      // Handle array case (from multi-select)
      if (Array.isArray(industryId)) {
        industryId = industryId[0];
      }
      
      // Ensure we have a number
      industryId = typeof industryId === 'string' ? parseInt(industryId) : industryId;
      
      // Get current status
      const currentStatus = updatedJob.version_status || updatedJob.status;
      
      // Update the current version instead of creating a new one
      const resp = await updateJobVersion(updatedJob.id, updatedJob.current_version_id, {
        title: updatedJob.title,
        brief_description: updatedJob.brief_description,
        requirement: updatedJob.requirement,
        benefits: updatedJob.benefits || '',
        salary: updatedJob.salary || '',
        date_end_register: updatedJob.date_end_register || "",
        years_experienced: updatedJob.years_experienced ? parseInt((updatedJob as any).years_experienced) : 0,
        work_hours: updatedJob.work_hours || '',
        company_id: (company?.id || 0), // For recruiter, use their own ID as company_id
        industry_id: industryId,
        location: updatedJob.location || ''
      });
      
      if (resp) {
        let message = 'Cập nhật tin tuyển dụng thành công';
        
        // Handle status changes based on is_published checkbox
        if (updatedJob.is_published && (currentStatus === 'draft' || currentStatus === 'rejected')) {
          // Submit for review if user wants to publish
          await submitJobForReview(updatedJob.id);
          message += ' & Tin tuyển dụng đã được gửi đi phê duyệt!';
        } else if (!updatedJob.is_published && currentStatus === 'pending_review') {
          // Cancel review if user unchecks publish
          await cancelJobReview(updatedJob.id);
          message += ' & Đã hủy yêu cầu phê duyệt!';
        }
        
        toast.success(message);
        fetchJobs();
      }
    } catch (error) {
      console.error('Error updating job:', error);
      toast.error('Lỗi khi cập nhật tin tuyển dụng');
      setLoading(false); // Make sure to reset loading state on error
    }
  }, [fetchJobs, user?.id, company?.id]);

  const handleDelete = async (record: JobForEdit) => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const resp = await deleteJob(record.id);
      
      if (resp) {
        toast.success('Xóa tin tuyển dụng thành công');
        fetchJobs();
      }
    } catch (error) {
      console.error('Error deleting job:', error);
      toast.error('Lỗi khi xóa tin tuyển dụng');
      setLoading(false); // Make sure to reset loading state on error
    }
  };
  
  // Handle close job click
  const handleCloseJobClick = (job: JobForEdit) => {
    setJobToClose(job);
    setShowCloseJobModal(true);
  };
  
  // Handle confirm close job
  const handleConfirmCloseJob = async () => {
    if (!jobToClose) return;
    
    try {
      await closeJob(jobToClose.id);
      toast.success('Đóng tin tuyển dụng thành công');
      setShowCloseJobModal(false);
      setJobToClose(null);
      fetchJobs();
    } catch (error) {
      console.error('Error closing job:', error);
      toast.error('Lỗi khi đóng tin tuyển dụng');
    }
  };
  
  // Handle cancel close job
  const handleCancelCloseJob = () => {
    setShowCloseJobModal(false);
    setJobToClose(null);
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

  // Function to submit a job for review
  const handleSubmitForReview = useCallback(async (job: JobForEdit) => {
    try {
      setLoading(true);
      const result = await submitJobForReview(job.id);
      if (result) {
        toast.success('Tin tuyển dụng đã được gửi đi phê duyệt');
        fetchJobs();
      }
    } catch (error) {
      console.error('Error submitting job for review:', error);
      toast.error('Lỗi khi gửi tin tuyển dụng đi phê duyệt');
    } finally {
      setLoading(false);
    }
  }, [fetchJobs]);

  // Function to cancel a job review
  const handleCancelReview = useCallback(async (job: JobForEdit) => {
    try {
      setLoading(true);
      const result = await cancelJobReview(job.id);
      if (result) {
        toast.success('Đã hủy yêu cầu phê duyệt tin tuyển dụng');
        fetchJobs();
      }
    } catch (error) {
      console.error('Error canceling job review:', error);
      toast.error('Lỗi khi hủy yêu cầu phê duyệt');
    } finally {
      setLoading(false);
    }
  }, [fetchJobs]);
  
  // Function to view job versions
  const handleViewVersions = useCallback(async (job: JobForEdit) => {
    try {
      setLoading(true);
      const response = await getJobVersions(job.id);
      setVersions(response.versions || []);
      setSelectedJob(job);
      setShowVersionsModal(true);
    } catch (error) {
      console.error('Error fetching job versions:', error);
      toast.error('Lỗi khi lấy phiên bản tin tuyển dụng');
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Handle set version live
  const handleSetVersionLive = useCallback(async (jobId: number, versionId: number) => {
    try {
      await setVersionLive(jobId, versionId);
      toast.success('Đã đặt phiên bản làm live');
      // Refresh versions
      const response = await getJobVersions(jobId);
      setVersions(response.versions || []);
      fetchJobs();
    } catch (error) {
      console.error('Error setting version live:', error);
      toast.error('Lỗi khi đặt phiên bản làm live');
    }
  }, [fetchJobs]);
  
  // Handle set primary version
  const handleSetPrimaryVersion = useCallback(async (jobId: number, versionId: number) => {
    try {
      await setPrimaryVersion(jobId, versionId);
      toast.success('Đã đặt phiên bản làm phiên bản chính');
      // Refresh versions
      const response = await getJobVersions(jobId);
      setVersions(response.versions || []);
      // Update the selectedJob to reflect the new current_version_id
      if (selectedJob) {
        setSelectedJob({
          ...selectedJob,
          current_version_id: versionId
        });
      }
      fetchJobs();
    } catch (error) {
      console.error('Error setting primary version:', error);
      toast.error('Lỗi khi đặt phiên bản chính');
    }
  }, [fetchJobs, selectedJob]);
  
  // Handle create new version
  const handleCreateNewVersion = useCallback(async (jobId: number, versionData: any) => {
    try {
      await createJobVersion(jobId, versionData);
      toast.success('Đã tạo phiên bản mới');
      // Refresh versions
      const response = await getJobVersions(jobId);
      setVersions(response.versions || []);
      fetchJobs();
    } catch (error) {
      console.error('Error creating new version:', error);
      toast.error('Lỗi khi tạo phiên bản mới');
    }
  }, [fetchJobs]);
  
  // Handle update version
  const handleUpdateVersion = useCallback(async (jobId: number, versionId: number, versionData: any) => {
    try {
      await updateJobVersion(jobId, versionId, versionData);
      toast.success('Đã cập nhật phiên bản');
      // Refresh versions
      const response = await getJobVersions(jobId);
      setVersions(response.versions || []);
      fetchJobs();
    } catch (error) {
      console.error('Error updating version:', error);
      toast.error('Lỗi khi cập nhật phiên bản');
    }
  }, [fetchJobs]);
  
  // Handle delete version
  const handleDeleteVersion = useCallback(async (jobId: number, versionId: number) => {
    try {
      await deleteJobVersion(jobId, versionId);
      toast.success('Đã xóa phiên bản');
      // Refresh versions
      const response = await getJobVersions(jobId);
      setVersions(response.versions || []);
      fetchJobs();
    } catch (error) {
      console.error('Error deleting version:', error);
      toast.error('Lỗi khi xóa phiên bản');
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
      key: 'version_status' as keyof JobForEdit,
      title: 'Trạng thái phiên bản',
      render: (value: string) => getStatusBadge(value)
    },
    { key: 'title' as keyof Job, title: 'Tiêu đề' },
    { 
      key: 'industry_id' as keyof JobForEdit, 
      title: 'Ngành nghề',
      render: (_value: any, record: JobForEdit) => {
        // Get the actual industry_id value (could be array or number)
        const industryId = Array.isArray(record.industry_id) ? record.industry_id[0] : record.industry_id;
        const industry = industries.find(i => i.id === industryId);
        return industry ? industry.name : `ID: ${industryId}`;
      }
    },
    { key: 'salary' as keyof Job, title: 'Mức lương' },
    { key: 'location' as keyof Job, title: 'Vị trí' },
    {
      key: 'status' as keyof Job,
      title: 'Trạng thái',
      render: (value: string) => {
        switch(value) {
          case 'draft': return 'Bản nháp';
          case 'pending_review': return 'Đang chờ duyệt';
          case 'approved': return 'Đã duyệt';
          case 'rejected': return 'Bị từ chối';
          default: return 'Bản nháp';
        }
      }
    },
    {
      key: 'date_end_register' as keyof Job,
      title: 'Hạn nộp hồ sơ',
      render: (value: string) => value ? formatDate(value) : 'Chưa có'
    },
    {
      key: 'created_at' as keyof Job,
      title: 'Ngày tạo',
      render: (value: string) => formatDate(value)
    }
  ];

  // Memoized form fields to prevent recreation on each render
  const formFields = useMemo(() => [
    {
      name: 'is_published',
      label: 'Đăng tuyển công khai',
      type: 'checkbox' as const,
      description: 'Khi chọn, tin tuyển dụng sẽ được gửi đi phê duyệt và hiển thị công khai sau khi được duyệt'
    },
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
      name: 'location',
      label: 'Vị trí',
      type: 'location' as const,
      required: true,
      placeholder: 'Nhập vị trí'
    },
    {
      name: 'max_applicants',
      label: 'Số lượng ứng viên tối đa',
      type: 'number' as const,
      placeholder: 'Để trống nếu không giới hạn',
      description: 'Số lượng ứng viên tối đa có thể ứng tuyển vào công việc này'
    },
    {
      name: 'auto_close_on_threshold',
      label: 'Tự động đóng khi đạt ngưỡng',
      type: 'checkbox' as const,
      description: 'Tự động đóng tin tuyển dụng khi đạt số lượng ứng viên tối đa. Bạn sẽ luôn nhận được thông báo và email khi đạt ngưỡng.'
    },
  ], []);

  // Memoized pagination data
  const paginationData = useMemo(() => {
    return pagination.totalPages > 1
      ? {
          currentPage,
          totalPages: pagination.totalPages,
          totalItems: pagination.total,
          itemsPerPage: pagination.limit,
          onPageChange: fetchJobs,
          onItemsPerPageChange: (newLimit: number) => {
            setPagination(prev => ({ ...prev, limit: newLimit }));
            fetchJobs(1, false, newLimit);
          }
        }
      : undefined;
  }, [currentPage, pagination, fetchJobs]);

  // Memoized filter data
  const filterData = useMemo(() => ({
    searchTerm,
    onSearchChange: setSearchTerm,
    additionalFilters,
    onFilter: () => fetchJobs(currentPage, false)
  }), [searchTerm, additionalFilters, currentPage, fetchJobs]);

  // Format jobs data for editing to ensure industry_id is in the correct format
  const formattedJobs = useMemo(() => {
    return jobs.map(job => ({
      ...job,
      // Convert industry_id to array format for IndustrySelect
      industry_id: [job.industry_id],
      // Set is_published based on status
      is_published: job.status === 'pending_review' || job.status === 'approved',
      // Ensure threshold fields have default values
      auto_close_on_threshold: job.auto_close_on_threshold || false
    })) as JobForEdit[];
  }, [jobs]);

  // Check if company exists
  if (!company) {
    return (
      <div className="bg-white rounded-lg shadow px-4 py-5 sm:p-6">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Không tìm thấy thông tin công ty</h2>
          <p className="text-gray-600 mb-6">Vui lòng tạo công ty trước khi quản lý tin tuyển dụng.</p>
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
        filters={filterData}
        action={{
          additionalActions: (job: JobForEdit) => {
            const actions = [];
            
            // Use version_status (current version's status) instead of job.status
            const currentStatus = job.version_status || job.status;
            
            // Show "Xem trực tiếp" only for approved/live jobs
            if (currentStatus === 'approved') {
              actions.push({
                label: 'Xem trực tiếp',
                icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>,
                onClick: () => handleViewLive(job),
                className: 'text-blue-600 hover:text-blue-800 cursor-pointer',
                type: 'default'
              });
            }
            
            // Always show "Xem trước"
            actions.push({
              label: 'Xem trước',
              icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>,
              onClick: () => handlePreview(job),
              className: 'text-green-600 hover:text-green-800 cursor-pointer',
              type: 'default'
            });
            
            // Always show "Quản lý phiên bản"
            actions.push({
              label: 'Quản lý phiên bản',
              icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>,
              onClick: () => handleViewVersions(job),
              className: 'text-purple-600 hover:text-purple-800 cursor-pointer',
              type: 'default'
            });
            
            // Add "Quản lý hồ sơ" action
            actions.push({
              label: 'Quản lý hồ sơ',
              icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
              onClick: () => navigate(`/nha-tuyen-dung/quan-ly-tin-tuyen-dung/${job.id}/ung-vien`),
              className: 'text-indigo-600 hover:text-indigo-800 cursor-pointer',
              type: 'default'
            });
            
            // Add Submit for Review action if current version is in draft or rejected status
            if (currentStatus === 'draft' || currentStatus === 'rejected') {
              actions.push({
                label: 'Gửi phê duyệt',
                icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
                onClick: () => handleSubmitForReview(job),
                className: 'text-green-600 hover:text-green-800 cursor-pointer',
                type: 'add'
              });
            }
            
            // Add Cancel Review action if current version is pending review
            if (currentStatus === 'pending_review') {
              actions.push({
                label: 'Hủy phê duyệt',
                icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>,
                onClick: () => handleCancelReview(job),
                className: 'text-red-600 hover:text-red-800 cursor-pointer',
                type: 'default'
              });
            }
            
            // Add Close Job action if job is approved and not already closed
            if (currentStatus === 'approved' && !job.is_closed) {
              actions.push({
                label: 'Đóng tin tuyển dụng',
                icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>,
                onClick: () => handleCloseJobClick(job),
                className: 'text-orange-600 hover:text-orange-800 cursor-pointer',
                type: 'default'
              });
            }
            
            return actions;
          }
        }}
      />
      
      {/* Job Versions Modal */}
      <JobVersionsModal
        isOpen={showVersionsModal}
        onClose={() => setShowVersionsModal(false)}
        job={selectedJob}
        versions={versions}
        onSetVersionLive={handleSetVersionLive}
        onSetPrimaryVersion={handleSetPrimaryVersion}
        onCreateNewVersion={handleCreateNewVersion}
        onUpdateVersion={handleUpdateVersion}
        onDeleteVersion={handleDeleteVersion}
      />
      
      {/* Close Job Confirmation Modal */}
      <ConfirmModal
        isOpen={showCloseJobModal}
        onClose={handleCancelCloseJob}
        onConfirm={handleConfirmCloseJob}
        title="Xác nhận đóng tin tuyển dụng"
        message={`Bạn có chắc chắn muốn đóng tin tuyển dụng "${jobToClose?.title}"?\n\nSau khi đóng:\n- Ứng viên không thể ứng tuyển vào tin này nữa\n- Tất cả ứng viên đang chờ xét duyệt sẽ được thông báo\n- Nếu muốn mở lại, bạn sẽ phải gửi phê duyệt lại`}
        confirmText="Đóng tin tuyển dụng"
        cancelText="Hủy"
        type="warning"
      />
    </>
  );
};

export default JobManagement;
