import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../../common/LoadingSpinner';
import {
  jornadasService,
  equiposService,
  estadisticasService,
  type Jornada,
  type HistorialEquipo,
} from '../../../services/jornadasService';
import EndpointNoDisponible from '../../common/EndpointNoDisponible';
import {
  useTorneoSeleccionado,
  useMiEquipoId,
} from '../../../hooks/useSessionData';

/** Página de jornadas del usuario. */
const JornadasUsuario = () => {
  const navigate = useNavigate();

  // Fuente única de verdad: hooks de sesión
  const [torneoId] = useTorneoSeleccionado();
  const [miEquipoId] = useMiEquipoId();

  const [jornadas, setJornadas] = useState<Jornada[]>([]);
  const [historial, setHistorial] = useState<HistorialEquipo | null>(null);
  const [selectedTemporada, setSelectedTemporada] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [equipoId, setEquipoId] = useState<number | null>(null);
  const [endpointNoDisponible, setEndpointNoDisponible] = useState(false);
  const [jornadasConEstadisticas, setJornadasConEstadisticas] = useState<
    Set<number>
  >(new Set());

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTemporada, torneoId, miEquipoId]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Cargar jornadas
      const jornadasData = await jornadasService.getJornadas(
        selectedTemporada || undefined,
      );
      // Asegurarnos que sea un array
      const jornadasArray = Array.isArray(jornadasData) ? jornadasData : [];
      setJornadas(jornadasArray);

      // Verificar qué jornadas tienen estadísticas calculadas
      const jornadasConStats = new Set<number>();
      await Promise.all(
        jornadasArray.map(async (jornada) => {
          try {
            const estadisticas = await estadisticasService.getPuntajesJornada(
              jornada.id,
            );
            if (estadisticas && estadisticas.length > 0) {
              jornadasConStats.add(jornada.id);
            }
          } catch {
            // error silenciado
          }
        }),
      );
      setJornadasConEstadisticas(jornadasConStats);

      // Obtener el equipoId desde el hook de sesión
      if (miEquipoId) {
        const id = Number(miEquipoId);
        setEquipoId(id);

        // Cargar historial del equipo
        try {
          const historialData = await equiposService.getHistorialEquipo(id);
          setHistorial(historialData);
        } catch {
          setHistorial({ jornadas: [] });
        }
      } else {
        setEquipoId(null);
        setHistorial({ jornadas: [] });
      }

      setError(null);
    } catch (err) {
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
        'Error al cargar jornadas. Verifica que el backend esté corriendo.',
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
    if (
      !historial ||
      !historial.jornadas ||
      !Array.isArray(historial.jornadas)
    ) {
      return 0;
    }

    // La estructura real es: jornadas[].jornada.id, no jornadaId
    const jornadaData = historial.jornadas.find((j) => {
      // Manejar tanto j.jornada.id como j.jornadaId o j.jornada_id
      const id =
        j.jornada?.id ||
        (j as { jornadaId?: number }).jornadaId ||
        (j as { jornada_id?: number }).jornada_id;
      return id === jornadaId;
    });

    if (jornadaData) {
      // El backend puede enviar puntajeTotal o puntaje_total
      const puntaje =
        jornadaData.puntajeTotal ??
        (jornadaData as { puntaje_total?: number }).puntaje_total ??
        0;
      return puntaje;
    }

    return 0;
  };

  const puntajeTotal =
    historial?.jornadas && Array.isArray(historial.jornadas)
      ? historial.jornadas.reduce((sum, j) => {
          const puntaje =
            j.puntajeTotal ??
            (j as { puntaje_total?: number }).puntaje_total ??
            0;
          return sum + puntaje;
        }, 0)
      : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 pt-24 pb-8 px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">
          Mis Jornadas y Puntos
        </h1>

        {error && (
          <div className="bg-red-500 text-white p-4 rounded-lg mb-6 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="font-bold">
              ✕
            </button>
          </div>
        )}

        {/* Resumen de Puntos */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 mb-8 border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white">Tu Rendimiento</h2>
            <button
              onClick={() => {
                const params = new URLSearchParams();
                if (torneoId) params.append('torneoId', torneoId);
                if (equipoIdFromUrl) params.append('equipoId', equipoIdFromUrl);
                navigate(`/mis-puntos/historial?${params.toString()}`);
              }}
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
              Recargar
            </button>
          </div>
        </div>

        {/* Lista de Jornadas */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-6">
            Todas las Jornadas
          </h2>

          {loading && jornadas.length === 0 ? (
            <LoadingSpinner variant="section" message="Cargando jornadas..." />
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

                  // Verificar si hay estadísticas calculadas para esta jornada
                  const hayPuntosCalculados = jornadasConEstadisticas.has(
                    jornada.id,
                  );

                  // El usuario participó si:
                  // 1. Hay estadísticas calculadas para la jornada
                  // 2. El usuario tiene equipo
                  // 3. El usuario aparece en el historial de esa jornada
                  const apareceEnHistorial =
                    historial?.jornadas.some(
                      (j) =>
                        (j.jornada?.id ||
                          (j as { jornadaId?: number }).jornadaId) ===
                        jornada.id,
                    ) || false;

                  const participe =
                    hayPuntosCalculados &&
                    equipoId !== null &&
                    apareceEnHistorial;

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
                            Puntos pendientes
                          </p>
                        </div>
                      )}

                      {participe && equipoId ? (
                        <button
                          onClick={() =>
                            navigate(
                              `/equipos/${equipoId}/jornadas/${jornada.id}`,
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
