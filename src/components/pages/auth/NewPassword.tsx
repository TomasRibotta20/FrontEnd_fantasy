import { useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import authService from '../../../services/authService';
import { CustoFormHookForm } from '../../forms';
import PasswordRequirements from '../../common/PasswordRequirements';

/** Pagina para restablecer la contrasena usando el token del email. */
function NewPassword() {
  const navigate = useNavigate();
  const { resetToken: token } = useParams<{ resetToken: string }>();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const newPasswordFields: {
    name: string;
    label: string;
    type: 'number' | 'text' | 'email' | 'password' | 'tel';
    required: boolean;
    hint?: ReactNode;
  }[] = [
    {
      name: 'newPassword',
      label: 'Nueva Contraseña',
      type: 'password',
      required: true,
      hint: <PasswordRequirements />,
    },
    {
      name: 'confirmPassword',
      label: 'Confirmar Contraseña',
      type: 'password',
      required: true,
    },
  ];

  const handleSubmit = async (formValues: Record<string, string>) => {
    setIsLoading(true);
    setMessage(null);

    // Validar que las contraseñas coincidan
    if (formValues.newPassword !== formValues.confirmPassword) {
      setMessage({
        type: 'error',
        text: 'Las contraseñas no coinciden',
      });
      setIsLoading(false);
      return;
    }

    // Validar que haya un token
    if (!token) {
      setMessage({
        type: 'error',
        text: 'Token inválido o expirado. Solicita un nuevo enlace.',
      });
      setIsLoading(false);
      return;
    }

    try {
      await authService.newPassword(token, formValues.newPassword);
      setMessage({
        type: 'success',
        text: '¡Contraseña actualizada exitosamente! Redirigiendo al login...',
      });

      // Redirigir al login después de 2 segundos
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error: unknown) {
      const err = error as {
        response?: {
          data?: {
            message?: string;
            errors?: { field: string; message: string }[];
          };
        };
      };
      const detalles = err.response?.data?.errors
        ?.map((e) => e.message)
        .join('. ');
      setMessage({
        type: 'error',
        text:
          detalles ||
          err.response?.data?.message ||
          'Error al actualizar la contraseña. El token puede haber expirado.',
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
          title="Nueva Contraseña"
          fields={newPasswordFields}
          buttonText="Cambiar Contraseña"
          buttonVariant="primary"
          buttonSize="lg"
          onSubmit={handleSubmit}
          initialValues={{ newPassword: '', confirmPassword: '' }}
          disabled={isLoading}
          className="flex flex-col items-center space-y-8 w-full max-w-[600px] !h-auto !p-6 sm:!p-12 !max-w-none sm:!max-w-none"
        />

        <div className="absolute bottom-4 text-center">
          <p className="text-white text-base font-semibold drop-shadow-md">
            <button
              onClick={() => navigate('/login')}
              className="text-yellow-300 hover:text-yellow-200 underline font-bold transition-colors duration-200"
            >
              Volver al Login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default NewPassword;
