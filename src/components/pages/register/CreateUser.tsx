import { useState } from 'react';
import { CustoFormHookForm } from '../../forms';
import apiClient from '../../../services/apiClient';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { AxiosError } from 'axios';

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
  }[] = [
    { name: 'name', label: 'Nombre', type: 'text', required: true },
    { name: 'email', label: 'Email', type: 'email', required: true },
    { name: 'password', label: 'Contraseña', type: 'password', required: true },
  ];

  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const handleRegistrationSubmit = async (
    formValues: Record<string, string>
  ) => {
    setIsLoading(true);
    setMessage(null);
    console.log('Datos de registro:', formValues);
    const userValues = {
      username: formValues.name,
      email: formValues.email,
      password: formValues.password,
    };

    console.log('Datos que se envían al backend:', userValues);

    try {
      const response = await apiClient.post('/auth/register', userValues);
      console.log('Registro exitoso:', response.data);

      // Extraer los datos del usuario de la respuesta
      const userData = response.data.data || response.data;

      console.log('Usuario registrado:', userData);

      // Loguear automáticamente al usuario (el token viene en la cookie)
      login(userData);

      setMessage({
        type: 'success',
        text: 'Usuario registrado exitosamente! Redirigiendo...',
      });

      // Redirigir al usuario logueado
      setTimeout(() => {
        navigate('/ClubName');
      }, 1000);
    } catch (error: unknown) {
      const axiosError = error as AxiosError;
      console.error('Error completo:', axiosError);
      console.error('Response data:', axiosError.response?.data);
      console.error('Response status:', axiosError.response?.status);
      console.error('Response headers:', axiosError.response?.headers);

      let errorMessage = 'Error al registrar el Usuario. Inténtalo de nuevo.';

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
      <div className="absolute inset-0 flex items-center justify-center z-20">
        {message && (
          <div
            className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-50 p-4 rounded-lg shadow-lg ${
              message.type === 'success' ? 'bg-green-500' : 'bg-red-500'
            } text-white font-medium min-w-[300px] text-center`}
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
          className="flex flex-col items-center space-y-8 !w-[600px] !h-auto !p-12 !max-w-none"
        />
      </div>
    </div>
  );
}

export default CreateUser;
