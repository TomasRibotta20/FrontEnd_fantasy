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

    try {
      // Intentar primero sin el prefijo /api (endpoint directo)
      const response = await fetch(
        `http://localhost:3000/partidos?${queryParams.toString()}`,
        { credentials: 'include' }
      );
      
      if (response.ok) {
        const data = await response.json();
        return Array.isArray(data) ? data : data?.data || [];
      }
      
      // Si falla, intentar con el prefijo /api
      const responseApi = await apiClient.get(`/partidos?${queryParams.toString()}`);
      return responseApi.data;
    } catch (error) {
      console.error('[PARTIDOS_SERVICE] Error al obtener partidos:', error);
      throw error;
    }
  },

  // Obtener un partido por ID
  async getPartidoById(id: number): Promise<Partido> {
    try {
      const response = await fetch(`http://localhost:3000/partidos/${id}`, {
        credentials: 'include',
      });
      if (response.ok) {
        return await response.json();
      }
      const responseApi = await apiClient.get(`/partidos/${id}`);
      return responseApi.data;
    } catch (error) {
      console.error('[PARTIDOS_SERVICE] Error al obtener partido:', error);
      throw error;
    }
  },

  // Crear un nuevo partido
  async createPartido(partido: PartidoCreate): Promise<Partido> {
    try {
      const response = await fetch('http://localhost:3000/partidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(partido),
      });
      if (response.ok) {
        return await response.json();
      }
      const responseApi = await apiClient.post('/partidos', partido);
      return responseApi.data;
    } catch (error) {
      console.error('[PARTIDOS_SERVICE] Error al crear partido:', error);
      throw error;
    }
  },

  // Actualizar un partido (solo estado y estado_detalle)
  async updatePartido(id: number, data: PartidoUpdate): Promise<Partido> {
    try {
      const response = await fetch(`http://localhost:3000/partidos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (response.ok) {
        return await response.json();
      }
      const responseApi = await apiClient.put(`/partidos/${id}`, data);
      return responseApi.data;
    } catch (error) {
      console.error('[PARTIDOS_SERVICE] Error al actualizar partido:', error);
      throw error;
    }
  },

  // Eliminar un partido
  async deletePartido(id: number): Promise<void> {
    try {
      const response = await fetch(`http://localhost:3000/partidos/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok && response.status !== 204) {
        await apiClient.delete(`/partidos/${id}`);
      }
    } catch (error) {
      console.error('[PARTIDOS_SERVICE] Error al eliminar partido:', error);
      throw error;
    }
  },
};
