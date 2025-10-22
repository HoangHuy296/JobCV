import apiClient from './index';
import type { Media } from './mediaService';

// Define User type
export interface User {
  id: number;
  name: string;
  email: string;
  role_id: number;
  is_active: boolean;
  image: Media | null;
  created_at: string;
  modified_at: string;
  deleted_at: string | null;
  role?: {
    id: number;
    name: string;
    description: string;
  };
}

// Define UserInput type for creating/updating users
export interface UserInput {
  name: string;
  email: string;
  password?: string;
  role_id?: number;
  is_active?: boolean;
  image_id?: number;
}

// Define UserUpdate type for updating user status
export interface UserStatusUpdate {
  is_active: boolean;
}

export const userService = {
  // Get all users with pagination and filtering
  getAllUsers: async (
    page: number = 1,
    limit: number = 10,
    search: string = '',
    is_active?: string,
    role_id?: string
  ): Promise<{ users: User[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> => {
    const params: Record<string, string | number> = { page, limit };
    
    if (search) params.search = search;
    if (is_active !== undefined) params.is_active = is_active;
    if (role_id !== undefined) params.role_id = role_id;
    
    const response = await apiClient.get('/users', { params });
    return response.data.result;
  },


  // Get user by ID
  getUserById: async (id: number): Promise<User> => {
    const response = await apiClient.get(`/users/${id}`);
    return response.data.result;
  },

  // Create a new user
  createUser: async (userData: UserInput): Promise<User> => {
    const response = await apiClient.post('/users', userData);
    return response.data.result;
  },

  // Update a user
  updateUser: async (id: number, userData: Partial<UserInput>): Promise<User> => {
    const response = await apiClient.put(`/users/${id}`, userData);
    return response.data.result;
  },

  // Delete a user
  deleteUser: async (id: number): Promise<{id: number}> => {
    const response = await apiClient.delete(`/users/${id}`);
    return response.data.result;
  },

  // Set user active status
  setUserActiveStatus: async (id: number, statusData: UserStatusUpdate): Promise<User> => {
    const response = await apiClient.put(`/users/${id}/active`, statusData);
    return response.data.result;
  }
};
