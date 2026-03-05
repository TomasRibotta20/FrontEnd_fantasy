import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';

interface WidgetPuntosProps {
  equipoId?: number | null;
  torneoId?: number | string | null;
}

interface HistorialItem {
  puntaje_total?: number;
  puntajeTotal?: number;
  puntos_acumulados?: number;
  puntos?: number;
  jornada?: {
    puntaje_total?: number;
  };
}

const WidgetPuntos = ({ equipoId, torneoId }: WidgetPuntosProps) => {
  const navigate = useNavigate();
  const [puntajeTotal, setPuntajeTotal] = useState(0);
  const [jornadasJugadas, setJornadasJugadas] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadPuntos = useCallback(async () => {
    if (!equipoId) return;

    try {
      // Usar el endpoint correcto: GET /api/equipos/:id/historial
      const response = await apiClient.get(
        `/api/equipos/${equipoId}/historial`
      );
      const historialData = Array.isArray(response.data)
        ? response.data
        : response.data?.data || [];

      if (historialData.length > 0) {
        // El backend devuelve un array de objetos con estructura: { jornada: {...}, puntaje_total: X }
        const total = historialData.reduce(
          (sum: number, item: HistorialItem) => {
            // Intentar diferentes ubicaciones del puntaje
            const puntos =
              item.puntaje_total ||
              item.puntajeTotal ||
              item.jornada?.puntaje_total ||
              item.puntos_acumulados ||
              item.puntos ||
              0;

            return sum + Number(puntos);
          },
          0
        );

        setPuntajeTotal(total);
        setJornadasJugadas(historialData.length);
      }
    } catch (error) {
      // Error al cargar puntos - silenciar
    } finally {
      setLoading(false);
    }
  }, [equipoId]);

  useEffect(() => {
    if (equipoId) {
      loadPuntos();
    } else {
      setLoading(false);
    }
  }, [equipoId, loadPuntos]);

  // No mostrar nada si está cargando o no hay equipoId
  if (loading || !equipoId) {
    return null;
  }

  const promedio = jornadasJugadas > 0 ? puntajeTotal / jornadasJugadas : 0;

  return (
    <div
      className="bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg p-2 shadow-lg cursor-pointer hover:shadow-xl transition-all duration-300 flex-shrink-0 border border-purple-400/30"
      onClick={() => {
        const params = new URLSearchParams();
        if (equipoId) params.append('equipoId', String(equipoId));
        if (torneoId) params.append('torneoId', String(torneoId));
        navigate(`/mis-puntos/historial?${params.toString()}`);
      }}
    >
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-white font-bold text-sm drop-shadow-lg">
          Tus Puntos
        </h3>
        <span className="text-white/90 text-xs font-semibold drop-shadow">
          Ver más →
        </span>
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        <div className="text-center bg-white/10 rounded-md p-1 backdrop-blur-sm">
          <p className="text-white/90 text-xs font-semibold drop-shadow">
            Total
          </p>
          <p className="text-yellow-300 text-base font-bold leading-tight drop-shadow-lg">
            {puntajeTotal.toFixed(1)}
          </p>
        </div>
        <div className="text-center bg-white/10 rounded-md p-1 backdrop-blur-sm">
          <p className="text-white/90 text-xs font-semibold drop-shadow">
            Jornadas
          </p>
          <p className="text-blue-300 text-base font-bold leading-tight drop-shadow-lg">
            {jornadasJugadas}
          </p>
        </div>
        <div className="text-center bg-white/10 rounded-md p-1 backdrop-blur-sm">
          <p className="text-white/90 text-xs font-semibold drop-shadow">
            Promedio
          </p>
          <p className="text-green-300 text-base font-bold leading-tight drop-shadow-lg">
            {promedio.toFixed(1)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default WidgetPuntos;
