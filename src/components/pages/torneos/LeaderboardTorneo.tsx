import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { obtenerDetalleTorneo } from '../../../services/torneosService';
import type { TorneoDetalle } from '../../../services/torneosService';
import recompensasService, {
  type Recompensa,
} from '../../../services/recompensasService';
import ModalRecompensas from './ModalRecompensas';
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
}

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
    null
  );

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
    } catch (err) {
      console.error('❌ Error al cargar recompensas:', err);
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
      } catch (err) {
        console.error('Error al cargar el leaderboard:', err);
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
    navigate(
      `/ver-equipo?equipoId=${participante.equipo_id}&torneoId=${torneoId}&usuario=${participante.usuario}`
    );
  };

  const handleVolver = () => {
    if (torneoId) {
      navigate(`/LoggedMenu?torneoId=${torneoId}`);
    } else {
      navigate('/LoggedMenu');
    }
  };

  if (loading) {
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
        <div className="text-white text-xl">Cargando...</div>
      </div>
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
              <div className="grid grid-cols-12 gap-4 text-white font-bold text-sm">
                <div className="col-span-1 text-center">Pos</div>
                <div className="col-span-3">Usuario</div>
                <div className="col-span-3">Equipo</div>
                <div className="col-span-2 text-center">Puntos</div>
                <div className="col-span-1 text-center">Rol</div>
                <div className="col-span-2 text-center">Acción</div>
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
                      participante.es_mi_equipo
                        ? 'bg-blue-500/20 hover:bg-blue-500/30'
                        : 'hover:bg-white/5'
                    }`}
                  >
                    <div className="grid grid-cols-12 gap-4 items-center text-white">
                      {/* Posición */}
                      <div className="col-span-1 text-center">
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
                      </div>

                      {/* Usuario */}
                      <div className="col-span-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold truncate">
                            {participante.usuario}
                          </span>
                          {participante.es_mi_equipo && (
                            <span className="text-xs bg-blue-500/60 px-2 py-0.5 rounded-full">
                              Tú
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Equipo */}
                      <div className="col-span-3 truncate">
                        {participante.nombre_equipo}
                      </div>

                      {/* Puntos */}
                      <div className="col-span-2 text-center font-bold text-lg">
                        {Number(participante.puntos).toFixed(2)}
                      </div>

                      {/* Rol */}
                      <div className="col-span-1 text-center">
                        {participante.es_admin && (
                          <span
                            className="bg-yellow-500/30 text-yellow-300 px-2 py-1 rounded text-xs font-semibold border border-yellow-400/40"
                            title="Creador del torneo"
                          >
                            Creador
                          </span>
                        )}
                      </div>

                      {/* Acción */}
                      <div className="col-span-2 text-center">
                        <button
                          onClick={() => handleVerEquipo(participante)}
                          className="bg-blue-500/60 hover:bg-blue-500/80 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 shadow-lg hover:shadow-xl border border-blue-400/40"
                        >
                          Ver Equipo
                        </button>
                      </div>
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
    </div>
  );
};

export default LeaderboardTorneo;

