import apiClient from './apiClient';

// ── Tipos para Historial de Precios ──

export interface PrecioHistorialEntry {
  jornadaId: number | null;
  jornadaNombre: string;
  precio: number;
  fecha: string;
  variacionPorcentual: number;
  variacionAbsoluta: number;
  motivo: string;
  observaciones: string;
}

export interface PrecioEstadisticas {
  precioActual: number;
  precioInicial: number;
  precioMaximo: number;
  precioMinimo: number;
  variacionTotal: number;
  variacionAbsolutaTotal: number;
}

export interface HistorialPreciosResponse {
  jugador: {
    id: number;
    nombre: string;
    foto: string;
    precioActual: number;
  };
  historial: PrecioHistorialEntry[];
  estadisticas: PrecioEstadisticas;
}

// ── Tipos para Historial de Estadísticas ──

export interface PuntosHistorialEntry {
  jornadaId: number;
  jornadaNombre: string;
  puntos: number;
  fecha: string;
  rival: string;
  esLocal: boolean;
}

export interface EstadisticaDetalladaEntry {
  jornadaId: number;
  jornadaNombre: string;
  fecha: string;
  minutos: number;
  goles: number;
  asistencias: number;
  tarjetasAmarillas: number;
  tarjetasRojas: number;
  porteriaACero: boolean;
  rating: number;
  puntajeTotal: number;
}

export interface ResumenEstadisticas {
  totalJornadas: number;
  totalPuntos: number;
  promedioPuntos: number;
  totalGoles: number;
  totalAsistencias: number;
  totalTarjetasAmarillas: number;
  totalTarjetasRojas: number;
  totalPorteriasACero: number;
  promedioRating: number;
  mejorPuntaje: number;
  peorPuntaje: number;
}

export interface HistorialEstadisticasResponse {
  historialPuntos: PuntosHistorialEntry[];
  estadisticasDetalladas: EstadisticaDetalladaEntry[];
  resumen: ResumenEstadisticas;
}

// ── Funciones de API ──

/** Obtiene el historial de precios de un jugador. */
export async function obtenerHistorialPrecios(
  jugadorId: number,
): Promise<HistorialPreciosResponse> {
  const response = await apiClient.get(`/api/precios/jugador/${jugadorId}`);
  return response.data.data;
}

export async function obtenerHistorialEstadisticas(
  jugadorId: number,
): Promise<HistorialEstadisticasResponse> {
  const response = await apiClient.get(
    `/api/estadisticas/jugador/${jugadorId}/historial`,
  );
  return response.data.data;
}
