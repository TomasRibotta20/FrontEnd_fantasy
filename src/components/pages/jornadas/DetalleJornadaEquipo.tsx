import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

interface Jugador {
  id: number;
  nombre: string;
  posicion: string;
  puntos?: number;
}

interface JornadaEquipo {
  jornadaId: number;
  numero: number;
  equipo: {
    nombre: string;
    jugadores: Jugador[];
  };
  puntajeTotal: number;
}

const DetalleJornadaEquipo = () => {
  const { equipoId, jornadaId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<JornadaEquipo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `http://localhost:3000/api/equipos/${equipoId}/jornadas/${jornadaId}`,
          { credentials: 'include' }
        );

        if (!response.ok) {
          throw new Error('No se pudo obtener el detalle de la jornada');
        }

        const jsonData = await response.json();
        setData(jsonData?.data || jsonData);
      } catch (err) {
        console.error('Error al cargar detalle:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar detalle');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [equipoId, jornadaId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 p-8 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin text-6xl mb-4">⚽</div>
          <p className="text-xl">Cargando detalle...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-500 text-white p-6 rounded-lg">
            <h2 className="text-2xl font-bold mb-2">Error</h2>
            <p>{error || 'No se encontraron datos'}</p>
            <button
              onClick={() => navigate('/mis-puntos/historial')}
              className="mt-4 px-4 py-2 bg-white text-red-500 rounded-lg font-semibold"
            >
              Volver al Historial
            </button>
          </div>
        </div>
      </div>
    );
  }

  const jugadores = data.equipo.jugadores || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/mis-puntos/historial')}
            className="text-white hover:text-gray-300 mb-4 flex items-center gap-2"
          >
            ← Volver al Historial
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                {data.equipo.nombre}
              </h1>
              <p className="text-gray-300 text-lg">
                Jornada {data.numero || data.jornadaId}
              </p>
            </div>
            <div className="bg-gradient-to-br from-yellow-600 to-orange-600 rounded-xl p-6 shadow-lg border-2 border-white/20">
              <p className="text-white/80 text-sm mb-1">Puntos Totales</p>
              <p className="text-white text-5xl font-bold">{data.puntajeTotal}</p>
            </div>
          </div>
        </div>

        {/* Tabla de Jugadores */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-6">📋 Detalle de Puntos</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="text-left text-white font-semibold py-3 px-4">Jugador</th>
                  <th className="text-left text-white font-semibold py-3 px-4">Posición</th>
                  <th className="text-center text-white font-semibold py-3 px-4">Puntos</th>
                </tr>
              </thead>
              <tbody>
                {jugadores.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center text-gray-400 py-8">
                      No hay jugadores en este equipo
                    </td>
                  </tr>
                ) : (
                  jugadores.map((jugador) => (
                    <tr
                      key={jugador.id}
                      className="border-b border-white/10 hover:bg-white/5 transition-colors"
                    >
                      <td className="py-3 px-4 text-white font-medium">
                        {jugador.nombre}
                      </td>
                      <td className="py-3 px-4 text-gray-300">
                        {jugador.posicion}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-3 py-1 bg-yellow-500 text-black font-bold rounded-lg">
                          {jugador.puntos ?? 0}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-white/30">
                  <td colSpan={2} className="py-4 px-4 text-white font-bold text-lg">
                    Total
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold text-xl rounded-lg">
                      {data.puntajeTotal}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetalleJornadaEquipo;
