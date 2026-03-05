import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../../services/authService';
import { CustoFormHookForm } from '../../forms';

function ForgotPassword() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const forgotPasswordFields: {
    name: string;
    label: string;
    type: 'number' | 'text' | 'email' | 'password' | 'tel';
    required: boolean;
  }[] = [
    {
      name: 'email',
      label: 'Email',
      type: 'email',
      required: true,
    },
  ];

  const handleSubmit = async (formValues: Record<string, string>) => {
    setIsLoading(true);
    setMessage(null);

    try {
      await authService.forgotPassword(formValues.email);
      setMessage({
        type: 'success',
        text: '¡Email enviado! Revisa tu bandeja de entrada para restablecer tu contraseña.',
      });

      // Redirigir al login después de 3 segundos
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      setMessage({
        type: 'error',
        text:
          err.response?.data?.message ||
          'Error al enviar el email. Verifica que el correo sea válido.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="relative z-0 pb-20"
      style={{
        minHeight: '100vh',
        backgroundSize: 'cover',
        backgroundAttachment: 'fixed',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div
        className="absolute inset-0 blur-xs z-0"
        style={{
          backgroundImage: `url('/Background_LandingPage.png')`,
          backgroundSize: 'cover',
          backgroundAttachment: 'fixed',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      ></div>

      <div className="absolute inset-0 bg-black opacity-30 z-10"></div>

      {/* Contenido principal */}
      <div className="absolute inset-0 flex items-center justify-center z-20">
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
          title="Recuperar Contraseña"
          fields={forgotPasswordFields}
          buttonText="Enviar Email"
          buttonVariant="primary"
          buttonSize="lg"
          onSubmit={handleSubmit}
          initialValues={{ email: '' }}
          disabled={isLoading}
          className="flex flex-col items-center space-y-8 !w-[600px] !h-auto !p-12 !max-w-none"
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

export default ForgotPassword;
