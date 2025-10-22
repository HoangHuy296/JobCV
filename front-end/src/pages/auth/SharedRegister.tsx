import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { authService } from '../../api/authService';
import { toast } from 'react-toastify';

const SharedRegister: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Determine if this is a recruiter registration based on the URL
  const isRecruiterRegistration = location.pathname.includes('nha-tuyen-dung');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }
    
    if (password.length < 6) {
      toast.error('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }
    
    setLoading(true);
    
    try {
      // For both user types, we'll use the same registration endpoint
      // Pass the role information to the backend
      const role = isRecruiterRegistration ? 'recruiter' : 'user';
      const resp = await authService.register({ name, email, password, role });
      
      if (resp) {
        toast.success('Đăng ký tài khoản thành công!');
        if (isRecruiterRegistration)
          navigate('/dang-nhap-nha-tuyen-dung');
        else
          navigate('/dang-nhap');
      }
    } catch (error: unknown) {
      console.error('Registration failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900">
          {isRecruiterRegistration ? 'Đăng ký nhà tuyển dụng' : 'Tạo tài khoản người dùng'}
        </h2>
        <p className="mt-2 text-gray-600">
          {isRecruiterRegistration 
            ? 'Tạo tài khoản nhà tuyển dụng để đăng tuyển và tìm kiếm ứng viên' 
            : 'Nhập thông tin của bạn để bắt đầu'}
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label
            htmlFor="name"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Họ và tên <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full rounded-md border border-gray-300 pl-10 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${isRecruiterRegistration ? 'focus:border-green-500 focus:ring-green-500' : 'focus:border-blue-500 focus:ring-blue-500'}`}
            />
          </div>
        </div>

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
              className={`w-full rounded-md border border-gray-300 pl-10 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${isRecruiterRegistration ? 'focus:border-green-500 focus:ring-green-500' : 'focus:border-blue-500 focus:ring-blue-500'}`}
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
              type={showPasswords ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full rounded-md border border-gray-300 pl-10 pr-10 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${isRecruiterRegistration ? 'focus:border-green-500 focus:ring-green-500' : 'focus:border-blue-500 focus:ring-blue-500'}`}
              required
            />
            <button
              type="button"
              onClick={() => setShowPasswords(!showPasswords)}
              className="cursor-pointer absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
            >
              {showPasswords ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-500">Mật khẩu phải có ít nhất 6 ký tự</p>
        </div>

        <div className="mb-4">
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
            Xác nhận mật khẩu <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
            </div>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showPasswords ? "text" : "password"}
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`w-full rounded-md border border-gray-300 pl-10 pr-10 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${isRecruiterRegistration ? 'focus:border-green-500 focus:ring-green-500' : 'focus:border-blue-500 focus:ring-blue-500'}`}
            />
            <button
              type="button"
              onClick={() => setShowPasswords(!showPasswords)}
              className="cursor-pointer absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
            >
              {showPasswords ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className={`flex w-full justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${isRecruiterRegistration ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500 focus:border-green-500' : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 focus:border-blue-500'} disabled:opacity-50 cursor-pointer`}
          >
            {loading ? 'Đang đăng ký...' : isRecruiterRegistration ? 'Đăng ký nhà tuyển dụng' : 'Tạo tài khoản'}
          </button>
        </div>
      </form>

      <div className="mt-4 text-center text-sm text-gray-600">
        <p>
          Đã có tài khoản?{' '}
          <Link
            to={isRecruiterRegistration ? '/dang-nhap-nha-tuyen-dung' : '/dang-nhap'}
            className={`font-medium ${isRecruiterRegistration ? 'text-green-600 hover:text-green-500' : 'text-blue-600 hover:text-blue-500'}`}
          >
            Đăng nhập
          </Link>
        </p>
      </div>
      
      <div className="mt-4 text-center text-sm text-gray-600">
        <p>
          {isRecruiterRegistration ? 'Bạn là người dùng thông thường?' : 'Bạn là nhà tuyển dụng?'}{' '}
          <Link
            to={isRecruiterRegistration ? '/dang-ky' : '/dang-ky-nha-tuyen-dung'}
            className={`font-medium ${isRecruiterRegistration ? 'text-blue-600 hover:text-blue-500' : 'text-green-600 hover:text-green-500'}`}
          >
            {isRecruiterRegistration ? 'Đăng ký người dùng' : 'Đăng ký nhà tuyển dụng'}
          </Link>
        </p>
      </div>
      
      <div className="mt-4 text-center text-sm text-gray-600">
        <Link to="/">
          ← Quay về trang chủ
        </Link>
      </div>
    </div>
  );
};

export default SharedRegister;
