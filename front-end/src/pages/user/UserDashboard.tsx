import React from 'react';
import { useUser } from '../../contexts/UserContext';
import { useNavigate } from 'react-router-dom';

type UserDashboardProps = {
  // Add any props if needed
};

const UserDashboard: React.FC<UserDashboardProps> = () => {
  const { user } = useUser();
  const navigate = useNavigate();

  return (
    <div className="space-y-8 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-end justify-between border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Bảng Điều Khiển Của Tôi</h1>
          <p className="text-sm text-gray-500 mt-2">
            Xin chào, {user?.name}
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Thao Tác Nhanh</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/quan-ly-cv')}
            className="bg-white border border-gray-100 p-6 hover:border-gray-200 transition-all text-left group"
          >
            <div className="flex items-start justify-between mb-4">
              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-xs text-gray-400 group-hover:text-gray-600 transition-colors">→</span>
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Quản lý CV</h3>
            <p className="text-xs text-gray-500">Tạo và quản lý CV của bạn</p>
          </button>
          
          <button
            onClick={() => navigate('/don-ung-tuyen')}
            className="bg-white border border-gray-100 p-6 hover:border-gray-200 transition-all text-left group"
          >
            <div className="flex items-start justify-between mb-4">
              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="text-xs text-gray-400 group-hover:text-gray-600 transition-colors">→</span>
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Đơn ứng tuyển</h3>
            <p className="text-xs text-gray-500">Theo dõi trạng thái ứng tuyển</p>
          </button>
          
          <button
            onClick={() => navigate('/cong-viec-da-thich')}
            className="bg-white border border-gray-100 p-6 hover:border-gray-200 transition-all text-left group"
          >
            <div className="flex items-start justify-between mb-4">
              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span className="text-xs text-gray-400 group-hover:text-gray-600 transition-colors">→</span>
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Công việc đã thích</h3>
            <p className="text-xs text-gray-500">Xem các công việc yêu thích</p>
          </button>
        </div>
      </div>

      {/* Activity Summary */}
      <div>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Tổng Quan Hoạt Động</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-100 p-6">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Đơn ứng tuyển</p>
            <p className="text-3xl font-bold text-gray-900 tracking-tight">0</p>
            <p className="text-xs text-gray-500 mt-1">Tổng số đã nộp</p>
          </div>
          
          <div className="bg-white border border-gray-100 p-6">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">CV đã tạo</p>
            <p className="text-3xl font-bold text-gray-900 tracking-tight">0</p>
            <p className="text-xs text-gray-500 mt-1">CV đang hoạt động</p>
          </div>
          
          <div className="bg-white border border-gray-100 p-6">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Lượt xem hồ sơ</p>
            <p className="text-3xl font-bold text-gray-900 tracking-tight">0</p>
            <p className="text-xs text-gray-500 mt-1">30 ngày qua</p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Hoạt Động Gần Đây</h2>
        <div className="bg-white border border-gray-100 p-8 text-center">
          <svg className="h-12 w-12 text-gray-300 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-sm text-gray-500 mb-4">Chưa có hoạt động gần đây</p>
          <button 
            onClick={() => navigate('/viec-lam')}
            className="text-sm text-gray-900 border border-gray-200 px-4 py-2 hover:bg-gray-50 transition-colors"
          >
            Tìm kiếm công việc
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
