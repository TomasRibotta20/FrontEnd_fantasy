import { useState } from 'react';
import { CustoFormHookForm } from '../../forms';
import apiClient from '../../../services/apiClient';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { AxiosError } from 'axios';
import PasswordRequirements from '../../common/PasswordRequirements';
import type { ReactNode } from 'react';

interface ErrorResponse {
  message?: string;
  error?: string;
}

function CreateUser() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const registrationFields: {
    name: string;
    label: string;
    type: 'number' | 'text' | 'email' | 'password' | 'tel';
    required: boolean;
    hint?: ReactNode;
  }[] = [
    { name: 'name', label: 'Nombre', type: 'text', required: true },
    { name: 'email', label: 'Email', type: 'email', required: true },
    {
      name: 'password',
      label: 'Contraseña',
      type: 'password',
      required: true,
      hint: <PasswordRequirements />,
    },
  ];

  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const handleRegistrationSubmit = async (
    formValues: Record<string, string>,
  ) => {
    setIsLoading(true);
    setMessage(null);
    const userValues = {
      username: formValues.name,
      email: formValues.email,
      password: formValues.password,
    };

    try {
      // Primero registrar el usuario
      await apiClient.post('/api/auth/register', userValues);

      // Después hacer login automático con las mismas credenciales
      const loginValues = {
        email: formValues.email,
        password: formValues.password,
      };

      const loginResponse = await apiClient.post(
        '/api/auth/login',
        loginValues,
      );

      // Extraer los datos del usuario de la respuesta del login
      const userData = loginResponse.data.data;

      // Loguear al usuario (el token viene en la cookie del login)
      login(userData);

      setMessage({
        type: 'success',
        text: 'Usuario registrado e iniciado sesión exitosamente! Redirigiendo...',
      });

      // Redirigir al usuario logueado
      setTimeout(() => {
        navigate('/torneos');
      }, 1000);
    } catch (error: unknown) {
      const axiosError = error as AxiosError;

      let errorMessage = 'Error al registrar el Usuario. Inténtalo de nuevo.';

      // Determinar si el error fue en registro o login
      if (axiosError.config?.url?.includes('/auth/login')) {
        errorMessage =
          'Usuario registrado, pero error al iniciar sesión automáticamente. Por favor, inicia sesión manualmente.';
      }

      // Mostrar mensaje específico del backend si está disponible
      if (
        axiosError.response?.data &&
        typeof axiosError.response.data === 'object'
      ) {
        const responseData = axiosError.response.data as ErrorResponse;
        if (responseData.message) {
          errorMessage = responseData.message;
        } else if (responseData.error) {
          errorMessage = responseData.error;
        }
      }

      setMessage({
        type: 'error',
        text: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundSize: 'cover',
        backgroundAttachment: 'fixed',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
      className="relative z-0 pb-20"
    >
      <div
        style={{
          backgroundImage: `url('/Background_LandingPage.png')`,
          backgroundSize: 'cover',
          backgroundAttachment: 'fixed',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
        className="absolute inset-0 blur-xs z-0"
      ></div>

      <div className="absolute inset-0 bg-black opacity-30 z-10"></div>

      {/* Contenido principal */}
      <div className="absolute inset-0 flex items-center justify-center z-20 px-4">
        {message && (
          <div
            className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-50 p-4 rounded-2xl shadow-2xl backdrop-blur-lg border-2 ${
              message.type === 'success'
                ? 'bg-green-500/90 border-green-400/50'
                : 'bg-red-500/90 border-red-400/50'
            } text-white font-bold min-w-[300px] text-center drop-shadow-xl`}
          >
            {message.text}
          </div>
        )}
        <CustoFormHookForm
          title="Registro de Usuario"
          fields={registrationFields}
          buttonText="Registrate!"
          buttonVariant="primary"
          buttonSize="lg"
          onSubmit={handleRegistrationSubmit}
          initialValues={{ name: '' }}
          disabled={isLoading}
          className="flex flex-col items-center space-y-8 w-full max-w-md !h-auto !p-6 sm:!p-12 "
        />
        <div className="absolute bottom-4 text-center">
          <p className="text-white text-base font-semibold drop-shadow-md">
            ¿Ya tienes cuenta?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-yellow-300 hover:text-yellow-200 underline font-bold transition-colors duration-200"
            >
              Inicia sesión aquí
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default CreateUser;
