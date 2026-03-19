import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/hooks/use-toast';

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || ' https://kalel-unenquiring-jaimie.ngrok-free.dev',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor - Add JWT token to all requests
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ detail?: string; message?: string }>) => {
    const status = error.response?.status;
    const message = error.response?.data?.detail || error.response?.data?.message || 'An error occurred';

    // Handle 401 Unauthorized - Logout user
    if (status === 401) {
      useAuthStore.getState().logout();
      toast({
        title: 'Session Expired',
        description: 'Please log in again to continue.',
        variant: 'destructive',
      });
      window.location.href = '/login';
    }

    // Handle 403 Forbidden
    if (status === 403) {
      toast({
        title: 'Access Denied',
        description: 'You do not have permission to perform this action.',
        variant: 'destructive',
      });
    }

    // Handle 404 Not Found
    if (status === 404) {
      toast({
        title: 'Not Found',
        description: message,
        variant: 'destructive',
      });
    }

    // Handle 500 Server Error
    if (status && status >= 500) {
      toast({
        title: 'Server Error',
        description: 'Something went wrong. Please try again later.',
        variant: 'destructive',
      });
    }

    return Promise.reject(error);
  }
);

export default apiClient;
