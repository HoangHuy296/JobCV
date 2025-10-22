import React, { useState, useEffect, useRef } from 'react';
import type { JobVersion, CreateJobVersionData } from '../../api/jobVersionService';
import type { Job } from '../../api/jobService';
import SlideOver from './SlideOver';
import type { FormField } from './SlideOver';

// Define JobForEdit locally to avoid import issues
export interface JobForEdit extends Omit<Job, 'industry_id' | 'company_id'> {
  industry_id: number | number[];
  company_id: number | number[];
  current_version_id?: number;
  version_status?: string;
}

interface JobVersionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: JobForEdit | null;
  versions: JobVersion[];
  onSetVersionLive: (jobId: number, versionId: number) => Promise<void>;
  onSetPrimaryVersion?: (jobId: number, versionId: number) => Promise<void>;
  onCreateNewVersion?: (jobId: number, versionData: CreateJobVersionData) => Promise<void>;
  onUpdateVersion?: (jobId: number, versionId: number, versionData: Partial<CreateJobVersionData>) => Promise<void>;
  onDeleteVersion?: (jobId: number, versionId: number) => Promise<void>;
}
const JobVersionsModal: React.FC<JobVersionsModalProps> = ({
  isOpen,
  onClose,
  job,
  versions,
  onSetVersionLive,
  onSetPrimaryVersion,
  onCreateNewVersion,
  onUpdateVersion,
  onDeleteVersion
}) => {
  const [isCreatingVersion, setIsCreatingVersion] = useState(false);
  const [isUpdatingVersion, setIsUpdatingVersion] = useState(false);
  const [isDeletingVersion, setIsDeletingVersion] = useState(false);
  const [showConfirmNewVersion, setShowConfirmNewVersion] = useState(false);
  const [showConfirmDeleteVersion, setShowConfirmDeleteVersion] = useState(false);
  const [showSlideOver, setShowSlideOver] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentVersion, setCurrentVersion] = useState<JobVersion | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  
  // Reference for handling clicks outside the dropdown
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdownId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close dropdown when pressing Escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenDropdownId(null);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);
  
  // Reset dropdown state when modal is closed
  useEffect(() => {
    if (!isOpen) {
      setOpenDropdownId(null);
    }
  }, [isOpen]);
  
  if (!isOpen || !job) return null;
  
  // Safe to use job after this point since we've checked it's not null

  const handleCreateNewVersion = async (values: Record<string, any>) => {
    if (!job || !onCreateNewVersion) return;
    
    setIsCreatingVersion(true);
    try {
      // Create version data from form values
      const versionData: CreateJobVersionData = {
        title: values.title,
        brief_description: values.brief_description,
        requirement: values.requirement,
        benefits: values.benefits || '',
        salary: values.salary || '',
        date_end_register: values.date_end_register || '',
        years_experienced: typeof values.years_experienced === 'string' 
          ? parseInt(values.years_experienced) 
          : values.years_experienced || 0,
        work_hours: values.work_hours || '',
        company_id: Array.isArray(values.company_id) ? values.company_id[0] : values.company_id,
        industry_id: Array.isArray(values.industry_id) ? values.industry_id[0] : values.industry_id,
        location: values.location || ''
      };
      
      await onCreateNewVersion(job.id, versionData);
      setShowSlideOver(false);
      setShowConfirmNewVersion(false);
    } catch (error) {
      console.error('Error creating new version:', error);
    } finally {
      setIsCreatingVersion(false);
    }
  };
  
  const handleConfirmNewVersion = () => {
    setShowConfirmNewVersion(true);
  };
  
  const handleOpenSlideOver = () => {
    setShowConfirmNewVersion(false);
    setEditMode(false);
    setCurrentVersion(null);
    setShowSlideOver(true);
  };
  
  const handleEditVersion = (version: JobVersion) => {
    setCurrentVersion(version);
    setEditMode(true);
    setShowSlideOver(true);
  };
  
  const handleUpdateVersion = async (values: Record<string, any>) => {
    if (!job || !onUpdateVersion || !currentVersion) return;
    
    setIsUpdatingVersion(true);
    try {
      // Create version data from form values
      const versionData: Partial<CreateJobVersionData> = {
        title: values.title,
        brief_description: values.brief_description,
        requirement: values.requirement,
        benefits: values.benefits || '',
        salary: values.salary || '',
        date_end_register: values.date_end_register || '',
        years_experienced: typeof values.years_experienced === 'string' 
          ? parseInt(values.years_experienced) 
          : values.years_experienced || 0,
        work_hours: values.work_hours || '',
        company_id: Array.isArray(values.company_id) ? values.company_id[0] : values.company_id,
        industry_id: Array.isArray(values.industry_id) ? values.industry_id[0] : values.industry_id,
        location: values.location || ''
      };
      
      await onUpdateVersion(job.id, currentVersion.id, versionData);
      setShowSlideOver(false);
    } catch (error) {
      console.error('Error updating version:', error);
    } finally {
      setIsUpdatingVersion(false);
    }
  };
  
  const handleConfirmDeleteVersion = (version: JobVersion) => {
    setCurrentVersion(version);
    setShowConfirmDeleteVersion(true);
  };
  
  const handleDeleteVersion = async () => {
    if (!job || !onDeleteVersion || !currentVersion) return;
    
    setIsDeletingVersion(true);
    try {
      await onDeleteVersion(job.id, currentVersion.id);
      setShowConfirmDeleteVersion(false);
    } catch (error) {
      console.error('Error deleting version:', error);
    } finally {
      setIsDeletingVersion(false);
    }
  };
  
  // Form fields for the SlideOver
  const formFields: FormField[] = [
    {
      name: 'title',
      label: 'Tiêu đề',
      type: 'textarea',
      required: true,
      placeholder: 'Nhập tiêu đề công việc'
    },
    {
      name: 'brief_description',
      label: 'Mô tả công việc',
      type: 'editor',
      required: true,
      placeholder: 'Nhập mô tả ngắn gọn về công việc'
    },
    {
      name: 'requirement',
      label: 'Yêu cầu',
      type: 'editor',
      required: true,
      placeholder: 'Nhập yêu cầu công việc'
    },
    {
      name: 'benefits',
      label: 'Quyền lợi',
      type: 'editor',
      placeholder: 'Nhập quyền lợi công việc'
    },
    {
      name: 'salary',
      label: 'Mức lương',
      type: 'text',
      placeholder: 'Nhập mức lương (ví dụ: 10-15 triệu)'
    },
    {
      name: 'date_end_register',
      label: 'Hạn nộp hồ sơ',
      type: 'datetime'
    },
    {
      name: 'years_experienced',
      label: 'Số năm kinh nghiệm',
      type: 'number',
      placeholder: 'Nhập số năm kinh nghiệm yêu cầu'
    },
    {
      name: 'work_hours',
      label: 'Thời gian làm việc',
      type: 'text',
      placeholder: 'Nhập thời gian làm việc (ví dụ: 8h-17h, Thứ 2-Thứ 6)'
    },
    {
      name: 'industry_id',
      label: 'Ngành nghề',
      type: 'industry',
      multiple: false,
      required: true
    },
    {
      name: 'company_id',
      label: 'Công ty',
      type: 'select',
      required: true,
      options: [{ value: job.company_id, label: 'Công ty hiện tại' }]
    },
    {
      name: 'location',
      label: 'Vị trí',
      type: 'location',
      required: true,
      placeholder: 'Nhập vị trí'
    }
  ];
  
  // Initial values for the form - use current/primary version if available, otherwise use job data
  const currentVersionData = versions.find(v => v.id === job.current_version_id);
  const baseData = currentVersionData || job;
  
  const initialValues = {
    title: baseData.title,
    brief_description: baseData.brief_description,
    requirement: baseData.requirement,
    benefits: baseData.benefits || '',
    salary: baseData.salary || '',
    date_end_register: baseData.date_end_register || '',
    years_experienced: baseData.years_experienced || 0,
    work_hours: baseData.work_hours || '',
    company_id: Array.isArray(baseData.company_id) ? baseData.company_id[0] : baseData.company_id,
    industry_id: Array.isArray(baseData.industry_id) ? baseData.industry_id[0] : baseData.industry_id,
    location: baseData.location || ''
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
    <>
      <div className="fixed inset-0 z-50 overflow-hidden" ref={dropdownRef}>
        {/* Overlay - using same style as SlideOver */}
        <div className="absolute inset-0 bg-black opacity-70 transition-opacity"></div>
        
        {/* Modal container */}
        <div className="fixed inset-0 overflow-y-auto h-full w-full flex items-center justify-center">
          <div className="relative bg-white rounded-xl shadow-2xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-hidden border border-gray-200">
            {/* Modal header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Quản lý phiên bản</h3>
                <p className="text-sm text-gray-600 mt-1">Tin tuyển dụng: {job.title}</p>
              </div>
            </div>
            
            {/* Modal body */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px-70px)]">
              <div className="mb-4 flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500">
                    <span className="font-medium">Tổng số phiên bản:</span> {versions.length}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    <span className="w-2 h-2 mr-1 rounded-full bg-blue-500"></span>
                    Hiện tại
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <span className="w-2 h-2 mr-1 rounded-full bg-green-500"></span>
                    Live
                  </span>
                </div>
              </div>
              
              {versions.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded-lg">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Không có phiên bản</h3>
                  <p className="mt-1 text-sm text-gray-500">Chưa có phiên bản nào cho tin tuyển dụng này.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {versions.map((version) => (
                    <div 
                      key={version.id} 
                      className={`border rounded-lg p-5 transition-all duration-200 hover:shadow-md ${
                        version.id === job.current_version_id 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center flex-wrap gap-2">
                            <h5 className="font-medium text-gray-900">
                              Phiên bản {version.version_number}
                            </h5>
                            {version.id === job.current_version_id && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                <span className="w-2 h-2 mr-1 rounded-full bg-blue-500"></span>
                                Hiện tại
                              </span>
                            )}
                            {!!version.is_live && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <span className="w-2 h-2 mr-1 rounded-full bg-green-500"></span>
                                Live
                              </span>
                            )}
                          </div>
                          
                          <div className="mt-2 space-y-1">
                            <div className="flex items-center">
                              <span className="text-sm text-gray-500 mr-2">Trạng thái:</span>
                              {getStatusBadge(version.status)}
                            </div>
                            
                            <p className="text-sm text-gray-500">
                              Ngày tạo: {new Date(version.created_at).toLocaleDateString('vi-VN')}
                            </p>
                            
                            {version.creator_name && (
                              <p className="text-sm text-gray-500">
                                Người tạo: {version.creator_name}
                              </p>
                            )}
                            
                            {version.review_status && (
                              <p className="text-sm text-gray-500">
                                Trạng thái duyệt: {version.review_status === 'approved' ? 'Đã duyệt' : 
                                                  version.review_status === 'rejected' ? 'Từ chối' : 'Đang chờ'}
                              </p>
                            )}
                            
                            {version.feedback && (
                              <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-200">
                                <p className="text-xs font-medium text-gray-700">Phản hồi:</p>
                                <p className="text-sm text-gray-600">{version.feedback}</p>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-row space-x-2">
                          {/* Preview button - always visible */}
                          <button 
                            onClick={() => window.open(`/viec-lam/preview/${job.id}?version_id=${version.id}`, '_blank')}
                            className="inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 cursor-pointer"
                            title="Xem trước phiên bản"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          
                          {/* Dropdown menu for additional actions */}
                          <div className="relative inline-block text-left">
                            <div>
                              <button 
                                type="button" 
                                className="inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer"
                                onClick={() => {
                                  setOpenDropdownId(openDropdownId === version.id ? null : version.id);
                                }}
                              >
                                Thao tác
                                <svg className="-mr-1 ml-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                              </button>
                            </div>

                            {openDropdownId === version.id && (
                              <div 
                                className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-sm bg-white z-10"
                                role="menu" 
                                aria-orientation="vertical" 
                                aria-labelledby="menu-button" 
                                tabIndex={-1}
                              >
                              <div className="py-1" role="none">
                                {/* Edit option */}
                                {onUpdateVersion && (
                                  <button 
                                    onClick={() => {
                                      handleEditVersion(version);
                                      setOpenDropdownId(null);
                                    }}
                                    className="cursor-pointer flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 w-full text-left"
                                    role="menuitem"
                                  >
                                    <svg className="w-4 h-4 mr-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    Chỉnh sửa
                                  </button>
                                )}
                                
                                {/* Set as primary version option */}
                                {onSetPrimaryVersion && version.id !== job.current_version_id && (
                                  <button 
                                    onClick={() => {
                                      onSetPrimaryVersion(job.id, version.id);
                                      setOpenDropdownId(null);
                                    }}
                                    className="cursor-pointer flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 w-full text-left"
                                    role="menuitem"
                                  >
                                    <svg className="w-4 h-4 mr-3 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Đặt làm phiên bản chính
                                  </button>
                                )}
                                
                                {/* Set as live option */}
                                {version.status === 'approved' && !version.is_live && (
                                  <button 
                                    onClick={() => {
                                      onSetVersionLive(job.id, version.id);
                                      setOpenDropdownId(null);
                                    }}
                                    className="cursor-pointer flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 w-full text-left"
                                    role="menuitem"
                                  >
                                    <svg className="w-4 h-4 mr-3 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z" />
                                    </svg>
                                    Đặt làm phiên bản live
                                  </button>
                                )}
                              </div>
                              
                              {/* Delete option in a separate section */}
                              {onDeleteVersion && version.id !== job.current_version_id && !version.is_live && (
                                <div className="py-1" role="none">
                                  <button 
                                    onClick={() => {
                                      handleConfirmDeleteVersion(version);
                                      setOpenDropdownId(null);
                                    }}
                                    className="cursor-pointer flex items-center px-4 py-2 text-sm text-red-700 hover:bg-red-100 hover:text-red-900 w-full text-left"
                                    role="menuitem"
                                  >
                                    <svg className="w-4 h-4 mr-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    Xóa phiên bản
                                  </button>
                                </div>
                              )}
                            </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Modal footer */}
            <div className="flex-shrink-0 px-4 py-4 sm:px-6 border-t border-gray-200">
              <div className="flex justify-between items-center">
                {onCreateNewVersion && (
                  <button
                    type="button"
                    onClick={handleConfirmNewVersion}
                    disabled={isCreatingVersion}
                    className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer transition-all duration-200 transform hover:scale-105 ${isCreatingVersion ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    {isCreatingVersion ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Đang tạo...
                      </>
                    ) : (
                      <>
                        <div className="flex items-center">
                          <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          <span>
                            Tạo phiên bản hoàn toàn mới
                          </span>
                        </div>
                      </>
                    )}
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-colors duration-200"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Version Confirmation Modal */}
      {showConfirmNewVersion && (
        <div className="fixed inset-0 z-50 overflow-hidden" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 transform transition-all">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-yellow-100 rounded-full mb-4">
                <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-center text-gray-900 mb-2">Tạo phiên bản hoàn toàn mới</h3>
              <div className="flex items-center justify-center mb-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 mr-2">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  Phiên bản mới
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Hoàn toàn độc lập
                </span>
              </div>
              <p className="text-sm text-gray-600 text-center mb-4">
                Bạn sắp tạo một <span className="font-bold text-purple-700">phiên bản hoàn toàn mới</span> cho tin tuyển dụng này. 
                Phiên bản mới sẽ được tạo dựa trên <span className="font-semibold text-blue-700">phiên bản chính hiện tại</span> và sẽ có số phiên bản mới.
              </p>
              <div className="flex items-center mb-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
                <svg className="h-10 w-10 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Phiên bản mới sẽ được tạo với:</p>
                  <p className="text-sm font-medium text-gray-700">{initialValues.title}</p>
                </div>
              </div>
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-700">
                      Phiên bản mới sẽ bắt đầu ở trạng thái <span className="font-semibold">Bản nháp</span> và cần được duyệt trước khi có thể đưa lên live.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowConfirmNewVersion(false)}
                  className="cursor-pointer px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleOpenSlideOver}
                  disabled={isCreatingVersion}
                  className={`cursor-pointer px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 transform hover:scale-105 ${isCreatingVersion ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {isCreatingVersion ? 'Đang tạo...' : (
                    <div className="flex items-center">
                      <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span>Tiếp tục tạo mới</span>
                    </div>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Version Confirmation Modal */}
      {showConfirmDeleteVersion && currentVersion && (
        <div className="fixed inset-0 z-50 overflow-hidden" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 transform transition-all">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-center text-gray-900 mb-2">Xóa phiên bản</h3>
              <div className="flex items-center justify-center mb-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Không thể hoàn tác
                </span>
              </div>
              <p className="text-sm text-gray-600 text-center mb-4">
                Bạn sắp xóa <span className="font-bold text-red-700">phiên bản {currentVersion.version_number}</span> của tin tuyển dụng này. 
                Hành động này không thể hoàn tác.
              </p>
              <div className="flex items-center mb-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
                <svg className="h-10 w-10 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Phiên bản sẽ bị xóa:</p>
                  <p className="text-sm font-medium text-gray-700">{currentVersion.title}</p>
                </div>
              </div>
              <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">
                      Việc xóa phiên bản sẽ xóa vĩnh viễn dữ liệu và không thể khôi phục. Bạn có chắc chắn muốn tiếp tục?
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowConfirmDeleteVersion(false)}
                  className="cursor-pointer px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleDeleteVersion}
                  disabled={isDeletingVersion}
                  className={`cursor-pointer px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 ${isDeletingVersion ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {isDeletingVersion ? 'Đang xóa...' : (
                    <div className="flex items-center">
                      <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span>Xóa phiên bản</span>
                    </div>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* SlideOver for creating or editing a version */}
      <SlideOver
        title={editMode 
          ? `Chỉnh sửa phiên bản ${currentVersion?.version_number || ''} - ${job?.title || ''}` 
          : `Tạo phiên bản hoàn toàn mới - ${job?.title || ''}`
        }
        isOpen={showSlideOver}
        onClose={() => setShowSlideOver(false)}
        fields={formFields}
        initialValues={editMode && currentVersion ? {
          title: currentVersion.title,
          brief_description: currentVersion.brief_description,
          requirement: currentVersion.requirement,
          benefits: currentVersion.benefits || '',
          salary: currentVersion.salary || '',
          date_end_register: currentVersion.date_end_register || '',
          years_experienced: currentVersion.years_experienced || 0,
          work_hours: currentVersion.work_hours || '',
          company_id: currentVersion.company_id,
          industry_id: currentVersion.industry_id,
          location: currentVersion.location || ''
        } : initialValues}
        onSubmit={editMode ? handleUpdateVersion : handleCreateNewVersion}
        isSubmitting={editMode ? isUpdatingVersion : isCreatingVersion}
        submitButtonText={editMode ? "Cập nhật phiên bản" : "Tạo phiên bản hoàn toàn mới"}
      >
        <div className="mb-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-l-4 border-indigo-500 p-4 rounded-r-md shadow-sm">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <div className="ml-3">
              <div className="flex items-center">
                <h3 className="text-sm font-medium text-indigo-800">Tạo phiên bản hoàn toàn mới</h3>
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                  <svg className="mr-1 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Mới
                </span>
              </div>
              <div className="mt-2 text-sm text-indigo-700">
                <p>Bạn đang tạo một <span className="font-bold">phiên bản hoàn toàn mới</span> cho tin tuyển dụng này. Phiên bản mới sẽ:</p>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  <li>Có số phiên bản mới</li>
                  <li>Bắt đầu ở trạng thái <span className="font-semibold">Bản nháp</span></li>
                  <li>Cần được duyệt trước khi có thể đưa lên live</li>
                </ul>
              </div>
              <div className="mt-3 p-2 bg-white/70 rounded border border-indigo-100 flex items-center">
                <svg className="h-5 w-5 text-indigo-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span className="text-xs text-indigo-600">
                  Dữ liệu được điền sẵn từ phiên bản hiện tại. Bạn có thể chỉnh sửa theo ý muốn.
                </span>
              </div>
            </div>
          </div>
        </div>
      </SlideOver>
    </>
  );
}

export default JobVersionsModal;
