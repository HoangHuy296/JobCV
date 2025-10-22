import api from './index';

export interface JobReport {
  id: number;
  job_id: number;
  user_id: number;
  report_type: 'misleading' | 'inappropriate' | 'scam' | 'duplicate' | 'expired' | 'other';
  description: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  admin_notes?: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  job_title?: string;
  reporter_name?: string;
}

export interface CreateJobReportData {
  report_type: 'misleading' | 'inappropriate' | 'scam' | 'duplicate' | 'expired' | 'other';
  description?: string;
}

export interface CreatePublicJobReportData extends CreateJobReportData {
  name: string;
  email: string;
  phone?: string;
}

export interface UpdateReportStatusData {
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  admin_notes?: string;
}

// Report a job (authenticated user)
export const reportJob = async (jobId: number, reportData: CreateJobReportData): Promise<JobReport> => {
  try {
    const response = await api.post(`/job-reviews/${jobId}/report`, reportData);
    return response.data.result;
  } catch (error) {
    console.error('Error reporting job:', error);
    throw error;
  }
};

// Report a job (public - no authentication required)
export const reportJobPublic = async (jobId: number, reportData: CreatePublicJobReportData): Promise<JobReport> => {
  try {
    const response = await api.post(`/job-reviews/${jobId}/report/public`, reportData);
    return response.data.result;
  } catch (error) {
    console.error('Error reporting job (public):', error);
    throw error;
  }
};

// Get all job reports (admin only)
export const getAllJobReports = async (
  page: number = 1,
  limit: number = 10,
  status?: string,
  report_type?: string
): Promise<{ reports: JobReport[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> => {
  try {
    const params: Record<string, string | number> = { page, limit };
    
    if (status) params.status = status;
    if (report_type) params.report_type = report_type;
    
    const response = await api.get('/job-reviews/reports', { params });
    return response.data.result;
  } catch (error) {
    console.error('Error fetching job reports:', error);
    throw error;
  }
};

// Update report status (admin only)
export const updateReportStatus = async (reportId: number, statusData: UpdateReportStatusData): Promise<JobReport> => {
  try {
    const response = await api.put(`/job-reviews/reports/${reportId}`, statusData);
    return response.data.result;
  } catch (error) {
    console.error('Error updating report status:', error);
    throw error;
  }
};

// Submit a job for review
export const submitJobForReview = async (jobId: number): Promise<any> => {
  try {
    const response = await api.post(`/job-reviews/${jobId}/submit`);
    return response.data.result;
  } catch (error) {
    console.error('Error submitting job for review:', error);
    throw error;
  }
};

// Cancel a job review submission
export const cancelJobReview = async (jobId: number): Promise<any> => {
  try {
    const response = await api.post(`/job-reviews/${jobId}/cancel`);
    return response.data.result;
  } catch (error) {
    console.error('Error canceling job review:', error);
    throw error;
  }
};

// Review a job (admin/reviewer only)
export const reviewJob = async (
  jobId: number, 
  status: 'approved' | 'rejected', 
  feedback?: string
): Promise<{review: any, job: any}> => {
  try {
    const response = await api.post(`/job-reviews/${jobId}/review`, { status, feedback });
    return response.data.result;
  } catch (error) {
    console.error('Error reviewing job:', error);
    throw error;
  }
};

// Get job review history
export const getJobReviewHistory = async (jobId: number): Promise<any[]> => {
  try {
    const response = await api.get(`/job-reviews/${jobId}/history`);
    return response.data.result;
  } catch (error) {
    console.error('Error fetching job review history:', error);
    throw error;
  }
};

// Get pending reviews (admin/reviewer only)
export const getPendingReviews = async (
  page: number = 1,
  limit: number = 10
): Promise<{ jobs: any[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> => {
  try {
    const params: Record<string, string | number> = { page, limit };
    
    const response = await api.get('/job-reviews/pending', { params });
    return response.data.result;
  } catch (error) {
    console.error('Error fetching pending reviews:', error);
    throw error;
  }
};

// Get jobs by status (admin only)
export const getJobsByStatus = async (
  page: number = 1,
  limit: number = 10,
  status: 'pending_review' | 'approved' | 'rejected' | 'all' = 'all'
): Promise<{ jobs: any[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> => {
  try {
    const params: Record<string, string | number> = { page, limit, status };
    
    const response = await api.get('/job-reviews/jobs', { params });
    return response.data.result;
  } catch (error) {
    console.error('Error fetching jobs by status:', error);
    throw error;
  }
};

// Get review statistics (admin only)
export const getReviewStatistics = async (): Promise<any> => {
  try {
    const response = await api.get('/job-reviews/statistics');
    return response.data.result;
  } catch (error) {
    console.error('Error fetching review statistics:', error);
    throw error;
  }
};
