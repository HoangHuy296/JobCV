import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAdminDashboardStats, type DashboardStats } from '../../api/dashboardService';
import { toast } from 'react-toastify';
import {
  LuUsers,
  LuBriefcase,
  LuBuilding2,
  LuFileText,
  LuMegaphone,
  LuBell,
  LuTrendingUp,
  LuClock,
  LuLoader
} from 'react-icons/lu';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await getAdminDashboardStats();
      setStats(data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      toast.error('Lỗi khi tải thống kê');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <LuLoader className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">Đang tải thống kê...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Không thể tải thống kê</p>
        <button
          onClick={fetchStats}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
        >
          Thử lại
        </button>
      </div>
    );
  }

  const StatCard = ({ 
    title, 
    value, 
    change, 
    icon: Icon, 
    color, 
    onClick 
  }: { 
    title: string; 
    value: number; 
    change?: number; 
    icon: any; 
    color: string; 
    onClick?: () => void;
  }) => (
    <div 
      className={`bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow ${
        onClick ? 'cursor-pointer' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value.toLocaleString()}</p>
          {change !== undefined && change > 0 && (
            <div className="flex items-center mt-2 text-sm text-green-600">
              <LuTrendingUp className="w-4 h-4 mr-1" />
              <span>+{change} hôm nay</span>
            </div>
          )}
        </div>
        <div className={`p-4 rounded-full ${color}`}>
          <Icon className="w-8 h-8 text-white" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tổng quan hệ thống</h1>
          <p className="text-gray-600 mt-1">Thống kê và phân tích hoạt động</p>
        </div>
        <button
          onClick={fetchStats}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
        >
          
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Làm mới
        </button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
        <StatCard
          title="Người dùng"
          value={stats.overview.users.total_users}
          change={stats.overview.users.new_users_today}
          icon={LuUsers}
          color="bg-blue-600"
          onClick={() => navigate('/admin/quan-ly-nguoi-dung')}
        />
        <StatCard
          title="Công việc"
          value={stats.overview.jobs.total_jobs}
          change={stats.overview.jobs.new_jobs_today}
          icon={LuBriefcase}
          color="bg-green-600"
          onClick={() => navigate('/admin/quan-ly-cong-viec')}
        />
        <StatCard
          title="Công ty"
          value={stats.overview.companies.total_companies}
          change={stats.overview.companies.new_companies_today}
          icon={LuBuilding2}
          color="bg-purple-600"
          onClick={() => navigate('/admin/quan-ly-cong-ty')}
        />
        <StatCard
          title="CV"
          value={stats.overview.cvs.total_cvs}
          change={stats.overview.cvs.new_cvs_today}
          icon={LuFileText}
          color="bg-orange-600"
          onClick={() => navigate('/admin/quan-ly-cv')}
        />
        <StatCard
          title="Chiến dịch"
          value={stats.overview.campaigns.total_campaigns}
          icon={LuMegaphone}
          color="bg-pink-600"
        />
        <StatCard
          title="Thông báo"
          value={stats.overview.notifications.total_notifications}
          change={stats.overview.notifications.notifications_today}
          icon={LuBell}
          color="bg-indigo-600"
          onClick={() => navigate('/admin/quan-ly-thong-bao')}
        />
      </div>

      {/* Detailed Stats Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Status */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Trạng thái người dùng</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Đang hoạt động</span>
              <span className="font-semibold text-green-600">
                {stats.overview.users.active_users}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Chưa kích hoạt</span>
              <span className="font-semibold text-yellow-600">
                {stats.overview.users.inactive_users}
              </span>
            </div>
            <div className="pt-3 border-t">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Tổng cộng</span>
                <span className="font-bold text-gray-900">
                  {stats.overview.users.total_users}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Job Status */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Trạng thái công việc</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Đang tuyển</span>
              <span className="font-semibold text-green-600">
                {stats.overview.jobs.active_jobs}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Đã đóng</span>
              <span className="font-semibold text-gray-600">
                {stats.overview.jobs.inactive_jobs}
              </span>
            </div>
            <div className="pt-3 border-t">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Tổng cộng</span>
                <span className="font-bold text-gray-900">
                  {stats.overview.jobs.total_jobs}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Company Status */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Trạng thái công ty</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Đang hoạt động</span>
              <span className="font-semibold text-green-600">
                {stats.overview.companies.active_companies}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Tổng công ty</span>
              <span className="font-semibold text-gray-600">
                {stats.overview.companies.total_companies}
              </span>
            </div>
            <div className="pt-3 border-t">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Mới hôm nay</span>
                <span className="font-bold text-blue-600">
                  +{stats.overview.companies.new_companies_today}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tăng trưởng người dùng (7 ngày)</h3>
          <div className="space-y-2">
            {stats.charts.userGrowth.map((item, index) => (
              <div key={index} className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-24">
                  {new Date(item.date).toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' })}
                </span>
                <div className="flex-1 bg-gray-200 rounded-full h-6 relative overflow-hidden">
                  <div 
                    className="bg-blue-600 h-full rounded-full flex items-center justify-end pr-2"
                    style={{ width: `${Math.max((item.count / Math.max(...stats.charts.userGrowth.map(i => i.count))) * 100, 5)}%` }}
                  >
                    <span className="text-xs text-white font-medium">{item.count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Job Growth */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tăng trưởng công việc (7 ngày)</h3>
          <div className="space-y-2">
            {stats.charts.jobGrowth.map((item, index) => (
              <div key={index} className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-24">
                  {new Date(item.date).toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' })}
                </span>
                <div className="flex-1 bg-gray-200 rounded-full h-6 relative overflow-hidden">
                  <div 
                    className="bg-green-600 h-full rounded-full flex items-center justify-end pr-2"
                    style={{ width: `${Math.max((item.count / Math.max(...stats.charts.jobGrowth.map(i => i.count))) * 100, 5)}%` }}
                  >
                    <span className="text-xs text-white font-medium">{item.count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Role Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Phân bố vai trò</h3>
          <div className="space-y-3">
            {stats.charts.roleDistribution.map((item, index) => (
              <div key={index}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-700 capitalize">{item.role}</span>
                  <span className="text-sm font-semibold text-gray-900">{item.count}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full"
                    style={{ 
                      width: `${(item.count / stats.charts.roleDistribution.reduce((sum, r) => sum + r.count, 0)) * 100}%` 
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Industries */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top ngành nghề</h3>
          <div className="space-y-3">
            {stats.charts.topIndustries.map((item, index) => (
              <div key={index}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-700">{item.industry}</span>
                  <span className="text-sm font-semibold text-gray-900">{item.job_count} việc</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-green-600 to-emerald-600 h-2 rounded-full"
                    style={{ 
                      width: `${(item.job_count / Math.max(...stats.charts.topIndustries.map(i => i.job_count))) * 100}%` 
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Hoạt động gần đây</h3>
        <div className="space-y-3">
          {stats.recentActivities.map((activity, index) => (
            <div key={index} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
              <div className={`p-2 rounded-full ${
                activity.type === 'user' ? 'bg-blue-100' :
                activity.type === 'job' ? 'bg-green-100' :
                'bg-purple-100'
              }`}>
                {activity.type === 'user' && <LuUsers className="w-4 h-4 text-blue-600" />}
                {activity.type === 'job' && <LuBriefcase className="w-4 h-4 text-green-600" />}
                {activity.type === 'company' && <LuBuilding2 className="w-4 h-4 text-purple-600" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{activity.title}</p>
                <p className="text-sm text-gray-600 truncate">{activity.description}</p>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <LuClock className="w-3 h-3" />
                <span>
                  {new Date(activity.timestamp).toLocaleDateString('vi-VN', { 
                    month: 'short', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
