import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { getJobPreview, type Job } from '../../api/jobService';
import { reviewJob } from '../../api/jobReviewService';
import { toast } from 'react-toastify';
import { formatDate as formatDateUtil } from '../../utils/dateUtils';
import { useUser } from '../../contexts/UserContext';
import { LuCheck, LuX, LuTriangleAlert, LuLoader } from 'react-icons/lu';

// Extended Job type for preview that includes additional properties
type JobPreviewData = Omit<Job, 'company_logo'> & {
    company_logo?: {
        url: string;
    };
    creator_name?: string;
    creator_email?: string;
    creator_phone?: string;
    is_live?: boolean;
    version_status?: string;
    version_number?: number;
};

const JobPreview: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [searchParams] = useSearchParams();
    const versionId = searchParams.get('version_id');
    const navigate = useNavigate();
    const { user } = useUser();

    const [job, setJob] = useState<JobPreviewData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Review modal states
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [reviewAction, setReviewAction] = useState<'approved' | 'rejected' | null>(null);
    const [feedback, setFeedback] = useState('');
    const [reviewing, setReviewing] = useState(false);
    
    const isAdmin = user?.role === 'admin';
    const canReview = isAdmin && job?.status === 'pending_review';

    useEffect(() => {
        const fetchJobDetails = async () => {
            if (!id) return;

            try {
                setLoading(true);
                const jobData = await getJobPreview(parseInt(id), versionId ? parseInt(versionId) : undefined);
                setJob(jobData as JobPreviewData);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching job details:', error);
                setError('Không thể tải thông tin công việc. Vui lòng thử lại sau.');
                setLoading(false);
                toast.error('Không thể tải thông tin công việc');
            }
        };

        fetchJobDetails();
    }, [id, versionId]);
    
    // Handle review action
    const handleReview = async () => {
        if (!job || !reviewAction) return;

        if (reviewAction === 'rejected' && !feedback.trim()) {
            toast.error('Vui lòng nhập lý do từ chối');
            return;
        }

        try {
            setReviewing(true);
            const feedbackToSend = reviewAction === 'rejected' ? feedback.trim() : (feedback.trim() || undefined);
            await reviewJob(job.id, reviewAction, feedbackToSend);
            
            toast.success(
                reviewAction === 'approved' 
                    ? 'Đã phê duyệt công việc thành công' 
                    : 'Đã từ chối công việc'
            );
            
            setShowReviewModal(false);
            setReviewAction(null);
            setFeedback('');
            
            // Redirect to review management page
            navigate('/admin/quan-ly-duyet-cong-viec');
        } catch (error: any) {
            console.error('Error reviewing job:', error);
            const errorMessage = error?.response?.data?.message || 'Lỗi khi duyệt công việc';
            toast.error(errorMessage);
        } finally {
            setReviewing(false);
        }
    };
    
    // Open review modal
    const openReviewModal = (action: 'approved' | 'rejected') => {
        setReviewAction(action);
        setFeedback('');
        setShowReviewModal(true);
    };

    // Format salary for display
    const formatSalary = (salary: string): string => {
        if (!salary) return 'Thỏa thuận';

        // If salary contains a range (e.g., "5000000-10000000")
        if (salary.includes('-')) {
            const [min, max] = salary.split('-');
            const formattedMin = parseInt(min).toLocaleString('vi-VN');
            const formattedMax = parseInt(max).toLocaleString('vi-VN');
            return `${formattedMin} - ${formattedMax} VNĐ`;
        }

        // If salary is a single value
        return `${parseInt(salary).toLocaleString('vi-VN')} VNĐ`;
    };

    // Format date for display
    const formatDate = (dateString: string): string => {
        if (!dateString) return '';
        return formatDateUtil(dateString, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error || !job) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-red-700">
                                {error || 'Không tìm thấy thông tin công việc.'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* Preview banner - always visible at the top */}
            <div className="bg-blue-600 text-white p-4 shadow-md sticky top-0 z-1 mt-[-32px]">
                <div className="container mx-auto px-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center">
                            <svg className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            <h2 className="text-lg font-bold">Chế độ xem trước</h2>
                        </div>
                        {versionId && (
                            <p className="text-sm bg-blue-700 px-2 py-1 rounded">
                                Đang xem phiên bản: {job.version_number || 'Không xác định'}
                            </p>
                        )}
                    </div>
                    
                    {/* Review buttons for admin */}
                    {canReview && (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => openReviewModal('approved')}
                                className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                            >
                                <LuCheck className="w-5 h-5" />
                                <span>Phê duyệt</span>
                            </button>
                            <button
                                onClick={() => openReviewModal('rejected')}
                                className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                            >
                                <LuX className="w-5 h-5" />
                                <span>Từ chối</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div>
                {/* Banner with enhanced visual elements - like in JobDetail */}
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
                            <h1 className="text-3xl md:text-5xl font-bold text-white mb-2 drop-shadow-lg">Xem trước tin tuyển dụng</h1>
                            <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto drop-shadow-md">
                                Tin tuyển dụng này có thể chưa được phê duyệt hoặc chưa được công khai
                            </p>
                        </div>
                    </div>
                </div>

                {/* Job info below banner */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 md:-mt-20 relative z-10">
                    <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
                        {/* Job header */}
                        <div className="flex flex-col md:flex-row items-start gap-6">
                            {/* Company logo */}
                            <div className="flex-shrink-0">
                                <div className="h-24 w-24 md:h-32 md:w-32 rounded-2xl bg-blue-100 border-4 border-white shadow-lg flex items-center justify-center text-blue-500">
                                    {job.company_logo?.url ? (
                                        <img
                                            src={job.company_logo.url}
                                            alt={job.company_name}
                                            className="h-full w-full rounded-xl object-cover"
                                        />
                                    ) : (
                                        <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                    )}
                                </div>
                                
                                {/* Industry chip below logo */}
                                <div className="mt-3 flex justify-center">
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                        {job.industry_name || 'Chưa phân loại'}
                                    </span>
                                </div>
                            </div>
                            
                            {/* Job title and info in a single column */}
                            <div className="flex-1 w-full">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">{job.title}</h2>
                                    <p className="text-blue-600 mt-1">{job.company_name}</p>

                                    {/* Info items in a single row */}
                                    <div className="mt-5 w-full">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {/* Location */}
                                            <div className="flex items-start">
                                                <div className="bg-blue-100 rounded-full p-3 mr-3">
                                                    <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-medium text-gray-900">Địa điểm</h3>
                                                    <p className="text-gray-600">
                                                        {job.location || 'Chưa cập nhật'}
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            {/* Salary */}
                                            <div className="flex items-start">
                                                <div className="bg-green-100 rounded-full p-3 mr-3">
                                                    <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-medium text-gray-900">Mức lương</h3>
                                                    <p className="text-gray-600">
                                                        {job.salary ? formatSalary(job.salary) : 'Thỏa thuận'}
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            {/* Experience */}
                                            <div className="flex items-start">
                                                <div className="bg-purple-100 rounded-full p-3 mr-3">
                                                    <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-medium text-gray-900">Kinh nghiệm</h3>
                                                    <p className="text-gray-600">
                                                        {job.years_experienced 
                                                        ? job.years_experienced + ' năm'
                                                        : 'Không yêu cầu kinh nghiệm'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Expiry date banner */}
                                        {job.date_end_register && <div className="mt-3 py-2 px-4 bg-gray-100 rounded-md inline-block">
                                            <p className="text-sm text-gray-600">
                                                <span className="font-medium">Hạn nộp hồ sơ:</span> {formatDate(job.date_end_register)}
                                            </p>
                                        </div>}
                                        
                                        {/* Version information */}
                                        <div className="mt-3 py-2 px-4 bg-blue-50 rounded-md">
                                            <div className="flex justify-between items-center">
                                                <p className="text-sm text-blue-800">
                                                    <span className="font-medium">Phiên bản:</span> {job.version_number || 'Không xác định'}
                                                    {job.version_status && (
                                                        <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-blue-100">
                                                            {job.version_status === 'draft' ? 'Bản nháp' :
                                                            job.version_status === 'approved' ? 'Đã duyệt' : 
                                                            job.version_status === 'pending_review' ? 'Đang chờ duyệt' : 
                                                            job.version_status === 'rejected' ? 'Bị từ chối' : 
                                                            job.version_status}
                                                        </span>
                                                    )}
                                                </p>
                                                
                                                {!!job.is_live && (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        <span className="w-2 h-2 mr-1 rounded-full bg-green-500"></span>
                                                        Live
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main content - Two columns layout */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left column - job details (70% width) */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Job details */}
                            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                                {/* Basic job info */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 border-b border-gray-100 pb-4">
                                    <div>
                                        <div className="mb-4">
                                            <h3 className="text-sm font-medium text-gray-500 mb-1">Mức lương</h3>
                                            <p className="text-base font-semibold text-gray-900">{job.salary ? formatSalary(job.salary) : 'Thỏa thuận'}</p>
                                        </div>
                                        <div className="mb-4">
                                            <h3 className="text-sm font-medium text-gray-500 mb-1">Địa điểm</h3>
                                            <p className="text-base text-gray-900">{job.location || 'Chưa có thông tin'}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="mb-4">
                                            <h3 className="text-sm font-medium text-gray-500 mb-1">Thời gian làm việc</h3>
                                            <p className="text-base text-gray-900">{job.work_hours || 'Chưa có thông tin'}</p>
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-500 mb-1">Hạn nộp hồ sơ</h3>
                                            <p className="text-base text-gray-900">
                                                {job.date_end_register ? formatDate(job.date_end_register) : 'Chưa có thông tin'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Description */}
                                <div className="mb-8">
                                    <h2 className="text-xl font-bold text-gray-900 mb-4">Mô tả tin tuyển dụng</h2>
                                    <div
                                        className="prose max-w-none text-gray-700"
                                        dangerouslySetInnerHTML={{ __html: job.brief_description || '<p>Chưa có mô tả công việc</p>' }}
                                    />
                                </div>
                                
                                {/* Requirements */}
                                <div className="mb-8">
                                    <h2 className="text-xl font-bold text-gray-900 mb-4">Yêu cầu tin tuyển dụng</h2>
                                    <div
                                        className="prose max-w-none text-gray-700"
                                        dangerouslySetInnerHTML={{ __html: job.requirement || '<p>Chưa có yêu cầu công việc</p>' }}
                                    />
                                </div>
                                
                                {/* Benefits */}
                                <div className="mb-8">
                                    <h2 className="text-xl font-bold text-gray-900 mb-4">Quyền lợi</h2>
                                    <div
                                        className="prose max-w-none text-gray-700"
                                        dangerouslySetInnerHTML={{ __html: job.benefits || '<p>Chưa có thông tin quyền lợi</p>' }}
                                    />
                                </div>
                                
                                {/* Preview notice */}
                                <div className="mt-8 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
                                    <div className="flex">
                                        <div className="flex-shrink-0">
                                            <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div className="ml-3">
                                            <p className="text-sm text-blue-700">
                                                Đây là chế độ xem trước. Tin tuyển dụng này có thể chưa được phê duyệt hoặc chưa được công khai.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Right column - Company info and version info (30% width) */}
                        <div className="lg:col-span-1 space-y-8">
                            {/* Company information section */}
                            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                                <h2 className="text-xl font-bold text-gray-900 mb-4">Thông tin công ty</h2>
                                <div className="flex items-center space-x-3 mb-4" title={job.company_name || ''}>
                                    <div className="flex-shrink-0">
                                        {job.company_logo?.url 
                                        ? <img src={job.company_logo.url} alt={job.company_name} className="h-16 w-16 rounded-lg object-cover" /> 
                                        : (
                                            <div className="h-16 w-16 rounded-lg bg-blue-100 flex items-center justify-center text-blue-500">
                                                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>

                                    <h3 className="font-bold text-gray-900 line-clamp-3">{job.company_name}</h3>                
                                </div>
                                
                                <div className="space-y-4 mt-2">
                                    {/* Industry */}
                                    <div className="flex items-center" title={job.industry_name || ''}>
                                        <div className="mr-3">
                                            <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="text-xs font-semibold text-gray-500">Lĩnh vực</h3>
                                            <p className="text-sm text-gray-800 line-clamp-2">{job.industry_name || 'Chưa cập nhật'}</p>
                                        </div>
                                    </div>
                                    
                                    {/* Location */}
                                    <div className="flex items-center" title={job.location || ''}>
                                        <div className="mr-3">
                                            <svg className="h-5 w-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="text-xs font-semibold text-gray-500">Địa điểm</h3>
                                            <p className="text-sm text-gray-800 line-clamp-2">{job.location || 'Chưa cập nhật'}</p>
                                        </div>
                                    </div>
                                    
                                    {/* Contact */}
                                    <div className="flex items-start">
                                        <div className="mr-3">
                                            <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="text-xs font-semibold text-gray-500">Người liên hệ</h3>
                                            <p className="text-sm text-gray-800">{job.creator_name || 'Chưa cập nhật'}</p>
                                            {job.creator_email && (
                                                <p className="text-xs text-gray-600 mt-1">
                                                    <span className="font-medium">Email:</span> {job.creator_email}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Version info */}
                            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                                <h2 className="text-xl font-bold text-gray-900 mb-4">Thông tin phiên bản</h2>
                                <div className="space-y-3">
                                    <div className="flex items-center">
                                        <div className="mr-3">
                                            <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="text-xs font-semibold text-gray-500">Số phiên bản</h3>
                                            <p className="text-sm text-gray-800">{job.version_number || 'N/A'}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center">
                                        <div className="mr-3">
                                            <svg className="h-5 w-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="text-xs font-semibold text-gray-500">Trạng thái</h3>
                                            <p className="text-sm text-gray-800">
                                                {job.version_status === 'approved' ? 'Đã duyệt' : 
                                                job.version_status === 'pending_review' ? 'Đang chờ duyệt' : 
                                                job.version_status === 'rejected' ? 'Bị từ chối' : 
                                                job.version_status || job.status || 'Chưa cập nhật'}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center">
                                        <div className="mr-3">
                                            <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="text-xs font-semibold text-gray-500">Hiển thị công khai</h3>
                                            <p className="text-sm text-gray-800">{job.is_live ? 'Có' : 'Không'}</p>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Preview notice */}
                                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                                    <div className="flex items-center text-sm text-blue-700">
                                        <svg className="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <p>Đây là chế độ xem trước phiên bản tin tuyển dụng</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Review Modal */}
            {showReviewModal && job && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">
                                {reviewAction === 'approved' ? 'Phê duyệt công việc' : 'Từ chối công việc'}
                            </h3>
                        </div>

                        <div className="px-6 py-4 space-y-4">
                            {/* Job Details */}
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h4 className="font-semibold text-gray-900 mb-2">{job.title}</h4>
                                <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                                    <div>Công ty: {job.company_name || 'N/A'}</div>
                                    <div>Ngành: {job.industry_name || 'N/A'}</div>
                                    <div>Địa điểm: {job.location}</div>
                                    <div>Lương: {job.salary}</div>
                                </div>
                            </div>

                            {/* Feedback */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {reviewAction === 'approved' ? 'Ghi chú (tùy chọn)' : 'Lý do từ chối *'}
                                </label>
                                <textarea
                                    value={feedback}
                                    onChange={(e) => setFeedback(e.target.value)}
                                    rows={4}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder={
                                        reviewAction === 'approved'
                                            ? 'Nhập ghi chú nếu cần...'
                                            : 'Nhập lý do từ chối công việc này...'
                                    }
                                />
                                {reviewAction === 'rejected' && (
                                    <p className="mt-1 text-xs text-gray-500">
                                        Lý do từ chối sẽ được gửi đến người tạo công việc
                                    </p>
                                )}
                            </div>

                            {/* Warning */}
                            {reviewAction === 'rejected' && (
                                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <LuTriangleAlert className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                    <div className="text-sm text-red-800">
                                        <p className="font-medium">Lưu ý khi từ chối:</p>
                                        <p className="mt-1">
                                            Công việc sẽ được chuyển về trạng thái "rejected" và người tạo sẽ nhận được thông báo kèm lý do từ chối.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setShowReviewModal(false);
                                    setReviewAction(null);
                                    setFeedback('');
                                }}
                                disabled={reviewing}
                                className="cursor-pointer px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleReview}
                                disabled={reviewing || (reviewAction === 'rejected' && !feedback.trim())}
                                className={`cursor-pointer px-4 py-2 rounded-lg text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${
                                    reviewAction === 'approved'
                                        ? 'bg-green-600 hover:bg-green-700'
                                        : 'bg-red-600 hover:bg-red-700'
                                }`}
                            >
                                {reviewing ? (
                                    <>
                                        <LuLoader className="w-4 h-4 animate-spin" />
                                        <span>Đang xử lý...</span>
                                    </>
                                ) : (
                                    <>
                                        {reviewAction === 'approved' ? (
                                            <>
                                                <LuCheck className="w-4 h-4" />
                                                <span>Phê duyệt</span>
                                            </>
                                        ) : (
                                            <>
                                                <LuX className="w-4 h-4" />
                                                <span>Từ chối</span>
                                            </>
                                        )}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default JobPreview;
