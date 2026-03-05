import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import LoadingSpinner from '../../common/LoadingSpinner';
import MoneyInput from '../../common/MoneyInput';
import PlayerStatsModal from '../../common/PlayerStatsModal';
import ConfirmModal from '../../common/ConfirmModal';
import {
  obtenerMercadoActivo,
  realizarPuja,
  obtenerMiEquipoEnTorneo,
  venderJugador,
  obtenerMisPujas,
  cancelarPuja,
} from '../../../services/mercadoService';
import type {
  MercadoActivo,
  MiJugador,
  MiPuja,
} from '../../../services/mercadoService';
import { obtenerDetalleTorneo } from '../../../services/torneosService';
import { useTorneoSeleccionado } from '../../../hooks/useSessionData';

/** Componente del mercado de jugadores para el usuario. */
const MercadoUsuario = () => {
  const { torneoId: torneoIdFromParams } = useParams<{ torneoId: string }>();
  const navigate = useNavigate();

  // ✅ Usar hook como fallback si no hay torneoId en la URL
  const [torneoGuardadoId] = useTorneoSeleccionado();
  const torneoId = torneoIdFromParams || torneoGuardadoId;

  // Si no hay torneoId en la URL pero sí en el hook, redirigir a la URL correcta
  useEffect(() => {
    if (!torneoIdFromParams && torneoGuardadoId) {
      navigate(`/mercado/${torneoGuardadoId}`, { replace: true });
    }
  }, [torneoIdFromParams, torneoGuardadoId, navigate]);

  const [tabActiva, setTabActiva] = useState<
    'mercado' | 'mi-equipo' | 'mis-pujas'
  >('mercado');
  const [equipoId, setEquipoId] = useState<number | null>(null);
  const [mercado, setMercado] = useState<MercadoActivo | null>(null);
  const [miEquipo, setMiEquipo] = useState<{
    equipo_id: number;
    jugadores: MiJugador[];
  } | null>(null);
  const [misPujas, setMisPujas] = useState<MiPuja[]>([]);
  const [loadingMercado, setLoadingMercado] = useState(false);
  const [loadingMiEquipo, setLoadingMiEquipo] = useState(false);
  const [loadingPujas, setLoadingPujas] = useState(false);
  const [editandoPuja, setEditandoPuja] = useState<number | null>(null);
  const [cancelandoPuja, setCancelandoPuja] = useState<number | null>(null);
  const [montoNuevoPuja, setMontoNuevoPuja] = useState<{
    [key: number]: string;
  }>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [posicionFiltro, setPosicionFiltro] = useState<string>('TODAS');
  const [ordenamiento, setOrdenamiento] = useState<
    'nombre' | 'precio' | 'puntos'
  >('nombre');
  const [pujando, setPujando] = useState<number | null>(null);
  const [vendiendo, setVendiendo] = useState<number | null>(null);
  const [montoPuja, setMontoPuja] = useState<{ [key: number]: string }>({});

  // Estado para modal de estadísticas del jugador
  const [statsJugador, setStatsJugador] = useState<{
    id: number;
    nombre: string;
    foto?: string;
    posicion?: string;
    club?: string;
  } | null>(null);

  // Estado para modal de confirmación
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // Estado del torneo para verificar si está activo
  const [torneoEstado, setTorneoEstado] = useState<string | null>(null);

  // Función helper para mostrar confirmación
  const showConfirmation = (
    title: string,
    message: string,
    onConfirm: () => void,
  ) => {
    setConfirmAction({ title, message, onConfirm });
    setShowConfirmModal(true);
  };

  const handleConfirm = () => {
    if (confirmAction) {
      confirmAction.onConfirm();
    }
    setShowConfirmModal(false);
    setConfirmAction(null);
  };

  const handleCancelConfirm = () => {
    setShowConfirmModal(false);
    setConfirmAction(null);
  };

  // Limpiar datos cuando cambia el torneoId
  useEffect(() => {
    setEquipoId(null);
    setMercado(null);
    setMiEquipo(null);
    setError(null);
    setSuccess(null);
  }, [torneoId]);

  // Obtener equipoId al cargar el componente
  useEffect(() => {
    const cargarEquipoId = async () => {
      if (!torneoId || equipoId) return;

      try {
        const torneoResponse = await obtenerDetalleTorneo(parseInt(torneoId));
        const miEquipoId = torneoResponse.data.mi_equipo_id;
        const estado = torneoResponse.data.estado;
        setTorneoEstado(estado);

        if (estado === 'EN_ESPERA') {
          return; // No cargar nada más si el torneo no ha iniciado
        }

        if (miEquipoId) {
          setEquipoId(miEquipoId);
        } else {
          setError('No tienes un equipo en este torneo');
        }
      } catch {
        // error silenciado
      }
    };

    cargarEquipoId();
  }, [torneoId, equipoId]);

  const cargarMercado = useCallback(async () => {
    if (!torneoId || mercado) return; // No recargar si ya hay datos

    setLoadingMercado(true);
    setError(null);
    try {
      const data = await obtenerMercadoActivo(parseInt(torneoId));
      // Validar que los datos tengan la estructura correcta
      if (!data || !data.items || !Array.isArray(data.items)) {
        setError('El mercado no tiene jugadores disponibles');
        setMercado(null);
        return;
      }

      setMercado(data);
    } catch (err) {
      const error = err as {
        response?: { data?: { message?: string }; status?: number };
      };

      if (error.response?.status === 404) {
        setError('No hay mercado activo para este torneo');
      } else {
        setError(error.response?.data?.message || 'Error al cargar el mercado');
      }
    } finally {
      setLoadingMercado(false);
    }
  }, [torneoId, mercado]);

  const cargarMiEquipo = useCallback(async () => {
    if (!equipoId || miEquipo) return; // No recargar si ya hay datos

    setLoadingMiEquipo(true);
    setError(null);
    try {
      // Ahora obtener los jugadores del equipo
      const data = await obtenerMiEquipoEnTorneo(equipoId);
      if (data && data.jugadores) {
        setMiEquipo({
          equipo_id: data.id,
          jugadores: data.jugadores,
        });
      } else {
        setMiEquipo({ equipo_id: 0, jugadores: [] });
      }
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Error al cargar tu equipo');
      setMiEquipo(null);
    } finally {
      setLoadingMiEquipo(false);
    }
  }, [equipoId, miEquipo]);

  const cargarMisPujas = useCallback(
    async (forzarRecarga = false) => {
      if (!equipoId || (!forzarRecarga && misPujas.length > 0)) return; // No recargar si ya hay datos, a menos que se fuerce

      setLoadingPujas(true);
      setError(null);
      try {
        const data = await obtenerMisPujas(equipoId);
        setMisPujas(data);
      } catch (err) {
        const error = err as { response?: { data?: { message?: string } } };
        setError(error.response?.data?.message || 'Error al cargar tus pujas');
        setMisPujas([]);
      } finally {
        setLoadingPujas(false);
      }
    },
    [equipoId, misPujas.length],
  );

  useEffect(() => {
    if (tabActiva === 'mercado') {
      cargarMercado();
      // Cargar mis pujas para verificar si ya tengo ofertas activas
      if (misPujas.length === 0) {
        cargarMisPujas(false);
      }
    } else if (tabActiva === 'mi-equipo') {
      cargarMiEquipo();
    } else if (tabActiva === 'mis-pujas') {
      // Siempre recargar cuando se entra a la pestaña Mis Pujas
      cargarMisPujas(true);
    }
  }, [
    tabActiva,
    cargarMercado,
    cargarMiEquipo,
    cargarMisPujas,
    misPujas.length,
  ]);

  const jugadoresFiltrados = useMemo(() => {
    if (!mercado || !mercado.items || !Array.isArray(mercado.items)) return [];

    let resultado = [...mercado.items];

    // Filtro por búsqueda
    if (busqueda.trim()) {
      const busquedaLower = busqueda.toLowerCase();
      resultado = resultado.filter(
        (item) =>
          item.jugador.nombre?.toLowerCase().includes(busquedaLower) ||
          item.jugador.nombreCompleto?.toLowerCase().includes(busquedaLower),
      );
    }

    // Filtro por posición
    if (posicionFiltro !== 'TODAS') {
      resultado = resultado.filter(
        (item) => item.jugador.posicion === posicionFiltro,
      );
    }

    // Ordenamiento
    resultado.sort((a, b) => {
      switch (ordenamiento) {
        case 'precio':
          return (
            (b.jugador.precio_actual || 0) - (a.jugador.precio_actual || 0)
          );
        case 'puntos':
          return (
            (b.jugador.puntos_totales || 0) - (a.jugador.puntos_totales || 0)
          );
        case 'nombre':
        default:
          return (
            a.jugador.nombreCompleto ||
            a.jugador.nombre ||
            ''
          ).localeCompare(b.jugador.nombreCompleto || b.jugador.nombre || '');
      }
    });

    return resultado;
  }, [mercado, busqueda, posicionFiltro, ordenamiento]);

  const traducirPosicion = (pos: string): string => {
    const traducciones: Record<string, string> = {
      GOALKEEPER: 'Portero',
      DEFENDER: 'Defensor',
      MIDFIELDER: 'Mediocampista',
      ATTACKER: 'Delantero',
      Goalkeeper: 'Portero',
      Defender: 'Defensor',
      Midfielder: 'Mediocampista',
      Attacker: 'Delantero',
    };
    return traducciones[pos] || pos;
  };

  const posicionesDisponibles = useMemo(() => {
    if (!mercado || !mercado.items) return [];
    const posiciones = new Set(
      mercado.items
        .map((item) => item.jugador.posicion)
        .filter((pos): pos is string => !!pos),
    );
    return Array.from(posiciones).sort();
  }, [mercado]);

  // Verificar si ya tengo una puja activa en este item
  const tienePujaActiva = (itemId: number) => {
    // Buscar el jugador correspondiente a este itemId en el mercado
    const item = mercado?.items?.find((i) => i.id === itemId);
    const jugadorIdBuscado = item?.jugador?.id;

    if (!jugadorIdBuscado) {
      return false;
    }

    const tienePuja = misPujas.some((puja) => {
      const jugadorIdPuja = puja.jugador?.id || puja.item_mercado?.jugador?.id;
      // Si el endpoint es /mis-ofertas, asumimos que todas son activas/pendientes
      return jugadorIdPuja === jugadorIdBuscado;
    });

    return tienePuja;
  };

  const handlePujar = async (itemId: number, precioActual: number) => {
    if (!equipoId) {
      setError('No se encontró tu equipo en este torneo');
      setTimeout(() => setError(null), 3000);
      return;
    }

    // Verificar si ya tiene una puja activa en este jugador
    if (tienePujaActiva(itemId)) {
      setError(
        'Ya tienes una puja activa en este jugador. Ve a "Mis Pujas" para actualizarla.',
      );
      setTimeout(() => setError(null), 3000);
      return;
    }

    // El input recibe el valor absoluto (ej: 7000000 para $7M)
    const monto = parseFloat(montoPuja[itemId] || '0');

    if (monto < precioActual) {
      setError(
        `La puja debe ser mayor o igual a ${precioActual.toLocaleString(
          'es-AR',
        )}`,
      );
      setTimeout(() => setError(null), 3000);
      return;
    }

    setPujando(itemId);
    setError(null);
    setSuccess(null);

    try {
      // El backend espera el valor absoluto, enviarlo directamente
      const montoAbsoluto = Math.floor(monto);
      await realizarPuja(equipoId, {
        itemMercadoId: itemId,
        monto: montoAbsoluto,
      });
      setSuccess('¡Puja realizada exitosamente!');
      setTimeout(() => setSuccess(null), 3000);

      // Recargar el mercado para actualizar precios
      setMercado(null);
      await cargarMercado();

      // Recargar mis pujas para reflejar la nueva puja
      await cargarMisPujas(true);

      setMontoPuja({ ...montoPuja, [itemId]: '' });
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Error al realizar la puja');
      setTimeout(() => setError(null), 3000);
    } finally {
      setPujando(null);
    }
  };

  const handleActualizarPuja = async (
    pujaId: number,
    itemMercadoId: number,
  ) => {
    if (!equipoId) {
      setError('No se encontró tu equipo en este torneo');
      setTimeout(() => setError(null), 3000);
      return;
    }

    // El input recibe el valor absoluto (ej: 7000000 para $7M)
    const nuevoMonto = parseFloat(montoNuevoPuja[pujaId] || '0');

    if (nuevoMonto <= 0) {
      setError('Ingresa un monto válido');
      setTimeout(() => setError(null), 3000);
      return;
    }

    setEditandoPuja(pujaId);
    setError(null);
    setSuccess(null);

    try {
      // El backend espera el valor absoluto, enviarlo directamente
      await realizarPuja(equipoId, {
        itemMercadoId,
        monto: Math.floor(nuevoMonto),
      });
      setSuccess('¡Puja actualizada exitosamente!');
      setTimeout(() => setSuccess(null), 3000);

      // Recargar mis pujas para ver la actualización
      await cargarMisPujas(true);

      // Limpiar el input
      setMontoNuevoPuja({ ...montoNuevoPuja, [pujaId]: '' });
      setMontoNuevoPuja({ ...montoNuevoPuja, [pujaId]: '' });
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Error al actualizar la puja');
      setTimeout(() => setError(null), 3000);
    } finally {
      setEditandoPuja(null);
    }
  };

  const ejecutarCancelarPuja = async (pujaId: number) => {
    setCancelandoPuja(pujaId);
    setError(null);
    setSuccess(null);

    try {
      await cancelarPuja(pujaId);
      setSuccess('¡Puja cancelada exitosamente!');
      setTimeout(() => setSuccess(null), 3000);

      // Recargar mis pujas para reflejar la cancelación
      await cargarMisPujas(true);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Error al cancelar la puja');
      setTimeout(() => setError(null), 3000);
    } finally {
      setCancelandoPuja(null);
    }
  };

  const handleCancelarPuja = (pujaId: number) => {
    showConfirmation(
      'Cancelar Puja',
      '¿Estás seguro de cancelar esta puja?',
      () => ejecutarCancelarPuja(pujaId),
    );
  };

  const ejecutarVenderJugador = async (jugadorId: number) => {
    if (!miEquipo) return;

    setVendiendo(jugadorId);
    setError(null);
    setSuccess(null);

    try {
      await venderJugador(miEquipo.equipo_id, { jugadorId });
      setSuccess('¡Jugador vendido exitosamente!');
      setTimeout(() => setSuccess(null), 3000);

      // Limpiar el estado para forzar la recarga
      setMiEquipo(null);

      // Recargar mi equipo
      await cargarMiEquipo();
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Error al vender el jugador');
      setTimeout(() => setError(null), 3000);
    } finally {
      setVendiendo(null);
    }
  };

  const handleVender = (jugadorId: number) => {
    if (!miEquipo) return;
    showConfirmation(
      'Vender Jugador',
      '¿Estás seguro de vender este jugador?',
      () => ejecutarVenderJugador(jugadorId),
    );
  };

  // Mostrar mensaje si el torneo no ha iniciado
  if (torneoEstado === 'EN_ESPERA') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center pt-20">
        <div
          className="fixed inset-0 bg-cover bg-center bg-no-repeat -z-10"
          style={{
            backgroundImage: `url('/Background_LandingPage.png')`,
            filter: 'blur(2px)',
          }}
        >
          <div className="absolute inset-0 bg-black opacity-30"></div>
        </div>
        <div className="bg-yellow-500/20 backdrop-blur-lg border-2 border-yellow-500/50 rounded-xl p-8 max-w-md relative z-10">
          <div className="text-center">
            <span className="text-5xl mb-4 block">🔒</span>
            <h2 className="text-white text-2xl font-bold mb-2">
              Mercado no disponible
            </h2>
            <p className="text-yellow-300 text-center text-lg mb-4">
              El mercado estará disponible una vez que el torneo sea iniciado.
            </p>
            <button
              onClick={() => navigate(-1)}
              className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-2 px-4 rounded-lg transition-all"
            >
              Volver
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Mostrar error solo si no hay datos cargados
  if (error && !mercado && !miEquipo) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center pt-20">
        <div className="bg-red-500/20 backdrop-blur-lg border-2 border-red-500/50 rounded-xl p-8 max-w-md">
          <p className="text-red-300 text-center text-lg mb-4">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-2 px-4 rounded-lg transition-all"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  if (!mercado) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center pt-20">
        <div className="bg-yellow-500/20 backdrop-blur-lg border-2 border-yellow-500/50 rounded-xl p-8 max-w-md">
          <p className="text-yellow-300 text-center text-lg">
            No hay mercado activo para este torneo
          </p>
        </div>
      </div>
    );
  }

  const jugadores = jugadoresFiltrados;

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
        {/* Header compacto */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <button
              onClick={() => navigate(-1)}
              className="text-white/70 hover:text-white transition-colors text-sm flex items-center gap-1 mb-1"
            >
              ← Volver
            </button>
            <h1 className="text-2xl font-bold text-white drop-shadow-lg">
              Mercado de Fichajes
            </h1>
            <p className="text-white/60 text-sm">
              {tabActiva === 'mercado' &&
                mercado &&
                `Mercado #${mercado.numero_mercado} · ${mercado.items.length} jugadores`}
              {tabActiva === 'mi-equipo' &&
                miEquipo &&
                `Mi Equipo · ${miEquipo.jugadores.length} jugadores`}
              {tabActiva === 'mis-pujas' &&
                `Mis Pujas · ${misPujas.length} oferta${misPujas.length !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>

        {/* Tabs compactos */}
        <div className="flex gap-2 mb-4">
          {[
            {
              key: 'mercado' as const,
              label: 'Mercado',
              colors: 'from-blue-500 to-purple-600',
            },
            {
              key: 'mis-pujas' as const,
              label: 'Mis Pujas',
              colors: 'from-yellow-500 to-orange-600',
            },
            {
              key: 'mi-equipo' as const,
              label: 'Mi Equipo',
              colors: 'from-emerald-500 to-green-600',
            },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setTabActiva(tab.key)}
              className={`flex-1 py-2 px-4 rounded-lg font-semibold text-sm transition-all ${
                tabActiva === tab.key
                  ? `bg-gradient-to-r ${tab.colors} text-white shadow-lg`
                  : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white/80'
              }`}
            >
              {tab.label}
              {tab.key === 'mis-pujas' && misPujas.length > 0 && (
                <span className="ml-1.5 bg-white/20 px-1.5 py-0.5 rounded-full text-xs">
                  {misPujas.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Mensajes - Fixed */}
        {error && (
          <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-lg px-4">
            <div className="bg-red-500/90 backdrop-blur-lg border border-red-400 rounded-lg p-3 shadow-2xl">
              <div className="flex items-center justify-between">
                <p className="text-white text-sm font-medium flex-1">{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="text-white/80 hover:text-white ml-3"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-lg px-4">
            <div className="bg-green-500/90 backdrop-blur-lg border border-green-400 rounded-lg p-3 shadow-2xl">
              <div className="flex items-center justify-between">
                <p className="text-white text-sm font-medium flex-1">
                  {success}
                </p>
                <button
                  onClick={() => setSuccess(null)}
                  className="text-white/80 hover:text-white ml-3"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════ TAB MERCADO ═══════════ */}
        {tabActiva === 'mercado' && (
          <>
            {/* Filtros compactos */}
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-3 border border-white/20 mb-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <input
                  type="text"
                  placeholder="Buscar jugador o club..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="bg-white/10 border border-white/30 rounded-lg px-3 py-1.5 text-sm text-white placeholder-white/50 focus:outline-none focus:border-white/60"
                />
                <select
                  value={posicionFiltro}
                  onChange={(e) => setPosicionFiltro(e.target.value)}
                  className="bg-white/10 border border-white/30 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-white/60"
                >
                  <option value="TODAS" className="bg-gray-800 text-white">
                    Todas las posiciones
                  </option>
                  {posicionesDisponibles.map((pos) => (
                    <option
                      key={pos}
                      value={pos}
                      className="bg-gray-800 text-white"
                    >
                      {traducirPosicion(pos)}
                    </option>
                  ))}
                </select>
                <select
                  value={ordenamiento}
                  onChange={(e) =>
                    setOrdenamiento(
                      e.target.value as 'nombre' | 'precio' | 'puntos',
                    )
                  }
                  className="bg-white/10 border border-white/30 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-white/60"
                >
                  <option value="nombre" className="bg-gray-800 text-white">
                    Nombre
                  </option>
                  <option value="precio" className="bg-gray-800 text-white">
                    Precio
                  </option>
                  <option value="puntos" className="bg-gray-800 text-white">
                    Puntos
                  </option>
                </select>
                <div className="flex items-center justify-center text-white/70 text-sm font-medium">
                  {jugadores.length} jugador{jugadores.length !== 1 ? 'es' : ''}
                </div>
              </div>
            </div>

            {/* Lista de jugadores - cards compactas horizontales */}
            {loadingMercado ? (
              <LoadingSpinner variant="section" message="Cargando mercado..." />
            ) : jugadores.length === 0 ? (
              <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20 text-center">
                <p className="text-white/70">
                  No se encontraron jugadores con los filtros aplicados
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {jugadores.map((item) => {
                  const jugador = item.jugador;
                  const precioActual = jugador.precio_actual || 0;
                  const precioDisplay =
                    precioActual >= 1000000
                      ? `$${Math.floor(precioActual / 1000000).toLocaleString('es-AR')}M`
                      : `$${Math.floor(precioActual / 1000).toLocaleString('es-AR')}K`;

                  return (
                    <div
                      key={item.id}
                      className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 hover:border-white/40 transition-all p-3"
                    >
                      <div className="flex items-center gap-3">
                        {/* Foto compacta */}
                        <div className="relative flex-shrink-0">
                          {jugador.foto ? (
                            <img
                              src={jugador.foto}
                              alt={jugador.nombreCompleto || jugador.nombre}
                              className="w-14 h-14 rounded-lg object-cover bg-white/10"
                              onError={(e) => {
                                e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                  jugador.nombreCompleto ||
                                    jugador.nombre ||
                                    'J',
                                )}&size=56&background=4F46E5&color=fff`;
                              }}
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-lg font-bold">
                              {(jugador.nombreCompleto || jugador.nombre || 'J')
                                .charAt(0)
                                .toUpperCase()}
                            </div>
                          )}
                          {jugador.clubLogo && (
                            <img
                              src={jugador.clubLogo}
                              alt={jugador.club}
                              className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white p-0.5 object-contain"
                            />
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-white font-semibold text-sm truncate">
                              {jugador.nombreCompleto || jugador.nombre}
                            </h3>
                            {jugador.posicion && (
                              <span className="flex-shrink-0 px-2 py-0.5 bg-blue-500/30 text-blue-300 rounded text-[10px] font-semibold uppercase">
                                {traducirPosicion(jugador.posicion)}
                              </span>
                            )}
                            {item.cantidad_pujas > 0 && (
                              <span className="flex-shrink-0 px-1.5 py-0.5 bg-red-500/80 text-white rounded text-[10px] font-bold">
                                {item.cantidad_pujas} puja
                                {item.cantidad_pujas !== 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-0.5">
                            {jugador.club && (
                              <span className="text-white/50 text-xs truncate">
                                {jugador.club}
                              </span>
                            )}
                            {jugador.puntos_totales !== undefined && (
                              <span className="text-blue-300/70 text-xs font-medium">
                                {jugador.puntos_totales} pts
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Precio */}
                        <div className="flex-shrink-0 text-right">
                          <p className="text-green-400 font-bold text-lg leading-tight">
                            {precioDisplay}
                          </p>
                          <p className="text-white/40 text-[10px]">
                            Precio actual
                          </p>
                        </div>

                        {/* Botón estadísticas */}
                        <button
                          onClick={() =>
                            setStatsJugador({
                              id: jugador.id,
                              nombre:
                                jugador.nombreCompleto ||
                                jugador.nombre ||
                                'Jugador',
                              foto: jugador.foto,
                              posicion: jugador.posicion,
                              club: jugador.club,
                            })
                          }
                          className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg bg-blue-500/20 hover:bg-blue-500/40 border border-blue-500/30 text-blue-400 hover:text-blue-300 transition-all"
                          title="Ver estadísticas y precios"
                        >
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
                              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                            />
                          </svg>
                        </button>

                        {/* Input puja + botón */}
                        <div className="flex-shrink-0 flex items-center gap-2">
                          <MoneyInput
                            value={montoPuja[item.id] || ''}
                            onChange={(raw) =>
                              setMontoPuja({ ...montoPuja, [item.id]: raw })
                            }
                            placeholder={precioActual.toString()}
                            min={precioActual}
                            step={100000}
                            focusColor="green"
                            className="w-40"
                          />
                          <button
                            onClick={() => handlePujar(item.id, precioActual)}
                            disabled={
                              pujando === item.id || tienePujaActiva(item.id)
                            }
                            className="flex-shrink-0 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold py-2 px-4 rounded-lg text-sm transition-all disabled:cursor-not-allowed whitespace-nowrap"
                          >
                            {pujando === item.id ? (
                              <svg
                                className="animate-spin h-4 w-4"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                  fill="none"
                                />
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                />
                              </svg>
                            ) : tienePujaActiva(item.id) ? (
                              'Puja activa'
                            ) : (
                              'Pujar'
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Warning de puja activa */}
                      {tienePujaActiva(item.id) && (
                        <div className="mt-2 bg-yellow-500/15 border border-yellow-500/30 rounded-lg px-3 py-1.5 text-center">
                          <p className="text-yellow-300 text-xs">
                            Ya tienes una puja activa · Ve a "Mis Pujas" para
                            actualizarla
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ═══════════ TAB MI EQUIPO ═══════════ */}
        {tabActiva === 'mi-equipo' && (
          <>
            {loadingMiEquipo ? (
              <LoadingSpinner
                variant="section"
                message="Cargando tu equipo..."
              />
            ) : miEquipo ? (
              <div className="space-y-2">
                {miEquipo.jugadores.map((jugador) => {
                  const precioVenta = jugador.precio_actual || 0;
                  const precioDisplay =
                    precioVenta >= 1000000
                      ? `$${Math.floor(precioVenta / 1000000).toLocaleString('es-AR')}M`
                      : precioVenta >= 1000
                        ? `$${Math.floor(precioVenta / 1000).toLocaleString('es-AR')}K`
                        : `$${precioVenta.toLocaleString('es-AR')}`;

                  return (
                    <div
                      key={jugador.id}
                      className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 hover:border-emerald-500/40 transition-all p-3"
                    >
                      <div className="flex items-center gap-3">
                        {/* Foto */}
                        <div className="relative flex-shrink-0">
                          {jugador.foto ? (
                            <img
                              src={jugador.foto}
                              alt={jugador.nombreCompleto || jugador.nombre}
                              className="w-14 h-14 rounded-lg object-cover bg-white/10"
                              onError={(e) => {
                                e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                  jugador.nombreCompleto ||
                                    jugador.nombre ||
                                    'J',
                                )}&size=56&background=10B981&color=fff`;
                              }}
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white text-lg font-bold">
                              {(jugador.nombreCompleto || jugador.nombre || 'J')
                                .charAt(0)
                                .toUpperCase()}
                            </div>
                          )}
                          {jugador.clubLogo && (
                            <img
                              src={jugador.clubLogo}
                              alt={jugador.club}
                              className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white p-0.5 object-contain"
                            />
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-white font-semibold text-sm truncate">
                              {jugador.nombreCompleto || jugador.nombre}
                            </h3>
                            {jugador.posicion && (
                              <span className="flex-shrink-0 px-2 py-0.5 bg-emerald-500/30 text-emerald-300 rounded text-[10px] font-semibold uppercase">
                                {traducirPosicion(jugador.posicion)}
                              </span>
                            )}
                            {jugador.es_titular && (
                              <span className="flex-shrink-0 px-1.5 py-0.5 bg-yellow-500/80 text-white rounded text-[10px] font-bold">
                                Titular
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-0.5">
                            {jugador.club && (
                              <span className="text-white/50 text-xs truncate">
                                {jugador.club}
                              </span>
                            )}
                            {jugador.puntos_totales !== undefined && (
                              <span className="text-blue-300/70 text-xs font-medium">
                                {jugador.puntos_totales} pts
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Precio */}
                        <div className="flex-shrink-0 text-right mr-2">
                          <p className="text-orange-400 font-bold text-lg leading-tight">
                            {precioDisplay}
                          </p>
                          <p className="text-white/40 text-[10px]">
                            Precio venta
                          </p>
                        </div>

                        {/* Botón estadísticas */}
                        <button
                          onClick={() =>
                            setStatsJugador({
                              id: jugador.id,
                              nombre:
                                jugador.nombreCompleto ||
                                jugador.nombre ||
                                'Jugador',
                              foto: jugador.foto,
                              posicion: jugador.posicion,
                              club: jugador.club,
                            })
                          }
                          className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg bg-blue-500/20 hover:bg-blue-500/40 border border-blue-500/30 text-blue-400 hover:text-blue-300 transition-all"
                          title="Ver estadísticas y precios"
                        >
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
                              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                            />
                          </svg>
                        </button>

                        {/* Botón vender */}
                        <button
                          onClick={() => handleVender(jugador.id)}
                          disabled={vendiendo === jugador.id}
                          className="flex-shrink-0 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold py-2 px-4 rounded-lg text-sm transition-all disabled:cursor-not-allowed whitespace-nowrap"
                        >
                          {vendiendo === jugador.id ? (
                            <svg
                              className="animate-spin h-4 w-4"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                                fill="none"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              />
                            </svg>
                          ) : (
                            'Vender'
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20 text-center">
                <p className="text-white/70">
                  No tienes jugadores en este torneo
                </p>
              </div>
            )}
          </>
        )}

        {/* ═══════════ TAB MIS PUJAS ═══════════ */}
        {tabActiva === 'mis-pujas' && (
          <>
            {loadingPujas ? (
              <LoadingSpinner
                variant="section"
                message="Cargando tus pujas..."
              />
            ) : misPujas.length > 0 ? (
              <div className="space-y-2">
                {misPujas.map((puja) => {
                  const jugador = puja.jugador || puja.item_mercado?.jugador;
                  if (!jugador) return null;

                  const montoDisplay =
                    puja.monto >= 1000000
                      ? `$${Math.floor(puja.monto / 1000000).toLocaleString('es-AR')}M`
                      : `$${Math.floor(puja.monto / 1000).toLocaleString('es-AR')}K`;

                  let itemMercadoId = puja.item_mercado?.id;
                  if (!itemMercadoId && mercado?.items) {
                    const itemEnMercado = mercado.items.find(
                      (item) => item.jugador?.id === jugador.id,
                    );
                    itemMercadoId = itemEnMercado?.id;
                  }

                  return (
                    <div
                      key={puja.id}
                      className="bg-white/10 backdrop-blur-lg rounded-xl border border-yellow-500/30 hover:border-yellow-500/50 transition-all p-3"
                    >
                      <div className="flex items-center gap-3">
                        {/* Foto */}
                        <div className="relative flex-shrink-0">
                          {jugador.foto ? (
                            <img
                              src={jugador.foto}
                              alt={jugador.nombreCompleto || jugador.nombre}
                              className="w-14 h-14 rounded-lg object-cover bg-white/10"
                              onError={(e) => {
                                e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                  jugador.nombreCompleto ||
                                    jugador.nombre ||
                                    'J',
                                )}&size=56&background=F59E0B&color=fff`;
                              }}
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center text-white text-lg font-bold">
                              {(jugador.nombreCompleto || jugador.nombre || 'J')
                                .charAt(0)
                                .toUpperCase()}
                            </div>
                          )}
                          {jugador.clubLogo && (
                            <img
                              src={jugador.clubLogo}
                              alt={jugador.club}
                              className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white p-0.5 object-contain"
                            />
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-white font-semibold text-sm truncate">
                              {jugador.nombreCompleto || jugador.nombre}
                            </h3>
                            {jugador.posicion && (
                              <span className="flex-shrink-0 px-2 py-0.5 bg-yellow-500/30 text-yellow-300 rounded text-[10px] font-semibold uppercase">
                                {traducirPosicion(jugador.posicion)}
                              </span>
                            )}
                            <span className="flex-shrink-0 px-1.5 py-0.5 bg-yellow-500/80 text-white rounded text-[10px] font-bold">
                              Ofertando
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-0.5">
                            {jugador.club && (
                              <span className="text-white/50 text-xs truncate">
                                {jugador.club}
                              </span>
                            )}
                            <span className="text-yellow-300/60 text-xs">
                              {new Date(puja.fecha_oferta).toLocaleDateString(
                                'es-AR',
                              )}
                            </span>
                          </div>
                        </div>

                        {/* Oferta actual */}
                        <div className="flex-shrink-0 text-right mr-1">
                          <p className="text-yellow-400 font-bold text-lg leading-tight">
                            {montoDisplay}
                          </p>
                          <p className="text-white/40 text-[10px]">Tu oferta</p>
                        </div>

                        {/* Botón estadísticas */}
                        <button
                          onClick={() =>
                            setStatsJugador({
                              id: jugador.id,
                              nombre:
                                jugador.nombreCompleto ||
                                jugador.nombre ||
                                'Jugador',
                              foto: jugador.foto,
                              posicion: jugador.posicion,
                              club: jugador.club,
                            })
                          }
                          className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg bg-blue-500/20 hover:bg-blue-500/40 border border-blue-500/30 text-blue-400 hover:text-blue-300 transition-all"
                          title="Ver estadísticas y precios"
                        >
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
                              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                            />
                          </svg>
                        </button>

                        {/* Actualizar oferta */}
                        <div className="flex-shrink-0 flex items-center gap-2">
                          <MoneyInput
                            value={montoNuevoPuja[puja.id] || ''}
                            onChange={(raw) =>
                              setMontoNuevoPuja({
                                ...montoNuevoPuja,
                                [puja.id]: raw,
                              })
                            }
                            placeholder={puja.monto.toString()}
                            min={puja.monto}
                            step={100000}
                            focusColor="yellow"
                            className="w-36"
                          />
                          <button
                            onClick={() =>
                              itemMercadoId &&
                              handleActualizarPuja(puja.id, itemMercadoId)
                            }
                            disabled={
                              editandoPuja === puja.id || !itemMercadoId
                            }
                            className="flex-shrink-0 bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold py-2 px-3 rounded-lg text-xs transition-all disabled:cursor-not-allowed whitespace-nowrap"
                            title="Actualizar oferta"
                          >
                            {editandoPuja === puja.id ? (
                              <svg
                                className="animate-spin h-4 w-4"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                  fill="none"
                                />
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                />
                              </svg>
                            ) : (
                              'Actualizar'
                            )}
                          </button>
                          <button
                            onClick={() => handleCancelarPuja(puja.id)}
                            disabled={cancelandoPuja === puja.id}
                            className="flex-shrink-0 bg-red-500/80 hover:bg-red-600 disabled:bg-gray-500 text-white font-semibold py-2 px-3 rounded-lg text-xs transition-all disabled:cursor-not-allowed"
                            title="Cancelar oferta"
                          >
                            {cancelandoPuja === puja.id ? (
                              <svg
                                className="animate-spin h-4 w-4"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                  fill="none"
                                />
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                />
                              </svg>
                            ) : (
                              'Cancelar'
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Warning si no está en el mercado */}
                      {!itemMercadoId && (
                        <div className="mt-2 bg-red-500/15 border border-red-500/30 rounded-lg px-3 py-1.5 text-center">
                          <p className="text-red-300 text-xs">
                            No se puede actualizar: jugador no está en el
                            mercado actual
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20 text-center">
                <p className="text-white/70">No tienes pujas activas</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal de estadísticas del jugador */}
      {statsJugador && (
        <PlayerStatsModal
          jugadorId={statsJugador.id}
          jugadorNombre={statsJugador.nombre}
          jugadorFoto={statsJugador.foto}
          jugadorPosicion={statsJugador.posicion}
          jugadorClub={statsJugador.club}
          onClose={() => setStatsJugador(null)}
        />
      )}

      {/* Modal de confirmación */}
      <ConfirmModal
        open={showConfirmModal && confirmAction !== null}
        title={confirmAction?.title ?? ''}
        message={confirmAction?.message ?? ''}
        onConfirm={handleConfirm}
        onCancel={handleCancelConfirm}
      />
    </div>
  );
};

export default MercadoUsuario;
