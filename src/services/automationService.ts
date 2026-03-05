import apiClient from './apiClient';

export interface AutomationStatus {
  modo_automatico: boolean;
  automation_state: string;
  cron_intervalo_minutos: number;
  mercado_duracion_horas: number;
  ultimo_procesamiento_auto: string | null;
  fecha_referencia_real: string | null;
  fecha_referencia_historica: string | null;
  modificaciones_habilitadas: boolean;
  cron_activo: boolean;
  jornada_activa: {
    id: number;
    nombre: string;
  } | null;
  jornada_mapeada: {
    fecha_inicio_original: string | null;
    fecha_fin_original: string | null;
    fecha_inicio_mapeada: string | null;
    fecha_fin_mapeada: string | null;
  } | null;
  hora_actual: string;
}

export interface ToggleAutomationPayload {
  modo_automatico: boolean;
  cron_intervalo_minutos?: number;
  mercado_duracion_horas?: number;
}

export interface ToggleAutomationResponse {
  modo_automatico: boolean;
  automation_state: string;
  cron_intervalo_minutos: number;
  mercado_duracion_horas: number;
  fecha_referencia_real: string | null;
  fecha_referencia_historica: string | null;
  cron_activo: boolean;
}

/** Obtener estado actual de la automatizacion. */
export const getAutomationStatus = async (): Promise<AutomationStatus> => {
  const response = await apiClient.get('/api/admin/automation/status');
  return response.data.data;
};

/** Activar o desactivar el modo automatico. */
export const toggleAutomation = async (
  payload: ToggleAutomationPayload
): Promise<ToggleAutomationResponse> => {
  const response = await apiClient.post('/api/admin/automation/toggle', payload);
  return response.data.data;
};
