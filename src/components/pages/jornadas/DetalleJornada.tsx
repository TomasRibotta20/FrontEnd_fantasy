import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  jornadasService,
  estadisticasService,
  adminService,
  type Jornada,
  type EstadisticaJugador,
} from '../../../services/jornadasService';

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
    if (!id) {
      console.error('❌ No hay ID de jornada');
      return;
    }

    console.log('🔄 Iniciando carga de jornada:', id);

    try {
      setLoading(true);

      // Cargar jornada
      console.log('📥 Cargando datos de la jornada...');
      const jornadaData = await jornadasService.getJornadaById(Number(id));
      console.log('✅ Jornada cargada:', jornadaData);
      setJornada(jornadaData);

      // Cargar configuración para saber si esta jornada está activa
      try {
        // Intentar primero con el servicio de admin
        const config = await adminService.getConfig();
        console.log('📊 Config obtenida:', config);
        console.log('📊 Config jornadaActiva tipo:', typeof config.jornadaActiva);
        console.log('📊 Config jornadaActiva valor:', config.jornadaActiva);

        // Verificar si esta jornada es la activa
        // jornadaActiva puede ser un número o un objeto con id
        const jornadaActivaId = typeof config.jornadaActiva === 'object' && config.jornadaActiva !== null
          ? (config.jornadaActiva as { id: number }).id
          : config.jornadaActiva;
        
        const esActiva = jornadaActivaId === Number(id);
        console.log(
          `🎯 Jornada ${id} es activa: ${esActiva} (jornadaActivaId extraído: ${jornadaActivaId})`
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
      try {
        const puntajesData = await estadisticasService.getPuntajesJornada(
          Number(id)
        );
        
        // Asegurarse de que sea un array
        const puntajesArray = Array.isArray(puntajesData) ? puntajesData : [];
        
        console.log('📊 ========== RESUMEN DE PUNTAJES ==========');
        console.log(`📊 Total de jugadores con estadísticas: ${puntajesArray.length}`);
        
        if (puntajesArray.length > 0) {
          const totalPuntos = puntajesArray.reduce((sum, p) => sum + (p.puntaje_total || 0), 0);
          const promedio = totalPuntos / puntajesArray.length;
          const maxPuntos = Math.max(...puntajesArray.map(p => p.puntaje_total || 0));
          const jugadoresConPuntos = puntajesArray.filter(p => (p.puntaje_total || 0) > 0).length;
          
          console.log(`📊 Jugadores con puntos > 0: ${jugadoresConPuntos}`);
          console.log(`📊 Puntos totales: ${totalPuntos.toFixed(1)}`);
          console.log(`📊 Promedio de puntos: ${promedio.toFixed(2)}`);
          console.log(`📊 Puntaje máximo: ${maxPuntos.toFixed(1)}`);
          console.log('📊 Top 5 jugadores:');
          puntajesArray
            .sort((a, b) => (b.puntaje_total || 0) - (a.puntaje_total || 0))
            .slice(0, 5)
            .forEach((p, i) => {
              console.log(`  ${i + 1}. ${p.jugador?.name || 'Desconocido'} (ID ${p.jugador?.id || 'N/A'}): ${(p.puntaje_total || 0).toFixed(1)} pts`);
            });
        } else {
          console.log('⚠️ No hay puntajes registrados para esta jornada');
        }
        console.log('📊 ==========================================');
        
        setPuntajes(puntajesArray);
      } catch (puntajesError) {
        console.warn('⚠️ Error al cargar puntajes:', puntajesError);
        setPuntajes([]);
      }

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 pt-20 pb-8 px-8 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin text-6xl mb-4">⚽</div>
          <p className="text-xl">Cargando jornada...</p>
          <p className="text-sm text-gray-300 mt-2">ID: {id}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 pt-20 pb-8 px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-500 text-white p-6 rounded-lg">
            <h2 className="text-2xl font-bold mb-2">❌ Error</h2>
            <p className="mb-4">{error}</p>
            <div className="bg-red-700 p-3 rounded text-sm mb-4">
              <p className="font-mono">Jornada ID: {id}</p>
              <p className="font-mono mt-1">
                Verifica que el backend esté corriendo en http://localhost:3000
              </p>
            </div>
            <button
              onClick={() => navigate(-1)}
              className="mt-4 px-4 py-2 bg-white text-red-500 rounded-lg font-semibold hover:bg-gray-100"
            >
              ← Volver
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!jornada) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 pt-20 pb-8 px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-yellow-500 text-black p-6 rounded-lg">
            <h2 className="text-2xl font-bold mb-2">⚠️ Jornada no encontrada</h2>
            <p className="mb-4">No se pudo cargar la información de la jornada {id}</p>
            <button
              onClick={() => navigate(-1)}
              className="mt-4 px-4 py-2 bg-black text-yellow-500 rounded-lg font-semibold hover:bg-gray-900"
            >
              ← Volver
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 pt-20 pb-8 px-8">
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
                puntajes.length > 0 ? 'text-blue-400' : 'text-yellow-400'
              }`}
            >
              {puntajes.length > 0 ? '✓ Calculados' : '⏳ Pendientes'}
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <p className="text-gray-300 text-sm mb-2">Jugadores con Puntos</p>
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

        {/* Estadísticas Resumidas */}
        {puntajes && puntajes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
              <p className="text-gray-300 text-sm mb-1">Total Jugadores</p>
              <p className="text-2xl font-bold text-white">{puntajes.length}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
              <p className="text-gray-300 text-sm mb-1">Puntos Totales</p>
              <p className="text-2xl font-bold text-yellow-400">
                {puntajes.reduce((sum, p) => sum + (p.puntaje_total || 0), 0).toFixed(1)}
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
              <p className="text-gray-300 text-sm mb-1">Goles Totales</p>
              <p className="text-2xl font-bold text-green-400">
                {puntajes.reduce((sum, p) => sum + (p.goles || 0), 0)}
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
              <p className="text-gray-300 text-sm mb-1">Asistencias Totales</p>
              <p className="text-2xl font-bold text-blue-400">
                {puntajes.reduce((sum, p) => sum + (p.asistencias || 0), 0)}
              </p>
            </div>
          </div>
        )}

        {/* Tabla de Puntajes */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">
              🏆 Top 20 Mejores Puntajes
            </h2>
            {puntajes.length > 20 && (
              <p className="text-gray-400 text-sm">
                Mostrando 20 de {puntajes.length} jugadores
              </p>
            )}
          </div>

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
                    <th className="text-left py-3 px-4">Jugador</th>
                    <th className="text-left py-3 px-4">Pos</th>
                    <th className="text-right py-3 px-4">Puntos</th>
                    <th className="text-right py-3 px-4">Rating</th>
                    <th className="text-right py-3 px-4">Goles</th>
                    <th className="text-right py-3 px-4">Asist.</th>
                    <th className="text-right py-3 px-4">Min</th>
                    <th className="text-right py-3 px-4">TA</th>
                    <th className="text-right py-3 px-4">TR</th>
                  </tr>
                </thead>
                <tbody>
                  {puntajes
                    .sort((a, b) => (b.puntaje_total || 0) - (a.puntaje_total || 0))
                    .slice(0, 20) // Mostrar solo los 20 primeros
                    .map((puntaje, index) => (
                      <tr
                        key={`${puntaje.id}`}
                        className={`border-b border-white/10 hover:bg-white/5 transition-colors ${
                          index < 3 ? 'bg-yellow-500/10' : ''
                        }`}
                      >
                        <td className="py-3 px-4">
                          <span className={`font-bold ${
                            index === 0 ? 'text-yellow-400 text-xl' :
                            index === 1 ? 'text-gray-300 text-lg' :
                            index === 2 ? 'text-orange-400' :
                            'text-white'
                          }`}>
                            {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {puntaje.jugador?.photo && (
                              <img
                                src={puntaje.jugador.photo}
                                alt={puntaje.jugador.name}
                                className="w-8 h-8 rounded-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            )}
                            <div>
                              <p className="font-medium">{puntaje.jugador?.name || 'Desconocido'}</p>
                              <p className="text-xs text-gray-400">ID: {puntaje.jugador?.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-300">{puntaje.posicion || '-'}</td>
                        <td className="py-3 px-4 text-right">
                          <span className={`px-3 py-1 rounded-full font-bold ${
                            (puntaje.puntaje_total || 0) >= 10 ? 'bg-green-600' :
                            (puntaje.puntaje_total || 0) >= 7 ? 'bg-blue-600' :
                            (puntaje.puntaje_total || 0) >= 5 ? 'bg-indigo-600' :
                            'bg-gray-600'
                          }`}>
                            {(puntaje.puntaje_total || 0).toFixed(1)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-gray-300">
                          {puntaje.rating ? puntaje.rating.toFixed(1) : '-'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {puntaje.goles ? (
                            <span className="text-green-400 font-bold">⚽ {puntaje.goles}</span>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {puntaje.asistencias ? (
                            <span className="text-blue-400 font-bold">🎯 {puntaje.asistencias}</span>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right text-gray-300">
                          {puntaje.minutos || 0}'
                        </td>
                        <td className="py-3 px-4 text-right">
                          {puntaje.tarjetas_amarillas ? (
                            <span className="text-yellow-400 font-bold">
                              🟨 {puntaje.tarjetas_amarillas}
                            </span>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {puntaje.tarjetas_rojas ? (
                            <span className="text-red-400 font-bold">
                              🟥 {puntaje.tarjetas_rojas}
                            </span>
                          ) : (
                            <span className="text-gray-500">-</span>
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
