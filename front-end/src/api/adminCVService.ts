import apiClient from './index';

export interface AdminCV {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  title: string;
  file_name?: string;
  file_path?: string;
  file_url?: string;
  file_size?: number;
  mime_type?: string;
  template_id?: number;
  template_data?: any;
  is_template: boolean;
  is_published: boolean;
  created_at: string;
  modified_at: string;
  deleted: boolean;
}

export interface AdminCVsResponse {
  success: boolean;
  data: AdminCV[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const getAllCVs = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<AdminCVsResponse> => {
  const response = await apiClient.get('/cvs/admin/all', { params });
  return response.data;
};
