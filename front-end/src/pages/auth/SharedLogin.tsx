import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { authService } from '../../api/authService';
import { toast } from 'react-toastify';
import { useUser } from '../../contexts/UserContext';

const SharedLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useUser();

  // Pre-fill email if coming from registration
  useEffect(() => {
    if (location.state?.email) {
      setEmail(location.state.email);
    }
  }, [location.state]);

  // Determine the login type based on the URL
  const isRecruiterLogin = location.pathname.includes('nha-tuyen-dung');
  const isAdminLogin = location.pathname.includes('admin');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const resp = await authService.login({ email, password });
      if (resp) {
        const token = resp.token;
  
        // Validate token format
        if (!token || typeof token !== 'string' || token.split('.').length !== 3) {
          console.error('Token format error:', token);
          toast.error('Đăng nhập thất bại. Vui lòng thử lại');
          return;
        }

        // Decode token to check role
        let decodedToken;
        try {
          const payload = token.split('.')[1];
          // Replace URL-safe characters and add padding if needed
          const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
          const paddedBase64 = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
          decodedToken = JSON.parse(atob(paddedBase64));
        } catch (decodeError) {
          console.error('Token decode error:', decodeError);
          toast.error('Đăng nhập thất bại. Vui lòng thử lại');
          return;
        }

        // Define route configurations
        const routeConfig = {
          admin: { 
            roles: 'admin', 
            successMessage: 'Đăng nhập quản trị thành công!', 
            successPath: '/admin/bang-dieu-khien' 
          },
          recruiter: { 
            roles: 'recruiter', 
            successMessage: 'Đăng nhập nhà tuyển dụng thành công!', 
            successPath: '/nha-tuyen-dung/bang-dieu-khien' 
          },
          user: { 
            roles: 'user', 
            successMessage: 'Đăng nhập thành công!', 
            successPath: '/bang-dieu-khien' 
          }
        };
  
        // Determine user type
        const userType = isAdminLogin ? 'admin' 
          : isRecruiterLogin ? 'recruiter' 
          : 'user';
        
        // Check if user has appropriate role
        const config = routeConfig[userType];
        
        if (config.roles === decodedToken.role.name) {
          await login(token);
          toast.success(config.successMessage);
          navigate(config.successPath);
        } else {
          // If not authorized, logout and show error
          authService.logout();
          toast.error(`Tài khoản không có quyền truy cập trang ${userType === 'recruiter' ? 'nhà tuyển dụng' : 'người dùng'}`);
        }
      }

    } catch (error: unknown) {
      console.error('Login failed:', error);
      // Let the interceptor handle the error toasts
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900">
          {isRecruiterLogin ? 'Đăng nhập nhà tuyển dụng' : isAdminLogin ? 'Đăng nhập quản trị' : 'Đăng nhập người dùng'}
        </h2>
        <p className="mt-2 text-gray-600">
          {isRecruiterLogin
            ? 'Nhập thông tin đăng nhập để truy cập tài khoản nhà tuyển dụng'
            : isAdminLogin
              ? 'Nhập thông tin đăng nhập để truy cập trang quản trị'
              : 'Nhập thông tin đăng nhập để truy cập tài khoản người dùng'}
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label
            htmlFor="email"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Địa chỉ email <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
            </div>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full rounded-md border border-gray-300 pl-10 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${isRecruiterLogin ? 'focus:border-green-500 focus:ring-green-500' : isAdminLogin ? 'focus:border-purple-500 focus:ring-purple-500' : 'focus:border-blue-500 focus:ring-blue-500'}`}
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Mật khẩu <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
            </div>
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full rounded-md border border-gray-300 pl-10 pr-10 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${isRecruiterLogin ? 'focus:border-green-500 focus:ring-green-500' : isAdminLogin ? 'focus:border-purple-500 focus:ring-purple-500' : 'focus:border-blue-500 focus:ring-blue-500'}`}
            />
            <button
              type="button"
              tabIndex={-1}
              className="cursor-pointer absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div className="mt-2 text-right text-sm text-gray-600">
          <Link
            to="/quen-mat-khau"
            className={`font-medium ${isRecruiterLogin ? 'text-green-600 hover:text-green-500' : isAdminLogin ? 'text-purple-600 hover:text-purple-500' : 'text-blue-600 hover:text-blue-500'}`}
          >
            Quên mật khẩu?
          </Link>
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className={`flex w-full justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 cursor-pointer ${isRecruiterLogin ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' : isAdminLogin ? 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500' : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'}`}
          >
            {loading ? 'Đang đăng nhập...' : isRecruiterLogin ? 'Đăng nhập nhà tuyển dụng' : isAdminLogin ? 'Đăng nhập quản trị' : 'Đăng nhập người dùng'}
          </button>
        </div>
      </form>

      {!isAdminLogin && (
        <>
          <div className="mt-4 text-center text-sm text-gray-600">
            <p>
              {isRecruiterLogin ? 'Bạn là người dùng thông thường?' : 'Bạn là nhà tuyển dụng?'}{' '}
              <Link
                to={isRecruiterLogin ? '/dang-nhap' : '/dang-nhap-nha-tuyen-dung'}
                className={`font-medium ${isRecruiterLogin ? 'text-blue-600 hover:text-blue-500' : 'text-green-600 hover:text-green-500'}`}
              >
                {isRecruiterLogin ? 'Đăng nhập người dùng' : 'Đăng nhập nhà tuyển dụng'}
              </Link>
            </p>
          </div>
          <div className="mt-4 text-center text-sm text-gray-600">
            <p>
              Chưa có tài khoản?{' '}
              <Link
                to={isRecruiterLogin ? '/dang-ky-nha-tuyen-dung' : '/dang-ky'}
                className={`font-medium ${isRecruiterLogin ? 'text-green-600 hover:text-green-500' : 'text-blue-600 hover:text-blue-500'}`}
              >
                Đăng ký
              </Link>
            </p>
          </div>
        </>
      )}

      <div className="mt-4 text-center text-sm text-gray-600">
        <Link to="/">
          ← Quay về trang chủ
        </Link>
      </div>
    </div>
  );
};

export default SharedLogin;
