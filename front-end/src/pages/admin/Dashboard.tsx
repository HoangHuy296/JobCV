import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAdminDashboardStats, type DashboardStats } from '../../api/dashboardService';
import { toast } from 'react-toastify';
import {
  LuUsers,
  LuBriefcase,
  LuBuilding2,
  LuFileText,
  LuTrendingUp,
  LuArrowUpRight,
  LuArrowDownRight,
  LuRefreshCw
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
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" />
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-sm">Không thể tải dữ liệu</p>
        <button
          onClick={fetchStats}
          className="mt-3 px-4 py-2 text-sm bg-gray-900 text-white rounded hover:bg-gray-800 cursor-pointer"
        >
          Thử lại
        </button>
      </div>
    );
  }

  const MetricCard = ({ 
    title, 
    value, 
    change, 
    icon: Icon, 
    onClick 
  }: { 
    title: string; 
    value: number; 
    change?: number; 
    icon: any; 
    onClick?: () => void;
  }) => {
    const isPositive = change !== undefined && change > 0;
    const hasChange = change !== undefined && change !== 0;
    
    return (
      <div 
        className={`bg-white border border-gray-100 p-6 hover:border-gray-200 transition-all ${
          onClick ? 'cursor-pointer' : ''
        }`}
        onClick={onClick}
      >
        <div className="flex items-start justify-between mb-4">
          <Icon className="w-5 h-5 text-gray-400" />
          {hasChange && (
            <div className={`flex items-center gap-1 text-xs font-medium ${
              isPositive ? 'text-emerald-600' : 'text-red-600'
            }`}>
              {isPositive ? <LuArrowUpRight className="w-3 h-3" /> : <LuArrowDownRight className="w-3 h-3" />}
              <span>{Math.abs(change!)}</span>
            </div>
          )}
        </div>
        <div>
          <p className="text-3xl font-bold text-gray-900 tracking-tight">{value.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider">{title}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-end justify-between border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Báo Cáo Hệ Thống</h1>
          <p className="text-sm text-gray-500 mt-2">
            {new Date().toLocaleDateString('vi-VN', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        <button
          onClick={fetchStats}
          className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
        >
          <LuRefreshCw className="w-4 h-4" />
          Làm mới
        </button>
      </div>

      {/* Key Metrics */}
      <div>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Chỉ Số Chính</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Người dùng"
            value={stats.overview.users.total_users}
            change={stats.overview.users.new_users_today}
            icon={LuUsers}
            onClick={() => navigate('/admin/quan-ly-nguoi-dung')}
          />
          <MetricCard
            title="Công việc"
            value={stats.overview.jobs.total_jobs}
            change={stats.overview.jobs.new_jobs_today}
            icon={LuBriefcase}
            onClick={() => navigate('/admin/quan-ly-cong-viec')}
          />
          <MetricCard
            title="Công ty"
            value={stats.overview.companies.total_companies}
            change={stats.overview.companies.new_companies_today}
            icon={LuBuilding2}
            onClick={() => navigate('/admin/quan-ly-cong-ty')}
          />
          <MetricCard
            title="CVs"
            value={stats.overview.cvs.total_cvs}
            change={stats.overview.cvs.new_cvs_today}
            icon={LuFileText}
            onClick={() => navigate('/admin/quan-ly-cv')}
          />
        </div>
      </div>

      {/* Status Breakdown */}
      <div>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Tổng Quan Trạng Thái</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-100 p-6">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-4">Người dùng</p>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Đang hoạt động</span>
                <span className="text-sm font-semibold text-gray-900">
                  {stats.overview.users.active_users}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Không hoạt động</span>
                <span className="text-sm font-semibold text-gray-400">
                  {stats.overview.users.inactive_users}
                </span>
              </div>
              <div className="pt-3 border-t border-gray-100">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Tổng cộng</span>
                  <span className="text-sm font-bold text-gray-900">
                    {stats.overview.users.total_users}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-100 p-6">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-4">Công việc</p>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Đang hoạt động</span>
                <span className="text-sm font-semibold text-gray-900">
                  {stats.overview.jobs.active_jobs}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Đã đóng</span>
                <span className="text-sm font-semibold text-gray-400">
                  {stats.overview.jobs.inactive_jobs}
                </span>
              </div>
              <div className="pt-3 border-t border-gray-100">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Tổng cộng</span>
                  <span className="text-sm font-bold text-gray-900">
                    {stats.overview.jobs.total_jobs}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-100 p-6">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-4">Công ty</p>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Đang hoạt động</span>
                <span className="text-sm font-semibold text-gray-900">
                  {stats.overview.companies.active_companies}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Mới hôm nay</span>
                <span className="text-sm font-semibold text-emerald-600">
                  +{stats.overview.companies.new_companies_today}
                </span>
              </div>
              <div className="pt-3 border-t border-gray-100">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Tổng cộng</span>
                  <span className="text-sm font-bold text-gray-900">
                    {stats.overview.companies.total_companies}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Growth Trends */}
      <div>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Xu Hướng 7 Ngày</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white border border-gray-100 p-6">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-4">Tăng trưởng người dùng</p>
            <div className="space-y-2">
              {stats.charts.userGrowth.map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-16 font-mono">
                    {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  <div className="flex-1 bg-gray-50 h-8 relative overflow-hidden">
                    <div 
                      className="bg-gray-900 h-full flex items-center justify-end pr-3 transition-all"
                      style={{ width: `${Math.max((item.count / Math.max(...stats.charts.userGrowth.map(i => i.count))) * 100, 8)}%` }}
                    >
                      <span className="text-xs text-white font-medium">{item.count}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-100 p-6">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-4">Tăng trưởng công việc</p>
            <div className="space-y-2">
              {stats.charts.jobGrowth.map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-16 font-mono">
                    {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  <div className="flex-1 bg-gray-50 h-8 relative overflow-hidden">
                    <div 
                      className="bg-gray-900 h-full flex items-center justify-end pr-3 transition-all"
                      style={{ width: `${Math.max((item.count / Math.max(...stats.charts.jobGrowth.map(i => i.count))) * 100, 8)}%` }}
                    >
                      <span className="text-xs text-white font-medium">{item.count}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Distribution Analysis */}
      <div>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Phân Bổ</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white border border-gray-100 p-6">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-4">Vai trò người dùng</p>
            <div className="space-y-4">
              {stats.charts.roleDistribution.map((item, index) => (
                <div key={index}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600 capitalize">{item.role}</span>
                    <span className="text-sm font-semibold text-gray-900">{item.count}</span>
                  </div>
                  <div className="w-full bg-gray-50 h-1.5">
                    <div 
                      className="bg-gray-900 h-1.5 transition-all"
                      style={{ 
                        width: `${(item.count / stats.charts.roleDistribution.reduce((sum, r) => sum + r.count, 0)) * 100}%` 
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-100 p-6">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-4">Ngành nghề hàng đầu</p>
            <div className="space-y-4">
              {stats.charts.topIndustries.map((item, index) => (
                <div key={index}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">{item.industry}</span>
                    <span className="text-sm font-semibold text-gray-900">{item.job_count}</span>
                  </div>
                  <div className="w-full bg-gray-50 h-1.5">
                    <div 
                      className="bg-gray-900 h-1.5 transition-all"
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
      </div>
    </div>
  );
};

export default AdminDashboard;
