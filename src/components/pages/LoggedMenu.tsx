import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import FormacionEquipoCompacta from '../common/FormacionEquipoCompacta';
import WidgetPuntos from '../common/WidgetPuntos';
import apiClient from '../../services/apiClient';

interface MenuCard {
  title: string;
  description: string;
  icon: string;
  route: string;
  color: string;
  enabled: boolean;
}

interface Player {
  apiId: number;
  name: string;
  firstName?: string;
  lastName?: string;
  age: number;
  nationality: string;
  height?: number;
  weight?: number;
  photo: string;
  jerseyNumber: number;
  position: unknown;
  esTitular?: boolean;
}

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

const LoggedMenu = () => {
  const navigate = useNavigate();
  const [teamPlayers, setTeamPlayers] = useState<Player[]>([]);

  useEffect(() => {
    const fetchTeamPlayers = async () => {
      try {
        const response = await apiClient.get('/equipos/mi-equipo');
        console.log('Respuesta completa del equipo:', response.data);

        if (response.data && response.data.jugadores) {
          console.log('Jugadores recibidos:', response.data.jugadores);

          // Mapear los jugadores desde la estructura del backend
          const mappedPlayers = response.data.jugadores.map(
            (item: BackendPlayerResponse, index: number) => {
              console.log(`Jugador ${index}:`, item);

              // Los datos del jugador están en item.jugador
              const jugador = item.jugador;

              return {
                apiId: jugador.apiId || index,
                name: jugador.name || '',
                firstName: jugador.firstname || '',
                lastName: jugador.lastname || '',
                age: jugador.age || 0,
                nationality: jugador.nationality || '',
                height: jugador.height ? parseInt(jugador.height) : undefined,
                weight: jugador.weight ? parseInt(jugador.weight) : undefined,
                photo:
                  jugador.photo ||
                  'https://via.placeholder.com/64x64/4F46E5/FFFFFF?text=⚽',
                jerseyNumber: jugador.jerseyNumber || 0,
                position: jugador.position || '',
                esTitular: item.es_titular, // ✅ Agregar el flag de titular
              };
            }
          );

          console.log('Jugadores mapeados:', mappedPlayers);

          // ✅ Filtrar solo los titulares para mostrar en la formación
          const titulares = mappedPlayers.filter(
            (p: Player) => p.esTitular === true
          );
          console.log('Titulares:', titulares);
          setTeamPlayers(titulares);
        }
      } catch (error) {
        console.error('Error al obtener jugadores:', error);
      }
    };
    fetchTeamPlayers();
  }, []);

  const menuCards: MenuCard[] = [
    {
      title: 'Mi Equipo',
      description: 'Gestiona tu equipo y alineación',
      icon: '⚽',
      route: '/UpdateTeam',
      color: 'from-blue-500 to-cyan-500',
      enabled: true,
    },
    {
      title: 'Jornadas y Puntos',
      description: 'Ver tus puntos y estadísticas',
      icon: '🏆',
      route: '/jornadas',
      color: 'from-green-500 to-emerald-500',
      enabled: true,
    },
    {
      title: 'Mercado',
      description: 'Explorar jugadores disponibles',
      icon: '🛒',
      route: '/mercado',
      color: 'from-purple-500 to-pink-500',
      enabled: false,
    },
    {
      title: 'Mi Perfil',
      description: 'Configuración de usuario',
      icon: '👤',
      route: '/perfil',
      color: 'from-orange-500 to-red-500',
      enabled: true,
    },
  ];

  return (
    <div className="h-screen overflow-hidden pt-16">
      {/* Background */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat -z-10"
        style={{
          backgroundImage: `url('/Background_LandingPage.png')`,
          filter: 'blur(2px)',
        }}
      >
        <div className="absolute inset-0 bg-black opacity-30"></div>
      </div>

      <div className="container mx-auto px-4 h-full flex flex-col relative z-10 py-4">
        {/* Header compacto */}
        <div className="text-center mb-4">
          <h1 className="text-3xl font-bold text-white mb-1">
            Bienvenido a TurboFantasy
          </h1>
          <p className="text-white/80 text-sm">
            Gestiona tu equipo y compite con otros usuarios
          </p>
        </div>

        {/* Contenido principal en dos columnas */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
          {/* Columna izquierda: Menú de opciones */}
          <div className="flex flex-col gap-4">
            {menuCards.map((card, index) => (
              <div
                key={index}
                onClick={() => {
                  if (card.enabled) {
                    navigate(card.route);
                  }
                }}
                className={`group ${
                  card.enabled ? 'cursor-pointer' : 'cursor-not-allowed'
                }`}
                style={{
                  animation: 'fadeIn 0.5s ease-out',
                  animationDelay: `${index * 0.05}s`,
                  animationFillMode: 'backwards',
                }}
              >
                <div
                  className={`backdrop-blur-lg rounded-2xl p-5 border-2 transition-all duration-300 ${
                    card.enabled
                      ? 'bg-white/25 border-white/40 hover:border-white/60 hover:scale-[1.02] hover:shadow-2xl hover:bg-white/30'
                      : 'bg-white/15 border-white/25 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`bg-gradient-to-br ${card.color} rounded-xl p-3 flex-shrink-0 shadow-lg`}
                    >
                      <span className="text-3xl">{card.icon}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3
                        className={`text-xl font-bold text-white drop-shadow-md mb-1 transition-colors ${
                          card.enabled ? 'group-hover:text-white' : ''
                        }`}
                      >
                        {card.title}
                      </h3>
                      <p className="text-white/90 text-sm drop-shadow">
                        {card.description}
                      </p>
                    </div>

                    {card.enabled ? (
                      <svg
                        className="w-6 h-6 text-white drop-shadow-md flex-shrink-0 transform group-hover:translate-x-1 transition-transform"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    ) : (
                      <span className="text-white/60 text-xs flex-shrink-0 font-semibold">
                        Pronto
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Columna derecha: Equipo y Puntos */}
          <div className="flex flex-col gap-4">
            {/* Widget de Puntos */}
            <WidgetPuntos />

            {/* Tarjeta de Mi Equipo con Estadísticas */}
            <div className="bg-white/25 backdrop-blur-lg rounded-2xl p-5 border-2 border-white/40 flex-1 flex flex-col">
              <h2 className="text-2xl font-bold text-white drop-shadow-lg mb-4 text-center">
                Mi Equipo
              </h2>

              <div className="flex-1 flex flex-col min-h-0">
                {/* Sección del Equipo */}
                <div className="flex-1 min-h-0 flex flex-col justify-center">
                  {teamPlayers.length > 0 ? (
                    <div className="space-y-3">
                      <div className="overflow-auto flex-shrink-0">
                        <FormacionEquipoCompacta
                          players={teamPlayers}
                          showSuplentes={false}
                        />
                      </div>

                      <div className="flex justify-center">
                        <button
                          onClick={() => navigate('/UpdateTeam')}
                          className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white py-2.5 px-6 rounded-xl font-bold text-sm transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105 border-2 border-white/30"
                        >
                          Ver Equipo Completo
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="mb-4">
                        <span className="text-5xl">⚽</span>
                      </div>
                      <p className="text-white text-base mb-4 font-semibold drop-shadow">
                        Aún no tienes un equipo creado
                      </p>
                      <button
                        onClick={() => navigate('/UpdateTeam')}
                        className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white py-2.5 px-8 rounded-xl font-bold text-sm transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105 border-2 border-white/30"
                      >
                        Crear Mi Equipo
                      </button>
                    </div>
                  )}
                </div>

                {/* Sección de Estadísticas (más compacta) */}
                <div className="flex-shrink-0 mt-4 pt-4 border-t-2 border-white/30">
                  <div className="flex items-center justify-around gap-3 text-center">
                    <div>
                      <div className="text-2xl font-bold text-yellow-300 drop-shadow-md">
                        ---
                      </div>
                      <div className="text-white text-xs font-medium drop-shadow">
                        Puntos
                      </div>
                    </div>
                    <div className="w-px h-10 bg-white/40"></div>
                    <div>
                      <div className="text-2xl font-bold text-yellow-300 drop-shadow-md">
                        ---
                      </div>
                      <div className="text-white text-xs font-medium drop-shadow">
                        Ranking
                      </div>
                    </div>
                    <div className="w-px h-10 bg-white/40"></div>
                    <div>
                      <div className="text-2xl font-bold text-yellow-300 drop-shadow-md">
                        ---
                      </div>
                      <div className="text-white text-xs font-medium drop-shadow">
                        Jornada
                      </div>
                    </div>
                    <div className="w-px h-10 bg-white/40"></div>
                    <div>
                      <div className="text-2xl font-bold text-yellow-300 drop-shadow-md">
                        {teamPlayers.length > 0 ? teamPlayers.length : '---'}
                      </div>
                      <div className="text-white text-xs font-medium drop-shadow">
                        Jugadores
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Estilos */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes fadeIn {
              from {
                opacity: 0;
                transform: translateY(10px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
          `,
        }}
      />
    </div>
  );
};

export default LoggedMenu;
