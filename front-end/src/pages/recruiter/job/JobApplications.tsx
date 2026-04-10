import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { LuArrowLeft, LuEye, LuDownload, LuCheck, LuX, LuClock, LuUser, LuMail, LuPhone, LuCalendar, LuSparkles } from 'react-icons/lu';
import { getJobById, type Job } from '../../../api/jobService';
import { getJobApplications, updateApplicationStatus, type JobApplication } from '../../../api/jobApplicationService';
import { extractCVInfo, type ExtractedCVInfo } from '../../../api/cvService';
import { formatDate } from '../../../utils/dateUtils';
import CVPreviewModal from '../../../components/cv/CVPreviewModal';
import aiGenerationService from '../../../services/aiGenerationService';

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
  const [extractingCvId, setExtractingCvId] = useState<number | null>(null);
  const [extractedInfo, setExtractedInfo] = useState<Record<number, ExtractedCVInfo>>({});
  
  // CV Summary state
  const [generatingSummaryId, setGeneratingSummaryId] = useState<number | null>(null);
  const [cvSummaries, setCvSummaries] = useState<Record<number, string>>({});
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [selectedSummary, setSelectedSummary] = useState<string | null>(null);
  
  // Application Ranking state
  const [isRanking, setIsRanking] = useState(false);
  const [showRankingModal, setShowRankingModal] = useState(false);
  const [rankingResult, setRankingResult] = useState<any>(null);

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

  const handleViewCV = useCallback((cvId: number | null, cvDeleted?: boolean) => {
    if (!cvId) {
      toast.warning('Không có CV để xem');
      return;
    }
    // Allow viewing even if CV is deleted (soft delete)
    setPreviewCvId(cvId);
    setShowCVPreviewModal(true);
  }, []);

  const handleGenerateSummary = useCallback(async (cvId: number | null) => {
    if (!cvId) {
      toast.warning('Không có CV để tạo tóm tắt');
      return;
    }
    
    try {
      setGeneratingSummaryId(cvId);
      const summary = await aiGenerationService.generateCVSummary(cvId);
      setCvSummaries(prev => ({ ...prev, [cvId]: summary }));
      setSelectedSummary(summary);
      setShowSummaryModal(true);
      toast.success('Tạo tóm tắt CV thành công!');
    } catch (error: any) {
      toast.error(error.message || 'Không thể tạo tóm tắt CV');
    } finally {
      setGeneratingSummaryId(null);
    }
  }, []);

  const handleRankApplications = useCallback(async () => {
    if (!jobId || applications.length === 0) {
      toast.warning('Không có ứng viên để xếp hạng');
      return;
    }
    
    try {
      setIsRanking(true);
      const result = await aiGenerationService.rankApplications(Number(jobId));
      setRankingResult(result);
      setShowRankingModal(true);
      toast.success('Xếp hạng ứng viên thành công!');
    } catch (error: any) {
      toast.error(error.message || 'Không thể xếp hạng ứng viên');
    } finally {
      setIsRanking(false);
    }
  }, [jobId, applications.length]);

  const handleExtractCVInfo = useCallback(async (cvId: number | null, cvDeleted?: boolean) => {
    if (!cvId) {
      toast.warning('Không có CV để trích xuất');
      return;
    }

    try {
      setExtractingCvId(cvId);
      const info = await extractCVInfo(cvId);
      setExtractedInfo(prev => ({ ...prev, [cvId]: info }));
      toast.success('Đã trích xuất thông tin CV thành công');
    } catch (error) {
      console.error('Error extracting CV info:', error);
    } finally {
      setExtractingCvId(null);
    }
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

        {/* Ranking Button */}
      {applications.length > 0 && (
        <div className="mb-6">
          <button
            onClick={handleRankApplications}
            disabled={isRanking}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg hover:from-orange-700 hover:to-red-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isRanking ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Đang xếp hạng...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Xếp hạng ứng viên bằng AI
              </>
            )}
          </button>
        </div>
      )}

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
                      {application.cv_deleted && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border bg-orange-50 text-orange-700 border-orange-200">
                          <LuX className="w-3 h-3" />
                          CV đã bị xóa bởi ứng viên
                        </span>
                      )}
                    </div>

                    {application.cover_letter && (
                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">Thư xin việc:</p>
                        <p className="text-sm text-gray-600">{application.cover_letter}</p>
                      </div>
                    )}

                    {extractedInfo[application.cv_id!] && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                        <div className="flex items-center gap-2 mb-3">
                          <LuSparkles className="w-4 h-4 text-blue-600" />
                          <p className="text-sm font-semibold text-blue-900">Thông tin trích xuất từ CV (AI)</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          {extractedInfo[application.cv_id!].phone && (
                            <div>
                              <span className="font-medium text-gray-700">SĐT:</span>
                              <span className="ml-2 text-gray-600">{extractedInfo[application.cv_id!].phone}</span>
                            </div>
                          )}
                          {extractedInfo[application.cv_id!].address && (
                            <div>
                              <span className="font-medium text-gray-700">Địa chỉ:</span>
                              <span className="ml-2 text-gray-600">{extractedInfo[application.cv_id!].address}</span>
                            </div>
                          )}
                          {extractedInfo[application.cv_id!].dateOfBirth && (
                            <div>
                              <span className="font-medium text-gray-700">Ngày sinh:</span>
                              <span className="ml-2 text-gray-600">{extractedInfo[application.cv_id!].dateOfBirth}</span>
                            </div>
                          )}
                          {extractedInfo[application.cv_id!].education && extractedInfo[application.cv_id!].education!.length > 0 && (
                            <div className="col-span-2">
                              <span className="font-medium text-gray-700">Học vấn:</span>
                              <div className="ml-2 mt-1 space-y-1">
                                {extractedInfo[application.cv_id!].education!.map((edu, idx) => (
                                  <div key={idx} className="text-gray-600">
                                    {edu.degree} - {edu.school} {edu.major && `(${edu.major})`}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {extractedInfo[application.cv_id!].skills && extractedInfo[application.cv_id!].skills!.length > 0 && (
                            <div className="col-span-2">
                              <span className="font-medium text-gray-700">Kỹ năng:</span>
                              <div className="ml-2 mt-1 flex flex-wrap gap-1">
                                {extractedInfo[application.cv_id!].skills!.map((skill, idx) => (
                                  <span key={idx} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 ml-6">
                    <button
                      onClick={() => handleViewCV(application.cv_id, application.cv_deleted)}
                      disabled={!application.cv_id}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                      title={application.cv_deleted ? 'CV đã bị xóa nhưng vẫn có thể xem' : 'Xem CV'}
                    >
                      <LuEye className="w-4 h-4" />
                      {application.cv_deleted ? 'Xem CV (đã xóa)' : 'Xem CV'}
                    </button>

                    <button
                      onClick={() => handleExtractCVInfo(application.cv_id, application.cv_deleted)}
                      disabled={extractingCvId === application.cv_id || !application.cv_id}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                      title={application.cv_deleted ? 'Trích xuất từ CV đã xóa' : 'Trích xuất thông tin bằng AI'}
                    >
                      {extractingCvId === application.cv_id ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Đang xử lý...
                        </>
                      ) : (
                        <>
                          <LuSparkles className="w-4 h-4" />
                          {extractedInfo[application.cv_id!] ? 'Trích xuất lại' : 'Trích xuất AI'}
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleGenerateSummary(application.cv_id)}
                      disabled={generatingSummaryId === application.cv_id || !application.cv_id}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all text-sm font-medium whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                      title="Tạo tóm tắt CV bằng AI"
                    >
                      {generatingSummaryId === application.cv_id ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Đang tạo...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          {cvSummaries[application.cv_id!] ? 'Xem tóm tắt' : 'Tóm tắt AI'}
                        </>
                      )}
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

      {/* Application Ranking Modal */}
      {showRankingModal && rankingResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Xếp hạng ứng viên bằng AI</h3>
                  <p className="text-sm text-gray-500">{job?.title}</p>
                </div>
              </div>
              <button
                onClick={() => setShowRankingModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <LuX className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg">
                  <h4 className="font-semibold text-orange-900 mb-2">🏆 Kết quả xếp hạng</h4>
                  <pre className="whitespace-pre-wrap text-sm text-orange-800 font-mono leading-relaxed">
                    {JSON.stringify(rankingResult, null, 2)}
                  </pre>
                </div>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    💡 <strong>Gợi ý:</strong> AI đã phân tích và xếp hạng ứng viên dựa trên độ phù hợp với yêu cầu công việc. Sử dụng kết quả này để ưu tiên xem xét các ứng viên tiềm năng nhất.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowRankingModal(false)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CV Summary Modal */}
      {showSummaryModal && selectedSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Tóm tắt CV bằng AI</h3>
              </div>
              <button
                onClick={() => setShowSummaryModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <LuX className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg p-6 border border-purple-200">
                <pre className="whitespace-pre-wrap text-gray-800 font-sans text-sm leading-relaxed">
                  {selectedSummary}
                </pre>
              </div>
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  💡 <strong>Gợi ý:</strong> Tóm tắt này được tạo bởi AI dựa trên nội dung CV. Sử dụng để nhanh chóng đánh giá ứng viên.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowSummaryModal(false)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

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
