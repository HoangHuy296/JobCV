import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserLikedJobs, unlikeJob, type Job } from '../../api/jobService';
import { toast } from 'react-toastify';
import { formatDate } from '../../utils/dateUtils';
import { LuHeart, LuBriefcase, LuMapPin, LuCalendar, LuDollarSign, LuLoader, LuHeartOff, LuSearch, LuFilter } from 'react-icons/lu';
import { usePagination } from '../../hooks/usePagination';
import SelectWithSearch from '../../components/common/SelectWithSearch';

// Memoized JobCard component to prevent unnecessary re-renders
const JobCard = React.memo(({ 
  job, 
  onUnlike, 
  onViewJob, 
  formatDate 
}: { 
  job: Job; 
  onUnlike: (id: number) => void; 
  onViewJob: (id: number) => void;
  formatDate: (date: string) => string;
}) => (
  <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden border border-gray-200">
    <div className="p-6">
      {job.company_logo && (
        <div className="flex justify-center mb-4">
          <img
            src={job.company_logo}
            alt={job.company_name}
            className="h-24 w-24 object-cover rounded"
          />
        </div>
      )}

      <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
        {job.title}
      </h3>

      {job.company_name && (
        <p className="text-sm text-gray-600 mb-3 flex items-center gap-1">
          <LuBriefcase className="w-4 h-4" />
          {job.company_name}
        </p>
      )}

      {job.location && (
        <p className="text-sm text-gray-600 mb-2 flex items-center gap-1">
          <LuMapPin className="w-4 h-4" />
          {job.location}
        </p>
      )}

      {job.salary && (
        <p className="text-sm text-gray-600 mb-2 flex items-center gap-1">
          <LuDollarSign className="w-4 h-4" />
          {job.salary}
        </p>
      )}

      {job.date_end_register && (
        <p className="text-sm text-gray-500 mb-4 flex items-center gap-1">
          <LuCalendar className="w-4 h-4" />
          Hạn nộp: {formatDate(job.date_end_register)}
        </p>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => onViewJob(job.id)}
          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium cursor-pointer"
        >
          Xem chi tiết
        </button>
        <button
          onClick={() => onUnlike(job.id)}
          className="px-4 py-2 border border-red-300 text-red-600 rounded-md hover:bg-red-50 transition-colors cursor-pointer"
          title="Bỏ thích"
        >
          <LuHeart className="w-5 h-5 fill-current" />
        </button>
      </div>
    </div>
  </div>
));
JobCard.displayName = 'JobCard';

const LikedJobs: React.FC = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentPage, setCurrentPage, pagination, setPagination } = usePagination(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [salaryFilter, setSalaryFilter] = useState<string>('all');

  const fetchLikedJobs = useCallback(async (page: number = 1) => {
    try {
      setLoading(true);
      const response = await getUserLikedJobs(page, 10);
      setJobs(response.jobs);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Error fetching liked jobs:', error);
      toast.error('Không thể tải danh sách công việc đã thích');
    } finally {
      setLoading(false);
    }
  }, [setPagination]);

  useEffect(() => {
    fetchLikedJobs(currentPage);
  }, [currentPage, fetchLikedJobs]);

  const handleUnlike = useCallback(async (jobId: number) => {
    try {
      await unlikeJob(jobId);
      toast.success('Đã bỏ thích công việc');
      fetchLikedJobs(currentPage);
    } catch (error) {
      console.error('Error unliking job:', error);
      toast.error('Không thể bỏ thích công việc');
    }
  }, [currentPage, fetchLikedJobs]);

  const handleViewJob = useCallback((jobId: number) => {
    const encodedJobId = btoa(jobId.toString());
    navigate(`/viec-lam/${encodedJobId}`);
  }, [navigate]);

  // Filter jobs based on search, location, and salary
  const filteredJobs = React.useMemo(() => {
    return jobs.filter(job => {
      const matchesSearch = searchTerm === '' ||
        job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.location?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesLocation = locationFilter === 'all' || 
        job.location?.toLowerCase().includes(locationFilter.toLowerCase());
      
      const matchesSalary = salaryFilter === 'all' || (() => {
        if (!job.salary) return false;
        const salaryLower = job.salary.toLowerCase();
        switch(salaryFilter) {
          case 'under10': return salaryLower.includes('triệu') && !salaryLower.includes('10');
          case '10-20': return salaryLower.includes('10') || salaryLower.includes('15') || salaryLower.includes('20');
          case '20-30': return salaryLower.includes('20') || salaryLower.includes('25') || salaryLower.includes('30');
          case 'over30': return salaryLower.includes('30') || salaryLower.includes('40') || salaryLower.includes('50');
          case 'negotiable': return salaryLower.includes('thỏa thuận') || salaryLower.includes('cạnh tranh');
          default: return true;
        }
      })();
      
      return matchesSearch && matchesLocation && matchesSalary;
    });
  }, [jobs, searchTerm, locationFilter, salaryFilter]);

  // Get unique locations for filter
  const uniqueLocations = React.useMemo(() => {
    const locations = jobs
      .map(j => j.location)
      .filter((loc): loc is string => !!loc)
      .map(loc => loc.split(',')[0].trim());
    return Array.from(new Set(locations)).sort();
  }, [jobs]);


  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-12">
        <LuLoader className="w-12 h-12 text-blue-600 animate-spin" />
        <p className="mt-4 text-gray-600">Đang tải...</p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <LuHeart className="w-8 h-8 text-red-500" />
              Công việc đã thích
            </h1>
            <p className="mt-2 text-gray-600">
              Quản lý danh sách các công việc bạn đã lưu để xem sau
            </p>
          </div>
          
          <button
            onClick={() => fetchLikedJobs(currentPage)}
              disabled={loading}
              className={`p-2 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 cursor-pointer'}`}
              title="Làm mới"
            >
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Filters */}
      {jobs.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <LuFilter className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Bộ lọc</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <LuSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm kiếm theo tên công việc, công ty..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Location Filter */}
            <div>
              <SelectWithSearch
                options={[
                  { value: 'all', label: 'Tất cả địa điểm' },
                  ...uniqueLocations.map(location => ({
                    value: location,
                    label: location
                  }))
                ]}
                selectedValues={[locationFilter]}
                onChange={(values) => setLocationFilter(values[0] || 'all')}
                placeholder="Chọn địa điểm"
                multiple={false}
                clearable={false}
              />
            </div>

            {/* Salary Filter */}
            <div>
              <SelectWithSearch
                options={[
                  { value: 'all', label: 'Tất cả mức lương' },
                  { value: 'under10', label: 'Dưới 10 triệu' },
                  { value: '10-20', label: '10-20 triệu' },
                  { value: '20-30', label: '20-30 triệu' },
                  { value: 'over30', label: 'Trên 30 triệu' },
                  { value: 'negotiable', label: 'Thỏa thuận' }
                ]}
                selectedValues={[salaryFilter]}
                onChange={(values) => setSalaryFilter(values[0] || 'all')}
                placeholder="Chọn mức lương"
                multiple={false}
                clearable={false}
              />
            </div>
          </div>

          {/* Filter Summary */}
          {(searchTerm || locationFilter !== 'all' || salaryFilter !== 'all') && (
            <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
              <span>Hiển thị {filteredJobs.length} / {jobs.length} công việc</span>
              {(searchTerm || locationFilter !== 'all' || salaryFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setLocationFilter('all');
                    setSalaryFilter('all');
                  }}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Xóa bộ lọc
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {filteredJobs.length === 0 && jobs.length > 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <LuHeartOff className="mx-auto h-16 w-16 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            Không tìm thấy công việc phù hợp
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            Thử thay đổi bộ lọc để tìm kiếm công việc khác
          </p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <LuHeartOff className="mx-auto h-16 w-16 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            Chưa có công việc nào được thích
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            Hãy khám phá và lưu các công việc yêu thích của bạn
          </p>
          <button
            onClick={() => navigate('/viec-lam')}
            className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
          >
            Khám phá công việc
          </button>
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onUnlike={handleUnlike}
                onViewJob={handleViewJob}
                formatDate={formatDate}
              />
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="mt-8 flex justify-center items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Trước
              </button>
              <span className="text-sm text-gray-700">
                Trang {currentPage} / {pagination.totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
                disabled={currentPage === pagination.totalPages}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Sau
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
};

export default LikedJobs;
