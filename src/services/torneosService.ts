import apiClient from './apiClient';

// Tipos para Mis Torneos (lista)
export interface TorneoListItem {
  torneo_id: number;
  nombre: string;
  descripcion?: string;
  estado: 'EN_ESPERA' | 'ACTIVO' | 'FINALIZADO';
  codigo_acceso: string;
  mi_rol: 'creador' | 'participante';
  mi_equipo: {
    id: number;
    nombre: string;
    puntos: number;
    presupuesto: number;
  };
  cant_participantes: number;
  cupo_maximo: number;
}

// Tipos para Detalle de Torneo
export interface TorneoDetalle {
  id: number;
  nombre: string;
  descripcion?: string;
  estado: 'EN_ESPERA' | 'ACTIVO' | 'FINALIZADO';
  codigo: string;
  mi_equipo_id?: number;
  soy_admin: boolean;
  participantes?: Array<{
    pos: number;
    usuario_id: number;
    usuario: string;
    equipo_id: number;
    nombre_equipo: string;
    puntos: number;
    es_mi_equipo: boolean;
    es_admin: boolean;
    expulsado?: boolean;
  }>;
}

export interface CrearTorneoData {
  nombre: string;
  descripcion?: string;
  cupoMaximo: number;
  nombre_equipo: string;
  fecha_inicio?: string;
}

export interface UnirseATorneoData {
  codigo_acceso: string;
  nombre_equipo: string;
}

export interface ValidarCodigoData {
  codigo_acceso: string;
}

// Funciones del servicio

/**
 * Crear un nuevo torneo
 */
export const crearTorneo = async (data: CrearTorneoData) => {
  const response = await apiClient.post('/api/torneos', data);
  return response.data;
};

/**
 * Validar código de acceso de un torneo
 */
export const validarCodigoTorneo = async (data: ValidarCodigoData) => {
  const response = await apiClient.post('/api/torneos/validar-codigo', data);
  return response.data;
};

/**
 * Unirse a un torneo existente
 */
export const unirseATorneo = async (data: UnirseATorneoData) => {
  const response = await apiClient.post('/api/torneos/unirse', data);
  return response.data;
};

/**
 * Obtener todos los torneos del usuario
 */
export const obtenerMisTorneos = async (estado?: string) => {
  const queryString = estado ? `?estado=${estado}` : '';
  const response = await apiClient.post(`/api/torneos/mis-torneos${queryString}`, {});
  return response.data;
};

/**
 * Obtener detalles de un torneo específico
 */
export const obtenerDetalleTorneo = async (torneoId: number) => {
  const response = await apiClient.get(`/api/torneos/mi-torneo/${torneoId}`);
  return response.data;
};

/**
 * Abandonar un torneo
 */
export const abandonarTorneo = async (torneoId: number) => {
  const response = await apiClient.delete(`/api/torneos/abandonar/${torneoId}`);
  return response.data;
};

/**
 * Actualizar torneo (PUT - completo)
 */
export const actualizarTorneo = async (torneoId: number, data: Partial<CrearTorneoData>) => {
  const response = await apiClient.put(`/api/torneos/${torneoId}`, data);
  return response.data;
};

/**
 * Actualizar torneo parcialmente (PATCH)
 */
export const actualizarTorneoParcial = async (torneoId: number, data: Partial<CrearTorneoData>) => {
  const response = await apiClient.patch(`/api/torneos/${torneoId}`, data);
  return response.data;
};

/**
 * Iniciar torneo (solo creador)
 */
export const iniciarTorneo = async (torneoId: number) => {
  const response = await apiClient.post(`/api/torneos/iniciar/${torneoId}`);
  return response.data;
};

// ========== ENDPOINTS DE ADMINISTRADOR ==========

/**
 * Obtener todos los torneos con filtros (Admin)
 */
export interface FiltrosTorneos {
  estado?: 'EN_ESPERA' | 'ACTIVO' | 'FINALIZADO';
  min_participantes?: number;
  max_participantes?: number;
  limit?: number;
  offset?: number;
  fecha_creacion_desde?: string;
  fecha_creacion_hasta?: string;
}

export const obtenerTodosLosTorneos = async (filtros?: FiltrosTorneos) => {
  const params = new URLSearchParams();
  if (filtros) {
    Object.entries(filtros).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });
  }
  const queryString = params.toString();
  const url = `/api/torneos${queryString ? `?${queryString}` : ''}`;
  const response = await apiClient.get(url);
  return response.data;
};

/**
 * Obtener un torneo específico con detalles completos (Admin)
 */
export const obtenerTorneoAdmin = async (torneoId: number) => {
  const response = await apiClient.get(`/api/torneos/${torneoId}`);
  return response.data;
};

/**
 * Actualizar torneo completo (PUT) - Admin
 */
export const actualizarTorneoAdmin = async (torneoId: number, data: Partial<CrearTorneoData>) => {
  const response = await apiClient.put(`/api/torneos/${torneoId}`, data);
  return response.data;
};

/**
 * Actualizar torneo parcialmente (PATCH) - Admin
 */
export interface ActualizacionParcialTorneo {
  nombre?: string;
  descripcion?: string;
  cupoMaximo?: number;
  codigo_acceso?: string;
  estado?: 'EN_ESPERA' | 'ACTIVO' | 'FINALIZADO';
}

export const actualizarTorneoParcialAdmin = async (torneoId: number, data: ActualizacionParcialTorneo) => {
  const response = await apiClient.patch(`/api/torneos/${torneoId}`, data);
  return response.data;
};

/**
 * Eliminar torneo (solo admin)
 */
export const eliminarTorneo = async (torneoId: number) => {
  const response = await apiClient.delete(`/api/torneos/${torneoId}`);
  return response.data;
};

/**
 * Expulsar participante de un torneo (solo creador del torneo)
 */
export const expulsarParticipante = async (torneoId: number, userId: number) => {
  const response = await apiClient.delete(`/api/torneos/${torneoId}/participante/${userId}`);
  return response.data;
};

/**
 * Actualizar datos del torneo (para creadores)
 */
export interface ActualizarTorneoData {
  nombre?: string;
  descripcion?: string;
  cupoMaximo?: number;
  codigo_acceso?: string;
  fecha_inicio?: string;
}

export const modificarTorneo = async (torneoId: number, data: ActualizarTorneoData) => {
  const response = await apiClient.patch(`/api/torneos/${torneoId}`, data);
  return response.data;
};
