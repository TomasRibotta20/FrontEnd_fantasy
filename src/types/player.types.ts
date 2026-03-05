/**
 * Tipos compartidos para jugadores
 * Centraliza las interfaces de Player para evitar duplicación
 */

// Interfaz para posición del jugador
export interface Position {
  id: number;
  descripcion: string;
}

// Tipo flexible para posición (puede venir en varios formatos del backend)
export type PlayerPosition = Position | Position[] | string | number | unknown;

// Club del jugador
export interface Club {
  id: number;
  nombre: string;
  logo?: string;
}

// Interfaz base del jugador (formato frontend normalizado)
export interface Player {
  id?: number;
  equipoJugadorId?: number; // ID de la relación equipo-jugador
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
  precio?: number;
  valor_clausula?: number; // Cláusula de rescisión
  valor_clausula_efectiva?: number; // Cláusula efectiva calculada
  dias_proteccion_restantes?: number; // Días de protección restantes
  esta_protegido?: boolean; // Si el jugador está protegido
  club?: Club | number;
}

// Interfaz del jugador como viene del backend (formato crudo)
export interface BackendJugador {
  id: number;
  id_api?: number;
  apiId?: number;
  // Campos en español del backend
  nombre?: string;
  primer_nombre?: string;
  apellido?: string;
  edad?: number;
  nacionalidad?: string;
  altura?: string;
  peso?: string;
  foto?: string;
  numero_camiseta?: number | null;
  posicion?: number | string | Position;
  // Campos en inglés (fallback)
  name?: string;
  firstname?: string;
  lastname?: string;
  age?: number;
  nationality?: string;
  height?: string;
  weight?: string;
  photo?: string;
  jerseyNumber?: number | null;
  position?: number | string;
  club: number | Club;
  precio_actual?: number;
}

// Respuesta del backend para jugador de equipo
export interface BackendPlayerResponse {
  id: number;
  equipo: {
    id: number;
    nombre: string;
    usuario: unknown;
  };
  jugador: BackendJugador;
  es_titular: boolean;
  valor_clausula?: number;
  valor_clausula_efectiva?: number;
  dias_proteccion_restantes?: number;
  esta_protegido?: boolean;
}

// Interfaz para jugador en el mercado
export interface MercadoPlayer extends Player {
  enMercado?: boolean;
  precio_mercado?: number;
  fecha_publicacion?: string;
}

// Interfaz para datos de jugador en admin
export interface PlayerData {
  id: number;
  apiId: number;
  name: string;
  photo: string;
  position: PlayerPosition;
  club?: Club | number;
  precio?: number;
  es_titular?: boolean;
}
