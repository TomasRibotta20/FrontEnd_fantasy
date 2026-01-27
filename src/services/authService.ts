import apiClient from './apiClient';

/**
 * Servicio para gestionar la recuperación de contraseña
 */

interface ForgotPasswordRequest {
  email: string;
}

interface ForgotPasswordResponse {
  message: string;
  data?: {
    message: string;
  };
}

interface NewPasswordResponse {
  message: string;
  data?: {
    message: string;
  };
}

export const authService = {
  /**
   * Envía un email para recuperar la contraseña (POST)
   * @param email - Email del usuario
   */
  async forgotPassword(email: string): Promise<ForgotPasswordResponse> {
    const response = await apiClient.post<ForgotPasswordResponse>(
      '/api/auth/forgot-password',
      { email } as ForgotPasswordRequest
    );
    return response.data;
  },

  /**
   * Establece una nueva contraseña (POST)
   * @param resetToken - Token de recuperación recibido por email
   * @param newPassword - Nueva contraseña
   */
  async newPassword(resetToken: string, newPassword: string): Promise<NewPasswordResponse> {
    const response = await apiClient.post<NewPasswordResponse>(
      `/api/auth/new-password/${resetToken}`,
      { newPassword }
    );
    return response.data;
  },
};

export default authService;
