import { useEffect, useState, useMemo, useCallback, memo } from 'react';
import apiClient from '../../../services/apiClient';
import FormacionEquipoCompacta from '../../common/FormacionEquipoCompacta';
import { Notification } from '../../common/Notification';

// ✅ Interfaz movida fuera del componente para compartir
interface Player {
  id?: number;
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
  puntaje?: number;
}

// ✅ Funciones auxiliares fuera del componente (estables)
const getPlayerDisplayName = (player: Player): string => {
  if (player.name && player.name.trim() && player.name !== 'undefined') {
    return player.name;
  }

  const firstName =
    player.firstName &&
    player.firstName.trim() &&
    player.firstName !== 'undefined'
      ? player.firstName
      : '';
  const lastName =
    player.lastName && player.lastName.trim() && player.lastName !== 'undefined'
      ? player.lastName
      : '';

  if (firstName && lastName) {
    return `${firstName} ${lastName}`;
  }

  if (firstName) {
    return firstName;
  }

  if (lastName) {
    return lastName;
  }

  return `Jugador #${
    player.jerseyNumber || Math.floor(Math.random() * 99) + 1
  }`;
};

const getPositionDisplayName = (position: unknown): string => {
  if (!position) return 'N/A';

  if (typeof position === 'object' && position !== null) {
    const posObj = position as { id?: number; description?: string };
    const posId = posObj.id ? String(posObj.id) : '';
    const posDesc = posObj.description || '';

    const positionMap: { [key: string]: string } = {
      '1': 'Portero',
      '2': 'Defensor',
      '3': 'Mediocampista',
      '4': 'Portero',
      Goalkeeper: 'Portero',
      Defender: 'Defensor',
      Midfielder: 'Mediocampista',
      Attacker: 'Delantero',
    };

    if (posDesc && positionMap[posDesc]) {
      return positionMap[posDesc];
    }
    if (posId && positionMap[posId]) {
      return positionMap[posId];
    }

    return posDesc || posId || 'N/A';
  }

  const posStr = String(position);
  const positionMap: { [key: string]: string } = {
    '1': 'Portero',
    '2': 'Defensor',
    '3': 'Mediocampista',
    '4': 'Portero',
    Goalkeeper: 'Portero',
    Defender: 'Defensor',
    Midfielder: 'Mediocampista',
    Attacker: 'Delantero',
  };

  return positionMap[posStr] || posStr;
};

