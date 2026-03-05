import axios from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';

/** Cliente HTTP configurado con interceptores de autenticación. */
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  timeout: 10000,
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

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

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
      _skipAuthRefresh?: boolean;
    };

    // Si es 401 y no hemos intentado refrescar aún
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Si el request marcó que no debe intentar refresh, rechazar silenciosamente
      if (originalRequest._skipAuthRefresh) {
        return Promise.reject(error);
      }

      // No intentar refresh en endpoints de auth
      if (
        originalRequest.url?.includes('/api/auth/login') ||
        originalRequest.url?.includes('/api/auth/refreshToken') ||
        originalRequest.url?.includes('/api/auth/me')
      ) {
        // Disparar evento personalizado para que el AuthContext maneje el logout
        window.dispatchEvent(new CustomEvent('auth:sessionExpired'));
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => apiClient(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await apiClient.post('/api/auth/refreshToken');
        processQueue(null, 'success');
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Disparar evento para manejar sesión expirada
        window.dispatchEvent(new CustomEvent('auth:sessionExpired'));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
