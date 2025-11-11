import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  jornadasService,
  equiposService,
  type Jornada,
  type HistorialEquipo,
} from '../../../services/jornadasService';
import EndpointNoDisponible from '../../common/EndpointNoDisponible';

const JornadasUsuario = () => {
  const navigate = useNavigate();
  const [jornadas, setJornadas] = useState<Jornada[]>([]);
  const [historial, setHistorial] = useState<HistorialEquipo | null>(null);
  const [selectedTemporada, setSelectedTemporada] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [equipoId, setEquipoId] = useState<number | null>(null);
  const [endpointNoDisponible, setEndpointNoDisponible] = useState(false);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTemporada]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Cargar jornadas
      const jornadasData = await jornadasService.getJornadas(
        selectedTemporada || undefined
      );
      console.log('📅 Jornadas cargadas:', jornadasData);
      // Asegurarnos que sea un array
      setJornadas(Array.isArray(jornadasData) ? jornadasData : []);

      // Obtener mi equipo para tener el ID
      try {
        const miEquipo = await equiposService.getMiEquipoConPuntos();
        console.log('👤 Mi equipo:', miEquipo);

        if (miEquipo && typeof miEquipo === 'object' && 'id' in miEquipo) {
          const id = (miEquipo as { id: number }).id;
          setEquipoId(id);
          console.log('🆔 ID del equipo:', id);

          // Cargar historial
          try {
            const historialData = await equiposService.getHistorialEquipo(id);
            console.log('📊 Historial recibido completo:', historialData);
            console.log('📊 Número de jornadas en historial:', historialData?.jornadas?.length);
            
            if (historialData?.jornadas && Array.isArray(historialData.jornadas)) {
              historialData.jornadas.forEach((j, idx) => {
                console.log(`  📌 Jornada ${idx + 1}:`, {
                  jornadaId: j.jornada?.id,
                  puntajeTotal: j.puntajeTotal,
                  nombre: j.jornada?.nombre
                });
              });
            }
            
            setHistorial(historialData);
          } catch (historialErr) {
            console.warn('⚠️ Historial no disponible:', historialErr);
            setHistorial({ jornadas: [] });
          }
        }
      } catch (equipoErr) {
        console.warn('⚠️ Error al obtener equipo:', equipoErr);
      }

      setError(null);
    } catch (err) {
      console.error('❌ Error en loadData:', err);
      // Establecer arrays vacíos en caso de error
      setJornadas([]);
      setHistorial({ jornadas: [] });
      // Si es un error 404 o 403, mostrar componente de endpoint no disponible
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { status: number } };
        if (
          axiosError.response?.status === 404 ||
          axiosError.response?.status === 403
        ) {
          setEndpointNoDisponible(true);
          return;
        }
      }
      setError(
        'Error al cargar jornadas. Verifica que el backend esté corriendo.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Si el endpoint no está disponible, mostrar componente especial
  if (endpointNoDisponible) {
    return (
      <EndpointNoDisponible mensaje="El sistema de jornadas aún no está configurado en el backend" />
    );
  }

  const getPuntajeJornada = (jornadaId: number): number => {
    if (!historial || !historial.jornadas || !Array.isArray(historial.jornadas)) {
      console.log(`⚠️ No hay historial para jornada ${jornadaId}`);
      return 0;
    }
    
    // La estructura real es: jornadas[].jornada.id, no jornadaId
    const jornadaData = historial.jornadas.find(
      (j) => {
        // Manejar tanto j.jornada.id como j.jornadaId (por si acaso el backend cambia)
        const id = j.jornada?.id || (j as { jornadaId?: number }).jornadaId;
        const match = id === jornadaId;
        if (match) {
          console.log(`✅ Match encontrado para jornada ${jornadaId}:`, j);
        }
        return match;
      }
    );
    
    const puntaje = jornadaData?.puntajeTotal || 0;
    console.log(`🎯 Puntaje final para jornada ${jornadaId}:`, puntaje);
    
    return puntaje;
  };

  const puntajeTotal =
    historial?.jornadas && Array.isArray(historial.jornadas)
      ? historial.jornadas.reduce((sum, j) => sum + (j.puntajeTotal || 0), 0)
      : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 pt-24 pb-8 px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">
          📅 Mis Jornadas y Puntos
        </h1>

        {error && (
          <div className="bg-red-500 text-white p-4 rounded-lg mb-6 flex items-center justify-between">
            <span>❌ {error}</span>
            <button onClick={() => setError(null)} className="font-bold">
              ✕
            </button>
          </div>
        )}

        {/* Resumen de Puntos */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 mb-8 border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white">🏆 Tu Rendimiento</h2>
            <button
              onClick={() => navigate('/mis-puntos/historial')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold flex items-center gap-2"
            >
              Ver Historial Completo →
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-black/30 p-6 rounded-lg text-center">
              <p className="text-gray-300 text-sm mb-2">Puntos Totales</p>
              <p className="text-4xl font-bold text-yellow-400">
                {puntajeTotal.toFixed(1)}
              </p>
            </div>
            <div className="bg-black/30 p-6 rounded-lg text-center">
              <p className="text-gray-300 text-sm mb-2">Jornadas Jugadas</p>
              <p className="text-4xl font-bold text-blue-400">
                {historial?.jornadas.length || 0}
              </p>
            </div>
            <div className="bg-black/30 p-6 rounded-lg text-center">
              <p className="text-gray-300 text-sm mb-2">Promedio por Jornada</p>
              <p className="text-4xl font-bold text-green-400">
                {historial && historial.jornadas.length > 0
                  ? (puntajeTotal / historial.jornadas.length).toFixed(1)
                  : 0}
              </p>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 mb-8 border border-white/20">
          <div className="flex gap-4 items-center">
            <input
              type="text"
              value={selectedTemporada}
              onChange={(e) => setSelectedTemporada(e.target.value)}
              placeholder="Filtrar por temporada (ej: 2021)"
              className="flex-1 px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-400"
            />
            <button
              onClick={loadData}
              disabled={loading}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold disabled:opacity-50"
            >
              🔄 Recargar
            </button>
          </div>
        </div>

        {/* Lista de Jornadas */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-6">
            📋 Todas las Jornadas
          </h2>

          {loading && jornadas.length === 0 ? (
            <div className="text-center text-white py-12">
              <div className="animate-spin text-6xl mb-4">⚽</div>
              <p>Cargando jornadas...</p>
            </div>
          ) : jornadas.length === 0 ? (
            <div className="text-center text-gray-400 py-12">
              No hay jornadas disponibles
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {jornadas
                .sort((a, b) => (a.numero || a.id) - (b.numero || b.id)) // Ordenar por número ascendente (de la 1 a la última)
                .map((jornada) => {
                  const miPuntaje = getPuntajeJornada(jornada.id);
                  const participe = miPuntaje > 0;
                  
                  // Verificar si esta jornada tiene puntos calculados
                  // Una jornada tiene puntos calculados si:
                  // 1. Está en mi historial (participé), O
                  // 2. Tiene el flag puntosCalculados en true (ya fue procesada por admin)
                  const estaEnHistorial = historial?.jornadas?.some(
                    (j) => j.jornada?.id === jornada.id
                  ) || false;
                  
                  const hayPuntosCalculados = estaEnHistorial || jornada.puntosCalculados || false;
                  
                  console.log(`📋 Jornada ${jornada.id}:`, {
                    miPuntaje,
                    participe,
                    estaEnHistorial,
                    puntosCalculados: jornada.puntosCalculados,
                    hayPuntosCalculados
                  });

                  return (
                    <div
                      key={jornada.id}
                      className={`bg-black/30 rounded-lg p-6 border-2 transition-all hover:scale-105 ${
                        jornada.activa
                          ? 'border-green-500 shadow-lg shadow-green-500/30'
                          : participe
                          ? 'border-blue-500/50'
                          : 'border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <div className="text-gray-400 text-xs mb-1">
                            Jornada #{jornada.numero || jornada.id}
                          </div>
                          <h3 className="text-xl font-bold text-white">
                            {jornada.nombre ||
                              `Jornada ${jornada.numero || jornada.id}`}
                          </h3>
                        </div>
                        {jornada.activa && (
                          <span className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full animate-pulse">
                            ACTIVA
                          </span>
                        )}
                      </div>

                      <div className="mb-3 space-y-1">
                        {jornada.temporada && (
                          <p className="text-gray-400 text-sm">
                            Temporada: {jornada.temporada}
                          </p>
                        )}
                        {jornada.etapa && (
                          <p className="text-gray-400 text-sm">
                            Etapa: {jornada.etapa}
                          </p>
                        )}
                      </div>

                      {participe ? (
                        <div className="bg-blue-600/30 rounded-lg p-4 border border-blue-500/50">
                          <p className="text-gray-300 text-sm mb-1">
                            Tus puntos
                          </p>
                          <p className="text-3xl font-bold text-yellow-400">
                            {miPuntaje.toFixed(1)}
                          </p>
                        </div>
                      ) : hayPuntosCalculados ? (
                        <div className="bg-gray-600/30 rounded-lg p-4 border border-gray-500/50">
                          <p className="text-gray-400 text-sm text-center">
                            No participaste
                          </p>
                        </div>
                      ) : (
                        <div className="bg-yellow-600/30 rounded-lg p-4 border border-yellow-500/50">
                          <p className="text-yellow-200 text-sm text-center">
                            ⏳ Puntos pendientes
                          </p>
                        </div>
                      )}

                      {participe && equipoId ? (
                        <button
                          onClick={() =>
                            navigate(
                              `/equipos/${equipoId}/jornadas/${jornada.id}`
                            )
                          }
                          className="w-full mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors"
                        >
                          Ver Mi Equipo →
                        </button>
                      ) : jornada.activa ? (
                        <button
                          onClick={() =>
                            navigate(`/jornadas/${jornada.id}/mi-equipo`)
                          }
                          className="w-full mt-4 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
                        >
                          Configurar Equipo →
                        </button>
                      ) : (
                        <button
                          disabled
                          className="w-full mt-4 px-4 py-2 bg-gray-600 text-gray-400 rounded-lg font-semibold cursor-not-allowed"
                        >
                          {hayPuntosCalculados
                            ? 'No participaste'
                            : 'Pendiente de procesar'}
                        </button>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JornadasUsuario;
