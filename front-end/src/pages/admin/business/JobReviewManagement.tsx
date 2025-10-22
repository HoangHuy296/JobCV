import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import {
  getJobsByStatus,
  reviewJob,
  getReviewStatistics,
  getJobReviewHistory
} from '../../../api/jobReviewService';
import {
  LuFileCheck,
  LuCheck,
  LuX,
  LuClock,
  LuTriangleAlert,
  LuLoader,
  LuChevronLeft,
  LuChevronRight,
  LuCalendar,
  LuBuilding,
  LuMapPin,
  LuDollarSign,
  LuBriefcase,
  LuHistory,
  LuRefreshCw,
  LuFilter
} from 'react-icons/lu';

interface Job {
  id: number;
  title: string;
  brief_description: string;
  requirement: string;
  benefits: string;
  salary: string;
  date_end_register: string;
  years_experienced: string;
  work_hours: string;
  location: string;
  status: string;
  created_at: string;
  company_name?: string;
  industry_name?: string;
  created_by: number;
  creator_name?: string;
}

interface ReviewHistory {
  id: number;
  status: string;
  feedback: string;
  reviewer_name: string;
  created_at: string;
}

interface Statistics {
  draft_count: number;
  pending_count: number;
  approved_count: number;
  rejected_count: number;
}

