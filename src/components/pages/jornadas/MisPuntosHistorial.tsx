import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../../common/LoadingSpinner';
import apiClient from '../../../services/apiClient';
import { useMiEquipoId } from '../../../hooks/useSessionData';

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
  puntaje_total?: number; // Backend puede enviar snake_case
  fechaSnapshot?: string;
}

interface HistorialEquipo {
  jornadas: JornadaHistorial[];
}

const MisPuntosHistorial = () => {
  const navigate = useNavigate();
  const [miEquipoIdHook] = useMiEquipoId();
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

        // Obtener equipoId desde el hook de sesión
        let equipoId: number | null = miEquipoIdHook
          ? Number(miEquipoIdHook)
          : null;

        if (!equipoId) {
          throw new Error(
            'No se encontró el ID del equipo. Por favor, selecciona un torneo primero.',
          );
        }

        setMiEquipoId(equipoId);

        // Obtener historial del equipo
        const historialRes = await apiClient.get(
          `/api/equipos/${equipoId}/historial`,
        );
        const historialData = historialRes.data;

        // El backend devuelve { data: [...] } donde data es un ARRAY directo
        const dataArray = historialData?.data || historialData;

        // Normalizar datos: convertir puntaje_total a puntajeTotal
        const normalizeJornada = (
          item: Partial<JornadaHistorial> & { puntaje_total?: number },
        ): JornadaHistorial =>
          ({
            ...item,
            puntajeTotal: item.puntajeTotal ?? item.puntaje_total ?? 0,
          }) as JornadaHistorial;

        // Si es un array, envolver en objeto con propiedad jornadas
        if (Array.isArray(dataArray)) {
          setHistorial({ jornadas: dataArray.map(normalizeJornada) });
        } else if (dataArray?.jornadas && Array.isArray(dataArray.jornadas)) {
          // Si ya tiene la propiedad jornadas (formato antiguo)
          setHistorial({ jornadas: dataArray.jornadas.map(normalizeJornada) });
        } else {
          setHistorial({ jornadas: [] });
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Error al cargar historial',
        );
      } finally {
        setLoading(false);
      }
    };

    loadHistorial();
  }, [miEquipoIdHook]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 p-8 flex items-center justify-center">
        <LoadingSpinner variant="section" message="Cargando historial..." />
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="min-h-screen pt-24 pb-8 px-8"
        style={{
          backgroundImage: "url('/Background_LandingPage.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="max-w-4xl mx-auto">
          <div className="backdrop-blur-lg bg-red-500/20 border-2 border-red-400/50 text-white p-8 rounded-2xl shadow-2xl">
            <h2 className="text-3xl font-bold mb-4 text-red-300">Error</h2>
            <p className="text-white/90 text-lg mb-6">{error}</p>
            <div className="flex gap-4">
              <button
                onClick={() => navigate('/torneos')}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl font-semibold transition-all shadow-lg"
              >
                Ir a Torneos
              </button>
              <button
                onClick={() => navigate('/home')}
                className="px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-xl font-semibold transition-all border border-white/30"
              >
                Volver al Inicio
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const jornadas = historial?.jornadas || [];

  const puntajeTotal = jornadas.reduce(
    (sum, j) => sum + (j.puntajeTotal || 0),
    0,
  );
  const promedio =
    jornadas.length > 0 ? Math.round(puntajeTotal / jornadas.length) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 pt-24 pb-8 px-4 sm:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => {
              const params = new URLSearchParams();
              if (miEquipoId) params.append('equipoId', String(miEquipoId));
              navigate(`/jornadas?${params.toString()}`);
            }}
            className="text-white hover:text-gray-300 mb-4 flex items-center gap-2"
          >
            ← Volver a Jornadas
          </button>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Mi Historial de Puntos
          </h1>
        </div>

        {/* Resumen */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-yellow-600 to-orange-600 rounded-xl p-6 shadow-lg border-2 border-white/20">
            <p className="text-white/80 text-sm mb-2">Puntos Totales</p>
            <p className="text-white text-3xl sm:text-5xl font-bold">
              {puntajeTotal.toFixed(1)}
            </p>
          </div>
          <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl p-6 shadow-lg border-2 border-white/20">
            <p className="text-white/80 text-sm mb-2">Jornadas Jugadas</p>
            <p className="text-white text-3xl sm:text-5xl font-bold">
              {jornadas.length}
            </p>
          </div>
          <div className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl p-6 shadow-lg border-2 border-white/20">
            <p className="text-white/80 text-sm mb-2">Promedio</p>
            <p className="text-white text-3xl sm:text-5xl font-bold">
              {promedio.toFixed(1)}
            </p>
          </div>
        </div>

        {/* Historial */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-6">
            Historial por Jornada
          </h2>

          {jornadas.length === 0 ? (
            <div className="text-center text-gray-400 py-12">
              <p className="text-xl mb-4">Aún no tienes puntos registrados</p>
              <p className="text-sm">
                Las jornadas deben ser procesadas por un administrador para que
                aparezcan tus puntos aquí.
              </p>
              <p className="text-sm mt-2">
                Mientras tanto, puedes ver las jornadas disponibles y configurar
                tu equipo.
              </p>
              <button
                onClick={() => {
                  const params = new URLSearchParams();
                  if (miEquipoId) params.append('equipoId', String(miEquipoId));
                  navigate(`/jornadas?${params.toString()}`);
                }}
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
                        `/equipos/${miEquipoId}/jornadas/${jornadaData.jornada?.id}`,
                      )
                    }
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
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
