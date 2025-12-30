import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { LuSearch, LuBriefcase, LuUsers, LuCalendar, LuMapPin, LuBuilding2, LuClock, LuRefreshCw } from 'react-icons/lu';
import { getRecruiterJobs, type Job } from '../../api/jobService';
import { formatDate } from '../../utils/dateUtils';

const CVApplicationsManagement: React.FC = () => {
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getRecruiterJobs();
      setJobs(response.jobs || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast.error('Không thể tải danh sách tin tuyển dụng');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    
    const loadJobs = async () => {
      if (isMounted) {
        await fetchJobs();
      }
    };
    
    loadJobs();
    
    return () => {
      isMounted = false;
    };
  }, [fetchJobs]);

  // Memoize filtered jobs to avoid unnecessary recalculations
  const filteredJobs = useMemo(() => {
    if (searchTerm.trim() === '') {
      return jobs;
    }
    return jobs.filter(job =>
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.location?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, jobs]);

  const handleJobClick = (jobId: number) => {
    navigate(`/nha-tuyen-dung/quan-ly-tin-tuyen-dung/${jobId}/ung-vien`, {
      state: { from: '/nha-tuyen-dung/quan-ly-cv-ung-tuyen' }
    });
  };

  const getStatusBadge = (job: Job) => {
    if (job.is_closed) {
      return <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">Đã đóng</span>;
    }
    
    const now = new Date();
    const endDate = job.date_end_register ? new Date(job.date_end_register) : null;
    
    if (endDate && endDate < now) {
      return <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">Hết hạn</span>;
    }
    
    return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">Đang tuyển</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm rounded-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản lý CV ứng tuyển</h1>
              <p className="text-gray-600">Xem và quản lý hồ sơ ứng viên theo từng tin tuyển dụng</p>
            </div>
            <button
              onClick={fetchJobs}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <LuRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Tải lại
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <LuSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm theo tên công việc, công ty, địa điểm..."
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
            />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-blue-600 mb-1">
                <LuBriefcase className="w-5 h-5" />
                <span className="text-sm font-medium">Tổng tin tuyển dụng</span>
              </div>
              <div className="text-2xl font-bold text-blue-900">{jobs.length}</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-600 mb-1">
                <LuClock className="w-5 h-5" />
                <span className="text-sm font-medium">Đang tuyển</span>
              </div>
              <div className="text-2xl font-bold text-green-900">
                {jobs.filter(j => !j.is_closed && (!j.date_end_register || new Date(j.date_end_register) >= new Date())).length}
              </div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-purple-600 mb-1">
                <LuUsers className="w-5 h-5" />
                <span className="text-sm font-medium">Tổng ứng viên</span>
              </div>
              <div className="text-2xl font-bold text-purple-900">
                {jobs.reduce((sum, job) => sum + (job.application_count || 0), 0)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Jobs List */}
      <div className="max-w-7xl mx-auto py-6">
        {filteredJobs.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <LuBriefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">
              {searchTerm ? 'Không tìm thấy tin tuyển dụng phù hợp' : 'Chưa có tin tuyển dụng nào'}
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Xóa bộ lọc
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredJobs.map((job) => (
              <div
                key={job.id}
                onClick={() => handleJobClick(job.id)}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-blue-200 transition-colors">
                        <LuBriefcase className="w-8 h-8 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                              {job.title}
                            </h3>
                            {job.company_name && (
                              <div className="flex items-center gap-2 text-gray-600 mt-1">
                                <LuBuilding2 className="w-4 h-4" />
                                <span className="text-sm">{job.company_name}</span>
                              </div>
                            )}
                          </div>
                          {getStatusBadge(job)}
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                          {job.location && (
                            <span className="flex items-center gap-1">
                              <LuMapPin className="w-4 h-4" />
                              {job.location}
                            </span>
                          )}
                          {job.date_end_register && (
                            <span className="flex items-center gap-1">
                              <LuCalendar className="w-4 h-4" />
                              Hạn nộp: {formatDate(job.date_end_register)}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg">
                            <LuUsers className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-900">
                              {job.application_count || 0} ứng viên
                            </span>
                          </div>
                          {job.max_applicants && (
                            <div className="text-sm text-gray-600">
                              Giới hạn: {job.max_applicants} ứng viên
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CVApplicationsManagement;
