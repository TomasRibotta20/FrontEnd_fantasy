import { useEffect, useState, useMemo, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
  const navigate = useNavigate();
import apiClient from '../../../services/apiClient';
import FormacionEquipoCompacta from '../../common/FormacionEquipoCompacta';
import { Notification } from '../../common/Notification';
import { clausulasService } from '../../../services/clausulasService';
import {
  getPositionDisplayName,
  getPlayerDisplayName,
} from '../../../utils/playerMapper';
import type {
  PlayerPosition,
  BackendPlayerResponse,
} from '../../../types/player.types';
import {
  useTorneoSeleccionado,
  useMiEquipoId,
} from '../../../hooks/useSessionData';

interface Player {
  id?: number; // ID de la relación equipo-jugador
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
  position: PlayerPosition;
  esTitular?: boolean;
  puntaje?: number;
  club?: number; // ID del club
  clubName?: string; // Nombre del club
  clubLogo?: string; // Logo del club
  precio?: number; // Precio actual del jugador
  valor_clausula?: number; // Cláusula de rescisión (si está blindado)
}

interface Club {
  id: number;
  id_api: number;
  nombre: string;
  logo: string;
}

interface Torneo {
  torneo_id: number;
  mi_equipo?: {
    id: number;
  };
}

const UpdateTeam = () => {
  const [teamPlayers, setTeamPlayers] = useState<Player[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [presupuesto, setPresupuesto] = useState<number>(0);
  const [presupuestoBloqueado, setPresupuestoBloqueado] = useState<number>(0);
  const [equipoIdResuelto, setEquipoIdResuelto] = useState<string | null>(null);

  // Obtener equipoId de los query params si existe usando useSearchParams para reactividad
  const [searchParams] = useSearchParams();
  const equipoIdFromUrl = searchParams.get('equipoId');

  // ✅ Usar hooks reactivos para obtener torneoId y equipoId guardados
  const [torneoGuardadoId] = useTorneoSeleccionado();
  const [miEquipoId] = useMiEquipoId();

  // Si no hay equipoId en URL, obtenerlo del torneo guardado
  useEffect(() => {
    const obtenerEquipoId = async () => {
      // Primero verificar si ya tenemos un equipoId
      if (equipoIdFromUrl) {
        setEquipoIdResuelto(equipoIdFromUrl);
        return;
      }

      // Segundo, verificar el hook miEquipoId
      if (miEquipoId) {
        setEquipoIdResuelto(miEquipoId);
        return;
      }

      // Tercero, obtenerlo del torneo guardado
      if (torneoGuardadoId) {
        try {
          const response = await apiClient.post('/api/torneos/mis-torneos', {});
          const torneos = response.data?.data || response.data;
          const torneoActual = torneos.find(
            (t: Torneo) => t.torneo_id === parseInt(torneoGuardadoId)
          );
          if (torneoActual?.mi_equipo?.id) {
            setEquipoIdResuelto(torneoActual.mi_equipo.id.toString());
          }
        } catch (error) {
          console.error('Error al obtener equipoId:', error);
        }
      }
    };
    obtenerEquipoId();
  }, [equipoIdFromUrl, torneoGuardadoId, miEquipoId]);

  // Estados para el sistema de intercambio
  const [selectedPlayerForSwap, setSelectedPlayerForSwap] =
    useState<Player | null>(null);

  // Estado para el modal de información del jugador
  const [selectedPlayerInfo, setSelectedPlayerInfo] = useState<Player | null>(
    null
  );

  // Estado para notificaciones
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'warning' | 'info';
    text: string;
  } | null>(null);

  // Estados para blindar jugador
  const [showBlindarModal, setShowBlindarModal] = useState(false);
  const [selectedPlayerToBlindar, setSelectedPlayerToBlindar] =
    useState<Player | null>(null);
  const [montoIncremento, setMontoIncremento] = useState<number>(0);

  // Estado para mostrar info de blindaje
  const [infoBlindaje, setInfoBlindaje] = useState<{
    jugador: string;
    precioBase: number;
    incremento: number;
    clausulaTotal: number;
    foto: string;
  } | null>(null);

  useEffect(() => {
    const fetchClubs = async () => {
      try {
        const response = await apiClient.get('/api/clubs');
        // La respuesta puede venir en response.data.data o response.data directamente
        if (response.data && response.data.data) {
          setClubs(response.data.data);
        } else if (response.data && Array.isArray(response.data)) {
          setClubs(response.data);
        }
      } catch {
        // Error al obtener clubes
      }
    };
    fetchClubs();
  }, []);

  const getPositionName = useCallback(
    (position: unknown): string => getPositionDisplayName(position),
    []
  );

  // CARGAR MI EQUIPO (UNA SOLA VEZ AL INICIO)
  useEffect(() => {
    const fetchTeamPlayers = async () => {
      // Esperar a que se resuelva el equipoId
      if (!equipoIdFromUrl && !equipoIdResuelto) {
        return;
      }

      try {
        // Usar el equipoId resuelto (de URL o de localStorage)
        const equipoIdFinal = equipoIdFromUrl || equipoIdResuelto;
        const endpoint = equipoIdFinal
          ? `/api/equipos/detalle-equipo/${equipoIdFinal}`
          : '/api/equipos/detalle-equipo';

        const response = await apiClient.get(endpoint);

        // La respuesta puede venir en response.data.data o response.data directamente
        const equipoData = response.data?.data || response.data;

        if (equipoData && equipoData.jugadores) {
          const equipoId = equipoData.id;

          const mappedPlayers = equipoData.jugadores.map(
            (item: BackendPlayerResponse, index: number) => {
              // Cuando viene con equipoId, la estructura es diferente
              // item tiene { id, equipo, jugador: {...}, es_titular }
              const jugador = item.jugador || item;

              // El backend envía campos en español: primer_nombre, apellido, nombre
              const firstName =
                jugador.primer_nombre || jugador.firstname || '';
              const lastName = jugador.apellido || jugador.lastname || '';

              // Construir el nombre completo
              let fullName = '';
              if (firstName && lastName) {
                fullName = `${firstName} ${lastName}`.trim();
              } else if (firstName) {
                fullName = firstName;
              } else if (lastName) {
                fullName = lastName;
              } else {
                fullName = jugador.nombre || jugador.name || '';
              }

              // Extraer altura y peso (vienen como string con unidades: "174 cm", "70 kg")
              const alturaStr = jugador.altura || jugador.height || '';
              const pesoStr = jugador.peso || jugador.weight || '';
              const altura = alturaStr ? parseInt(alturaStr) : undefined;
              const peso = pesoStr ? parseInt(pesoStr) : undefined;

              return {
                id: jugador.id, // ID del jugador en la BD
                apiId: jugador.id_api || jugador.apiId || index,
                name: fullName,
                firstName: firstName,
                lastName: lastName,
                age: jugador.edad || jugador.age || 0,
                nationality: jugador.nacionalidad || jugador.nationality || '',
                height: altura,
                weight: peso,
                photo:
                  jugador.foto ||
                  jugador.photo ||
                  'https://via.placeholder.com/64x64/4F46E5/FFFFFF?text=?',
                jerseyNumber:
                  jugador.numero_camiseta || jugador.jerseyNumber || 0,
                position: jugador.posicion || jugador.position || '',
                esTitular: item.es_titular, // Flag de titular/suplente
                // El club puede venir como objeto o como ID
                club:
                  typeof jugador.club === 'object'
                    ? jugador.club?.id
                    : jugador.club,
                clubName: jugador.club?.nombre,
                clubLogo: jugador.club?.logo,
                precio: jugador.precio_actual || 0, // Precio del jugador
                valor_clausula: item.valor_clausula || undefined, // Cláusula de rescisión
              };
            }
          );

          // Guardar presupuesto del equipo
          if (equipoData.presupuesto !== undefined) {
            setPresupuesto(equipoData.presupuesto);
          }
          if (equipoData.presupuesto_bloqueado !== undefined) {
            setPresupuestoBloqueado(equipoData.presupuesto_bloqueado);
          }

          // Guardar equipoId en localStorage para usar en otras páginas
          if (equipoIdFinal) {
            localStorage.setItem('miEquipoId', equipoIdFinal.toString());
          }

          // Intentar obtener puntajes de la última jornada
          try {
            const historialResponse = await apiClient.get(
              `/api/equipos/${equipoId}/historial`
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
                  b: { jornada?: { id: number } }
                ) => (b.jornada?.id || 0) - (a.jornada?.id || 0)
              );
              const ultimaJornada = ordenado[0];
              const jornadaId = ultimaJornada?.jornada?.id;

              if (jornadaId) {
                // Obtener detalles de esa jornada para traer los puntajes
                const detalleResponse = await apiClient.get(
                  `/api/equipos/${equipoId}/puntos/jornadas/${jornadaId}`
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
                  const jugadoresConPuntajes = mappedPlayers.map(
                    (player: Player) => {
                      // Intentar buscar por diferentes campos
                      const jugadorConPuntaje = jugadoresDetalle.find(
                        (j: {
                          nombre?: string;
                          name?: string;
                          nombreCompleto?: string;
                          id?: number;
                          apiId?: number;
                        }) => {
                          // Comparar por nombre
                          const nombreMatch =
                            j.nombre === player.name ||
                            j.name === player.name ||
                            j.nombreCompleto === player.name;
                          // O comparar por ID si está disponible
                          const idMatch =
                            (j.id && j.id === player.id) ||
                            (j.apiId && j.apiId === player.apiId);

                          const match = nombreMatch || idMatch;
                          return match;
                        }
                      );

                      // Incluir puntaje siempre que sea un número (incluyendo 0 y negativos)
                      const puntajeReal = jugadorConPuntaje?.puntaje;
                      return {
                        ...player,
                        ...(typeof puntajeReal === 'number'
                          ? { puntaje: puntajeReal }
                          : {}),
                      };
                    }
                  );

                  setTeamPlayers(jugadoresConPuntajes);
                  return; // Salir temprano si se logró mapear puntajes
                }
              }
            }
          } catch {
            // Continuar sin puntajes
          }

          setTeamPlayers(mappedPlayers);
        }
      } catch {
        // Error al obtener mi equipo
      }
    };
    fetchTeamPlayers();
  }, [equipoIdFromUrl, equipoIdResuelto]); // Se ejecuta cuando cambia el equipoId

  // Listener para evento de mostrar info de blindaje
  useEffect(() => {
    const handleMostrarInfo = (event: Event) => {
      const customEvent = event as CustomEvent;
      setInfoBlindaje(customEvent.detail);
    };

    window.addEventListener('mostrarInfoBlindaje', handleMostrarInfo);
    return () => {
      window.removeEventListener('mostrarInfoBlindaje', handleMostrarInfo);
    };
  }, []);

  // Usar la función auxiliar estable
  const getPlayerName = useCallback(
    (player: Player): string => getPlayerDisplayName(player),
    []
  );

  const getShortName = useCallback(
    (player: Player): string => {
      const fullName = getPlayerName(player);
      const parts = fullName.split(' ');

      if (parts.length >= 2) {
        return `${parts[0].charAt(0)}. ${parts[parts.length - 1]}`;
      }

      return fullName;
    },
    [getPlayerName]
  );

  // Función para intercambiar titular con suplente (memoizada)
  const swapLineup = useCallback(
    async (titularId: number, suplenteId: number) => {
      try {
        const payload = {
          jugadorTitularId: titularId,
          jugadorSuplenteId: suplenteId,
        };

        const alineacionEndpoint = equipoIdFromUrl
          ? `/api/equipos/mi-equipo/${equipoIdFromUrl}/alineacion`
          : '/api/equipos/mi-equipo/alineacion';

        await apiClient.patch(alineacionEndpoint, payload);

        // Actualizar el estado local
        setTeamPlayers((prevPlayers) =>
          prevPlayers.map((player) => {
            if (player.id === titularId) {
              return { ...player, esTitular: false };
            }
            if (player.id === suplenteId) {
              return { ...player, esTitular: true };
            }
            return player;
          })
        );

        setNotification({
          type: 'success',
          text: 'Intercambio realizado exitosamente',
        });
      } catch (error: unknown) {
        const axiosError = error as {
          response?: { data?: { message?: string }; status?: number };
          message?: string;
        };

        const errorMsg =
          axiosError.response?.data?.message ||
          axiosError.message ||
          'Error desconocido';

        setNotification({
          type: 'error',
          text: `Error al realizar el intercambio: ${errorMsg}`,
        });
      }
    },
    [equipoIdFromUrl]
  );

  // Función para cambiar el estado de un jugador (suplente → titular)
  const cambiarEstadoJugador = useCallback(
    async (jugadorId: number, nuevoEstado: boolean) => {
      try {
        // Usar equipoIdFromUrl o equipoIdResuelto
        const equipoId = equipoIdFromUrl || equipoIdResuelto;

        if (!equipoId) {
          setNotification({
            type: 'error',
            text: 'Error: No se pudo determinar el equipo',
          });
          return;
        }

        const endpoint = `/api/equipos/mi-equipo/${equipoId}/cambiar-estado`;

        await apiClient.patch(endpoint, {
          jugadorId,
          esTitular: nuevoEstado,
        });

        // Actualizar el estado local
        setTeamPlayers((prevPlayers) =>
          prevPlayers.map((player) =>
            player.id === jugadorId
              ? { ...player, esTitular: nuevoEstado }
              : player
          )
        );

        setNotification({
          type: 'success',
          text: nuevoEstado
            ? '✅ Jugador alineado como titular'
            : '⬇️ Jugador movido a suplentes',
        });
      } catch (error: unknown) {
        const axiosError = error as {
          response?: { data?: { message?: string }; status?: number };
          message?: string;
        };

        const errorMsg =
          axiosError.response?.data?.message ||
          axiosError.message ||
          'Error desconocido';

        setNotification({
          type: 'error',
          text: `Error al cambiar estado: ${errorMsg}`,
        });
      }
    },
    [equipoIdFromUrl, equipoIdResuelto]
  );

  // Función para intercambiar jugador del equipo con uno externo (memoizada)
  const swapTeamPlayer = useCallback(
    async (jugadorSaleId: number, jugadorEntraId: number) => {
      try {
        const intercambioEndpoint = equipoIdFromUrl
          ? `/api/equipos/mi-equipo/${equipoIdFromUrl}/intercambio`
          : '/api/equipos/mi-equipo/intercambio';

        await apiClient.patch(intercambioEndpoint, {
          jugadorSaleId: jugadorSaleId,
          jugadorEntraId: jugadorEntraId, // ✅ Ahora envía el ID correcto del jugador en la BD
        });

        // Recargar el equipo completo desde el servidor
        const reloadEndpoint = equipoIdFromUrl
          ? `/api/equipos/detalle-equipo/${equipoIdFromUrl}`
          : '/api/equipos/detalle-equipo';

        const response = await apiClient.get(reloadEndpoint);
        const reloadedEquipoData = response.data?.data || response.data;

        if (reloadedEquipoData && reloadedEquipoData.jugadores) {
          const mappedPlayers = reloadedEquipoData.jugadores.map(
            (item: BackendPlayerResponse, index: number) => {
              const jugador = item.jugador || item;
              const firstName =
                jugador.primer_nombre || jugador.firstname || '';
              const lastName = jugador.apellido || jugador.lastname || '';

              let fullName = '';
              if (firstName && lastName) {
                fullName = `${firstName} ${lastName}`.trim();
              } else if (firstName) {
                fullName = firstName;
              } else if (lastName) {
                fullName = lastName;
              } else {
                fullName = jugador.nombre || jugador.name || '';
              }

              const alturaStr = jugador.altura || jugador.height || '';
              const pesoStr = jugador.peso || jugador.weight || '';

              return {
                id: jugador.id, // ID del jugador en la BD
                apiId: jugador.id_api || jugador.apiId || index,
                name: fullName,
                firstName: firstName,
                lastName: lastName,
                age: jugador.edad || jugador.age || 0,
                nationality: jugador.nacionalidad || jugador.nationality || '',
                height: alturaStr ? parseInt(alturaStr) : undefined,
                weight: pesoStr ? parseInt(pesoStr) : undefined,
                photo:
                  jugador.foto ||
                  jugador.photo ||
                  'https://via.placeholder.com/64x64/4F46E5/FFFFFF?text=?',
                jerseyNumber:
                  jugador.numero_camiseta || jugador.jerseyNumber || 0,
                position: jugador.posicion || jugador.position || '',
                esTitular: item.es_titular,
                // El club puede venir como objeto o como ID
                club:
                  typeof jugador.club === 'object'
                    ? jugador.club?.id
                    : jugador.club,
                clubName: jugador.club?.nombre,
                clubLogo: jugador.club?.logo,
                precio: jugador.precio_actual || 0,
              };
            }
          );
          setTeamPlayers(mappedPlayers);
        }

        setNotification({
          type: 'success',
          text: 'Jugador intercambiado exitosamente',
        });
      } catch (error: unknown) {
        const axiosError = error as {
          response?: { data?: { message?: string }; status?: number };
          message?: string;
        };

        const errorMsg =
          axiosError.response?.data?.message ||
          axiosError.message ||
          'Error desconocido';
        setNotification({
          type: 'error',
          text: `Error: ${errorMsg}`,
        });
      }
    },
    [equipoIdFromUrl]
  );

  //Manejador para seleccionar jugador para intercambio
  const handlePlayerSelect = useCallback((player: Player) => {
    setSelectedPlayerForSwap((prev) => {
      // Si es el mismo jugador, deseleccionar
      if (prev && prev.id === player.id) {
        return null;
      }
      // Seleccionar nuevo jugador
      return player;
    });
  }, []);

  // Manejador para realizar el intercambio (detecta automáticamente el tipo)
  const handleSwap = useCallback(
    async (targetPlayer: Player, currentSelectedPlayer: Player | null) => {
      if (!currentSelectedPlayer) return;

      // Validar que sean de la misma posición
      const pos1 = getPositionName(currentSelectedPlayer.position);
      const pos2 = getPositionName(targetPlayer.position);
      if (pos1 !== pos2) {
        setNotification({
          type: 'warning',
          text: `Deben ser de la misma posición: ${pos1} ↔ ${pos2}`,
        });
        return;
      }

      // Detectar si el jugador objetivo está en mi equipo o no
      const targetIsInMyTeam = teamPlayers.some(
        (p) => p.id === targetPlayer.id
      );

      if (targetIsInMyTeam) {
        // Intercambio titular-suplente
        if (!currentSelectedPlayer.id || !targetPlayer.id) {
          setNotification({
            type: 'error',
            text: 'Error: Faltan IDs de jugadores',
          });
          return;
        }

        // Validar que uno sea titular y otro suplente
        if (currentSelectedPlayer.esTitular === targetPlayer.esTitular) {
          setNotification({
            type: 'warning',
            text: 'Debes seleccionar un titular y un suplente',
          });
          return;
        }

        // El titular debe ir primero
        const titularId = currentSelectedPlayer.esTitular
          ? currentSelectedPlayer.id
          : targetPlayer.id;
        const suplenteId = currentSelectedPlayer.esTitular
          ? targetPlayer.id
          : currentSelectedPlayer.id;

        await swapLineup(titularId, suplenteId);
      } else {
        // Intercambio con jugador externo
        if (!currentSelectedPlayer.id || !targetPlayer.id) {
          setNotification({
            type: 'error',
            text: 'Error: Faltan IDs de jugadores',
          });
          return;
        }

        await swapTeamPlayer(currentSelectedPlayer.id, targetPlayer.id);
      }

      setSelectedPlayerForSwap(null);
    },
    [teamPlayers, swapLineup, swapTeamPlayer, getPositionName]
  );

  // Manejador para abrir modal de blindar jugador
  const handleBlindarClick = useCallback((player: Player) => {
    setSelectedPlayerToBlindar(player);
    setMontoIncremento(0);
    setShowBlindarModal(true);
  }, []);

  // Manejador para confirmar blindaje
  const handleConfirmarBlindar = useCallback(async () => {
    if (!selectedPlayerToBlindar || !equipoIdResuelto || montoIncremento <= 0) {
      setNotification({
        type: 'warning',
        text: 'Debes ingresar un monto válido',
      });
      return;
    }

    if (!selectedPlayerToBlindar.id) {
      setNotification({
        type: 'error',
        text: 'Error: No se encontró el ID del jugador',
      });
      return;
    }

    try {
      await clausulasService.blindarJugador(
        parseInt(equipoIdResuelto),
        selectedPlayerToBlindar.id,
        { monto_incremento: montoIncremento }
      );

      setNotification({
        type: 'success',
        text: `¡Jugador blindado exitosamente! Cláusula incrementada en $${montoIncremento.toLocaleString(
          'es-AR'
        )}`,
      });

      setShowBlindarModal(false);
      setSelectedPlayerToBlindar(null);
      setMontoIncremento(0);

      // Recargar el equipo para actualizar precios
      window.location.reload();
    } catch (error: unknown) {
      console.error('Error al blindar jugador:', error);
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      const errorMsg =
        axiosError.response?.data?.message || 'Error al blindar el jugador';
      setNotification({
        type: 'error',
        text: errorMsg,
      });
    }
  }, [selectedPlayerToBlindar, equipoIdResuelto, montoIncremento]);

  // Separar titulares y suplentes usando el flag es_titular del backend
  const titulares = useMemo(
    () => teamPlayers.filter((p) => p.esTitular === true),
    [teamPlayers]
  );
  const suplentes = useMemo(
    () => teamPlayers.filter((p) => p.esTitular === false),
    [teamPlayers]
  );

  return (
    <div>
      {/* Componente de Notificación */}
      <Notification
        message={notification}
        onClose={() => setNotification(null)}
      />

      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('/Background_LandingPage.png')`,
          filter: 'blur(2px)',
        }}
      >
        {/* Overlay opcional para mejorar la legibilidad */}
        <div className="absolute inset-0 bg-black opacity-30"></div>
      </div>

      <div className="relative flex px-4 h-screen items-center justify-center gap-3 pt-20 pb-3 overflow-hidden">
        {/* Botón Volver al Leaderboard */}
        <button
          className="absolute left-4 top-4 z-20 bg-white/80 hover:bg-white text-blue-700 font-bold py-2 px-4 rounded-lg shadow transition-all duration-150 border border-blue-200 backdrop-blur"
          onClick={() => {
            if (window.history.length > 2) {
              navigate(-1);
            } else {
              navigate('/leaderboard');
            }
          }}
        >
          ← Volver al Leaderboard
        </button>
        {/* Rectángulo Izquierdo - Estadísticas */}
        <div className="hidden lg:flex team-summary-card w-full max-w-[420px] p-3 rounded-xl shadow-2xl h-[calc(100vh-6rem)] flex-col">
          <div className="border-b border-white/20 pb-2 mb-2 flex-shrink-0">
            <h2 className="text-base font-bold text-center text-white">
              Estadísticas del Equipo
            </h2>
          </div>
          <div className="space-y-2 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent pr-1">
            {/* Calcular estadísticas */}
            {(() => {
              // Filtrar jugadores que tienen puntaje definido (incluyendo 0)
              const jugadoresConPuntos = teamPlayers.filter(
                (p) => p.puntaje !== undefined
              );

              if (jugadoresConPuntos.length === 0) {
                return (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-white/60 text-center text-xs">
                      Las estadísticas aparecerán cuando haya puntos de jornadas
                    </p>
                  </div>
                );
              }

              const puntajeTotal = jugadoresConPuntos.reduce(
                (sum, p) => sum + (p.puntaje || 0),
                0
              );
              const promedio = puntajeTotal / jugadoresConPuntos.length;
              const maxPuntaje = Math.max(
                ...jugadoresConPuntos.map((p) => p.puntaje || 0)
              );
              const minPuntaje = Math.min(
                ...jugadoresConPuntos.map((p) => p.puntaje || 0)
              );

              // Mejores jugadores
              const mejoresJugadores = [...jugadoresConPuntos]
                .sort((a, b) => (b.puntaje || 0) - (a.puntaje || 0))
                .slice(0, 3);

              return (
                <>
                  {/* Resumen de Puntos */}
                  <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg p-4 border border-purple-400/30 flex-shrink-0">
                    <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                      Resumen de Puntos
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white/10 rounded-lg p-3">
                        <p className="text-white/70 text-xs mb-1">
                          Puntaje Total
                        </p>
                        <p className="text-2xl font-bold text-white">
                          {puntajeTotal.toFixed(1)}
                        </p>
                      </div>
                      <div className="bg-white/10 rounded-lg p-3">
                        <p className="text-white/70 text-xs mb-1">Promedio</p>
                        <p className="text-2xl font-bold text-white">
                          {promedio.toFixed(1)}
                        </p>
                      </div>
                      <div className="bg-white/10 rounded-lg p-3">
                        <p className="text-white/70 text-xs mb-1">Máximo</p>
                        <p className="text-2xl font-bold text-green-400">
                          {maxPuntaje.toFixed(1)}
                        </p>
                      </div>
                      <div className="bg-white/10 rounded-lg p-3">
                        <p className="text-white/70 text-xs mb-1">Mínimo</p>
                        <p className="text-2xl font-bold text-red-400">
                          {minPuntaje.toFixed(1)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Top 3 Jugadores */}
                  <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-lg p-4 border border-yellow-400/30 flex-shrink-0">
                    <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                      Top 3 Mejores Jugadores
                    </h3>
                    <div className="space-y-2.5">
                      {mejoresJugadores.map((player, index) => (
                        <div
                          key={player.id}
                          className="flex items-center gap-3 bg-white/10 rounded-lg p-2.5"
                        >
                          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-yellow-400 to-orange-400 text-white font-bold text-sm flex-shrink-0">
                            {index + 1}
                          </div>
                          <img
                            src={player.photo}
                            alt={player.name}
                            className="w-10 h-10 rounded-full object-cover border-2 border-white/40 flex-shrink-0"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src =
                                'https://via.placeholder.com/64x64/4F46E5/FFFFFF?text=?';
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-semibold truncate">
                              {getPlayerDisplayName(player)}
                            </p>
                            <p className="text-white/60 text-xs">
                              {getPositionDisplayName(player.position)}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-lg font-bold text-white">
                              {(player.puntaje || 0).toFixed(1)}
                            </p>
                            <p className="text-white/60 text-xs">pts</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>

        {/* Tarjeta Central - Mi Equipo */}
        <div className="team-summary-card w-full max-w-2xl lg:max-w-4xl p-3 rounded-xl shadow-2xl max-h-[calc(100vh-6rem)] flex flex-col">
          <div className="border-b border-white/20 pb-2 mb-2 flex-shrink-0">
            <h2 className="text-base font-bold text-center text-white">
              Mi Equipo
            </h2>
            {/* Widget de Presupuesto - Compacto */}
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div className="bg-gradient-to-r from-green-500/30 to-emerald-500/30 rounded-lg p-2 border border-green-400/50">
                <p className="text-white/80 text-[10px] text-center font-medium">
                  Disponible
                </p>
                <p className="text-base font-bold text-center text-green-300 drop-shadow-sm">
                  ${presupuesto.toLocaleString('es-AR')}
                </p>
              </div>
              <div className="bg-gradient-to-r from-yellow-500/30 to-orange-500/30 rounded-lg p-2 border border-yellow-400/50">
                <p className="text-white/80 text-[10px] text-center font-medium">
                  Bloqueado
                </p>
                <p className="text-base font-bold text-center text-yellow-300 drop-shadow-sm">
                  ${presupuestoBloqueado.toLocaleString('es-AR')}
                </p>
              </div>
            </div>
          </div>

          {/* Sección de controles de intercambio */}
          {teamPlayers.length > 0 ? (
            <div className="flex-1 flex gap-6 overflow-hidden pt-2">
              {/* Contenedor de Titulares - Más grande */}
              <div className="flex-1 flex flex-col overflow-hidden pr-2 min-h-0">
                {/* Equipo titular */}
                <div className="flex-shrink-0 overflow-visible">
                  <FormacionEquipoCompacta
                    players={titulares}
                    showSuplentes={false}
                    mostrarPuntajes={titulares.some(
                      (p) => (p.puntaje || 0) > 0
                    )}
                    mostrarPrecios={true}
                    onPlayerClick={(player) => {
                      if (
                        selectedPlayerForSwap &&
                        selectedPlayerForSwap.id !== player.id
                      ) {
                        // Si hay otro jugador seleccionado, realizar intercambio
                        handleSwap(player, selectedPlayerForSwap);
                      } else {
                        // Si no hay selección o es el mismo jugador, alternar selección
                        handlePlayerSelect(player);
                      }
                    }}
                    selectedPlayerId={selectedPlayerForSwap?.id}
                  />
                </div>
              </div>

              {/* Suplentes - Columna derecha */}
              {suplentes.length > 0 && (
                <div className="w-72 flex-shrink-0 border-l border-white/20 pl-8 flex flex-col overflow-hidden">
                  <div className="flex flex-col items-center gap-2 mb-5 pb-4 border-b border-white/20 flex-shrink-0 pt-4 mt-2">
                    <h3 className="text-sm font-bold text-white text-center tracking-wide">
                      SUPLENTES
                    </h3>
                    {titulares.length < 11 && (
                      <span className="bg-yellow-500/20 text-yellow-300 text-[10px] font-bold px-3 py-1 rounded-full border border-yellow-400/30 animate-pulse">
                        Faltan {11 - titulares.length} titular
                        {11 - titulares.length !== 1 ? 'es' : ''}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent pr-3 pl-1 space-y-3 pt-2">
                    {suplentes.map((player, index) => {
                      // Verificar si este jugador puede intercambiarse con el seleccionado
                      const canSwap = selectedPlayerForSwap
                        ? getPositionName(selectedPlayerForSwap.position) ===
                          getPositionName(player.position)
                        : false;

                      return (
                        <div
                          key={`suplente-${player.apiId}`}
                          className="relative"
                          style={{
                            animation: 'fadeIn 0.4s ease-out',
                            animationDelay: `${index * 0.05}s`,
                            animationFillMode: 'backwards',
                          }}
                        >
                          <div
                            className={`flex items-center gap-3 cursor-pointer transition-all bg-white/5 hover:bg-white/10 rounded-lg p-2 ${
                              selectedPlayerForSwap?.id === player.id
                                ? 'ring-4 ring-yellow-400'
                                : canSwap
                                ? 'ring-2 ring-green-400 hover:ring-4'
                                : ''
                            }`}
                            onClick={() => {
                              if (
                                selectedPlayerForSwap &&
                                selectedPlayerForSwap.id !== player.id
                              ) {
                                // Si hay otro jugador seleccionado, realizar intercambio
                                handleSwap(player, selectedPlayerForSwap);
                              } else {
                                // Si no hay selección o es el mismo jugador, alternar selección
                                handlePlayerSelect(player);
                              }
                            }}
                          >
                            {/* Imagen del jugador */}
                            <div className="relative flex-shrink-0">
                              <img
                                src={player.photo}
                                alt={getPlayerName(player)}
                                loading="lazy"
                                className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-lg bg-white"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src =
                                    'https://via.placeholder.com/64x64/4F46E5/FFFFFF?text=?';
                                }}
                              />
                              {selectedPlayerForSwap?.id === player.id && (
                                <div className="absolute -top-1 -right-1 bg-gradient-to-br from-yellow-400 to-orange-400 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg border-2 border-white">
                                  <svg
                                    className="w-3 h-3"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </div>
                              )}
                            </div>

                            {/* Información del jugador */}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-white leading-tight truncate">
                                {getShortName(player)}
                              </p>
                              <p className="text-[10px] text-white/70 mt-0.5">
                                {getPositionName(player.position)}
                              </p>
                              <p className="text-[10px] text-green-400 font-semibold mt-0.5">
                                ${(player.precio || 0).toLocaleString('es-AR')}
                              </p>
                            </div>
                          </div>

                          {/* Botón para alinear cuando hay menos de 11 titulares */}
                          {titulares.length < 11 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                cambiarEstadoJugador(player.id!, true);
                              }}
                              className="mt-2 w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-[10px] font-bold py-1.5 px-2 rounded-lg shadow-lg transition-all duration-200 hover:scale-105 flex items-center justify-center gap-1"
                              title="Alinear como titular"
                            >
                              <svg
                                className="w-3 h-3"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              Alinear
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Botón de Blindar - Solo cuando hay jugador seleccionado */}
                  {selectedPlayerForSwap && (
                    <div className="mt-4 mb-2 flex-shrink-0 px-1">
                      <button
                        onClick={() =>
                          handleBlindarClick(selectedPlayerForSwap)
                        }
                        className="w-full py-3 px-4 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold rounded-lg transition-all duration-200 transform hover:scale-[1.02] shadow-lg flex items-center justify-center gap-2"
                      >
                        <span className="text-sm">
                          Blindar a {getShortName(selectedPlayerForSwap)}
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8"></div>
          )}
        </div>
      </div>

      {/* Modal de Información del Jugador */}
      {selectedPlayerInfo && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedPlayerInfo(null)}
        >
          <div
            className="bg-gradient-to-br from-slate-800/95 to-slate-900/95 rounded-2xl shadow-2xl max-w-md w-full border-2 border-white/20 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del modal */}
            <div className="relative bg-gradient-to-r from-blue-600/30 to-purple-600/30 p-6 border-b border-white/10">
              <button
                onClick={() => setSelectedPlayerInfo(null)}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-all duration-200"
              >
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>

              <div className="flex items-center gap-4">
                <img
                  src={selectedPlayerInfo.photo}
                  alt={getPlayerDisplayName(selectedPlayerInfo)}
                  className="w-20 h-20 rounded-full object-cover border-4 border-white/20 shadow-lg"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src =
                      'https://via.placeholder.com/80x80/4F46E5/FFFFFF?text=?';
                  }}
                />
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white mb-1">
                    {getPlayerDisplayName(selectedPlayerInfo)}
                  </h2>
                  <p className="text-blue-300 font-semibold">
                    {getPositionDisplayName(selectedPlayerInfo.position)}
                  </p>
                </div>
              </div>
            </div>

            {/* Contenido del modal */}
            <div className="p-6 space-y-4">
              {/* Información básica */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                  <p className="text-white/60 text-xs mb-1">Edad</p>
                  <p className="text-white text-lg font-bold">
                    {selectedPlayerInfo.age} años
                  </p>
                </div>
                <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                  <p className="text-white/60 text-xs mb-1">Club</p>
                  <div className="flex items-center justify-center h-12">
                    {selectedPlayerInfo.club ? (
                      (() => {
                        // Extraer el ID del club (puede ser un objeto o un número)
                        let clubId: number | undefined;
                        if (
                          typeof selectedPlayerInfo.club === 'object' &&
                          selectedPlayerInfo.club !== null
                        ) {
                          const clubObj = selectedPlayerInfo.club as {
                            id?: number;
                            id_api?: number;
                          };
                          clubId = clubObj.id_api || clubObj.id;
                        } else if (
                          typeof selectedPlayerInfo.club === 'number'
                        ) {
                          clubId = selectedPlayerInfo.club;
                        }

                        if (!clubId) {
                          return (
                            <span className="text-white/50 text-xs">
                              ID de club inválido
                            </span>
                          );
                        }

                        // Buscar el club por id_api
                        const club = clubs.find((c) => c.id_api === clubId);

                        if (club) {
                          return (
                            <img
                              src={club.logo}
                              alt={club.nombre}
                              className="h-10 w-10 object-contain"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src =
                                  'https://via.placeholder.com/40x40/4F46E5/FFFFFF?text=?';
                              }}
                              title={club.nombre}
                            />
                          );
                        } else {
                          return (
                            <span className="text-white/50 text-xs">
                              Club no encontrado (ID: {clubId})
                            </span>
                          );
                        }
                      })()
                    ) : (
                      <span className="text-white/50 text-xs">
                        Sin club asignado
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Nacionalidad */}
              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <p className="text-white/60 text-xs mb-1">Nacionalidad</p>
                <p className="text-white text-base font-semibold">
                  {selectedPlayerInfo.nationality}
                </p>
              </div>

              {/* Físico */}
              {(selectedPlayerInfo.height || selectedPlayerInfo.weight) && (
                <div className="grid grid-cols-2 gap-3">
                  {selectedPlayerInfo.height && (
                    <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                      <p className="text-white/60 text-xs mb-1">Altura</p>
                      <p className="text-white text-base font-bold">
                        {selectedPlayerInfo.height} cm
                      </p>
                    </div>
                  )}
                  {selectedPlayerInfo.weight && (
                    <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                      <p className="text-white/60 text-xs mb-1">Peso</p>
                      <p className="text-white text-base font-bold">
                        {selectedPlayerInfo.weight} kg
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Puntaje (si está disponible) */}
              {selectedPlayerInfo.puntaje !== undefined && (
                <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg p-4 border border-green-400/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-300 text-xs mb-1">
                        Puntaje Promedio
                      </p>
                      <p className="text-white text-3xl font-bold">
                        {selectedPlayerInfo.puntaje.toFixed(1)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* API ID */}
              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <p className="text-white/60 text-xs mb-1">ID del Jugador</p>
                <p className="text-white/80 text-sm font-mono">
                  #{selectedPlayerInfo.apiId}
                </p>
              </div>
            </div>

            {/* Footer con botón de cerrar */}
            <div className="p-4 bg-white/5 border-t border-white/10">
              <button
                onClick={() => setSelectedPlayerInfo(null)}
                className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-[1.02]"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Blindar Jugador */}
      {showBlindarModal && selectedPlayerToBlindar && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div
            className="rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            style={{
              backdropFilter: 'blur(16px)',
              background:
                'linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.06) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
            }}
          >
            {/* Header */}
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center gap-4">
                <img
                  src={selectedPlayerToBlindar.photo}
                  alt={getPlayerDisplayName(selectedPlayerToBlindar)}
                  className="w-16 h-16 rounded-full border-2 border-yellow-400/50 shadow-lg"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src =
                      'https://via.placeholder.com/64x64/4F46E5/FFFFFF?text=?';
                  }}
                />
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-1">
                    Blindar Jugador
                  </h3>
                  <p className="text-yellow-300 text-sm">
                    {getPlayerDisplayName(selectedPlayerToBlindar)}
                  </p>
                </div>
                <button
                  onClick={() => setShowBlindarModal(false)}
                  className="text-white/60 hover:text-white transition-colors text-2xl"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5">
              <div className="bg-blue-500/20 border border-blue-400/40 rounded-lg p-4 backdrop-blur-sm">
                <p className="text-blue-200 text-sm leading-relaxed">
                  <strong>Blindar</strong> un jugador aumenta su cláusula de
                  rescisión, haciendo más difícil que otros equipos lo compren.
                </p>
              </div>

              {/* Tarjeta unificada con cálculo */}
              <div className="bg-gradient-to-br from-yellow-500/15 to-orange-500/15 rounded-xl p-5 border-2 border-yellow-400/30 backdrop-blur-sm space-y-4">
                {/* Precio actual */}
                <div className="flex justify-between items-center pb-3 border-b border-white/20">
                  <span className="text-white/90 font-medium">
                    Precio Actual
                  </span>
                  <span className="text-white text-lg font-bold">
                    $
                    {(selectedPlayerToBlindar.precio || 0).toLocaleString(
                      'es-AR'
                    )}
                  </span>
                </div>

                {/* Input de incremento */}
                <div className="space-y-2">
                  <label className="block text-white font-semibold text-sm">
                    + Incremento
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70 text-lg font-semibold">
                      $
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="100000"
                      value={montoIncremento || ''}
                      onChange={(e) =>
                        setMontoIncremento(parseInt(e.target.value) || 0)
                      }
                      placeholder="1000000"
                      className="w-full pl-8 pr-4 py-3 bg-white/15 border-2 border-white/30 rounded-lg text-white text-lg font-semibold placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all"
                    />
                  </div>
                  <p className="text-white/60 text-xs">
                    Mínimo recomendado: $1.000.000
                  </p>
                </div>

                {/* Línea separadora */}
                <div className="border-t-2 border-dashed border-yellow-400/40"></div>

                {/* Nueva cláusula calculada */}
                <div className="flex justify-between items-center pt-2">
                  <span className="text-yellow-200 font-bold text-base">
                    = Nueva Cláusula
                  </span>
                  <span className="text-white text-2xl font-bold">
                    $
                    {(
                      (selectedPlayerToBlindar.precio || 0) +
                      (montoIncremento || 0)
                    ).toLocaleString('es-AR')}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 bg-white/5 backdrop-blur-sm border-t border-white/20 flex gap-3">
              <button
                onClick={() => setShowBlindarModal(false)}
                className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition-all duration-200 border border-white/20"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmarBlindar}
                disabled={montoIncremento <= 0}
                className={`flex-1 py-3 font-semibold rounded-lg transition-all duration-200 shadow-lg ${
                  montoIncremento > 0
                    ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white transform hover:scale-[1.02] hover:shadow-yellow-500/50'
                    : 'bg-white/10 text-white/40 cursor-not-allowed border border-white/20'
                }`}
              >
                Blindar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de información de blindaje */}
      {infoBlindaje && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[9999] p-4"
          onClick={() => setInfoBlindaje(null)}
        >
          <div
            className="rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            style={{
              backdropFilter: 'blur(16px)',
              background:
                'linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.06) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
            }}
          >
            {/* Header */}
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center gap-4">
                <img
                  src={infoBlindaje.foto}
                  alt={infoBlindaje.jugador}
                  className="w-16 h-16 rounded-full border-2 border-yellow-400/50 shadow-lg"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src =
                      'https://via.placeholder.com/64x64/4F46E5/FFFFFF?text=?';
                  }}
                />
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-1">
                    Jugador Blindado
                  </h3>
                  <p className="text-yellow-300 text-sm">
                    {infoBlindaje.jugador}
                  </p>
                </div>
                <button
                  onClick={() => setInfoBlindaje(null)}
                  className="text-white/60 hover:text-white transition-colors text-2xl"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5">
              <div className="bg-blue-500/20 border border-blue-400/40 rounded-lg p-4 backdrop-blur-sm">
                <p className="text-blue-200 text-sm leading-relaxed">
                  Este jugador tiene una{' '}
                  <strong>cláusula de rescisión elevada</strong>, lo que
                  dificulta que otros equipos puedan comprarlo.
                </p>
              </div>

              {/* Tarjeta unificada con cálculo */}
              <div className="bg-gradient-to-br from-yellow-500/15 to-orange-500/15 rounded-xl p-5 border-2 border-yellow-400/30 backdrop-blur-sm space-y-4">
                {/* Precio actual */}
                <div className="flex justify-between items-center pb-3 border-b border-white/20">
                  <span className="text-white/90 font-medium">Precio Base</span>
                  <span className="text-white text-lg font-bold">
                    ${infoBlindaje.precioBase.toLocaleString('es-AR')}
                  </span>
                </div>

                {/* Incremento */}
                <div className="flex justify-between items-center">
                  <span className="text-white/90 font-medium">
                    + Incremento
                  </span>
                  <span className="text-orange-400 text-lg font-bold">
                    ${infoBlindaje.incremento.toLocaleString('es-AR')}
                  </span>
                </div>

                {/* Línea separadora */}
                <div className="border-t-2 border-dashed border-yellow-400/40"></div>

                {/* Nueva cláusula calculada */}
                <div className="flex justify-between items-center pt-2">
                  <span className="text-yellow-200 font-bold text-base">
                    = Cláusula Total
                  </span>
                  <span className="text-white text-2xl font-bold">
                    ${infoBlindaje.clausulaTotal.toLocaleString('es-AR')}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 bg-white/5 backdrop-blur-sm border-t border-white/20 flex gap-3">
              <button
                onClick={() => setInfoBlindaje(null)}
                className="w-full py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UpdateTeam;
