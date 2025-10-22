import React from 'react';
import { useUser } from '../../contexts/UserContext';

type UserDashboardProps = {
  // Add any props if needed
};

const UserDashboard: React.FC<UserDashboardProps> = () => {
  const { user } = useUser();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow px-4 py-5 sm:p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Bảng điều khiển Người dùng</h1>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-blue-50 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-blue-800 mb-2">Hồ sơ của tôi</h2>
              <p className="text-blue-600">Quản lý thông tin cá nhân và hồ sơ</p>
              <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
                Xem hồ sơ
              </button>
            </div>
            
            <div className="bg-green-50 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-green-800 mb-2">Công việc đã ứng tuyển</h2>
              <p className="text-green-600">Xem trạng thái các tin tuyển dụng bạn đã ứng tuyển</p>
              <button className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition">
                Xem ứng tuyển
              </button>
            </div>
            
            <div className="bg-purple-50 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-purple-800 mb-2">CV của tôi</h2>
              <p className="text-purple-600">Quản lý và tạo CV của bạn</p>
              <button className="mt-4 bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition">
                Xem CV
              </button>
            </div>
          </div>
          
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Chào mừng {user?.name}!</h2>
            <p className="text-gray-600">
              Đây là bảng điều khiển dành riêng cho người dùng. Bạn có thể quản lý hồ sơ, 
              xem tin tuyển dụng đã ứng tuyển và quản lý CV từ đây.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
