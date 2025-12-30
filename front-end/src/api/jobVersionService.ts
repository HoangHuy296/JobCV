import api from './index';

export interface JobVersion {
  id: number;
  job_id: number;
  version_number: number;
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
  status: 'draft' | 'pending_review' | 'approved' | 'rejected' | 'archived';
  is_live: boolean;
  created_by: number;
  created_at: string;
  modified_at: string;
  // Joined fields
  creator_name?: string;
  review_status?: string;
  feedback?: string;
  review_date?: string;
}

export interface CreateJobVersionData {
  title: string;
  brief_description: string;
  requirement: string;
  benefits: string;
  salary: string;
  date_end_register?: string | null;
  years_experienced: number;
  work_hours: string;
  company_id: number;
  industry_id: number;
  location: string;
}

// Create a new version of a job
export const createJobVersion = async (jobId: number, versionData: CreateJobVersionData): Promise<JobVersion> => {
  try {
    const response = await api.post(`/jobs/${jobId}/versions`, versionData);
    return response.data.result;
  } catch (error) {
    console.error('Error creating job version:', error);
    throw error;
  }
};

// Get all versions of a job
export const getJobVersions = async (jobId: number): Promise<{ job_id: number; current_version_id: number; versions: JobVersion[] }> => {
  try {
    const response = await api.get(`/jobs/${jobId}/versions`);
    return response.data.result;
  } catch (error) {
    console.error('Error fetching job versions:', error);
    throw error;
  }
};

// Get a specific version of a job
export const getJobVersion = async (jobId: number, versionId: number): Promise<JobVersion> => {
  try {
    const response = await api.get(`/jobs/${jobId}/versions/${versionId}`);
    return response.data.result;
  } catch (error) {
    console.error('Error fetching job version:', error);
    throw error;
  }
};

// Set a version as live (admin only)
export const setVersionLive = async (jobId: number, versionId: number): Promise<boolean> => {
  try {
    const response = await api.put(`/jobs/${jobId}/versions/${versionId}/live`);
    return response.data.result;
  } catch (error) {
    console.error('Error setting version as live:', error);
    throw error;
  }
};

// Review a job version (admin only)
export const reviewJobVersion = async (
  jobId: number,
  versionId: number,
  status: 'approved' | 'rejected',
  feedback?: string
): Promise<{ job_id: number; version_id: number; status: string; feedback?: string }> => {
  try {
    const response = await api.put(`/jobs/${jobId}/versions/${versionId}/review`, { status, feedback });
    return response.data.result;
  } catch (error) {
    console.error('Error reviewing job version:', error);
    throw error;
  }
};

// Set a version as the primary version (admin only)
export const setPrimaryVersion = async (jobId: number, versionId: number): Promise<boolean> => {
  try {
    const response = await api.put(`/jobs/${jobId}/versions/${versionId}/primary`);
    return response.data.result;
  } catch (error) {
    console.error('Error setting primary version:', error);
    throw error;
  }
};

// Update a job version
export const updateJobVersion = async (jobId: number, versionId: number, versionData: Partial<CreateJobVersionData>): Promise<JobVersion> => {
  try {
    const response = await api.put(`/jobs/${jobId}/versions/${versionId}`, versionData);
    return response.data.result;
  } catch (error) {
    console.error('Error updating job version:', error);
    throw error;
  }
};

// Delete a job version
export const deleteJobVersion = async (jobId: number, versionId: number): Promise<boolean> => {
  try {
    const response = await api.delete(`/jobs/${jobId}/versions/${versionId}`);
    return response.data.result;
  } catch (error) {
    console.error('Error deleting job version:', error);
    throw error;
  }
};
