import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import apiClient from '../../../services/apiClient';

// Interfaz para el formato que viene del backend
interface BackendPlayerResponse {
  id: number;
  equipo: {
    id: number;
    nombre: string;
    usuario: unknown;
  };
  jugador: {
    id: number;
    apiId: number;
    name: string;
    firstname?: string;
    lastname?: string;
    age: number;
    nationality: string;
    height?: string;
    weight?: string;
    photo: string;
    jerseyNumber: number | null;
    position: number | string;
    club: number;
  };
  es_titular: boolean;
}

export const CreateTeam = () => {
  const navigate = useNavigate();
  const [teamName, setTeamName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  useEffect(() => {
    async function checkUserTeam() {
      try {
        const response = await apiClient.get('equipos/mi-equipo');
        console.log('Respuesta al verificar equipo:', response);
        if (response.data !== null) {
          showNotification(
            'Ya tienes un equipo creado. Redirigiendo...',
            'error'
          );
          setTimeout(() => {
            navigate('/LoggedMenu');
          }, 50);
        }
      } catch (error) {
        // Si hay un error, asumimos que el usuario no tiene equipo y puede crear uno
        console.log('El usuario no tiene equipo, puede crear uno nuevo');

        // Solo mostramos error si es un problema de autenticación (401)
        if (axios.isAxiosError(error) && error.response) {
          if (error.response.status === 401) {
            showNotification(
              'No estás autenticado. Por favor inicia sesión.',
              'error'
            );
            setTimeout(() => {
              navigate('/login');
            }, 2000);
          }
          // Para cualquier otro error (404, 500, etc.) no mostramos nada
          // ya que es normal que un usuario nuevo no tenga equipo
        }
      }
    }

    checkUserTeam();
  }, [navigate]);

  // Función para mostrar notificaciones
  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  async function handleButtonClick(): Promise<void> {
    if (teamName.trim()) {
      setIsLoading(true);

      try {
        console.log('Creando equipo:', teamName);

        // POST al endpoint para crear el equipo usando apiClient (con autenticación)
        const response = await apiClient.post('/equipos', {
          nombre: teamName.trim(),
        });

        console.log('Equipo creado exitosamente:', response.data);

        // Guardar los jugadores generados
        if (response.data.jugadores || response.data.data?.jugadores) {
          const playersData =
            response.data.jugadores || response.data.data.jugadores;

          // Logging detallado para debugging
          console.log('Datos completos de la respuesta:', response.data);
          console.log('Jugadores generados:', playersData);
          console.log('Cantidad de jugadores:', playersData.length);

          // Examinar estructura del primer jugador
          if (playersData.length > 0) {
            console.log('Estructura del primer jugador:', playersData[0]);
            console.log(
              'Tipo de position del primer jugador:',
              typeof playersData[0].position
            );
            console.log(
              'Valor de position del primer jugador:',
              playersData[0].position
            );
          }

          // Extraer los datos de jugador desde la estructura anidada
          const extractedPlayers = playersData.map(
            (item: BackendPlayerResponse) => {
              // Los datos del jugador están en item.jugador
              const jugador = item.jugador;
              return {
                apiId: jugador.apiId,
                name: jugador.name,
                firstName: jugador.firstname,
                lastName: jugador.lastname,
                age: jugador.age,
                nationality: jugador.nationality,
                height: jugador.height ? parseInt(jugador.height) : undefined,
                weight: jugador.weight ? parseInt(jugador.weight) : undefined,
                photo: jugador.photo,
                jerseyNumber: jugador.jerseyNumber || 0,
                position: jugador.position,
              };
            }
          );

          console.log('Jugadores extraídos:', extractedPlayers);

          // Mostrar notificación de éxito
          showNotification(
            `Equipo "${teamName}" creado! ${playersData.length} jugadores generados`,
            'success'
          );

          // Redirigir directamente al LoggedMenu
          setTimeout(() => {
            navigate('/LoggedMenu');
          }, 1000);
        }

        // Limpiar el campo de entrada
        setTeamName('');
      } catch (error: unknown) {
        console.error('Error al crear el equipo:', error);

        // Manejo detallado de errores
        if (axios.isAxiosError(error)) {
          if (error.response) {
            // El servidor respondió con un código de error
            if (error.response.status === 401) {
              showNotification(
                'No estás autenticado. Por favor inicia sesión.',
                'error'
              );
            } else {
              const errorMessage =
                error.response.data?.message ||
                error.response.data?.error ||
                'Error del servidor';
              showNotification(`Error: ${errorMessage}`, 'error');
            }
          } else if (error.request) {
            // La petición fue hecha pero no se recibió respuesta
            showNotification(
              'Error de conexión. Verifica que el servidor esté activo.',
              'error'
            );
          } else {
            // Algo más salió mal
            showNotification('Error inesperado. Inténtalo de nuevo.', 'error');
          }
        } else {
          showNotification('Error inesperado. Inténtalo de nuevo.', 'error');
        }
      } finally {
        setIsLoading(false);
      }
    } else {
      showNotification('Por favor ingresa un nombre para el equipo', 'error');
    }
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center gap-8 py-8">
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

      {/* Notificación elegante */}
      {notification && (
        <div className="fixed top-4 right-4 z-[100]">
          <div
            className={`px-6 py-4 rounded-lg shadow-2xl transform transition-all duration-300 ${
              notification.type === 'success'
                ? 'bg-green-500 text-white'
                : 'bg-red-500 text-white'
            }`}
            style={{
              animation: 'slideInRight 0.5s ease-out',
            }}
          >
            <div className="flex items-center space-x-2">
              <span className="text-2xl">
                {notification.type === 'success' ? '✓' : '✗'}
              </span>
              <p className="font-semibold">{notification.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Título simplificado y elegante */}
      <div className="relative z-50 mb-6">
        <h1
          className="text-5xl md:text-6xl font-bold text-white text-center"
          style={{
            fontFamily: 'system-ui, -apple-system, sans-serif',
            textShadow:
              '2px 2px 8px rgba(0, 0, 0, 0.8), 0 0 20px rgba(255, 255, 255, 0.3)',
            letterSpacing: '0.02em',
          }}
        >
          Crea tu Equipo
        </h1>
      </div>

      {/* Campo de entrada atractivo - MÁS GRANDE */}
      <div className="relative z-50 w-full max-w-2xl px-4">
        <div className="relative">
          {/* Efectos decorativos del input - DETRÁS del input */}
          <div className="absolute -inset-2 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 rounded-3xl opacity-30 animate-ping pointer-events-none"></div>
          <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 via-green-500 to-cyan-500 rounded-3xl opacity-20 blur-xl pointer-events-none"></div>

          <input
            type="text"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="Ingresa el nombre de tu equipo..."
            className="relative z-10 w-full px-12 py-5 text-2xl font-bold text-center bg-gradient-to-r from-blue-50 to-green-50 border-4 border-transparent bg-clip-padding rounded-3xl shadow-2xl focus:outline-none focus:ring-4 focus:ring-cyan-400 focus:border-cyan-400 transition-all duration-300 transform hover:scale-105 focus:scale-105 attractive-input"
            style={{
              fontFamily: 'system-ui, -apple-system, sans-serif',
              background:
                'linear-gradient(white, white) padding-box, linear-gradient(45deg, #06b6d4, #10b981, #3b82f6, #8b5cf6) border-box',
              animation: 'inputGlow 3s infinite alternate ease-in-out',
            }}
            maxLength={50}
          />
        </div>

        {/* Contador de caracteres - MÁS VISIBLE */}
        <div className="text-center mt-3 text-white text-sm font-semibold drop-shadow-lg">
          <span className="bg-black/40 px-4 py-2 rounded-full backdrop-blur-sm">
            {teamName.length}/50 caracteres
          </span>
        </div>
      </div>

      {/* Botón crear equipo con animaciones completas */}
      <button
        onClick={handleButtonClick}
        disabled={!teamName.trim() || isLoading}
        className="relative px-10 py-5 bg-gradient-to-r from-green-400 via-emerald-500 to-blue-500 text-white text-2xl font-extrabold rounded-full shadow-2xl transform hover:scale-110 hover:shadow-3xl active:scale-95 z-50 animate-pulse hover:animate-bounce vibrating-button color-shifting-button disabled:opacity-50 disabled:cursor-not-allowed mt-4"
        style={{
          fontFamily: 'system-ui, -apple-system, sans-serif',
          filter: 'brightness(1.1) saturate(1.2)',
        }}
      >
        <span className="relative z-10">
          {isLoading
            ? 'Creando...'
            : teamName.trim()
            ? `Crear "${teamName}"`
            : 'Crear Equipo'}
        </span>

        {/* Efecto de brillo */}
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 rounded-full opacity-0 hover:opacity-20 transition-opacity duration-300"></div>

        {/* Anillo exterior animado */}
        <div className="absolute -inset-2 bg-gradient-to-r from-green-400 to-blue-500 rounded-full opacity-30 animate-ping"></div>
      </button>

      <style
        dangerouslySetInnerHTML={{
          __html: `
          @keyframes inputGlow {
            0% { 
              box-shadow: 0 0 20px rgba(6, 182, 212, 0.4), 0 0 40px rgba(16, 185, 129, 0.2);
              filter: brightness(1.0) saturate(1.0);
            }
            50% { 
              box-shadow: 0 0 30px rgba(139, 92, 246, 0.6), 0 0 60px rgba(236, 72, 153, 0.3);
              filter: brightness(1.1) saturate(1.2);
            }
            100% { 
              box-shadow: 0 0 20px rgba(6, 182, 212, 0.4), 0 0 40px rgba(16, 185, 129, 0.2);
              filter: brightness(1.0) saturate(1.0);
            }
          }
          
          .attractive-input {
            animation: inputGlow 3s infinite alternate ease-in-out;
          }
          
          .attractive-input:focus {
            animation: inputGlow 1s infinite alternate ease-in-out;
            box-shadow: 0 0 40px rgba(6, 182, 212, 0.8), 0 0 80px rgba(16, 185, 129, 0.5) !important;
          }

          @keyframes vibrate {
            0%, 100% { transform: translateX(0) translateY(0) rotate(0deg); }
            10% { transform: translateX(-2px) translateY(-1px) rotate(-0.5deg); }
            20% { transform: translateX(2px) translateY(1px) rotate(0.5deg); }
            30% { transform: translateX(-1px) translateY(-0.5px) rotate(-0.3deg); }
            40% { transform: translateX(1px) translateY(0.5px) rotate(0.3deg); }
            50% { transform: translateX(-0.5px) translateY(-0.3px) rotate(-0.1deg); }
            60% { transform: translateX(0.5px) translateY(0.3px) rotate(0.1deg); }
            70% { transform: translateX(-0.3px) translateY(-0.1px) rotate(-0.05deg); }
            80% { transform: translateX(0.3px) translateY(0.1px) rotate(0.05deg); }
            90% { transform: translateX(-0.1px) translateY(-0.05px) rotate(-0.02deg); }
          }
          
          .vibrating-button {
            animation: vibrate 2s infinite ease-in-out;
          }
          
          .color-shifting-button {
            background: linear-gradient(45deg, #10b981, #06b6d4, #3b82f6) !important;
            animation: colorShift 3s infinite alternate ease-in-out, vibrate 2s infinite ease-in-out;
          }
          
          @keyframes colorShift {
            0% { 
              background: linear-gradient(45deg, #10b981, #06b6d4, #3b82f6) !important;
              filter: brightness(1.1) saturate(1.2) hue-rotate(0deg) drop-shadow(0 0 20px rgba(16, 185, 129, 0.5));
            }
            25% { 
              background: linear-gradient(45deg, #f59e0b, #ef4444, #8b5cf6) !important;
              filter: brightness(1.3) saturate(1.5) hue-rotate(90deg) drop-shadow(0 0 25px rgba(245, 158, 11, 0.6));
            }
            50% { 
              background: linear-gradient(45deg, #ec4899, #f97316, #06b6d4) !important;
              filter: brightness(1.4) saturate(1.6) hue-rotate(180deg) drop-shadow(0 0 30px rgba(236, 72, 153, 0.7));
            }
            75% { 
              background: linear-gradient(45deg, #8b5cf6, #10b981, #f59e0b) !important;
              filter: brightness(1.2) saturate(1.4) hue-rotate(270deg) drop-shadow(0 0 25px rgba(139, 92, 246, 0.6));
            }
            100% { 
              background: linear-gradient(45deg, #10b981, #06b6d4, #3b82f6) !important;
              filter: brightness(1.1) saturate(1.2) hue-rotate(360deg) drop-shadow(0 0 20px rgba(16, 185, 129, 0.5));
            }
          }
          
          .color-shifting-button:hover {
            animation: colorShift 1s infinite alternate ease-in-out, vibrate 0.5s infinite ease-in-out;
          }
          
          .color-shifting-button:disabled {
            opacity: 0.6;
            animation: none;
            filter: grayscale(0.5);
            cursor: not-allowed;
          }

          /* Animaciones para confeti */
          @keyframes confettiFall {
            0% { 
              transform: translateY(-10vh) rotateZ(0deg) scale(0);
              opacity: 0;
            }
            10% {
              opacity: 1;
              transform: translateY(0) rotateZ(72deg) scale(1);
            }
            100% { 
              transform: translateY(110vh) rotateZ(720deg) scale(0.5);
              opacity: 0;
            }
          }

          /* Animación de brillo suave */
          @keyframes gentleGlow {
            0%, 100% { 
              opacity: 0.3;
              transform: scale(1);
            }
            50% { 
              opacity: 0.6;
              transform: scale(1.05);
            }
          }

          /* Animación de confeti personalizada */
          .confetti-piece {
            animation: confettiFall 4.5s ease-out forwards;
          }

          /* Animación para notificaciones */
          @keyframes slideInRight {
            0% {
              transform: translateX(100%);
              opacity: 0;
            }
            100% {
              transform: translateX(0);
              opacity: 1;
            }
          }

          @keyframes slideOutRight {
            0% {
              transform: translateX(0);
              opacity: 1;
            }
            100% {
              transform: translateX(100%);
              opacity: 0;
            }
          }

          @keyframes fadeInUp {
            0% {
              opacity: 0;
              transform: translateY(40px) scale(0.95);
            }
            100% {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          .animate-fade-in {
            animation: fadeInUp 0.6s ease-out forwards;
          }

          @keyframes vibrate {
            0%, 100% { transform: translateX(0) translateY(0) rotate(0deg); }
            10% { transform: translateX(-2px) translateY(-1px) rotate(-0.5deg); }
            20% { transform: translateX(2px) translateY(1px) rotate(0.5deg); }
            30% { transform: translateX(-1px) translateY(-0.5px) rotate(-0.3deg); }
            40% { transform: translateX(1px) translateY(0.5px) rotate(0.3deg); }
            50% { transform: translateX(-0.5px) translateY(-0.3px) rotate(-0.1deg); }
            60% { transform: translateX(0.5px) translateY(0.3px) rotate(0.1deg); }
            70% { transform: translateX(-0.3px) translateY(-0.1px) rotate(-0.05deg); }
            80% { transform: translateX(0.3px) translateY(0.1px) rotate(0.05deg); }
            90% { transform: translateX(-0.1px) translateY(-0.05px) rotate(-0.02deg); }
          }
          
          .vibrating-button {
            animation: vibrate 2s infinite ease-in-out;
          }
          
          .color-shifting-button {
            background: linear-gradient(45deg, #10b981, #06b6d4, #3b82f6) !important;
            animation: colorShift 3s infinite alternate ease-in-out, vibrate 2s infinite ease-in-out;
          }
          
          @keyframes colorShift {
            0% { 
              background: linear-gradient(45deg, #10b981, #06b6d4, #3b82f6) !important;
              filter: brightness(1.1) saturate(1.2) hue-rotate(0deg) drop-shadow(0 0 20px rgba(16, 185, 129, 0.5));
            }
            25% { 
              background: linear-gradient(45deg, #f59e0b, #ef4444, #8b5cf6) !important;
              filter: brightness(1.3) saturate(1.5) hue-rotate(90deg) drop-shadow(0 0 25px rgba(245, 158, 11, 0.6));
            }
            50% { 
              background: linear-gradient(45deg, #ec4899, #f97316, #06b6d4) !important;
              filter: brightness(1.4) saturate(1.6) hue-rotate(180deg) drop-shadow(0 0 30px rgba(236, 72, 153, 0.7));
            }
            75% { 
              background: linear-gradient(45deg, #8b5cf6, #10b981, #f59e0b) !important;
              filter: brightness(1.2) saturate(1.4) hue-rotate(270deg) drop-shadow(0 0 25px rgba(139, 92, 246, 0.6));
            }
            100% { 
              background: linear-gradient(45deg, #10b981, #06b6d4, #3b82f6) !important;
              filter: brightness(1.1) saturate(1.2) hue-rotate(360deg) drop-shadow(0 0 20px rgba(16, 185, 129, 0.5));
            }
          }
          
          .color-shifting-button:hover {
            animation: colorShift 1s infinite alternate ease-in-out, vibrate 0.5s infinite ease-in-out;
          }
          
          .color-shifting-button:disabled {
            opacity: 0.6;
            animation: none;
            filter: grayscale(0.5);
            cursor: not-allowed;
          }
        `,
        }}
      />
    </div>
  );
};

export default CreateTeam;
