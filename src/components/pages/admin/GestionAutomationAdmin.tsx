import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getAutomationStatus,
  toggleAutomation,
  type AutomationStatus,
} from '../../../services/automationService';

/** Panel de administracion de automatizacion de jornadas. */
const GestionAutomationAdmin = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<AutomationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [intervaloMinutos, setIntervaloMinutos] = useState<number>(1);
  const [mercadoHoras, setMercadoHoras] = useState<number>(1);

  const cargarStatus = useCallback(async () => {
    try {
      setError(null);
      const data = await getAutomationStatus();
      setStatus(data);
      setIntervaloMinutos(data.cron_intervalo_minutos);
      setMercadoHoras(data.mercado_duracion_horas);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(
        error.response?.data?.message ||
          'Error al cargar estado de automatizacion',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarStatus();
  }, [cargarStatus]);

  // Auto-refresh cada 10 segundos cuando esta activo
  useEffect(() => {
    if (!status?.cron_activo) return;
    const interval = setInterval(cargarStatus, 10000);
    return () => clearInterval(interval);
  }, [status?.cron_activo, cargarStatus]);

  const handleToggle = async () => {
    if (!status) return;
    setToggling(true);
    setError(null);
    setSuccess(null);

    try {
      const nuevoEstado = !status.modo_automatico;
      await toggleAutomation({
        modo_automatico: nuevoEstado,
        cron_intervalo_minutos: intervaloMinutos,
        mercado_duracion_horas: mercadoHoras,
      });
      setSuccess(
        nuevoEstado
          ? 'Modo automatico activado correctamente'
          : 'Modo automatico desactivado correctamente',
      );
      await cargarStatus();
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(
        error.response?.data?.message ||
          'Error al cambiar modo de automatizacion',
      );
    } finally {
      setToggling(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('es-AR');
  };

  const estadoLabel = (state: string) => {
    switch (state) {
      case 'IDLE':
        return 'Esperando';
      case 'PREP':
        return 'Preparando jornada';
      default:
        return state;
    }
  };

  const estadoColor = (state: string) => {
    switch (state) {
      case 'IDLE':
        return 'bg-gray-500';
      case 'PREP':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-10">
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat -z-10"
        style={{
          backgroundImage: `url('/Background_LandingPage.png')`,
          filter: 'blur(2px)',
        }}
      >
        <div className="absolute inset-0 bg-black opacity-30"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10 max-w-4xl">
        <button
          onClick={() => navigate('/admin')}
          className="mb-4 mt-10 flex items-center gap-2 text-white/80 hover:text-white transition-colors bg-white/10 hover:bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Volver
        </button>

        <h1 className="text-4xl font-bold text-white mb-8 text-center drop-shadow-lg">
          Automatizacion
        </h1>

        {/* Mensajes */}
        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-500/20 border border-green-500 text-green-200 px-4 py-3 rounded-lg mb-6">
            {success}
          </div>
        )}

        {loading ? (
          <div className="text-center text-white/70 py-20 text-lg">
            Cargando estado...
          </div>
        ) : status ? (
          <div className="space-y-6">
            {/* Estado principal */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    Estado del Sistema
                  </h2>
                  <p className="text-white/60 text-sm mt-1">
                    Control de procesamiento automatico de jornadas
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${
                      status.cron_activo
                        ? 'bg-green-500/20 text-green-300 border border-green-500/40'
                        : 'bg-red-500/20 text-red-300 border border-red-500/40'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        status.cron_activo
                          ? 'bg-green-400 animate-pulse'
                          : 'bg-red-400'
                      }`}
                    ></span>
                    {status.cron_activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-white/50 text-xs uppercase tracking-wider mb-1">
                    Estado Automation
                  </p>
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${estadoColor(status.automation_state)}`}
                    ></span>
                    <span className="text-white font-semibold">
                      {estadoLabel(status.automation_state)}
                    </span>
                  </div>
                </div>

                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-white/50 text-xs uppercase tracking-wider mb-1">
                    Jornada Activa
                  </p>
                  <span className="text-white font-semibold">
                    {status.jornada_activa?.nombre || 'Sin jornada'}
                  </span>
                </div>

                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-white/50 text-xs uppercase tracking-wider mb-1">
                    Modificaciones
                  </p>
                  <span
                    className={`font-semibold ${
                      status.modificaciones_habilitadas
                        ? 'text-green-400'
                        : 'text-red-400'
                    }`}
                  >
                    {status.modificaciones_habilitadas
                      ? 'Habilitadas'
                      : 'Deshabilitadas'}
                  </span>
                </div>

                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-white/50 text-xs uppercase tracking-wider mb-1">
                    Intervalo Cron
                  </p>
                  <span className="text-white font-semibold">
                    {status.cron_intervalo_minutos} min
                  </span>
                </div>

                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-white/50 text-xs uppercase tracking-wider mb-1">
                    Duracion Mercado
                  </p>
                  <span className="text-white font-semibold">
                    {status.mercado_duracion_horas} hs
                  </span>
                </div>

                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-white/50 text-xs uppercase tracking-wider mb-1">
                    Ultimo Procesamiento
                  </p>
                  <span className="text-white font-semibold text-sm">
                    {formatDate(status.ultimo_procesamiento_auto)}
                  </span>
                </div>
              </div>

              {/* Jornada mapeada (si existe) */}
              {status.jornada_mapeada && (
                <div className="bg-white/5 rounded-xl p-4 mb-6">
                  <p className="text-white/50 text-xs uppercase tracking-wider mb-3">
                    Fechas Mapeadas (Jornada Activa)
                  </p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-white/50">Inicio original:</span>
                      <span className="text-white ml-2">
                        {formatDate(
                          status.jornada_mapeada.fecha_inicio_original,
                        )}
                      </span>
                    </div>
                    <div>
                      <span className="text-white/50">Inicio mapeado:</span>
                      <span className="text-cyan-300 ml-2">
                        {formatDate(
                          status.jornada_mapeada.fecha_inicio_mapeada,
                        )}
                      </span>
                    </div>
                    <div>
                      <span className="text-white/50">Fin original:</span>
                      <span className="text-white ml-2">
                        {formatDate(status.jornada_mapeada.fecha_fin_original)}
                      </span>
                    </div>
                    <div>
                      <span className="text-white/50">Fin mapeado:</span>
                      <span className="text-cyan-300 ml-2">
                        {formatDate(status.jornada_mapeada.fecha_fin_mapeada)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Panel de control */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h2 className="text-xl font-bold text-white mb-4">Control</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-white/70 text-sm mb-2">
                    Intervalo de ejecucion (minutos)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={intervaloMinutos}
                    onChange={(e) =>
                      setIntervaloMinutos(Number(e.target.value))
                    }
                    disabled={status.modo_automatico}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-white/70 text-sm mb-2">
                    Duracion de mercado (horas)
                  </label>
                  <input
                    type="number"
                    min={0.5}
                    max={48}
                    step={0.5}
                    value={mercadoHoras}
                    onChange={(e) => setMercadoHoras(Number(e.target.value))}
                    disabled={status.modo_automatico}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <button
                onClick={handleToggle}
                disabled={toggling}
                className={`w-full py-3 rounded-xl font-bold text-lg transition-all duration-300 ${
                  status.modo_automatico
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-green-500 hover:bg-green-600 text-white'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {toggling
                  ? 'Procesando...'
                  : status.modo_automatico
                    ? 'Detener Automatizacion'
                    : 'Iniciar Automatizacion'}
              </button>

              {!status.jornada_activa && !status.modo_automatico && (
                <p className="text-yellow-300/80 text-sm mt-3 text-center">
                  Debes configurar una jornada activa antes de iniciar la
                  automatizacion.
                </p>
              )}
            </div>

            {/* Ref de tiempo */}
            {status.fecha_referencia_real && (
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <h2 className="text-xl font-bold text-white mb-4">
                  Referencias de Tiempo
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-white/50 text-xs uppercase tracking-wider mb-1">
                      Fecha Real de Referencia
                    </p>
                    <span className="text-white font-semibold">
                      {formatDate(status.fecha_referencia_real)}
                    </span>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-white/50 text-xs uppercase tracking-wider mb-1">
                      Fecha Historica de Referencia
                    </p>
                    <span className="text-white font-semibold">
                      {formatDate(status.fecha_referencia_historica)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Hora del servidor */}
            <div className="text-center text-white/40 text-xs">
              Hora del servidor: {formatDate(status.hora_actual)}
            </div>
          </div>
        ) : (
          <div className="text-center text-white/70 py-20">
            No se pudo cargar la configuracion.
          </div>
        )}
      </div>
    </div>
  );
};

export default GestionAutomationAdmin;
