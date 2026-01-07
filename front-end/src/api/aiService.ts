import api from './index';

// ============ TYPES ============

export interface AIPrompt {
  id: number;
  name: string;
  filename: string;
  description: string;
  category: string;
  variables: string[];
  content?: string;
  contentError?: string;
  created_at: string;
  modified_at: string;
}

export interface AIProcess {
  id: number;
  name: string;
  code: string;
  description: string;
  prompt_id: number | null;
  prompt_name?: string;
  prompt_filename?: string;
  prompt_category?: string;
  prompt_content?: string;
  is_active: boolean;
  config: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  };
  created_at: string;
  modified_at: string;
}

export interface CreatePromptData {
  name: string;
  filename: string;
  description?: string;
  category?: string;
  variables?: string[];
  content: string;
}

export interface UpdatePromptData {
  name?: string;
  description?: string;
  category?: string;
  variables?: string[];
  content?: string;
}

export interface CreateProcessData {
  name: string;
  code: string;
  description?: string;
  prompt_id?: number;
  is_active?: boolean;
  config?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  };
}

export interface UpdateProcessData {
  name?: string;
  description?: string;
  prompt_id?: number;
  is_active?: boolean;
  config?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  };
}

// ============ PROMPT APIs ============

export const getAllPrompts = async (): Promise<AIPrompt[]> => {
  try {
    const response = await api.get('/ai/prompts');
    return response.data.result;
  } catch (error) {
    console.error('Error getting prompts:', error);
    throw error;
  }
};

export const getPromptById = async (id: number): Promise<AIPrompt> => {
  try {
    const response = await api.get(`/ai/prompts/${id}`);
    return response.data.result;
  } catch (error) {
    console.error('Error getting prompt:', error);
    throw error;
  }
};

export const createPrompt = async (data: CreatePromptData): Promise<AIPrompt> => {
  try {
    const response = await api.post('/ai/prompts', data);
    return response.data.result;
  } catch (error) {
    console.error('Error creating prompt:', error);
    throw error;
  }
};

export const updatePrompt = async (id: number, data: UpdatePromptData): Promise<AIPrompt> => {
  try {
    const response = await api.put(`/ai/prompts/${id}`, data);
    return response.data.result;
  } catch (error) {
    console.error('Error updating prompt:', error);
    throw error;
  }
};

export const deletePrompt = async (id: number): Promise<boolean> => {
  try {
    const response = await api.delete(`/ai/prompts/${id}`);
    return response.data.success;
  } catch (error) {
    console.error('Error deleting prompt:', error);
    throw error;
  }
};

export const listPromptFiles = async (): Promise<string[]> => {
  try {
    const response = await api.get('/ai/prompts/files');
    return response.data.result;
  } catch (error) {
    console.error('Error listing prompt files:', error);
    throw error;
  }
};

// ============ PROCESS APIs ============

export const getAllProcesses = async (): Promise<AIProcess[]> => {
  try {
    const response = await api.get('/ai/processes');
    return response.data.result;
  } catch (error) {
    console.error('Error getting processes:', error);
    throw error;
  }
};

export const getProcessById = async (id: number): Promise<AIProcess> => {
  try {
    const response = await api.get(`/ai/processes/${id}`);
    return response.data.result;
  } catch (error) {
    console.error('Error getting process:', error);
    throw error;
  }
};

export const getProcessByCode = async (code: string): Promise<AIProcess> => {
  try {
    const response = await api.get(`/ai/processes/code/${code}`);
    return response.data.result;
  } catch (error) {
    console.error('Error getting process by code:', error);
    throw error;
  }
};

export const createProcess = async (data: CreateProcessData): Promise<AIProcess> => {
  try {
    const response = await api.post('/ai/processes', data);
    return response.data.result;
  } catch (error) {
    console.error('Error creating process:', error);
    throw error;
  }
};

export const updateProcess = async (id: number, data: UpdateProcessData): Promise<AIProcess> => {
  try {
    const response = await api.put(`/ai/processes/${id}`, data);
    return response.data.result;
  } catch (error) {
    console.error('Error updating process:', error);
    throw error;
  }
};

export const assignPromptToProcess = async (processId: number, promptId: number): Promise<AIProcess> => {
  try {
    const response = await api.post('/ai/processes/assign-prompt', { processId, promptId });
    return response.data.result;
  } catch (error) {
    console.error('Error assigning prompt to process:', error);
    throw error;
  }
};

export const toggleProcessActive = async (id: number): Promise<AIProcess> => {
  try {
    const response = await api.patch(`/ai/processes/${id}/toggle-active`);
    return response.data.result;
  } catch (error) {
    console.error('Error toggling process active:', error);
    throw error;
  }
};

export const deleteProcess = async (id: number): Promise<boolean> => {
  try {
    const response = await api.delete(`/ai/processes/${id}`);
    return response.data.success;
  } catch (error) {
    console.error('Error deleting process:', error);
    throw error;
  }
};
