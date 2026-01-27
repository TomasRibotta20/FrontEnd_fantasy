import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import recompensasService from '../../../services/recompensasService';
import type {
  Recompensa,
  PremioOpcion,
  JugadorOpcion,
  RespuestaElegirPremio,
  OpcionesPickPendiente,
} from '../../../services/recompensasService';
import { useTorneoSeleccionado } from '../../../hooks/useSessionData';

interface ModalRecompensasProps {
  recompensa: Recompensa;
  onClose: () => void;
  onReclamada: () => void;
}

const ModalRecompensas = ({
  recompensa,
  onClose,
  onReclamada,
}: ModalRecompensasProps) => {
  const navigate = useNavigate();
  const [torneoGuardadoId] = useTorneoSeleccionado();
  const [opciones, setOpciones] = useState<PremioOpcion[]>([]);
  const [jugadores, setJugadores] = useState<JugadorOpcion[]>([]);
  const [tiempoRestante, setTiempoRestante] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [etapaPlayerPick, setEtapaPlayerPick] = useState<
    'seleccionando_premio' | 'seleccionando_jugador' | 'completado'
  >('seleccionando_premio');
  const [mostrarRuleta, setMostrarRuleta] = useState(false);
  const [mostrarResultadoRuleta, setMostrarResultadoRuleta] = useState(false);
  const [jugadorRuleta, setJugadorRuleta] = useState<{
    id: number;
    nombre?: string;
    name?: string;
    foto?: string;
    photo?: string;
    precio_actual: number;
  } | null>(null);

  // Calcular tier basado en posición
  const calcularTier = (posicion: number): 'ORO' | 'PLATA' | 'BRONCE' => {
    if (posicion === 1) return 'ORO';
    if (posicion <= 3) return 'PLATA';
    return 'BRONCE';
  };

  // Obtener el tier efectivo (del backend o calculado)
  const tierEfectivo = recompensa.tier || calcularTier(recompensa.posicion);

  // Obtener medalla según tier
  const getMedallaColor = (tier: string) => {
    switch (tier) {
      case 'ORO':
        return 'bg-yellow-400 text-yellow-900 border-yellow-500';
      case 'PLATA':
        return 'bg-gray-300 text-gray-800 border-gray-400';
      case 'BRONCE':
        return 'bg-orange-400 text-orange-900 border-orange-500';
      default:
        return 'bg-gray-400 text-gray-900 border-gray-500';
    }
  };

  // Cargar opciones al montar
  useEffect(() => {
    const cargarOpciones = async () => {
      try {
        setLoading(true);
        // Usar id_recompensa del backend
        const recompensaId = recompensa.id_recompensa || recompensa.id;
        const data = await recompensasService.obtenerOpciones(recompensaId);
        // Verificar si es un pick pendiente (usuario ya eligió PlayerPick antes)
        if ('tipo' in data && data.tipo === 'pick_pendiente') {
          // El backend devuelve { tipo: 'pick_pendiente', opciones: [...jugadores], expira: ... }
          const pickData = data as OpcionesPickPendiente;

          // Mapear opciones a formato de jugadores
          const jugadoresFormateados = pickData.opciones.map((j) => ({
            id: j.id,
            name: j.nombre,
            firstName: undefined,
            lastName: undefined,
            position: j.posicion,
            photo: j.foto_perfil,
            precio_actual: j.precio_actual,
            club: { id: 0, nombre: j.club, logo: '' },
          }));

          setJugadores(jugadoresFormateados);

          // Calcular tiempo restante
          if (pickData.expira) {
            const tiempoLimiteDate = new Date(pickData.expira);
            const ahora = new Date();
            const segundosRestantes = Math.max(
              0,
              Math.floor((tiempoLimiteDate.getTime() - ahora.getTime()) / 1000)
            );
            setTiempoRestante(segundosRestantes);
          }

          setEtapaPlayerPick('seleccionando_jugador');
          setMensaje(
            pickData.mensaje || 'Tienes un pick pendiente. Elige tu jugador.'
          );
        }
        // Verificar si es PlayerPick en proceso (formato antiguo)
        else if ('jugadores' in data && data.jugadores) {
          setJugadores(data.jugadores);
          setTiempoRestante(data.tiempoRestante);
          setEtapaPlayerPick('seleccionando_jugador');
        }
        // Opciones normales de premio
        else if ('opciones' in data) {
          setOpciones(data.opciones);
        }
      } catch (err) {
        const error = err as { response?: { data?: { message?: string } } };
        setError(error.response?.data?.message || 'Error al cargar opciones');
      } finally {
        setLoading(false);
      }
    };

    cargarOpciones();
  }, [recompensa.id, recompensa.id_recompensa]);

  // Timer para PlayerPick
  useEffect(() => {
    if (etapaPlayerPick === 'seleccionando_jugador' && tiempoRestante > 0) {
      const interval = setInterval(() => {
        setTiempoRestante((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setError('¡Tiempo expirado! Debes volver a elegir.');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [etapaPlayerPick, tiempoRestante]);

  const handleElegirPremio = async (premioId: number) => {
    try {
      setProcesando(true);
      setError(null);
      const recompensaId = recompensa.id_recompensa || recompensa.id;
      const respuesta: RespuestaElegirPremio =
        await recompensasService.elegirPremio(recompensaId, premioId);

      switch (respuesta.tipo) {
        case 'saldo':
          setMensaje(
            `¡Felicidades! Has recibido $${respuesta.monto.toLocaleString()}`
          );
          setEtapaPlayerPick('completado');
          setTimeout(() => {
            onReclamada();
            onClose();
          }, 3000);
          break;

        case 'ruleta': {
          // Calcular en qué segmento debe caer según el precio
          const precio = respuesta.jugador.precio_actual;
          let rotacionFinal = 0;

          // 8 segmentos de 45° cada uno:
          // ORO: segmentos 1, 4, 7 (0-45°, 135-180°, 270-315°)
          // PLATA: segmentos 2, 5, 8 (45-90°, 180-225°, 315-360°)
          // BRONCE: segmentos 3, 6 (90-135°, 225-270°)

          if (precio > 8000000) {
            // ORO - elegir uno de los 3 segmentos dorados
            const segmentosOro = [22.5, 157.5, 292.5]; // centros de segmentos 1, 4, 7
            const elegido = segmentosOro[Math.floor(Math.random() * 3)];
            rotacionFinal = 1800 + elegido + (Math.random() * 30 - 15);
          } else if (precio > 3000000) {
            // PLATA - elegir uno de los 3 segmentos plateados
            const segmentosPlata = [67.5, 202.5, 337.5]; // centros de segmentos 2, 5, 8
            const elegido = segmentosPlata[Math.floor(Math.random() * 3)];
            rotacionFinal = 1800 + elegido + (Math.random() * 30 - 15);
          } else {
            // BRONCE - elegir uno de los 2 segmentos bronce
            const segmentosBronce = [112.5, 247.5]; // centros de segmentos 3, 6
            const elegido = segmentosBronce[Math.floor(Math.random() * 2)];
            rotacionFinal = 1800 + elegido + (Math.random() * 30 - 15);
          }

          // Establecer la variable CSS
          document.documentElement.style.setProperty(
            '--final-rotation',
            `${rotacionFinal}deg`
          );

          // Mostrar animación de ruleta con los datos correctos
          setJugadorRuleta(respuesta.jugador);
          setMostrarRuleta(true);
          setMostrarResultadoRuleta(false);

          // Después de 4 segundos mostrar el resultado
          setTimeout(() => {
            setMostrarRuleta(false);
            setMostrarResultadoRuleta(true);
          }, 4000);

          // Después de 7 segundos cerrar
          setTimeout(() => {
            onReclamada();
            onClose();
          }, 7000);
          break;
        }

        case 'compensacion_saldo':
          // Mostrar mensaje de compensación inmediatamente (sin ruleta)
          setMensaje(
            `${
              respuesta.mensaje
            } Te compensamos con $${respuesta.montoCompensacion.toLocaleString()}`
          );
          setEtapaPlayerPick('completado');
          setTimeout(() => {
            onReclamada();
            onClose();
          }, 3000);
          break;

        case 'dinero_fallback':
          setMensaje(
            `${
              respuesta.mensaje
            } Recibiste $${respuesta.montoCompensacion.toLocaleString()}`
          );
          setEtapaPlayerPick('completado');
          setTimeout(() => {
            onReclamada();
            onClose();
          }, 3000);
          break;

        case 'playerpick_iniciado': {
          setJugadores(respuesta.jugadoresDisponibles);
          // Calcular tiempo restante desde fechaExpiracion
          const tiempoLimiteDate = new Date(respuesta.tiempoLimite);
          const ahora = new Date();
          const segundosRestantes = Math.max(
            0,
            Math.floor((tiempoLimiteDate.getTime() - ahora.getTime()) / 1000)
          );
          setTiempoRestante(segundosRestantes);
          setEtapaPlayerPick('seleccionando_jugador');
          setMensaje(respuesta.mensaje);
          break;
        }
      }
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      const errorMsg =
        error.response?.data?.message || 'Error al elegir premio';

      // Si el error indica que ya hay una opción elegida, recargar para mostrar el pick pendiente
      if (
        errorMsg.includes('Ya elegiste') ||
        errorMsg.includes('Resuelve la actual')
      ) {
        // Recargar opciones para mostrar el pick pendiente
        try {
          const recompensaId = recompensa.id_recompensa || recompensa.id;
          const data = await recompensasService.obtenerOpciones(recompensaId);

          if ('tipo' in data && data.tipo === 'pick_pendiente') {
            const pickData = data as OpcionesPickPendiente;

            const jugadoresFormateados = pickData.opciones.map((j) => ({
              id: j.id,
              name: j.nombre,
              firstName: undefined,
              lastName: undefined,
              position: j.posicion,
              photo: j.foto_perfil,
              precio_actual: j.precio_actual,
              club: { id: 0, nombre: j.club, logo: '' },
            }));

            setJugadores(jugadoresFormateados);
            setOpciones([]); // Limpiar opciones de premio

            if (pickData.expira) {
              const tiempoLimiteDate = new Date(pickData.expira);
              const ahora = new Date();
              const segundosRestantes = Math.max(
                0,
                Math.floor(
                  (tiempoLimiteDate.getTime() - ahora.getTime()) / 1000
                )
              );
              setTiempoRestante(segundosRestantes);
            }

            setEtapaPlayerPick('seleccionando_jugador');
            setMensaje(
              pickData.mensaje || 'Tienes un pick pendiente. Elige tu jugador.'
            );
            setError(null); // Limpiar error ya que mostramos el pick
            return;
          }
        } catch {
          // Si falla la recarga, mostrar el error original
        }
      }

      setError(errorMsg);
    } finally {
      setProcesando(false);
    }
  };

  const handleConfirmarJugador = async (jugadorId: number) => {
    try {
      setProcesando(true);
      setError(null);
      const recompensaId = recompensa.id_recompensa || recompensa.id;
      const respuesta = await recompensasService.confirmarPick(
        recompensaId,
        jugadorId
      );

      setMensaje(
        `¡Excelente elección! Has fichado a ${
          respuesta.jugador.name
        } por $${respuesta.jugador.precio_actual.toLocaleString()}`
      );
      setEtapaPlayerPick('completado');
      setTimeout(() => {
        onReclamada();
        onClose();
      }, 3000);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Error al confirmar jugador');
    } finally {
      setProcesando(false);
    }
  };

  const formatTiempo = (segundos: number): string => {
    const minutos = Math.floor(segundos / 60);
    const segs = segundos % 60;
    return `${minutos}:${segs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="backdrop-blur-lg bg-white/10 rounded-2xl border-2 border-white/40 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-blue-500/30 border-b border-white/30 p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">
              ¡Recompensa Disponible!
            </h2>
            <div className="flex items-center gap-3">
              <span
                className={`px-4 py-2 rounded-lg font-bold text-lg border-2 ${getMedallaColor(
                  tierEfectivo
                )}`}
              >
                {tierEfectivo}
              </span>
              <span className="text-white/80 text-sm">
                Posición #{recompensa.posicion}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
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

        {/* Content */}
        <div className="p-6">
          {loading && (
            <div className="text-center py-8 text-white">
              Cargando opciones...
            </div>
          )}

          {error && (
            <div className="bg-gradient-to-r from-red-500/30 to-orange-500/30 border-2 border-red-400/50 rounded-xl p-5 mb-6 shadow-lg">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 bg-red-500/30 rounded-full p-3">
                  <svg
                    className="w-6 h-6 text-red-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="text-red-200 font-bold text-lg mb-1">
                    {error.includes('PLANTILLA_LLENA')
                      ? '¡Plantilla Completa!'
                      : 'Error'}
                  </h4>
                  <p className="text-red-100/90 text-sm">
                    {error.includes('PLANTILLA_LLENA')
                      ? 'No tienes espacio en tu plantilla para agregar más jugadores. Vende un jugador antes de reclamar esta recompensa.'
                      : error}
                  </p>
                  {error.includes('PLANTILLA_LLENA') && (
                    <button
                      onClick={() => {
                        onClose();
                        navigate(`/mercado/${torneoGuardadoId}`);
                      }}
                      className="mt-3 px-4 py-2 bg-red-500/40 hover:bg-red-500/60 text-white text-sm font-semibold rounded-lg transition-colors border border-red-400/50"
                    >
                      Ir a vender jugadores
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {mensaje && !mostrarRuleta && (
            <div className="bg-green-500/20 border border-green-500/40 rounded-lg p-4 mb-4 text-green-200">
              {mensaje}
            </div>
          )}

          {/* Animación de Ruleta */}
          {mostrarRuleta && jugadorRuleta && (
            <div className="text-center py-8">
              <h3 className="text-2xl font-bold text-white mb-6">
                ¡Girando la ruleta!
              </h3>
              <div className="flex justify-center items-center mb-6">
                <div className="relative w-80 h-80">
                  {/* Indicador de selección (flecha superior) */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-20">
                    <div className="w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[30px] border-t-red-500 drop-shadow-2xl"></div>
                  </div>

                  {/* Ruleta con 8 segmentos simétricos de 45° cada uno */}
                  <div className="absolute inset-0 ruleta-spin ruleta-container">
                    <svg
                      viewBox="0 0 200 200"
                      className="w-full h-full drop-shadow-2xl"
                    >
                      {/* Segmento 1 - ORO (0-45°) - ángulo medio 22.5° */}
                      <path
                        d="M 100 100 L 100 20 A 80 80 0 0 1 156.57 43.43 Z"
                        fill="#FFD700"
                        stroke="white"
                        strokeWidth="2"
                      />
                      <text
                        x="119"
                        y="55"
                        fontSize="20"
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        ★
                      </text>

                      {/* Segmento 2 - PLATA (45-90°) - ángulo medio 67.5° */}
                      <path
                        d="M 100 100 L 156.57 43.43 A 80 80 0 0 1 180 100 Z"
                        fill="#C0C0C0"
                        stroke="white"
                        strokeWidth="2"
                      />
                      <text
                        x="146"
                        y="81"
                        fontSize="20"
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        ★
                      </text>

                      {/* Segmento 3 - BRONCE (90-135°) - ángulo medio 112.5° */}
                      <path
                        d="M 100 100 L 180 100 A 80 80 0 0 1 156.57 156.57 Z"
                        fill="#CD7F32"
                        stroke="white"
                        strokeWidth="2"
                      />
                      <text
                        x="146"
                        y="119"
                        fontSize="20"
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        ★
                      </text>

                      {/* Segmento 4 - ORO (135-180°) - ángulo medio 157.5° */}
                      <path
                        d="M 100 100 L 156.57 156.57 A 80 80 0 0 1 100 180 Z"
                        fill="#FFD700"
                        stroke="white"
                        strokeWidth="2"
                      />
                      <text
                        x="119"
                        y="145"
                        fontSize="20"
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        ★
                      </text>

                      {/* Segmento 5 - PLATA (180-225°) - ángulo medio 202.5° */}
                      <path
                        d="M 100 100 L 100 180 A 80 80 0 0 1 43.43 156.57 Z"
                        fill="#C0C0C0"
                        stroke="white"
                        strokeWidth="2"
                      />
                      <text
                        x="81"
                        y="145"
                        fontSize="20"
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        ★
                      </text>

                      {/* Segmento 6 - BRONCE (225-270°) - ángulo medio 247.5° */}
                      <path
                        d="M 100 100 L 43.43 156.57 A 80 80 0 0 1 20 100 Z"
                        fill="#CD7F32"
                        stroke="white"
                        strokeWidth="2"
                      />
                      <text
                        x="54"
                        y="119"
                        fontSize="20"
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        ★
                      </text>

                      {/* Segmento 7 - ORO (270-315°) - ángulo medio 292.5° */}
                      <path
                        d="M 100 100 L 20 100 A 80 80 0 0 1 43.43 43.43 Z"
                        fill="#FFD700"
                        stroke="white"
                        strokeWidth="2"
                      />
                      <text
                        x="54"
                        y="81"
                        fontSize="20"
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        ★
                      </text>

                      {/* Segmento 8 - PLATA (315-360°) - ángulo medio 337.5° */}
                      <path
                        d="M 100 100 L 43.43 43.43 A 80 80 0 0 1 100 20 Z"
                        fill="#C0C0C0"
                        stroke="white"
                        strokeWidth="2"
                      />
                      <text
                        x="81"
                        y="55"
                        fontSize="20"
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        ★
                      </text>

                      {/* Centro de la ruleta */}
                      <circle
                        cx="100"
                        cy="100"
                        r="20"
                        fill="white"
                        stroke="#333"
                        strokeWidth="3"
                      />
                    </svg>
                  </div>
                </div>
                <p className="text-white/80 text-lg animate-pulse mt-4">
                  Esperando resultado...
                </p>
              </div>
            </div>
          )}

          {/* Resultado de la Ruleta */}
          {mostrarResultadoRuleta && jugadorRuleta && (
            <div className="text-center py-8">
              <h3 className="text-3xl font-bold text-white mb-6">
                🎉 ¡Felicidades! 🎉
              </h3>
              <div className="bg-gradient-to-br from-yellow-500/30 to-orange-500/30 rounded-2xl p-8 border-2 border-yellow-400/50 max-w-md mx-auto">
                <div className="mb-4">
                  <img
                    src={
                      jugadorRuleta.foto ||
                      jugadorRuleta.photo ||
                      'https://via.placeholder.com/150x150/4F46E5/FFFFFF?text=?'
                    }
                    alt={
                      jugadorRuleta.nombre || jugadorRuleta.name || 'Jugador'
                    }
                    className="w-32 h-32 rounded-full mx-auto border-4 border-yellow-400 shadow-xl object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src =
                        'https://via.placeholder.com/150x150/4F46E5/FFFFFF?text=?';
                    }}
                  />
                </div>
                <h4 className="text-2xl font-bold text-white mb-2">
                  {jugadorRuleta.nombre || jugadorRuleta.name || 'Jugador'}
                </h4>
                <p className="text-green-400 text-xl font-bold">
                  ${jugadorRuleta.precio_actual?.toLocaleString() || '0'}
                </p>
                <p className="text-white/70 mt-4 text-sm">
                  ¡Has fichado este jugador para tu equipo!
                </p>
              </div>
              <p className="text-white/60 mt-6 text-sm">
                Cerrando en unos segundos...
              </p>
            </div>
          )}

          {/* Opciones de premio */}
          {!loading &&
            etapaPlayerPick === 'seleccionando_premio' &&
            opciones.length > 0 && (
              <div>
                <h3 className="text-xl font-bold text-white mb-4">
                  Elige tu premio:
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {opciones.map((premio) => (
                    <div
                      key={premio.id}
                      className="backdrop-blur-lg bg-white/5 border-2 border-white/30 rounded-xl p-6 hover:bg-white/10 transition-all cursor-pointer"
                      onClick={() =>
                        !procesando && handleElegirPremio(premio.id)
                      }
                    >
                      <div className="text-center">
                        <h4 className="text-lg font-bold text-white mb-2">
                          {premio.tipo === 'SALDO'
                            ? 'Dinero'
                            : premio.tipo === 'RULETA'
                            ? 'Ruleta'
                            : 'Elige Jugador'}
                        </h4>
                        <p className="text-white/70 text-sm mb-4">
                          {premio.descripcion}
                        </p>
                        {premio.monto && (
                          <p className="text-green-400 font-bold text-xl">
                            ${premio.monto.toLocaleString()}
                          </p>
                        )}
                        <button
                          disabled={procesando}
                          className="mt-4 w-full bg-blue-500/60 hover:bg-blue-500/80 text-white py-2 px-4 rounded-lg font-semibold transition-all border border-blue-400/40 disabled:opacity-50"
                        >
                          {procesando ? 'Procesando...' : 'Elegir'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Selección de jugador en PlayerPick */}
          {etapaPlayerPick === 'seleccionando_jugador' &&
            jugadores.length > 0 && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-white">
                    Elige tu jugador:
                  </h3>
                  <div className="bg-yellow-500/20 border border-yellow-400/40 rounded-lg px-4 py-2">
                    <span className="text-yellow-300 font-bold">
                      {formatTiempo(tiempoRestante)}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {jugadores.map((jugador) => (
                    <div
                      key={jugador.id}
                      className="backdrop-blur-lg bg-white/5 border-2 border-white/30 rounded-xl p-4 hover:bg-white/10 transition-all cursor-pointer"
                      onClick={() =>
                        !procesando && handleConfirmarJugador(jugador.id)
                      }
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={jugador.photo}
                          alt={jugador.name}
                          className="w-16 h-16 rounded-full object-cover border-2 border-white/40"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src =
                              'https://via.placeholder.com/64x64/4F46E5/FFFFFF?text=?';
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-bold truncate">
                            {jugador.name}
                          </p>
                          <p className="text-white/60 text-sm">
                            {jugador.position}
                          </p>
                          <p className="text-green-400 font-semibold text-sm">
                            ${jugador.precio_actual.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <button
                        disabled={procesando}
                        className="mt-3 w-full bg-blue-500/60 hover:bg-blue-500/80 text-white py-2 px-4 rounded-lg font-semibold transition-all border border-blue-400/40 disabled:opacity-50 text-sm"
                      >
                        {procesando ? 'Procesando...' : 'Seleccionar'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Completado */}
          {etapaPlayerPick === 'completado' && (
            <div className="text-center py-8">
              <h3 className="text-2xl font-bold text-white mb-2">
                ¡Recompensa reclamada!
              </h3>
              <p className="text-white/70">Cerrando ventana...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModalRecompensas;
