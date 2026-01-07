import api from './index';
import type { Media } from './mediaService';

export interface Company {
  id: number;
  name: string;
  description: string;
  industries: number[];
  industry: string;
  website: string;
  location: string;
  logo: Media | null;
  employees: string;
  facebook: string;
  youtube: string;
  linkedin: string;
  twitter: string;
  instagram: string;
  created_by: number;
  created_at: string;
  modified_at: string;
  deleted_at: string | null;
  subscription_count?: number;
}

export interface CreateCompanyData {
  name: string;
  description: string;
  industries: number[];
  website?: string;
  location: string;
  logo_id?: number;
  employees?: string;
  facebook?: string;
  youtube?: string;
  linkedin?: string;
  twitter?: string;
  instagram?: string;
}

export interface UpdateCompanyData {
  name?: string;
  description?: string;
  industries?: number[];
  website?: string;
  location?: string | string[];
  logo_id?: number;
  employees?: string;
  facebook?: string;
  youtube?: string;
  linkedin?: string;
  twitter?: string;
  instagram?: string;
}

// Get all companies with pagination and filtering
export const getAllCompanies = async (
  page: number = 1,
  limit: number = 10,
  search: string = '',
  industry: string = ''
): Promise<any> => {
  const params: Record<string, string | number> = { page, limit };
  
  if (search) params.search = search;
  if (industry) params.industry = industry;
  
  const response = await api.get('/companies', { params });
  return response.data.result;
};

// Create a new company
export const createCompany = async (companyData: CreateCompanyData): Promise<Company> => {
  // Handle location array by joining with '; '
  const dataToSend = {
    ...companyData,
    location: Array.isArray(companyData.location) 
      ? companyData.location.join('; ')
      : companyData.location
  };
  
  const response = await api.post('/companies', dataToSend);
  return response.data.result;
};

// Get company by ID
export const getCompanyById = async (id: number): Promise<Company> => {
  const response = await api.get(`/companies/${id}`);
  return response.data.result;
};

// Get current user's company
export const getMyCompany = async (): Promise<Company> => {
  const response = await api.get('/companies/my-company');
  return response.data.result;
};

// Update company
export const updateCompany = async (id: number, companyData: UpdateCompanyData): Promise<Company> => {
  // Handle location array by joining with '; '
  const dataToSend = {
    ...companyData,
    location: Array.isArray(companyData.location) 
      ? companyData.location.join('; ')
      : companyData.location
  };
  
  const response = await api.put(`/companies/${id}`, dataToSend);
  return response.data.result;
};

// Delete company
export const deleteCompany = async (id: number): Promise<boolean> => {
  const response = await api.delete(`/companies/${id}`);
  return response.data.result;
};

// Subscribe to a company
export const subscribeToCompany = async (companyId: number): Promise<boolean> => {
  const response = await api.post(`/companies/${companyId}/subscribe`);
  return response.data.result;
};

// Unsubscribe from a company
export const unsubscribeFromCompany = async (companyId: number): Promise<boolean> => {
  const response = await api.post(`/companies/${companyId}/unsubscribe`);
  return response.data.result;
};

// Check subscription status
export const checkSubscriptionStatus = async (companyId: number): Promise<boolean> => {
  const response = await api.get(`/companies/${companyId}/subscription-status`);
  return response.data.result;
};

// Get user's subscribed companies
export const getUserSubscribedCompanies = async (page: number = 1, limit: number = 10): Promise<{
  companies: Company[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}> => {
  try {
    const response = await api.get(`/companies/user/subscribed-companies?page=${page}&limit=${limit}`);
    return response.data.result;
  } catch (error) {
    console.error('Error getting user subscribed companies:', error);
    throw error;
  }
};

// Get top companies based on subscription count and job likes
export interface TopCompany extends Company {
  subscriber_count: number;
  total_job_likes: number;
  active_jobs: number;
}

export const getTopCompanies = async (limit: number = 10): Promise<TopCompany[]> => {
  try {
    const response = await api.get(`/companies/top?limit=${limit}`);
    return response.data.result;
  } catch (error) {
    console.error('Error getting top companies:', error);
    throw error;
  }
};
