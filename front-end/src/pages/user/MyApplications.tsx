import React, { useState, useEffect, useCallback } from 'react';
import { getMyApplications, withdrawApplication, type JobApplication } from '../../api/jobApplicationService';
import { toast } from 'react-toastify';
import { formatDate } from '../../utils/dateUtils';
import {
  LuBriefcase,
  LuBuilding2,
  LuMapPin,
  LuDollarSign,
  LuCalendar,
  LuClock,
  LuFileText,
  LuTrash2,
  LuLoader,
  LuInfo,
  LuSearch,
  LuFilter,
  LuRefreshCw
} from 'react-icons/lu';
import { usePagination } from '../../hooks/usePagination';
import SelectWithSearch from '../../components/common/SelectWithSearch';
import ConfirmModal from '../../components/common/ConfirmModal';

// Memoized status config to avoid recreation on every render
const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending: { label: 'Chờ xử lý', className: 'bg-yellow-100 text-yellow-800' },
  reviewing: { label: 'Đang xem xét', className: 'bg-blue-100 text-blue-800' },
  shortlisted: { label: 'Đạt vòng sơ tuyển', className: 'bg-purple-100 text-purple-800' },
  rejected: { label: 'Từ chối', className: 'bg-red-100 text-red-800' },
  accepted: { label: 'Chấp nhận', className: 'bg-green-100 text-green-800' }
};

// Memoized component for status badge
const StatusBadge = React.memo(({ status }: { status: string }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
});
StatusBadge.displayName = 'StatusBadge';

