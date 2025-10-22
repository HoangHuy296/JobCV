import api from './index';

export interface Industry {
  id: number;
  name: string;
  description: string;
  created_at: string;
  modified_at: string;
  deleted_at: string | null;
}

export interface CreateIndustryData {
  name: string;
  description: string;
}

export interface UpdateIndustryData {
  name?: string;
  description?: string;
}

// Get all industries with pagination and filtering
// If getAll is true, limit will be set to -1 to get all industries
export const getAllIndustries = async (
  page: number = 1,
  limit: number = 10,
  search: string = '',
  getAll: boolean = false
): Promise<{ industries: Industry[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> => {
  const params: Record<string, string | number> = { page };
  
  // If getAll is true, set limit to -1 to get all industries
  params.limit = getAll ? -1 : limit;
  
  if (search) params.search = search;
  
  const response = await api.get('/industries', { params });
  return response.data.result;
};

// Get industry by ID
export const getIndustryById = async (id: number): Promise<Industry> => {
  const response = await api.get(`/industries/${id}`);
  return response.data.result;
};

// Create a new industry
export const createIndustry = async (industryData: CreateIndustryData): Promise<Industry> => {
  const response = await api.post('/industries', industryData);
  return response.data.result;
};

// Update industry
export const updateIndustry = async (id: number, industryData: UpdateIndustryData): Promise<Industry> => {
  const response = await api.put(`/industries/${id}`, industryData);
  return response.data.result;
};

// Delete industry
export const deleteIndustry = async (id: number): Promise<{id: number}> => {
  const response = await api.delete(`/industries/${id}`);
  return response.data.result;
};
