import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import apiClient from '../../../services/apiClient';
import FormacionEquipoCompacta from '../../common/FormacionEquipoCompacta';
import { ofertasService } from '../../../services/ofertasService';
import { Notification } from '../../common/Notification';
import {
  mapBackendPlayerToFrontend,
  getPositionDisplayName,
} from '../../../utils/playerMapper';
import type {
  Player,
  BackendPlayerResponse,
} from '../../../types/player.types';
import {
  useMiEquipoId,
  useTorneoSeleccionado,
} from '../../../hooks/useSessionData';

const VerEquipoOtroJugador = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Hooks de sesión para obtener mi equipo y torneo
  const [miEquipoIdGuardado] = useMiEquipoId();
  const [torneoGuardadoId] = useTorneoSeleccionado();

  const [teamPlayers, setTeamPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nombreEquipo, setNombreEquipo] = useState<string>('');
  const [nombreUsuario, setNombreUsuario] = useState<string>('');
  const [presupuestoTotal, setPresupuestoTotal] = useState<number>(0);
  const [presupuestoBloqueado, setPresupuestoBloqueado] = useState<number>(0);
  const [presupuestoIntentadoCargar, setPresupuestoIntentadoCargar] =
    useState(false);
  const presupuestoDisponible = presupuestoTotal - presupuestoBloqueado;

  // Estados para el modal de ofertas
  const [jugadorSeleccionado, setJugadorSeleccionado] = useState<Player | null>(
    null
  );
  const [montoOferta, setMontoOferta] = useState<string>('');
  const [mensajeOferta, setMensajeOferta] = useState<string>('');
  const [enviandoOferta, setEnviandoOferta] = useState(false);

  // Estado para jugador seleccionado en la formación
  const [jugadorSeleccionadoFormacion, setJugadorSeleccionadoFormacion] =
    useState<Player | null>(null);

  // Estado para notificaciones
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'warning' | 'info';
    text: string;
  } | null>(null);

  useEffect(() => {
    const fetchTeamPlayers = async () => {
      try {
        setLoading(true);
        const equipoId = searchParams.get('equipoId');
        const usuario = searchParams.get('usuario');
        const torneoId = searchParams.get('torneoId') || torneoGuardadoId;

        if (!equipoId) {
          setError('No se especificó un equipo');
          return;
        }

        // Obtener presupuesto disponible del usuario actual
        let presupuestoCargado = false;
        try {
          // Primero intentar con el equipoId guardado en el hook de sesión
          if (miEquipoIdGuardado) {
            try {
              const miEquipoResponse = await apiClient.get(
                `/api/equipos/detalle-equipo/${miEquipoIdGuardado}`
              );
              const miEquipoData =
                miEquipoResponse.data?.data || miEquipoResponse.data;
              if (miEquipoData?.presupuesto !== undefined) {
                const presupuesto = miEquipoData.presupuesto || 0;
                const bloqueado = miEquipoData.presupuesto_bloqueado || 0;

                setPresupuestoTotal(presupuesto);
                setPresupuestoBloqueado(bloqueado);
                presupuestoCargado = true;
              }
            } catch (err) {
              console.error(
                'Error al obtener presupuesto con equipoId guardado:',
                err
              );
            }
          }

          // Si no funciona, intentar obtener desde el contexto del torneoId
          if (!presupuestoCargado && torneoId) {
            try {
              // Obtener el equipoId del usuario para este torneo desde el endpoint de torneos
              const response = await apiClient.get(`/api/torneos/${torneoId}`);
              const torneoData = response.data?.data || response.data;
              if (torneoData?.mi_equipo_id) {
                const miEquipoResponse = await apiClient.get(
                  `/api/equipos/detalle-equipo/${torneoData.mi_equipo_id}`
                );
                const miEquipoData =
                  miEquipoResponse.data?.data || miEquipoResponse.data;

                if (miEquipoData?.presupuesto !== undefined) {
                  const presupuesto = miEquipoData.presupuesto || 0;
                  const bloqueado = miEquipoData.presupuesto_bloqueado || 0;

                  setPresupuestoTotal(presupuesto);
                  setPresupuestoBloqueado(bloqueado);
                  presupuestoCargado = true;
                }
              }
            } catch (err) {
              console.error('Error al obtener presupuesto desde torneo:', err);
            }
          }
          setPresupuestoIntentadoCargar(true);
        } catch (error) {
          console.error('Error general al obtener presupuesto:', error);
          setPresupuestoIntentadoCargar(true);
        }

        if (usuario) {
          setNombreUsuario(usuario);
        }

        // Usar el endpoint con el equipoId del otro jugador
        const response = await apiClient.get(
          `/api/equipos/detalle-equipo/${equipoId}`
        );
        const equipoData = response.data?.data || response.data;

        if (equipoData) {
          setNombreEquipo(equipoData.nombre || 'Equipo');

          if (equipoData.jugadores) {
            // ✅ Usar función centralizada del playerMapper
            const mappedPlayers = equipoData.jugadores.map(
              (item: BackendPlayerResponse, index: number) =>
                mapBackendPlayerToFrontend(item, index)
            );

            // Guardar todos los jugadores (titulares y suplentes)
            setTeamPlayers(mappedPlayers);

            // Intentar obtener puntajes de la última jornada
            try {
              const historialResponse = await apiClient.get(
                `/api/equipos/${equipoId}/historial`
              );
              const historialData = Array.isArray(historialResponse.data)
                ? historialResponse.data
                : historialResponse.data?.data || [];

              if (historialData.length > 0) {
                const ordenado = historialData.sort(
                  (
                    a: { jornada?: { id: number } },
                    b: { jornada?: { id: number } }
                  ) => (b.jornada?.id || 0) - (a.jornada?.id || 0)
                );
                const ultimaJornada = ordenado[0];
                const jornadaId = ultimaJornada?.jornada?.id;

                if (jornadaId) {
                  const detalleResponse = await apiClient.get(
                    `/api/equipos/${equipoId}/puntos/jornadas/${jornadaId}`
                  );
                  const detalle =
                    detalleResponse.data?.data || detalleResponse.data;

                  if (detalle?.jugadores) {
                    const jugadoresConPuntajes = mappedPlayers.map(
                      (player: Player) => {
                        const jugadorConPuntaje = detalle.jugadores.find(
                          (j: {
                            nombre?: string;
                            name?: string;
                            id?: number;
                            apiId?: number;
                          }) => {
                            const nombreMatch =
                              j.nombre === player.name ||
                              j.name === player.name;
                            const idMatch =
                              (j.id && j.id === player.id) ||
                              (j.apiId && j.apiId === player.apiId);
                            return nombreMatch || idMatch;
                          }
                        );

                        // Solo incluir puntaje si existe y es mayor a 0
                        const puntajeReal = jugadorConPuntaje?.puntaje;
                        return {
                          ...player,
                          ...(typeof puntajeReal === 'number' && puntajeReal > 0
                            ? { puntaje: puntajeReal }
                            : {}),
                        };
                      }
                    );

                    setTeamPlayers(jugadoresConPuntajes);
                  }
                }
              }
            } catch {
              // Continuar sin puntajes
            }
          }
        }
      } catch (err) {
        console.error('Error al cargar el equipo:', err);
        setError('Error al cargar el equipo del jugador');
      } finally {
        setLoading(false);
      }
    };

    fetchTeamPlayers();
  }, [searchParams, miEquipoIdGuardado, torneoGuardadoId]);

  const handleEjecutarClausula = async (player: Player) => {
    if (!player.valor_clausula || !player.id) {
      setNotification({
        type: 'error',
        text: 'Este jugador no tiene cláusula de rescisión',
      });
      return;
    }

    const miEquipoId = localStorage.getItem('miEquipoId');
    if (!miEquipoId) {
      setNotification({
        type: 'error',
        text: 'No se pudo obtener tu equipo',
      });
      return;
    }

    if (presupuestoDisponible < player.valor_clausula) {
      setNotification({
        type: 'error',
        text: `Presupuesto insuficiente. Necesitas $${player.valor_clausula.toLocaleString(
          'es-AR'
        )} pero solo tienes $${presupuestoDisponible.toLocaleString('es-AR')}`,
      });
      return;
    }

    const confirmar = window.confirm(
      `¿Estás seguro de ejecutar la cláusula de ${
        player.name
      } por $${player.valor_clausula.toLocaleString(
        'es-AR'
      )}?\n\nEsto transferirá al jugador a tu equipo automáticamente.`
    );

    if (!confirmar) return;

    try {
      setEnviandoOferta(true);
      await apiClient.post(
        `/api/clausulas/${miEquipoId}/jugadores/${player.id}/ejecutar-clausula`
      );

      setNotification({
        type: 'success',
        text: `¡Cláusula ejecutada! ${player.name} ahora es parte de tu equipo`,
      });

      // Recargar después de 2 segundos
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Error al ejecutar cláusula:', error);
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as {
          response?: { data?: { message?: string } };
        };
        const errorMsg =
          axiosError.response?.data?.message || 'Error al ejecutar la cláusula';
        setNotification({
          type: 'error',
          text: errorMsg,
        });
      } else {
        setNotification({
          type: 'error',
          text: 'Error al ejecutar la cláusula',
        });
      }
    } finally {
      setEnviandoOferta(false);
    }
  };

  const handleHacerOferta = (player: Player) => {
    // Guardar jugador seleccionado en formación
    setJugadorSeleccionadoFormacion(player);

    if (!player.equipoJugadorId) {
      setNotification({
        type: 'error',
        text: 'No se puede hacer oferta por este jugador',
      });
      return;
    }
    setJugadorSeleccionado(player);
    // Establecer el precio del jugador como valor por defecto
    setMontoOferta(player.precio?.toString() || '');
    setMensajeOferta('');
  };

  const handleEnviarOferta = async () => {
    if (!jugadorSeleccionado?.equipoJugadorId) return;

    const monto = parseFloat(montoOferta);
    if (isNaN(monto) || monto <= 0) {
      setNotification({
        type: 'error',
        text: 'Ingresa un monto válido',
      });
      return;
    }

    // Validar presupuesto disponible
    if (presupuestoDisponible > 0 && monto > presupuestoDisponible) {
      setNotification({
        type: 'error',
        text: `Presupuesto insuficiente. Disponible: $${presupuestoDisponible.toLocaleString(
          'es-AR',
          { minimumFractionDigits: 2 }
        )}, Oferta: $${monto.toLocaleString('es-AR', {
          minimumFractionDigits: 2,
        })}`,
      });
      return;
    }

    setEnviandoOferta(true);

    const ofertaData = {
      equipoJugador_id: jugadorSeleccionado.equipoJugadorId,
      monto_ofertado: monto,
      mensaje_oferente: mensajeOferta.trim() || undefined,
    };

    try {
      const response = await ofertasService.crearOferta(ofertaData);
      setNotification({
        type: 'success',
        text: `Oferta enviada por ${jugadorSeleccionado.name}`,
      });
      handleCerrarModal();
    } catch (error: unknown) {
      console.error('Error completo:', error);
      let errorMessage = 'Error al enviar la oferta';
      if (error && typeof error === 'object' && 'response' in error) {
        const response = error.response as {
          data?: { message?: string; error?: string };
          status?: number;
        };
        errorMessage =
          response?.data?.message || response?.data?.error || errorMessage;
      }
      setNotification({
        type: 'error',
        text: errorMessage,
      });
    } finally {
      setEnviandoOferta(false);
    }
  };

  const handleCerrarModal = () => {
    setJugadorSeleccionado(null);
    setMontoOferta('');
    setMensajeOferta('');
  };

  const handleVolver = () => {
    const torneoId = searchParams.get('torneoId');
    if (torneoId) {
      navigate(`/leaderboard?torneoId=${torneoId}`);
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
        <div className="text-white text-xl">Cargando equipo...</div>
      </div>
    );
  }

  if (error) {
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
        <div className="text-center">
          <div className="text-white text-xl mb-4">{error}</div>
          <button
            onClick={handleVolver}
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-6 py-2 rounded-lg font-semibold"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden pt-20">
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

      <div className="container mx-auto px-4 h-[calc(100vh-5rem)] flex flex-col relative z-10 py-3">
        {/* Header */}
        <div className="text-center mb-3 flex-shrink-0">
          <button
            onClick={handleVolver}
            className="mb-2 inline-flex items-center gap-2 text-white hover:text-white/80 transition-colors"
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
            Volver al Leaderboard
          </button>
          <h1 className="text-3xl font-bold text-white mb-1 drop-shadow-lg">
            {nombreEquipo}
          </h1>
          <p className="text-lg text-white/90 drop-shadow-lg">
            Jugador: {nombreUsuario}
          </p>
        </div>

        {/* Contenido principal */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-0 overflow-hidden">
          {/* Columna izquierda: Estadísticas */}
          <div className="lg:col-span-1 flex flex-col gap-3">
            {teamPlayers.length > 0 && (
              <>
                <div className="backdrop-blur-lg bg-white/10 rounded-xl border-2 border-white/40 p-4 text-center">
                  <div className="text-white/70 text-sm mb-1">
                    Jugadores Totales
                  </div>
                  <div className="text-white text-2xl font-bold">
                    {teamPlayers.length}
                  </div>
                </div>
                <div className="backdrop-blur-lg bg-white/10 rounded-xl border-2 border-white/40 p-4 text-center">
                  <div className="text-white/70 text-sm mb-1">Titulares</div>
                  <div className="text-white text-2xl font-bold">
                    {teamPlayers.filter((p) => p.esTitular).length}
                  </div>
                </div>
                <div className="backdrop-blur-lg bg-white/10 rounded-xl border-2 border-white/40 p-4 text-center">
                  <div className="text-white/70 text-sm mb-1">Suplentes</div>
                  <div className="text-white text-2xl font-bold">
                    {teamPlayers.filter((p) => !p.esTitular).length}
                  </div>
                </div>
                <div className="backdrop-blur-lg bg-white/10 rounded-xl border-2 border-white/40 p-4 text-center">
                  <div className="text-white/70 text-sm mb-1">Valor Total</div>
                  <div className="text-white text-xl font-bold">
                    $
                    {teamPlayers
                      .reduce((sum, p) => sum + (p.precio || 0), 0)
                      .toLocaleString('es-AR')}
                  </div>
                </div>
                <div className="backdrop-blur-lg bg-white/10 rounded-xl border-2 border-white/40 p-4 text-center">
                  <div className="text-white/70 text-sm mb-1">
                    Puntos Totales
                  </div>
                  <div className="text-white text-2xl font-bold">
                    {teamPlayers.reduce((sum, p) => sum + (p.puntaje || 0), 0)}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Columna derecha: Equipo */}
          <div className="lg:col-span-2 backdrop-blur-lg bg-white/10 rounded-xl p-4 border-2 border-white/40 overflow-hidden flex flex-col">
            {teamPlayers.length > 0 ? (
              <div className="flex-1 overflow-y-auto">
                <FormacionEquipoCompacta
                  players={teamPlayers}
                  showSuplentes={true}
                  mostrarPuntajes={teamPlayers.some(
                    (p) => (p.puntaje || 0) > 0
                  )}
                  mostrarPrecios={true}
                  onPlayerClick={handleHacerOferta}
                  selectedPlayerId={jugadorSeleccionadoFormacion?.id}
                />

                {/* Panel flotante con botón de ejecutar cláusula */}
                {jugadorSeleccionadoFormacion &&
                jugadorSeleccionadoFormacion.valor_clausula != null &&
                jugadorSeleccionadoFormacion.valor_clausula > 0 ? (
                  <div className="mt-4 backdrop-blur-xl bg-gradient-to-br from-red-500/20 to-pink-500/20 rounded-xl p-4 border-2 border-red-400/40 shadow-xl">
                    <div className="flex items-center gap-4">
                      <img
                        src={jugadorSeleccionadoFormacion.photo}
                        alt={jugadorSeleccionadoFormacion.name}
                        className="w-16 h-16 rounded-full border-2 border-red-400/50 shadow-lg"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src =
                            'https://via.placeholder.com/64x64/4F46E5/FFFFFF?text=?';
                        }}
                      />
                      <div className="flex-1">
                        <h4 className="text-white font-bold text-lg mb-1">
                          {jugadorSeleccionadoFormacion.name}
                        </h4>
                        <p className="text-red-200 text-sm">
                          Jugador Blindado - Cláusula: $
                          {jugadorSeleccionadoFormacion.valor_clausula.toLocaleString(
                            'es-AR'
                          )}
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          handleEjecutarClausula(jugadorSeleccionadoFormacion)
                        }
                        disabled={enviandoOferta}
                        className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold rounded-lg transition-all duration-200 shadow-lg hover:shadow-red-500/50 transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <span>
                          {enviandoOferta
                            ? 'Procesando...'
                            : 'Ejecutar Cláusula'}
                        </span>
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-white text-lg">
                  Este equipo aún no tiene jugadores
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Modal de Oferta - Mejorado */}
        {jugadorSeleccionado && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 py-8 px-4">
            <div className="backdrop-blur-xl bg-gradient-to-br from-white/20 to-white/5 rounded-2xl border-2 border-white/30 shadow-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto">
              <h3 className="text-xl font-bold mb-4 text-center bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                Hacer Oferta
              </h3>

              <div className="mb-4 text-center">
                <div className="relative inline-block mb-3">
                  <img
                    src={jugadorSeleccionado.photo || '/default-player.png'}
                    alt={jugadorSeleccionado.name}
                    className="w-24 h-24 rounded-full mx-auto object-cover border-4 border-white/30 shadow-xl"
                    onError={(e) => {
                      e.currentTarget.src = '/default-player.png';
                    }}
                  />
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
                    {getPositionDisplayName(jugadorSeleccionado.position)}
                  </div>
                </div>
                <div className="text-white text-lg font-bold mb-2">
                  {jugadorSeleccionado.name}
                </div>
                <div className="space-y-2">
                  <div className="backdrop-blur-lg bg-white/10 rounded-lg px-3 py-2 border border-white/20">
                    <span className="text-white/70 text-xs block">
                      Precio del Jugador:
                    </span>
                    <span className="text-white text-base font-bold">
                      $
                      {jugadorSeleccionado.precio?.toLocaleString('es-AR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>

                  <div
                    className={`backdrop-blur-lg rounded-lg px-3 py-2 border ${
                      presupuestoTotal > 0
                        ? presupuestoDisponible > 0
                          ? 'bg-green-500/20 border-green-500/40'
                          : 'bg-red-500/20 border-red-500/40'
                        : 'bg-yellow-500/20 border-yellow-500/40'
                    }`}
                  >
                    <span
                      className={`text-xs block mb-1 ${
                        presupuestoTotal > 0
                          ? presupuestoDisponible > 0
                            ? 'text-green-200'
                            : 'text-red-200'
                          : 'text-yellow-200'
                      }`}
                    >
                      Tu Presupuesto Disponible:
                    </span>
                    <span className="text-white text-base font-bold block">
                      {presupuestoTotal > 0 ? (
                        <>
                          $
                          {presupuestoDisponible.toLocaleString('es-AR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </>
                      ) : presupuestoIntentadoCargar ? (
                        '$0.00'
                      ) : (
                        'Cargando...'
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-5 mt-5">
                <div>
                  <label className="text-white text-sm font-semibold mb-2 flex items-center justify-between">
                    <span>
                      <span className="text-red-400 mr-1">*</span>
                      Monto Ofertado
                    </span>
                    {montoOferta &&
                      presupuestoDisponible > 0 &&
                      parseFloat(montoOferta) > presupuestoDisponible && (
                        <span className="text-red-400 text-xs">
                          ¡Excede presupuesto!
                        </span>
                      )}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70 text-lg">
                      $
                    </span>
                    <input
                      type="text"
                      value={
                        montoOferta
                          ? parseFloat(montoOferta).toLocaleString('es-AR', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })
                          : ''
                      }
                      onChange={(e) => {
                        // Remover caracteres no numéricos excepto punto y coma
                        const raw = e.target.value
                          .replace(/[^0-9.,]/g, '')
                          .replace(/,/g, '.');
                        // Si hay múltiples puntos, quedarse con el primero
                        const parts = raw.split('.');
                        const cleaned =
                          parts.length > 2
                            ? parts[0] + '.' + parts.slice(1).join('')
                            : raw;
                        setMontoOferta(cleaned || '');
                      }}
                      placeholder="Ingresa el monto"
                      className={`w-full pl-8 pr-14 py-3 rounded-lg bg-white/10 border-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 transition-all text-lg font-semibold ${
                        montoOferta &&
                        presupuestoDisponible > 0 &&
                        parseFloat(montoOferta) > presupuestoDisponible
                          ? 'border-red-500 focus:ring-red-400'
                          : 'border-white/30 focus:ring-emerald-400 focus:border-transparent'
                      }`}
                    />
                    {/* Botones de incremento/decremento */}
                    <div className="absolute right-0 top-0 bottom-0 flex flex-col border-l border-white/20">
                      <button
                        type="button"
                        onClick={() =>
                          setMontoOferta((prev) =>
                            (parseFloat(prev || '0') + 100000).toString()
                          )
                        }
                        className="flex-1 w-10 flex items-center justify-center bg-white/5 hover:bg-white/20 text-white/70 hover:text-white text-sm transition-all rounded-tr-lg border-b border-white/20"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="w-4 h-4"
                        >
                          <path
                            fillRule="evenodd"
                            d="M14.77 12.79a.75.75 0 01-1.06-.02L10 8.832 6.29 12.77a.75.75 0 11-1.08-1.04l4.25-4.5a.75.75 0 011.08 0l4.25 4.5a.75.75 0 01-.02 1.06z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setMontoOferta((prev) =>
                            Math.max(
                              0,
                              parseFloat(prev || '0') - 100000
                            ).toString()
                          )
                        }
                        className="flex-1 w-10 flex items-center justify-center bg-white/5 hover:bg-white/20 text-white/70 hover:text-white text-sm transition-all rounded-br-lg"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="w-4 h-4"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-white text-sm font-semibold mb-2 block">
                    Mensaje (opcional)
                  </label>
                  <textarea
                    value={mensajeOferta}
                    onChange={(e) => setMensajeOferta(e.target.value)}
                    placeholder="Añade un mensaje para el propietario..."
                    className="w-full px-4 py-3 rounded-lg bg-white/20 border-2 border-white/30 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none transition-all"
                    rows={3}
                    maxLength={200}
                  />
                  <div className="text-white/50 text-xs mt-1 text-right">
                    {mensajeOferta.length}/200
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={handleCerrarModal}
                  disabled={enviandoOferta}
                  className="flex-1 px-6 py-3 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold transition-all disabled:opacity-50 border border-white/20"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleEnviarOferta}
                  disabled={enviandoOferta || !montoOferta}
                  className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold transition-all disabled:opacity-50 disabled:from-gray-500 disabled:to-gray-600 shadow-lg"
                >
                  {enviandoOferta ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Enviando...
                    </span>
                  ) : (
                    'Enviar Oferta'
                  )}
                </button>
              </div>

              {/* Botón de ejecutar cláusula si el jugador está blindado */}
              {jugadorSeleccionado &&
              jugadorSeleccionado.valor_clausula != null &&
              jugadorSeleccionado.valor_clausula > 0 ? (
                <div className="mt-4 pt-4 border-t border-white/20">
                  <div className="bg-gradient-to-r from-red-500/20 to-pink-500/20 rounded-lg p-4 border border-red-400/40 mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-white font-semibold text-sm">
                        Jugador Blindado
                      </p>
                    </div>
                    <p className="text-white/80 text-xs">
                      Este jugador tiene una cláusula de rescisión. Puedes
                      adquirirlo automáticamente por:
                    </p>
                    <p className="text-red-300 font-bold text-xl mt-2">
                      $
                      {jugadorSeleccionado.valor_clausula.toLocaleString(
                        'es-AR'
                      )}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      handleCerrarModal();
                      handleEjecutarClausula(jugadorSeleccionado);
                    }}
                    disabled={enviandoOferta}
                    className="w-full px-6 py-4 rounded-lg bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold transition-all shadow-xl hover:shadow-red-500/50 transform hover:scale-[1.02] disabled:transform-none disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <span>Ejecutar Cláusula</span>
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* Notificación */}
        {notification && (
          <Notification
            message={notification}
            onClose={() => setNotification(null)}
          />
        )}
      </div>
    </div>
  );
};

export default VerEquipoOtroJugador;
