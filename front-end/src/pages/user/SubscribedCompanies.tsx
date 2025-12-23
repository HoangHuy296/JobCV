import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserSubscribedCompanies, unsubscribeFromCompany, type Company } from '../../api/companyService';
import { toast } from 'react-toastify';
import { formatDate } from '../../utils/dateUtils';
import { LuBell, LuBellOff, LuBuilding2, LuMapPin, LuUsers, LuBriefcase, LuLoader, LuGlobe, LuRefreshCw } from 'react-icons/lu';

interface CompanyWithStats extends Company {
  subscribed_at?: string;
  job_count?: number;
}

const SubscribedCompanies: React.FC = () => {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<CompanyWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  const fetchSubscribedCompanies = useCallback(async (page: number = 1) => {
    try {
      setLoading(true);
      const response = await getUserSubscribedCompanies(page, 9);
      setCompanies(response.companies);
      setPagination(response.pagination);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error fetching subscribed companies:', error);
      toast.error('Không thể tải danh sách công ty đã theo dõi');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscribedCompanies(1);
  }, [fetchSubscribedCompanies]);

  const handleUnsubscribe = async (companyId: number) => {
    try {
      await unsubscribeFromCompany(companyId);
      toast.success('Đã hủy theo dõi công ty');
      fetchSubscribedCompanies(currentPage);
    } catch (error) {
      console.error('Error unsubscribing from company:', error);
      toast.error('Không thể hủy theo dõi công ty');
    }
  };

  const handleViewCompany = (companyId: number) => {
    const encodedCompanyId = btoa(companyId.toString());
    navigate(`/cong-ty/${encodedCompanyId}`);
  };


  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-12">
        <LuLoader className="w-12 h-12 text-blue-600 animate-spin" />
        <p className="mt-4 text-gray-600">Đang tải...</p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <LuBell className="w-8 h-8 text-blue-500" />
              Công ty đã theo dõi
            </h1>
            <p className="mt-2 text-gray-600">
              Quản lý danh sách các công ty bạn đang theo dõi để nhận thông báo về tin tuyển dụng mới
            </p>
          </div>
          
          <button
            onClick={() => fetchSubscribedCompanies(currentPage)}
              disabled={loading}
              className={`p-2 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 cursor-pointer'}`}
              title="Làm mới"
            >
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {companies.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <LuBellOff className="mx-auto h-16 w-16 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            Chưa theo dõi công ty nào
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            Hãy khám phá và theo dõi các công ty bạn quan tâm
          </p>
          <button
            onClick={() => navigate('/cong-ty')}
            className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
          >
            Khám phá công ty
          </button>
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {companies.map((company) => (
              <div
                key={company.id}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden border border-gray-200"
              >
                <div className="p-6">
                  {/* Company Logo */}
                  <div className="flex justify-center mb-4">
                    {company.logo && typeof company.logo === 'object' && company.logo.url ? (
                      <img
                        src={company.logo.url}
                        alt={company.name}
                        className="h-28 w-28 object-cover rounded"
                      />
                    ) : (
                      <div className="h-28 w-28 bg-gray-200 rounded flex items-center justify-center">
                        <LuBuilding2 className="w-14 h-14 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Company Name */}
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 text-center line-clamp-2">
                    {company.name}
                  </h3>

                  {/* Company Info */}
                  <div className="space-y-2 mb-4">
                    {/* Location */}
                    {company.location && (
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <LuMapPin className="w-4 h-4 flex-shrink-0" />
                        <span className="line-clamp-1">{company.location}</span>
                      </p>
                    )}

                    {/* Employees */}
                    {company.employees && (
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <LuUsers className="w-4 h-4 flex-shrink-0" />
                        {company.employees} nhân viên
                      </p>
                    )}

                    {/* Job Count */}
                    {company.job_count !== undefined && company.job_count > 0 && (
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <LuBriefcase className="w-4 h-4 flex-shrink-0" />
                        {company.job_count} việc làm đang tuyển
                      </p>
                    )}

                    {/* Website */}
                    {company.website && (
                      <p className="text-sm text-blue-600 flex items-center gap-2">
                        <LuGlobe className="w-4 h-4 flex-shrink-0" />
                        <a
                          href={company.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline line-clamp-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Website
                        </a>
                      </p>
                    )}

                    {/* Subscribed Date */}
                    {company.subscribed_at && (
                      <p className="text-xs text-gray-500 mt-2">
                        Theo dõi từ: {formatDate(company.subscribed_at)}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewCompany(company.id)}
                      className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium cursor-pointer"
                    >
                      Xem chi tiết
                    </button>
                    <button
                      onClick={() => handleUnsubscribe(company.id)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors cursor-pointer"
                      title="Hủy theo dõi"
                    >
                      <LuBellOff className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="mt-8 flex justify-center items-center gap-2">
              <button
                onClick={() => fetchSubscribedCompanies(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Trước
              </button>
              <span className="text-sm text-gray-700">
                Trang {currentPage} / {pagination.totalPages}
              </span>
              <button
                onClick={() => fetchSubscribedCompanies(currentPage + 1)}
                disabled={currentPage === pagination.totalPages}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Sau
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
};

export default SubscribedCompanies;
