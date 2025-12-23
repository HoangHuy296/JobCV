import apiClient from './index';

// ============ PUBLIC APIs ============

// Lấy danh sách templates đã publish
export const getPublishedTemplates = async (params?: {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  orderBy?: string;
  orderDir?: string;
}) => {
  const response = await apiClient.get('/cv-templates/published', { params });
  return response.data;
};

// Xem preview template
export const getTemplatePreview = async (id: number) => {
  const response = await apiClient.get(`/cv-templates/${id}/preview`);
  return response.data;
};

// Lấy danh sách categories
export const getTemplateCategories = async () => {
  const response = await apiClient.get('/cv-templates/categories');
  return response.data;
};

// ============ USER APIs (cần auth) ============

// Tạo CV từ template
export const createCVFromTemplate = async (cvData: {
  template_id: number;
  title: string;
  data: any; // Changed from template_data to data
}) => {
  const response = await apiClient.post('/cv-templates/create-cv', cvData);
  return response.data;
};

// Cập nhật CV từ template
export const updateCVFromTemplate = async (id: number, updateData: {
  title?: string;
  data?: any; // Changed from template_data to data
}) => {
  const response = await apiClient.put(`/cv-templates/update-cv/${id}`, updateData);
  return response.data;
};

// ============ ADMIN APIs ============

// Upload hình ảnh template (admin)
export const uploadTemplateImage = async (file: File) => {
  const formData = new FormData();
  formData.append('image', file);
  
  const response = await apiClient.post('/cv-templates/upload-image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// Lấy tất cả templates (admin)
export const getAllTemplates = async (params?: {
  page?: number;
  limit?: number;
  is_published?: boolean;
  category?: string;
  search?: string;
  orderBy?: string;
  orderDir?: string;
}) => {
  const response = await apiClient.get('/cv-templates', { params });
  return response.data;
};

// Lấy template theo ID (admin)
export const getTemplateById = async (id: number) => {
  const response = await apiClient.get(`/cv-templates/${id}`);
  return response.data;
};

// Tạo template mới (admin)
export const createTemplate = async (data: {
  name: string;
  description?: string;
  thumbnail_url?: string;
  category?: string;
  structure: any;
  styles?: any;
  layout?: string;
  is_published?: boolean;
  is_premium?: boolean;
  is_public?: boolean;
}) => {
  const response = await apiClient.post('/cv-templates', data);
  return response.data;
};

// Cập nhật template (admin)
export const updateTemplate = async (id: number, data: any) => {
  const response = await apiClient.put(`/cv-templates/${id}`, data);
  return response.data;
};

// Xóa template (admin)
export const deleteTemplate = async (id: number) => {
  const response = await apiClient.delete(`/cv-templates/${id}`);
  return response.data;
};
