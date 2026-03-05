import { useState } from 'react';
import { CustoFormHookForm } from '../../forms';
import apiClient from '../../../services/apiClient';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { obtenerMisTorneos } from '../../../services/torneosService';

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const loginFields: {
    name: string;
    label: string;
    type: 'number' | 'text' | 'email' | 'password' | 'tel';
    required: boolean;
  }[] = [
    { name: 'email', label: 'Email', type: 'email', required: true },
    { name: 'password', label: 'Contraseña', type: 'password', required: true },
  ];

  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const handleLoginSubmit = async (formValues: Record<string, string>) => {
    setIsLoading(true);
    setMessage(null);
    const userValues = {
      email: formValues.email,
      password: formValues.password,
    };

    try {
      const response = await apiClient.post('/api/auth/login', userValues);

      // Extraer los datos del usuario de la respuesta
      const userData = response.data.data;

      // Normalizar el campo rol del backend al campo role del frontend
      const normalizedUser = {
        ...userData,
        role: userData.rol || userData.role // El backend envía "rol" en español
      };
      
      // Loguear al usuario (el token viene en la cookie automáticamente)
      login(normalizedUser);

      setMessage({ type: 'success', text: 'Login exitoso! Redirigiendo...' });

      // Redirigir según el rol del usuario
      setTimeout(async () => {
        if (normalizedUser.role === 'admin') {
          navigate('/admin');
        } else {
          // Obtener los torneos del usuario
          try {
            const torneosResponse = await obtenerMisTorneos();
            const torneos = torneosResponse.data || [];

            if (torneos.length > 0) {
              // Redirigir al LoggedMenu con el primer torneo
              const primerTorneo = torneos[0];
              navigate(`/LoggedMenu?torneoId=${primerTorneo.torneo_id}`);
            } else {
              // Si no tiene torneos, redirigir a la página de torneos
              navigate('/torneos');
            }
          } catch {
            // Si hay error al obtener torneos, redirigir a la página de torneos
            navigate('/torneos');
          }
        }
      }, 1000);
    } catch {
      setMessage({
        type: 'error',
        text: 'Error al iniciar sesión. Verifica tus credenciales.',
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
            className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-50 p-4 rounded-2xl shadow-2xl backdrop-blur-lg border-2 ${
              message.type === 'success'
                ? 'bg-green-500/90 border-green-400/50'
                : 'bg-red-500/90 border-red-400/50'
            } text-white font-bold min-w-[300px] text-center drop-shadow-xl`}
          >
            {message.text}
          </div>
        )}
        <div className="flex flex-col items-center gap-4">
          <CustoFormHookForm
            title="Iniciar Sesión"
            fields={loginFields}
            buttonText="Ingresar"
            buttonVariant="primary"
            buttonSize="lg"
            onSubmit={handleLoginSubmit}
            initialValues={{ email: '', password: '' }}
            disabled={isLoading}
            className="flex flex-col items-center space-y-8 !w-[600px] !h-auto !p-12 !max-w-none"
          />
          <button
            onClick={() => navigate('/forgot-password')}
            className="text-white/90 hover:text-white underline text-sm font-medium transition-colors duration-200"
            disabled={isLoading}
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>
        <div className="absolute bottom-4 text-center">
          <p className="text-white text-base font-semibold drop-shadow-md">
            ¿No tienes cuenta?{' '}
            <button
              onClick={() => navigate('/CreateUser')}
              className="text-yellow-300 hover:text-yellow-200 underline font-bold transition-colors duration-200"
            >
              Regístrate aquí
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
