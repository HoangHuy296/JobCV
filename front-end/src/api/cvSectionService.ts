import apiClient from './index';

export interface CVSection {
  id: number;
  name: string;
  key_name: string;
  description: string;
  icon: string;
  default_fields: {
    fields: Array<{
      id: string;
      type: 'text' | 'title' | 'richtext' | 'image';
      label: string;
      placeholder?: string;
      required?: boolean;
    }>;
  };
  category: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  modified_at: string;
}

export interface TemplateSection {
  id: number;
  template_id: number;
  section_id: number;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  custom_fields?: any;
  is_required: boolean;
  display_order: number;
  name: string;
  key_name: string;
  description: string;
  icon: string;
  default_fields: any;
  category: string;
}

export interface UserSection {
  id: number;
  cv_id: number;
  section_id: number;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  data: Record<string, any>;
  is_visible: boolean;
  display_order: number;
  name: string;
  key_name: string;
  icon: string;
  default_fields: any;
  category: string;
}

// ============ PUBLIC APIs ============

// Lấy danh sách sections đang active
export const getActiveSections = async (params?: {
  category?: string;
  search?: string;
}) => {
  const response = await apiClient.get('/cv-sections/active', { params });
  return response.data;
};

// ============ USER APIs ============

// Lấy sections của CV
export const getUserCVSections = async (cvId: number) => {
  const response = await apiClient.get(`/cv-sections/cv/${cvId}`);
  return response.data;
};

// Lưu section vào CV
export const saveUserCVSection = async (cvId: number, data: {
  section_id: number;
  position: { x: number; y: number; width: number; height: number };
  data: Record<string, any>;
  is_visible?: boolean;
  display_order?: number;
}) => {
  const response = await apiClient.post(`/cv-sections/cv/${cvId}`, data);
  return response.data;
};

// Cập nhật user section
export const updateUserCVSection = async (userSectionId: number, data: {
  position?: { x: number; y: number; width: number; height: number };
  data?: Record<string, any>;
  is_visible?: boolean;
  display_order?: number;
}) => {
  const response = await apiClient.put(`/cv-sections/user-section/${userSectionId}`, data);
  return response.data;
};

// Xóa user section
export const deleteUserCVSection = async (userSectionId: number) => {
  const response = await apiClient.delete(`/cv-sections/user-section/${userSectionId}`);
  return response.data;
};

// ============ ADMIN APIs ============

// Lấy tất cả sections (admin)
export const getAllSections = async (params?: {
  category?: string;
  is_active?: boolean;
  search?: string;
}) => {
  const response = await apiClient.get('/cv-sections', { params });
  return response.data;
};

// Lấy section theo ID (admin)
export const getSectionById = async (id: number) => {
  const response = await apiClient.get(`/cv-sections/${id}`);
  return response.data;
};

// Tạo section mới (admin)
export const createSection = async (data: {
  name: string;
  key_name: string;
  description?: string;
  icon?: string;
  default_fields: any;
  category?: string;
  is_active?: boolean;
  display_order?: number;
}) => {
  const response = await apiClient.post('/cv-sections', data);
  return response.data;
};

// Cập nhật section (admin)
export const updateSection = async (id: number, data: any) => {
  const response = await apiClient.put(`/cv-sections/${id}`, data);
  return response.data;
};

// Xóa section (admin)
export const deleteSection = async (id: number) => {
  const response = await apiClient.delete(`/cv-sections/${id}`);
  return response.data;
};

// ============ TEMPLATE SECTION APIs (ADMIN) ============

// Lấy sections của template
export const getTemplateSections = async (templateId: number) => {
  const response = await apiClient.get(`/cv-sections/template/${templateId}/sections`);
  return response.data;
};

// Thêm section vào template
export const addSectionToTemplate = async (templateId: number, data: {
  section_id: number;
  position: { x: number; y: number; width: number; height: number };
  custom_fields?: any;
  is_required?: boolean;
  display_order?: number;
}) => {
  const response = await apiClient.post(`/cv-sections/template/${templateId}/sections`, data);
  return response.data;
};

// Cập nhật section trong template
export const updateTemplateSection = async (templateSectionId: number, data: {
  position?: { x: number; y: number; width: number; height: number };
  custom_fields?: any;
  is_required?: boolean;
  display_order?: number;
}) => {
  const response = await apiClient.put(`/cv-sections/template-section/${templateSectionId}`, data);
  return response.data;
};

// Xóa section khỏi template
export const removeTemplateSection = async (templateSectionId: number) => {
  const response = await apiClient.delete(`/cv-sections/template-section/${templateSectionId}`);
  return response.data;
};
