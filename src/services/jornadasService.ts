import apiClient from './apiClient';

export interface Jornada {
  id: number;
  numero?: number; // Puede venir del backend
  nombre?: string; // O puede venir como nombre (ej: "2nd Phase - 1")
  temporada?: number | string;
  etapa?: string;
  liga_id?: number;
  activa?: boolean;
  permitirModificaciones?: boolean;
  fecha_inicio?: string; 
  fecha_fin?: string; 
  fechaInicio?: string; 
  fechaFin?: string; 
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


export const jornadasService = {
  // Obtener todas las jornadas
  async getJornadas(temporada?: string): Promise<Jornada[]> {
    try {
      const params = temporada ? `?temporada=${temporada}` : '';
      const response = await apiClient.get(`/api/jornadas${params}`);
      
      const data = response.data?.data || response.data;
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  // Obtener jornada por ID
  async getJornadaById(id: number): Promise<Jornada> {
    const response = await apiClient.get(`/api/jornadas/${id}`);
    return response.data?.data || response.data;
  },

  // Crear nueva jornada
  async createJornada(data: Partial<Jornada>): Promise<Jornada> {
    const response = await apiClient.post('/api/jornadas', data);
    return response.data;
  },
};



export const adminService = {
  // Obtener jornada activa con todos sus detalles
  async getJornadaActiva(): Promise<{ jornada: Jornada | null; modificacionesHabilitadas: boolean }> {
    try {
      const response = await apiClient.get('/api/config/jornada-activa');
      
      const data = response.data?.data || response.data;
      
      return {
        jornada: data.jornada || null,
        modificacionesHabilitadas: data.modificacionesHabilitadas || false
      };
    } catch {
      return {
        jornada: null,
        modificacionesHabilitadas: false
      };
    }
  },

  // Ver configuración actual (combinando ambos endpoints)
  async getConfig(): Promise<ConfiguracionSistema> {
    try {
      
      const response = await apiClient.get('/api/admin/config');
      const data = response.data?.data || response.data;
      return {
        jornadaActiva: data.jornadaActiva !== undefined ? data.jornadaActiva : null,
        modificacionesHabilitadas: data.modificacionesHabilitadas !== undefined ? data.modificacionesHabilitadas : false
      };
    } catch {
      const [jornadaActivaRes, estadoModsRes] = await Promise.all([
        apiClient.get('/api/config/jornada-activa').catch(() => ({ data: { jornadaActiva: null } })),
        apiClient.get('/api/config/estado-modificaciones').catch(() => ({ data: { habilitadas: false } }))
      ]);
      
      const jornadaActiva = jornadaActivaRes.data?.jornadaActiva || jornadaActivaRes.data?.data?.jornadaActiva || null;
      const modificacionesHabilitadas = estadoModsRes.data?.habilitadas || estadoModsRes.data?.data?.habilitadas || false;
      
      return {
        jornadaActiva,
        modificacionesHabilitadas
      };
    }
  },

  // Establecer jornada activa
  async setJornadaActiva(jornadaId: string | number): Promise<{ success: boolean; message?: string }> {
    const response = await apiClient.patch('/api/admin/config', { jornadaId });
    return response.data;
  },

  // Deshabilitar modificaciones (bloquear equipos)
  async deshabilitarModificaciones(): Promise<{ success: boolean; message?: string }> {
    const response = await apiClient.patch('/api/admin/config', { modificacionesHabilitadas: false });
    return response.data;
  },

  // Habilitar modificaciones (permitir cambios en equipos)
  async habilitarModificaciones(): Promise<{ success: boolean; message?: string }> {
    const response = await apiClient.patch('/api/admin/config', { modificacionesHabilitadas: true });
    return response.data;
  },

  // Procesar jornada
  async procesarJornada(
    jornadaId: number,
    activarJornada: boolean = true
  ): Promise<void> {
    await apiClient.post(`/api/admin/jornadas/${jornadaId}/procesar`, {
      activarJornada,
    });
  },

  // Recalcular puntajes de una jornada
  async recalcularPuntajes(jornadaId: number): Promise<void> {
    await apiClient.post(`/api/admin/jornadas/${jornadaId}/recalcular`);
  },
};



export const estadisticasService = {
  // Actualizar estadísticas para una jornada específica
  async actualizarEstadisticas(jornadaId: number): Promise<void> {
    await apiClient.post(`/api/estadisticas/jornadas/${jornadaId}/actualizar`);
  },

  // Obtener todos los puntajes de una jornada
  async getPuntajesJornada(jornadaId: number): Promise<EstadisticaJugador[]> {
    try {
      const url = `/api/estadisticas/jornadas/${jornadaId}/puntajes`;
            const response = await apiClient.get(url);
            const data = response.data?.data || response.data;
      
      if (!Array.isArray(data)) {
        console.warn(`⚠️ Datos no son array para jornada ${jornadaId}:`, data);
        return [];
      }
      
      // Mapear los datos del backend para normalizar nombres de campos
      return data.map((item: Record<string, unknown>) => {
        const jugador = item.jugador as Record<string, unknown> | undefined;
        
        // Construir nombre del jugador desde campos en español o inglés
        const firstName = jugador?.primer_nombre || jugador?.firstname || '';
        const lastName = jugador?.apellido || jugador?.lastname || '';
        const fullName = jugador?.nombre || jugador?.name || 
          (firstName && lastName ? `${firstName} ${lastName}`.trim() : '') ||
          'Jugador Desconocido';
        
        return {
          ...item,
          jugador: jugador ? {
            ...jugador,
            // Normalizar campos del jugador
            id: jugador.id,
            apiId: jugador.id_api || jugador.apiId || jugador.id,
            name: fullName,
            firstname: firstName,
            lastname: lastName,
            photo: jugador.foto || jugador.photo || '',
            jerseyNumber: jugador.numero_camiseta ?? jugador.jerseyNumber ?? null,
          } : undefined,
        };
      });
    } catch (error) {
      console.error(`❌ Error al obtener estadísticas de jornada ${jornadaId}:`, error);
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number; data?: unknown }; config?: { url?: string }; message?: string };
        console.error('Detalles del error:', {
          message: axiosError.message,
          status: axiosError.response?.status,
          url: axiosError.config?.url,
          data: axiosError.response?.data
        });
      }
      return [];
    }
  },

