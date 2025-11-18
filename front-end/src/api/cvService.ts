import api from './index';

export interface CV {
  id: number;
  user_id: number;
  title: string;
  file_path?: string;
  file_name?: string;
  file_size?: number;
  mime_type?: string;
  content?: any;
  is_template: boolean;
  created_at: string;
  modified_at: string;
  deleted_at: string | null;
}

export interface CreateCVData {
  title: string;
  content?: string;
  is_template?: boolean;
  file?: File;
}

// Get all CVs for the current user with pagination and filtering
export const getUserCVs = async (
  page: number = 1,
  limit: number = 10,
  search: string = '',
  is_template?: string
): Promise<{ cvs: CV[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> => {
  const params: Record<string, string | number> = { page, limit };
  
  if (search) params.search = search;
  if (is_template !== undefined) params.is_template = is_template;
  
  const response = await api.get('/cvs', { params });
  return response.data.result;
};

// Upload a new CV
export const uploadCV = async (cvData: CreateCVData): Promise<CV> => {
  const formData = new FormData();
  formData.append('title', cvData.title);
  
  if (cvData.content) {
    formData.append('content', cvData.content);
  }
  
  if (cvData.is_template !== undefined) {
    formData.append('is_template', cvData.is_template.toString());
  }
  
  if (cvData.file) {
    formData.append('file', cvData.file);
  }
  
  const response = await api.post('/cvs', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data.result.cv;
};

// Download a CV
export const downloadCV = async (id: number): Promise<Blob> => {
  const response = await api.get(`/cvs/${id}`, {
    responseType: 'blob',
  });
  return response.data;
};

// Check if CV is used in job applications
export const checkCVInApplications = async (id: number): Promise<{
  isUsed: boolean;
  applications: Array<{
    id: number;
    job_id: number;
    job_title: string;
    status: string;
    recruiter_id: number;
    recruiter_name: string;
  }>;
}> => {
  const response = await api.get(`/cvs/${id}/check-applications`);
  return response.data.result;
};

// Delete a CV
export const deleteCV = async (id: number): Promise<void> => {
  const response = await api.delete(`/cvs/${id}`);
  return response.data;
};

// Get all public templates
export const getPublicTemplates = async (): Promise<CV[]> => {
  const response = await api.get('/cvs/templates');
  return response.data.result.templates;
};

// Get a specific template
export const getTemplateById = async (id: number): Promise<CV> => {
  const response = await api.get(`/cvs/templates/${id}`);
  return response.data.result.template;
};

// Create a template from an existing CV
export const createTemplateFromCV = async (cvId: number, title: string): Promise<number> => {
  const response = await api.post('/cvs/create-template', { cvId, title });
  return response.data.result.templateId;
};
