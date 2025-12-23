import axios from 'axios';
import type {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from 'axios';
import { toast } from 'react-toastify';

// Define the structure of API responses
interface ApiResponse {
  message: string;
  result: any;
}

interface AxiosErrorResponse<T = any> extends AxiosError<T> {
  response?: AxiosResponse<T>;
}

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  timeout: 30000, // Increased to 30 seconds for CV creation with sections
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
type CustomRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

apiClient.interceptors.request.use(
  (config: CustomRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    if (response?.data?.message) {
      toast.error(response.data.message);
    }
    return response;
  },
  (error: AxiosErrorResponse<ApiResponse>) => {
    const { response } = error;
    if (response?.data?.message) {
      toast.error(response.data.message);
    }

    if (response) {
      switch (response.status) {
        case 401:
          // Handle unauthorized access
          console.error('Unauthorized access - redirecting to login');
          localStorage.removeItem('token');
          // You can add navigation to login page here if using react-router
          // window.location.href = '/login';
          break;
        case 403:
          // Handle forbidden access
          console.error('Access forbidden');
          break;
        case 500:
          // Handle server error
          console.error('Internal server error');
          break;
        default:
          console.error(`Error ${response.status}: ${response.statusText}`);
      }
    } else if (error.request) {
      // Network error
      console.error('Network error - please check your connection');
    } else {
      // Other errors
      console.error('An error occurred:', error.message);
    }

    return Promise.reject(error);
  }
);

export * as industryService from './industryService';
export * as locationService from './locationService';
export * as mediaService from './mediaService';
export * as jobReviewService from './jobReviewService';

export default apiClient;
