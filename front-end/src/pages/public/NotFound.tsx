import React from 'react';
import { useNavigate } from 'react-router-dom';

type NotFoundProps = {
  message?: string;
};

const NotFound: React.FC<NotFoundProps> = ({ message }) => {
  const navigate = useNavigate();
  
  const handleGoBack = () => {
    navigate(-1);
  };
  
  const handleGoHome = () => {
    navigate('/');
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white rounded-2xl shadow-xl p-8 md:p-12">
        <div className="text-center">
          <div className="mx-auto h-24 w-24 flex items-center justify-center rounded-full bg-red-100">
            <svg className="h-16 w-16 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">Trang không tồn tại</h1>
          <p className="mt-4 text-lg text-gray-600">
            {message || 'Xin lỗi, trang bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.'}
          </p>
        </div>
        
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={handleGoBack}
            className="w-full sm:w-auto flex justify-center py-3 px-6 border border-gray-300 rounded-lg shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer transition-colors duration-200"
          >
            Quay lại
          </button>
          <button
            onClick={handleGoHome}
            className="w-full sm:w-auto flex justify-center py-3 px-6 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer transition-colors duration-200"
          >
            Về trang chủ
          </button>
        </div>
        
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Nếu bạn tin rằng đây là lỗi, vui lòng liên hệ với bộ phận hỗ trợ.
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
