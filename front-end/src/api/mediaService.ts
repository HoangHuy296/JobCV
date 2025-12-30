import apiClient from './index';

export interface MediaEntity {
  entity_type: 'user' | 'company';
  entity_id: number;
  entity_name: string;
  entity_email?: string;
}

export interface Media {
  id: number;
  filename: string;
  original_name: string;
  mime_type: string;
  size: number;
  path: string;
  url: string;
  created_by: number | null;
  created_at: string;
  modified_at: string;
  deleted_at: string | null;
  used_by?: MediaEntity[];
}

export interface MediaListResponse {
  media: Media[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Upload a media file
export const uploadMedia = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await apiClient.post('/media/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data.result;
};

// Create media from external URL
export const createMediaFromUrl = async (url: string, originalName?: string): Promise<Media> => {
  const response = await apiClient.post('/media/from-url', {
    url,
    original_name: originalName
  });
  
  return response.data.result;
};

// Get media by ID
export const getMediaById = async (id: number) => {
  const response = await apiClient.get(`/media/${id}`);
  return response.data.result;
};

// Get all media with pagination and filtering
export const getAllMedia = async (
  page: number = 1,
  limit: number = 10,
  search: string = ''
): Promise<MediaListResponse> => {
  const params: Record<string, string | number> = { page, limit };
  
  if (search) params.search = search;
  
  const response = await apiClient.get('/media', { params });
  return response.data.result;
};

// Delete media by ID
export const deleteMedia = async (id: number) => {
  const response = await apiClient.delete(`/media/${id}`);
  return response.data.result;
};
