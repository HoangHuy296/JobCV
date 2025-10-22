import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getCompanyById, subscribeToCompany, unsubscribeFromCompany, checkSubscriptionStatus, type Company } from '../../api/companyService';
import { useUser } from '../../contexts/UserContext';
import { toast } from 'react-toastify';

interface CompanyDetailProps {
  id?: string;
}

const CompanyDetail: React.FC<CompanyDetailProps> = ({ id: propId }) => {
  const { id: paramId } = useParams<{ id: string }>();
  const companyId = propId || paramId;
  
  const { isAuthenticated } = useUser();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const navigate = useNavigate();

  const getCompanyId = useCallback(() => {
    if (!companyId) return null;
    try {
      const decodedData = atob(companyId);
      const companyIdNum = parseInt(decodedData || '', 10);
      return isNaN(companyIdNum) ? null : companyIdNum;
    } catch (error) {
      console.error('Error decoding company ID:', error);
      return null;
    }
  }, [companyId]);

  const handleSubscribeToggle = useCallback(async () => {
    if (!isAuthenticated) {
      navigate('/dang-nhap');
      return;
    }

    if (!company) return;

    try {
      setIsLoadingSubscription(true);

      let resp;
      if (isSubscribed) {
        resp = await unsubscribeFromCompany(company.id);
      } else {
        resp = await subscribeToCompany(company.id);
      }

      if (resp) {
        setIsSubscribed(!isSubscribed);
        toast.success(`${isSubscribed ? 'Bỏ theo dõi' : 'Theo dõi'} công ty thành công`);
      }
    } catch (error) {
      console.error('Error toggling subscription:', error);
    } finally {
      setIsLoadingSubscription(false);
    }
  }, [isAuthenticated, company, isSubscribed, navigate]);

  const fetchCompanyData = useCallback(async () => {
    const companyIdNum = getCompanyId();
    if (!companyIdNum) {
      setError('Invalid company ID');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const companyData = await getCompanyById(companyIdNum);
      setCompany(companyData);

      // Check subscription status if user is logged in
      if (isAuthenticated) {
        try {
          const isSubscribed = await checkSubscriptionStatus(companyIdNum);
          setIsSubscribed(isSubscribed);
        } catch (subscriptionError) {
          console.error('Error checking subscription status:', subscriptionError);
          setIsSubscribed(false);
        }
      }
    } catch (err) {
      console.error('Error fetching company data:', err);
      setError('Failed to load company details');
    } finally {
      setLoading(false);
    }
  }, [getCompanyId, isAuthenticated]);

  useEffect(() => {
    fetchCompanyData();
  }, [fetchCompanyData, companyId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-700">{error || 'Company not found'}</p>
        <button 
          onClick={() => window.history.back()} 
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 cursor-pointer"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="mt-[-32px]">
      {/* Banner with enhanced visual elements */}
      <div className="relative h-64 md:h-80 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-b-2xl overflow-hidden">
        {/* Decorative elements for visual interest */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-white"></div>
          <div className="absolute bottom-10 right-10 w-24 h-24 rounded-full bg-white"></div>
          <div className="absolute top-1/2 left-1/4 w-16 h-16 rounded-full bg-white"></div>
        </div>
        
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent"></div>
        
        {/* Banner content */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center px-4">
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-2 drop-shadow-lg">Cơ Hội Nghề Nghiệp</h1>
            <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto drop-shadow-md">
              Khám phá cơ hội nghề nghiệp tuyệt vời cùng chúng tôi
            </p>
          </div>
        </div>
      </div>

      {/* Company info below banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 md:-mt-20 relative z-10">
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Company logo */}
            <div className="flex-shrink-0">
              {company.logo?.url ? 
                <img 
                  src={company.logo?.url} 
                  alt={company.name} 
                  className="h-24 w-24 md:h-32 md:w-32 rounded-2xl object-cover border-4 border-white shadow-lg"
                /> 
              :
                <div className="h-24 w-24 md:h-32 md:w-32 rounded-2xl bg-blue-100 border-4 border-white shadow-lg flex items-center justify-center text-blue-500">
                  <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              }
            </div>
            
            {/* Company name and info with subscribe button */}
            <div className="flex-1 flex flex-col md:flex-row md:items-center md:justify-between gap-4 w-full">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{company.name}</h2>
                <div className="mt-3 flex flex-wrap gap-4">
                  {/* Website */}
                  {company.website && (
                    <div className="flex items-center text-gray-600">
                      <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                      </svg>
                      <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 cursor-pointer truncate max-w-[200px] inline-block" title={company.website}>
                        {company.website.replace(/^https?:\/\//i, '')}
                      </a>
                    </div>
                  )}
                  
                  {/* Employees */}
                  {company.employees && (
                    <div className="flex items-center text-gray-600">
                      <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span>{company.employees} nhân viên</span>
                    </div>
                  )}
                  
                  {/* Subscribers */}
                  {company.subscription_count && company.subscription_count > 0 && (
                    <div className="flex items-center text-gray-600">
                      <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>{company.subscription_count} người theo dõi</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Subscribe button for logged in users */}
              {(isAuthenticated && !propId) && (
                <div className="md:mt-2">
                  <button 
                    onClick={handleSubscribeToggle}
                    disabled={isLoadingSubscription}
                    className={`px-4 py-2 border rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer whitespace-nowrap ${isSubscribed ? 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50' : 'border-transparent bg-blue-600 text-white hover:bg-blue-700'} disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isLoadingSubscription ? 'Đang xử lý...' : isSubscribed ? 'Bỏ theo dõi' : 'Theo dõi công ty'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Two columns layout */}
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left column - 3 rows (70% width) */}
            <div className="lg:col-span-2 space-y-8">
              {/* Company description */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Giới thiệu công ty</h2>
                {company.description ? (
                  <>
                    <div 
                      dangerouslySetInnerHTML={{ 
                        __html: showFullDescription 
                          ? company.description 
                          : company.description.length > 500 
                            ? company.description.substring(0, 500) + '...'
                            : company.description 
                      }} 
                      className="prose max-w-none"
                    />
                    {company.description.length > 500 && (
                      <button 
                        onClick={() => setShowFullDescription(!showFullDescription)}
                        className="mt-2 text-blue-600 hover:text-blue-800 font-medium cursor-pointer flex items-center"
                      >
                        {showFullDescription ? 'Thu gọn' : 'Xem thêm'}
                        {showFullDescription ? (
                          <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        ) : (
                          <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        )}
                      </button>
                    )}
                  </>
                ) : (
                  <p>Chưa có thông tin giới thiệu về công ty này.</p>
                )}
              </div>
              
              {/* Jobs section */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Tin tuyển dụng</h2>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    12 việc làm
                  </span>
                </div>
                <div className="space-y-4">
                  {/* Job item 1 */}
                  <div className="bg-white rounded-xl p-4 border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 cursor-pointer">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-gray-900">Nhân viên Phát triển Phần mềm</h3>
                        <p className="text-gray-600 text-sm mt-1">Công ty ABC Technology</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Hà Nội
                          </span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            Toàn thời gian
                          </span>
                        </div>
                      </div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        15-20 triệu
                      </span>
                    </div>
                    <div className="mt-3 flex items-center text-sm text-gray-500">
                      <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                      Hạn nộp: 15/10/2025
                    </div>
                  </div>
                  
                  {/* Job item 2 */}
                  <div className="bg-white rounded-xl p-4 border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 cursor-pointer">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-gray-900">Chuyên viên Marketing</h3>
                        <p className="text-gray-600 text-sm mt-1">Công ty XYZ Solutions</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Hồ Chí Minh
                          </span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            Bán thời gian
                          </span>
                        </div>
                      </div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        10-15 triệu
                      </span>
                    </div>
                    <div className="mt-3 flex items-center text-sm text-gray-500">
                      <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                      Hạn nộp: 20/10/2025
                    </div>
                  </div>
                  
                  <button className="w-full py-3 text-center text-blue-600 hover:text-blue-800 font-medium bg-white rounded-xl border border-blue-200 hover:border-blue-300 hover:shadow-sm transition-all duration-200 flex items-center justify-center">
                    <span>Xem tất cả tin tuyển dụng</span>
                    <svg className="ml-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
              
              {/* Top companies section */}
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Công ty hàng đầu</h2>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                    Top 10
                  </span>
                </div>
                <div className="space-y-4">
                  {/* Top company 1 */}
                  <div className="flex items-center space-x-4 p-3 bg-white rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all duration-200 cursor-pointer">
                    <div className="flex-shrink-0 relative">
                      <div className="bg-gradient-to-br from-blue-400 to-indigo-600 rounded-xl w-12 h-12 flex items-center justify-center text-white font-bold">FPT</div>
                      <div className="absolute -top-1 -right-1 flex items-center justify-center h-5 w-5 rounded-full bg-yellow-400 border-2 border-white">
                        <svg className="h-3 w-3 text-yellow-800" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 truncate">FPT Software</h3>
                      <p className="text-gray-600 text-sm truncate">Công nghệ thông tin</p>
                      <div className="mt-1 flex items-center text-sm text-gray-500">
                        <svg className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                        </svg>
                        2.5k người theo dõi
                      </div>
                    </div>
                  </div>
                  
                  {/* Top company 2 */}
                  <div className="flex items-center space-x-4 p-3 bg-white rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all duration-200 cursor-pointer">
                    <div className="flex-shrink-0 relative">
                      <div className="bg-gradient-to-br from-green-400 to-teal-600 rounded-xl w-12 h-12 flex items-center justify-center text-white font-bold">VNG</div>
                      <div className="absolute -top-1 -right-1 flex items-center justify-center h-5 w-5 rounded-full bg-yellow-400 border-2 border-white">
                        <svg className="h-3 w-3 text-yellow-800" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 truncate">VNG Corporation</h3>
                      <p className="text-gray-600 text-sm truncate">Công nghệ & Truyền thông</p>
                      <div className="mt-1 flex items-center text-sm text-gray-500">
                        <svg className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                        </svg>
                        1.8k người theo dõi
                      </div>
                    </div>
                  </div>
                  
                  <button className="w-full py-3 text-center text-indigo-600 hover:text-indigo-800 font-medium bg-white rounded-xl border border-indigo-200 hover:border-indigo-300 hover:shadow-sm transition-all duration-200 flex items-center justify-center">
                    <span>Xem tất cả công ty hàng đầu</span>
                    <svg className="ml-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            
            {/* Right column - 2 rows (30% width) */}
            <div className="lg:col-span-1 space-y-8">
              {/* Contact Information */}
              <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Thông tin liên hệ</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 flex items-center">
                      <svg className="h-5 w-5 mr-1 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Địa chỉ
                    </label>
                    <p className="mt-1 text-gray-600 break-words overflow-hidden">{company.location || 'Chưa cập nhật địa chỉ'}</p>
                  </div>
                  
                  {/* Social media links */}
                  {(company.facebook || company.youtube || company.linkedin || company.twitter || company.instagram) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-900 flex items-center mb-2">
                        <svg className="h-5 w-5 mr-1 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                        Mạng xã hội
                      </label>
                      <div className="flex flex-wrap gap-3 mt-2">
                        {company.facebook && (
                          <a 
                            href={company.facebook} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition duration-300 ease-in-out transform hover:scale-110"
                          >
                            <span className="sr-only">Facebook</span>
                            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                            </svg>
                          </a>
                        )}
                        {company.youtube && (
                          <a 
                            href={company.youtube} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="flex items-center justify-center w-10 h-10 rounded-full bg-red-600 text-white hover:bg-red-700 transition duration-300 ease-in-out transform hover:scale-110"
                          >
                            <span className="sr-only">YouTube</span>
                            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
                            </svg>
                          </a>
                        )}
                        {company.linkedin && (
                          <a 
                            href={company.linkedin} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-700 text-white hover:bg-blue-800 transition duration-300 ease-in-out transform hover:scale-110"
                          >
                            <span className="sr-only">LinkedIn</span>
                            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                            </svg>
                          </a>
                        )}
                        {company.twitter && (
                          <a 
                            href={company.twitter} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="flex items-center justify-center w-10 h-10 rounded-full bg-black text-white hover:bg-black transition duration-300 ease-in-out transform hover:scale-110"
                          >
                            <span className="sr-only">Twitter</span>                            
                            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                            </svg>
                          </a>
                        )}
                        {company.instagram && (
                          <a 
                            href={company.instagram} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 text-white hover:bg-gradient-to-r hover:from-purple-600 hover:to-pink-700 transition duration-300 ease-in-out transform hover:scale-110"
                          >
                            <span className="sr-only">Instagram</span>
                            <svg xmlns="http://www.w3.org/2000/svg" aria-label="Instagram" role="img"
                                viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                              <rect x="2.5" y="2.5" width="19" height="19" rx="5"/>
                              <circle cx="12" cy="12" r="4.5"/>
                              <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none"/>
                            </svg>
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                
                  {/* Map placeholder */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 flex items-center mb-2">
                      <svg className="h-5 w-5 mr-1 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                      Bản đồ
                    </label>
                    <div className="bg-gray-200 border-2 border-dashed rounded-xl w-full h-48 flex items-center justify-center text-gray-500">
                      Bản đồ sẽ hiển thị ở đây
                    </div>
                  </div>
                </div>
              </div>

              {/* Share section */}
              <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">                
                <h2 className="text-xl font-bold text-gray-900 mb-4">Chia sẻ công ty với bạn bè</h2>
                
                <div className="space-y-4">
                  {/* URL sharing */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Liên kết chia sẻ</label>
                    <div className="flex items-center">
                      <input 
                        type="text" 
                        value={window.location.href} 
                        readOnly 
                        className="flex-1 min-w-0 px-3 py-2 text-sm border border-gray-300 rounded-l-md bg-gray-50 truncate"
                      />
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(window.location.href);
                          // Optional: Show a notification that the URL was copied
                        }}
                        className="cursor-pointer inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 text-sm font-medium rounded-r-md text-gray-700 bg-gray-50 hover:bg-gray-100"
                      >
                        <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  {/* Social sharing */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Chia sẻ lên mạng xã hội</label>
                    <div className="flex space-x-3">
                      <a 
                        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center h-10 w-10 rounded-full text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                      >
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                        </svg>
                      </a>
                      <a 
                        href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center h-10 w-10 rounded-full text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200"
                      >
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                      </a>
                      <a 
                        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center h-10 w-10 rounded-full text-white bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                      >
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                      </svg>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyDetail;
