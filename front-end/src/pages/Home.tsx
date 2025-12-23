import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllJobs, type Job } from '../api/jobService';
import { getAllCompanies, type Company } from '../api/companyService';
import { type Industry } from '../api/industryService';
import { LuBriefcase, LuMapPin, LuDollarSign, LuClock, LuBuilding2, LuTrendingUp, LuUsers, LuSearch, LuArrowRight, LuStar } from 'react-icons/lu';
import { toast } from 'react-toastify';
import { parseDate, getDaysDifference } from '../utils/dateUtils';
import { useIndustryContext } from '../contexts/IndustryContext';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { industries, loading: industriesLoading } = useIndustryContext();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchLocation, setSearchLocation] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [jobsData, companiesData] = await Promise.all([
        getAllJobs(1, 6),
        getAllCompanies(1, 8)
      ]);
      setJobs(jobsData.jobs);
      setCompanies(companiesData.companies);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = () => {
    navigate('/dang-ky');
  };

  const handleSearch = () => {
    navigate(`/viec-lam?search=${searchKeyword}&location=${searchLocation}`);
  };

  const formatSalary = (salary: string): string => {
    if (!salary) return 'Thỏa thuận';
    if (salary.includes('-')) {
      const [min, max] = salary.split('-');
      return `${parseInt(min).toLocaleString('vi-VN')} - ${parseInt(max).toLocaleString('vi-VN')} VNĐ`;
    }
    return `${parseInt(salary).toLocaleString('vi-VN')} VNĐ`;
  };

  const formatDate = (dateString: string): string => {
    const diffDays = getDaysDifference(dateString, new Date().toISOString());
    
    if (diffDays === 0) return 'Hôm nay';
    if (diffDays === 1) return 'Hôm qua';
    if (diffDays < 7) return `${diffDays} ngày trước`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} tuần trước`;
    return parseDate(dateString).toLocaleDateString('vi-VN');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <div className="mt-[-32px] relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 py-20">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 drop-shadow-lg">
              Tìm Công Việc Mơ Ước Của Bạn
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto mb-8">
              Khám phá hàng nghìn cơ hội việc làm từ các công ty hàng đầu tại Việt Nam
            </p>
            
            {/* Search Bar */}
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-2xl shadow-2xl p-3 flex flex-col md:flex-row gap-3">
                <div className="flex-1 flex items-center px-4 py-2 bg-gray-50 rounded-xl">
                  <LuSearch className="w-5 h-5 text-gray-400 mr-3" />
                  <input
                    type="text"
                    placeholder="Tên công việc, công ty hoặc từ khóa"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="flex-1 bg-transparent focus:outline-none text-gray-700"
                  />
                </div>
                <div className="flex-1 flex items-center px-4 py-2 bg-gray-50 rounded-xl">
                  <LuMapPin className="w-5 h-5 text-gray-400 mr-3" />
                  <input
                    type="text"
                    placeholder="Địa điểm"
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="flex-1 bg-transparent focus:outline-none text-gray-700"
                  />
                </div>
                <button 
                  onClick={handleSearch}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:shadow-xl"
                >
                  <LuSearch className="w-5 h-5" />
                  Tìm kiếm
                </button>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center border border-white/20">
              <LuBriefcase className="w-8 h-8 text-white mx-auto mb-2" />
              <div className="text-3xl font-bold text-white">{jobs.length}+</div>
              <div className="text-blue-100">Việc làm</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center border border-white/20">
              <LuBuilding2 className="w-8 h-8 text-white mx-auto mb-2" />
              <div className="text-3xl font-bold text-white">{companies.length}+</div>
              <div className="text-blue-100">Công ty</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center border border-white/20">
              <LuUsers className="w-8 h-8 text-white mx-auto mb-2" />
              <div className="text-3xl font-bold text-white">10K+</div>
              <div className="text-blue-100">Ứng viên</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center border border-white/20">
              <LuTrendingUp className="w-8 h-8 text-white mx-auto mb-2" />
              <div className="text-3xl font-bold text-white">95%</div>
              <div className="text-blue-100">Thành công</div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Jobs Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Việc Làm Nổi Bật</h2>
            <p className="text-gray-600">Cơ hội việc làm tốt nhất đang chờ bạn</p>
          </div>
          <button 
            onClick={() => navigate('/viec-lam')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
          >
            Xem tất cả
            <LuArrowRight className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-md animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job) => (
              <div
                key={job.id}
                onClick={() => navigate(`/viec-lam/${btoa(job.id.toString())}`)}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer group border border-gray-100 hover:border-blue-200"
              >
                <div className="p-6">
                  {/* Company Logo */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center flex-shrink-0">
                      {job.company_logo ? (
                        <img src={job.company_logo} alt={job.company_name} className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <svg className="h-10 w-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-1">
                        {job.title}
                      </h3>
                      <p className="text-sm text-gray-600 font-medium">{job.company_name}</p>
                    </div>
                  </div>

                  {/* Job Details */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <LuMapPin className="w-4 h-4 mr-2 text-gray-400" />
                      <span className="truncate">{job.location || 'Chưa cập nhật'}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <LuDollarSign className="w-4 h-4 mr-2 text-gray-400" />
                      <span className="font-semibold text-green-600">{formatSalary(job.salary)}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <LuClock className="w-4 h-4 mr-2 text-gray-400" />
                      <span>{formatDate(job.created_at)}</span>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {job.industry_name && (
                      <span className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-medium rounded-full">
                        {job.industry_name}
                      </span>
                    )}
                    {job.years_experienced > 0 && (
                      <span className="px-3 py-1 bg-purple-50 text-purple-600 text-xs font-medium rounded-full">
                        {job.years_experienced} năm KN
                      </span>
                    )}
                  </div>

                  {/* Action Button */}
                  <button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2.5 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 flex items-center justify-center gap-2">
                    Xem chi tiết
                    <LuArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top Companies Section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Công Ty Hàng Đầu</h2>
              <p className="text-gray-600">Các nhà tuyển dụng uy tín đang tìm kiếm nhân tài</p>
            </div>
            <button 
              onClick={() => navigate('/cong-ty')}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
            >
              Xem tất cả
              <LuArrowRight className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {companies.slice(0, 6).map((company) => (
              <div
                key={company.id}
                onClick={() => navigate(`/cong-ty/${btoa(company.id.toString())}`)}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer group border border-gray-100 hover:border-blue-200"
              >
                <div className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      {company.logo?.url ? (
                        <img src={company.logo.url} alt={company.name} className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        <LuBuilding2 className="w-10 h-10 text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-1">
                        {company.name}
                      </h3>
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <LuMapPin className="w-4 h-4 mr-1" />
                        <span className="line-clamp-1">{company.location}</span>
                      </div>
                    </div>
                  </div>
                  {company.subscription_count && company.subscription_count > 0 && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
                      <LuUsers className="w-4 h-4 text-blue-600" />
                      <span className="font-medium">{company.subscription_count} người theo dõi</span>
                    </div>
                  )}
                  {company.description && (
                    <div 
                      className="text-sm text-gray-600 line-clamp-2 mt-3"
                      dangerouslySetInnerHTML={{ __html: company.description }}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Industries Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Ngành Nghề Phổ Biến</h2>
          <p className="text-gray-600">Khám phá cơ hội việc làm theo ngành nghề</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {industriesLoading ? (
            <div className="col-span-full text-center text-gray-500">Đang tải ngành nghề...</div>
          ) : (
            industries.slice(0, 8).map((industry, index) => {
            const colors = [
              { bg: 'from-blue-500 to-indigo-600', icon: 'text-white' },
              { bg: 'from-purple-500 to-pink-600', icon: 'text-white' },
              { bg: 'from-green-500 to-teal-600', icon: 'text-white' },
              { bg: 'from-orange-500 to-red-600', icon: 'text-white' },
              { bg: 'from-cyan-500 to-blue-600', icon: 'text-white' },
              { bg: 'from-violet-500 to-purple-600', icon: 'text-white' },
              { bg: 'from-emerald-500 to-green-600', icon: 'text-white' },
              { bg: 'from-rose-500 to-pink-600', icon: 'text-white' },
            ];
            const colorScheme = colors[index % colors.length];
            
            return (
              <button
                key={industry.id}
                onClick={() => navigate(`/viec-lam?industry=${industry.id}`)}
                className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-transparent group cursor-pointer overflow-hidden relative"
              >
                <div className="flex flex-col items-center text-center relative z-10">
                  <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${colorScheme.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                    <svg className={`w-8 h-8 ${colorScheme.icon}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 text-base">
                    {industry.name}
                  </h3>
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
            );
          })
          )}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Sẵn Sàng Bắt Đầu Hành Trình Mới?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Tham gia cùng hàng nghìn ứng viên đã tìm được công việc mơ ước
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleRegister}
              className="bg-white text-blue-600 px-8 py-4 rounded-xl font-bold hover:bg-blue-50 transition-all duration-300 shadow-lg hover:shadow-xl cursor-pointer"
            >
              Đăng Ký Ngay
            </button>
            <button
              onClick={() => navigate('/viec-lam')}
              className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-xl font-bold hover:bg-white/10 transition-all duration-300 cursor-pointer"
            >
              Khám Phá Việc Làm
            </button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Tại Sao Chọn Chúng Tôi</h2>
          <p className="text-gray-600">Nền tảng tuyển dụng hàng đầu Việt Nam</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <LuStar className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Nhà Tuyển Dụng Uy Tín
            </h3>
            <p className="text-gray-600">
              Làm việc với các công ty hàng đầu đã được xác minh
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Nền Tảng Bảo Mật</h3>
            <p className="text-gray-600">
              Thông tin cá nhân được bảo vệ tuyệt đối
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <LuTrendingUp className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Phát Triển Sự Nghiệp
            </h3>
            <p className="text-gray-600">
              Cơ hội thăng tiến và phát triển không giới hạn
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
