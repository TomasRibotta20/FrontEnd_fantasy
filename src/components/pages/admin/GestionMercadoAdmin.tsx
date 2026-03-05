import { useEffect, useState, useCallback } from 'react';
import {
  listarMercadosPorTorneo,
  habilitarMercado,
  cerrarMercado,
} from '../../../services/mercadoService';
import type { Mercado } from '../../../services/mercadoService';
import { obtenerTodosLosTorneos } from '../../../services/torneosService';
import ConfirmModal from '../../common/ConfirmModal';

interface TorneoAdmin {
  id: number;
  nombre: string;
  estado: string;
  descripcion?: string;
  cupo_maximo?: number;
  codigo_acceso?: string;
}

/** Panel de administración de mercados por torneo. */
const GestionMercadoAdmin = () => {
  const [torneos, setTorneos] = useState<TorneoAdmin[]>([]);
  const [torneoSeleccionado, setTorneoSeleccionado] = useState<number | null>(
    null,
  );
  const [mercados, setMercados] = useState<Mercado[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [confirmCerrarId, setConfirmCerrarId] = useState<number | null>(null);

  useEffect(() => {
    cargarTorneos();
  }, []);

  const cargarTorneos = async () => {
    try {
      const response = await obtenerTodosLosTorneos();
      // La respuesta puede ser un array directamente o un objeto con data
      const data = Array.isArray(response) ? response : response.data || [];
      setTorneos(data);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Error al cargar torneos');
    }
  };

  const cargarMercados = useCallback(async (torneoId: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await listarMercadosPorTorneo(torneoId);
      setMercados(data);
    } catch (err) {
      const error = err as {
        response?: { data?: { message?: string }; status?: number };
      };
      if (error.response?.status === 404) {
        setMercados([]);
      } else {
        setError(error.response?.data?.message || 'Error al cargar mercados');
        setMercados([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (torneoSeleccionado) {
      cargarMercados(torneoSeleccionado);
    }
  }, [torneoSeleccionado, cargarMercados]);

  const handleHabilitarMercado = async () => {
    if (!torneoSeleccionado) return;

    // Verificar si ya hay un mercado activo
    if (mercadoActivo) {
      setError(
        'Ya existe un mercado activo para este torneo. Ciérralo antes de abrir uno nuevo.',
      );
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await habilitarMercado(torneoSeleccionado);
      setSuccess('Mercado habilitado exitosamente');
      await cargarMercados(torneoSeleccionado);
    } catch (err) {
      const error = err as {
        response?: {
          status?: number;
          data?: { message?: string; error?: string };
        };
        message?: string;
      };

      let errorMessage = 'Error al habilitar mercado';

      if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(
        `${errorMessage} (Código: ${error.response?.status || 'desconocido'})`,
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCerrarMercado = (mercadoId: number) => {
    setConfirmCerrarId(mercadoId);
  };

  const confirmCerrar = async () => {
    if (confirmCerrarId === null) return;

    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await cerrarMercado(confirmCerrarId);
      setSuccess('Mercado cerrado exitosamente');
      if (torneoSeleccionado) {
        await cargarMercados(torneoSeleccionado);
      }
    } catch (err) {
      const error = err as {
        response?: {
          data?: { message?: string; error?: string };
          status?: number;
        };
      };
      const errorMsg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Error al cerrar mercado';
      setError(`${errorMsg} (Status: ${error.response?.status || 'unknown'})`);
    } finally {
      setLoading(false);
      setConfirmCerrarId(null);
    }
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const mercadoActivo = mercados.find(
    (m) => m.estado === 'ACTIVO' || m.estado === 'ABIERTO',
  );
  const torneoInfo = torneos.find((t) => t.id === torneoSeleccionado);

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

      <div className="container mx-auto px-4 relative z-10 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">
            Gestión de Mercado
          </h1>
          <p className="text-white/80 text-lg">
            Habilita o cierra el mercado de fichajes para cada torneo
          </p>
        </div>

        {/* Mensajes */}
        {error && (
          <div className="bg-red-500/20 backdrop-blur-lg border-2 border-red-500/50 rounded-xl p-4 mb-6">
            <p className="text-red-300 text-center">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-500/20 backdrop-blur-lg border-2 border-green-500/50 rounded-xl p-4 mb-6">
            <p className="text-green-300 text-center">{success}</p>
          </div>
        )}

        {/* Selector de Torneo */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border-2 border-white/20 mb-6">
          <label className="block text-white font-bold mb-3 text-lg">
            Seleccionar Torneo:
          </label>
          <select
            value={torneoSeleccionado || ''}
            onChange={(e) => setTorneoSeleccionado(Number(e.target.value))}
            className="w-full bg-white/10 border-2 border-white/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/60"
          >
            <option value="" className="bg-gray-800 text-white">-- Selecciona un torneo --</option>
            {torneos.map((torneo) => (
              <option key={torneo.id} value={torneo.id} className="bg-gray-800 text-white">
                {torneo.nombre} ({torneo.estado})
              </option>
            ))}
          </select>
        </div>

        {/* Contenido principal */}
        {torneoSeleccionado && (
          <div className="space-y-6">
            {/* Estado actual del mercado */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border-2 border-white/20">
              <h2 className="text-2xl font-bold text-white mb-4">
                Estado del Mercado: {torneoInfo?.nombre}
              </h2>

              {loading && (
                <div className="text-white text-center py-4">Cargando...</div>
              )}

              {!loading && mercadoActivo && (
                <div className="bg-green-500/20 border-2 border-green-500/50 rounded-lg p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xl font-bold text-green-300">
                      Mercado ACTIVO
                    </h3>
                    <button
                      onClick={() => handleCerrarMercado(mercadoActivo.id)}
                      className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-lg transition-all"
                      disabled={loading}
                    >
                      Cerrar Mercado
                    </button>
                  </div>
                  <div className="text-white/90 space-y-1">
                    <p>
                      <strong>Fecha de inicio:</strong>{' '}
                      {formatearFecha(mercadoActivo.fecha_inicio)}
                    </p>
                    {mercadoActivo.fecha_fin && (
                      <p>
                        <strong>Fecha de fin:</strong>{' '}
                        {formatearFecha(mercadoActivo.fecha_fin)}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {!loading && !mercadoActivo && (
                <div className="bg-yellow-500/20 border-2 border-yellow-500/50 rounded-lg p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-yellow-300 mb-2">
                        No hay mercado activo
                      </h3>
                      <p className="text-white/80">
                        Habilita el mercado para que los usuarios puedan fichar
                        jugadores
                      </p>
                    </div>
                    <button
                      onClick={handleHabilitarMercado}
                      className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-3 px-8 rounded-lg transition-all shadow-lg"
                      disabled={loading}
                    >
                      Habilitar Mercado
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Historial de mercados */}
            {mercados.length > 0 && (
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border-2 border-white/20">
                <h2 className="text-2xl font-bold text-white mb-4">
                  Historial de Mercados
                </h2>

                <div className="space-y-3">
                  {mercados.map((mercado) => (
                    <div
                      key={mercado.id}
                      className={`rounded-lg p-4 border-2 ${
                        mercado.estado === 'ACTIVO' ||
                        mercado.estado === 'ABIERTO'
                          ? 'bg-green-500/10 border-green-500/50'
                          : 'bg-gray-500/10 border-gray-500/50'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span
                              className={`px-3 py-1 rounded-full text-sm font-bold ${
                                mercado.estado === 'ACTIVO' ||
                                mercado.estado === 'ABIERTO'
                                  ? 'bg-green-500 text-white'
                                  : 'bg-gray-500 text-white'
                              }`}
                            >
                              {mercado.estado}
                            </span>
                            <span className="text-white/70">
                              ID: {mercado.id}
                            </span>
                          </div>
                          <div className="text-white/90 space-y-1 text-sm">
                            <p>
                              <strong>Inicio:</strong>{' '}
                              {formatearFecha(mercado.fecha_inicio)}
                            </p>
                            {mercado.fecha_fin && (
                              <p>
                                <strong>Fin:</strong>{' '}
                                {formatearFecha(mercado.fecha_fin)}
                              </p>
                            )}
                          </div>
                        </div>

                        {mercado.estado === 'ACTIVO' && (
                          <button
                            onClick={() => handleCerrarMercado(mercado.id)}
                            className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition-all text-sm"
                            disabled={loading}
                          >
                            Cerrar
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {!torneoSeleccionado && (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border-2 border-white/20 text-center">
            <p className="text-white/80 text-lg">
              Selecciona un torneo para gestionar su mercado
            </p>
          </div>
        )}
      </div>
      <ConfirmModal
        open={confirmCerrarId !== null}
        title="Cerrar mercado"
        message="¿Estás seguro de cerrar este mercado?"
        confirmLabel="Cerrar mercado"
        confirmClassName="bg-red-600 hover:bg-red-700"
        onConfirm={confirmCerrar}
        onCancel={() => setConfirmCerrarId(null)}
      />
    </div>
  );
};

export default GestionMercadoAdmin;
