import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { authService } from '../../api/authService';
import { toast } from 'react-toastify';

const EmailVerification: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');
      
      if (!token) {
        setError(true);
        setLoading(false);
        toast.error('Token xác thực không hợp lệ');
        return;
      }

      try {
        const response = await authService.verifyEmail(token);
        if (response.result) {
          setVerified(true);
          toast.success(response.message || 'Xác thực email thành công!');
          // Redirect to login after 3 seconds
          setTimeout(() => {
            navigate('/dang-nhap');
          }, 3000);
        }
      } catch (err) {
        setError(true);
        console.error('Email verification failed:', err);
      } finally {
        setLoading(false);
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        {loading && (
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Đang xác thực email...</h2>
            <p className="text-gray-600">Vui lòng đợi trong giây lát</p>
          </div>
        )}

        {!loading && verified && (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Xác thực thành công!</h2>
            <p className="text-gray-600 mb-4">
              Email của bạn đã được xác thực. Bạn có thể đăng nhập ngay bây giờ.
            </p>
            <p className="text-sm text-gray-500">Đang chuyển hướng đến trang đăng nhập...</p>
          </div>
        )}

        {!loading && error && (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Xác thực thất bại</h2>
            <p className="text-gray-600 mb-6">
              Token xác thực không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu gửi lại email xác thực.
            </p>
            <div className="space-y-3">
              <Link
                to="/gui-lai-xac-thuc"
                className="block w-full bg-blue-600 text-white rounded-md px-4 py-2 hover:bg-blue-700 transition-colors"
              >
                Gửi lại email xác thực
              </Link>
              <Link
                to="/"
                className="block w-full bg-gray-100 text-gray-700 rounded-md px-4 py-2 hover:bg-gray-200 transition-colors"
              >
                Quay về trang chủ
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailVerification;
