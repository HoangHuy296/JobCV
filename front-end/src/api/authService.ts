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

  // Verify email function
  verifyEmail: async (token: string) => {
    const response = await apiClient.post('/auth/verify-email', { token });
    return response.data;
  },

  // Resend verification email function
  resendVerification: async (email: string) => {
    const response = await apiClient.post('/auth/resend-verification', { email });
    return response.data;
  },

  // Get current user info with latest data from database
  getMe: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data.result;
  },
};
