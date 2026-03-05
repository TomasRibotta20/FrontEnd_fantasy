/**
 * Utilidades para mapeo de jugadores
 * Funciones helper compartidas para transformar datos del backend al formato frontend
 */

import type {
  Player,
  BackendPlayerResponse,
  BackendJugador,
  PlayerPosition,
  Position,
} from '../types/player.types';

/**
 * Obtiene el nombre de la posición en español
 * Maneja múltiples formatos de entrada (objeto, string, número)
 */
export const getPositionDisplayName = (position: PlayerPosition): string => {
  if (!position) return 'N/A';

  // Si es un objeto con descripción
  if (typeof position === 'object' && position !== null) {
    const posObj = position as {
      id?: number;
      description?: string;
      descripcion?: string;
    };
    const posId = posObj.id ? String(posObj.id) : '';
    // Buscar descripción en español primero, luego en inglés
    const posDesc = posObj.descripcion || posObj.description || '';

    // Mapeo por descripción (español e inglés)
    const descLower = posDesc.toLowerCase();
    if (descLower.includes('portero') || descLower.includes('goalkeeper'))
      return 'Portero';
    if (descLower.includes('defens') || descLower.includes('defender'))
      return 'Defensor';
    if (descLower.includes('mediocampista') || descLower.includes('midfielder'))
      return 'Mediocampista';
    if (descLower.includes('delantero') || descLower.includes('attack'))
      return 'Delantero';

    // Mapeo por ID (1=Portero, 2=Defensor, 3=Mediocampista, 4=Delantero)
    const positionMapById: { [key: string]: string } = {
      '1': 'Portero',
      '2': 'Defensor',
      '3': 'Mediocampista',
      '4': 'Delantero',
    };

    if (posId && positionMapById[posId]) {
      return positionMapById[posId];
    }

    return posDesc || posId || 'N/A';
  }

  const posStr = String(position).toLowerCase();

  // Mapeo de strings directos
  if (
    posStr === '1' ||
    posStr.includes('portero') ||
    posStr.includes('goalkeeper')
  )
    return 'Portero';
  if (
    posStr === '2' ||
    posStr.includes('defens') ||
    posStr.includes('defender')
  )
    return 'Defensor';
  if (
    posStr === '3' ||
    posStr.includes('mediocampista') ||
    posStr.includes('midfielder')
  )
    return 'Mediocampista';
  if (
    posStr === '4' ||
    posStr.includes('delantero') ||
    posStr.includes('attack')
  )
    return 'Delantero';

  return position ? String(position) : 'N/A';
};

/**
 * Obtiene el tipo de posición simplificado para formaciones
 */
export const getPositionType = (position: PlayerPosition): string => {
  const displayName = getPositionDisplayName(position);
  switch (displayName) {
    case 'Portero':
      return 'goalkeeper';
    case 'Defensor':
      return 'defender';
    case 'Mediocampista':
      return 'midfielder';
    case 'Delantero':
      return 'forward';
    default:
      return 'unknown';
  }
};

/**
 * Obtiene el ID numérico de la posición
 */
export const getPositionId = (position: PlayerPosition): number => {
  if (typeof position === 'number') return position;
  if (typeof position === 'object' && position !== null) {
    const posObj = position as Position;
    if (posObj.id) return posObj.id;
  }
  const posStr = String(position);
  const num = parseInt(posStr, 10);
  if (!isNaN(num)) return num;

  // Mapeo inverso desde nombre
  const displayName = getPositionDisplayName(position);
  switch (displayName) {
    case 'Portero':
      return 1;
    case 'Defensor':
      return 2;
    case 'Mediocampista':
      return 3;
    case 'Delantero':
      return 4;
    default:
      return 0;
  }
};

/**
 * Mapea un jugador del formato backend al formato frontend
 */
