import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { authStorage } from '@/features/auth/auth.storage';

// Base URL from environment variables (Next.js uses process.env)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
if (typeof window !== 'undefined') {
  console.log('API_BASE_URL:', API_BASE_URL);
}
// ============================================================================
// Axios Instance
// ============================================================================

const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,  // tự động fail sau 10s
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================================================
// Request Interceptor - Auto Attach JWT for all requests
// ============================================================================

axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = authStorage.getToken();  // check token từ auth-storage (LocalStorage)
    if (token) {  
      config.headers.Authorization = `Bearer ${token}`;   // có token thì attach vào header
    }
    return config;
  }, 
  (error: AxiosError) => {
    // Nếu Backend trả về 401 (Unauthorized)
    if (error.response && error.response.status === 401) {
    authStorage.removeToken(); // xoá token trong localStorage  
  }
    return Promise.reject(error);   // nếu req fail thì reject ko retry
  }
);

// ============================================================================
// Response Interceptor - Handle 401
// ============================================================================

axiosInstance.interceptors.response.use(
  (response) => {
    return response.data;   // Case success, trả về data luôn
  },
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      authStorage.removeToken(); // xoá token trong localStorage

      if (typeof window !== 'undefined') {  // check brower trc khi redirect
        window.location.href = '/login'; // redirect tới login
      }
    }
    return Promise.reject(error);
  }
);

// ============================================================================
// Error Handling
// ============================================================================

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public errors?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function transformError(error: AxiosError): ApiError {
  if (error.response) {
    const data = error.response.data as Record<string, unknown>;
    
    return new ApiError(
      error.response.status,
      (data?.message as string) || error.message,
      data?.errors as Record<string, string[]> | undefined
    );
  } else if (error.request) {
    return new ApiError(0, 'Network error. Please check your connection.');
  } else {
    return new ApiError(0, error.message);
  }
}

// ============================================================================
// Type-Safe API Methods
// ============================================================================

export const api = {
  // Get request
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      // Response interceptor đã return response.data, nên không cần .data ở đây
      return await axiosInstance.get(url, config) as T;
    } catch (error) {
      throw transformError(error as AxiosError);
    }
  },
  // Đặt <T> là type parameter  
  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    try {
      return await axiosInstance.post(url, data, config) as T;
    } catch (error) {
      throw transformError(error as AxiosError);
    }
  },

  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    try {
      return await axiosInstance.put(url, data, config) as T;
    } catch (error) {
      throw transformError(error as AxiosError);
    }
  },

  async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    try {
      return await axiosInstance.patch(url, data, config) as T;
    } catch (error) {
      throw transformError(error as AxiosError);
    }
  },

  // Delete request
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      return await axiosInstance.delete(url, config) as T;
    } catch (error) {
      throw transformError(error as AxiosError);
    }
  },
};

export { axiosInstance };
export const API_URL = API_BASE_URL;
export default api;