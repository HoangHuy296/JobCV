import apiClient from './index';

export interface Login {
  email: string;
  password: string;
}

export interface Register {
  name: string;
  email: string;
  password: string;
  role?: string;
}

// Auth service using the configured axios instance
export const authService = {
  // Login function
  login: async (auth: Login) => {
    const response = await apiClient.post('/auth/login', auth);
    return response.data.result;
  },

  // Register function
  register: async (register: Register) => {
    const response = await apiClient.post('/auth/register', register);
    return response.data.result;
  },

  // Logout function
  logout: () => {
    // Remove token from localStorage
    localStorage.removeItem('token');
  },
};
