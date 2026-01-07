import api from './index';

export interface APIKey {
  id: number;
  name: string;
  provider: string;
  api_key?: string;
  api_key_preview: string;
  is_active: boolean;
  usage_count: number;
  last_used_at: string | null;
  daily_limit: number;
  daily_usage: number;
  last_reset_date: string | null;
  priority: number;
  notes: string | null;
  created_at: string;
  modified_at: string;
}

export interface APIKeyCreate {
  name: string;
  provider?: string;
  api_key: string;
  is_active?: boolean;
  daily_limit?: number;
  priority?: number;
  notes?: string;
}

export interface APIKeyUpdate {
  name?: string;
  api_key?: string;
  is_active?: boolean;
  daily_limit?: number;
  priority?: number;
  notes?: string;
}

export interface UsageStats {
  provider: string;
  total_keys: number;
  active_keys: number;
  total_usage: number;
  total_daily_usage: number;
  avg_daily_usage: number;
}

// Get all API keys
export const getAllAPIKeys = async (provider?: string, activeOnly?: boolean) => {
  const params: any = {};
  if (provider) params.provider = provider;
  if (activeOnly) params.active = 'true';
  
  const response = await api.get('/api-keys', { params });
  return response.data;
};

// Get API key by ID
export const getAPIKeyById = async (id: number) => {
  const response = await api.get(`/api-keys/${id}`);
  return response.data;
};

// Create new API key
export const createAPIKey = async (data: APIKeyCreate) => {
  const response = await api.post('/api-keys', data);
  return response.data;
};

// Update API key
export const updateAPIKey = async (id: number, data: APIKeyUpdate) => {
  const response = await api.put(`/api-keys/${id}`, data);
  return response.data;
};

// Delete API key
export const deleteAPIKey = async (id: number) => {
  const response = await api.delete(`/api-keys/${id}`);
  return response.data;
};

// Toggle API key active status
export const toggleAPIKeyActive = async (id: number) => {
  const response = await api.patch(`/api-keys/${id}/toggle-active`);
  return response.data;
};

// Get usage statistics
export const getUsageStats = async (provider?: string) => {
  const params: any = {};
  if (provider) params.provider = provider;
  
  const response = await api.get('/api-keys/stats', { params });
  return response.data;
};
