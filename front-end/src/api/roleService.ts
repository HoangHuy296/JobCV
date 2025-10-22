import apiClient from './index';

// Define Role type
export interface Role {
  id: number;
  name: string;
  description: string;
  created_at: string;
  modified_at: string;
  deleted_at: string | null;
}

// Define RoleInput type for creating/updating roles
export interface RoleInput {
  name: string;
  description: string;
}

export const roleService = {
  // Get all roles with pagination and filtering
  getAllRoles: async (
    page: number = 1,
    limit: number = 10,
    search: string = ''
  ): Promise<{ roles: Role[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> => {
    const params: Record<string, string | number> = { page, limit };
    
    if (search) params.search = search;
    
    const response = await apiClient.get('/roles', { params });
    return response.data.result;
  },

  // Get role by ID
  getRoleById: async (id: number): Promise<Role> => {
    const response = await apiClient.get(`/roles/${id}`);
    return response.data.result;
  },

  // Create a new role
  createRole: async (roleData: RoleInput): Promise<Role> => {
    const response = await apiClient.post('/roles', roleData);
    return response.data.result;
  },

  // Update a role
  updateRole: async (id: number, roleData: Partial<RoleInput>): Promise<Role> => {
    const response = await apiClient.put(`/roles/${id}`, roleData);
    return response.data.result;
  },

  // Delete a role
  deleteRole: async (id: number): Promise<{id: number}> => {
    const response = await apiClient.delete(`/roles/${id}`);
    return response.data.result;
  }
};