const JobReviewManagement: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [reviewHistory, setReviewHistory] = useState<ReviewHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approved' | 'rejected' | null>(null);
  const [feedback, setFeedback] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending_review' | 'approved' | 'rejected'>('pending_review');
  const [refreshing, setRefreshing] = useState(false);
  const limit = 10;

  // Fetch jobs by status
  const fetchJobs = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const data = await getJobsByStatus(currentPage, limit, statusFilter);
      setJobs(data.jobs);
      setTotalPages(data.pagination.totalPages);
      setTotal(data.pagination.total);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast.error('Lỗi khi tải danh sách công việc');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [currentPage, statusFilter]);

  // Fetch statistics
  const fetchStatistics = useCallback(async () => {
    try {
      const stats = await getReviewStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  }, []);

  // Fetch review history
  const fetchReviewHistory = useCallback(async (jobId: number) => {
    try {
      const history = await getJobReviewHistory(jobId);
      setReviewHistory(history);
    } catch (error) {
      console.error('Error fetching review history:', error);
      toast.error('Lỗi khi tải lịch sử duyệt');
    }
  }, []);

  useEffect(() => {
    fetchJobs();
    fetchStatistics();
  }, [fetchJobs, fetchStatistics]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchJobs(false), fetchStatistics()]);
    setRefreshing(false);
    toast.success('Đã làm mới dữ liệu');
  }, [fetchJobs, fetchStatistics]);

  // Handle status filter change
  const handleStatusFilterChange = useCallback((newStatus: typeof statusFilter) => {
    setStatusFilter(newStatus);
    setCurrentPage(1);
  }, []);

  // Handle review action
  const handleReview = async () => {
    if (!selectedJob || !reviewAction) return;

    if (reviewAction === 'rejected' && !feedback.trim()) {
      toast.error('Vui lòng nhập lý do từ chối');
      return;
    }

    try {
      setReviewing(true);
      const feedbackToSend = reviewAction === 'rejected' ? feedback.trim() : (feedback.trim() || undefined);
      await reviewJob(selectedJob.id, reviewAction, feedbackToSend);
      
      toast.success(
        reviewAction === 'approved' 
          ? 'Đã phê duyệt công việc thành công' 
          : 'Đã từ chối công việc'
      );
      
      setShowReviewModal(false);
      setSelectedJob(null);
      setReviewAction(null);
      setFeedback('');
      fetchJobs();
      fetchStatistics();
    } catch (error: any) {
      console.error('Error reviewing job:', error);
      const errorMessage = error?.response?.data?.message || 'Lỗi khi duyệt công việc';
      toast.error(errorMessage);
    } finally {
      setReviewing(false);
    }
  };

  // Open review modal
  const openReviewModal = (job: Job, action: 'approved' | 'rejected') => {
    setSelectedJob(job);
    setReviewAction(action);
    setFeedback('');
    setShowReviewModal(true);
  };

  // Open history modal
  const openHistoryModal = async (job: Job) => {
    setSelectedJob(job);
    setShowHistoryModal(true);
    await fetchReviewHistory(job.id);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Statistics cards
  const StatCard = ({ icon: Icon, label, value, color }: any) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý duyệt công việc</h1>
          <p className="text-sm text-gray-600 mt-1">
            Duyệt và quản lý các công việc chờ phê duyệt
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-2 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 bg-blue-600 hover:bg-blue-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <LuRefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Statistics */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard
            icon={LuClock}
            label="Chờ duyệt"
            value={statistics.pending_count}
            color="bg-yellow-500"
          />
          <StatCard
            icon={LuCheck}
            label="Đã duyệt"
            value={statistics.approved_count}
            color="bg-green-500"
          />
          <StatCard
            icon={LuX}
            label="Đã từ chối"
            value={statistics.rejected_count}
            color="bg-red-500"
          />
          <StatCard
            icon={LuFileCheck}
            label="Bản nháp"
            value={statistics.draft_count}
            color="bg-gray-500"
          />
        </div>
      )}

      {/* Jobs List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Danh sách công việc ({total})
            </h2>
          </div>
          
          {/* Status Filter Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => handleStatusFilterChange('pending_review')}
              className={`cursor-pointer px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'pending_review'
                  ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-500'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <LuClock className="w-4 h-4" />
                Chờ duyệt
              </div>
            </button>
            <button
              onClick={() => handleStatusFilterChange('approved')}
              className={`cursor-pointer px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'approved'
                  ? 'bg-green-100 text-green-700 border-2 border-green-500'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <LuCheck className="w-4 h-4" />
                Đã duyệt
              </div>
            </button>
            <button
              onClick={() => handleStatusFilterChange('rejected')}
              className={`cursor-pointer px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'rejected'
                  ? 'bg-red-100 text-red-700 border-2 border-red-500'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <LuX className="w-4 h-4" />
                Đã từ chối
              </div>
            </button>
            <button
              onClick={() => handleStatusFilterChange('all')}
              className={`cursor-pointer px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'all'
                  ? 'bg-blue-100 text-blue-700 border-2 border-blue-500'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <LuFilter className="w-4 h-4" />
                Tất cả
              </div>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <LuLoader className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-12">
            <LuFileCheck className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-3 text-sm font-medium text-gray-900">
              {statusFilter === 'pending_review' && 'Không có công việc chờ duyệt'}
              {statusFilter === 'approved' && 'Không có công việc đã duyệt'}
              {statusFilter === 'rejected' && 'Không có công việc bị từ chối'}
              {statusFilter === 'all' && 'Không có công việc'}
            </p>
            <p className="mt-1 text-xs text-gray-500">Không tìm thấy công việc nào</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {jobs.map((job) => (
              <div key={job.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Job Title */}
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {job.title}
                    </h3>

                    {/* Job Info */}
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <LuBuilding className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{job.company_name || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <LuBriefcase className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{job.industry_name || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <LuMapPin className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{job.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <LuDollarSign className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{job.salary}</span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                      {job.brief_description}
                    </p>

                    {/* Meta Info */}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <LuCalendar className="w-3 h-3" />
                        <span>Đăng: {formatDate(job.created_at)}</span>
                      </div>
                      {job.creator_name && (
                        <div className="flex items-center gap-1">
                          <span>Người tạo: {job.creator_name}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    {job.status === 'pending_review' && (
                      <>
                        <button
                          onClick={() => openReviewModal(job, 'approved')}
                          className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                        >
                          <LuCheck className="w-4 h-4" />
                          Phê duyệt
                        </button>
                        <button
                          onClick={() => openReviewModal(job, 'rejected')}
                          className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                        >
                          <LuX className="w-4 h-4" />
                          Từ chối
                        </button>
                      </>
                    )}
                    {job.status === 'approved' && (
                      <span className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
                        <LuCheck className="w-4 h-4" />
                        Đã duyệt
                      </span>
                    )}
                    {job.status === 'rejected' && (
                      <span className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium">
                        <LuX className="w-4 h-4" />
                        Đã từ chối
                      </span>
                    )}
                    <button
                      onClick={() => openHistoryModal(job)}
                      className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                    >
                      <LuHistory className="w-4 h-4" />
                      Lịch sử
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Trang {currentPage} / {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <LuChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <LuChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {showReviewModal && selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {reviewAction === 'approved' ? 'Phê duyệt công việc' : 'Từ chối công việc'}
              </h3>
            </div>

            <div className="px-6 py-4 space-y-4">
              {/* Job Details */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">{selectedJob.title}</h4>
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                  <div>Công ty: {selectedJob.company_name || 'N/A'}</div>
                  <div>Ngành: {selectedJob.industry_name || 'N/A'}</div>
                  <div>Địa điểm: {selectedJob.location}</div>
                  <div>Lương: {selectedJob.salary}</div>
                </div>
              </div>

              {/* Feedback */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {reviewAction === 'approved' ? 'Ghi chú (tùy chọn)' : 'Lý do từ chối *'}
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={
                    reviewAction === 'approved'
                      ? 'Nhập ghi chú nếu cần...'
                      : 'Nhập lý do từ chối công việc này...'
                  }
                />
                {reviewAction === 'rejected' && (
                  <p className="mt-1 text-xs text-gray-500">
                    Lý do từ chối sẽ được gửi đến người tạo công việc
                  </p>
                )}
              </div>

              {/* Warning */}
              {reviewAction === 'rejected' && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <LuTriangleAlert className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-red-800">
                    <p className="font-medium">Lưu ý khi từ chối:</p>
                    <p className="mt-1">
                      Công việc sẽ được chuyển về trạng thái "rejected" và người tạo sẽ nhận được thông báo kèm lý do từ chối.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowReviewModal(false);
                  setSelectedJob(null);
                  setReviewAction(null);
                  setFeedback('');
                }}
                disabled={reviewing}
                className="cursor-pointer px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleReview}
                disabled={reviewing || (reviewAction === 'rejected' && !feedback.trim())}
                className={`cursor-pointer px-4 py-2 rounded-lg text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${
                  reviewAction === 'approved'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {reviewing ? (
                  <>
                    <LuLoader className="w-4 h-4 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    {reviewAction === 'approved' ? (
                      <>
                        <LuCheck className="w-4 h-4" />
                        Xác nhận phê duyệt
                      </>
                    ) : (
                      <>
                        <LuX className="w-4 h-4" />
                        Xác nhận từ chối
                      </>
                    )}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Lịch sử duyệt</h3>
              <p className="text-sm text-gray-600 mt-1">{selectedJob.title}</p>
            </div>

            <div className="px-6 py-4">
              {reviewHistory.length === 0 ? (
                <div className="text-center py-8">
                  <LuHistory className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-3 text-sm text-gray-600">Chưa có lịch sử duyệt</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviewHistory.map((history) => (
                    <div key={history.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {history.status === 'approved' ? (
                            <LuCheck className="w-5 h-5 text-green-600" />
                          ) : (
                            <LuX className="w-5 h-5 text-red-600" />
                          )}
                          <span className="font-medium text-gray-900">
                            {history.status === 'approved' ? 'Phê duyệt' : 'Từ chối'}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatDate(history.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        Người duyệt: <span className="font-medium">{history.reviewer_name}</span>
                      </p>
                      {history.feedback && (
                        <div className="mt-2 p-3 bg-gray-50 rounded text-sm text-gray-700">
                          {history.feedback}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => {
                  setShowHistoryModal(false);
                  setSelectedJob(null);
                  setReviewHistory([]);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobReviewManagement;
