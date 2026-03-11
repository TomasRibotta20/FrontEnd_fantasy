import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  obtenerDetalleTorneo,
  abandonarTorneo,
  iniciarTorneo,
  modificarTorneo,
  expulsarParticipante,
} from '../../../services/torneosService';
import type {
  TorneoDetalle,
  ActualizarTorneoData,
} from '../../../services/torneosService';
import LoadingSpinner from '../../common/LoadingSpinner';
import {
  useTorneoSeleccionado,
  useMiEquipoId,
} from '../../../hooks/useSessionData';

/** Detalle y gestión de un torneo. */
function DetalleTorneo() {
  const navigate = useNavigate();
  const { torneoId } = useParams<{ torneoId: string }>();
  const [torneoGuardadoId, setTorneoGuardadoId] = useTorneoSeleccionado();
  const [, setMiEquipoId] = useMiEquipoId();
  const [torneo, setTorneo] = useState<TorneoDetalle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAbandonarModal, setShowAbandonarModal] = useState(false);
  const [showIniciarModal, setShowIniciarModal] = useState(false);
  const [showEditarModal, setShowEditarModal] = useState(false);
  const [showExpulsarModal, setShowExpulsarModal] = useState(false);
  const [participanteAExpulsar, setParticipanteAExpulsar] = useState<{
    userId: number;
    nombre: string;
  } | null>(null);
  const [editForm, setEditForm] = useState<ActualizarTorneoData>({});
  const [editando, setEditando] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const cargarDetalleTorneo = async () => {
    if (!torneoId) return;

    try {
      setIsLoading(true);
      const response = await obtenerDetalleTorneo(parseInt(torneoId));
      setTorneo(response.data);

      // Guardar la selección del torneo en localStorage cuando accedes a su detalle
      localStorage.setItem('torneoSeleccionadoId', torneoId);
    } catch {
      setMessage({
        type: 'error',
        text: 'Error al cargar los detalles del torneo',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    cargarDetalleTorneo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [torneoId]);

  const handleAbandonar = async () => {
    if (!torneoId) return;

    try {
      await abandonarTorneo(parseInt(torneoId));

      // Si el torneo abandonado era el seleccionado, limpiar la sesión
      if (torneoGuardadoId === torneoId) {
        setTorneoGuardadoId(null);
        setMiEquipoId(null);
      }

      setMessage({
        type: 'success',
        text: 'Has abandonado el torneo exitosamente',
      });
      setTimeout(() => {
        navigate('/torneos');
      }, 2000);
    } catch {
      setMessage({
        type: 'error',
        text: 'Error al abandonar el torneo',
      });
    }
    setShowAbandonarModal(false);
  };

  const handleIniciar = async () => {
    if (!torneoId) return;

    try {
      await iniciarTorneo(parseInt(torneoId));
      setMessage({
        type: 'success',
        text: 'Torneo iniciado exitosamente',
      });
      // Recargar los detalles del torneo
      await cargarDetalleTorneo();
    } catch {
      setMessage({
        type: 'error',
        text: 'Error al iniciar el torneo',
      });
    }
    setShowIniciarModal(false);
  };

  const handleOpenEditar = () => {
    setEditForm({
      nombre: torneo?.nombre || '',
      descripcion: torneo?.descripcion || '',
    });
    setShowEditarModal(true);
  };

  const handleGuardarEdicion = async () => {
    if (!torneoId) return;

    try {
      setEditando(true);
      // Solo enviar campos que tengan valor
      const dataToSend: ActualizarTorneoData = {};
      if (editForm.nombre && editForm.nombre !== torneo?.nombre) {
        dataToSend.nombre = editForm.nombre;
      }
      if (
        editForm.descripcion !== undefined &&
        editForm.descripcion !== torneo?.descripcion
      ) {
        dataToSend.descripcion = editForm.descripcion;
      }

      if (Object.keys(dataToSend).length === 0) {
        setMessage({
          type: 'error',
          text: 'No hay cambios para guardar',
        });
        setShowEditarModal(false);
        return;
      }

      await modificarTorneo(parseInt(torneoId), dataToSend);
      setMessage({
        type: 'success',
        text: 'Torneo actualizado exitosamente',
      });
      await cargarDetalleTorneo();
    } catch (error: unknown) {
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      setMessage({
        type: 'error',
        text:
          axiosError.response?.data?.message || 'Error al actualizar el torneo',
      });
    } finally {
      setEditando(false);
      setShowEditarModal(false);
    }
  };

  const handleOpenExpulsar = (userId: number, nombre: string) => {
    setParticipanteAExpulsar({ userId, nombre });
    setShowExpulsarModal(true);
  };

  const handleExpulsar = async () => {
    if (!torneoId || !participanteAExpulsar) return;

    try {
      await expulsarParticipante(
        parseInt(torneoId),
        participanteAExpulsar.userId,
      );
      setMessage({
        type: 'success',
        text: `${participanteAExpulsar.nombre} ha sido expulsado del torneo`,
      });
      await cargarDetalleTorneo();
    } catch (error: unknown) {
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      setMessage({
        type: 'error',
        text:
          axiosError.response?.data?.message ||
          'Error al expulsar al participante',
      });
    }
    setShowExpulsarModal(false);
    setParticipanteAExpulsar(null);
  };

  const getEstadoBadge = (estado: string) => {
    const badges = {
      EN_ESPERA: 'bg-yellow-500 text-white',
      ACTIVO: 'bg-green-500 text-white',
      FINALIZADO: 'bg-gray-500 text-white',
    };
    return badges[estado as keyof typeof badges] || 'bg-gray-400 text-white';
  };

  const esCreador = torneo?.soy_admin || false;

  if (isLoading) {
    return (
      <LoadingSpinner
        variant="fullpage"
        message="Cargando detalles del torneo..."
      />
    );
  }

  if (!torneo) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundImage: `url('/Background_LandingPage.png')`,
          backgroundSize: 'cover',
          backgroundAttachment: 'fixed',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
        className="relative z-0 flex items-center justify-center"
      >
        <div className="absolute inset-0 bg-black opacity-40 z-10"></div>
        <div className="relative z-20 bg-white/95 backdrop-blur-md rounded-2xl p-8 shadow-2xl text-center">
          <p className="text-2xl text-gray-600 mb-4">
            No se pudo cargar el torneo
          </p>
          <button
            onClick={() => navigate('/torneos')}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
          >
            Volver a Mis Torneos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundImage: `url('/Background_LandingPage.png')`,
        backgroundSize: 'cover',
        backgroundAttachment: 'fixed',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
      className="relative z-0"
    >
      <div className="absolute inset-0 bg-black opacity-40 z-10"></div>

      <div className="relative z-20 container mx-auto px-4 py-8 pt-32">
        {/* Mensajes */}
        {message && (
          <div
            className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-50 p-4 rounded-2xl shadow-2xl backdrop-blur-lg border-2 ${
              message.type === 'success'
                ? 'bg-green-500/90 border-green-400/50'
                : 'bg-red-500/90 border-red-400/50'
            } text-white font-bold min-w-[300px] text-center drop-shadow-xl`}
          >
            {message.text}
          </div>
        )}

        {/* Botón volver */}
        <button
          onClick={() => navigate('/torneos')}
          className="mb-6 bg-white/20 text-white px-6 py-2 rounded-lg font-semibold hover:bg-white/30 transition-all backdrop-blur-md"
        >
          ← Volver a Mis Torneos
        </button>

        {/* Información principal del torneo */}
        <div className="backdrop-blur-lg bg-white/20 rounded-2xl p-8 shadow-2xl mb-6 border-2 border-white/30">
          <div className="flex flex-col sm:flex-row justify-between items-start mb-6 gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <h1 className="text-2xl sm:text-4xl font-bold text-white drop-shadow-lg">
                  {torneo.nombre}
                </h1>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-bold ${getEstadoBadge(
                    torneo.estado,
                  )}`}
                >
                  {torneo.estado.replace('_', ' ')}
                </span>
                {esCreador && (
                  <span className="px-3 py-1 rounded-full text-sm font-bold bg-purple-500 text-white">
                    CREADOR
                  </span>
                )}
              </div>
              {torneo.descripcion && (
                <p className="text-white/80 text-lg mb-4">
                  {torneo.descripcion}
                </p>
              )}
            </div>
          </div>

          {/* Detalles del torneo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Código de acceso */}
            <div className="backdrop-blur-md bg-gradient-to-r from-blue-500/20 to-purple-500/20 p-6 rounded-xl border-2 border-white/30">
              <p className="text-sm text-white/70 mb-2">Código de Acceso:</p>
              <p className="text-xl sm:text-3xl font-mono font-bold text-white tracking-wider drop-shadow-md">
                {torneo.codigo}
              </p>
              <p className="text-xs text-white/60 mt-2">
                Comparte este código para que otros se unan
              </p>
            </div>

            {/* Participantes */}
            <div className="backdrop-blur-md bg-gradient-to-r from-green-500/20 to-teal-500/20 p-6 rounded-xl border-2 border-white/30">
              <p className="text-sm text-white/70 mb-2">Participantes:</p>
              <p className="text-3xl font-bold text-white drop-shadow-md">
                {torneo.participantes?.length || 0}
              </p>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex flex-wrap gap-4">
            {esCreador && torneo.estado === 'EN_ESPERA' && (
              <>
                <button
                  onClick={() => setShowIniciarModal(true)}
                  className="bg-green-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors"
                >
                  Iniciar Torneo
                </button>
                <button
                  onClick={handleOpenEditar}
                  className="bg-yellow-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-yellow-600 transition-colors"
                >
                  Editar Torneo
                </button>
              </>
            )}
            {torneo.estado === 'ACTIVO' && torneo.mi_equipo_id && (
              <>
                <button
                  onClick={() => navigate(`/LoggedMenu?torneoId=${torneoId}`)}
                  className="bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
                >
                  Ir al Torneo
                </button>
                <button
                  onClick={() => navigate(`/mercado/${torneoId}`)}
                  className="bg-gradient-to-r from-emerald-500 to-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-emerald-600 hover:to-green-700 transition-all shadow-lg"
                >
                  Ver Mercado
                </button>
              </>
            )}
            {(torneo.estado === 'EN_ESPERA' || torneo.estado === 'ACTIVO') && (
              <button
                onClick={() => setShowAbandonarModal(true)}
                className="bg-red-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-600 transition-colors"
              >
                Abandonar Torneo
              </button>
            )}
          </div>
        </div>

        {/* Lista de participantes */}
        {torneo.participantes && torneo.participantes.length > 0 && (
          <div className="backdrop-blur-lg bg-white/20 rounded-2xl p-8 shadow-2xl border-2 border-white/30">
            <h2 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-lg mb-6">
              Participantes (
              {torneo.participantes.filter((p) => !p.expulsado).length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {torneo.participantes.map((participante) => (
                <div
                  key={participante.equipo_id}
                  className={`backdrop-blur-md p-4 rounded-xl border-2 transition-all ${
                    participante.expulsado
                      ? 'bg-red-900/20 border-red-400/30 opacity-60'
                      : 'bg-white/15 border-white/20 hover:border-white/40 hover:bg-white/25'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p
                        className={`text-lg font-bold drop-shadow-md ${participante.expulsado ? 'text-white/50 line-through' : 'text-white'}`}
                      >
                        {participante.nombre_equipo}
                      </p>
                      <p
                        className={`text-sm ${participante.expulsado ? 'text-white/40 line-through' : 'text-white/80'}`}
                      >
                        {participante.usuario}
                      </p>
                      <p
                        className={`text-xs mt-1 ${participante.expulsado ? 'text-white/30' : 'text-white/60'}`}
                      >
                        Puntos: {participante.puntos}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex gap-1">
                        {participante.expulsado && (
                          <span className="px-2 py-1 bg-red-500/80 text-white text-xs rounded-full font-bold">
                            EXPULSADO
                          </span>
                        )}
                        {!participante.expulsado &&
                          participante.es_mi_equipo && (
                            <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full font-bold">
                              TÚ
                            </span>
                          )}
                        {!participante.expulsado && participante.es_admin && (
                          <span className="px-2 py-1 bg-purple-500 text-white text-xs rounded-full font-bold">
                            ADMIN
                          </span>
                        )}
                      </div>
                      {/* Botón expulsar - solo para creador, no a sí mismo, no ya expulsados */}
                      {esCreador &&
                        !participante.es_mi_equipo &&
                        !participante.expulsado && (
                          <button
                            onClick={() =>
                              handleOpenExpulsar(
                                participante.usuario_id,
                                participante.usuario,
                              )
                            }
                            className="px-2 py-1 bg-red-500/80 hover:bg-red-600 text-white text-xs rounded font-semibold transition-colors"
                            title="Expulsar participante"
                          >
                            Expulsar
                          </button>
                        )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal de confirmación para abandonar */}
      {showAbandonarModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="backdrop-blur-xl bg-white/20 rounded-2xl p-8 max-w-md mx-4 shadow-2xl border-2 border-white/30">
            <h3 className="text-2xl font-bold text-white drop-shadow-lg mb-4">
              ¿Abandonar Torneo?
            </h3>
            <p className="text-white/80 mb-6">
              ¿Estás seguro de que quieres abandonar el torneo "{torneo.nombre}
              "? Esta acción no se puede deshacer.
              {torneo.estado === 'ACTIVO' && (
                <span className="block mt-2 text-yellow-300 text-sm font-semibold">
                  ⚠️ El torneo está activo. Tu equipo será eliminado y quedarás
                  como expulsado.
                  {esCreador &&
                    ' El rol de creador se transferirá a otro participante.'}
                </span>
              )}
              {esCreador && torneo.estado === 'EN_ESPERA' && (
                <span className="block mt-2 text-yellow-300 text-sm font-semibold">
                  ⚠️ Eres el creador. El rol se transferirá al participante más
                  antiguo.
                </span>
              )}
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowAbandonarModal(false)}
                className="flex-1 bg-gray-500 text-white py-3 rounded-lg font-semibold hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAbandonar}
                className="flex-1 bg-red-500 text-white py-3 rounded-lg font-semibold hover:bg-red-600 transition-colors"
              >
                Abandonar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación para iniciar */}
      {showIniciarModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="backdrop-blur-xl bg-white/20 rounded-2xl p-8 max-w-md mx-4 shadow-2xl border-2 border-white/30">
            <h3 className="text-2xl font-bold text-white drop-shadow-lg mb-4">
              ¿Iniciar Torneo?
            </h3>
            <p className="text-white/80 mb-6">
              ¿Estás seguro de que quieres iniciar el torneo "{torneo.nombre}"?
              Una vez iniciado, no se podrán unir más participantes.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowIniciarModal(false)}
                className="flex-1 bg-gray-500 text-white py-3 rounded-lg font-semibold hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleIniciar}
                className="flex-1 bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors"
              >
                Iniciar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de edición del torneo */}
      {showEditarModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="backdrop-blur-xl bg-white/20 rounded-2xl p-8 max-w-lg w-full mx-4 shadow-2xl border-2 border-white/30">
            <h3 className="text-2xl font-bold text-white drop-shadow-lg mb-6">
              Editar Torneo
            </h3>

            <div className="space-y-4">
              {/* Nombre */}
              <div>
                <label className="block text-white/80 text-sm font-semibold mb-2">
                  Nombre del Torneo
                </label>
                <input
                  type="text"
                  value={editForm.nombre || ''}
                  onChange={(e) =>
                    setEditForm({ ...editForm, nombre: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border-2 border-white/30 text-white placeholder-white/50 focus:outline-none focus:border-blue-400 transition-colors"
                  placeholder="Nombre del torneo"
                />
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-white/80 text-sm font-semibold mb-2">
                  Descripción (opcional)
                </label>
                <textarea
                  value={editForm.descripcion || ''}
                  onChange={(e) =>
                    setEditForm({ ...editForm, descripcion: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border-2 border-white/30 text-white placeholder-white/50 focus:outline-none focus:border-blue-400 transition-colors resize-none"
                  placeholder="Descripción del torneo"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setShowEditarModal(false)}
                disabled={editando}
                className="flex-1 bg-gray-500 text-white py-3 rounded-lg font-semibold hover:bg-gray-600 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardarEdicion}
                disabled={editando}
                className="flex-1 bg-yellow-500 text-white py-3 rounded-lg font-semibold hover:bg-yellow-600 transition-colors disabled:opacity-50"
              >
                {editando ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación para expulsar */}
      {showExpulsarModal && participanteAExpulsar && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="backdrop-blur-xl bg-white/20 rounded-2xl p-8 max-w-md mx-4 shadow-2xl border-2 border-white/30">
            <h3 className="text-2xl font-bold text-white drop-shadow-lg mb-4">
              ¿Expulsar Participante?
            </h3>
            <p className="text-white/80 mb-6">
              ¿Estás seguro de que quieres expulsar a{' '}
              <strong>{participanteAExpulsar.nombre}</strong> del torneo? Esta
              acción no se puede deshacer.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowExpulsarModal(false);
                  setParticipanteAExpulsar(null);
                }}
                className="flex-1 bg-gray-500 text-white py-3 rounded-lg font-semibold hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleExpulsar}
                className="flex-1 bg-red-500 text-white py-3 rounded-lg font-semibold hover:bg-red-600 transition-colors"
              >
                Expulsar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DetalleTorneo;