// ✅ Componente memoizado para cada jugador disponible
const AvailablePlayerItem = memo(
  ({
    player,
    canSwap,
    isInterchangeMode,
    onPlayerClick,
  }: {
    player: Player;
    canSwap: boolean;
    isInterchangeMode: boolean;
    onPlayerClick: (player: Player) => void;
  }) => {
    const playerName = getPlayerDisplayName(player);
    const positionName = getPositionDisplayName(player.position);

    return (
      <li
        className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
          isInterchangeMode && canSwap
            ? 'bg-gradient-to-r from-green-500/25 to-emerald-500/25 hover:from-green-500/40 hover:to-emerald-500/40 cursor-pointer border-2 border-green-400/60 shadow-lg transform hover:scale-[1.02] hover:shadow-green-500/20'
            : isInterchangeMode && !canSwap
            ? 'bg-white/5 opacity-40 cursor-not-allowed'
            : 'bg-white/10 hover:bg-white/15 cursor-default border border-white/10'
        }`}
        onClick={() => onPlayerClick(player)}
      >
        <div className="relative">
          <img
            src={player.photo}
            alt={playerName}
            className="w-14 h-14 rounded-full object-cover border-2 border-white/40 shadow-lg"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src =
                'https://via.placeholder.com/64x64/4F46E5/FFFFFF?text=?';
            }}
          />
          {isInterchangeMode && canSwap && (
            <div className="absolute -top-1 -right-1 bg-gradient-to-br from-green-400 to-emerald-400 rounded-full w-5 h-5 flex items-center justify-center shadow-lg">
              <svg
                className="w-3 h-3 text-white"
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
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white truncate">{playerName}</p>
          <div className="flex items-center gap-2 text-xs text-white/70 mt-1">
            <span className="truncate">{player.nationality}</span>
            <span>•</span>
            <span>{player.age} años</span>
            <span>•</span>
            <span className="truncate">{positionName}</span>
          </div>
        </div>
        {isInterchangeMode && canSwap && (
          <div className="text-green-400 font-bold text-xs whitespace-nowrap bg-green-500/20 px-2 py-1 rounded-lg">
            Intercambiar
          </div>
        )}
        {isInterchangeMode && !canSwap && (
          <div className="text-red-400 text-xs whitespace-nowrap">
            No compatible
          </div>
        )}
      </li>
    );
  },
  // ✅ Comparación personalizada SOLO con datos que realmente importan
  (prevProps, nextProps) => {
    // Solo re-renderizar si el jugador, canSwap o isInterchangeMode cambian
    return (
      prevProps.player.id === nextProps.player.id &&
      prevProps.player.apiId === nextProps.player.apiId &&
      prevProps.canSwap === nextProps.canSwap &&
      prevProps.isInterchangeMode === nextProps.isInterchangeMode
    );
  }
);

AvailablePlayerItem.displayName = 'AvailablePlayerItem';

// ✅ Interfaz Club también fuera
interface Club {
  id: number;
  nombre: string;
}

// ✅ Interfaz BackendPlayerResponse también fuera
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

const UpdateTeam = () => {
  const [teamPlayers, setTeamPlayers] = useState<Player[]>([]);
  const [allPlayersRaw, setAllPlayersRaw] = useState<Player[]>([]); // TODOS los jugadores de la BD (sin filtrar)
  const [clubs, setClubs] = useState<Club[]>([]);

  // Estados para los filtros
  const [searchName, setSearchName] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('');
  const [selectedClub, setSelectedClub] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Estados para el sistema de intercambio
  const [selectedPlayerForSwap, setSelectedPlayerForSwap] =
    useState<Player | null>(null);

  // Estado para notificaciones
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'warning' | 'info';
    text: string;
  } | null>(null);

  // ✅ Cargar clubes desde la BD
  // ✅ Cargar clubes desde la BD
  useEffect(() => {
    const fetchClubs = async () => {
      try {
        const response = await apiClient.get('/clubs');
        console.log('✅ CLUBES CARGADOS:', response.data);
        // La respuesta puede venir en response.data.data o response.data directamente
        if (response.data && response.data.data) {
          setClubs(response.data.data);
        } else if (response.data && Array.isArray(response.data)) {
          setClubs(response.data);
        }
      } catch (error) {
        console.error('❌ Error al obtener clubes:', error);
      }
    };
    fetchClubs();
  }, []);

  // ✅ Cargar TODOS los jugadores de la BD (UNA SOLA VEZ)
  useEffect(() => {
    const fetchAllPlayers = async () => {
      try {
        setIsLoading(true);
        console.log('🔍 CARGANDO TODOS LOS JUGADORES DE LA BD');

        const response = await apiClient.get('/players?limit=1000'); // Cargar muchos jugadores
        console.log('📦 RESPUESTA COMPLETA:', response.data);

        let jugadores = [];
        if (response.data && response.data.data) {
          jugadores = response.data.data;
        } else if (Array.isArray(response.data)) {
          jugadores = response.data;
        }

        if (jugadores.length > 0) {
          const mappedAllPlayers = jugadores.map(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (item: any, index: number) => {
              const jugador = item.jugador || item;
              const firstName = jugador.firstname || jugador.firstName || '';
              const lastName = jugador.lastname || jugador.lastName || '';

              let fullName = '';
              if (firstName && lastName) {
                fullName = `${firstName} ${lastName}`.trim();
              } else {
                fullName = jugador.name || firstName || lastName || '';
              }

              const mappedPlayer = {
                id: jugador.id, // ✅ ID del jugador en la BD (para intercambios)
                apiId: jugador.apiId || jugador.id || index,
                name: fullName,
                firstName,
                lastName,
                age: jugador.age || 0,
                nationality: jugador.nationality || '',
                height: jugador.height ? parseInt(jugador.height) : undefined,
                weight: jugador.weight ? parseInt(jugador.weight) : undefined,
                photo:
                  jugador.photo ||
                  'https://via.placeholder.com/64x64/4F46E5/FFFFFF?text=⚽',
                jerseyNumber: jugador.jerseyNumber || 0,
                position: jugador.position || '',
              };

              // Debug: Log del primer jugador para verificar estructura
              if (index === 0) {
                console.log('📋 Ejemplo de jugador mapeado:', mappedPlayer);
              }

              return mappedPlayer;
            }
          );

          console.log(
            '✅ TODOS LOS JUGADORES CARGADOS:',
            mappedAllPlayers.length
          );
          setAllPlayersRaw(mappedAllPlayers);
        }
      } catch (error) {
        console.error('❌ Error al cargar jugadores:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllPlayers();
  }, []);

  // ✅ Usar la función auxiliar estable
  const getPositionName = useCallback(
    (position: unknown): string => getPositionDisplayName(position),
    []
  );

  // ✅ Primero filtrar sin considerar el jugador seleccionado
  const baseFilteredPlayers = useMemo(() => {
    let filtered = [...allPlayersRaw];

    // Filtro por nombre (ignora tildes)
    if (searchName.trim()) {
      const normalizedSearch = searchName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

      filtered = filtered.filter((player: Player) => {
        const playerName = (player.name || '')
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '');
        return playerName.includes(normalizedSearch);
      });
    }

    // Filtro por posición (comparar con la descripción del backend)
    if (selectedPosition) {
      filtered = filtered.filter((player: Player) => {
        if (typeof player.position === 'object' && player.position !== null) {
          const posObj = player.position as {
            id?: number;
            description?: string;
          };
          const playerPosDesc = posObj.description?.toLowerCase() || '';
          const playerPosId = posObj.id;

          // Crear un mapeo para comparar tanto en inglés como en español
          const positionMapping: { [key: string]: string[] } = {
            goalkeeper: ['goalkeeper', 'portero'],
            portero: ['goalkeeper', 'portero'],
            defender: ['defender', 'defensor'],
            defensor: ['defender', 'defensor'],
            midfielder: ['midfielder', 'mediocampista'],
            mediocampista: ['midfielder', 'mediocampista'],
            attacker: ['attacker', 'delantero'],
            delantero: ['attacker', 'delantero'],
          };

          const selectedLower = selectedPosition.toLowerCase();
          const validValues = positionMapping[selectedLower] || [selectedLower];

          // Comparar tanto por descripción como por ID
          return (
            validValues.includes(playerPosDesc) ||
            String(playerPosId) === selectedPosition
          );
        }
        return (
          String(player.position || '').toLowerCase() ===
          selectedPosition.toLowerCase()
        );
      });
    }

    // Filtro por país
    if (selectedCountry) {
      filtered = filtered.filter(
        (player: Player) => player.nationality === selectedCountry
      );
    }

    return filtered;
  }, [searchName, selectedPosition, selectedCountry, allPlayersRaw]);

  // ✅ Luego aplicar filtro por posición del jugador seleccionado (SOLO para visualización)
  const allPlayers = useMemo(() => {
    // Si hay un jugador seleccionado, filtrar automáticamente por su posición
    if (selectedPlayerForSwap) {
      const selectedPos = getPositionName(selectedPlayerForSwap.position);
      const filtered = baseFilteredPlayers.filter((player: Player) => {
        return getPositionName(player.position) === selectedPos;
      });
      console.log(
        `🔎 FILTRADOS POR POSICIÓN: ${filtered.length} de ${baseFilteredPlayers.length}`
      );
      return filtered;
    }

    console.log(
      `🔎 FILTRADOS: ${baseFilteredPlayers.length} de ${allPlayersRaw.length}`
    );
    return baseFilteredPlayers;
  }, [
    baseFilteredPlayers,
    selectedPlayerForSwap,
    getPositionName,
    allPlayersRaw.length,
  ]);

  // ✅ CARGAR MI EQUIPO (UNA SOLA VEZ AL INICIO)
  useEffect(() => {
    const fetchTeamPlayers = async () => {
      try {
        console.log('🔄 CARGANDO MI EQUIPO (esto solo debería verse UNA VEZ)');
        const response = await apiClient.get('/equipos/mi-equipo');
        console.log('⚽ MI EQUIPO:', response.data);

        if (response.data && response.data.jugadores) {
          const equipoId = response.data.id;

          const mappedPlayers = response.data.jugadores.map(
            (item: BackendPlayerResponse, index: number) => {
              const jugador = item.jugador;

              // 🔍 Debug: Ver la estructura completa del primer jugador
              if (index === 0) {
                console.log('🔍 DEBUG - Estructura completa de item:', item);
                console.log(
                  '🔍 DEBUG - Estructura completa de jugador:',
                  jugador
                );
                console.log('🔍 DEBUG - jugador.id:', jugador.id);
                console.log('🔍 DEBUG - item.id:', item.id);
              }

              // Extraer firstName y lastName
              const firstName = jugador.firstname || '';
              const lastName = jugador.lastname || '';

              // ✅ SIEMPRE construir el nombre completo desde firstname + lastname
              let fullName = '';
              if (firstName && lastName) {
                fullName = `${firstName} ${lastName}`.trim();
              } else if (firstName) {
                fullName = firstName;
              } else if (lastName) {
                fullName = lastName;
              } else {
                fullName = jugador.name || '';
              }

              return {
                id: jugador.id, // ✅ ID del jugador en la BD
                apiId: jugador.apiId || index,
                name: fullName,
                firstName: firstName,
                lastName: lastName,
                age: jugador.age || 0,
                nationality: jugador.nationality || '',
                height: jugador.height ? parseInt(jugador.height) : undefined,
                weight: jugador.weight ? parseInt(jugador.weight) : undefined,
                photo:
                  jugador.photo ||
                  'https://via.placeholder.com/64x64/4F46E5/FFFFFF?text=⚽',
                jerseyNumber: jugador.jerseyNumber || 0,
                position: jugador.position || '',
                esTitular: item.es_titular, // ✅ Flag de titular/suplente
              };
            }
          );

          console.log(
            '✅ MI EQUIPO CARGADO:',
            mappedPlayers.length,
            'jugadores'
          );

          // Debug: Mostrar todos los jugadores con sus IDs
          console.log('📋 LISTA COMPLETA DE JUGADORES EN MI EQUIPO:');
          mappedPlayers.forEach((p: Player) => {
            console.log(
              `  - ID: ${p.id} | ${p.name} | ${
                p.esTitular ? 'TITULAR' : 'SUPLENTE'
              } | Posición:`,
              p.position
            );
          });

          // ✅ Intentar obtener puntajes de la última jornada
          try {
            const historialResponse = await apiClient.get(
              `/equipos/${equipoId}/historial`
            );
            console.log('📊 [UpdateTeam] Historial:', historialResponse.data);

            // Obtener la última jornada con puntos
            const historialData = Array.isArray(historialResponse.data)
              ? historialResponse.data
              : historialResponse.data?.data || [];

            if (historialData.length > 0) {
              // Ordenar por jornadaId descendente y tomar la primera
              const ordenado = historialData.sort(
                (a: { jornada?: { id: number } }, b: { jornada?: { id: number } }) =>
                  (b.jornada?.id || 0) - (a.jornada?.id || 0)
              );
              const ultimaJornada = ordenado[0];
              const jornadaId = ultimaJornada?.jornada?.id;

              if (jornadaId) {
                console.log('📅 [UpdateTeam] Última jornada encontrada:', jornadaId);

                // Obtener detalles de esa jornada para traer los puntajes
                const detalleResponse = await apiClient.get(
                  `/equipos/${equipoId}/jornadas/${jornadaId}`
                );
                const detalle = detalleResponse.data?.data || detalleResponse.data;

                if (detalle?.jugadores) {
                  console.log('🎯 [UpdateTeam] Jugadores con puntajes:', detalle.jugadores);
                  console.log('🎯 [UpdateTeam] Jugadores actuales:', mappedPlayers.map((p: Player) => ({ name: p.name, id: p.id, apiId: p.apiId })));

                  // Mapear puntajes a los jugadores actuales
                  const jugadoresConPuntajes = mappedPlayers.map((player: Player) => {
                    // Intentar buscar por diferentes campos
                    const jugadorConPuntaje = detalle.jugadores.find(
                      (j: { nombre?: string; name?: string; nombreCompleto?: string; id?: number; apiId?: number }) => {
                        // Comparar por nombre
                        const nombreMatch = j.nombre === player.name || j.name === player.name || j.nombreCompleto === player.name;
                        // O comparar por ID si está disponible
                        const idMatch = (j.id && j.id === player.id) || (j.apiId && j.apiId === player.apiId);
                        
                        const match = nombreMatch || idMatch;
                        if (match) {
                          console.log(`✅ [UpdateTeam] Match encontrado para ${player.name}:`, j);
                        }
                        return match;
                      }
                    );
                    
                    if (!jugadorConPuntaje) {
                      console.log(`⚠️ [UpdateTeam] No se encontró puntaje para ${player.name}`);
                    }
                    
                    return {
                      ...player,
                      puntaje: jugadorConPuntaje?.puntaje || 0,
                    };
                  });

                  console.log('✅ [UpdateTeam] Jugadores con puntajes mapeados:', jugadoresConPuntajes);
                  setTeamPlayers(jugadoresConPuntajes);
                  return; // Salir temprano si se logró mapear puntajes
                }
              }
            }
          } catch (historialError) {
            console.warn('⚠️ [UpdateTeam] No se pudieron obtener los puntajes:', historialError);
            // Continuar sin puntajes
          }

          setTeamPlayers(mappedPlayers);
        }
      } catch (error) {
        console.error('❌ Error al obtener mi equipo:', error);
      }
    };
    fetchTeamPlayers();
  }, []); // ✅ Solo se ejecuta UNA VEZ al montar el componente

  // ✅ Extraer países únicos de todos los jugadores (useMemo para optimización)
  const countries = useMemo(() => {
    if (allPlayersRaw.length > 0) {
      return Array.from(
        new Set(allPlayersRaw.map((p: Player) => p.nationality).filter(Boolean))
      ).sort() as string[];
    }
    return [];
  }, [allPlayersRaw]);

  // ✅ Usar la función auxiliar estable
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

  // ✅ Función para intercambiar titular con suplente (memoizada)
  const swapLineup = useCallback(
    async (titularId: number, suplenteId: number) => {
      try {
        console.log('🔄 Intercambiando titular-suplente:', {
          titularId,
          suplenteId,
        });

        const payload = {
          jugadorTitularId: titularId,
          jugadorSuplenteId: suplenteId,
        };
        console.log('📦 Payload enviado:', payload);
        console.log('📡 Enviando a:', '/equipos/mi-equipo/alineacion');

        const response = await apiClient.patch(
          '/equipos/mi-equipo/alineacion',
          payload
        );
        console.log('✅ Respuesta del servidor:', response.data);

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

        console.log('✅ Intercambio titular-suplente exitoso');
        setNotification({
          type: 'success',
          text: 'Intercambio realizado exitosamente',
        });
      } catch (error: unknown) {
        console.error('❌ Error al intercambiar titular-suplente:', error);
        const axiosError = error as {
          response?: { data?: { message?: string }; status?: number };
          message?: string;
        };
        console.error('❌ Detalles del error:', {
          message: axiosError.message,
          response: axiosError.response?.data,
          status: axiosError.response?.status,
        });

        const errorMsg =
          axiosError.response?.data?.message ||
          axiosError.message ||
          'Error desconocido';
        alert(`Error al realizar el intercambio:\n${errorMsg}`);
      }
    },
    []
  );

  // ✅ Función para intercambiar jugador del equipo con uno externo (memoizada)
  const swapTeamPlayer = useCallback(
    async (jugadorSaleId: number, jugadorEntraId: number) => {
      try {
        console.log('🔄 Intercambiando jugador del equipo:', {
          jugadorSaleId,
          jugadorEntraId,
        });

        await apiClient.patch('/equipos/mi-equipo/intercambio', {
          jugadorSaleId: jugadorSaleId,
          jugadorEntraId: jugadorEntraId, // ✅ Ahora envía el ID correcto del jugador en la BD
        });

        // Recargar el equipo completo desde el servidor
        const response = await apiClient.get('/equipos/mi-equipo');
        if (response.data && response.data.jugadores) {
          const mappedPlayers = response.data.jugadores.map(
            (item: BackendPlayerResponse, index: number) => {
              const jugador = item.jugador;
              const firstName = jugador.firstname || '';
              const lastName = jugador.lastname || '';

              let fullName = '';
              if (firstName && lastName) {
                fullName = `${firstName} ${lastName}`.trim();
              } else if (firstName) {
                fullName = firstName;
              } else if (lastName) {
                fullName = lastName;
              } else {
                fullName = jugador.name || '';
              }

              return {
                id: jugador.id, // ✅ ID del jugador en la BD
                apiId: jugador.apiId || index,
                name: fullName,
                firstName: firstName,
                lastName: lastName,
                age: jugador.age || 0,
                nationality: jugador.nationality || '',
                height: jugador.height ? parseInt(jugador.height) : undefined,
                weight: jugador.weight ? parseInt(jugador.weight) : undefined,
                photo:
                  jugador.photo ||
                  'https://via.placeholder.com/64x64/4F46E5/FFFFFF?text=⚽',
                jerseyNumber: jugador.jerseyNumber || 0,
                position: jugador.position || '',
                esTitular: item.es_titular,
              };
            }
          );
          setTeamPlayers(mappedPlayers);
        }

        console.log('✅ Intercambio de equipo exitoso');
        setNotification({
          type: 'success',
          text: 'Jugador intercambiado exitosamente',
        });
      } catch (error: unknown) {
        console.error('❌ Error al intercambiar jugador del equipo:', error);
        const axiosError = error as {
          response?: { data?: { message?: string }; status?: number };
          message?: string;
        };
        console.error('❌ Detalles del error:', {
          message: axiosError.message,
          response: axiosError.response?.data,
          status: axiosError.response?.status,
        });

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
    []
  ); // ✅ Array vacío porque no depende de ningún estado

  // ✅ Manejador para seleccionar jugador para intercambio (optimizado sin dependencias)
  const handlePlayerSelect = useCallback(
    (player: Player) => {
      setSelectedPlayerForSwap((prev) => {
        // Si es el mismo jugador, deseleccionar
        if (prev && prev.id === player.id) {
          return null;
        }
        // Seleccionar nuevo jugador
        return player;
      });
    },
    [] // ✅ Sin dependencias - usa la forma funcional de setState
  );

  // ✅ Manejador para realizar el intercambio (detecta automáticamente el tipo)
  const handleSwap = useCallback(
    async (targetPlayer: Player, currentSelectedPlayer: Player | null) => {
      if (!currentSelectedPlayer) return;

      console.log('🎯 Jugador seleccionado:', {
        id: currentSelectedPlayer.id,
        name: currentSelectedPlayer.name,
        esTitular: currentSelectedPlayer.esTitular,
      });
      console.log('🎯 Jugador objetivo:', {
        id: targetPlayer.id,
        name: targetPlayer.name,
        esTitular: targetPlayer.esTitular,
      });

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

        console.log('✅ Intercambio titular↔suplente:', {
          titularId,
          suplenteId,
        });
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

        console.log('✅ Intercambio con jugador externo');
        await swapTeamPlayer(currentSelectedPlayer.id, targetPlayer.id);
      }

      // Limpiar selección
      setSelectedPlayerForSwap(null);
    },
    [teamPlayers, swapLineup, swapTeamPlayer, getPositionName]
  );

  // ✅ Manejador memoizado para click en jugadores disponibles
  const handleAvailablePlayerClick = useCallback(
    (player: Player) => {
      if (selectedPlayerForSwap) {
        const canSwap =
          getPositionName(selectedPlayerForSwap.position) ===
          getPositionName(player.position);

        if (canSwap) {
          // Realizar intercambio con jugador externo
          handleSwap(player, selectedPlayerForSwap);
        } else {
          setNotification({
            type: 'warning',
            text: 'Este jugador no es de la misma posición',
          });
        }
      }
    },
    [selectedPlayerForSwap, handleSwap, getPositionName]
  );

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

      {/* Estilos CSS para animaciones */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes fadeIn {
              from {
                opacity: 0;
                transform: translateY(-10px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }

            .team-summary-card {
              backdrop-filter: blur(16px);
              background: linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.06) 100%);
              border: 1px solid rgba(255, 255, 255, 0.25);
              box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
            }

            .custom-scrollbar::-webkit-scrollbar {
              width: 8px;
            }

            .custom-scrollbar::-webkit-scrollbar-track {
              background: rgba(255, 255, 255, 0.05);
              border-radius: 10px;
            }

            .custom-scrollbar::-webkit-scrollbar-thumb {
              background: linear-gradient(180deg, rgba(59, 130, 246, 0.6) 0%, rgba(147, 51, 234, 0.6) 100%);
              border-radius: 10px;
            }

            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
              background: linear-gradient(180deg, rgba(59, 130, 246, 0.8) 0%, rgba(147, 51, 234, 0.8) 100%);
            }
          `,
        }}
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
        {/* Rectángulo Izquierdo - Estadísticas */}
        <div className="hidden lg:flex team-summary-card w-full max-w-[320px] p-3 rounded-xl shadow-2xl h-[calc(100vh-6rem)] flex-col">
          <div className="border-b border-white/20 pb-2 mb-2 flex-shrink-0">
            <h2 className="text-base font-bold text-center text-white">
              Estadísticas del Equipo
            </h2>
          </div>
          <div className="space-y-2 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent pr-1">
            {/* Calcular estadísticas */}
            {(() => {
              const jugadoresConPuntos = teamPlayers.filter(p => (p.puntaje || 0) > 0);
              
              if (jugadoresConPuntos.length === 0) {
                return (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-white/60 text-center text-xs">
                      Las estadísticas aparecerán cuando haya puntos de jornadas
                    </p>
                  </div>
                );
              }

              const puntajeTotal = jugadoresConPuntos.reduce((sum, p) => sum + (p.puntaje || 0), 0);
              const promedio = puntajeTotal / jugadoresConPuntos.length;
              const maxPuntaje = Math.max(...jugadoresConPuntos.map(p => p.puntaje || 0));
              const minPuntaje = Math.min(...jugadoresConPuntos.map(p => p.puntaje || 0));

              // Mejores jugadores
              const mejoresJugadores = [...jugadoresConPuntos]
                .sort((a, b) => (b.puntaje || 0) - (a.puntaje || 0))
                .slice(0, 3);

              return (
                <>
                  {/* Resumen de Puntos */}
                  <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg p-4 border border-purple-400/30 flex-shrink-0">
                    <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                      <span>📊</span> Resumen de Puntos
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white/10 rounded-lg p-3">
                        <p className="text-white/70 text-xs mb-1">Puntaje Total</p>
                        <p className="text-2xl font-bold text-white">{puntajeTotal.toFixed(1)}</p>
                      </div>
                      <div className="bg-white/10 rounded-lg p-3">
                        <p className="text-white/70 text-xs mb-1">Promedio</p>
                        <p className="text-2xl font-bold text-white">{promedio.toFixed(1)}</p>
                      </div>
                      <div className="bg-white/10 rounded-lg p-3">
                        <p className="text-white/70 text-xs mb-1">Máximo</p>
                        <p className="text-2xl font-bold text-green-400">{maxPuntaje.toFixed(1)}</p>
                      </div>
                      <div className="bg-white/10 rounded-lg p-3">
                        <p className="text-white/70 text-xs mb-1">Mínimo</p>
                        <p className="text-2xl font-bold text-red-400">{minPuntaje.toFixed(1)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Top 3 Jugadores */}
                  <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-lg p-4 border border-yellow-400/30 flex-shrink-0">
                    <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                      <span>🏆</span> Top 3 Mejores Jugadores
                    </h3>
                    <div className="space-y-2.5">
                      {mejoresJugadores.map((player, index) => (
                        <div key={player.id} className="flex items-center gap-3 bg-white/10 rounded-lg p-2.5">
                          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-yellow-400 to-orange-400 text-white font-bold text-sm flex-shrink-0">
                            {index + 1}
                          </div>
                          <img
                            src={player.photo}
                            alt={player.name}
                            className="w-10 h-10 rounded-full object-cover border-2 border-white/40 flex-shrink-0"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = 'https://via.placeholder.com/64x64/4F46E5/FFFFFF?text=?';
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
                            <p className="text-lg font-bold text-white">{(player.puntaje || 0).toFixed(1)}</p>
                            <p className="text-white/60 text-xs">pts</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Info adicional */}
                  <div className="bg-white/10 rounded-lg p-3 text-center flex-shrink-0">
                    <p className="text-white/70 text-xs">
                      Jugadores con puntos: <span className="font-bold text-white">{jugadoresConPuntos.length}</span> / <span className="font-bold text-white">{teamPlayers.length}</span>
                    </p>
                  </div>
                </>
              );
            })()}
          </div>
        </div>

        {/* Tarjeta Central - Mi Equipo */}
        <div className="team-summary-card w-full max-w-xs sm:max-w-sm lg:max-w-md p-3 rounded-xl shadow-2xl h-[calc(100vh-6rem)] flex flex-col">
          <div className="border-b border-white/20 pb-2 mb-3 flex-shrink-0">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-center text-white">
              Mi Equipo
            </h2>
          </div>

          {/* Sección de controles de intercambio */}
          {teamPlayers.length > 0 ? (
            <div className="space-y-2 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent pr-1">
              {/* Equipo titular */}
              <div className="flex-shrink-0">
                <FormacionEquipoCompacta
                  players={titulares}
                  showSuplentes={false}
                  mostrarPuntajes={titulares.some((p) => (p.puntaje || 0) > 0)}
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
              
              {/* Indicador de puntajes */}
              {titulares.some((p) => (p.puntaje || 0) > 0) && (
                <div className="text-center flex-shrink-0">
                  <p className="text-white/80 text-[10px] bg-white/10 rounded py-1 px-2 inline-block">
                    📊 Puntajes de la última jornada
                  </p>
                </div>
              )}

              {/* Suplentes */}
              {suplentes.length > 0 && (
                <div className="pt-2 border-t border-white/20 flex-shrink-0">
                  <h3 className="text-xs font-bold text-white mb-2 text-center tracking-wide">
                    SUPLENTES
                  </h3>
                  <div className="flex flex-wrap justify-center gap-1.5">
                    {suplentes.map((player, index) => {
                      // Verificar si este jugador puede intercambiarse con el seleccionado
                      const canSwap = selectedPlayerForSwap
                        ? getPositionName(selectedPlayerForSwap.position) ===
                          getPositionName(player.position)
                        : false;

                      return (
                        <div
                          key={`suplente-${player.apiId}`}
                          className="flex flex-col items-center relative"
                          style={{
                            animation: 'fadeIn 0.4s ease-out',
                            animationDelay: `${index * 0.05}s`,
                            animationFillMode: 'backwards',
                          }}
                        >
                          <div
                            className={`flex flex-col items-center cursor-pointer transition-all ${
                              selectedPlayerForSwap?.id === player.id
                                ? 'ring-4 ring-yellow-400 rounded-lg scale-105'
                                : canSwap
                                ? 'ring-2 ring-green-400 rounded-lg hover:ring-4 hover:scale-105'
                                : 'hover:scale-105'
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
                            <div className="relative mb-1.5">
                              <img
                                src={player.photo}
                                alt={getPlayerName(player)}
                                loading="lazy"
                                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-white shadow-lg bg-white"
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

                            {/* Nombre del jugador */}
                            <div className="text-center bg-white/95 rounded-md px-2 py-1 shadow-md min-w-[55px] sm:min-w-[60px]">
                              <p className="text-[9px] sm:text-[10px] font-bold text-gray-800 leading-tight whitespace-nowrap">
                                {getShortName(player)}
                              </p>
                              <p className="text-[8px] text-gray-600 mt-0.5">
                                {getPositionName(player.position)}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8"></div>
          )}
        </div>

        {/* Rectángulo Derecho - FILTROS FUNCIONALES */}
        <div className="hidden lg:flex team-summary-card w-full max-w-[320px] p-3 rounded-xl shadow-2xl h-[calc(100vh-6rem)] flex-col">
          <div className="border-b border-white/20 pb-2 mb-2 flex-shrink-0">
            <h2 className="text-base font-bold text-center text-white">
              Jugadores Disponibles
            </h2>
          </div>

          {/* Buscador por nombre */}
          <form onSubmit={(e) => e.preventDefault()} className="mb-2 flex-shrink-0">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar por nombre..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className="w-full p-2 pl-8 rounded-lg border border-white/30 text-white text-xs bg-white/10 placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200"
              />
              <svg
                className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-white/60"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </form>

          {/* Filtros */}
          <div className="mb-2 flex-shrink-0">
            <div className="space-y-1.5">
              {/* Filtro por Posición */}
              <select
                value={selectedPosition}
                onChange={(e) => setSelectedPosition(e.target.value)}
                className="w-full p-2 rounded-lg border border-white/30 bg-white/10 text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-200 hover:bg-white/15 cursor-pointer"
              >
                <option value="" className="bg-gray-800 text-white">
                  Todas las posiciones
                </option>
                <option value="portero" className="bg-gray-800 text-white">
                  Portero
                </option>
                <option value="defensor" className="bg-gray-800 text-white">
                  Defensor
                </option>
                <option
                  value="mediocampista"
                  className="bg-gray-800 text-white"
                >
                  Mediocampista
                </option>
                <option value="delantero" className="bg-gray-800 text-white">
                  Delantero
                </option>
              </select>

              {/* Filtro por País */}
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="w-full p-2 rounded-lg border border-white/30 bg-white/10 text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-200 hover:bg-white/15 cursor-pointer"
              >
                <option value="" className="bg-gray-800 text-white">
                  Todos los países
                </option>
                {countries.map((country) => (
                  <option
                    key={country}
                    value={country}
                    className="bg-gray-800 text-white"
                  >
                    {country}
                  </option>
                ))}
              </select>

              {/* Filtro por Club */}
              <select
                value={selectedClub}
                onChange={(e) => setSelectedClub(e.target.value)}
                className="w-full p-2 rounded-lg border border-white/30 bg-white/10 text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-200 hover:bg-white/15 cursor-pointer"
              >
                <option value="" className="bg-gray-800 text-white">
                  Todos los clubes
                </option>
                {clubs.map((club) => (
                  <option
                    key={club.id}
                    value={club.nombre}
                    className="bg-gray-800 text-white"
                  >
                    {club.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Botón para limpiar filtros */}
            {(searchName ||
              selectedPosition ||
              selectedClub ||
              selectedCountry) && (
              <button
                onClick={() => {
                  setSearchName('');
                  setSelectedPosition('');
                  setSelectedClub('');
                  setSelectedCountry('');
                }}
                className="mt-2 w-full p-1.5 rounded-lg bg-gradient-to-r from-red-500/20 to-pink-500/20 hover:from-red-500/30 hover:to-pink-500/30 text-white text-xs font-semibold transition-all duration-200 border border-red-400/30 hover:border-red-400/50"
              >
                Limpiar filtros
              </button>
            )}
          </div>

          {/* Lista de jugadores - ALTURA FIJA */}
          <div className="flex-1 overflow-y-auto border-t border-white/20 pt-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full gap-2">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-400"></div>
                <p className="text-white/60 text-xs">Cargando jugadores...</p>
              </div>
            ) : allPlayers.length > 0 ? (
              <>
                <div className="bg-white/5 rounded-lg px-3 py-2 mb-3">
                  <p className="text-white/80 text-sm text-center font-semibold">
                    {allPlayers.length} jugador
                    {allPlayers.length !== 1 ? 'es' : ''} encontrado
                    {allPlayers.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <ul className="space-y-2">
                  {allPlayers.map((player) => {
                    // Verificar si este jugador puede intercambiarse con el seleccionado
                    const canSwap = selectedPlayerForSwap
                      ? getPositionName(selectedPlayerForSwap.position) ===
                        getPositionName(player.position)
                      : false;

                    const isInterchangeMode = !!selectedPlayerForSwap;

                    return (
                      <AvailablePlayerItem
                        key={player.apiId}
                        player={player}
                        canSwap={canSwap}
                        isInterchangeMode={isInterchangeMode}
                        onPlayerClick={handleAvailablePlayerClick}
                      />
                    );
                  })}
                </ul>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <div className="text-center">
                  <p className="text-white/80 text-lg font-semibold mb-2">
                    Sin resultados
                  </p>
                  <p className="text-white/60 text-sm">
                    No se encontraron jugadores con estos filtros
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSearchName('');
                    setSelectedPosition('');
                    setSelectedClub('');
                    setSelectedCountry('');
                  }}
                  className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 text-white text-sm font-semibold transition-all duration-200 border border-blue-400/30 hover:border-blue-400/50"
                >
                  Resetear filtros
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdateTeam;
