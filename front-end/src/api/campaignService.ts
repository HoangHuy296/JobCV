import api from './index';

export interface Campaign {
  id: number;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  company_id: number;
  created_by: number;
  created_at: string;
  modified_at: string;
  creator_name?: string;
  job_count?: number;
}

export interface CampaignStats {
  total_jobs: number;
  approved_jobs: number;
  draft_jobs: number;
  pending_jobs: number;
}

// Get all campaigns for a company
export const getCampaigns = async (companyId: number): Promise<Campaign[]> => {
  try {
    const response = await api.get(`/campaigns?company_id=${companyId}`);
    return response.data.result;
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    throw error;
  }
};

// Get campaign by ID
export const getCampaign = async (id: number): Promise<Campaign> => {
  try {
    const response = await api.get(`/campaigns/${id}`);
    return response.data.result;
  } catch (error) {
    console.error('Error fetching campaign:', error);
    throw error;
  }
};

// Create campaign
export const createCampaign = async (campaignData: Partial<Campaign>): Promise<Campaign> => {
  try {
    const response = await api.post('/campaigns', campaignData);
    return response.data.result;
  } catch (error) {
    console.error('Error creating campaign:', error);
    throw error;
  }
};

// Update campaign
export const updateCampaign = async (id: number, campaignData: Partial<Campaign>): Promise<Campaign> => {
  try {
    const response = await api.put(`/campaigns/${id}`, campaignData);
    return response.data.result;
  } catch (error) {
    console.error('Error updating campaign:', error);
    throw error;
  }
};

// Delete campaign
export const deleteCampaign = async (id: number): Promise<boolean> => {
  try {
    const response = await api.delete(`/campaigns/${id}`);
    return response.data.result;
  } catch (error) {
    console.error('Error deleting campaign:', error);
    throw error;
  }
};

// Add job to campaign
export const addJobToCampaign = async (campaignId: number, jobId: number): Promise<boolean> => {
  try {
    const response = await api.post(`/campaigns/${campaignId}/jobs`, { job_id: jobId });
    return response.data.result;
  } catch (error) {
    console.error('Error adding job to campaign:', error);
    throw error;
  }
};

// Remove job from campaign
export const removeJobFromCampaign = async (campaignId: number, jobId: number): Promise<boolean> => {
  try {
    const response = await api.delete(`/campaigns/${campaignId}/jobs/${jobId}`);
    return response.data.result;
  } catch (error) {
    console.error('Error removing job from campaign:', error);
    throw error;
  }
};

// Get jobs in campaign
export const getCampaignJobs = async (campaignId: number): Promise<any[]> => {
  try {
    const response = await api.get(`/campaigns/${campaignId}/jobs`);
    return response.data.result;
  } catch (error) {
    console.error('Error fetching campaign jobs:', error);
    throw error;
  }
};

// Get campaign statistics
export const getCampaignStats = async (campaignId: number): Promise<CampaignStats> => {
  try {
    const response = await api.get(`/campaigns/${campaignId}/stats`);
    return response.data.result;
  } catch (error) {
    console.error('Error fetching campaign stats:', error);
    throw error;
  }
};
