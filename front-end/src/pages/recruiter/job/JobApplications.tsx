import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { LuArrowLeft, LuEye, LuDownload, LuCheck, LuX, LuClock, LuUser, LuMail, LuPhone, LuCalendar } from 'react-icons/lu';
import { getJobById, type Job } from '../../../api/jobService';
import { getJobApplications, updateApplicationStatus, type JobApplication } from '../../../api/jobApplicationService';
import { formatDate } from '../../../utils/dateUtils';
import CVPreviewModal from '../../../components/cv/CVPreviewModal';

const JobApplications: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState<Job | null>(null);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCVPreviewModal, setShowCVPreviewModal] = useState(false);
  const [previewCvId, setPreviewCvId] = useState<number | null>(null);

  const fetchJobAndApplications = useCallback(async () => {
    if (!jobId) return;
    
    try {
      setLoading(true);
      
      // Fetch job details and applications in parallel
      const [jobResponse, applicationsResponse] = await Promise.all([
        getJobById(Number(jobId)),
        getJobApplications(Number(jobId))
      ]);
      
      setJob(jobResponse);
      setApplications(applicationsResponse.applications || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Không thể tải thông tin ứng tuyển');
      setJob(null);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      if (isMounted && jobId) {
        await fetchJobAndApplications();
      }
    };
    
    loadData();
    
    return () => {
      isMounted = false;
    };
  }, [fetchJobAndApplications, jobId]);

  const handleAccept = useCallback(async (applicationId: number) => {
    try {
      await updateApplicationStatus(applicationId, 'accepted');
      toast.success('Đã chấp nhận ứng viên. HR sẽ liên hệ lại sau.');
      await fetchJobAndApplications();
    } catch (error) {
      console.error('Error accepting application:', error);
      toast.error('Không thể chấp nhận ứng viên');
    }
  }, [fetchJobAndApplications]);

  const handleReject = useCallback(async (applicationId: number) => {
    try {
      await updateApplicationStatus(applicationId, 'rejected');
      toast.success('Đã từ chối ứng viên');
      await fetchJobAndApplications();
    } catch (error) {
      console.error('Error rejecting application:', error);
      toast.error('Không thể từ chối ứng viên');
    }
  }, [fetchJobAndApplications]);

  const handleViewCV = useCallback((cvId: number | null) => {
    if (!cvId) {
      toast.warning('Ứng viên chưa đính kèm CV');
      return;
    }
    setPreviewCvId(cvId);
    setShowCVPreviewModal(true);
  }, []);

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
      pending: {
        label: 'Chờ xử lý',
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: <LuClock className="w-3 h-3" />
      },
      reviewing: {
        label: 'Đang xem xét',
        className: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: <LuEye className="w-3 h-3" />
      },
      accepted: {
        label: 'Chấp nhận',
        className: 'bg-green-100 text-green-800 border-green-200',
        icon: <LuCheck className="w-3 h-3" />
      },
      rejected: {
        label: 'Từ chối',
        className: 'bg-red-100 text-red-800 border-red-200',
        icon: <LuX className="w-3 h-3" />
      }
    };

    const config = statusConfig[status] || statusConfig.pending;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${config.className}`}>
        {config.icon}
        {config.label}
      </span>
    );
  };

  const filteredApplications = useMemo(() => {
    return applications.filter(app => {
      const matchesStatus = selectedStatus === 'all' || app.status === selectedStatus;
      const matchesSearch = searchTerm === '' || 
        app.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.user_email?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [applications, selectedStatus, searchTerm]);

  const statusCounts = useMemo(() => ({
    all: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    reviewing: applications.filter(a => a.status === 'reviewing').length,
    accepted: applications.filter(a => a.status === 'accepted').length,
    rejected: applications.filter(a => a.status === 'rejected').length
  }), [applications]);

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

  if (!job) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Không tìm thấy tin tuyển dụng</p>
          <button
            onClick={() => navigate('/nha-tuyen-dung/quan-ly-tin-tuyen-dung')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm rounded-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  const from = (location.state as any)?.from;
                  navigate(from || '/nha-tuyen-dung/quan-ly-tin-tuyen-dung');
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LuArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
                <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                  <span>Quản lý hồ sơ ứng tuyển • {applications.length} ứng viên</span>
                  {job.date_end_register ? (
                    <span className="flex items-center gap-1">
                      <LuCalendar className="w-4 h-4" />
                      Hạn nộp: {formatDate(job.date_end_register)}
                    </span>
                  ) : (
                    <span className="text-green-600 font-medium">
                      Không giới hạn thời gian
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          <button
            onClick={() => setSelectedStatus('all')}
            className={`p-4 rounded-xl border-2 transition-all ${
              selectedStatus === 'all'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="text-2xl font-bold text-gray-900">{statusCounts.all}</div>
            <div className="text-sm text-gray-600 mt-1">Tất cả</div>
          </button>
          <button
            onClick={() => setSelectedStatus('pending')}
            className={`p-4 rounded-xl border-2 transition-all ${
              selectedStatus === 'pending'
                ? 'border-yellow-500 bg-yellow-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="text-2xl font-bold text-yellow-600">{statusCounts.pending}</div>
            <div className="text-sm text-gray-600 mt-1">Chờ xử lý</div>
          </button>
          <button
            onClick={() => setSelectedStatus('reviewing')}
            className={`p-4 rounded-xl border-2 transition-all ${
              selectedStatus === 'reviewing'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="text-2xl font-bold text-blue-600">{statusCounts.reviewing}</div>
            <div className="text-sm text-gray-600 mt-1">Đang xem xét</div>
          </button>
          <button
            onClick={() => setSelectedStatus('accepted')}
            className={`p-4 rounded-xl border-2 transition-all ${
              selectedStatus === 'accepted'
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="text-2xl font-bold text-green-600">{statusCounts.accepted}</div>
            <div className="text-sm text-gray-600 mt-1">Chấp nhận</div>
          </button>
          <button
            onClick={() => setSelectedStatus('rejected')}
            className={`p-4 rounded-xl border-2 transition-all ${
              selectedStatus === 'rejected'
                ? 'border-red-500 bg-red-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="text-2xl font-bold text-red-600">{statusCounts.rejected}</div>
            <div className="text-sm text-gray-600 mt-1">Từ chối</div>
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm theo tên hoặc email..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Applications List */}
        <div className="space-y-4">
          {filteredApplications.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <LuUser className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">Chưa có ứng viên nào</p>
            </div>
          ) : (
            filteredApplications.map((application) => (
              <div
                key={application.id}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <LuUser className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{application.user_name}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                          <span className="flex items-center gap-1">
                            <LuMail className="w-4 h-4" />
                            {application.user_email}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                      <span className="flex items-center gap-1">
                        <LuCalendar className="w-4 h-4" />
                        Ứng tuyển: {formatDate(application.applied_at)}
                      </span>
                      {getStatusBadge(application.status)}
                    </div>

                    {application.cover_letter && (
                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">Thư xin việc:</p>
                        <p className="text-sm text-gray-600">{application.cover_letter}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 ml-6">
                    <button
                      onClick={() => handleViewCV(application.cv_id)}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium whitespace-nowrap"
                    >
                      <LuEye className="w-4 h-4" />
                      Xem CV
                    </button>

                    {(() => {
                      // Check if job is still within time limit
                      const isWithinTimeLimit = !job.date_end_register || new Date(job.date_end_register) >= new Date();
                      
                      // Show buttons if within time limit, regardless of current status
                      if (isWithinTimeLimit) {
                        return (
                          <div className="flex flex-col gap-2">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleAccept(application.id)}
                                disabled={application.status === 'accepted'}
                                className={`flex-1 flex items-center justify-center gap-1 px-4 py-2 rounded-lg transition-colors text-sm font-medium whitespace-nowrap min-w-[120px] ${
                                  application.status === 'accepted'
                                    ? 'bg-green-100 text-green-700 border-2 border-green-600 cursor-not-allowed'
                                    : 'bg-green-600 text-white hover:bg-green-700'
                                }`}
                              >
                                <LuCheck className="w-4 h-4" />
                                {application.status === 'accepted' ? 'Đã chấp nhận' : 'Chấp nhận'}
                              </button>
                              <button
                                onClick={() => handleReject(application.id)}
                                disabled={application.status === 'rejected'}
                                className={`flex-1 flex items-center justify-center gap-1 px-4 py-2 rounded-lg transition-colors text-sm font-medium whitespace-nowrap min-w-[120px] ${
                                  application.status === 'rejected'
                                    ? 'bg-red-100 text-red-700 border-2 border-red-600 cursor-not-allowed'
                                    : 'bg-red-600 text-white hover:bg-red-700'
                                }`}
                              >
                                <LuX className="w-4 h-4" />
                                {application.status === 'rejected' ? 'Đã từ chối' : 'Từ chối'}
                              </button>
                            </div>
                            {(application.status === 'accepted' || application.status === 'rejected') && (
                              <p className="text-xs text-gray-500 text-center">
                                Có thể thay đổi trạng thái trong thời hạn
                              </p>
                            )}
                          </div>
                        );
                      } else {
                        // Show status only if past deadline
                        return (
                          <div className="text-center py-2">
                            <div className="text-sm font-medium text-gray-600 mb-1">
                              {application.status === 'accepted' ? 'Đã chấp nhận' : 'Đã từ chối'}
                            </div>
                            <p className="text-xs text-gray-400">
                              Hết hạn thay đổi
                            </p>
                          </div>
                        );
                      }
                    })()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* CV Preview Modal */}
      {previewCvId && (
        <CVPreviewModal
          isOpen={showCVPreviewModal}
          onClose={() => {
            setShowCVPreviewModal(false);
            setPreviewCvId(null);
          }}
          cvId={previewCvId}
        />
      )}
    </div>
  );
};

export default JobApplications;
