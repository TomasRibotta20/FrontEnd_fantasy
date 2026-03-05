import apiClient from './apiClient';

export interface Partido {
  id: number;
  id_api: number;
  fecha: string;
  estado: string;
  estado_detalle: string;
  estadio?: string;
  jornadaId: number;
  localId: number;
  visitanteId: number;
  local?: { id: number; nombre: string; escudo?: string };
  visitante?: { id: number; nombre: string; escudo?: string };
}

export interface PartidoCreate {
  id_api: number;
  fecha: string;
  estado: string;
  estado_detalle: string;
  estadio?: string;
  jornadaId: number;
  localId: number;
  visitanteId: number;
}

export interface PartidoUpdate {
  estado?: string;
  estado_detalle?: string;
}

/** Servicio CRUD para consultar y gestionar partidos. */
export const partidosService = {
  // Obtener todos los partidos con filtros opcionales
  async getPartidos(params?: {
    jornadaId?: number;
    clubId?: number;
    from?: string;
    to?: string;
  }): Promise<Partido[]> {
    const queryParams = new URLSearchParams();
    if (params?.jornadaId) queryParams.append('jornadaId', params.jornadaId.toString());
    if (params?.clubId) queryParams.append('clubId', params.clubId.toString());
    if (params?.from) queryParams.append('from', params.from);
    if (params?.to) queryParams.append('to', params.to);

    const response = await apiClient.get(`/api/partidos?${queryParams.toString()}`);
    const data = response.data?.data || response.data;
    return Array.isArray(data) ? data : [];
  },

  // Obtener un partido por ID
  async getPartidoById(id: number): Promise<Partido> {
    const response = await apiClient.get(`/api/partidos/${id}`);
    return response.data?.data || response.data;
  },

  // Crear un nuevo partido
  async createPartido(partido: PartidoCreate): Promise<Partido> {
    const response = await apiClient.post('/api/partidos', partido);
    return response.data?.data || response.data;
  },

  // Actualizar un partido (solo estado y estado_detalle)
  async updatePartido(id: number, data: PartidoUpdate): Promise<Partido> {
    const response = await apiClient.put(`/api/partidos/${id}`, data);
    return response.data?.data || response.data;
  },

  // Eliminar un partido
  async deletePartido(id: number): Promise<void> {
    await apiClient.delete(`/api/partidos/${id}`);
  },
};
