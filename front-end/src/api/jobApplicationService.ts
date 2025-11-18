import apiClient from './index';

export interface JobApplication {
  id: number;
  job_id: number;
  user_id: number;
  cv_id: number | null;
  cover_letter: string | null;
  status: 'pending' | 'reviewing' | 'shortlisted' | 'rejected' | 'accepted';
  applied_at: string;
  reviewed_at: string | null;
  reviewed_by: number | null;
  notes: string | null;
  created_at: string;
  modified_at: string;
  // Joined fields
  user_name?: string;
  user_email?: string;
  user_image?: string;
  job_title?: string;
  job_salary?: string;
  job_location?: string;
  date_end_register?: string;
  company_name?: string;
  company_logo_id?: number | null;
  cv_title?: string;
  cv_file_path?: string;
}

export interface ApplicationStats {
  total: number;
  pending: number;
  reviewing: number;
  shortlisted: number;
  rejected: number;
  accepted: number;
}

// Apply for a job
export const applyForJob = async (data: {
  job_id: number;
  cv_id?: number;
  cover_letter?: string;
}): Promise<JobApplication> => {
  const response = await apiClient.post('/job-applications/apply', data);
  return response.data.result;
};

// Get current user's applications
export const getMyApplications = async (
  page: number = 1,
  limit: number = 20
): Promise<{
  applications: JobApplication[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> => {
  const response = await apiClient.get('/job-applications/my-applications', {
    params: { page, limit }
  });
  return response.data.result;
};

// Get applications for a job (recruiter/admin)
export const getJobApplications = async (
  jobId: number,
  page: number = 1,
  limit: number = 20,
  status?: string
): Promise<{
  applications: JobApplication[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> => {
  const response = await apiClient.get(`/job-applications/job/${jobId}`, {
    params: { page, limit, status }
  });
  return response.data.result;
};

// Get application details
export const getApplicationById = async (id: number): Promise<JobApplication> => {
  const response = await apiClient.get(`/job-applications/${id}`);
  return response.data.result;
};

// Update application status (recruiter/admin)
export const updateApplicationStatus = async (
  id: number,
  status: string,
  notes?: string
): Promise<JobApplication> => {
  const response = await apiClient.put(`/job-applications/${id}/status`, {
    status,
    notes
  });
  return response.data.result;
};

// Withdraw application
export const withdrawApplication = async (id: number): Promise<boolean> => {
  const response = await apiClient.delete(`/job-applications/${id}/withdraw`);
  return response.data.result;
};

// Get job application statistics
export const getJobApplicationStats = async (jobId: number): Promise<ApplicationStats> => {
  const response = await apiClient.get(`/job-applications/job/${jobId}/stats`);
  return response.data.result;
};
