import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  obtenerDetalleTorneo,
  expulsarParticipante,
} from '../../../services/torneosService';
import type { TorneoDetalle } from '../../../services/torneosService';
import recompensasService, {
  type Recompensa,
} from '../../../services/recompensasService';
import ModalRecompensas from './ModalRecompensas';
import LoadingSpinner from '../../common/LoadingSpinner';
import ConfirmModal from '../../common/ConfirmModal';
import { Notification } from '../../common/Notification';
import { useTorneoSeleccionado } from '../../../hooks/useSessionData';

interface Participante {
  pos: number;
  usuario_id: number;
  usuario: string;
  equipo_id: number;
  nombre_equipo: string;
  puntos: number;
  es_mi_equipo: boolean;
  es_admin: boolean;
  expulsado?: boolean;
}

/** Tabla de clasificación del torneo. */
const LeaderboardTorneo = () => {
  const navigate = useNavigate();
  const { torneoId: torneoIdFromParams } = useParams<{ torneoId: string }>();

  // ✅ Usar hook como fallback si no hay torneoId en la URL
  const [torneoGuardadoId] = useTorneoSeleccionado();
  const torneoId = torneoIdFromParams || torneoGuardadoId;

  // Si no hay torneoId en la URL pero sí en el hook, redirigir a la URL correcta
  useEffect(() => {
    if (!torneoIdFromParams && torneoGuardadoId) {
      navigate(`/leaderboard/${torneoGuardadoId}`, { replace: true });
    }
  }, [torneoIdFromParams, torneoGuardadoId, navigate]);

  const [torneo, setTorneo] = useState<TorneoDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recompensasPendientes, setRecompensasPendientes] = useState<
    Recompensa[]
  >([]);
  const [mostrarModalRecompensa, setMostrarModalRecompensa] = useState(false);
  const [recompensaActual, setRecompensaActual] = useState<Recompensa | null>(
    null,
  );

  // Estado para expulsar participante
  const [showExpulsarModal, setShowExpulsarModal] = useState(false);
  const [participanteAExpulsar, setParticipanteAExpulsar] = useState<{
    userId: number;
    nombre: string;
  } | null>(null);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'warning' | 'info';
    text: string;
  } | null>(null);

  const cargarRecompensasPendientes = async () => {
    try {
      const recompensas = await recompensasService.obtenerPendientes();
      // Filtrar recompensas de este torneo usando id_torneo
      if (Array.isArray(recompensas)) {
        const recompensasDeTorneo = torneoId
          ? recompensas.filter((r: Recompensa) => {
              // Usar id_torneo del backend
              const torneoRecompensa = r.id_torneo || r.torneo;
              const torneoIdNum = parseInt(torneoId);
              return torneoRecompensa === torneoIdNum;
            })
          : recompensas;
        setRecompensasPendientes(recompensasDeTorneo);
      } else {
        setRecompensasPendientes([]);
      }
    } catch {
      setRecompensasPendientes([]);
    }
  };

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);

        if (!torneoId) {
          setError('No se especificó un torneo');
          return;
        }

        const response = await obtenerDetalleTorneo(parseInt(torneoId));
        setTorneo(response.data);

        // Cargar recompensas pendientes
        await cargarRecompensasPendientes();
      } catch {
        setError('Error al cargar los datos del torneo');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [torneoId]);

  const handleReclamarRecompensa = (recompensa: Recompensa) => {
    setRecompensaActual(recompensa);
    setMostrarModalRecompensa(true);
  };

  const handleRecompensaReclamada = () => {
    cargarRecompensasPendientes();
  };

  const handleVerEquipo = (participante: Participante) => {
    if (participante.es_mi_equipo) {
      navigate('/UpdateTeam');
    } else {
      navigate(
        `/ver-equipo?equipoId=${participante.equipo_id}&torneoId=${torneoId}&usuario=${participante.usuario}`,
      );
    }
  };

  const handleVolver = () => {
    if (torneoId) {
      navigate(`/LoggedMenu?torneoId=${torneoId}`);
    } else {
      navigate('/LoggedMenu');
    }
  };

  const esCreador = torneo?.soy_admin || false;

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
      setNotification({
        type: 'success',
        text: `${participanteAExpulsar.nombre} ha sido expulsado del torneo`,
      });
      // Recargar datos
      const response = await obtenerDetalleTorneo(parseInt(torneoId));
      setTorneo(response.data);
    } catch (error: unknown) {
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      setNotification({
        type: 'error',
        text:
          axiosError.response?.data?.message ||
          'Error al expulsar al participante',
      });
    }
    setShowExpulsarModal(false);
    setParticipanteAExpulsar(null);
  };

  if (loading) {
    return (
      <LoadingSpinner variant="fullpage" message="Cargando leaderboard..." />
    );
  }

  if (error || !torneo) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div
          className="fixed inset-0 bg-cover bg-center bg-no-repeat -z-10"
          style={{
            backgroundImage: `url('/Background_LandingPage.png')`,
            filter: 'blur(2px)',
          }}
        >
          <div className="absolute inset-0 bg-black opacity-30"></div>
        </div>
        <div className="text-white text-xl">
          {error || 'Torneo no encontrado'}
        </div>
      </div>
    );
  }

  const participantes = torneo.participantes || [];

  return (
    <div className="min-h-screen pt-20 pb-8">
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

      <Notification
        message={notification}
        onClose={() => setNotification(null)}
      />

      <div className="container mx-auto px-4 relative z-10">
        {/* Notificación de Recompensas Pendientes */}
        {recompensasPendientes.length > 0 && (
          <div className="max-w-4xl mx-auto mb-6">
            <div className="backdrop-blur-lg bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-2 border-yellow-400/60 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div>
                    <h3 className="text-white font-bold text-lg">
                      ¡Tienes {recompensasPendientes.length} recompensa
                      {recompensasPendientes.length > 1 ? 's' : ''} disponible
                      {recompensasPendientes.length > 1 ? 's' : ''}!
                    </h3>
                    <p className="text-white/80 text-sm">
                      Haz clic para reclamar tu premio
                    </p>
                  </div>
                </div>
                <button
                  onClick={() =>
                    handleReclamarRecompensa(recompensasPendientes[0])
                  }
                  className="bg-yellow-500/60 hover:bg-yellow-500/80 text-white px-6 py-2 rounded-lg font-bold transition-all border border-yellow-400/60 shadow-lg hover:shadow-xl"
                >
                  Reclamar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-8">
          <button
            onClick={handleVolver}
            className="mb-4 inline-flex items-center gap-2 text-white hover:text-white/80 transition-colors"
          >
            <svg
              className="w-5 h-5"
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
          <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">
            Leaderboard
          </h1>
          <h2 className="text-2xl text-white/90 drop-shadow-lg">
            {torneo.nombre}
          </h2>
          <div className="mt-2">
            <span
              className={`inline-block px-4 py-1 rounded-full text-sm font-semibold ${
                torneo.estado === 'ACTIVO'
                  ? 'bg-green-500/80 text-white'
                  : torneo.estado === 'EN_ESPERA'
                    ? 'bg-yellow-500/80 text-white'
                    : 'bg-gray-500/80 text-white'
              }`}
            >
              {torneo.estado.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="max-w-4xl mx-auto">
          <div className="backdrop-blur-lg bg-white/10 rounded-xl border-2 border-white/40 overflow-hidden">
            {/* Table Header */}
            <div className="bg-blue-500/30 p-4 border-b-2 border-white/40">
              <div
                className={`grid ${esCreador ? 'grid-cols-[3rem_1fr_1fr_5rem_4rem_6rem_5rem]' : 'grid-cols-[3rem_1fr_1fr_5rem_4rem_6rem]'} gap-4 text-white font-bold text-sm`}
              >
                <div className="text-center">Pos</div>
                <div>Usuario</div>
                <div>Equipo</div>
                <div className="text-center">Puntos</div>
                <div className="text-center">Rol</div>
                <div className="text-center">Acción</div>
                {esCreador && <div className="text-center"></div>}
              </div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-white/20">
              {participantes.length === 0 ? (
                <div className="p-8 text-center text-white">
                  No hay participantes en este torneo
                </div>
              ) : (
                participantes.map((participante) => (
                  <div
                    key={participante.equipo_id}
                    className={`p-4 transition-all duration-200 ${
                      participante.expulsado
                        ? 'bg-red-900/20 opacity-60'
                        : participante.es_mi_equipo
                          ? 'bg-blue-500/20 hover:bg-blue-500/30'
                          : 'hover:bg-white/5'
                    }`}
                  >
                    <div
                      className={`grid ${esCreador ? 'grid-cols-[3rem_1fr_1fr_5rem_4rem_6rem_5rem]' : 'grid-cols-[3rem_1fr_1fr_5rem_4rem_6rem]'} gap-4 items-center text-white`}
                    >
                      {/* Posición */}
                      <div className="text-center">
                        {participante.expulsado ? (
                          <div className="inline-flex items-center justify-center w-8 h-8 rounded-full font-bold bg-red-500/30 text-red-300">
                            ✕
                          </div>
                        ) : (
                          <div
                            className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                              participante.pos === 1
                                ? 'bg-yellow-400 text-yellow-900'
                                : participante.pos === 2
                                  ? 'bg-gray-300 text-gray-800'
                                  : participante.pos === 3
                                    ? 'bg-orange-400 text-orange-900'
                                    : 'bg-white/20 text-white'
                            }`}
                          >
                            {participante.pos}
                          </div>
                        )}
                      </div>

                      {/* Usuario */}
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-semibold truncate ${participante.expulsado ? 'line-through text-white/50' : ''}`}
                          >
                            {participante.usuario}
                          </span>
                          {participante.expulsado && (
                            <span className="text-xs bg-red-500/60 px-2 py-0.5 rounded-full text-red-100 font-bold">
                              EXPULSADO
                            </span>
                          )}
                          {!participante.expulsado &&
                            participante.es_mi_equipo && (
                              <span className="text-xs bg-blue-500/60 px-2 py-0.5 rounded-full">
                                Tú
                              </span>
                            )}
                        </div>
                      </div>

                      {/* Equipo */}
                      <div
                        className={`truncate ${participante.expulsado ? 'line-through text-white/50' : ''}`}
                      >
                        {participante.nombre_equipo}
                      </div>

                      {/* Puntos */}
                      <div
                        className={`text-center font-bold text-lg ${participante.expulsado ? 'text-white/40' : ''}`}
                      >
                        {Number(participante.puntos).toFixed(2)}
                      </div>

                      {/* Rol */}
                      <div className="text-center">
                        {participante.es_admin && !participante.expulsado && (
                          <span
                            className="bg-yellow-500/30 text-yellow-300 px-2 py-1 rounded text-xs font-semibold border border-yellow-400/40"
                            title="Creador del torneo"
                          >
                            Creador
                          </span>
                        )}
                      </div>

                      {/* Acción */}
                      <div className="text-center">
                        {!participante.expulsado &&
                          torneo.estado !== 'EN_ESPERA' && (
                            <button
                              onClick={() => handleVerEquipo(participante)}
                              className={`${participante.es_mi_equipo ? 'bg-green-500/60 hover:bg-green-500/80 border-green-400/40' : 'bg-blue-500/60 hover:bg-blue-500/80 border-blue-400/40'} text-white px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 shadow-lg hover:shadow-xl border`}
                            >
                              {participante.es_mi_equipo
                                ? 'Mi Equipo'
                                : 'Ver Equipo'}
                            </button>
                          )}
                      </div>

                      {/* Expulsar (solo creador, no a sí mismo, no ya expulsados) */}
                      {esCreador && (
                        <div className="text-center">
                          {!participante.es_mi_equipo &&
                            !participante.expulsado && (
                              <button
                                onClick={() =>
                                  handleOpenExpulsar(
                                    participante.usuario_id,
                                    participante.usuario,
                                  )
                                }
                                className="bg-red-500/60 hover:bg-red-600/80 text-white px-3 py-2 rounded-lg font-semibold text-xs transition-all duration-200 border border-red-400/40"
                                title="Expulsar participante"
                              >
                                Expulsar
                              </button>
                            )}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Estadísticas adicionales */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="backdrop-blur-lg bg-white/10 rounded-xl border-2 border-white/40 p-4 text-center">
              <div className="text-white/70 text-sm mb-1">
                Total Participantes
              </div>
              <div className="text-white text-2xl font-bold">
                {participantes.length}
              </div>
            </div>
            <div className="backdrop-blur-lg bg-white/10 rounded-xl border-2 border-white/40 p-4 text-center">
              <div className="text-white/70 text-sm mb-1">
                Código del Torneo
              </div>
              <div className="text-white text-2xl font-bold">
                {torneo.codigo}
              </div>
            </div>
            <div className="backdrop-blur-lg bg-white/10 rounded-xl border-2 border-white/40 p-4 text-center">
              <div className="text-white/70 text-sm mb-1">Tu Posición</div>
              <div className="text-white text-2xl font-bold">
                {participantes.find((p) => p.es_mi_equipo)?.pos || '-'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Recompensas */}
      {mostrarModalRecompensa && recompensaActual && (
        <ModalRecompensas
          recompensa={recompensaActual}
          onClose={() => setMostrarModalRecompensa(false)}
          onReclamada={handleRecompensaReclamada}
        />
      )}

      {/* Modal de Expulsar */}
      <ConfirmModal
        open={showExpulsarModal}
        title="Expulsar participante"
        message={`¿Estás seguro de expulsar a "${participanteAExpulsar?.nombre}" del torneo? Esta acción no se puede deshacer. El participante no podrá volver a unirse.`}
        confirmLabel="Expulsar"
        confirmClassName="bg-red-600 hover:bg-red-700"
        onConfirm={handleExpulsar}
        onCancel={() => {
          setShowExpulsarModal(false);
          setParticipanteAExpulsar(null);
        }}
      />
    </div>
  );
};

export default LeaderboardTorneo;
