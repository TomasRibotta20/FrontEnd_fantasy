import axios from 'axios';

// Crear una instancia de axios con configuración base
const apiClient = axios.create({
  baseURL: 'http://localhost:3000/api',
  timeout: 10000,
  withCredentials: true, // Importante para incluir cookies en las requests
});

// Interceptor para respuestas de error (ej: token expirado)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token/cookie expirado o inválido, limpiar sesión
      localStorage.removeItem('authUser');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
