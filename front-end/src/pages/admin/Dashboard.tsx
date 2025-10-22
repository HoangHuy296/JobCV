import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useUser();

  const handleLogout = () => {
    logout();

    // Redirect to login page
    navigate('/admin/dang-nhap');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900">Quản lý người dùng</h3>
          <p className="mt-2 text-gray-600">Quản lý tài khoản người dùng, phân quyền và trạng thái hoạt động.</p>
          <div className="mt-4">
            <button 
              onClick={() => navigate('/admin/quan-ly-nguoi-dung')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Truy cập
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900">Quản lý vai trò</h3>
          <p className="mt-2 text-gray-600">Quản lý các vai trò và phân quyền trong hệ thống.</p>
          <div className="mt-4">
            <button 
              onClick={() => navigate('/admin/quan-ly-vai-tro')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Truy cập
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900">Thống kê hệ thống</h3>
          <p className="mt-2 text-gray-600">Xem thống kê và báo cáo hoạt động của hệ thống.</p>
          <div className="mt-4">
            <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
              Truy cập
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
