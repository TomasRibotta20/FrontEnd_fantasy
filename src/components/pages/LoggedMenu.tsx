import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import FormacionEquipoCompacta from '../common/FormacionEquipoCompacta';
import WidgetPuntos from '../common/WidgetPuntos';
import apiClient from '../../services/apiClient';
import { obtenerDetalleTorneo } from '../../services/torneosService';
import {
  useTorneoSeleccionado,
  useMiEquipoId,
} from '../../hooks/useSessionData';
import { mapBackendPlayerToFrontend } from '../../utils/playerMapper';
import type { Player, BackendPlayerResponse } from '../../types/player.types';

interface MenuCard {
  title: string;
  description: string;
  icon: string;
  route: string;
  color: string;
  enabled: boolean;
}

/** Menú principal del usuario autenticado. */
const LoggedMenu = () => {
  const navigate = useNavigate();
  const [teamPlayers, setTeamPlayers] = useState<Player[]>([]);
  const [equipoIdDelTorneo, setEquipoIdDelTorneo] = useState<number | null>(
    null,
  );
  const [torneoEstado, setTorneoEstado] = useState<string | null>(null);

  // Fuente única de verdad: hooks de sesión
  const [torneoGuardadoId, setTorneoGuardadoId] = useTorneoSeleccionado();
  const [miEquipoId, setMiEquipoId] = useMiEquipoId();

  useEffect(() => {
    const fetchTeamPlayers = async () => {
      try {
        let torneoId = torneoGuardadoId;
        let equipoId: number | null = miEquipoId ? parseInt(miEquipoId) : null;

        // Si ya tenemos equipoId del hook, sincronizar con el estado local
        if (equipoId) {
          setEquipoIdDelTorneo(equipoId);
        }

        // Si no hay torneoId guardado, obtener el primer torneo activo
        if (!torneoId) {
          try {
            const torneosResponse = await apiClient.post(
              '/api/torneos/mis-torneos',
              {},
            );
            const torneos = torneosResponse.data?.data || torneosResponse.data;

            // Buscar el primer torneo activo
            const torneoActivo = torneos.find(
              (t: { estado: string }) => t.estado === 'ACTIVO',
            );

            if (torneoActivo) {
              const torneoIdStr = torneoActivo.torneo_id.toString();
              torneoId = torneoIdStr;
              setTorneoGuardadoId(torneoIdStr);
              setTorneoEstado(torneoActivo.estado);

              if (torneoActivo.mi_equipo?.id) {
                equipoId = torneoActivo.mi_equipo.id;
                setEquipoIdDelTorneo(equipoId);
                setMiEquipoId(equipoId.toString());
              }
            }
          } catch {
            // error silenciado
          }
        } else {
          // Siempre obtener el estado actual del torneo
          try {
            const torneoResponse = await obtenerDetalleTorneo(
              parseInt(torneoId),
            );
            setTorneoEstado(torneoResponse.data.estado);

            if (!equipoId) {
              equipoId = torneoResponse.data.mi_equipo_id;

              if (!equipoId) {
                navigate(`/torneos/${torneoId}`);
                return;
              }

              setEquipoIdDelTorneo(equipoId);
              setMiEquipoId(equipoId.toString());
            }
          } catch {
            // error silenciado
          }
        }

        // Si no hay equipoId, no podemos cargar nada
        if (!equipoId) {
          setTeamPlayers([]);
          return;
        }

        // Construir la URL del endpoint con el equipoId
        const endpoint = `/api/equipos/detalle-equipo/${equipoId}`;

        const response = await apiClient.get(endpoint);

        // El backend puede devolver { data: { id, nombre, jugadores } } o directamente { id, nombre, jugadores }
        const equipoData = response.data?.data || response.data;

        if (equipoData && equipoData.jugadores) {
          const equipoId = equipoData.id;

          // ✅ Usar función centralizada del playerMapper
          const mappedPlayers = equipoData.jugadores.map(
            (item: BackendPlayerResponse, index: number) =>
              mapBackendPlayerToFrontend(item, index),
          );

          // ✅ Filtrar solo los titulares para mostrar en la formación
          const titulares = mappedPlayers.filter(
            (p: Player) => p.esTitular === true,
          );
          setTeamPlayers(titulares);

          // ✅ Intentar obtener puntajes de la última jornada
          try {
            const historialResponse = await apiClient.get(
              `/api/equipos/${equipoId}/historial`,
            );

            // Obtener la última jornada con puntos
            const historialData = Array.isArray(historialResponse.data)
              ? historialResponse.data
              : historialResponse.data?.data || [];

            if (historialData.length > 0) {
              // Ordenar por jornadaId descendente y tomar la primera
              const ordenado = historialData.sort(
                (
                  a: { jornada?: { id: number } },
                  b: { jornada?: { id: number } },
                ) => (b.jornada?.id || 0) - (a.jornada?.id || 0),
              );
              const ultimaJornada = ordenado[0];
              const jornadaId = ultimaJornada?.jornada?.id;

              // Verificar si el historial ya trae los jugadores con puntajes
              const jugadoresHistorial = ultimaJornada?.jugadores;

              if (
                jugadoresHistorial &&
                Array.isArray(jugadoresHistorial) &&
                jugadoresHistorial.length > 0
              ) {
                // Usar los puntajes directamente del historial
                const jugadoresConPuntajes = titulares.map((player: Player) => {
                  const jugadorConPuntaje = jugadoresHistorial.find(
                    (j: {
                      nombre?: string;
                      name?: string;
                      jugadorId?: number;
                      id?: number;
                      puntaje?: number;
                      puntos?: number;
                    }) => {
                      const nombreMatch =
                        j.nombre === player.name || j.name === player.name;
                      const idMatch =
                        (j.jugadorId && j.jugadorId === player.id) ||
                        (j.id && j.id === player.id);
                      return nombreMatch || idMatch;
                    },
                  );

                  const puntajeReal =
                    jugadorConPuntaje?.puntaje ?? jugadorConPuntaje?.puntos;
                  return {
                    ...player,
                    // Incluir puntaje siempre que sea un número (incluyendo 0 y negativos)
                    ...(typeof puntajeReal === 'number'
                      ? { puntaje: puntajeReal }
                      : {}),
                  };
                });

                setTeamPlayers(jugadoresConPuntajes);
              } else if (jornadaId) {
                // Fallback: Intentar obtener detalles de esa jornada
                try {
                  const detalleResponse = await apiClient.get(
                    `/api/equipos/${equipoId}/puntos/jornadas/${jornadaId}`,
                  );
                  const detalle =
                    detalleResponse.data?.data || detalleResponse.data;

                  // Backend devuelve titulares[] y suplentes[] separados, o jugadores[]
                  const jugadoresDetalle = detalle?.jugadores || [
                    ...(detalle?.titulares || []),
                    ...(detalle?.suplentes || []),
                  ];

                  if (jugadoresDetalle.length > 0) {
                    // Mapear puntajes a los jugadores actuales
                    const jugadoresConPuntajes = titulares.map(
                      (player: Player) => {
                        const jugadorConPuntaje = jugadoresDetalle.find(
                          (j: {
                            nombre?: string;
                            name?: string;
                            nombreCompleto?: string;
                            id?: number;
                            apiId?: number;
                          }) => {
                            const nombreMatch =
                              j.nombre === player.name ||
                              j.name === player.name ||
                              j.nombreCompleto === player.name;
                            const idMatch =
                              (j.id && j.id === player.id) ||
                              (j.apiId && j.apiId === player.apiId);
                            return nombreMatch || idMatch;
                          },
                        );

                        const puntajeReal = jugadorConPuntaje?.puntaje;
                        return {
                          ...player,
                          // Incluir puntaje siempre que sea un número (incluyendo 0 y negativos)
                          ...(typeof puntajeReal === 'number'
                            ? { puntaje: puntajeReal }
                            : {}),
                        };
                      },
                    );

                    setTeamPlayers(jugadoresConPuntajes);
                  }
                } catch {
                  // El endpoint de detalle falló, continuar sin puntajes individuales
                }
              }
            }
          } catch {
            // Continuar sin puntajes
          }
        }
      } catch {
        // Si el usuario no tiene equipo (404), continuar sin equipo
      }
    };
    fetchTeamPlayers();
  }, [
    navigate,
    torneoGuardadoId,
    miEquipoId,
    setTorneoGuardadoId,
    setMiEquipoId,
  ]);

  const torneoActivo = torneoEstado === 'ACTIVO';

  const menuCards: MenuCard[] = [
    {
      title: 'Mi Equipo',
      description:
        torneoGuardadoId && !torneoActivo
          ? 'El torneo aún no ha iniciado'
          : 'Gestiona tu equipo y alineación',
      icon: '⚽',
      route: '/UpdateTeam',
      color: 'from-blue-500 to-cyan-500',
      enabled: !!torneoGuardadoId && torneoActivo,
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
      title: 'Leaderboard',
      description: 'Ver clasificación del torneo',
      icon: '🏅',
      route: '/leaderboard',
      color: 'from-yellow-500 to-amber-500',
      enabled: !!torneoGuardadoId,
    },
    {
      title: 'Torneos',
      description: 'Gestionar tus torneos',
      icon: '🎯',
      route: '/torneos',
      color: 'from-indigo-500 to-purple-500',
      enabled: true,
    },
    {
      title: 'Mercado',
      description:
        torneoGuardadoId && !torneoActivo
          ? 'El torneo aún no ha iniciado'
          : 'Explorar jugadores disponibles',
      icon: '🛒',
      route: '/mercado',
      color: 'from-purple-500 to-pink-500',
      enabled: !!torneoGuardadoId && torneoActivo,
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
    <div className="h-screen overflow-hidden pt-20">
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

      <div className="container mx-auto px-4 h-[calc(100vh-5rem)] flex flex-col relative z-10 py-4">
        {/* Header mejorado */}
        <div className="text-center mb-3 flex-shrink-0">
          <h1 className="text-3xl font-bold text-white mb-1 drop-shadow-lg">
            Bienvenido a TurboFantasy
          </h1>
        </div>

        {/* Contenido principal en dos columnas */}
        <div
          className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 overflow-hidden"
          style={{ maxHeight: 'calc(100vh - 10rem)' }}
        >
          {/* Columna izquierda: Menú de opciones */}
          <div className="flex flex-col gap-3 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
            {menuCards.map((card, index) => (
              <div
                key={index}
                onClick={() => {
                  if (card.enabled) {
                    let route = card.route;

                    if (torneoGuardadoId) {
                      if (
                        card.route === '/leaderboard' ||
                        card.route === '/mercado'
                      ) {
                        route = `${card.route}/${torneoGuardadoId}`;
                      }
                    }

                    navigate(route);
                  }
                }}
                className={`group ${
                  card.enabled ? 'cursor-pointer' : 'cursor-not-allowed'
                } flex-shrink-0`}
                style={{
                  animation: 'fadeIn 0.5s ease-out',
                  animationDelay: `${index * 0.05}s`,
                  animationFillMode: 'backwards',
                }}
              >
                <div
                  className={`backdrop-blur-lg rounded-xl p-5 border-2 transition-all duration-300 ${
                    card.enabled
                      ? 'bg-white/25 border-white/40 hover:border-white/60 hover:shadow-2xl hover:bg-white/30'
                      : 'bg-white/15 border-white/25 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`bg-gradient-to-br ${card.color} rounded-xl p-3 flex-shrink-0 shadow-xl`}
                    >
                      <span className="text-4xl drop-shadow-lg">
                        {card.icon}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3
                        className={`text-xl font-bold text-white drop-shadow-md transition-colors leading-tight ${
                          card.enabled ? 'group-hover:text-white' : ''
                        }`}
                      >
                        {card.title}
                      </h3>
                      <p className="text-white text-sm drop-shadow leading-relaxed mt-1.5">
                        {card.description}
                      </p>
                    </div>

                    {card.enabled ? (
                      <svg
                        className="w-7 h-7 text-white drop-shadow-md flex-shrink-0 transform group-hover:translate-x-1 transition-transform"
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
                      <span className="text-white/70 text-xs flex-shrink-0 font-bold drop-shadow bg-white/10 px-3 py-1 rounded-full">
                        {torneoGuardadoId && !torneoActivo
                          ? 'Torneo no iniciado'
                          : 'Seleccioná un torneo'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Columna derecha: Equipo y Puntos */}
          <div className="flex flex-col gap-2 overflow-visible pr-2">
            {/* Widget de Puntos */}
            <div className="backdrop-blur-lg rounded-lg border-2 border-white/40 flex-shrink-0 bg-white/5 p-1.5">
              <WidgetPuntos
                equipoId={equipoIdDelTorneo}
                torneoId={torneoGuardadoId}
              />
            </div>

            {/* Tarjeta de Mi Equipo con Estadísticas */}
            <div className="backdrop-blur-lg rounded-lg p-2 border-2 border-white/40 flex-shrink-0 bg-white/5 overflow-visible pb-6">
              <h2 className="text-base font-bold text-white drop-shadow-lg mb-1.5 text-center border-b border-white/30 pb-1.5">
                Mi Equipo
              </h2>

              <div className="flex flex-col justify-center items-center">
                {/* Sección del Equipo */}
                <div className="flex flex-col w-full items-center">
                  {teamPlayers.length > 0 ? (
                    <div className="w-full flex justify-center scale-90 origin-top mb-[-10%]">
                      <FormacionEquipoCompacta
                        players={teamPlayers}
                        showSuplentes={false}
                        mostrarPuntajes={teamPlayers.some(
                          (p) => p.puntaje !== undefined,
                        )}
                      />
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-white text-base font-semibold drop-shadow">
                        Unite a un torneo para tener tu equipo
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoggedMenu;
