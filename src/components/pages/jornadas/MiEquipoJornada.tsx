import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  jornadasService,
  equiposService,
  type Jornada,
  type PuntajeEquipo,
} from '../../../services/jornadasService';

const MiEquipoJornada = () => {
  const { jornadaId } = useParams<{ jornadaId: string }>();
  const navigate = useNavigate();
  const [jornada, setJornada] = useState<Jornada | null>(null);
  const [puntajes, setPuntajes] = useState<PuntajeEquipo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (jornadaId) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jornadaId]);

  const loadData = async () => {
    if (!jornadaId) return;

    try {
      setLoading(true);

      // Cargar información de la jornada
      const jornadaData = await jornadasService.getJornadaById(
        Number(jornadaId)
      );
      setJornada(jornadaData);

      // Obtener mi equipo
      const miEquipo = await equiposService.getMiEquipoConPuntos();
      
      if (miEquipo && typeof miEquipo === 'object' && 'id' in miEquipo) {
        const equipoId = (miEquipo as { id: number }).id;

        // Cargar puntajes del equipo para esta jornada
        const puntajesData = await equiposService.getPuntajesEquipoJornada(
          equipoId,
          Number(jornadaId)
        );
        setPuntajes(puntajesData);
      }

      setError(null);
    } catch (err) {
      setError('Error al cargar datos de la jornada');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !jornada) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 p-8 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin text-6xl mb-4">⚽</div>
          <p className="text-xl">Cargando información...</p>
        </div>
      </div>
    );
  }

  if (error || !jornada) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-500 text-white p-6 rounded-lg">
            <h2 className="text-2xl font-bold mb-2">Error</h2>
            <p>{error || 'No se pudo cargar la información'}</p>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <button
              onClick={() => navigate('/jornadas')}
              className="text-white hover:text-gray-300 mb-4 flex items-center gap-2"
            >
              ← Volver a Jornadas
            </button>
            <h1 className="text-4xl font-bold text-white">
              🏆 Mi Equipo - {jornada.nombre || `Jornada ${jornada.numero || jornada.id}`}
            </h1>
            <div className="mt-2 space-y-1">
              {jornada.temporada && (
                <p className="text-gray-300">
                  Temporada: {jornada.temporada}
                </p>
              )}
              {jornada.etapa && (
                <p className="text-gray-300">
                  Etapa: {jornada.etapa}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold disabled:opacity-50"
          >
            🔄 Recargar
          </button>
        </div>

        {/* Resumen de Puntos */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 mb-8 border border-white/20">
          <div className="text-center">
            <p className="text-gray-300 text-lg mb-2">Puntaje Total</p>
            <p className="text-7xl font-bold text-yellow-400 mb-4">
              {puntajes?.puntajeTotal || 0}
            </p>
            <div className="flex items-center justify-center gap-4">
              {jornada.activa && (
                <span className="px-4 py-2 bg-green-500 text-white font-bold rounded-full">
                  🟢 Jornada Activa
                </span>
              )}
              {jornada.puntosCalculados && (
                <span className="px-4 py-2 bg-blue-500 text-white font-bold rounded-full">
                  ✓ Puntos Calculados
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Lista de Jugadores y sus Puntos */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-6">
            ⚽ Puntos por Jugador
          </h2>

          {!puntajes || puntajes.jugadores.length === 0 ? (
            <div className="text-center text-gray-400 py-12">
              {jornada.puntosCalculados
                ? 'No hay puntos registrados para tu equipo en esta jornada'
                : '⏳ Los puntos aún no han sido calculados para esta jornada'}
            </div>
          ) : (
            <div className="space-y-3">
              {puntajes.jugadores
                .sort((a, b) => b.puntos - a.puntos)
                .map((jugador, index) => (
                  <div
                    key={jugador.jugadorId}
                    className="bg-black/30 rounded-lg p-5 border border-white/10 hover:border-white/30 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="bg-indigo-600 w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg">
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-white font-semibold text-lg">
                            {jugador.nombre}
                          </p>
                          <p className="text-gray-400 text-sm">
                            ID: {jugador.jugadorId}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-400 text-sm mb-1">Puntos</p>
                        <div className="px-6 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg">
                          <span className="text-2xl font-bold text-white">
                            {jugador.puntos}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}

          {puntajes && puntajes.jugadores.length > 0 && (
            <div className="mt-6 pt-6 border-t border-white/20">
              <div className="flex justify-between items-center">
                <p className="text-gray-300 text-lg">
                  Total de jugadores: {puntajes.jugadores.length}
                </p>
                <p className="text-white text-lg">
                  Promedio:{' '}
                  <span className="font-bold text-yellow-400">
                    {Math.round(
                      puntajes.puntajeTotal / puntajes.jugadores.length
                    )}
                  </span>{' '}
                  puntos por jugador
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Información adicional */}
        {(jornada.fechaInicio || jornada.fechaFin) && (
          <div className="mt-8 bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4">
              📅 Información de la Jornada
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {jornada.fechaInicio && (
                <div>
                  <p className="text-gray-300 text-sm">Fecha de Inicio</p>
                  <p className="text-white font-semibold">
                    {new Date(jornada.fechaInicio).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              )}
              {jornada.fechaFin && (
                <div>
                  <p className="text-gray-300 text-sm">Fecha de Fin</p>
                  <p className="text-white font-semibold">
                    {new Date(jornada.fechaFin).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MiEquipoJornada;
