import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  jornadasService,
  estadisticasService,
  adminService,
  type Jornada,
  type EstadisticaJugador,
} from '../../../services/jornadasService';
import axios from 'axios';

interface Partido {
  id: number;
  id_api: number;
  fecha: string;
  estado: string;
  estado_detalle: string;
  estadio?: string;
  jornadaId: number;
  localId: number;
  visitanteId: number;
  local?: { nombre: string; escudo?: string };
  visitante?: { nombre: string; escudo?: string };
}

const DetalleJornada = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [jornada, setJornada] = useState<Jornada | null>(null);
  const [puntajes, setPuntajes] = useState<EstadisticaJugador[]>([]);
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [esJornadaActiva, setEsJornadaActiva] = useState(false);
  const [modificacionesHabilitadas, setModificacionesHabilitadas] =
    useState(false);
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    if (id) {
      loadJornadaData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadJornadaData = async () => {
    if (!id) return;

    try {
      setLoading(true);

      // Cargar jornada
      const jornadaData = await jornadasService.getJornadaById(Number(id));
      setJornada(jornadaData);

      // Cargar configuración para saber si esta jornada está activa
      try {
        // Intentar primero con el servicio de admin
        const config = await adminService.getConfig();
        console.log('📊 Config obtenida:', config);

        // Verificar si esta jornada es la activa
        const esActiva = config.jornadaActiva === Number(id);
        console.log(
          `🎯 Jornada ${id} es activa: ${esActiva} (jornadaActiva: ${config.jornadaActiva})`
        );

        setEsJornadaActiva(esActiva);
        setModificacionesHabilitadas(config.modificacionesHabilitadas);
      } catch (configError) {
        console.warn(
          '⚠️ Error al cargar configuración desde admin, intentando endpoints públicos:',
          configError
        );

        // Fallback: Usar endpoints públicos
        try {
          const [jornadaActivaRes, estadoModsRes] = await Promise.all([
            fetch('http://localhost:3000/api/config/jornada-activa', {
              credentials: 'include',
            }),
            fetch('http://localhost:3000/api/config/estado-modificaciones', {
              credentials: 'include',
            }),
          ]);

          const jornadaActivaData = await jornadaActivaRes.json();
          const estadoModsData = await estadoModsRes.json();

          console.log('📊 Jornada activa data:', jornadaActivaData);
          console.log('📊 Estado modificaciones data:', estadoModsData);

          const jornadaActivaId = jornadaActivaData?.data?.jornada?.id || null;
          const modsHabilitadas =
            estadoModsData?.data?.modificacionesHabilitadas || false;

          const esActiva = jornadaActivaId === Number(id);
          console.log(
            `🎯 Jornada ${id} es activa: ${esActiva} (jornadaActivaId: ${jornadaActivaId})`
          );

          setEsJornadaActiva(esActiva);
          setModificacionesHabilitadas(modsHabilitadas);
        } catch (fallbackError) {
          console.error(
            '❌ Error al cargar configuración desde endpoints públicos:',
            fallbackError
          );
          setEsJornadaActiva(false);
          setModificacionesHabilitadas(false);
        }
      }

      // Cargar puntajes
      const puntajesData = await estadisticasService.getPuntajesJornada(
        Number(id)
      );
      console.log('📊 Puntajes recibidos:', puntajesData);
      setPuntajes(Array.isArray(puntajesData) ? puntajesData : []);

      // Cargar partidos de esta jornada
      try {
        const partidosRes = await fetch(
          `http://localhost:3000/partidos?jornadaId=${id}`,
          {
            credentials: 'include',
          }
        );
        const partidosData = await partidosRes.json();
        setPartidos(
          Array.isArray(partidosData) ? partidosData : partidosData?.data || []
        );
      } catch (partidosError) {
        console.warn('No se pudieron cargar los partidos:', partidosError);
        setPartidos([]);
      }

      setError(null);
    } catch (err) {
      setError('Error al cargar datos de la jornada');
      console.error(err);
      setPuntajes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleProcesarJornada = async () => {
    if (
      !id ||
      !confirm(
        '¿Estás seguro de procesar esta jornada? Esto calculará los puntos de todos los jugadores.'
      )
    )
      return;

    try {
      setProcesando(true);
      setError(null);
      const response = await fetch(
        `http://localhost:3000/api/admin/jornadas/${id}/procesar`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ activarJornada: true }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setSuccess(`✅ ${data.message || 'Jornada procesada correctamente'}`);
        await loadJornadaData(); // Recargar datos
        setTimeout(() => setSuccess(null), 5000);
      } else {
        setError(`❌ ${data.message || 'Error al procesar jornada'}`);
        setTimeout(() => setError(null), 5000);
      }
    } catch (err) {
      console.error('Error al procesar jornada:', err);
      setError('❌ Error al procesar jornada');
      setTimeout(() => setError(null), 5000);
    } finally {
      setProcesando(false);
    }
  };

  const handleRecalcularPuntajes = async () => {
    if (
      !id ||
      !confirm('¿Estás seguro de recalcular los puntajes de esta jornada?')
    )
      return;

    try {
      setProcesando(true);
      setError(null);
      const response = await fetch(
        `http://localhost:3000/api/admin/jornadas/${id}/recalcular`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        }
      );

      const data = await response.json();

      if (response.ok) {
        setSuccess(
          `✅ ${data.message || 'Puntajes recalculados correctamente'}`
        );
        await loadJornadaData(); // Recargar datos
        setTimeout(() => setSuccess(null), 5000);
      } else {
        setError(`❌ ${data.message || 'Error al recalcular puntajes'}`);
        setTimeout(() => setError(null), 5000);
      }
    } catch (err) {
      console.error('Error al recalcular puntajes:', err);
      setError('❌ Error al recalcular puntajes');
      setTimeout(() => setError(null), 5000);
    } finally {
      setProcesando(false);
    }
  };

  if (loading && !jornada) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 p-8 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin text-6xl mb-4">⚽</div>
          <p className="text-xl">Cargando jornada...</p>
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
            <p>{error || 'No se pudo cargar la jornada'}</p>
            <button
              onClick={() => navigate(-1)}
              className="mt-4 px-4 py-2 bg-white text-red-500 rounded-lg font-semibold"
            >
              Volver
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
              onClick={() => navigate(-1)}
              className="text-white hover:text-gray-300 mb-4 flex items-center gap-2"
            >
              ← Volver
            </button>
            <h1 className="text-4xl font-bold text-white">
              📊 {jornada.nombre || `Jornada ${jornada.numero || jornada.id}`}
            </h1>
            <div className="mt-2 space-y-1">
              {jornada.temporada && (
                <p className="text-gray-300">Temporada: {jornada.temporada}</p>
              )}
              {jornada.etapa && (
                <p className="text-gray-300">Etapa: {jornada.etapa}</p>
              )}
            </div>
          </div>
          <button
            onClick={loadJornadaData}
            disabled={loading}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold disabled:opacity-50"
          >
            🔄 Recargar
          </button>
        </div>

        {/* Estado de la Jornada */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <p className="text-gray-300 text-sm mb-2">Estado</p>
            <p
              className={`text-2xl font-bold ${
                esJornadaActiva ? 'text-green-400' : 'text-gray-400'
              }`}
            >
              {esJornadaActiva ? '🟢 Activa' : '⚪ Inactiva'}
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <p className="text-gray-300 text-sm mb-2">Modificaciones</p>
            <p
              className={`text-2xl font-bold ${
                modificacionesHabilitadas ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {modificacionesHabilitadas ? '✓ Permitidas' : '🔒 Bloqueadas'}
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <p className="text-gray-300 text-sm mb-2">Puntos</p>
            <p
              className={`text-2xl font-bold ${
                jornada.puntosCalculados ? 'text-blue-400' : 'text-yellow-400'
              }`}
            >
              {jornada.puntosCalculados ? '✓ Calculados' : '⏳ Pendientes'}
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <p className="text-gray-300 text-sm mb-2">Jugadores</p>
            <p className="text-2xl font-bold text-white">{puntajes.length}</p>
          </div>
        </div>

        {/* Fechas */}
        {(jornada.fechaInicio || jornada.fechaFin) && (
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 mb-8 border border-white/20">
            <h2 className="text-xl font-bold text-white mb-4">📅 Fechas</h2>
            <div className="grid grid-cols-2 gap-4">
              {jornada.fechaInicio && (
                <div>
                  <p className="text-gray-300 text-sm">Inicio</p>
                  <p className="text-white font-semibold">
                    {new Date(jornada.fechaInicio).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              )}
              {jornada.fechaFin && (
                <div>
                  <p className="text-gray-300 text-sm">Fin</p>
                  <p className="text-white font-semibold">
                    {new Date(jornada.fechaFin).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mensajes de Éxito/Error */}
        {success && (
          <div className="bg-green-600 text-white p-4 rounded-lg mb-6 flex items-center justify-between animate-pulse">
            <span className="font-semibold">{success}</span>
            <button onClick={() => setSuccess(null)} className="text-2xl">
              ✕
            </button>
          </div>
        )}
        {error && (
          <div className="bg-red-600 text-white p-4 rounded-lg mb-6 flex items-center justify-between animate-pulse">
            <span className="font-semibold">{error}</span>
            <button onClick={() => setError(null)} className="text-2xl">
              ✕
            </button>
          </div>
        )}

        {/* Botones de Acción (Solo para Admins) */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 mb-8 border border-white/20">
          <h2 className="text-xl font-bold text-white mb-4">
            ⚙️ Acciones de Administrador
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={handleProcesarJornada}
              disabled={procesando || loading}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {procesando ? '⏳ Procesando...' : '⚡ Procesar Jornada'}
            </button>
            <button
              onClick={handleRecalcularPuntajes}
              disabled={procesando || loading}
              className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {procesando ? '⏳ Recalculando...' : '🔄 Recalcular Puntajes'}
            </button>
          </div>
        </div>

        {/* Partidos de la Jornada */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 mb-8 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-6">
            ⚽ Partidos de la Jornada
          </h2>
          {partidos.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              No hay partidos registrados para esta jornada
            </div>
          ) : (
            <div className="space-y-4">
              {partidos.map((partido) => (
                <div
                  key={partido.id}
                  className="bg-black/30 rounded-lg p-4 border border-white/10 hover:border-white/30 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-gray-400 text-sm mb-2">
                        {new Date(partido.fecha).toLocaleString('es-ES', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                      <div className="flex items-center gap-4">
                        <div className="flex-1 text-right">
                          <p className="text-white font-semibold">
                            {partido.local?.nombre || `Club ${partido.localId}`}
                          </p>
                        </div>
                        <div className="px-4 py-2 bg-indigo-600 rounded-lg">
                          <p className="text-white font-bold text-sm">VS</p>
                        </div>
                        <div className="flex-1">
                          <p className="text-white font-semibold">
                            {partido.visitante?.nombre ||
                              `Club ${partido.visitanteId}`}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="ml-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          partido.estado === 'FT'
                            ? 'bg-green-600 text-white'
                            : partido.estado === 'LIVE'
                            ? 'bg-red-600 text-white animate-pulse'
                            : 'bg-gray-600 text-white'
                        }`}
                      >
                        {partido.estado_detalle || partido.estado}
                      </span>
                    </div>
                  </div>
                  {partido.estadio && (
                    <p className="text-gray-400 text-sm mt-2">
                      🏟️ {partido.estadio}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tabla de Puntajes */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-6">
            🏆 Puntajes de Jugadores
          </h2>

          {puntajes.length === 0 ? (
            <div className="text-center text-gray-400 py-12">
              <p className="text-lg mb-2">
                ⚠️ No hay puntajes registrados para esta jornada
              </p>
              <p className="text-sm">
                {esJornadaActiva
                  ? "Usa el botón 'Procesar Jornada' arriba para calcular los puntos"
                  : 'Esta jornada aún no ha sido procesada'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-white">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-left py-3 px-4">#</th>
                    <th className="text-left py-3 px-4">Jugador ID</th>
                    <th className="text-right py-3 px-4">Puntos</th>
                    <th className="text-right py-3 px-4">Goles</th>
                    <th className="text-right py-3 px-4">Asistencias</th>
                    <th className="text-right py-3 px-4">Minutos</th>
                    <th className="text-right py-3 px-4">TA</th>
                    <th className="text-right py-3 px-4">TR</th>
                  </tr>
                </thead>
                <tbody>
                  {puntajes
                    .sort((a, b) => b.puntos - a.puntos)
                    .map((puntaje, index) => (
                      <tr
                        key={`${puntaje.jugadorId}-${puntaje.jornadaId}`}
                        className="border-b border-white/10 hover:bg-white/5 transition-colors"
                      >
                        <td className="py-3 px-4 font-bold">{index + 1}</td>
                        <td className="py-3 px-4">{puntaje.jugadorId}</td>
                        <td className="py-3 px-4 text-right">
                          <span className="px-3 py-1 bg-indigo-600 rounded-full font-bold">
                            {puntaje.puntos}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {puntaje.goles || 0}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {puntaje.asistencias || 0}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {puntaje.minutosJugados || 0}'
                        </td>
                        <td className="py-3 px-4 text-right">
                          {puntaje.tarjetasAmarillas ? (
                            <span className="text-yellow-400">
                              {puntaje.tarjetasAmarillas}
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {puntaje.tarjetasRojas ? (
                            <span className="text-red-400">
                              {puntaje.tarjetasRojas}
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DetalleJornada;
