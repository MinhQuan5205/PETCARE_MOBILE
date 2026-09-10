import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { env } from '../../core/config/env';
import { ApiError } from '../../core/errors/ApiError';

const BASE_URL = env.API_URL;

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  withCredentials: true, // Needed for HttpOnly refresh token cookie
});

// Storage keys
export const TOKEN_KEY = 'petcare_access_token';

// In-memory token to avoid reading from secure store on every request
let accessToken: string | null = null;

// Helpers
export const setAccessToken = async (token: string) => {
  accessToken = token;
  await SecureStore.setItemAsync(TOKEN_KEY, token);
};

export const getAccessToken = async () => {
  if (accessToken) return accessToken;
  accessToken = await SecureStore.getItemAsync(TOKEN_KEY);
  return accessToken;
};

export const clearAuth = async () => {
  accessToken = null;
  await SecureStore.deleteItemAsync(TOKEN_KEY);
};

// Request Interceptor: Attach Token
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Refresh Token Concurrency Lock
let isRefreshing = false;
let failedQueue: { resolve: (value?: unknown) => void; reject: (reason?: unknown) => void }[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response Interceptor: Global Error Handling & Refresh Logic
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle Network Errors
    if (!error.response) {
      return Promise.reject(
        new ApiError(
          'Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng.',
          0,
          error.message,
          originalRequest?.url
        )
      );
    }

    const { status, data } = error.response;

    // Handle 401 Unauthorized with Refresh Token Concurrency
    if (status === 401 && originalRequest && !originalRequest._retry && originalRequest.url !== '/auth/refresh' && originalRequest.url !== '/auth/login') {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Attempt to refresh the token via cookie
        const refreshResponse = await axios.post(`${BASE_URL}/auth/refresh`, {}, {
          withCredentials: true,
        });

        const refreshData = refreshResponse.data as { data?: { accessToken?: string } };
        const newAccessToken = refreshData.data?.accessToken;
        
        if (!newAccessToken) {
          throw new Error('Refresh token response missing access token');
        }
        await setAccessToken(newAccessToken);

        processQueue(null, newAccessToken);
        
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        await clearAuth();
        // Here we could dispatch an event to force logout in the UI, or simply let the rejected promise hit the hook which logs out.
        return Promise.reject(
          new ApiError(
            'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
            401,
            refreshError instanceof Error ? refreshError.message : 'Unknown error',
            '/auth/refresh'
          )
        );
      } finally {
        isRefreshing = false;
      }
    }

    // Normalize error format based on PetCare Contract
    let errorMessage = error.message;
    let errorDetail = null;
    let timestamp = new Date().toISOString();
    let path = originalRequest?.url || '';

    if (typeof data === 'object' && data !== null) {
      const record = data as Record<string, unknown>;
      if (typeof record.message === 'string') errorMessage = record.message;
      if (typeof record.error === 'string') errorDetail = record.error;
      if (typeof record.timestamp === 'string') timestamp = record.timestamp;
      if (typeof record.path === 'string') path = record.path;
    }

    const normalizedError = new ApiError(
      errorMessage,
      status,
      errorDetail,
      path,
      timestamp
    );

    return Promise.reject(normalizedError);
  }
);