export const mapBackendPlayerToFrontend = (
  item: BackendPlayerResponse,
  index?: number
): Player => {
  const jugador = item.jugador;

  // El backend envía campos en español: primer_nombre, apellido, nombre
  const firstName = jugador.primer_nombre || jugador.firstname || '';
  const lastName = jugador.apellido || jugador.lastname || '';
  const fullName =
    jugador.nombre ||
    jugador.name ||
    `${firstName} ${lastName}`.trim() ||
    'Jugador Desconocido';

  return {
    id: jugador.id,
    equipoJugadorId: item.id, // ID de la relación equipo-jugador
    apiId: jugador.id_api || jugador.apiId || jugador.id || index || 0,
    name: fullName,
    firstName,
    lastName,
    age: jugador.edad || jugador.age || 0,
    nationality: jugador.nacionalidad || jugador.nationality || '',
    height: jugador.altura ? parseInt(String(jugador.altura)) : undefined,
    weight: jugador.peso ? parseInt(String(jugador.peso)) : undefined,
    photo: jugador.foto || jugador.photo || '/placeholder-player.png',
    jerseyNumber: jugador.numero_camiseta ?? jugador.jerseyNumber ?? 0,
    position: jugador.posicion || jugador.position || 'N/A',
    esTitular: item.es_titular,
    precio: jugador.precio_actual,
    valor_clausula: item.valor_clausula,
    valor_clausula_efectiva: item.valor_clausula_efectiva,
    dias_proteccion_restantes: item.dias_proteccion_restantes,
    esta_protegido: item.esta_protegido,
    club: jugador.club,
  };
};

/**
 * Mapea un jugador crudo del backend (sin wrapper de equipo)
 */
export const mapRawJugadorToPlayer = (
  jugador: BackendJugador,
  index?: number
): Player => {
  const firstName = jugador.primer_nombre || jugador.firstname || '';
  const lastName = jugador.apellido || jugador.lastname || '';
  const fullName =
    jugador.nombre ||
    jugador.name ||
    `${firstName} ${lastName}`.trim() ||
    'Jugador Desconocido';

  return {
    id: jugador.id,
    apiId: jugador.id_api || jugador.apiId || jugador.id || index || 0,
    name: fullName,
    firstName,
    lastName,
    age: jugador.edad || jugador.age || 0,
    nationality: jugador.nacionalidad || jugador.nationality || '',
    height: jugador.altura ? parseInt(String(jugador.altura)) : undefined,
    weight: jugador.peso ? parseInt(String(jugador.peso)) : undefined,
    photo: jugador.foto || jugador.photo || '/placeholder-player.png',
    jerseyNumber: jugador.numero_camiseta ?? jugador.jerseyNumber ?? 0,
    position: jugador.posicion || jugador.position || 'N/A',
    precio: jugador.precio_actual,
    club: jugador.club,
  };
};

/**
 * Filtra jugadores por posición
 */
export const filterPlayersByPosition = (
  players: Player[],
  positionType: 'goalkeeper' | 'defender' | 'midfielder' | 'forward'
): Player[] => {
  return players.filter((player) => {
    const type = getPositionType(player.position);
    return type === positionType;
  });
};

/**
 * Ordena jugadores: titulares primero, luego por posición
 */
export const sortPlayersByLineup = (players: Player[]): Player[] => {
  const positionOrder = ['goalkeeper', 'defender', 'midfielder', 'forward'];

  return [...players].sort((a, b) => {
    // Titulares primero
    if (a.esTitular && !b.esTitular) return -1;
    if (!a.esTitular && b.esTitular) return 1;

    // Luego por posición
    const posA = positionOrder.indexOf(getPositionType(a.position));
    const posB = positionOrder.indexOf(getPositionType(b.position));
    return posA - posB;
  });
};

/**
 * Obtiene el nombre completo de un jugador para mostrar
 */
export const getPlayerDisplayName = (player: Player): string => {
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

/**
 * Obtiene el nombre corto de un jugador (inicial + apellido)
 */
export const getShortDisplayName = (player: Player): string => {
  const fullName = getPlayerDisplayName(player);
  const parts = fullName.split(' ');

  if (parts.length >= 2) {
    return `${parts[0].charAt(0)}. ${parts[parts.length - 1]}`;
  }

  return fullName;
};

/**
 * Obtiene el color del gradiente según el puntaje
 */
export const getPuntajeColor = (puntaje: number): string => {
  if (puntaje >= 7) return 'from-green-500 to-green-600';
  if (puntaje >= 5) return 'from-yellow-500 to-yellow-600';
  return 'from-red-500 to-red-600';
};
