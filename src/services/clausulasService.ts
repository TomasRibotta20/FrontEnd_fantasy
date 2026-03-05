import apiClient from './apiClient';

export interface BlindajeRequest {
  monto_incremento: number;
}

/** Servicio para blindar jugadores y ejecutar cláusulas de rescisión. */
export const clausulasService = {
  // Blindar un jugador (incrementar su cláusula)
  blindarJugador: async (
    equipoId: number,
    jugadorId: number,
    data: BlindajeRequest
  ) => {
    const response = await apiClient.post(
      `/api/clausulas/${equipoId}/jugadores/${jugadorId}/blindar`,
      data
    );
    return response.data;
  },

  // Ejecutar cláusula de rescisión (comprar jugador de otro equipo)
  ejecutarClausula: async (equipoId: number, jugadorId: number) => {
    const response = await apiClient.post(
      `/api/clausulas/${equipoId}/jugadores/${jugadorId}/ejecutar-clausula`,
      {}
    );
    return response.data;
  },
};
