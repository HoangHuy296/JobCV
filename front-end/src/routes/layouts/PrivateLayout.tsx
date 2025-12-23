import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import type { PropsWithChildren } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';
import SlideOver from '../../components/common/SlideOver';
import NotificationBell from '../../components/common/NotificationBell';
import { userService } from '../../api/userService';
import { toast } from 'react-toastify';

interface NavItem {
  name: string;
  path: string;
  category?: string;
}

const PrivateLayout: React.FC<PropsWithChildren> = React.memo(({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useUser();
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isProfileSlideOverOpen, setIsProfileSlideOverOpen] = useState(false);
  const [isProfileSubmitting, setIsProfileSubmitting] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const dropdownRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Close profile dropdown if clicked outside
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
      
      // Close navigation dropdowns if clicked outside
      if (openDropdown) {
        const dropdownRef = dropdownRefs.current[openDropdown];
        if (dropdownRef && !dropdownRef.contains(event.target as Node)) {
          setOpenDropdown(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdown]);

  // Close mobile menu when resizing to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) { // md breakpoint
        setIsMobileMenuOpen(false);
        setOpenDropdown(null);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Navigation items grouped by category - memoized
  // Format: { groupName: [{name, path, category}, ...] }
  const groupedNavItems = useMemo(() => {
    // Get navigation items based on user role
    let items: NavItem[] = [];
    
    if (user) {
      switch (user.role) {
        case 'admin':
          items = [
            { name: 'Bảng điều khiển', path: '/admin/bang-dieu-khien', category: 'dashboard' },
            { name: 'Quản lý tin tuyển dụng', path: '/admin/quan-ly-cong-viec', category: 'business' },
            { name: 'Quản lý công ty', path: '/admin/quan-ly-cong-ty', category: 'business' },
            { name: 'Quản lý ngành nghề', path: '/admin/quan-ly-nganh-nghe', category: 'business' },
            { name: 'Quản lý CV', path: '/admin/quan-ly-cv', category: 'business' },
            { name: 'Quản lý Template CV', path: '/admin/quan-ly-template-cv', category: 'business' },
            { name: 'Cài đặt', path: '/admin/cai-dat', category: 'system' },
            { name: 'Quản lý người dùng', path: '/admin/quan-ly-nguoi-dung', category: 'system' },
            { name: 'Quản lý vai trò', path: '/admin/quan-ly-vai-tro', category: 'system' },
            { name: 'Quản lý hình ảnh', path: '/admin/quan-ly-hinh-anh', category: 'system' },
            { name: 'Quản lý thông báo', path: '/admin/quan-ly-thong-bao', category: 'system' },
          ];
          break;
        case 'recruiter':
          items = [
            { name: 'Bảng điều khiển', path: '/nha-tuyen-dung/bang-dieu-khien', category: 'dashboard' },
            { name: 'Danh sách công ty', path: '/cong-ty', category: 'dashboard2' },
            { name: 'Tin tuyển dụng', path: '/viec-lam', category: 'dashboard3' },
            { name: 'Quản lý công ty', path: '/nha-tuyen-dung/quan-ly-cong-ty', category: 'business' },
            { name: 'Quản lý tin tuyển dụng', path: '/nha-tuyen-dung/quan-ly-tin-tuyen-dung', category: 'business' },
            { name: 'Quản lý CV ứng tuyển', path: '/nha-tuyen-dung/quan-ly-cv-ung-tuyen', category: 'business' },
            // { name: 'Quản lý chiến dịch', path: '/nha-tuyen-dung/quan-ly-chien-dich', category: 'business' },
          ];
          break;
        case 'user':
        default:
          items = [
            { name: 'Bảng điều khiển', path: '/bang-dieu-khien', category: 'dashboard' },
            { name: 'Công ty', path: '/cong-ty', category: 'company' },
            { name: 'Tin tuyển dụng', path: '/viec-lam', category: 'job' },
            { name: 'Công việc đã thích', path: '/cong-viec-da-thich', category: 'user' },
            { name: 'Công ty theo dõi', path: '/cong-ty-theo-doi', category: 'user' },
            { name: 'Tạo CV mới', path: '/quan-ly-cv', category: 'user' },
            { name: 'Đơn ứng tuyển', path: '/don-ung-tuyen', category: 'user' },
          ];
      }
    }
    
    // Group items by category
    const grouped: Record<string, NavItem[]> = {};
    items.forEach(item => {
      const category = item.category || 'other';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(item);
    });
    
    return grouped;
  }, [user]);

  // Category names mapping - memoized
  const getCategoryName = useMemo(() => {
    const categoryNames: Record<string, string> = {
      dashboard: 'Bảng điều khiển',
      business: 'Doanh nghiệp',
      system: 'Hệ thống',
      user: 'Người dùng',
      other: 'Khác'
    };
    
    return (category: string): string => categoryNames[category] || category;
  }, []);

  // Optimized logout function
  const handleLogout = useCallback(() => {
    logout();
    toast.success('Đăng xuất thành công');
    navigate('/');
  }, [logout, navigate]);

  // Profile form fields
  const profileFields = [
    {
      name: 'name',
      label: 'Họ và tên',
      type: 'text' as const,
      required: true,
      placeholder: 'Nhập họ và tên'
    },
    {
      name: 'email',
      label: 'Email',
      type: 'email' as const,
      required: true,
      placeholder: 'Nhập email'
    },
    {
      name: 'email_notifications_enabled',
      label: 'Nhận thông báo qua email',
      type: 'checkbox' as const,
      description: 'Bật/tắt nhận thông báo về ứng tuyển, công việc và các cập nhật khác qua email'
    },
    {
      name: 'newPassword',
      label: 'Mật khẩu mới',
      type: 'password' as const,
      placeholder: 'Nhập mật khẩu mới'
    },
    {
      name: 'confirmPassword',
      label: 'Xác nhận mật khẩu mới',
      type: 'password' as const,
      placeholder: 'Nhập lại mật khẩu mới'
    }
  ];

  // Optimized profile click function
  const handleProfileClick = useCallback(() => {
    // Open the profile SlideOver
    setIsProfileSlideOverOpen(true);
    setIsProfileDropdownOpen(false);
  }, []);

  const handleProfileNavigation = useCallback((path: string) => {
    navigate(path);
    setIsProfileDropdownOpen(false);
  }, [navigate]);

  // Handle profile update
  const handleProfileUpdate = useCallback(async (values: Record<string, any>) => {
    setIsProfileSubmitting(true);
    // Check if user is trying to change password
    const { newPassword, confirmPassword, ...profileData } = values;
    
    // If any password field is filled, validate all password fields
    if (newPassword || confirmPassword) {
      if (!newPassword) {
        toast.error('Vui lòng nhập mật khẩu mới');
        setIsProfileSubmitting(false);
        return;
      }
      
      if (newPassword !== confirmPassword) {
        toast.error('Mật khẩu xác nhận không khớp');
        setIsProfileSubmitting(false);
        return;
      }
      
      // Add password to profile data for update
      profileData.password = newPassword;
    }
    
    try {
      // Update user profile
      if (user) {
        const resp = await userService.updateUser(user.id, profileData);

        if (resp) {
          toast.success('Cập nhật hồ sơ thành công');
        }
      }      
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsProfileSubmitting(false);
      setIsProfileSlideOverOpen(false);
    }
  }, [user]);

  // Optimized mobile menu toggle
  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(prev => !prev);
  }, []);

  // Optimized dropdown toggle
  const toggleDropdown = useCallback((category: string) => {
    setOpenDropdown(prev => prev === category ? null : category);
  }, []);

  // Optimized navigation function
  const handleNavigate = useCallback((path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false);
    setOpenDropdown(null);
  }, [navigate]);

  // Optimized navigation for single items
  const handleSingleItemNavigate = useCallback((path: string) => {
    navigate(path);
    setOpenDropdown(null);
  }, [navigate]);

  // Optimized dashboard navigation
  const handleDashboardNavigate = useCallback(() => {
    const path = user?.role === 'admin' 
      ? '/admin/bang-dieu-khien' 
      : '/';
    navigate(path);
  }, [user, navigate]);

  return (
    <div className="bg-background min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo/Title - Left Section */}
            <div className="flex items-center">
              <div 
                className="flex items-center space-x-2 cursor-pointer group"
                onClick={handleDashboardNavigate}
              >
                <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-2 rounded-lg shadow-sm group-hover:shadow-md transition-all duration-300">
                  <svg 
                    className="h-5 w-5 text-white" 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                  </svg>
                </div>
                <span className="text-xl font-bold text-blue-600 group-hover:text-blue-700 transition-colors">
                  JobBoard
                </span>
              </div>
            </div>

            {/* Desktop Navigation Links - Center Section */}
            <div className="flex items-center">
              <div className="hidden md:flex items-center space-x-1 lg:space-x-2 flex-1 justify-center">              
                {/* Role-based Navigation */}
                {Object.entries(groupedNavItems).map(([category, items]) => (
                  items.length === 1 ? (
                    // Single item - show as regular link
                    <button
                      key={items[0].path}
                      onClick={() => handleSingleItemNavigate(items[0].path)}
                      className={`cursor-pointer px-2 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${location.pathname === items[0].path ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'}`}
                    >
                      {items[0].name}
                    </button>
                  ) : (
                    // Multiple items - show as dropdown
                    <div 
                      key={category} 
                      className="relative"
                      ref={(el) => {
                        if (el) {
                          dropdownRefs.current[category] = el;
                        }
                      }}
                    >
                      <button 
                        className="cursor-pointer px-2 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 flex items-center transition-colors duration-200"
                        onClick={() => toggleDropdown(category)}
                        aria-haspopup="true"
                        aria-expanded={openDropdown === category}
                      >
                        {getCategoryName(category)}
                        <svg className={`ml-1 w-4 h-4 transition-transform duration-300 ease-in-out ${openDropdown === category ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                      </button>
                      <div 
                        className={`absolute left-1/2 transform -translate-x-1/2 mt-2 w-56 rounded-lg shadow-xl bg-white z-50 transition-all duration-300 ease-in-out origin-top ${openDropdown === category ? 'opacity-100 visible scale-100 translate-y-0' : 'opacity-0 invisible scale-95 -translate-y-2'}`}
                      >
                        <div className="py-2">
                          {items.map((item) => (
                            <button
                              key={item.path}
                              onClick={() => handleNavigate(item.path)}
                              className={`cursor-pointer block w-full text-left px-4 py-2.5 text-sm font-medium transition-all duration-200 ${location.pathname === item.path ? 'text-blue-600 bg-blue-50 shadow-inner' : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'}`}
                            >
                              {item.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )
                ))}
              </div>

              <div className="h-6 w-px bg-gray-200 mx-2"></div>

              {/* User Profile Dropdown - Right Section */}
              <div className="flex items-center gap-3">
                {/* Notification Bell - Desktop Only */}
                <div className="hidden md:block">
                  <NotificationBell />
                </div>
                
                {/* User Profile - Desktop Only */}
                <div className="hidden md:block relative" ref={profileDropdownRef}>
                  <button
                    onClick={() => setIsProfileDropdownOpen(prev => !prev)}
                    className="cursor-pointer flex items-center text-sm"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <span className="ml-2 text-sm font-medium text-gray-700">
                      {user?.name}
                    </span>
                    <svg className={`ml-1 w-4 h-4 transition-transform duration-300 ease-in-out ${isProfileDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </button>

                  {/* Dropdown menu */}
                  <div className={`origin-top-right absolute right-0 mt-2 w-48 rounded-lg shadow-xl bg-white z-50 transition-all duration-300 ease-in-out ${isProfileDropdownOpen ? 'opacity-100 visible scale-100 translate-y-0' : 'opacity-0 invisible scale-95 -translate-y-2'}`}>
                    <div className="py-2" role="none">
                      {user?.role === 'recruiter' && (
                        <>
                          <button
                            onClick={() => handleProfileNavigation('/nha-tuyen-dung/quan-ly-cong-ty')}
                            className="block w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 cursor-pointer transition-all duration-200"
                            role="menuitem"
                          >
                            Quản lý công ty
                          </button>
                          <button
                            onClick={() => handleProfileNavigation('/nha-tuyen-dung/quan-ly-cong-viec')}
                            className="block w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 cursor-pointer transition-all duration-200"
                            role="menuitem"
                          >
                            Quản lý tin tuyển dụng
                          </button>
                        </>
                      )}
                      <button
                        onClick={handleProfileClick}
                        className="block w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 cursor-pointer transition-all duration-200"
                        role="menuitem"
                      >
                        Hồ sơ cá nhân
                      </button>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 cursor-pointer transition-all duration-200"
                        role="menuitem"
                      >
                        Đăng xuất
                      </button>
                    </div>
                  </div>
                </div>

                {/* Mobile menu button */}
                <div className="md:hidden">
                  <button
                    onClick={toggleMobileMenu}
                    className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 cursor-pointer"
                    aria-expanded="false"
                  >
                    <span className="sr-only">Open main menu</span>
                    <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                      {isMobileMenuOpen ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                      )}
                    </svg>
                  </button>
                </div>
              </div>              
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div className={`md:hidden ${isMobileMenuOpen ? 'block' : 'hidden'}`}>
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {/* Public Links - Always visible */}
            <button
              onClick={() => handleNavigate('/viec-lam')}
              className={`cursor-pointer block px-3 py-2 rounded-md text-base font-medium w-full text-left transition-colors duration-200 ${location.pathname === '/viec-lam' ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'}`}
            >
              Việc làm
            </button>
            <button
              onClick={() => handleNavigate('/cong-ty')}
              className={`cursor-pointer block px-3 py-2 rounded-md text-base font-medium w-full text-left transition-colors duration-200 ${location.pathname === '/cong-ty' ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'}`}
            >
              Công ty
            </button>
            
            {/* Divider */}
            <div className="border-t border-gray-200 my-2"></div>
            
            {/* Role-based Navigation */}
            {Object.entries(groupedNavItems).map(([category, items]) => (
              <div key={category}>
                {items.length === 1 ? (
                  <button
                    key={items[0].path}
                    onClick={() => handleNavigate(items[0].path)}
                    className={`cursor-pointer block px-3 py-2 rounded-md text-base font-medium w-full text-left transition-colors duration-200 ${location.pathname === items[0].path ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'}`}
                  >
                    {items[0].name}
                  </button>
                ) : (
                  <div className="space-y-1">
                    <button
                      className="cursor-pointer px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 flex items-center justify-between w-full transition-colors duration-200"
                      onClick={() => toggleDropdown(category)}
                      aria-expanded={openDropdown === category}
                    >
                      {getCategoryName(category)}
                      <svg className={`h-5 w-5 transition-transform duration-200 ${openDropdown === category ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                      </svg>
                    </button>
                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${openDropdown === category ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                      <div className="pl-4 space-y-1">
                        {items.map((item) => (
                          <button
                            key={item.path}
                            onClick={() => handleNavigate(item.path)}
                            className={`cursor-pointer block px-3 py-2 rounded-md text-base font-medium w-full text-left transition-colors duration-200 ${location.pathname === item.path ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'}`}
                          >
                            {item.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-grow bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-gray-900 text-white pt-12 pb-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Company Info */}
            <div className="col-span-1 md:col-span-2">
              <h3 className="text-xl font-bold mb-4">JobBoard</h3>
              <p className="text-gray-400 mb-4 max-w-md">
                Nền tảng kết nối việc làm hàng đầu Việt Nam, giúp người tìm việc và nhà tuyển dụng gặp nhau một cách hiệu quả.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Khám phá</h4>
              <ul className="space-y-2">
                <li><a href="/" className="text-gray-400 hover:text-white transition-colors">Trang chủ</a></li>
                <li><a href="/cong-ty" className="text-gray-400 hover:text-white transition-colors">Công ty</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Việc làm</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Blog</a></li>
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Liên hệ</h4>
              <ul className="space-y-2 text-gray-400">
                <li className="flex items-start">
                  <svg className="h-5 w-5 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                  </svg>
                  <span>+84 123 456 789</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                  </svg>
                  <span>contact@jobboard.vn</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  </svg>
                  <span>Tăng Nhơn Phú, Tp. Thủ Đức, Tp. Hồ Chí Minh</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-6 mt-6 text-center text-gray-400 text-sm">
            <p>© 2025 JobBoard. Tất cả các quyền được bảo lưu.</p>
            <div className="mt-2 flex justify-center space-x-6">
              <a href="#" className="hover:text-white transition-colors">Điều khoản sử dụng</a>
              <a href="#" className="hover:text-white transition-colors">Chính sách bảo mật</a>
              <a href="#" className="hover:text-white transition-colors">Liên hệ hỗ trợ</a>
            </div>
          </div>
        </div>
      </footer>
      
      {/* Profile SlideOver */}
      {isProfileSlideOverOpen && 
        (<SlideOver
          title="Hồ sơ cá nhân"
          isOpen={isProfileSlideOverOpen}
          onClose={() => setIsProfileSlideOverOpen(false)}
          onSubmit={handleProfileUpdate}
          fields={profileFields}
          initialValues={{
            name: user?.name || '',
            email: user?.email || '',
            email_notifications_enabled: user?.email_notifications_enabled ?? true
          }}
          isSubmitting={isProfileSubmitting}
        />)
      }
    </div>
  );
});

export default PrivateLayout;
