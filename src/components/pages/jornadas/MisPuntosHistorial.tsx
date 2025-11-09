import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface JornadaHistorial {
  jornada: {
    id: number;
    nombre?: string;
    numero?: number;
    temporada?: number | string;
    fecha_inicio?: string;
    fecha_fin?: string;
  };
  puntajeTotal: number;
  fechaSnapshot?: string;
}

interface HistorialEquipo {
  jornadas: JornadaHistorial[];
}

const MisPuntosHistorial = () => {
  const navigate = useNavigate();
  const [historial, setHistorial] = useState<HistorialEquipo | null>(null);
  const [miEquipoId, setMiEquipoId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper para extraer número de jornada
  const getNumeroJornada = (jornadaData: JornadaHistorial): number => {
    if (jornadaData.jornada?.numero) return jornadaData.jornada.numero;
    // Intentar extraer del nombre (ej: "2nd Phase - 2" -> 2)
    if (jornadaData.jornada?.nombre) {
      const match = jornadaData.jornada.nombre.match(/- (\d+)$/);
      if (match) return parseInt(match[1]);
    }
    return jornadaData.jornada?.id || 0;
  };

  useEffect(() => {
    const loadHistorial = async () => {
      try {
        setLoading(true);

        // Primero obtener mi equipo
        const equipoRes = await fetch(
          'http://localhost:3000/api/equipos/mi-equipo',
          {
            credentials: 'include',
          }
        );

        if (!equipoRes.ok) {
          throw new Error('No se pudo obtener el equipo');
        }

        const equipoData = await equipoRes.json();
        const equipoId = equipoData?.data?.id || equipoData?.id;

        if (!equipoId) {
          throw new Error('No tienes un equipo registrado');
        }

        setMiEquipoId(equipoId);

        // Obtener historial del equipo
        const historialRes = await fetch(
          `http://localhost:3000/api/equipos/${equipoId}/historial`,
          {
            credentials: 'include',
          }
        );

        const historialData = await historialRes.json();
        setHistorial(historialData?.data || historialData);
      } catch (err) {
        console.error('Error al cargar historial:', err);
        setError(
          err instanceof Error ? err.message : 'Error al cargar historial'
        );
      } finally {
        setLoading(false);
      }
    };

    loadHistorial();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 p-8 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin text-6xl mb-4">⚽</div>
          <p className="text-xl">Cargando historial...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-500 text-white p-6 rounded-lg">
            <h2 className="text-2xl font-bold mb-2">Error</h2>
            <p>{error}</p>
            <button
              onClick={() => navigate('/jornadas')}
              className="mt-4 px-4 py-2 bg-white text-red-500 rounded-lg font-semibold"
            >
              Volver a Jornadas
            </button>
          </div>
        </div>
      </div>
    );
  }

  const jornadas = historial?.jornadas || [];
  const puntajeTotal = jornadas.reduce((sum, j) => sum + j.puntajeTotal, 0);
  const promedio =
    jornadas.length > 0 ? Math.round(puntajeTotal / jornadas.length) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="text-white hover:text-gray-300 mb-4 flex items-center gap-2"
          >
            ← Volver
          </button>
          <h1 className="text-4xl font-bold text-white mb-4">
            📊 Mi Historial de Puntos
          </h1>
        </div>

        {/* Resumen */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-yellow-600 to-orange-600 rounded-xl p-6 shadow-lg border-2 border-white/20">
            <p className="text-white/80 text-sm mb-2">Puntos Totales</p>
            <p className="text-white text-5xl font-bold">{puntajeTotal}</p>
          </div>
          <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl p-6 shadow-lg border-2 border-white/20">
            <p className="text-white/80 text-sm mb-2">Jornadas Jugadas</p>
            <p className="text-white text-5xl font-bold">{jornadas.length}</p>
          </div>
          <div className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl p-6 shadow-lg border-2 border-white/20">
            <p className="text-white/80 text-sm mb-2">Promedio</p>
            <p className="text-white text-5xl font-bold">{promedio}</p>
          </div>
        </div>

        {/* Historial */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-6">
            📅 Historial por Jornada
          </h2>

          {jornadas.length === 0 ? (
            <div className="text-center text-gray-400 py-12">
              <p className="text-xl mb-4">
                📋 Aún no tienes puntos registrados
              </p>
              <p className="text-sm">
                Las jornadas deben ser procesadas por un administrador para que
                aparezcan tus puntos aquí.
              </p>
              <p className="text-sm mt-2">
                Mientras tanto, puedes ver las jornadas disponibles y configurar
                tu equipo.
              </p>
              <button
                onClick={() => navigate('/jornadas')}
                className="mt-6 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold"
              >
                Ver Jornadas Disponibles
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {jornadas
                .sort((a, b) => (b.jornada?.id || 0) - (a.jornada?.id || 0)) // Más reciente primero
                .map((jornadaData) => (
                  <div
                    key={jornadaData.jornada?.id}
                    className="bg-black/30 rounded-lg p-4 border border-white/10 hover:border-white/30 transition-all cursor-pointer"
                    onClick={() =>
                      navigate(
                        `/equipos/${miEquipoId}/jornadas/${jornadaData.jornada?.id}`
                      )
                    }
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-gray-400 text-xs mb-1">
                          Jornada #{getNumeroJornada(jornadaData)}
                        </div>
                        <h3 className="text-white font-bold text-lg">
                          {jornadaData.jornada?.nombre ||
                            `Jornada ${getNumeroJornada(jornadaData)}`}
                        </h3>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-gray-400 text-sm">Puntos</p>
                          <p className="text-yellow-400 text-3xl font-bold">
                            {jornadaData.puntajeTotal?.toFixed(1) || 0}
                          </p>
                        </div>
                        <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold">
                          Ver Detalle →
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MisPuntosHistorial;
