import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { LuRefreshCw, LuStar, LuTrendingUp, LuFilter, LuX, LuLoader } from 'react-icons/lu';
import { searchCandidates, downloadCandidateCV, type CandidateCV } from '../../api/recruiterCVService';
import CVPreviewModal from '../../components/cv/CVPreviewModal';
import aiGenerationService from '../../services/aiGenerationService';
import { getAllJobs, type Job } from '../../api/jobService';
import { useUser } from '../../contexts/UserContext';

const CandidateSearch: React.FC = () => {
  const { company } = useUser();
  const [candidates, setCandidates] = useState<CandidateCV[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [previewCvId, setPreviewCvId] = useState<number | null>(null);
  const [showCVPreviewModal, setShowCVPreviewModal] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewMimeType, setPreviewMimeType] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'recommended'>('recommended');
  const [showFilters, setShowFilters] = useState(false);
  const itemsPerPage = 12;
  
  // AI Matching state
  const [showMatchingModal, setShowMatchingModal] = useState(false);
  const [selectedCvForMatching, setSelectedCvForMatching] = useState<CandidateCV | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [matchingResult, setMatchingResult] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const fetchCandidates = useCallback(async () => {
    try {
      setLoading(true);
      const response = await searchCandidates({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm
      });

      let sortedCandidates = [...response.data];
      
      // Advanced recommendation algorithm
      if (sortBy === 'newest') {
        sortedCandidates.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      } else if (sortBy === 'popular') {
        sortedCandidates.sort((a, b) => (b.file_size || 0) - (a.file_size || 0));
      } else if (sortBy === 'recommended') {
        // Advanced recommendation scoring algorithm
        sortedCandidates.sort((a, b) => {
          const now = Date.now();
          const dayInMs = 24 * 60 * 60 * 1000;
          
          // Calculate recency score (0-50 points, newer is better)
          const aRecency = Math.max(0, 50 - ((now - new Date(a.created_at).getTime()) / dayInMs));
          const bRecency = Math.max(0, 50 - ((now - new Date(b.created_at).getTime()) / dayInMs));
          
          // Template CV bonus (100 points)
          const aTemplateBonus = a.is_template ? 100 : 0;
          const bTemplateBonus = b.is_template ? 100 : 0;
          
          // Quality score based on file size (0-30 points)
          const aQuality = Math.min(30, (a.file_size || 0) / 100000);
          const bQuality = Math.min(30, (b.file_size || 0) / 100000);
          
          // Completeness score (20 points if has file)
          const aCompleteness = a.file_name ? 20 : 0;
          const bCompleteness = b.file_name ? 20 : 0;
          
          // Calculate total scores
          const aScore = aTemplateBonus + aRecency + aQuality + aCompleteness;
          const bScore = bTemplateBonus + bRecency + bQuality + bCompleteness;
          
          return bScore - aScore;
        });
      }

      setCandidates(sortedCandidates);
      setTotalPages(response.pagination.totalPages);
      setTotalItems(response.pagination.total);
    } catch (error) {
      console.error('Error fetching candidates:', error);
      toast.error('Không thể tải danh sách ứng viên');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, sortBy]);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  // Fetch recruiter's jobs for matching
  useEffect(() => {
    const fetchJobs = async () => {
      if (!company?.id) return;
      try {
        const response = await getAllJobs(1, 100, '', company.id.toString());
        setJobs(response.jobs.filter(job => job.status === 'approved'));
      } catch (error) {
        console.error('Error fetching jobs:', error);
      }
    };
    fetchJobs();
  }, [company?.id]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchCandidates();
  };

  const handleReload = () => {
    setSearchTerm('');
    setCurrentPage(1);
    fetchCandidates();
  };

  const handleAnalyzeMatch = async (cv: CandidateCV) => {
    setSelectedCvForMatching(cv);
    setShowMatchingModal(true);
    setMatchingResult(null);
    setSelectedJobId(null);
  };

  const handleRunMatching = async () => {
    if (!selectedJobId || !selectedCvForMatching) return;
    
    try {
      setIsAnalyzing(true);
      const result = await aiGenerationService.analyzeJobCVMatching(
        selectedJobId,
        selectedCvForMatching.id
      );
      setMatchingResult(result);
      toast.success('Phân tích độ phù hợp thành công!');
    } catch (error: any) {
      toast.error(error.message || 'Không thể phân tích độ phù hợp');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDownloadCV = async (cv: CandidateCV) => {
    try {
      setDownloadingId(cv.id);
      const blob = await downloadCandidateCV(cv.id);
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = cv.file_name || `${cv.title}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Tải CV thành công');
    } catch (error) {
      console.error('Error downloading CV:', error);
      toast.error('Không thể tải CV');
    } finally {
      setDownloadingId(null);
    }
  };

  const handlePreviewCV = (cv: CandidateCV) => {
    try {
      // If it's a template CV, use the CVPreviewModal (no file download needed)
      if (cv.is_template || cv.template_id) {
        setPreviewCvId(cv.id);
        setShowCVPreviewModal(true);
      } else {
        // For uploaded file CVs, use file_url directly
        if (cv.file_url) {
          setPreviewUrl(cv.file_url);
          setPreviewMimeType(cv.mime_type || null);
          setPreviewCvId(cv.id);
        } else {
          toast.error('Không tìm thấy file CV');
        }
      }
    } catch (error) {
      console.error('Error previewing CV:', error);
      toast.error('Không thể xem trước CV');
      setPreviewCvId(null);
    }
  };

  const handleClosePreview = () => {
    setShowCVPreviewModal(false);
    setPreviewCvId(null);
    setPreviewUrl(null);
    setPreviewMimeType(null);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-8 text-white mb-6">
        <div className="flex items-center gap-3 mb-2">
          <LuStar className="h-8 w-8" />
          <h1 className="text-3xl font-bold">Ứng viên nổi bật</h1>
        </div>
        <p className="text-blue-100 text-lg">
          Khám phá những ứng viên xuất sắc được đề xuất dành riêng cho bạn
        </p>
        <div className="mt-6 flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
            <LuTrendingUp className="h-5 w-5" />
            <span className="font-semibold">{totalItems}</span>
            <span className="text-blue-100">ứng viên phù hợp</span>
          </div>
        </div>
      </div>

      {/* Sort and Filter Bar */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Sắp xếp:</span>
            <div className="flex gap-2">
              <button
                onClick={() => setSortBy('recommended')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  sortBy === 'recommended'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <LuStar className="inline h-4 w-4 mr-1" />
                Đề xuất
              </button>
              <button
                onClick={() => setSortBy('newest')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  sortBy === 'newest'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Mới nhất
              </button>
              <button
                onClick={() => setSortBy('popular')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  sortBy === 'popular'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Phổ biến
              </button>
            </div>
          </div>
          <div className="flex-1"></div>
          <button
            onClick={handleReload}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LuRefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1 relative">
            <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm theo tên ứng viên, email, kỹ năng, vị trí..."
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
            />
          </div>
          <button
            type="submit"
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm hover:shadow-md"
          >
            Tìm kiếm
          </button>
        </form>
      </div>

      {/* Candidates Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white border border-gray-100 p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : candidates.length === 0 ? (
        <div className="bg-white border border-gray-100 p-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Không tìm thấy ứng viên</h3>
          <p className="mt-1 text-sm text-gray-500">
            Thử tìm kiếm với từ khóa khác
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {candidates.map((candidate) => (
            <div
              key={candidate.id}
              className={`bg-white border rounded-xl hover:shadow-xl transition-all p-6 group flex flex-col relative overflow-hidden ${
                candidate.is_template
                  ? 'border-yellow-300 shadow-lg ring-2 ring-yellow-100'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              {/* Featured Badge */}
              {candidate.is_template && (
                <div className="absolute top-0 right-0">
                  <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-1 text-xs font-bold flex items-center gap-1 rounded-bl-lg">
                    <LuStar className="h-3 w-3" />
                    NỔI BẬT
                  </div>
                </div>
              )}
              
              {/* Candidate Info */}
              <div className="mb-4 flex-grow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 pr-2">
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-1">
                      {candidate.title}
                    </h3>
                    {candidate.is_template && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
                        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                          <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                        </svg>
                        CV Template
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex items-center">
                    <svg
                      className="h-4 w-4 mr-2 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    <span className="font-medium">{candidate.user_name}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <svg
                      className="h-4 w-4 mr-2 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    <span className="truncate">{candidate.user_email}</span>
                  </div>
                </div>
              </div>

              {/* CV Details */}
              <div className="border-t border-gray-100 pt-4 mb-4 space-y-2 text-xs text-gray-500">
                <div className="flex justify-between">
                  <span>Ngày tạo:</span>
                  <span className="font-medium">{formatDate(candidate.created_at)}</span>
                </div>
                {candidate.file_size && (
                  <div className="flex justify-between">
                    <span>Kích thước:</span>
                    <span className="font-medium">{formatFileSize(candidate.file_size)}</span>
                  </div>
                )}
                {candidate.mime_type && (
                  <div className="flex justify-between">
                    <span>Định dạng:</span>
                    <span className="font-medium uppercase">
                      {candidate.mime_type.split('/')[1]}
                    </span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="space-y-2 mt-auto">
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePreviewCV(candidate)}
                    className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm flex items-center justify-center gap-2"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Xem trước
                  </button>
                  <button
                    onClick={() => handleDownloadCV(candidate)}
                    disabled={downloadingId === candidate.id}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {downloadingId === candidate.id ? (
                      <>
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Đang tải...
                      </>
                    ) : (
                      <>
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Tải CV
                      </>
                    )}
                  </button>
                </div>
                <button
                  onClick={() => handleAnalyzeMatch(candidate)}
                  className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all font-medium text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Phân tích độ phù hợp AI
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Trước
          </button>
          
          <div className="flex gap-2">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    currentPage === pageNum
                      ? 'bg-blue-600 text-white'
                      : 'border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Sau
          </button>
        </div>
      )}

      {/* AI Matching Modal */}
      {showMatchingModal && selectedCvForMatching && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Phân tích độ phù hợp AI</h3>
                  <p className="text-sm text-gray-500">{selectedCvForMatching.title}</p>
                </div>
              </div>
              <button
                onClick={() => setShowMatchingModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <LuX className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {!matchingResult ? (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      💡 Chọn một công việc để phân tích độ phù hợp với CV này
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Chọn công việc
                    </label>
                    <select
                      value={selectedJobId || ''}
                      onChange={(e) => setSelectedJobId(Number(e.target.value))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">-- Chọn công việc --</option>
                      {jobs.map(job => (
                        <option key={job.id} value={job.id}>
                          {job.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  {jobs.length === 0 && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        ⚠️ Bạn chưa có công việc nào được duyệt. Vui lòng tạo và duyệt công việc trước.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-semibold text-green-900 mb-2">✅ Phân tích hoàn tất</h4>
                    <pre className="whitespace-pre-wrap text-sm text-green-800 font-mono">
                      {JSON.stringify(matchingResult, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  setShowMatchingModal(false);
                  setMatchingResult(null);
                  setSelectedJobId(null);
                }}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Đóng
              </button>
              {!matchingResult && (
                <button
                  onClick={handleRunMatching}
                  disabled={!selectedJobId || isAnalyzing}
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isAnalyzing ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Đang phân tích...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      Phân tích với AI
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CV Preview Modal for Template CVs */}
      {showCVPreviewModal && previewCvId && (
        <CVPreviewModal
          isOpen={showCVPreviewModal}
          onClose={handleClosePreview}
          cvId={previewCvId}
        />
      )}

      {/* Simple Image/PDF Preview Modal */}
      {previewUrl && previewCvId && !showCVPreviewModal && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Overlay */}
          <div className="absolute inset-0 bg-black opacity-80 transition-opacity"></div>
          
          {/* Content */}
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <button
              onClick={handleClosePreview}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
            >
              <LuX className="h-8 w-8" />
            </button>
            
            <div className="relative max-w-7xl max-h-full w-full h-full flex items-center justify-center">
              {previewMimeType?.includes('image') ? (
                <img
                  src={previewUrl}
                  alt="CV Preview"
                  className="max-w-full max-h-full object-contain"
                  onError={(e) => {
                    console.error('Image load error:', previewUrl);
                  }}
                />
              ) : (
                <iframe
                  src={previewUrl}
                  className="w-full h-full bg-white rounded"
                  title="CV Preview"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidateSearch;
