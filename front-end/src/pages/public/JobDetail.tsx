import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getJobById, likeJob, unlikeJob, checkLikeStatus, type Job } from '../../api/jobService';
import { getJobVersions, getJobVersion } from '../../api/jobVersionService';
import { getCompanyById } from '../../api/companyService';
import { useUser } from '../../contexts/UserContext';
import { toast } from 'react-toastify';
import ReportModal from '../../components/common/ReportModal';

interface JobDetailProps {
  id?: string;
}

const JobDetail: React.FC<JobDetailProps> = ({ id: propId }) => {
  const { id: paramId } = useParams<{ id: string }>();
  const jobId = propId || paramId;
  
  const { isAuthenticated } = useUser();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isLoadingLike, setIsLoadingLike] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [versions, setVersions] = useState<any[]>([]);
  const [showVersions, setShowVersions] = useState(false);
  const navigate = useNavigate();
  
  // Function to check if the job has expired
  const isJobExpired = useCallback(() => {
    if (!job || !job.date_end_register) return false;
    
    const currentDate = new Date();
    const expiryDate = new Date(job.date_end_register);
    
    // Set both dates to midnight for accurate day comparison
    currentDate.setHours(0, 0, 0, 0);
    expiryDate.setHours(0, 0, 0, 0);
    
    return currentDate > expiryDate;
  }, [job]);

  const getJobIdFromParam = useCallback(() => {
    if (!jobId) return null;
    try {
      const decodedData = atob(jobId);
      const jobIdNum = parseInt(decodedData || '', 10);
      return isNaN(jobIdNum) ? null : jobIdNum;
    } catch (error) {
      console.error('Error decoding job ID:', error);
      return null;
    }
  }, [jobId]);

  const handleLikeToggle = useCallback(async () => {
    if (!isAuthenticated) {
      navigate('/dang-nhap');
      return;
    }

    if (!job) return;

    try {
      setIsLoadingLike(true);

      let resp;
      if (isLiked) {
        resp = await unlikeJob(job.id);
      } else {
        resp = await likeJob(job.id);
      }

      if (resp) {
        setIsLiked(!isLiked);
        toast.success(`${isLiked ? 'Bỏ lưu' : 'Đã lưu'} tin tuyển dụng thành công`);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setIsLoadingLike(false);
    }
  }, [isAuthenticated, job, isLiked, navigate]);

  const fetchJobData = useCallback(async () => {
    const jobIdNum = getJobIdFromParam();
    if (!jobIdNum) {
      setError('ID tin tuyển dụng không hợp lệ');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      let jobData = await getJobById(jobIdNum);
      
      // If there's a version parameter in the URL, fetch that specific version
      const urlParams = new URLSearchParams(window.location.search);
      const versionId = urlParams.get('version');
      
      if (versionId && jobData.current_version_id) {
        try {
          // Fetch the specific version if requested
          const versionData = await getJobVersion(jobIdNum, parseInt(versionId));
          if (versionData) {
            // Merge the version data with the job data
            jobData = {
              ...jobData,
              title: versionData.title,
              brief_description: versionData.brief_description,
              requirement: versionData.requirement,
              benefits: versionData.benefits,
              salary: versionData.salary,
              date_end_register: versionData.date_end_register,
              years_experienced: versionData.years_experienced,
              work_hours: versionData.work_hours,
              location: versionData.location,
              version_number: versionData.version_number,
              version_status: versionData.status
            };
          }
        } catch (error) {
          console.error('Error fetching job version:', error);
          // Continue with the current version if there's an error
        }
      }
      
      // Fetch company details using the company_id from job data
      if (jobData.company_id) {
        try {
          const companyData = await getCompanyById(jobData.company_id);
          // Map companyService.Company to jobService.Company format
          jobData.company = {
            id: companyData.id,
            name: companyData.name,
            description: companyData.description,
            logo: companyData.logo?.url || '',
            website: companyData.website || '',
            location: companyData.location || '',
            employees: companyData.employees || '',
          };
        } catch (companyError) {
          console.error('Error fetching company data:', companyError);
        }
      }
      
      setJob(jobData);

      // Check like status if user is logged in
      if (isAuthenticated) {
        try {
          const isLiked = await checkLikeStatus(jobIdNum);
          setIsLiked(isLiked);
        } catch (likeError) {
          console.error('Error checking like status:', likeError);
          setIsLiked(false);
        }
      }
    } catch (err) {
      console.error('Error fetching job data:', err);
      setError('Không thể tải thông tin tin tuyển dụng');
    } finally {
      setLoading(false);
    }
  }, [getJobIdFromParam, isAuthenticated]);

  // Function to fetch job versions
  const fetchVersions = useCallback(async () => {
    if (!job) return;
    
    try {
      const versionsData = await getJobVersions(job.id);
      if (versionsData && versionsData.versions) {
        setVersions(versionsData.versions);
      }
    } catch (error) {
      console.error('Error fetching job versions:', error);
    }
  }, [job]);

  useEffect(() => {
    if (jobId) {
      fetchJobData();
    }
  }, [jobId, fetchJobData]);
  
  // Fetch versions when job data is loaded
  useEffect(() => {
    if (job && job.version_count && job.version_count > 1) {
      fetchVersions();
    }
  }, [job, fetchVersions]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-700">{error || 'Không tìm thấy tin tuyển dụng'}</p>
        <button 
          onClick={() => window.history.back()} 
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 cursor-pointer"
        >
          Quay lại
        </button>
      </div>
    );
  }

  // Get the numeric job ID for the report modal
  const numericJobId = getJobIdFromParam();

  return (
    <>
      <div className="mt-[-32px]">
        {/* Banner with enhanced visual elements */}
        <div className="relative h-64 md:h-80 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-b-2xl overflow-hidden">
          {/* Decorative elements for visual interest */}
          <div className="absolute top-0 left-0 w-full h-full opacity-10">
            <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-white"></div>
            <div className="absolute bottom-10 right-10 w-24 h-24 rounded-full bg-white"></div>
            <div className="absolute top-1/2 left-1/4 w-16 h-16 rounded-full bg-white"></div>
          </div>
          
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent"></div>
          
          {/* Banner content */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center px-4">
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-2 drop-shadow-lg">Chi tiết tin tuyển dụng</h1>
              <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto drop-shadow-md">
                Khám phá cơ hội nghề nghiệp tuyệt vời cùng chúng tôi
              </p>
            </div>
          </div>
        </div>

        {/* Job info below banner */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 md:-mt-20 relative z-10">
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
            {/* Job header */}
            <div className="flex flex-col md:flex-row items-start gap-6">
              {/* Company logo */}
              <div className="flex-shrink-0">
                <div className="h-24 w-24 md:h-32 md:w-32 rounded-2xl bg-blue-100 border-4 border-white shadow-lg flex items-center justify-center text-blue-500">
                  <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                
                {/* Industry chip below logo */}
                <div className="mt-3 flex justify-center">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    {job.industry_name}
                  </span>
                </div>
              </div>
              
              {/* Job title and info in a single column */}
              <div className="flex-1 w-full">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{job.title}</h2>

                  {/* Info items in a single row */}
                  <div className="mt-5 w-full">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Location */}
                      <div className="flex items-start">
                        <div className="bg-blue-100 rounded-full p-3 mr-3">
                          <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">Địa điểm</h3>
                          <p className="text-gray-600">
                            {job.location?.split(',').slice(-1)[0]}
                          </p>
                        </div>
                      </div>
                      
                      {/* Salary */}
                      <div className="flex items-start">
                        <div className="bg-green-100 rounded-full p-3 mr-3">
                          <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">Mức lương</h3>
                          <p className="text-gray-600">
                            {job.salary 
                            ? job.salary
                            : 'Thỏa thuận'}
                          </p>
                        </div>
                      </div>
                      
                      {/* Experience */}
                      <div className="flex items-start">
                        <div className="bg-purple-100 rounded-full p-3 mr-3">
                          <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">Kinh nghiệm</h3>
                          <p className="text-gray-600">
                            {job.years_experienced 
                              ? job.years_experienced + ' năm'
                              : 'Không yêu cầu kinh nghiệm'}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Expiry date banner */}
                    {job.date_end_register && <div className="mt-3 py-2 px-4 bg-gray-100 rounded-md inline-block">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Hạn nộp hồ sơ:</span> {new Date(job.date_end_register).toLocaleDateString('vi-VN')}
                      </p>
                    </div>}
                    
                    {/* Version information */}
                    {job.version_number && (
                      <div className="mt-3 py-2 px-4 bg-blue-50 rounded-md">
                        <div className="flex justify-between items-center">
                          <p className="text-sm text-blue-800">
                            <span className="font-medium">Phiên bản:</span> {job.version_number}
                            {job.version_status && (
                              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-blue-100">
                                {job.version_status === 'approved' ? 'Đã duyệt' : 
                                 job.version_status === 'pending_review' ? 'Đang chờ duyệt' : 
                                 job.version_status === 'rejected' ? 'Bị từ chối' : 
                                 job.version_status}
                              </span>
                            )}
                          </p>
                          
                          {versions.length > 0 && (
                            <button 
                              onClick={() => setShowVersions(!showVersions)}
                              className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                            >
                              {showVersions ? 'Ẩn phiên bản' : 'Xem các phiên bản'}
                              <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showVersions ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
                              </svg>
                            </button>
                          )}
                        </div>
                        
                        {/* Version list */}
                        {showVersions && versions.length > 0 && (
                          <div className="mt-2 border-t border-blue-100 pt-2">
                            <p className="text-xs text-blue-600 mb-1">Chọn phiên bản để xem:</p>
                            <div className="flex flex-wrap gap-2">
                              {versions.map(version => (
                                <a 
                                  key={version.id}
                                  href={`?version=${version.id}`}
                                  className={`px-2 py-1 text-xs rounded-md ${version.id === job.current_version_id ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800 hover:bg-blue-200'}`}
                                >
                                  Phiên bản {version.version_number}
                                  {version.is_live && <span className="ml-1 text-xs">(Live)</span>}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Action buttons */}
                    <div className="mt-5 flex space-x-4">
                      {/* Apply button - larger */}
                      <button 
                        className={`flex-1 px-6 py-3 font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-300 flex items-center justify-center shadow-sm ${isJobExpired() ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500 cursor-not-allowed opacity-90 hover:opacity-100' : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 cursor-pointer'} text-white`}
                        disabled={isJobExpired()}
                      >
                        {isJobExpired() ? (
                          <>
                            <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Hết hạn ứng tuyển
                          </>
                        ) : (
                          <>
                            <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13l-3 3m0 0l-3-3m3 3V8m0 13a9 9 0 110-18 9 9 0 010 18z" />
                            </svg>
                            Ứng tuyển ngay
                          </>
                        )}
                      </button>
                      
                      {/* Like button - smaller */}
                      {isAuthenticated && (
                        <button 
                          onClick={handleLikeToggle}
                          disabled={isLoadingLike}
                          className={`w-1/4 px-3 py-3 border-2 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-300 cursor-pointer flex items-center justify-center ${isLiked ? 'border-red-300 bg-white text-gray-700 hover:bg-gray-50' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'} disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          <svg className={`mr-1 h-5 w-5 ${isLiked ? 'text-red-500 fill-current' : 'text-gray-400'}`} viewBox="0 0 24 24" stroke="currentColor" fill="none">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isLiked ? 0 : 2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                          {isLoadingLike ? 'Đang xử lý...' : isLiked ? 'Đã lưu' : 'Lưu'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Two columns layout */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left column - job details (70% width) */}
            <div className="lg:col-span-2 space-y-8">
              {/* Job details */}
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                {/* Basic job info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 border-b border-gray-100">
                  <div>
                    <div className="mb-4">
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Mức lương</h3>
                      <p className="text-base font-semibold text-gray-900">{job.salary || 'Thỏa thuận'}</p>
                    </div>
                    <div className="mb-4">
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Địa điểm</h3>
                      <p className="text-base text-gray-900">{job.location || 'Chưa có thông tin'}</p>
                    </div>
                  </div>
                  <div>
                    <div className="mb-4">
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Thời gian làm việc</h3>
                      <p className="text-base text-gray-900">{job.work_hours || 'Chưa có thông tin'}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Hạn nộp hồ sơ</h3>
                      <p className="text-base text-gray-900">
                        {job.date_end_register ? new Date(job.date_end_register).toLocaleDateString('vi-VN') : 'Chưa có thông tin'}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Description */}
                <div className="mb-8">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Mô tả tin tuyển dụng</h2>
                  {job.brief_description ? (
                    <>
                      <div 
                        dangerouslySetInnerHTML={{ 
                          __html: showFullDescription 
                            ? job.brief_description 
                            : job.brief_description.length > 500 
                              ? job.brief_description.substring(0, 500) + '...' 
                              : job.brief_description 
                        }} 
                        className="prose max-w-none text-gray-700"
                      />
                      {job.brief_description.length > 500 && (
                        <button 
                          onClick={() => setShowFullDescription(!showFullDescription)}
                          className="mt-2 text-blue-600 hover:text-blue-800 font-medium cursor-pointer flex items-center"
                        >
                          {showFullDescription ? 'Thu gọn' : 'Xem thêm'}
                          {showFullDescription ? (
                            <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          ) : (
                            <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          )}
                        </button>
                      )}
                    </>
                  ) : (
                    <p className="text-gray-500 italic">Chưa có mô tả chi tiết cho tin tuyển dụng này.</p>
                  )}
                </div>
                
                {/* Requirements */}
                <div className="mb-8">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Yêu cầu tin tuyển dụng</h2>
                  {job.requirement ? (
                    <div 
                      dangerouslySetInnerHTML={{ __html: job.requirement }} 
                      className="prose max-w-none text-gray-700"
                    />
                  ) : (
                    <p className="text-gray-500 italic">Chưa có thông tin về yêu cầu tin tuyển dụng.</p>
                  )}
                </div>
                
                {/* Benefits */}
                <div className="mb-8">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Quyền lợi</h2>
                  {job.benefits ? (
                    <div 
                      dangerouslySetInnerHTML={{ __html: job.benefits }} 
                      className="prose max-w-none text-gray-700"
                    />
                  ) : (
                    <p className="text-gray-500 italic">Chưa có thông tin về quyền lợi.</p>
                  )}
                </div>
                
                {/* Action buttons */}
                <div className="mt-8 flex flex-col sm:flex-row gap-4">
                  <button 
                    className={`flex-1 px-6 py-3 font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-300 ${isJobExpired() ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500 cursor-not-allowed opacity-90 hover:opacity-100' : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 cursor-pointer'} text-white`}
                    disabled={isJobExpired()}
                  >
                    {isJobExpired() ? 'Hết hạn ứng tuyển' : 'Ứng tuyển ngay'}
                  </button>
                  
                  {isAuthenticated && (
                    <button 
                      onClick={handleLikeToggle}
                      disabled={isLoadingLike}
                      className="cursor-pointer flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-300"
                    >
                      {isLoadingLike ? 'Đang xử lý...' : isLiked ? 'Đã lưu tin tuyển dụng' : 'Lưu tin tuyển dụng'}
                    </button>
                  )}
                </div>
              </div>
              
              {/* Similar jobs section */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Việc làm tương tự</h2>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    Gợi ý cho bạn
                  </span>
                </div>
                <div className="space-y-4">
                  {/* Similar job item 1 */}
                  <div className="bg-white rounded-xl p-4 border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 cursor-pointer">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-gray-900">Nhân viên Phát triển Phần mềm</h3>
                        <p className="text-gray-600 text-sm mt-1">Công ty ABC Technology</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Hà Nội
                          </span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            Toàn thời gian
                          </span>
                        </div>
                      </div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        15-20 triệu
                      </span>
                    </div>
                  </div>
                  
                  {/* Similar job item 2 */}
                  <div className="bg-white rounded-xl p-4 border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 cursor-pointer">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-gray-900">Chuyên viên Marketing</h3>
                        <p className="text-gray-600 text-sm mt-1">Công ty XYZ Solutions</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Hồ Chí Minh
                          </span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            Bán thời gian
                          </span>
                        </div>
                      </div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        10-15 triệu
                      </span>
                    </div>
                  </div>
                  
                  <button className="w-full py-3 text-center text-blue-600 hover:text-blue-800 font-medium bg-white rounded-xl border border-blue-200 hover:border-blue-300 hover:shadow-sm transition-all duration-200 flex items-center justify-center">
                    <span>Xem tất cả việc làm tương tự</span>
                    <svg className="ml-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            
            {/* Right column - application and company info (30% width) */}
            <div className="lg:col-span-1 space-y-8">
              {/* Company information section */}
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Thông tin công ty</h2>
                <div className="flex items-center space-x-3 mb-4" title={job.company?.name || ''}>
                  <div className="flex-shrink-0">
                    {job.company?.logo 
                    ? <img src={job.company?.logo} alt={job.company?.name} className="h-16 w-16 rounded-lg object-cover" /> 
                    : (
                      <div className="h-16 w-16 rounded-lg bg-blue-100 flex items-center justify-center text-blue-500">
                        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                    )}
                  </div>

                  <h3 className="font-bold text-gray-900 line-clamp-3">{job.company?.name}</h3>                
                </div>
                
                <div className="space-y-4 mt-2">
                  {/* Industry */}
                  <div className="flex items-center" title={job.industry_name || ''}>
                    <div className="mr-3">
                      <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold text-gray-500">Lĩnh vực</h3>
                      <p className="text-sm text-gray-800 line-clamp-2">{job.industry_name}</p>
                    </div>
                  </div>
                  
                  {/* Employee */}
                  <div className="flex items-center" title={job.company?.employees || ''}>
                    <div className="mr-3">
                      <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold text-gray-500">Quy mô</h3>
                      <p className="text-sm text-gray-800 line-clamp-2">
                        {job.company?.employees}
                      </p>
                    </div>
                  </div>
                  
                  {/* Location */}
                  <div className="flex items-center" title={job.company?.location || ''}>
                    <div className="mr-3">
                      <svg className="h-5 w-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold text-gray-500">Địa điểm</h3>
                      <p className="text-sm text-gray-800 line-clamp-2">{job.company?.location}</p>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => navigate(`/cong-ty/${btoa(job.company_id.toString())}`)} 
                    className="w-full mt-4 py-2 px-4 border border-blue-300 text-blue-600 font-medium rounded-lg hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-300 cursor-pointer flex items-center justify-center"
                  >
                    <span>Xem trang công ty</span>
                    <svg className="ml-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
              
              {/* Share section */}
              <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Chia sẻ tin tuyển dụng với bạn bè</h2>
                
                <div className="space-y-4">
                  {/* URL sharing */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Liên kết chia sẻ</label>
                    <div className="flex items-center">
                      <input 
                        type="text" 
                        value={window.location.href} 
                        readOnly 
                        className="flex-1 min-w-0 px-3 py-2 text-sm border border-gray-300 rounded-l-md bg-gray-50 truncate"
                      />
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(window.location.href);
                          toast.success('Đã sao chép liên kết');
                        }}
                        className="cursor-pointer inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 text-sm font-medium rounded-r-md text-gray-700 bg-gray-50 hover:bg-gray-100"
                      >
                        <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  {/* Social sharing */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Chia sẻ lên mạng xã hội</label>
                    <div className="flex space-x-3">
                      <a 
                        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center h-10 w-10 rounded-full text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                      >
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                        </svg>
                      </a>
                      <a 
                        href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center h-10 w-10 rounded-full text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200"
                      >
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                      </a>
                      <a 
                        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center h-10 w-10 rounded-full text-white bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                      >
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Safety tips section */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-100 shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="bg-amber-100 p-2 rounded-full mr-3">
                    <svg className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Bí kíp tìm việc an toàn</h2>
                </div>
                
                <p className="text-sm text-gray-600 mb-4 border-l-4 border-amber-200 pl-3 italic">
                  Bảo vệ bản thân khỏi các lừa đảo việc làm bằng cách nhận biết các dấu hiệu cảnh báo và biết cách phản ứng khi gặp phải.
                </p>
                
                {/* Warning signs section */}
                <div className="mb-5 bg-white bg-opacity-60 rounded-lg p-3">
                  <h4 className="text-sm font-semibold text-amber-800 mb-3 flex items-center">
                    <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Dấu hiệu cảnh báo phổ biến
                  </h4>
                  <ul className="text-xs text-gray-700 space-y-2.5">
                    <li className="flex items-center hover:bg-amber-50 p-1 rounded-md transition-colors duration-150">
                      <svg className="h-4 w-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span><span className="font-medium">Yêu cầu thanh toán phí trước:</span> Các công ty uy tín không yêu cầu ứng viên thanh toán bất kỳ khoản phí nào</span>
                    </li>
                    <li className="flex items-center hover:bg-amber-50 p-1 rounded-md transition-colors duration-150">
                      <svg className="h-4 w-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span><span className="font-medium">Mức lương cao bất thường:</span> Lương cao hơn nhiều so với mặt bằng thị trường có thể là dấu hiệu lừa đảo</span>
                    </li>
                    <li className="flex items-center hover:bg-amber-50 p-1 rounded-md transition-colors duration-150">
                      <svg className="h-4 w-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span><span className="font-medium">Thông tin công ty mơ hồ:</span> Không có địa chỉ văn phòng, website hoặc thông tin liên hệ chính thức</span>
                    </li>
                    <li className="flex items-center hover:bg-amber-50 p-1 rounded-md transition-colors duration-150">
                      <svg className="h-4 w-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span><span className="font-medium">Yêu cầu thông tin nhạy cảm:</span> Số CMND/CCCD, tài khoản ngân hàng trước khi phỏng vấn</span>
                    </li>
                    <li className="flex items-center hover:bg-amber-50 p-1 rounded-md transition-colors duration-150">
                      <svg className="h-4 w-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span><span className="font-medium">Sử dụng email cá nhân:</span> Nhà tuyển dụng chuyên nghiệp sử dụng email doanh nghiệp, không dùng Gmail cá nhân</span>
                    </li>
                  </ul>
                </div>
                
                {/* What to do section */}
                <div className="bg-white bg-opacity-60 rounded-lg p-3">
                  <h4 className="text-sm font-semibold text-blue-800 mb-3 flex items-center">
                    <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Hành động khi gặp việc làm đáng ngờ
                  </h4>
                  <ul className="text-xs text-gray-700 space-y-3">
                    <li className="flex items-center bg-blue-50 p-2 rounded-md">
                      <svg className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span><span className="font-medium">Kiểm tra kỹ thông tin:</span> Tìm kiếm công ty trên Google, mạng xã hội và các nền tảng đánh giá uy tín</span>
                    </li>
                    <li className="flex items-center bg-blue-50 p-2 rounded-md">
                      <svg className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                      </svg>
                      <span><span className="font-medium">Báo cáo:</span> Sử dụng nút "Báo cáo" trên trang việc làm để thông báo việc làm đáng ngờ</span>
                    </li>
                    <li className="flex items-center bg-blue-50 p-2 rounded-md">
                      <svg className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span><span className="font-medium">Liên hệ hỗ trợ:</span> Email: <span className="font-medium text-blue-700">support@jobcv.vn</span> hoặc hotline: <span className="font-medium text-blue-700">1900 1234</span></span>
                    </li>
                  </ul>
                </div>
                
                <div className="mt-4 text-center">
                  <button 
                    onClick={() => setIsReportModalOpen(true)}
                    className="cursor-pointer px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md shadow-sm transition-colors duration-200 flex items-center mx-auto"
                  >
                    <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                    </svg>
                    Báo cáo tin tuyển dụng này
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    
      {/* Report Modal */}
      {job && numericJobId && (
        <ReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          jobId={numericJobId}
          jobTitle={job.title}
        />
      )}
    </>
  )
};

export default JobDetail;
