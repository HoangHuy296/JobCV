import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { toast } from 'react-toastify';
import { formatDate } from '../../utils/dateUtils';
import { useNavigate } from 'react-router-dom';
import { useIndustryContext } from '../../contexts/IndustryContext';
import { useLocationContext } from '../../contexts/LocationContext';
import { getAllJobs, type Job } from '../../api/jobService';
import SelectWithSearch from '../../components/common/SelectWithSearch';

const YEARS_EXPERIENCE_OPTIONS = [
  { value: '0', label: 'Không yêu cầu kinh nghiệm' },
  { value: '1', label: '1 năm' },
  { value: '2', label: '2 năm' },
  { value: '3', label: '3 năm' },
  { value: '5', label: '5 năm' },
  { value: '7', label: '7+ năm' }
];

const SALARY_RANGES = [
  { value: 'all', label: 'Tất cả mức lương' },
  { value: 'negotiable', label: 'Thỏa thuận' },
  { value: 'under_10', label: 'Dưới 10 triệu' },
  { value: '10_15', label: '10 - 15 triệu' },
  { value: '15_20', label: '15 - 20 triệu' },
  { value: '20_30', label: '20 - 30 triệu' },
  { value: 'above_30', label: 'Trên 30 triệu' }
];

const JobListing: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedSalary, setSelectedSalary] = useState('all');
  const [selectedExperience, setSelectedExperience] = useState('');
  const { industries } = useIndustryContext();
  const { locations: contextLocations } = useLocationContext();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [processedLocations, setProcessedLocations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  
  const [currentPage, setCurrentPage] = useState(1);
  const jobsPerPage = 6;
  
  // Filter type state
  const [activeFilterType, setActiveFilterType] = useState<'location' | 'salary' | 'experience' | 'industry'>('location');
  const filterScrollRef = useRef<HTMLDivElement>(null);
  
  // Process locations from context
  useEffect(() => {
    if (contextLocations.length > 0) {
      // Process locations to get only the last part after splitting by comma
      const processed = contextLocations.map((location: string) => {
        const parts = location.split(',').map((part: string) => part.trim());
        return parts[parts.length - 1]; // Get the last part
      });
      // Remove duplicates that might occur after processing
      const uniqueLocations = [...new Set(processed)];
      setProcessedLocations(uniqueLocations);
    }
  }, [contextLocations]);
  
  // Fetch jobs
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        const response = await getAllJobs(
          currentPage, 
          jobsPerPage, 
          searchTerm, 
          '', // company filter
          selectedLocation, 
          selectedIndustry,
          { role: 'guest' } // Explicitly pass 'guest' role
        );
        
        // Filter by years of experience if selected
        let filteredJobs = response.jobs;
        if (selectedExperience) {
          const expValue = parseInt(selectedExperience);
          filteredJobs = filteredJobs.filter(job => 
            job.years_experienced <= expValue && 
            job.years_experienced > (expValue - 1)
          );
        }
        
        // Filter by salary range if selected
        if (selectedSalary !== 'all') {
          filteredJobs = filteredJobs.filter(job => {
            const salaryStr = job.salary?.toLowerCase() || '';
            
            // Check for negotiable salary
            if (selectedSalary === 'negotiable') {
              return salaryStr.includes('thỏa thuận') || salaryStr.includes('thoả thuận') || salaryStr.includes('deal') || salaryStr.includes('协商');
            }
            
            // Extract numbers from salary string (e.g., "10-15 triệu", "Từ 20 triệu", "Trên 30 triệu")
            const numbers = salaryStr.match(/\d+/g);
            if (!numbers || numbers.length === 0) {
              return false; // No numbers found, exclude from filter
            }
            
            // Parse salary range
            const salaryNumbers = numbers.map(n => parseInt(n));
            let minSalary = Math.min(...salaryNumbers);
            let maxSalary = Math.max(...salaryNumbers);
            
            // If only one number, use it as both min and max
            if (salaryNumbers.length === 1) {
              minSalary = maxSalary = salaryNumbers[0];
            }
            
            // Apply filter based on selected range
            switch (selectedSalary) {
              case 'under_10':
                return maxSalary < 10;
              case '10_15':
                return (minSalary >= 10 && minSalary < 15) || (maxSalary >= 10 && maxSalary <= 15) || (minSalary < 10 && maxSalary > 15);
              case '15_20':
                return (minSalary >= 15 && minSalary < 20) || (maxSalary >= 15 && maxSalary <= 20) || (minSalary < 15 && maxSalary > 20);
              case '20_30':
                return (minSalary >= 20 && minSalary < 30) || (maxSalary >= 20 && maxSalary <= 30) || (minSalary < 20 && maxSalary > 30);
              case 'above_30':
                return minSalary >= 30;
              default:
                return true;
            }
          });
        }
        
        setJobs(filteredJobs);
        setTotalPages(response.pagination.totalPages);
        setTotalItems(response.pagination.total);
      } catch (err) {
        setError('Không thể tải danh sách công việc');
        console.error('Error fetching jobs:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchJobs();
  }, [currentPage, searchTerm, selectedIndustry, selectedLocation, selectedSalary, selectedExperience]);
  
  // Memoize pagination array to prevent unnecessary re-renders
  const paginationArray = useMemo(() => 
    Array.from({ length: totalPages }, (_, i) => i + 1), 
    [totalPages]);
  
  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page when searching
  }, []);
  
  const handleViewDetail = (job: Job) => {
    const encodedUrl = btoa(job.id.toString());
    navigate(`/viec-lam/${encodedUrl}`);
  };
  
  return (
    <div>
      {/* Banner Section */}
      <div className="mt-[-32px] mb-8 bg-gradient-to-r from-blue-400 to-indigo-500 text-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6">
            Tìm kiếm tin tuyển dụng mơ ước của bạn
          </h1>
          <p className="max-w-3xl mx-auto mb-10 text-blue-100">
            Khám phá hàng ngàn cơ hội việc làm hấp dẫn từ các công ty hàng đầu. 
            Tìm kiếm tin tuyển dụng phù hợp với kỹ năng và mong muốn của bạn ngay hôm nay.
          </p>
          
          {/* Prominent Search Bar */}
          <div className="max-w-3xl mx-auto px-4">
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 bg-white/20 backdrop-blur-sm p-2 rounded-xl shadow-2xl border border-white/30">
              <div className="flex-grow">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm kiếm tin tuyển dụng, vị trí, công ty..."
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
      
      {/* Filter Section */}
      <div className="mb-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center md:flex-row gap-6">
            {/* Filter Type Selector (Left Side) - With Background */}
            <div className="md:w-1/3">
              <div className="bg-white rounded-xl shadow-md p-6 h-full">                
                <div className="flex items-center space-x-3">
                  <label htmlFor="filterType" className="flex items-center text-sm font-medium text-gray-700 whitespace-nowrap">
                    <svg className="w-4 h-4 mr-1.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
                    </svg>
                    Lọc theo:
                  </label>
                  <div className="flex-1">
                    <SelectWithSearch
                      options={[
                        { value: 'location', label: 'Địa điểm' },
                        { value: 'salary', label: 'Mức lương' },
                        { value: 'experience', label: 'Kinh nghiệm' },
                        { value: 'industry', label: 'Ngành nghề' }
                      ]}
                      selectedValues={[activeFilterType]}
                      onChange={(values: string[]) => {
                        if (values.length > 0) {
                          setActiveFilterType(values[0] as 'location' | 'salary' | 'experience' | 'industry');
                        }
                      }}
                      placeholder="Chọn loại bộ lọc"
                      multiple={false}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Filter Options (Right Side with Horizontal Scroll) - No Background */}
            <div className="md:w-2/3 relative">              
              <div className="relative">
                {/* Left Arrow */}
                <button 
                  onClick={() => {
                    if (filterScrollRef.current) {
                      filterScrollRef.current.scrollLeft -= 200;
                    }
                  }}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full shadow-md p-2.5 hover:bg-gray-50 hover:shadow-lg transition-all duration-200 border border-gray-100 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  aria-label="Scroll left"
                >
                  <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                {/* Scrollable Options - Fixed scrollbar gap issue */}
                <div 
                  ref={filterScrollRef}
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
                    .filter-scroll::-webkit-scrollbar {
                      display: none;
                      width: 0;
                      height: 0;
                    }
                  `}} />
                  <div className="flex space-x-3 min-w-max filter-scroll">
                    {/* Location Options */}
                    {activeFilterType === 'location' && (
                      <>
                        <button 
                          onClick={() => {
                            setSelectedLocation('');
                            setCurrentPage(1);
                          }}
                          className={`whitespace-nowrap px-4 py-2.5 rounded-full text-sm font-medium border transition-all duration-200 flex items-center justify-center min-h-[40px] cursor-pointer transform hover:scale-105 ${selectedLocation === '' ? 'bg-blue-500 text-white border-blue-500 shadow-md' : 'bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-gray-200 shadow-sm'}`}
                        >
                          <span className="flex items-center">
                            <span>Tất cả địa điểm</span>
                            {selectedLocation === '' && (
                              <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </span>
                        </button>
                        {processedLocations.map((location: string, index: number) => (
                          <button 
                            key={index} 
                            onClick={() => {
                              setSelectedLocation(location);
                              setCurrentPage(1);
                            }}
                            className={`whitespace-nowrap px-4 py-2.5 rounded-full text-sm font-medium border transition-all duration-200 flex items-center justify-center min-h-[40px] cursor-pointer transform hover:scale-105 ${selectedLocation === location ? 'bg-blue-500 text-white border-blue-500 shadow-md' : 'bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-gray-200 shadow-sm'}`}
                          >
                            <span className="flex items-center">
                              <span>{location}</span>
                              {selectedLocation === location && (
                                <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </span>
                          </button>
                        ))}
                      </>
                    )}
                    
                    {/* Salary Options */}
                    {activeFilterType === 'salary' && (
                      <>
                        {SALARY_RANGES.map((range) => (
                          <button 
                            key={range.value} 
                            onClick={() => {
                              setSelectedSalary(range.value);
                              setCurrentPage(1);
                            }}
                            className={`whitespace-nowrap px-4 py-2.5 rounded-full text-sm font-medium border transition-all duration-200 flex items-center justify-center min-h-[40px] cursor-pointer transform hover:scale-105 ${selectedSalary === range.value ? 'bg-blue-500 text-white border-blue-500 shadow-md' : 'bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-gray-200 shadow-sm'}`}
                          >
                            <span className="flex items-center">
                              <span>{range.label}</span>
                              {selectedSalary === range.value && (
                                <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </span>
                          </button>
                        ))}
                      </>
                    )}
                    
                    {/* Experience Options */}
                    {activeFilterType === 'experience' && (
                      <>
                        <button 
                          onClick={() => {
                            setSelectedExperience('');
                            setCurrentPage(1);
                          }}
                          className={`whitespace-nowrap px-4 py-2.5 rounded-full text-sm font-medium border transition-all duration-200 flex items-center justify-center min-h-[40px] cursor-pointer transform hover:scale-105 ${selectedExperience === '' ? 'bg-blue-500 text-white border-blue-500 shadow-md' : 'bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-gray-200 shadow-sm'}`}
                        >
                          <span className="flex items-center">
                            <span>Tất cả kinh nghiệm</span>
                            {selectedExperience === '' && (
                              <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </span>
                        </button>
                        {YEARS_EXPERIENCE_OPTIONS.map((option) => (
                          <button 
                            key={option.value} 
                            onClick={() => {
                              setSelectedExperience(option.value);
                              setCurrentPage(1);
                            }}
                            className={`whitespace-nowrap px-4 py-2.5 rounded-full text-sm font-medium border transition-all duration-200 flex items-center justify-center min-h-[40px] cursor-pointer transform hover:scale-105 ${selectedExperience === option.value ? 'bg-blue-500 text-white border-blue-500 shadow-md' : 'bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-gray-200 shadow-sm'}`}
                          >
                            <span className="flex items-center">
                              <span>{option.label}</span>
                              {selectedExperience === option.value && (
                                <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </span>
                          </button>
                        ))}
                      </>
                    )}
                    
                    {/* Industry Options */}
                    {activeFilterType === 'industry' && (
                      <>
                        <button 
                          onClick={() => {
                            setSelectedIndustry('');
                            setCurrentPage(1);
                          }}
                          className={`whitespace-nowrap px-4 py-2.5 rounded-full text-sm font-medium border transition-all duration-200 flex items-center justify-center min-h-[40px] cursor-pointer transform hover:scale-105 ${selectedIndustry === '' ? 'bg-blue-500 text-white border-blue-500 shadow-md' : 'bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-gray-200 shadow-sm'}`}
                        >
                          <span className="flex items-center">
                            <span>Tất cả ngành nghề</span>
                            {selectedIndustry === '' && (
                              <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </span>
                        </button>
                        {industries.map((industry) => (
                          <button 
                            key={industry.id} 
                            onClick={() => {
                              setSelectedIndustry(industry.name);
                              setCurrentPage(1);
                            }}
                            className={`whitespace-nowrap px-4 py-2.5 rounded-full text-sm font-medium border transition-all duration-200 flex items-center justify-center min-h-[40px] cursor-pointer transform hover:scale-105 ${selectedIndustry === industry.name ? 'bg-blue-500 text-white border-blue-500 shadow-md' : 'bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-gray-200 shadow-sm'}`}
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
                      </>
                    )}
                  </div>
                </div>
                
                {/* Right Arrow */}
                <button 
                  onClick={() => {
                    if (filterScrollRef.current) {
                      filterScrollRef.current.scrollLeft += 200;
                    }
                  }}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full shadow-md p-2.5 hover:bg-gray-50 hover:shadow-lg transition-all duration-200 border border-gray-100 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  aria-label="Scroll right"
                >
                  <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Job Listings */}
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Danh sách việc làm</h2>
        
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
                <div className="p-6">
                  <div className="animate-pulse">
                    <div className="h-5 bg-gray-200 rounded w-3/4 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
                    <div className="space-y-2 mb-6">
                      <div className="h-3 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                    </div>
                    <div className="flex justify-between">
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
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
        ) : jobs.length === 0 ? (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-12 text-center max-w-2xl mx-auto border border-blue-100">
            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-white shadow-md mb-6">
              <svg className="h-10 w-10 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Không tìm thấy việc làm</h3>
            <p className="text-gray-600 mb-6">Không có việc làm nào phù hợp với tìm kiếm của bạn. Hãy thử với từ khóa khác hoặc bỏ bớt bộ lọc.</p>
            {(searchTerm || selectedIndustry || selectedLocation || selectedSalary !== 'all' || selectedExperience) 
              && <button 
                onClick={() => {
                  setSearchTerm('');
                  setSelectedIndustry('');
                  setSelectedLocation('');
                  setSelectedSalary('all');
                  setSelectedExperience('');
                }}
                className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-300 cursor-pointer"
              >
                Xem tất cả việc làm
              </button>
            }
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {jobs.map((job) => (
                <div 
                  key={job.id} 
                  className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-blue-300 group transform hover:-translate-y-1 flex flex-col"
                >
                  <div className="p-6 flex flex-col flex-1">
                    {/* Header: Logo + Title + Company */}
                    <div className="flex items-start">
                      <div className="flex-shrink-0 h-16 w-16 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center border-2 border-white shadow-md">
                        {job.company_logo ? (
                          <img 
                            src={job.company_logo} 
                            alt={job.company_name} 
                            className="h-12 w-12 rounded-lg object-cover"
                          />
                        ) : (
                          <span className="text-2xl font-bold text-blue-600 bg-white rounded-lg h-12 w-12 flex items-center justify-center">
                            {job.company_name?.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div className="ml-4 flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors duration-200"
                          title={job.title}
                        >
                          {job.title}
                        </h3>
                        <p className="text-blue-600 font-medium mt-1">{job.company_name}</p>
                      </div>
                    </div>
                    
                    {/* Requirements Section */}
                    <div className="mt-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Yêu cầu:</h4>
                      <div 
                        className="text-gray-600 text-sm line-clamp-3 leading-relaxed" 
                        dangerouslySetInnerHTML={{ __html: job.requirement }}
                      />
                    </div>
                    
                    {/* Chips for Salary and Location */}
                    <div className="flex flex-wrap gap-2 mt-4">
                      {/* Expiration Date - Only show if available */}
                      {job.date_end_register && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
                          <svg className="mr-1 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Hạn nộp: {formatDate(job.date_end_register)}</span>
                        </span>
                      )}
                      
                      {/* Location - Show only the last part after splitting by comma */}
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                        <svg className="mr-1 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {job.location ? job.location.split(',').map(part => part.trim()).pop() : 'Không xác định'}
                      </span>
                    </div>
                    
                    {/* See Detail Button with Border */}
                    <div className="mt-auto pt-4 border-t border-gray-100 flex justify-end">
                      <button 
                        onClick={() => handleViewDetail(job)}
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
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === totalPages ? 'z-10 bg-blue-50 border-blue-500 text-blue-600' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer'}`}
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
                Hiển thị {jobs.length > 0 ? (currentPage - 1) * jobsPerPage + 1 : 0} đến {Math.min(currentPage * jobsPerPage, totalItems)} trong tổng số {totalItems} việc làm
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default JobListing;
