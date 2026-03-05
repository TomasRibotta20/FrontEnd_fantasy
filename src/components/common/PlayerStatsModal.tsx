import { useEffect, useState, useCallback } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import {
  obtenerHistorialPrecios,
  obtenerHistorialEstadisticas,
  type HistorialPreciosResponse,
  type HistorialEstadisticasResponse,
} from '../../services/playerStatsService';

interface PlayerStatsModalProps {
  jugadorId: number;
  jugadorNombre: string;
  jugadorFoto?: string;
  jugadorPosicion?: string;
  jugadorClub?: string;
  onClose: () => void;
}

type TabKey = 'precios' | 'puntos' | 'detalle';

const formatPrecio = (value: number): string => {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value}`;
};

/** Modal con historial de precios y estadísticas detalladas de un jugador. */
const PlayerStatsModal = ({
  jugadorId,
  jugadorNombre,
  jugadorFoto,
  jugadorPosicion,
  jugadorClub,
  onClose,
}: PlayerStatsModalProps) => {
  const [tabActiva, setTabActiva] = useState<TabKey>('precios');
  const [precios, setPrecios] = useState<HistorialPreciosResponse | null>(null);
  const [estadisticas, setEstadisticas] =
    useState<HistorialEstadisticasResponse | null>(null);
  const [loadingPrecios, setLoadingPrecios] = useState(true);
  const [loadingEstadisticas, setLoadingEstadisticas] = useState(true);
  const [errorPrecios, setErrorPrecios] = useState<string | null>(null);
  const [errorEstadisticas, setErrorEstadisticas] = useState<string | null>(
    null,
  );

  const cargarDatos = useCallback(async () => {
    // Cargar precios
    setLoadingPrecios(true);
    setErrorPrecios(null);
    try {
      const data = await obtenerHistorialPrecios(jugadorId);
      setPrecios(data);
    } catch {
      setErrorPrecios('No se pudo cargar el historial de precios');
    } finally {
      setLoadingPrecios(false);
    }

    // Cargar estadísticas
    setLoadingEstadisticas(true);
    setErrorEstadisticas(null);
    try {
      const data = await obtenerHistorialEstadisticas(jugadorId);
      setEstadisticas(data);
    } catch {
      setErrorEstadisticas('No se pudo cargar el historial de estadísticas');
    } finally {
      setLoadingEstadisticas(false);
    }
  }, [jugadorId]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Cerrar con Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Datos para el gráfico de precios
  const preciosChartData =
    precios?.historial.map((h) => ({
      nombre: h.jornadaNombre || 'Inicial',
      precio: h.precio,
      variacion: h.variacionPorcentual,
    })) ?? [];

  // Datos para el gráfico de puntos
  const puntosChartData =
    estadisticas?.historialPuntos.map((h) => ({
      nombre: h.jornadaNombre,
      puntos: parseFloat(h.puntos.toFixed(1)),
      rival: h.rival,
      local: h.esLocal ? 'Local' : 'Visitante',
    })) ?? [];

  // Datos para el detalle
  const detalleData = estadisticas?.estadisticasDetalladas ?? [];

  const isLoading = loadingPrecios || loadingEstadisticas;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center px-4 pt-20 pb-4"
      onClick={onClose}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-3xl max-h-[calc(100vh-6rem)] overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-br from-gray-900/95 via-gray-800/95 to-gray-900/95 backdrop-blur-xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ═══ HEADER ═══ */}
        <div className="flex items-center gap-4 p-5 border-b border-white/10 bg-gradient-to-r from-blue-600/20 to-purple-600/20">
          {/* Foto */}
          <div className="relative flex-shrink-0">
            {jugadorFoto ? (
              <img
                src={jugadorFoto}
                alt={jugadorNombre}
                className="w-16 h-16 rounded-xl object-cover border-2 border-white/20"
                onError={(e) => {
                  e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(jugadorNombre)}&size=64&background=4F46E5&color=fff`;
                }}
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold border-2 border-white/20">
                {jugadorNombre.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-white truncate">
              {jugadorNombre}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              {jugadorPosicion && (
                <span className="px-2 py-0.5 bg-blue-500/30 text-blue-300 rounded text-xs font-semibold uppercase">
                  {jugadorPosicion}
                </span>
              )}
              {jugadorClub && (
                <span className="text-white/50 text-sm">{jugadorClub}</span>
              )}
            </div>
          </div>

          {/* Resumen rápido de precio */}
          {precios && (
            <div className="flex-shrink-0 text-right hidden sm:block">
              <p className="text-green-400 font-bold text-xl">
                {formatPrecio(precios.estadisticas.precioActual)}
              </p>
              <p
                className={`text-xs font-semibold ${precios.estadisticas.variacionTotal >= 0 ? 'text-green-400' : 'text-red-400'}`}
              >
                {precios.estadisticas.variacionTotal >= 0 ? '+' : ''}
                {precios.estadisticas.variacionTotal.toFixed(1)}% total
              </p>
            </div>
          )}

          {/* Botón cerrar */}
          <button
            onClick={onClose}
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* ═══ TABS ═══ */}
        <div className="flex border-b border-white/10">
          {(
            [
              {
                key: 'precios',
                label: 'Precio',
                iconPath:
                  'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
              },
              {
                key: 'puntos',
                label: 'Puntos',
                iconPath:
                  'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
              },
              {
                key: 'detalle',
                label: 'Detalle',
                iconPath:
                  'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
              },
            ] as { key: TabKey; label: string; iconPath: string }[]
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setTabActiva(tab.key)}
              className={`flex-1 py-3 px-4 text-sm font-semibold transition-all border-b-2 ${
                tabActiva === tab.key
                  ? 'border-blue-400 text-blue-400 bg-blue-400/10'
                  : 'border-transparent text-white/50 hover:text-white/70 hover:bg-white/5'
              }`}
            >
              <span className="inline-flex items-center gap-1.5">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={tab.iconPath}
                  />
                </svg>
                {tab.label}
              </span>
            </button>
          ))}
        </div>

        {/* ═══ CONTENIDO ═══ */}
        <div
          className="overflow-y-auto p-5"
          style={{ maxHeight: 'calc(100vh - 12rem)' }}
        >
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-10 h-10 border-3 border-blue-400 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-white/50 text-sm">Cargando datos...</p>
            </div>
          ) : (
            <>
              {/* ── TAB PRECIOS ── */}
              {tabActiva === 'precios' && (
                <div className="space-y-5">
                  {errorPrecios ? (
                    <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 text-center">
                      <p className="text-red-300 text-sm">{errorPrecios}</p>
                    </div>
                  ) : precios && preciosChartData.length > 0 ? (
                    <>
                      {/* Stats cards */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <StatCard
                          label="Precio Actual"
                          value={formatPrecio(
                            precios.estadisticas.precioActual,
                          )}
                          color="text-green-400"
                        />
                        <StatCard
                          label="Precio Inicial"
                          value={formatPrecio(
                            precios.estadisticas.precioInicial,
                          )}
                          color="text-white"
                        />
                        <StatCard
                          label="Máximo"
                          value={formatPrecio(
                            precios.estadisticas.precioMaximo,
                          )}
                          color="text-emerald-400"
                        />
                        <StatCard
                          label="Mínimo"
                          value={formatPrecio(
                            precios.estadisticas.precioMinimo,
                          )}
                          color="text-red-400"
                        />
                      </div>

                      {/* Gráfico de precios */}
                      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                        <h3 className="text-white/80 text-sm font-semibold mb-3">
                          Evolución de Precio
                        </h3>
                        <ResponsiveContainer width="100%" height={250}>
                          <AreaChart data={preciosChartData}>
                            <defs>
                              <linearGradient
                                id="colorPrecio"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                              >
                                <stop
                                  offset="5%"
                                  stopColor="#10B981"
                                  stopOpacity={0.3}
                                />
                                <stop
                                  offset="95%"
                                  stopColor="#10B981"
                                  stopOpacity={0}
                                />
                              </linearGradient>
                            </defs>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="rgba(255,255,255,0.1)"
                            />
                            <XAxis
                              dataKey="nombre"
                              tick={{
                                fill: 'rgba(255,255,255,0.5)',
                                fontSize: 11,
                              }}
                              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                            />
                            <YAxis
                              tickFormatter={formatPrecio}
                              tick={{
                                fill: 'rgba(255,255,255,0.5)',
                                fontSize: 11,
                              }}
                              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                              width={60}
                            />
                            <Tooltip
                              content={({ active, payload, label }) => {
                                if (!active || !payload?.length) return null;
                                const data = payload[0].payload;
                                return (
                                  <div className="bg-gray-900 border border-white/20 rounded-lg p-3 shadow-xl">
                                    <p className="text-white text-sm font-semibold">
                                      {label}
                                    </p>
                                    <p className="text-green-400 text-lg font-bold">
                                      {formatPrecio(data.precio)}
                                    </p>
                                    {data.variacion !== 0 && (
                                      <p
                                        className={`text-xs ${data.variacion >= 0 ? 'text-green-400' : 'text-red-400'}`}
                                      >
                                        {data.variacion >= 0 ? '▲' : '▼'}{' '}
                                        {Math.abs(data.variacion).toFixed(1)}%
                                      </p>
                                    )}
                                  </div>
                                );
                              }}
                            />
                            <Area
                              type="monotone"
                              dataKey="precio"
                              stroke="#10B981"
                              strokeWidth={2}
                              fill="url(#colorPrecio)"
                              dot={{
                                fill: '#10B981',
                                strokeWidth: 2,
                                r: 4,
                                stroke: '#064E3B',
                              }}
                              activeDot={{
                                r: 6,
                                stroke: '#10B981',
                                strokeWidth: 2,
                                fill: '#fff',
                              }}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Tabla de historial */}
                      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                        <h3 className="text-white/80 text-sm font-semibold p-4 pb-2">
                          Historial de Cambios
                        </h3>
                        <div className="max-h-48 overflow-y-auto">
                          <table className="w-full text-sm">
                            <thead className="sticky top-0 bg-gray-800">
                              <tr className="text-white/40 text-xs">
                                <th className="text-left py-2 px-4">Jornada</th>
                                <th className="text-right py-2 px-4">Precio</th>
                                <th className="text-right py-2 px-4">
                                  Variación
                                </th>
                                <th className="text-left py-2 px-4">Motivo</th>
                              </tr>
                            </thead>
                            <tbody>
                              {[...precios.historial].reverse().map((h, i) => (
                                <tr
                                  key={i}
                                  className="border-t border-white/5 hover:bg-white/5"
                                >
                                  <td className="py-2 px-4 text-white/70">
                                    {h.jornadaNombre || 'Inicial'}
                                  </td>
                                  <td className="py-2 px-4 text-right text-white font-medium">
                                    {formatPrecio(h.precio)}
                                  </td>
                                  <td
                                    className={`py-2 px-4 text-right font-medium ${
                                      h.variacionPorcentual > 0
                                        ? 'text-green-400'
                                        : h.variacionPorcentual < 0
                                          ? 'text-red-400'
                                          : 'text-white/40'
                                    }`}
                                  >
                                    {h.variacionPorcentual !== 0
                                      ? `${h.variacionPorcentual >= 0 ? '+' : ''}${h.variacionPorcentual.toFixed(1)}%`
                                      : '—'}
                                  </td>
                                  <td className="py-2 px-4 text-white/50 capitalize text-xs">
                                    {h.motivo
                                      ?.toLowerCase()
                                      .replace('_', ' ') || '—'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  ) : (
                    <EmptyState message="No hay historial de precios disponible" />
                  )}
                </div>
              )}

              {/* ── TAB PUNTOS ── */}
              {tabActiva === 'puntos' && (
                <div className="space-y-5">
                  {errorEstadisticas ? (
                    <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 text-center">
                      <p className="text-red-300 text-sm">
                        {errorEstadisticas}
                      </p>
                    </div>
                  ) : estadisticas && puntosChartData.length > 0 ? (
                    <>
                      {/* Stats resumen */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <StatCard
                          label="Total Puntos"
                          value={parseFloat(
                            estadisticas.resumen.totalPuntos.toFixed(1),
                          ).toString()}
                          color="text-yellow-400"
                        />
                        <StatCard
                          label="Promedio"
                          value={estadisticas.resumen.promedioPuntos.toFixed(1)}
                          color="text-blue-400"
                        />
                        <StatCard
                          label="Mejor"
                          value={parseFloat(
                            estadisticas.resumen.mejorPuntaje.toFixed(1),
                          ).toString()}
                          color="text-emerald-400"
                        />
                        <StatCard
                          label="Peor"
                          value={parseFloat(
                            estadisticas.resumen.peorPuntaje.toFixed(1),
                          ).toString()}
                          color="text-red-400"
                        />
                      </div>

                      {/* Gráfico de puntos por jornada */}
                      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                        <h3 className="text-white/80 text-sm font-semibold mb-3">
                          Puntos por Jornada
                        </h3>
                        <ResponsiveContainer width="100%" height={250}>
                          <BarChart data={puntosChartData}>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="rgba(255,255,255,0.1)"
                            />
                            <XAxis
                              dataKey="nombre"
                              tick={{
                                fill: 'rgba(255,255,255,0.5)',
                                fontSize: 11,
                              }}
                              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                            />
                            <YAxis
                              tick={{
                                fill: 'rgba(255,255,255,0.5)',
                                fontSize: 11,
                              }}
                              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                              width={40}
                            />
                            <Tooltip
                              content={({ active, payload, label }) => {
                                if (!active || !payload?.length) return null;
                                const data = payload[0].payload;
                                return (
                                  <div className="bg-gray-900 border border-white/20 rounded-lg p-3 shadow-xl">
                                    <p className="text-white text-sm font-semibold">
                                      {label}
                                    </p>
                                    <p className="text-yellow-400 text-lg font-bold">
                                      {data.puntos} pts
                                    </p>
                                    <p className="text-white/50 text-xs">
                                      vs {data.rival} ({data.local})
                                    </p>
                                  </div>
                                );
                              }}
                            />
                            <Bar
                              dataKey="puntos"
                              radius={[4, 4, 0, 0]}
                              fill="#FBBF24"
                              maxBarSize={40}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Gráfico de línea combinado */}
                      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                        <h3 className="text-white/80 text-sm font-semibold mb-3">
                          Tendencia de Rendimiento
                        </h3>
                        <ResponsiveContainer width="100%" height={200}>
                          <LineChart data={puntosChartData}>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="rgba(255,255,255,0.1)"
                            />
                            <XAxis
                              dataKey="nombre"
                              tick={{
                                fill: 'rgba(255,255,255,0.5)',
                                fontSize: 11,
                              }}
                              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                            />
                            <YAxis
                              tick={{
                                fill: 'rgba(255,255,255,0.5)',
                                fontSize: 11,
                              }}
                              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                              width={40}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: '#1F2937',
                                border: '1px solid rgba(255,255,255,0.2)',
                                borderRadius: '8px',
                                color: '#fff',
                              }}
                            />
                            <Line
                              type="monotone"
                              dataKey="puntos"
                              stroke="#FBBF24"
                              strokeWidth={2}
                              dot={{
                                fill: '#FBBF24',
                                strokeWidth: 2,
                                r: 4,
                                stroke: '#78350F',
                              }}
                              activeDot={{
                                r: 6,
                                stroke: '#FBBF24',
                                strokeWidth: 2,
                                fill: '#fff',
                              }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </>
                  ) : (
                    <EmptyState message="No hay historial de puntos disponible" />
                  )}
                </div>
              )}

              {/* ── TAB DETALLE ── */}
              {tabActiva === 'detalle' && (
                <div className="space-y-5">
                  {errorEstadisticas ? (
                    <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 text-center">
                      <p className="text-red-300 text-sm">
                        {errorEstadisticas}
                      </p>
                    </div>
                  ) : estadisticas && detalleData.length > 0 ? (
                    <>
                      {/* Resumen general */}
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                        <StatCard
                          label="Jornadas"
                          value={estadisticas.resumen.totalJornadas.toString()}
                          color="text-blue-400"
                        />
                        <StatCard
                          label="Goles"
                          value={estadisticas.resumen.totalGoles.toString()}
                          color="text-emerald-400"
                        />
                        <StatCard
                          label="Asistencias"
                          value={estadisticas.resumen.totalAsistencias.toString()}
                          color="text-purple-400"
                        />
                        <StatCard
                          label="TA"
                          value={estadisticas.resumen.totalTarjetasAmarillas.toString()}
                          color="text-yellow-400"
                        />
                        <StatCard
                          label="TR"
                          value={estadisticas.resumen.totalTarjetasRojas.toString()}
                          color="text-red-400"
                        />
                      </div>

                      {/* Rating promedio */}
                      <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4">
                        <div className="flex-1">
                          <h3 className="text-white/80 text-sm font-semibold">
                            Rating Promedio
                          </h3>
                          <p className="text-white/50 text-xs mt-0.5">
                            Basado en {estadisticas.resumen.totalJornadas}{' '}
                            jornadas jugadas
                          </p>
                        </div>
                        <div
                          className={`w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold border-2 ${
                            estadisticas.resumen.promedioRating >= 7
                              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                              : estadisticas.resumen.promedioRating >= 5
                                ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400'
                                : 'bg-red-500/20 border-red-500/40 text-red-400'
                          }`}
                        >
                          {estadisticas.resumen.promedioRating.toFixed(1)}
                        </div>
                      </div>

                      {/* Tabla de detalle por jornada */}
                      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                        <h3 className="text-white/80 text-sm font-semibold p-4 pb-2">
                          Detalle por Jornada
                        </h3>
                        <div className="max-h-64 overflow-y-auto overflow-x-auto">
                          <table className="w-full text-sm min-w-[600px]">
                            <thead className="sticky top-0 bg-gray-800">
                              <tr className="text-white/40 text-xs">
                                <th className="text-left py-2 px-3">Jornada</th>
                                <th className="text-center py-2 px-2">Min</th>
                                <th className="text-center py-2 px-2">Gol</th>
                                <th className="text-center py-2 px-2">Ast</th>
                                <th className="text-center py-2 px-2">TA</th>
                                <th className="text-center py-2 px-2">TR</th>
                                <th className="text-center py-2 px-2">PA</th>
                                <th className="text-center py-2 px-2">
                                  Rating
                                </th>
                                <th className="text-right py-2 px-3">Puntos</th>
                              </tr>
                            </thead>
                            <tbody>
                              {detalleData.map((d, i) => (
                                <tr
                                  key={i}
                                  className="border-t border-white/5 hover:bg-white/5 transition-colors"
                                >
                                  <td className="py-2 px-3 text-white/70 text-xs">
                                    {d.jornadaNombre}
                                  </td>
                                  <td className="py-2 px-2 text-center text-white/60">
                                    {d.minutos}'
                                  </td>
                                  <td className="py-2 px-2 text-center">
                                    {d.goles > 0 ? (
                                      <span className="text-emerald-400 font-semibold">
                                        {d.goles}
                                      </span>
                                    ) : (
                                      <span className="text-white/30">0</span>
                                    )}
                                  </td>
                                  <td className="py-2 px-2 text-center">
                                    {d.asistencias > 0 ? (
                                      <span className="text-purple-400 font-semibold">
                                        {d.asistencias}
                                      </span>
                                    ) : (
                                      <span className="text-white/30">0</span>
                                    )}
                                  </td>
                                  <td className="py-2 px-2 text-center">
                                    {d.tarjetasAmarillas > 0 ? (
                                      <span className="text-yellow-400 font-semibold">
                                        {d.tarjetasAmarillas}
                                      </span>
                                    ) : (
                                      <span className="text-white/30">0</span>
                                    )}
                                  </td>
                                  <td className="py-2 px-2 text-center">
                                    {d.tarjetasRojas > 0 ? (
                                      <span className="text-red-400 font-semibold">
                                        {d.tarjetasRojas}
                                      </span>
                                    ) : (
                                      <span className="text-white/30">0</span>
                                    )}
                                  </td>
                                  <td className="py-2 px-2 text-center">
                                    {d.porteriaACero ? (
                                      <span className="text-blue-400">Si</span>
                                    ) : (
                                      <span className="text-white/30">—</span>
                                    )}
                                  </td>
                                  <td className="py-2 px-2 text-center">
                                    <span
                                      className={`font-medium ${
                                        d.rating >= 7
                                          ? 'text-emerald-400'
                                          : d.rating >= 5
                                            ? 'text-yellow-400'
                                            : 'text-red-400'
                                      }`}
                                    >
                                      {d.rating.toFixed(1)}
                                    </span>
                                  </td>
                                  <td className="py-2 px-3 text-right">
                                    <span className="text-white font-bold">
                                      {parseFloat(
                                        Number(d.puntajeTotal).toFixed(1),
                                      )}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  ) : (
                    <EmptyState message="No hay estadísticas detalladas disponibles" />
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Componentes auxiliares ──

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-center overflow-hidden">
      <p className={`text-lg font-bold ${color} truncate`} title={value}>
        {value}
      </p>
      <p className="text-white/40 text-[11px] mt-0.5">{label}</p>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
        <svg
          className="w-8 h-8 text-white/30"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      </div>
      <p className="text-white/40 text-sm">{message}</p>
    </div>
  );
}

export default PlayerStatsModal;
