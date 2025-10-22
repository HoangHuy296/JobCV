import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '../../../contexts/UserContext';
import {
  getCampaign,
  getCampaignJobs,
  getCampaignStats,
  addJobToCampaign,
  removeJobFromCampaign,
  type Campaign,
  type CampaignStats
} from '../../../api/campaignService';
import { getAllJobs, type Job } from '../../../api/jobService';
import { toast } from 'react-toastify';

const CampaignDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { company } = useUser();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [campaignJobs, setCampaignJobs] = useState<Job[]>([]);
  const [stats, setStats] = useState<CampaignStats | null>(null);
  const [availableJobs, setAvailableJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddJobModal, setShowAddJobModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<number | null>(null);

  // Fetch campaign data
  const fetchCampaignData = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      const [campaignData, jobs, statsData] = await Promise.all([
        getCampaign(parseInt(id)),
        getCampaignJobs(parseInt(id)),
        getCampaignStats(parseInt(id))
      ]);

      setCampaign(campaignData);
      setCampaignJobs(jobs);
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching campaign data:', error);
      toast.error('Lỗi khi tải thông tin chiến dịch');
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Fetch available jobs
  const fetchAvailableJobs = useCallback(async () => {
    if (!company?.id) return;

    try {
      const response = await getAllJobs(1, 100, '', company.id.toString());
      const jobsInCampaign = new Set(campaignJobs.map(j => j.id));
      const available = response.jobs.filter((job: Job) => !jobsInCampaign.has(job.id));
      setAvailableJobs(available);
    } catch (error) {
      console.error('Error fetching available jobs:', error);
    }
  }, [company?.id, campaignJobs]);

  useEffect(() => {
    fetchCampaignData();
  }, [fetchCampaignData]);

  useEffect(() => {
    if (showAddJobModal) {
      fetchAvailableJobs();
    }
  }, [showAddJobModal, fetchAvailableJobs]);

  // Handle add job
  const handleAddJob = async () => {
    if (!id || !selectedJob) return;

    try {
      await addJobToCampaign(parseInt(id), selectedJob);
      toast.success('Đã thêm tin tuyển dụng vào chiến dịch');
      setShowAddJobModal(false);
      setSelectedJob(null);
      fetchCampaignData();
    } catch (error) {
      console.error('Error adding job to campaign:', error);
      toast.error('Lỗi khi thêm tin tuyển dụng');
    }
  };

  // Handle remove job
  const handleRemoveJob = async (jobId: number) => {
    if (!id) return;

    if (!window.confirm('Bạn có chắc chắn muốn xóa tin tuyển dụng này khỏi chiến dịch?')) {
      return;
    }

    try {
      await removeJobFromCampaign(parseInt(id), jobId);
      toast.success('Đã xóa tin tuyển dụng khỏi chiến dịch');
      fetchCampaignData();
    } catch (error) {
      console.error('Error removing job from campaign:', error);
      toast.error('Lỗi khi xóa tin tuyển dụng');
    }
  };

  // Status badge
  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
      draft: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Bản nháp' },
      pending_review: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Chờ duyệt' },
      approved: { bg: 'bg-green-100', text: 'text-green-800', label: 'Đã duyệt' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'Từ chối' }
    };

    const config = statusConfig[status] || statusConfig.draft;
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="bg-white rounded-lg shadow px-4 py-5 sm:p-6">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Không tìm thấy chiến dịch</h2>
          <button 
            onClick={() => navigate('/nha-tuyen-dung/quan-ly-chien-dich')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer"
          >
            Quay lại danh sách chiến dịch
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Campaign Header */}
      <div className="bg-white rounded-lg shadow px-6 py-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{campaign.name}</h1>
            <p className="text-gray-600 mt-1">{campaign.description}</p>
          </div>
          <button
            onClick={() => navigate('/nha-tuyen-dung/quan-ly-chien-dich')}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 cursor-pointer"
          >
            ← Quay lại
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-sm text-blue-600 font-medium">Tổng số tin</div>
            <div className="text-2xl font-bold text-blue-900 mt-1">{stats?.total_jobs || 0}</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-sm text-green-600 font-medium">Đã duyệt</div>
            <div className="text-2xl font-bold text-green-900 mt-1">{stats?.approved_jobs || 0}</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="text-sm text-yellow-600 font-medium">Chờ duyệt</div>
            <div className="text-2xl font-bold text-yellow-900 mt-1">{stats?.pending_jobs || 0}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 font-medium">Bản nháp</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">{stats?.draft_jobs || 0}</div>
          </div>
        </div>
      </div>

      {/* Jobs List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Danh sách tin tuyển dụng</h2>
          <button
            onClick={() => setShowAddJobModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Thêm tin tuyển dụng
          </button>
        </div>

        <div className="overflow-x-auto">
          {campaignJobs.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Chưa có tin tuyển dụng</h3>
              <p className="mt-1 text-sm text-gray-500">Bắt đầu bằng cách thêm tin tuyển dụng vào chiến dịch.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tiêu đề</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngành nghề</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vị trí</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {campaignJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{job.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{job.industry_name || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{job.location || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(job.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleRemoveJob(job.id)}
                        className="text-red-600 hover:text-red-800 cursor-pointer"
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Job Modal */}
      {showAddJobModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black opacity-50" onClick={() => setShowAddJobModal(false)}></div>
            
            <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Thêm tin tuyển dụng vào chiến dịch</h3>
              
              <div className="max-h-96 overflow-y-auto">
                {availableJobs.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Không có tin tuyển dụng nào khả dụng</p>
                ) : (
                  <div className="space-y-2">
                    {availableJobs.map((job) => (
                      <div
                        key={job.id}
                        onClick={() => setSelectedJob(job.id)}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedJob === job.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900">{job.title}</div>
                            <div className="text-sm text-gray-500 mt-1">
                              {job.industry_name} • {job.location}
                            </div>
                          </div>
                          {getStatusBadge(job.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowAddJobModal(false);
                    setSelectedJob(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  onClick={handleAddJob}
                  disabled={!selectedJob}
                  className={`px-4 py-2 text-white rounded-md cursor-pointer ${
                    selectedJob
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-gray-300 cursor-not-allowed'
                  }`}
                >
                  Thêm vào chiến dịch
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignDetail;
