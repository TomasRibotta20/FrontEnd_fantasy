import apiClient from './apiClient';

// ========================================
// TIPOS E INTERFACES
// ========================================

export interface Recompensa {
  id: number;
  id_recompensa?: number;
  equipo: number;
  torneo: number;
  id_torneo?: number;
  tier: 'ORO' | 'PLATA' | 'BRONCE';
  posicion: number;
  jornada?: string;
  fechaOtorgamiento: string;
  estado: 'PENDIENTE' | 'EN_PROCESO' | 'RECLAMADA';
  premioElegido?: number;
  opcionesGeneradas?: number[];
  fechaExpiracion?: string;
  jugadorObtenido?: number;
  montoObtenido?: number;
  descripcion?: string;
}

export interface PremioOpcion {
  id: number;
  tier: 'ORO' | 'PLATA' | 'BRONCE';
  tipo: 'SALDO' | 'RULETA' | 'PLAYERPICK';
  monto?: number;
  descripcion: string;
  pesoMinRuleta?: number;
  pesoMaxRuleta?: number;
}

export interface JugadorOpcion {
  id: number;
  name: string;
  firstName?: string;
  lastName?: string;
  position: string;
  photo: string;
  precio_actual: number;
  club?: {
    id: number;
    nombre: string;
    logo?: string;
  };
}

export interface OpcionesRecompensa {
  recompensa?: Recompensa;
  opciones: PremioOpcion[];
  tier?: string;
  posicion?: number;
  recompensaId?: number;
}

export interface OpcionesPlayerPick {
  recompensa: Recompensa;
  jugadores: JugadorOpcion[];
  tiempoRestante: number;
}

export interface OpcionesPickPendiente {
  tipo: 'pick_pendiente';
  recompensaId: number;
  mensaje: string;
  opciones: Array<{
    id: number;
    nombre: string;
    posicion: string;
    club: string;
    precio_actual: number;
    foto_perfil: string;
  }>;
  opcionesIds: number[];
  expira: string;
}

// Respuestas de elegir premio
export interface RespuestaElegirSaldo {
  tipo: 'saldo';
  monto: number;
  mensaje: string;
}

export interface RespuestaElegirRuleta {
  tipo: 'ruleta';
  jugador: {
    id: number;
    nombre?: string;
    name?: string;
    foto?: string;
    photo?: string;
    precio_actual: number;
  };
  mensaje: string;
}

export interface RespuestaCompensacionSaldo {
  tipo: 'compensacion_saldo';
  montoCompensacion: number;
  jugadorIntentado: string;
  mensaje: string;
}

export interface RespuestaDineroFallback {
  tipo: 'dinero_fallback';
  rangoOriginal: {
    min: number;
    max: number | null;
    peso: number;
  };
  montoCompensacion: number;
  mensaje: string;
}

export interface RespuestaPlayerPickIniciado {
  tipo: 'playerpick_iniciado';
  recompensaId: number;
  tiempoLimite: string;
  jugadoresDisponibles: JugadorOpcion[];
  mensaje: string;
}

export type RespuestaElegirPremio =
  | RespuestaElegirSaldo
  | RespuestaElegirRuleta
  | RespuestaCompensacionSaldo
  | RespuestaDineroFallback
  | RespuestaPlayerPickIniciado;

export interface RespuestaConfirmarPick {
  tipo: 'playerpick_completado';
  jugador: {
    id: number;
    name: string;
    precio_actual: number;
  };
  mensaje: string;
}

// ========================================
// SERVICIO DE RECOMPENSAS
// ========================================

/** Servicio para gestionar recompensas, premios y player picks. */
export const recompensasService = {
  /**
   * Obtener recompensas pendientes del usuario
   */
  async obtenerPendientes(): Promise<Recompensa[]> {
    const response = await apiClient.get('/api/recompensas/pendientes');
    // El backend devuelve { hayPendientes, cantidad, data: [...] }
    return response.data.data || response.data || [];
  },

  /**
   * Obtener opciones de premio para una recompensa específica
   */
  async obtenerOpciones(recompensaId: number): Promise<OpcionesRecompensa | OpcionesPlayerPick | OpcionesPickPendiente> {
    const response = await apiClient.get(`/api/recompensas/${recompensaId}/opciones`);
    return response.data;
  },

  /**
   * Elegir un premio de las opciones disponibles
   */
  async elegirPremio(recompensaId: number, premioId: number): Promise<RespuestaElegirPremio> {
    const response = await apiClient.post('/api/recompensas/elegir', {
      recompensaId,
      premioId,
    });
    return response.data;
  },

  /**
   * Confirmar la elección de un jugador en PlayerPick
   */
  async confirmarPick(recompensaId: number, jugadorId: number): Promise<RespuestaConfirmarPick> {
    const response = await apiClient.post('/api/recompensas/confirmar-pick', {
      recompensaId,
      jugadorId,
    });
    return response.data;
  },
};

export default recompensasService;
