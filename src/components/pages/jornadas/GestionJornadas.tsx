import { useEffect, useState } from 'react';
import apiClient from '../../../services/apiClient';
import { Notification } from '../../common/Notification';

interface Jornada {
  id: number;
  numero: number;
  activa: boolean;
  permitirModificaciones: boolean;
  fechaInicio: string;
  fechaFin: string;
  puntosCalculados: boolean;
}

const GestionJornadas = () => {
  const [jornadas, setJornadas] = useState<Jornada[]>([]);
  const [jornadaActual, setJornadaActual] = useState<Jornada | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'warning' | 'info';
    text: string;
  } | null>(null);

  // Estados para crear nueva jornada
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newJornadaNumero, setNewJornadaNumero] = useState('');

  // Cargar jornadas al montar el componente
  useEffect(() => {
    fetchJornadas();
  }, []);

  const fetchJornadas = async () => {
    try {
      setIsLoading(true);
      // TODO: Endpoint real cuando esté disponible
      const response = await apiClient.get('/jornadas');
      setJornadas(response.data.data || response.data || []);

      // Buscar jornada activa
      const activa = response.data.data?.find((j: Jornada) => j.activa) || null;
      setJornadaActual(activa);

      setNotification({
        type: 'success',
        text: 'Jornadas cargadas correctamente',
      });
    } catch {
      setNotification({
        type: 'error',
        text: 'Error al cargar las jornadas (endpoint pendiente)',
      });
      // Datos de ejemplo mientras no exista el endpoint
      const jornadasEjemplo: Jornada[] = [
        {
          id: 1,
          numero: 1,
          activa: true,
          permitirModificaciones: true,
          fechaInicio: '2024-01-01',
          fechaFin: '2024-01-07',
          puntosCalculados: false,
        },
        {
          id: 2,
          numero: 2,
          activa: false,
          permitirModificaciones: false,
          fechaInicio: '2024-01-08',
          fechaFin: '2024-01-14',
          puntosCalculados: false,
        },
      ];
      setJornadas(jornadasEjemplo);
      setJornadaActual(jornadasEjemplo[0]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleActivarJornada = async (jornadaId: number) => {
    try {
      setIsLoading(true);
      // TODO: Endpoint real cuando esté disponible
      await apiClient.patch(`/jornadas/${jornadaId}/activar`);

      setNotification({
        type: 'success',
        text: 'Jornada activada correctamente',
      });
      fetchJornadas();
    } catch {
      setNotification({
        type: 'error',
        text: 'Error al activar jornada (endpoint pendiente)',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleModificaciones = async (
    jornadaId: number,
    permitir: boolean
  ) => {
    try {
      setIsLoading(true);
      // TODO: Endpoint real cuando esté disponible
      await apiClient.patch(`/jornadas/${jornadaId}/modificaciones`, {
        permitirModificaciones: permitir,
      });

      setNotification({
        type: 'success',
        text: `Modificaciones ${
          permitir ? 'habilitadas' : 'bloqueadas'
        } correctamente`,
      });
      fetchJornadas();
    } catch {
      setNotification({
        type: 'error',
        text: 'Error al cambiar permisos (endpoint pendiente)',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCalcularPuntos = async (jornadaId: number) => {
    try {
      setIsLoading(true);
      // TODO: Endpoint real cuando esté disponible
      await apiClient.post(`/jornadas/${jornadaId}/calcular-puntos`);

      setNotification({
        type: 'success',
        text: 'Puntos calculados correctamente',
      });
      fetchJornadas();
    } catch {
      setNotification({
        type: 'error',
        text: 'Error al calcular puntos (endpoint pendiente)',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvanzarJornada = async () => {
    try {
      setIsLoading(true);
      // TODO: Endpoint real cuando esté disponible
      await apiClient.post('/jornadas/avanzar');

      setNotification({
        type: 'success',
        text: 'Jornada avanzada correctamente',
      });
      fetchJornadas();
    } catch {
      setNotification({
        type: 'error',
        text: 'Error al avanzar jornada (endpoint pendiente)',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCrearJornada = async () => {
    if (!newJornadaNumero || parseInt(newJornadaNumero) <= 0) {
      setNotification({
        type: 'warning',
        text: 'Ingrese un número de jornada válido',
      });
      return;
    }

    try {
      setIsLoading(true);
      // TODO: Endpoint real cuando esté disponible
      await apiClient.post('/jornadas', {
        numero: parseInt(newJornadaNumero),
      });

      setNotification({
        type: 'success',
        text: 'Jornada creada correctamente',
      });
      setShowCreateModal(false);
      setNewJornadaNumero('');
      fetchJornadas();
    } catch {
      setNotification({
        type: 'error',
        text: 'Error al crear jornada (endpoint pendiente)',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-10">
      {/* Notificaciones */}
      <Notification
        message={notification}
        onClose={() => setNotification(null)}
      />

      {/* Background */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat -z-10"
        style={{
          backgroundImage: `url('/Background_LandingPage.png')`,
          filter: 'blur(2px)',
        }}
      >
        <div className="absolute inset-0 bg-black opacity-30"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-4">
            Gestión de Jornadas
          </h1>
          <p className="text-white/80 text-lg">
            Administra las jornadas del campeonato Fantasy
          </p>
        </div>

        {/* Panel de Jornada Actual */}
        {jornadaActual && (
          <div className="max-w-4xl mx-auto mb-8">
            <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-md rounded-2xl p-8 border-2 border-green-400/50 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="bg-green-500 rounded-full p-4">
                    <span className="text-4xl">●</span>
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-white">
                      Jornada {jornadaActual.numero}
                    </h2>
                    <p className="text-green-300 font-semibold">ACTIVA</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white/70 text-sm">
                    Estado de modificaciones
                  </p>
                  <div
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${
                      jornadaActual.permitirModificaciones
                        ? 'bg-green-500/30 text-green-300'
                        : 'bg-red-500/30 text-red-300'
                    }`}
                  >
                    <span className="text-2xl">
                      {jornadaActual.permitirModificaciones ? '●' : '○'}
                    </span>
                    <span className="font-bold">
                      {jornadaActual.permitirModificaciones
                        ? 'ABIERTO'
                        : 'CERRADO'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Acciones de la jornada activa */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() =>
                    handleToggleModificaciones(
                      jornadaActual.id,
                      !jornadaActual.permitirModificaciones
                    )
                  }
                  disabled={isLoading}
                  className={`p-4 rounded-xl font-semibold transition-all duration-200 ${
                    jornadaActual.permitirModificaciones
                      ? 'bg-red-500/30 hover:bg-red-500/40 text-red-200 border-2 border-red-400/50'
                      : 'bg-green-500/30 hover:bg-green-500/40 text-green-200 border-2 border-green-400/50'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {jornadaActual.permitirModificaciones
                    ? 'Bloquear'
                    : 'Habilitar'}{' '}
                  Modificaciones
                </button>

                <button
                  onClick={() => handleCalcularPuntos(jornadaActual.id)}
                  disabled={isLoading || jornadaActual.puntosCalculados}
                  className="p-4 rounded-xl bg-blue-500/30 hover:bg-blue-500/40 text-blue-200 border-2 border-blue-400/50 font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {jornadaActual.puntosCalculados
                    ? 'Puntos Calculados'
                    : 'Calcular Puntos'}
                </button>

                <button
                  onClick={handleAvanzarJornada}
                  disabled={isLoading || !jornadaActual.puntosCalculados}
                  className="p-4 rounded-xl bg-purple-500/30 hover:bg-purple-500/40 text-purple-200 border-2 border-purple-400/50 font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Avanzar a Siguiente Jornada
                </button>
              </div>

              {!jornadaActual.puntosCalculados && (
                <div className="mt-4 bg-yellow-500/20 border border-yellow-400/50 rounded-lg p-3">
                  <p className="text-yellow-200 text-sm">
                    Debes calcular los puntos antes de avanzar a la siguiente
                    jornada
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Botón para crear nueva jornada */}
        <div className="max-w-4xl mx-auto mb-6">
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-full p-4 rounded-xl bg-gradient-to-r from-blue-500/30 to-purple-500/30 hover:from-blue-500/40 hover:to-purple-500/40 text-white border-2 border-blue-400/50 font-bold text-lg transition-all duration-200"
          >
            ➕ Crear Nueva Jornada
          </button>
        </div>

        {/* Lista de todas las jornadas */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <h3 className="text-2xl font-bold text-white mb-4">
              Historial de Jornadas
            </h3>

            {isLoading && jornadas.length === 0 ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-400 mx-auto mb-4"></div>
                <p className="text-white/60">Cargando jornadas...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {jornadas.map((jornada) => (
                  <div
                    key={jornada.id}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                      jornada.activa
                        ? 'bg-green-500/20 border-green-400/50'
                        : 'bg-white/5 border-white/20 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-3xl">
                          {jornada.activa
                            ? '●'
                            : jornada.puntosCalculados
                            ? '✓'
                            : '○'}
                        </div>
                        <div>
                          <h4 className="text-xl font-bold text-white">
                            Jornada {jornada.numero}
                          </h4>
                          <div className="flex gap-3 text-sm text-white/70">
                            <span>
                              {jornada.activa ? 'Activa' : 'Inactiva'}
                            </span>
                            <span>•</span>
                            <span>
                              {jornada.permitirModificaciones
                                ? 'Modificable'
                                : 'Bloqueada'}
                            </span>
                            <span>•</span>
                            <span>
                              {jornada.puntosCalculados
                                ? 'Puntos calculados'
                                : 'Pendiente'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {!jornada.activa && (
                        <button
                          onClick={() => handleActivarJornada(jornada.id)}
                          disabled={isLoading}
                          className="px-6 py-2 rounded-lg bg-blue-500/30 hover:bg-blue-500/40 text-blue-200 border border-blue-400/50 font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Activar
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {jornadas.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-white/60 text-lg">
                      No hay jornadas creadas todavía
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Información adicional */}
        <div className="max-w-4xl mx-auto mt-8">
          <div className="bg-blue-500/20 backdrop-blur-md rounded-xl p-6 border border-blue-400/30">
            <h4 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <span>i</span>
              Información sobre Jornadas
            </h4>
            <ul className="space-y-2 text-white/80 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">•</span>
                <span>Solo puede haber una jornada activa a la vez</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">•</span>
                <span>
                  Bloquea las modificaciones cuando los partidos estén por
                  comenzar
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">•</span>
                <span>
                  Calcula los puntos después de que terminen todos los partidos
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">•</span>
                <span>
                  Avanza a la siguiente jornada después de calcular los puntos
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Modal para crear jornada */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl p-8 max-w-md w-full border-2 border-white/20 shadow-2xl">
            <h3 className="text-2xl font-bold text-white mb-6">
              Crear Nueva Jornada
            </h3>

            <div className="mb-6">
              <label className="block text-white/80 text-sm font-semibold mb-2">
                Número de Jornada
              </label>
              <input
                type="number"
                min="1"
                value={newJornadaNumero}
                onChange={(e) => setNewJornadaNumero(e.target.value)}
                placeholder="Ej: 3"
                className="w-full p-3 rounded-lg bg-white/10 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewJornadaNumero('');
                }}
                className="flex-1 py-3 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold transition-all duration-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleCrearJornada}
                disabled={isLoading}
                className="flex-1 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Crear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionJornadas;