  // Obtener puntaje de un jugador específico en una jornada
  async getPuntajeJugador(
    jornadaId: number,
    jugadorId: number
  ): Promise<EstadisticaJugador> {
    const response = await apiClient.get(
      `/api/estadisticas/jornadas/${jornadaId}/jugadores/${jugadorId}`
    );
    return response.data?.data || response.data;
  },
};


export const equiposService = {
  // Obtener historial de jornadas donde el equipo puntuó
  async getHistorialEquipo(equipoId: number): Promise<HistorialEquipo> {
    const response = await apiClient.get(`/api/equipos/${equipoId}/historial`);
    
    const rawData = response.data?.data || response.data;
        // Si rawData es un array directamente (la estructura correcta del backend)
    if (Array.isArray(rawData)) {
      // Normalizar los campos del backend
      const jornadas = rawData.map((item: Record<string, unknown>) => ({
        jornada: item.jornada as JornadaHistorial['jornada'],
        // El backend puede enviar puntaje_total o puntajeTotal
        puntajeTotal: (item.puntaje_total ?? item.puntajeTotal ?? 0) as number,
        fechaSnapshot: item.fechaSnapshot as string | undefined,
        jugadores: item.jugadores as unknown[],
      }));
            return { jornadas };
    }
    
    // Si tiene la propiedad jornadas (formato antiguo por si acaso)
    if (rawData && Array.isArray(rawData.jornadas)) {
      return rawData as HistorialEquipo;
    }
    
    // Si no hay datos válidos
    return { jornadas: [] };
  },

  // Obtener puntuaciones de un equipo para una jornada
  async getPuntajesEquipoJornada(
    equipoId: number,
    jornadaId: number
  ): Promise<PuntajeEquipo> {
    try {
      const response = await apiClient.get(
        `/api/equipos/${equipoId}/puntos/jornadas/${jornadaId}`
      );
      const result = response.data?.data || response.data;
      return result;
    } catch {
      // Retornar estructura vacía si falla
      return {
        equipoId,
        jornadaId,
        puntajeTotal: 0,
        jugadores: []
      };
    }
  },

  // Obtener equipo específico por ID (para un torneo)
  async getEquipoPorId(equipoId: number): Promise<unknown> {
    const response = await apiClient.get(`/api/equipos/detalle-equipo/${equipoId}`);
    return response.data?.data || response.data;
  },
};

