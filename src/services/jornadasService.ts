import apiClient from './apiClient';
import axios from 'axios';

// ============================================
// INTERFACES
// ============================================

export interface Jornada {
  id: number;
  numero?: number; // Puede venir del backend
  nombre?: string; // O puede venir como nombre (ej: "2nd Phase - 1")
  temporada?: number | string;
  etapa?: string;
  liga_id?: number;
  activa?: boolean;
  permitirModificaciones?: boolean;
  fecha_inicio?: string; // Backend usa snake_case
  fecha_fin?: string; // Backend usa snake_case
  fechaInicio?: string; // Por compatibilidad camelCase
  fechaFin?: string; // Por compatibilidad camelCase
  puntosCalculados?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ConfiguracionSistema {
  jornadaActiva: number | null;
  modificacionesHabilitadas: boolean;
}

// Estructura real del backend para estadísticas de jornada
export interface EstadisticaJugador {
  id: number;
  jugador: {
    id: number;
    apiId: number;
    name: string;
    firstname: string;
    lastname: string;
    age: number;
    nationality: string;
    height: string;
    weight: string;
    photo: string;
    jerseyNumber: number | null;
    club: number;
    position: number;
  };
  partido: {
    id: number;
    id_api: number;
    fecha: string;
    estado: string;
    estado_detalle: string;
    estadio: string;
    local: number;
    visitante: number;
    jornada: number;
  };
  minutos: number;
  posicion: string;
  rating: number;
  capitan: boolean;
  goles: number;
  asistencias: number;
  goles_concedidos: number;
  atajadas: number;
  tarjetas_amarillas: number;
  tarjetas_rojas: number;
  porterias_a_cero: boolean;
  puntaje_total: number;
}

export interface PuntajeEquipo {
  equipoId: number;
  jornadaId: number;
  puntajeTotal: number;
  jugadores: {
    jugadorId: number;
    nombre: string;
    puntos: number;
  }[];
}

export interface JornadaHistorial {
  jornada: {
    id: number;
    nombre?: string;
    numero?: number;
    temporada?: number | string;
    fecha_inicio?: string;
    fecha_fin?: string;
  };
  puntajeTotal: number;
  fechaSnapshot?: string;
  jugadores?: unknown[];
}

export interface HistorialEquipo {
  jornadas: JornadaHistorial[];
}

// ============================================
// SERVICIOS DE JORNADAS
// ============================================

export const jornadasService = {
  // Obtener todas las jornadas
  async getJornadas(temporada?: string): Promise<Jornada[]> {
    try {
      const params = temporada ? { temporada } : {};
      // Usar axios directo sin /api ya que el endpoint es /jornadas (no /api/jornadas)
      const response = await axios.get('http://localhost:3000/jornadas', { 
        params,
        withCredentials: true 
      });
      // El backend puede devolver { data: [...] } o directamente [...]
      const data = response.data?.data || response.data;
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error al obtener jornadas:', error);
      return [];
    }
  },

  // Obtener jornada por ID
  async getJornadaById(id: number): Promise<Jornada> {
    // Usar axios directo sin /api ya que el endpoint es /jornadas/:id (no /api/jornadas/:id)
    const response = await axios.get(`http://localhost:3000/jornadas/${id}`, {
      withCredentials: true
    });
    // El backend puede devolver { data: {...} } o directamente {...}
    return response.data?.data || response.data;
  },

  // Crear nueva jornada
  async createJornada(data: Partial<Jornada>): Promise<Jornada> {
    const response = await axios.post('http://localhost:3000/jornadas', data, {
      withCredentials: true
    });
    return response.data;
  },
};

// ============================================
// SERVICIOS DE ADMINISTRACIÓN
// ============================================

export const adminService = {
  // Ver configuración actual (combinando ambos endpoints)
  async getConfig(): Promise<ConfiguracionSistema> {
    try {
      // Intentar obtener del endpoint /api/admin/config primero
      const response = await apiClient.get('/admin/config');
      const data = response.data?.data || response.data;
      return {
        jornadaActiva: data.jornadaActiva !== undefined ? data.jornadaActiva : null,
        modificacionesHabilitadas: data.modificacionesHabilitadas !== undefined ? data.modificacionesHabilitadas : false
      };
    } catch (error) {
      // Si falla, intentar obtener de los endpoints separados
      try {
        const [jornadaActivaRes, estadoModsRes] = await Promise.all([
          apiClient.get('/config/jornada-activa').catch(() => ({ data: { jornadaActiva: null } })),
          apiClient.get('/config/estado-modificaciones').catch(() => ({ data: { habilitadas: false } }))
        ]);
        
        const jornadaActiva = jornadaActivaRes.data?.jornadaActiva || jornadaActivaRes.data?.data?.jornadaActiva || null;
        const modificacionesHabilitadas = estadoModsRes.data?.habilitadas || estadoModsRes.data?.data?.habilitadas || false;
        
        return {
          jornadaActiva,
          modificacionesHabilitadas
        };
      } catch {
        console.warn('⚠️ No se pudo cargar configuración del servidor');
        throw error;
      }
    }
  },

  // Establecer jornada activa
  async setJornadaActiva(jornadaId: string | number): Promise<{ success: boolean; message?: string }> {
    const response = await apiClient.post('/admin/set-jornada-activa', { jornadaId });
    return response.data;
  },

  // Deshabilitar modificaciones (bloquear equipos)
  async deshabilitarModificaciones(): Promise<{ success: boolean; message?: string }> {
    const response = await apiClient.post('/admin/deshabilitar-modificaciones');
    return response.data;
  },

  // Habilitar modificaciones (permitir cambios en equipos)
  async habilitarModificaciones(): Promise<{ success: boolean; message?: string }> {
    const response = await apiClient.post('/admin/habilitar-modificaciones');
    return response.data;
  },

  // Procesar jornada
  async procesarJornada(
    jornadaId: number,
    activarJornada: boolean = true
  ): Promise<void> {
    await apiClient.post(`/admin/jornadas/${jornadaId}/procesar`, {
      activarJornada,
    });
  },

  // Recalcular puntajes de una jornada
  async recalcularPuntajes(jornadaId: number): Promise<void> {
    await apiClient.post(`/admin/jornadas/${jornadaId}/recalcular`);
  },
};

// ============================================
// SERVICIOS DE ESTADÍSTICAS
// ============================================

export const estadisticasService = {
  // Actualizar estadísticas para una jornada específica
  async actualizarEstadisticas(jornadaId: number): Promise<void> {
    await apiClient.post(`/estadisticas/jornadas/${jornadaId}/actualizar`);
  },

  // Obtener todos los puntajes de una jornada
  async getPuntajesJornada(jornadaId: number): Promise<EstadisticaJugador[]> {
    const response = await apiClient.get(
      `/estadisticas/jornadas/${jornadaId}/puntajes`
    );
    // Manejar tanto { data: [...] } como array directo
    const data = response.data?.data || response.data;
    
    // Si no es un array, retornar array vacío
    if (!Array.isArray(data)) {
      console.warn('getPuntajesJornada: respuesta no es un array', data);
      return [];
    }
    
    return data;
  },

  // Obtener puntaje de un jugador específico en una jornada
  async getPuntajeJugador(
    jornadaId: number,
    jugadorId: number
  ): Promise<EstadisticaJugador> {
    const response = await apiClient.get(
      `/estadisticas/jornadas/${jornadaId}/jugadores/${jugadorId}`
    );
    return response.data?.data || response.data;
  },
};

// ============================================
// SERVICIOS DE EQUIPOS Y PUNTOS
// ============================================

export const equiposService = {
  // Obtener historial de jornadas donde el equipo puntuó
  async getHistorialEquipo(equipoId: number): Promise<HistorialEquipo> {
    const response = await apiClient.get(`/equipos/${equipoId}/historial`);
    console.log('🔍 [getHistorialEquipo] Respuesta completa:', response.data);
    
    // El backend devuelve { data: [...] } donde data es un ARRAY directo
    const rawData = response.data?.data || response.data;
    console.log('🔍 [getHistorialEquipo] Datos extraídos:', rawData);
    console.log('🔍 [getHistorialEquipo] Es array?', Array.isArray(rawData));
    
    // Si rawData es un array directamente (la estructura correcta del backend)
    if (Array.isArray(rawData)) {
      console.log('✅ [getHistorialEquipo] Array de jornadas encontrado:', rawData.length);
      return { jornadas: rawData };
    }
    
    // Si tiene la propiedad jornadas (formato antiguo por si acaso)
    if (rawData && Array.isArray(rawData.jornadas)) {
      console.log('✅ [getHistorialEquipo] Jornadas en objeto:', rawData.jornadas.length);
      return rawData as HistorialEquipo;
    }
    
    // Si no hay datos válidos
    console.warn('⚠️ [getHistorialEquipo] No hay jornadas o formato inválido');
    return { jornadas: [] };
  },

  // Obtener puntuaciones de un equipo para una jornada
  async getPuntajesEquipoJornada(
    equipoId: number,
    jornadaId: number
  ): Promise<PuntajeEquipo> {
    const response = await apiClient.get(
      `/equipos/${equipoId}/jornadas/${jornadaId}`
    );
    console.log('🔍 [getPuntajesEquipoJornada] Respuesta:', response.data);
    const result = response.data?.data || response.data;
    console.log('🔍 [getPuntajesEquipoJornada] Resultado final:', result);
    return result;
  },

  // Obtener mi equipo con puntos
  async getMiEquipoConPuntos(): Promise<unknown> {
    const response = await apiClient.get('/equipos/mi-equipo');
    return response.data?.data || response.data;
  },
};
