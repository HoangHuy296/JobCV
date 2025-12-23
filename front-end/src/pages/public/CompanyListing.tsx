import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIndustryContext } from '../../contexts/IndustryContext';
import { getAllCompanies, type Company } from '../../api/companyService';

const CompanyListing: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const { industries } = useIndustryContext();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  
  const [currentPage, setCurrentPage] = useState(1);
  const companiesPerPage = 4;
  
  // Industry filter scrolling state
  const [scrollPosition, setScrollPosition] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Function to handle navigation to company detail page
  const handleViewDetail = (company: Company) => {
    const encodedUrl = btoa(company.id.toString());
    navigate(`/cong-ty/${encodedUrl}`);
  };
  
  // Update scroll position when user manually scrolls
  useEffect(() => {
    const handleScroll = () => {
      if (scrollRef.current) {
        setScrollPosition(scrollRef.current.scrollLeft);
      }
    };
    
    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener('scroll', handleScroll);
      return () => scrollElement.removeEventListener('scroll', handleScroll);
    }
  }, []);
  
  // Fetch companies
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setLoading(true);
        const response = await getAllCompanies(currentPage, companiesPerPage, searchTerm, selectedIndustry);
        setCompanies(response.companies);
        setTotalPages(response.pagination.totalPages);
        setTotalItems(response.pagination.total);
      } catch (err) {
        setError('Không thể tải danh sách công ty');
        console.error('Error fetching companies:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCompanies();
  }, [currentPage, searchTerm, selectedIndustry]);
  
  const currentCompanies = companies;
  
  // Memoize pagination array to prevent unnecessary re-renders
  const paginationArray = useMemo(() => 
    Array.from({ length: totalPages }, (_, i) => i + 1), 
    [totalPages]);
  
  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page when searching
  }, []);
  
  const handleIndustryFilter = useCallback((industryName: string) => {
    setSelectedIndustry(industryName === selectedIndustry ? '' : industryName);
    setCurrentPage(1); // Reset to first page when filtering
  }, [selectedIndustry]);
  
  // Handle scrolling of industry filter list
  const handleScroll = useCallback((direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      const maxScroll = scrollRef.current.scrollWidth - scrollRef.current.clientWidth;
      
      const newPosition = direction === 'left' 
        ? Math.max(scrollPosition - scrollAmount, 0)
        : Math.min(scrollPosition + scrollAmount, maxScroll);
      
      scrollRef.current.scrollTo({
        left: newPosition,
        behavior: 'smooth'
      });
      
      setScrollPosition(newPosition);
    }
  }, [scrollPosition]);
  
  return (
    <div>
      {/* Banner Section */}
      <div className="mt-[-32px] mb-8 bg-gradient-to-r from-blue-400 to-indigo-500 text-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6">
            Khám phá các công ty hàng đầu Việt Nam
          </h1>
          <p className="max-w-3xl mx-auto mb-10 text-blue-100">
            Đừng bỏ lỡ cơ hội gia nhập những công ty hàng đầu với môi trường làm việc chuyên nghiệp và lộ trình sự nghiệp rõ ràng. 
            Hãy nhanh chóng hành động trước khi cơ hội thuộc về người khác.
          </p>
          
          {/* Prominent Search Bar */}
          <div className="max-w-3xl mx-auto px-4">
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 bg-white/20 backdrop-blur-sm p-2 rounded-xl shadow-2xl border border-white/30">
              <div className="flex-grow">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm kiếm công ty, ngành nghề..."
                  className="w-full px-6 py-4 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent bg-white/80"
                />
              </div>
              <button
                type="submit"
                className="px-8 py-4 bg-white text-indigo-700 font-bold rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-all duration-300 shadow-lg hover:shadow-xl cursor-pointer"
              >
                <span className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Tìm kiếm
                </span>
              </button>
            </form>
          </div>
        </div>
      </div>
      
      {/* Industry Filter */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Ngành nghề phổ biến</h2>
        </div>
        
        <div className="relative">
          {/* Left Arrow */}
          <button 
            onClick={() => handleScroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full shadow-md p-2.5 hover:bg-gray-50 hover:shadow-lg transition-all duration-200 border border-gray-100 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label="Scroll left"
          >
            <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          {/* Scrollable Options - With hidden scrollbar */}
          <div 
            ref={scrollRef}
            className="overflow-x-auto py-2 px-8"
            style={{ 
              scrollBehavior: 'smooth',
              scrollbarWidth: 'none', /* Firefox */
              msOverflowStyle: 'none', /* IE and Edge */
              WebkitOverflowScrolling: 'touch'
            }}
          >
            {/* Custom style to completely hide scrollbar */}
            <style dangerouslySetInnerHTML={{ __html: `
              .industry-scroll::-webkit-scrollbar {
                display: none;
                width: 0;
                height: 0;
              }
            `}} />
            <div className="flex space-x-4 min-w-max industry-scroll">
              {industries.map((industry) => (
                <button
                  key={industry.id}
                  onClick={() => handleIndustryFilter(industry.name)}
                  className={`flex-shrink-0 px-6 py-3 rounded-full text-sm font-medium border whitespace-nowrap cursor-pointer transition-all duration-200 transform hover:scale-105 ${selectedIndustry === industry.name ? 'bg-blue-500 text-white border-blue-500 shadow-md' : 'bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-gray-200 shadow-sm'}`}
                  title={`Filter by ${industry.name}`}
                >
                  <span className="flex items-center">
                    <span>{industry.name}</span>
                    {selectedIndustry === industry.name && (
                      <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </span>
                </button>
              ))}
            </div>
          </div>
          
          {/* Right Arrow */}
          <button 
            onClick={() => handleScroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full shadow-md p-2.5 hover:bg-gray-50 hover:shadow-lg transition-all duration-200 border border-gray-100 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label="Scroll right"
          >
            <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Company Listings */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Các công ty hàng đầu</h2>
        
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
                <div className="p-6">
                  <div className="flex items-start animate-pulse">
                    <div className="h-16 w-16 rounded-lg bg-gray-200"></div>
                    <div className="ml-4 flex-1 space-y-3">
                      <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      <div className="space-y-2">
                        <div className="h-3 bg-gray-200 rounded"></div>
                        <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                      </div>
                      <div className="h-4 bg-gray-200 rounded w-1/4 mt-4"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center max-w-2xl mx-auto">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
              <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="mt-4 text-xl font-medium text-gray-900">Có lỗi xảy ra</h3>
            <p className="mt-2 text-gray-600">{error}</p>
            <div className="mt-6">
              <button 
                onClick={() => window.location.reload()} 
                className="px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-300 cursor-pointer"
              >
                Thử lại
              </button>
            </div>
          </div>
        ) : currentCompanies.length === 0 ? (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-12 text-center max-w-2xl mx-auto border border-blue-100">
            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-white shadow-md mb-6">
              <svg className="h-10 w-10 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Không tìm thấy công ty</h3>
            <p className="text-gray-600 mb-6">Không có công ty nào phù hợp với tìm kiếm của bạn. Hãy thử với từ khóa khác.</p>
            {(searchTerm || selectedIndustry) 
              && <button 
                onClick={() => {
                  setSearchTerm('');
                  setSelectedIndustry('');
                }}
                className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-300 cursor-pointer"
              >
                Xem tất cả công ty
              </button>
            }
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentCompanies.map((company) => (
                <div 
                  key={company.id} 
                  className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-blue-300 group transform hover:-translate-y-1"
                >
                  <div className="p-6">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 h-16 w-16 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center border-2 border-white shadow-md">
                        {company.logo?.url ? (
                          <img 
                            src={company.logo.url} 
                            alt={company.name} 
                            className="h-12 w-12 rounded-lg object-cover"
                          />
                        ) : (
                          <span className="text-2xl font-bold text-blue-600 bg-white rounded-lg h-12 w-12 flex items-center justify-center">
                            {company.name.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div className="ml-4 flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors duration-200"
                          title={company.name}
                        >
                          {company.name}
                        </h3>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {industries
                            .filter(industry => company.industries.includes(industry.id))
                            .slice(0, 2)
                            .map(industry => (
                              <span key={industry.id} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-100 shadow-sm">
                                {industry.name}
                              </span>
                            ))}
                          {industries.filter(industry => company.industries.includes(industry.id)).length > 2 && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 border border-gray-200 shadow-sm">
                              +{industries.filter(industry => company.industries.includes(industry.id)).length - 2}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 mt-4 text-sm line-clamp-3 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: company.description }}></p>
                    
                    <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                      <div className="flex items-center text-sm text-gray-500">
                        <svg className="flex-shrink-0 mr-2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        {company.employees ? (
                          <span>{company.employees} nhân viên</span>
                        ) : (
                          <span>Quy mô nhỏ</span>
                        )}
                      </div>
                      <button 
                        onClick={() => handleViewDetail(company)}
                        className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-semibold cursor-pointer group-hover:translate-x-1 transition-all duration-200 px-3 py-1 rounded-lg hover:bg-blue-50"
                      >
                        Xem chi tiết
                        <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Pagination */}
            <div className="mt-12 flex flex-col items-center">
              <nav className="inline-flex rounded-lg shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center px-4 py-2 rounded-l-md border border-gray-300 text-sm font-medium ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50 cursor-pointer'}`}
                >
                  <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Trước
                </button>
                
                {paginationArray.length <= 7 ? (
                  paginationArray.map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === page ? 'z-10 bg-blue-50 border-blue-500 text-blue-600' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer'}`}
                    >
                      {page}
                    </button>
                  ))
                ) : (
                  // Show first page, current page, and last page with ellipsis
                  <>
                    <button
                      onClick={() => setCurrentPage(1)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === 1 ? 'z-10 bg-blue-50 border-blue-500 text-blue-600' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer'}`}
                    >
                      1
                    </button>
                    
                    {currentPage > 3 && (
                      <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-gray-700">
                        ...
                      </span>
                    )}
                    
                    {currentPage > 2 && currentPage < totalPages - 1 && (
                      <button
                        onClick={() => setCurrentPage(currentPage - 1)}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 cursor-pointer"
                      >
                        {currentPage - 1}
                      </button>
                    )}
                    
                    {currentPage > 1 && currentPage < totalPages && (
                      <button
                        onClick={() => setCurrentPage(currentPage)}
                        className="relative inline-flex items-center px-4 py-2 border border-blue-500 bg-blue-50 text-blue-600 z-10"
                      >
                        {currentPage}
                      </button>
                    )}
                    
                    {currentPage < totalPages - 1 && currentPage > 1 && (
                      <button
                        onClick={() => setCurrentPage(currentPage + 1)}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 cursor-pointer"
                      >
                        {currentPage + 1}
                      </button>
                    )}
                    
                    {currentPage < totalPages - 2 && (
                      <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-gray-700">
                        ...
                      </span>
                    )}
                    
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      className={`relative inline-flex items-center px-4 py-2 rounded-r-md border text-sm font-medium ${currentPage === totalPages ? 'z-10 bg-blue-50 border-blue-500 text-blue-600' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer'}`}
                    >
                      {totalPages}
                    </button>
                  </>
                )}
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className={`relative inline-flex items-center px-4 py-2 rounded-r-md border border-gray-300 text-sm font-medium ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50 cursor-pointer'}`}
                >
                  Sau
                  <svg className="h-5 w-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </nav>
              
              <div className="mt-4 text-sm text-gray-500">
                Hiển thị {(currentPage - 1) * companiesPerPage + 1} đến {Math.min(currentPage * companiesPerPage, totalItems)} trong tổng số {totalItems} công ty
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CompanyListing;
