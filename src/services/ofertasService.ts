import apiClient from './apiClient';

export interface Oferta {
  id: number;
  estado: 'PENDIENTE' | 'ACEPTADA' | 'RECHAZADA';
  monto_ofertado: number;
  fecha_creacion: string;
  fecha_vencimiento: string;
  horas_restantes?: number;
  mensaje_oferente?: string;
  mensaje_respuesta?: string;
  torneo: {
    id: number;
    nombre: string;
  };
  jugador: {
    id: number;
    // Backend devuelve nombre/foto, frontend usa name/photo
    name?: string;
    nombre?: string;
    photo?: string;
    foto?: string;
    position?: string;
    posicion?: string;
    club?: string;
    precio_actual: number;
  };
  vendedor?: {
    id: number;
    nombre: string;
    usuario: string;
  };
  oferente?: {
    id: number;
    nombre: string;
    usuario: string;
  };
}

export interface CrearOfertaRequest {
  equipoJugador_id: number;
  monto_ofertado: number;
  mensaje_oferente?: string;
}

export const ofertasService = {
  // Crear o actualizar oferta
  crearOferta: async (data: CrearOfertaRequest) => {
    const response = await apiClient.post('/api/ventas/ofertar', data);
    return response.data;
  },

  // Ver mis ofertas enviadas
  obtenerMisOfertasEnviadas: async (torneoId: number, params?: {
    estado?: 'PENDIENTE' | 'ACEPTADA' | 'RECHAZADA';
    limit?: number;
    offset?: number;
  }) => {
    const response = await apiClient.get('/api/ventas/mis-ofertas-enviadas', {
      params: { torneoId: torneoId.toString(), ...params },
    });
    return response.data;
  },

  // Ver mis ofertas recibidas
  obtenerMisOfertasRecibidas: async (torneoId: number, params?: {
    estado?: 'PENDIENTE' | 'ACEPTADA' | 'RECHAZADA';
    limit?: number;
    offset?: number;
  }) => {
    const response = await apiClient.get('/api/ventas/mis-ofertas-recibidas', {
      params: { torneoId: torneoId.toString(), ...params },
    });
    return response.data;
  },

  // Ver detalle de oferta
  obtenerDetalleOferta: async (ofertaId: number) => {
    const response = await apiClient.get(`/api/ventas/${ofertaId}`);
    return response.data;
  },

  // Aceptar oferta
  aceptarOferta: async (ofertaId: number) => {
    const response = await apiClient.post(`/api/ventas/${ofertaId}/aceptar`, {});
    return response.data;
  },

  // Rechazar oferta
  rechazarOferta: async (ofertaId: number, mensaje_respuesta?: string) => {
    const response = await apiClient.post(`/api/ventas/${ofertaId}/rechazar`, {
      mensaje_respuesta,
    });
    return response.data;
  },

  // Cancelar oferta
  cancelarOferta: async (ofertaId: number) => {
    const response = await apiClient.delete(`/api/ventas/${ofertaId}/cancelar`);
    return response.data;
  },
};
