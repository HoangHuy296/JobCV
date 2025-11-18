import api from './index';

export interface Company {
  id: number;
  name: string;
  description: string;
  logo: string;
  website: string;
  location: string;
  employees: string;
}

export interface Job {
  id: number;
  title: string;
  brief_description: string;
  requirement: string;
  benefits: string;
  salary: string;
  date_end_register: string;
  years_experienced: number;
  work_hours: string;
  company_id: number;
  industry_id: number;
  location: string;
  created_by: number;
  created_at: string;
  modified_at: string;
  deleted_at: string | null;
  deleted: boolean;
  status: 'draft' | 'pending_review' | 'approved' | 'rejected';
  is_closed?: boolean;
  max_applicants?: number | null;
  auto_close_on_threshold?: boolean;
  // Versioning fields
  current_version_id?: number;
  version_count?: number;
  version_number?: number;
  version_status?: string;
  // Joined fields
  company_name?: string;
  company_logo?: string;
  industry_name?: string;
  liked_at?: string;
  // Company object from API
  company?: Company;
}

export interface CreateJobData {
  title: string;
  brief_description: string;
  requirement: string;
  benefits: string;
  salary: string;
  date_end_register: string;
  years_experienced: number;
  work_hours: string;
  company_id: number;
  industry_id: number;
  location: string;
  status?: 'draft' | 'pending_review' | 'approved' | 'rejected';
  max_applicants?: number | null;
  auto_close_on_threshold?: boolean;
}

export interface UpdateJobData {
  title?: string;
  brief_description?: string;
  requirement?: string;
  benefits?: string;
  salary?: string;
  date_end_register?: string;
  years_experienced?: number;
  work_hours?: string;
  company_id?: number;
  industry_id?: number;
  location?: string;
  status?: 'draft' | 'pending_review' | 'approved' | 'rejected';
  max_applicants?: number | null;
  auto_close_on_threshold?: boolean;
}

// Create a new job
export const createJob = async (jobData: CreateJobData): Promise<Job> => {
  const response = await api.post('/jobs', jobData);  
  return response.data.result;
};

// Get all jobs with pagination and filtering
export const getAllJobs = async (
  page: number = 1,
  limit: number = 10,
  search: string = '',
  company: string = '',
  location: string = '',
  industry: string = '',
  additionalFilters: Record<string, string> = {}
): Promise<{ jobs: Job[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> => {
  const params: Record<string, string | number> = { page, limit };
  
  if (search) params.search = search;
  if (company) params.company = company;
  if (location) params.location = location;
  if (industry) params.industry = industry;
  
  // Add any additional filters
  Object.keys(additionalFilters).forEach(key => {
    params[key] = additionalFilters[key];
  });
  
  const response = await api.get('/jobs', { params });
  return response.data.result;
};

// Get job by ID
export const getJobById = async (id: number): Promise<Job> => {
  const response = await api.get(`/jobs/${id}`);
  return response.data.result;
};

// Update job - now creates a new version
export const updateJob = async (id: number, jobData: UpdateJobData): Promise<boolean> => {
  try {
    // The backend now redirects to version creation
    const response = await api.put(`/jobs/${id}`, jobData);
    
    // If we get a 301 status, we need to create a new version instead
    if (response.status === 301) {
      // Import the createJobVersion function from jobVersionService
      const { createJobVersion } = await import('./jobVersionService');
      await createJobVersion(id, jobData as any);
      return true;
    }
    
    return response.data.result;
  } catch (error: any) {
    // If we get a 301 status in the error, we need to create a new version instead
    if (error.response?.status === 301) {
      // Import the createJobVersion function from jobVersionService
      const { createJobVersion } = await import('./jobVersionService');
      await createJobVersion(id, jobData as any);
      return true;
    }
    throw error;
  }
};

// Delete job
export const deleteJob = async (id: number): Promise<boolean> => {
  const response = await api.delete(`/jobs/${id}`);
  return response.data.result;
};

// Get user's jobs
export const getUserJobs = async (): Promise<Job[]> => {
  const response = await api.get('/jobs/user/my-jobs');
  return response.data.result;
};

// Note: getJobsByUserId has been removed as we now use getAllJobs with automatic filtering based on user role

// Like a job
export const likeJob = async (jobId: number): Promise<boolean> => {
  try {
    const response = await api.post(`/jobs/${jobId}/like`);
    return response.data.result;
  } catch (error) {
    console.error('Error liking job:', error);
    throw error;
  }
};

// Unlike a job
export const unlikeJob = async (jobId: number): Promise<boolean> => {
  try {
    const response = await api.post(`/jobs/${jobId}/unlike`);
    return response.data.result;
  } catch (error) {
    console.error('Error unliking job:', error);
    throw error;
  }
};

// Check like status
export const checkLikeStatus = async (jobId: number): Promise<boolean> => {
  try {
    const response = await api.get(`/jobs/${jobId}/like-status`);
    return response.data.result.isLiked;
  } catch (error) {
    console.error('Error checking like status:', error);
    throw error;
  }
};

// Submit job for review
export const submitForReview = async (jobId: number): Promise<boolean> => {
  try {
    // Use the jobReviewService instead
    const { submitJobForReview } = await import('./jobReviewService');
    return await submitJobForReview(jobId);
  } catch (error) {
    console.error('Error submitting job for review:', error);
    throw error;
  }
};

// Cancel job review (change status back to draft)
export const cancelReview = async (jobId: number): Promise<boolean> => {
  try {
    const response = await api.put(`/jobs/${jobId}`, { status: 'draft' });
    return response.data.result;
  } catch (error) {
    console.error('Error canceling job review:', error);
    throw error;
  }
};

// Get job preview (without checking approval status)
export const getJobPreview = async (id: number, versionId?: number): Promise<Job> => {
  try {
    const params: Record<string, string | number> = {};
    if (versionId) params.version_id = versionId;
    
    const response = await api.get(`/jobs/preview/${id}`, { params });
    return response.data.result;
  } catch (error) {
    console.error('Error getting job preview:', error);
    throw error;
  }
};

// Get user's liked jobs
export const getUserLikedJobs = async (page: number = 1, limit: number = 10): Promise<{
  jobs: Job[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}> => {
  try {
    const response = await api.get(`/jobs/user/liked-jobs?page=${page}&limit=${limit}`);
    return response.data.result;
  } catch (error) {
    console.error('Error getting user liked jobs:', error);
    throw error;
  }
};

// Close a job (recruiter only)
export const closeJob = async (jobId: number): Promise<boolean> => {
  try {
    const response = await api.put(`/jobs/${jobId}/close`);
    return response.data.result;
  } catch (error) {
    console.error('Error closing job:', error);
    throw error;
  }
};