const MyApplications: React.FC = () => {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentPage, setCurrentPage, pagination, setPagination } = usePagination(10);
  const [withdrawingId, setWithdrawingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [applicationToWithdraw, setApplicationToWithdraw] = useState<number | null>(null);

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getMyApplications(currentPage, 10);
      setApplications(data.applications);
      setPagination({
        page: data.page,
        limit: data.limit,
        total: data.total,
        totalPages: data.totalPages
      });
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error('Lỗi khi tải danh sách ứng tuyển');
    } finally {
      setLoading(false);
    }
  }, [currentPage, setPagination]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleWithdraw = useCallback((id: number) => {
    setApplicationToWithdraw(id);
    setWithdrawModalOpen(true);
  }, []);

  const confirmWithdraw = useCallback(async () => {
    if (!applicationToWithdraw) return;

    try {
      setWithdrawingId(applicationToWithdraw);
      await withdrawApplication(applicationToWithdraw);
      toast.success('Rút đơn ứng tuyển thành công');
      fetchApplications();
    } catch (error) {
      console.error('Error withdrawing application:', error);
    } finally {
      setWithdrawingId(null);
      setWithdrawModalOpen(false);
      setApplicationToWithdraw(null);
    }
  }, [applicationToWithdraw, fetchApplications]);

  const canWithdraw = useCallback((status: string) => {
    return ['pending', 'reviewing'].includes(status);
  }, []);

  // Filter applications based on search and status
  const filteredApplications = React.useMemo(() => {
    return applications.filter(app => {
      const matchesSearch = searchTerm === '' ||
        app.job_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.job_location?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [applications, searchTerm, statusFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <LuLoader className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Đơn ứng tuyển của tôi</h1>
          <p className="text-gray-600 mt-2">Quản lý và theo dõi các đơn ứng tuyển của bạn</p>
        </div>
        <button
          onClick={() => fetchApplications()}
          className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
          title="Tải lại"
        >
          <LuRefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <LuFilter className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Bộ lọc</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <LuSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm theo tên công việc, công ty, địa điểm..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div>
            <SelectWithSearch
              options={[
                { value: 'all', label: 'Tất cả trạng thái' },
                { value: 'pending', label: 'Chờ xử lý' },
                { value: 'reviewing', label: 'Đang xem xét' },
                { value: 'shortlisted', label: 'Đạt vòng sơ tuyển' },
                { value: 'accepted', label: 'Chấp nhận' },
                { value: 'rejected', label: 'Từ chối' }
              ]}
              selectedValues={[statusFilter]}
              onChange={(values) => setStatusFilter(values[0] || 'all')}
              placeholder="Chọn trạng thái"
              multiple={false}
              clearable={false}
            />
          </div>
        </div>

        {/* Filter Summary */}
        {(searchTerm || statusFilter !== 'all') && (
          <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
            <span>Hiển thị {filteredApplications.length} / {applications.length} đơn ứng tuyển</span>
            {(searchTerm || statusFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                }}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Xóa bộ lọc
              </button>
            )}
          </div>
        )}
      </div>

      {/* Applications List */}
      {filteredApplications.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg shadow">
          <LuBriefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Chưa có đơn ứng tuyển nào
          </h3>
          <p className="text-gray-600 mb-6">
            {applications.length === 0
              ? 'Bắt đầu tìm kiếm và ứng tuyển công việc phù hợp với bạn'
              : 'Không tìm thấy đơn ứng tuyển phù hợp với bộ lọc'}
          </p>
          <a
            href="/viec-lam"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
          >
            <LuBriefcase className="w-5 h-5" />
            Tìm việc làm
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApplications.map((app) => (
            <div
              key={app.id}
              className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  {/* Job Title */}
                  <div className="flex items-start gap-3 mb-3">
                    <LuBriefcase className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 hover:text-blue-600 cursor-pointer">
                        <a href={`/viec-lam/${app.job_id}`}>{app.job_title}</a>
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <LuBuilding2 className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-700">{app.company_name}</span>
                      </div>
                    </div>
                  </div>

                  {/* Job Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                    {app.job_salary && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <LuDollarSign className="w-4 h-4" />
                        <span>{app.job_salary}</span>
                      </div>
                    )}
                    {app.job_location && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <LuMapPin className="w-4 h-4" />
                        <span>{app.job_location}</span>
                      </div>
                    )}
                    {app.date_end_register && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <LuCalendar className="w-4 h-4" />
                        <span>
                          Hạn: {formatDate(app.date_end_register)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Application Info */}
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <LuClock className="w-4 h-4" />
                      <span>
                        Ứng tuyển: {formatDate(app.applied_at)}
                      </span>
                    </div>
                    {app.cv_title && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <LuFileText className="w-4 h-4" />
                        <span>CV: {app.cv_title}</span>
                      </div>
                    )}
                  </div>

                  {/* Cover Letter Preview */}
                  {app.cover_letter && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700 line-clamp-2">
                        {app.cover_letter}
                      </p>
                    </div>
                  )}

                  {/* Notes from Recruiter */}
                  {app.notes && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-start gap-2">
                        <LuInfo className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-blue-900 mb-1">
                            Ghi chú từ nhà tuyển dụng:
                          </p>
                          <p className="text-sm text-blue-800">{app.notes}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Status and Actions */}
                <div className="flex flex-col items-end gap-3">
                  <StatusBadge status={app.status} />
                  
                  {canWithdraw(app.status) && (
                    <button
                      onClick={() => handleWithdraw(app.id)}
                      disabled={withdrawingId === app.id}
                      className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {withdrawingId === app.id ? (
                        <LuLoader className="w-4 h-4 animate-spin" />
                      ) : (
                        <LuTrash2 className="w-4 h-4" />
                      )}
                      <span className="text-sm font-medium">Rút đơn</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            Trước
          </button>
          <span className="px-4 py-2 text-gray-700">
            Trang {currentPage} / {pagination.totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
            disabled={currentPage === pagination.totalPages}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            Sau
          </button>
        </div>
      )}

      {/* Withdraw Confirmation Modal */}
      <ConfirmModal
        isOpen={withdrawModalOpen}
        onClose={() => {
          setWithdrawModalOpen(false);
          setApplicationToWithdraw(null);
        }}
        onConfirm={confirmWithdraw}
        title="Xác nhận rút đơn"
        message="Bạn có chắc muốn rút đơn ứng tuyển này? Hành động này không thể hoàn tác."
        confirmText="Rút đơn"
        cancelText="Hủy"
        type="warning"
        isLoading={withdrawingId === applicationToWithdraw}
      />
    </>
  );
};

export default MyApplications;
