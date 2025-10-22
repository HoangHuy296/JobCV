import apiClient from './index';

export interface Setting {
  id: number;
  setting_key: string;
  setting_value: string;
  setting_group: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface SettingInput {
  key: string;
  value: string;
  group: string;
  description?: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface SettingsResponse {
  settings: Setting[];
  pagination: Pagination;
}

export const settingService = {
  // Get all settings with pagination and filtering
  getAllSettings: async (
    page: number = 1,
    limit: number = 10,
    group: string = '',
    key: string = ''
  ): Promise<SettingsResponse> => {
    const params: Record<string, string> = {};
    if (page) params.page = page.toString();
    if (limit) params.limit = limit.toString();
    if (group) params.group = group;
    if (key) params.key = key;
    
    const response = await apiClient.get('/settings', { params });
    return response.data.result;
  },

  // Get setting by key and group
  getSettingByKeyAndGroup: async (key: string, group: string): Promise<Setting> => {
    const response = await apiClient.get(`/settings/${group}/${key}`);
    return response.data.result;
  },

  // Create or update a setting
  createOrUpdateSetting: async (setting: SettingInput): Promise<Setting> => {
    const response = await apiClient.post('/settings', setting);
    return response.data.result;
  },

  // Delete a setting
  deleteSetting: async (key: string, group: string): Promise<boolean> => {
    const response = await apiClient.delete(`/settings/${group}/${key}`);
    return response.data.result;
  }
};
