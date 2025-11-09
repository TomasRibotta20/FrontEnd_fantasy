import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { equiposService, type HistorialEquipo } from '../../services/jornadasService';

const WidgetPuntos = () => {
  const navigate = useNavigate();
  const [historial, setHistorial] = useState<HistorialEquipo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPuntos();
  }, []);

  const loadPuntos = async () => {
    try {
      const miEquipo = await equiposService.getMiEquipoConPuntos();
      
      if (miEquipo && typeof miEquipo === 'object' && 'id' in miEquipo) {
        const equipoId = (miEquipo as { id: number }).id;
        const historialData = await equiposService.getHistorialEquipo(equipoId);
        setHistorial(historialData);
      }
    } catch (error) {
      // Silenciar error si el endpoint no existe aún
      console.warn('Historial de jornadas no disponible aún:', error);
      setHistorial(null);
    } finally {
      setLoading(false);
    }
  };

  // No mostrar nada si está cargando o hubo error
  if (loading || !historial || !historial.jornadas) {
    return null;
  }

  const puntajeTotal = Array.isArray(historial.jornadas) 
    ? historial.jornadas.reduce((sum, j) => sum + (j.puntajeTotal || 0), 0) 
    : 0;
  const jornadasJugadas = Array.isArray(historial.jornadas) ? historial.jornadas.length : 0;
  const promedio = jornadasJugadas > 0 ? Math.round(puntajeTotal / jornadasJugadas) : 0;

  return (
    <div 
      className="bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl p-6 shadow-lg border-2 border-white/20 cursor-pointer hover:scale-105 transition-transform"
      onClick={() => navigate('/mis-puntos/historial')}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-bold text-lg">🏆 Tus Puntos</h3>
        <span className="text-white/70 text-sm">Ver más →</span>
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-white/70 text-xs mb-1">Total</p>
          <p className="text-yellow-300 text-2xl font-bold">{puntajeTotal}</p>
        </div>
        <div className="text-center">
          <p className="text-white/70 text-xs mb-1">Jornadas</p>
          <p className="text-blue-300 text-2xl font-bold">{jornadasJugadas}</p>
        </div>
        <div className="text-center">
          <p className="text-white/70 text-xs mb-1">Promedio</p>
          <p className="text-green-300 text-2xl font-bold">{promedio}</p>
        </div>
      </div>
    </div>
  );
};

export default WidgetPuntos;
