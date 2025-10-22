import React, { useState } from 'react';
import type { JobVersion } from '../../api/jobVersionService';
import type { JobForEdit } from './JobVersionsModal';

interface ReviewJobVersionModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: JobForEdit | null;
  version: JobVersion | null;
  onApprove: (jobId: number, versionId: number, feedback?: string) => Promise<void>;
  onReject: (jobId: number, versionId: number, feedback: string) => Promise<void>;
  isLoading: boolean;
}

const ReviewJobVersionModal: React.FC<ReviewJobVersionModalProps> = ({
  isOpen,
  onClose,
  job,
  version,
  onApprove,
  onReject,
  isLoading
}) => {
  const [feedback, setFeedback] = useState('');

  if (!isOpen || !job || !version) return null;

  const handleApprove = async () => {
    if (!job || !version) return;
    await onApprove(job.id, version.id, feedback);
  };

  const handleReject = async () => {
    if (!job || !version || !feedback.trim()) return;
    await onReject(job.id, version.id, feedback);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { bg: string; text: string; label: string }> = {
      draft: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Bản nháp' },
      pending_review: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Chờ duyệt' },
      approved: { bg: 'bg-green-100', text: 'text-green-800', label: 'Đã duyệt' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'Từ chối' },
      archived: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Lưu trữ' }
    };

    const { bg, text, label } = statusMap[status] || statusMap.draft;
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${bg} ${text}`}>{label}</span>;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black opacity-70 transition-opacity"></div>
      
      {/* Modal container */}
      <div className="fixed inset-0 overflow-y-auto h-full w-full flex items-center justify-center">
        <div className="relative bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden border border-gray-200">
          {/* Modal header */}
          <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900">Duyệt phiên bản</h3>
              <p className="text-sm text-gray-600 mt-1">
                Tin tuyển dụng: {job.title} - Phiên bản: {version.version_number}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => window.open(`/viec-lam/preview/${job.id}?version_id=${version.id}`, '_blank')}
                className="inline-flex items-center p-2 border border-indigo-300 rounded-md shadow-sm text-indigo-700 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200 cursor-pointer"
                title="Xem trước phiên bản"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center p-2 border border-gray-300 rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200 cursor-pointer"
                title="Đóng"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Modal body */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
            <div className="space-y-6">
              {/* Version info card */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-lg border border-indigo-200 shadow-sm">
                <h4 className="text-base font-semibold text-gray-800 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Thông tin phiên bản
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-3 rounded-md shadow-sm">
                    <h5 className="text-xs font-medium text-gray-500 mb-1">Trạng thái</h5>
                    <div>{getStatusBadge(version.status)}</div>
                  </div>
                  <div className="bg-white p-3 rounded-md shadow-sm">
                    <h5 className="text-xs font-medium text-gray-500 mb-1">Ngày tạo</h5>
                    <p className="text-sm text-gray-900 font-medium">
                      {new Date(version.created_at).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                  {version.creator_name && (
                    <div className="bg-white p-3 rounded-md shadow-sm">
                      <h5 className="text-xs font-medium text-gray-500 mb-1">Người tạo</h5>
                      <p className="text-sm text-gray-900 font-medium">{version.creator_name}</p>
                    </div>
                  )}
                  <div className="bg-white p-3 rounded-md shadow-sm">
                    <h5 className="text-xs font-medium text-gray-500 mb-1">Phiên bản hiện tại</h5>
                    <div className="mt-1">
                      {job.current_version_id === version.id ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          <span className="w-2 h-2 mr-1 rounded-full bg-blue-500"></span>
                          Đang sử dụng
                        </span>
                      ) : (
                        <span className="text-sm text-gray-600">Không</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Job details */}
              <div className="space-y-5">
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                    <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    Tiêu đề
                  </h4>
                  <p className="text-sm text-gray-900 font-medium">{version.title}</p>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                    <svg className="w-4 h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Mô tả công việc
                  </h4>
                  <div 
                    className="text-sm text-gray-900 prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: version.brief_description }}
                  />
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                    <svg className="w-4 h-4 mr-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    Yêu cầu
                  </h4>
                  <div 
                    className="text-sm text-gray-900 prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: version.requirement }}
                  />
                </div>
                
                {version.benefits && (
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                      <svg className="w-4 h-4 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                      </svg>
                      Quyền lợi
                    </h4>
                    <div 
                      className="text-sm text-gray-900 prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: version.benefits }}
                    />
                  </div>
                )}
                
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                    <svg className="w-4 h-4 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Thông tin bổ sung
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-start space-x-2">
                      <svg className="w-4 h-4 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="text-xs text-gray-500">Mức lương</p>
                        <p className="text-sm text-gray-900 font-medium">{version.salary || 'Không có'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-2">
                      <svg className="w-4 h-4 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <div>
                        <p className="text-xs text-gray-500">Hạn nộp hồ sơ</p>
                        <p className="text-sm text-gray-900 font-medium">
                          {version.date_end_register 
                            ? new Date(version.date_end_register).toLocaleDateString('vi-VN') 
                            : 'Không có'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-2">
                      <svg className="w-4 h-4 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <div>
                        <p className="text-xs text-gray-500">Số năm kinh nghiệm</p>
                        <p className="text-sm text-gray-900 font-medium">{version.years_experienced || '0'} năm</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-2">
                      <svg className="w-4 h-4 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="text-xs text-gray-500">Thời gian làm việc</p>
                        <p className="text-sm text-gray-900 font-medium">{version.work_hours || 'Không có'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-2 md:col-span-2">
                      <svg className="w-4 h-4 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <div>
                        <p className="text-xs text-gray-500">Vị trí</p>
                        <p className="text-sm text-gray-900 font-medium">{version.location || 'Không có'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feedback section */}
            <div className="mt-6 bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center mb-3">
                <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
                <label htmlFor="feedback" className="block text-sm font-semibold text-gray-800">
                  Phản hồi của bạn
                </label>
                {version.status === 'pending_review' && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                    Bắt buộc khi từ chối
                  </span>
                )}
              </div>
              <div className="relative">
                <textarea
                  id="feedback"
                  name="feedback"
                  rows={5}
                  className="shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 block w-full text-sm border-gray-300 rounded-lg p-3 transition-all duration-200 resize-none"
                  placeholder="Nhập phản hồi chi tiết về phiên bản này... (Ví dụ: Nội dung cần chỉnh sửa, yêu cầu bổ sung, lý do từ chối, v.v.)"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                ></textarea>
                <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                  {feedback.length} ký tự
                </div>
              </div>
              <div className="mt-3 flex items-start space-x-2">
                <svg className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {version.status === 'pending_review' 
                    ? 'Phản hồi chi tiết giúp người tạo hiểu rõ lý do và cải thiện phiên bản. Phản hồi là bắt buộc khi từ chối phiên bản.' 
                    : 'Phản hồi của bạn sẽ giúp người tạo cải thiện chất lượng nội dung. Phản hồi là tùy chọn khi duyệt phiên bản.'}
                </p>
              </div>
            </div>
          </div>
          
          {/* Modal footer */}
          {version.status === 'pending_review' && (
            <div className="flex-shrink-0 px-6 py-4 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={isLoading || !feedback.trim()}
                  className={`inline-flex items-center px-5 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium transition-all duration-200 ${
                    isLoading || !feedback.trim() 
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                      : 'text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 cursor-pointer hover:shadow-md transform hover:-translate-y-0.5'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Từ chối
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={isLoading}
                  className={`inline-flex items-center px-5 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium transition-all duration-200 ${
                    isLoading 
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                      : 'text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 cursor-pointer hover:shadow-md transform hover:-translate-y-0.5'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Duyệt
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewJobVersionModal;
