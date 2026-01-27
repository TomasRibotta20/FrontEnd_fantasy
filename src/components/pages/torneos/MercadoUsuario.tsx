import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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

  // Estado para modal de confirmación
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // Función helper para mostrar confirmación
  const showConfirmation = (
    title: string,
    message: string,
    onConfirm: () => void
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

        if (miEquipoId) {
          setEquipoId(miEquipoId);
        } else {
          setError('No tienes un equipo en este torneo');
        }
      } catch (err) {
        console.error('Error al obtener equipoId:', err);
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
        console.error('Estructura de datos incorrecta:', data);
        setError('El mercado no tiene jugadores disponibles');
        setMercado(null);
        return;
      }

      setMercado(data);
    } catch (err) {
      console.error('Error al cargar mercado:', err);
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
      console.error('Error al cargar mi equipo:', err);
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
        console.error('Error al cargar mis pujas:', err);
        const error = err as { response?: { data?: { message?: string } } };
        setError(error.response?.data?.message || 'Error al cargar tus pujas');
        setMisPujas([]);
      } finally {
        setLoadingPujas(false);
      }
    },
    [equipoId, misPujas.length]
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
          item.jugador.nombreCompleto?.toLowerCase().includes(busquedaLower)
      );
    }

    // Filtro por posición
    if (posicionFiltro !== 'TODAS') {
      resultado = resultado.filter(
        (item) => item.jugador.posicion === posicionFiltro
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

  const posicionesDisponibles = useMemo(() => {
    if (!mercado || !mercado.items) return [];
    const posiciones = new Set(
      mercado.items
        .map((item) => item.jugador.posicion)
        .filter((pos): pos is string => !!pos)
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
        'Ya tienes una puja activa en este jugador. Ve a "Mis Pujas" para actualizarla.'
      );
      setTimeout(() => setError(null), 3000);
      return;
    }

    // El input recibe el valor absoluto (ej: 7000000 para $7M)
    const monto = parseFloat(montoPuja[itemId] || '0');

    if (monto < precioActual) {
      setError(
        `La puja debe ser mayor o igual a ${precioActual.toLocaleString(
          'es-AR'
        )}`
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
    itemMercadoId: number
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
      () => ejecutarCancelarPuja(pujaId)
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
      () => ejecutarVenderJugador(jugadorId)
    );
  };

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

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="mb-4 text-white/80 hover:text-white transition-colors flex items-center gap-2"
          >
            <span>← Volver</span>
          </button>

          <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">
            Mercado de Fichajes
          </h1>
          <p className="text-white/80 text-lg">
            {tabActiva === 'mercado' &&
              mercado &&
              `Mercado #${mercado.numero_mercado} - ${mercado.items.length} jugadores disponibles`}
            {tabActiva === 'mi-equipo' &&
              miEquipo &&
              `Mi Equipo - ${miEquipo.jugadores.length} jugadores`}
            {tabActiva === 'mis-pujas' &&
              `Mis Pujas - ${misPujas.length} oferta${
                misPujas.length !== 1 ? 's' : ''
              } activa${misPujas.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setTabActiva('mercado')}
            className={`flex-1 py-3 px-6 rounded-xl font-bold transition-all ${
              tabActiva === 'mercado'
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            Mercado
          </button>
          <button
            onClick={() => setTabActiva('mis-pujas')}
            className={`flex-1 py-3 px-6 rounded-xl font-bold transition-all ${
              tabActiva === 'mis-pujas'
                ? 'bg-gradient-to-r from-yellow-500 to-orange-600 text-white shadow-lg'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            Mis Pujas
          </button>
          <button
            onClick={() => setTabActiva('mi-equipo')}
            className={`flex-1 py-3 px-6 rounded-xl font-bold transition-all ${
              tabActiva === 'mi-equipo'
                ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            Mi Equipo
          </button>
        </div>

        {/* Mensajes - Fixed para que siempre sean visibles */}
        {error && (
          <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-2xl px-4">
            <div className="bg-red-500/90 backdrop-blur-lg border-2 border-red-400 rounded-xl p-4 shadow-2xl">
              <div className="flex items-center justify-between">
                <p className="text-white text-center font-semibold flex-1">
                  {error}
                </p>
                <button
                  onClick={() => setError(null)}
                  className="text-white/80 hover:text-white ml-4"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-2xl px-4">
            <div className="bg-green-500/90 backdrop-blur-lg border-2 border-green-400 rounded-xl p-4 shadow-2xl">
              <div className="flex items-center justify-between">
                <p className="text-white text-center font-semibold flex-1">
                  {success}
                </p>
                <button
                  onClick={() => setSuccess(null)}
                  className="text-white/80 hover:text-white ml-4"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Contenido según tab activa */}
        {tabActiva === 'mercado' && (
          <>
            {/* Filtros y búsqueda */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border-2 border-white/20 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Búsqueda */}
                <input
                  type="text"
                  placeholder="Buscar jugador o club..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="bg-white/10 border-2 border-white/30 rounded-lg px-4 py-2 text-white placeholder-white/50 focus:outline-none focus:border-white/60"
                />

                {/* Filtro por posición */}
                <select
                  value={posicionFiltro}
                  onChange={(e) => setPosicionFiltro(e.target.value)}
                  className="bg-white/10 border-2 border-white/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-white/60"
                >
                  <option value="TODAS">Todas las posiciones</option>
                  {posicionesDisponibles.map((pos) => (
                    <option key={pos} value={pos}>
                      {pos}
                    </option>
                  ))}
                </select>

                {/* Ordenamiento */}
                <select
                  value={ordenamiento}
                  onChange={(e) =>
                    setOrdenamiento(
                      e.target.value as 'nombre' | 'precio' | 'puntos'
                    )
                  }
                  className="bg-white/10 border-2 border-white/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-white/60"
                >
                  <option value="nombre">Ordenar por Nombre</option>
                  <option value="precio">Ordenar por Precio</option>
                  <option value="puntos">Ordenar por Puntos</option>
                </select>

                {/* Contador de resultados */}
                <div className="flex items-center justify-center text-white font-semibold">
                  {jugadores.length} jugador{jugadores.length !== 1 ? 'es' : ''}
                </div>
              </div>
            </div>

            {/* Lista de jugadores */}
            {loadingMercado ? (
              <div className="text-center text-white text-xl py-10">
                Cargando mercado...
              </div>
            ) : jugadores.length === 0 ? (
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border-2 border-white/20 text-center">
                <p className="text-white/80 text-lg">
                  No se encontraron jugadores con los filtros aplicados
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {jugadores.map((item) => {
                  const jugador = item.jugador;
                  const precioActual = jugador.precio_actual || 0;

                  return (
                    <div
                      key={item.id}
                      className="bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-lg rounded-2xl border-2 border-white/30 hover:border-white/50 transition-all hover:shadow-2xl overflow-hidden"
                    >
                      {/* Header con foto */}
                      <div className="relative h-56 bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center p-4">
                        {jugador.foto ? (
                          <img
                            src={jugador.foto}
                            alt={jugador.nombreCompleto || jugador.nombre}
                            className="h-full w-auto max-w-full object-contain rounded-lg"
                            onError={(e) => {
                              e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                jugador.nombreCompleto || jugador.nombre || 'J'
                              )}&size=200&background=4F46E5&color=fff`;
                            }}
                          />
                        ) : (
                          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold shadow-xl">
                            {(jugador.nombreCompleto || jugador.nombre || 'J')
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                        )}

                        {item.cantidad_pujas > 0 && (
                          <div className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                            {item.cantidad_pujas} puja
                            {item.cantidad_pujas !== 1 ? 's' : ''}
                          </div>
                        )}

                        {jugador.clubLogo && (
                          <div className="absolute top-3 left-3 bg-white/90 p-2 rounded-lg shadow-lg">
                            <img
                              src={jugador.clubLogo}
                              alt={jugador.club}
                              className="w-8 h-8 object-contain"
                            />
                          </div>
                        )}
                      </div>

                      {/* Información del jugador */}
                      <div className="p-5">
                        <div className="text-center mb-4">
                          <h3 className="text-xl font-bold text-white mb-1 leading-tight">
                            {jugador.nombreCompleto || jugador.nombre}
                          </h3>
                          {jugador.club && (
                            <p className="text-white/70 text-sm">
                              {jugador.club}
                            </p>
                          )}
                          {jugador.posicion && (
                            <span className="inline-block mt-2 px-3 py-1 bg-blue-500/30 text-blue-300 rounded-full text-xs font-semibold">
                              {jugador.posicion}
                            </span>
                          )}
                        </div>

                        {/* Precio actual - Centrado y destacado */}
                        <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl p-4 mb-4 text-center border-2 border-green-500/40">
                          <p className="text-green-200 text-sm font-medium mb-2">
                            Precio Actual
                          </p>
                          <p className="text-green-400 font-black text-3xl tracking-tight">
                            $
                            {precioActual >= 1000000
                              ? `${Math.floor(
                                  precioActual / 1000000
                                ).toLocaleString('es-AR')}M`
                              : `${Math.floor(
                                  precioActual / 1000
                                ).toLocaleString('es-AR')}K`}
                          </p>
                        </div>

                        {/* Puntos totales */}
                        {jugador.puntos_totales !== undefined && (
                          <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl p-3 mb-4 text-center border-2 border-blue-500/40">
                            <p className="text-blue-200 text-sm font-medium mb-1">
                              Puntos Totales
                            </p>
                            <p className="text-blue-400 font-bold text-2xl">
                              {jugador.puntos_totales}
                            </p>
                          </div>
                        )}

                        {/* Formulario de puja */}
                        <div className="space-y-3">
                          <div>
                            <label className="block text-white/70 text-sm mb-2">
                              Tu puja (mínimo:{' '}
                              {precioActual.toLocaleString('es-AR')})
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                value={
                                  montoPuja[item.id]
                                    ? parseFloat(
                                        montoPuja[item.id]
                                      ).toLocaleString('es-AR')
                                    : ''
                                }
                                onChange={(e) => {
                                  const raw = e.target.value.replace(
                                    /[^0-9]/g,
                                    ''
                                  );
                                  setMontoPuja({
                                    ...montoPuja,
                                    [item.id]: raw,
                                  });
                                }}
                                placeholder={precioActual.toLocaleString(
                                  'es-AR'
                                )}
                                className="w-full bg-white/10 border-2 border-white/30 rounded-lg pl-4 pr-12 py-2 text-white placeholder-white/50 focus:outline-none focus:border-green-400 transition-colors"
                              />
                              {/* Botones de incremento/decremento */}
                              <div className="absolute right-0 top-0 bottom-0 flex flex-col border-l border-white/20">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const current = parseFloat(
                                      montoPuja[item.id] ||
                                        precioActual.toString()
                                    );
                                    setMontoPuja({
                                      ...montoPuja,
                                      [item.id]: (current + 100000).toString(),
                                    });
                                  }}
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
                                  onClick={() => {
                                    const current = parseFloat(
                                      montoPuja[item.id] ||
                                        precioActual.toString()
                                    );
                                    const newValue = Math.max(
                                      precioActual,
                                      current - 100000
                                    );
                                    setMontoPuja({
                                      ...montoPuja,
                                      [item.id]: newValue.toString(),
                                    });
                                  }}
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

                          {tienePujaActiva(item.id) && (
                            <div className="bg-yellow-500/20 border-2 border-yellow-500/50 rounded-lg p-3 mb-3 text-center">
                              <p className="text-yellow-300 text-sm font-semibold">
                                Ya tienes una puja activa en este jugador
                              </p>
                              <p className="text-yellow-200/70 text-xs mt-1">
                                Ve a "Mis Pujas" para actualizarla
                              </p>
                            </div>
                          )}

                          <button
                            onClick={() => handlePujar(item.id, precioActual)}
                            disabled={
                              pujando === item.id || tienePujaActiva(item.id)
                            }
                            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg disabled:cursor-not-allowed"
                          >
                            {pujando === item.id ? (
                              <span className="flex items-center justify-center gap-2">
                                <svg
                                  className="animate-spin h-5 w-5"
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
                                Pujando...
                              </span>
                            ) : tienePujaActiva(item.id) ? (
                              'Ya tienes una puja activa'
                            ) : (
                              'Realizar Puja'
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Mi Equipo Tab */}
        {tabActiva === 'mi-equipo' && (
          <>
            {loadingMiEquipo ? (
              <div className="text-center text-white text-xl py-10">
                Cargando tu equipo...
              </div>
            ) : miEquipo ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {miEquipo.jugadores.map((jugador) => {
                  const precioVenta = jugador.precio_actual || 0;

                  return (
                    <div
                      key={jugador.id}
                      className="bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-lg rounded-2xl border-2 border-white/30 hover:border-emerald-500/50 transition-all hover:shadow-2xl overflow-hidden"
                    >
                      {/* Header con foto */}
                      <div className="relative h-56 bg-gradient-to-br from-emerald-500/20 to-green-500/20 flex items-center justify-center p-4">
                        {jugador.foto ? (
                          <img
                            src={jugador.foto}
                            alt={jugador.nombreCompleto || jugador.nombre}
                            className="h-full w-auto max-w-full object-contain rounded-lg"
                            onError={(e) => {
                              e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                jugador.nombreCompleto || jugador.nombre || 'J'
                              )}&size=200&background=10B981&color=fff`;
                            }}
                          />
                        ) : (
                          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white text-4xl font-bold shadow-xl">
                            {(jugador.nombreCompleto || jugador.nombre || 'J')
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                        )}

                        {jugador.es_titular && (
                          <div className="absolute top-3 right-3 bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                            Titular
                          </div>
                        )}

                        {jugador.clubLogo && (
                          <div className="absolute top-3 left-3 bg-white/90 p-2 rounded-lg shadow-lg">
                            <img
                              src={jugador.clubLogo}
                              alt={jugador.club}
                              className="w-8 h-8 object-contain"
                            />
                          </div>
                        )}
                      </div>

                      {/* Información del jugador */}
                      <div className="p-5">
                        <div className="text-center mb-4">
                          <h3 className="text-xl font-bold text-white mb-1 leading-tight">
                            {jugador.nombreCompleto || jugador.nombre}
                          </h3>
                          {jugador.club && (
                            <p className="text-white/70 text-sm">
                              {jugador.club}
                            </p>
                          )}
                          {jugador.posicion && (
                            <span className="inline-block mt-2 px-3 py-1 bg-emerald-500/30 text-emerald-300 rounded-full text-xs font-semibold">
                              {jugador.posicion}
                            </span>
                          )}
                        </div>

                        {/* Precio de venta - Centrado y destacado */}
                        <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-xl p-4 mb-4 text-center border-2 border-orange-500/40">
                          <p className="text-orange-200 text-sm font-medium mb-2">
                            Precio de Venta
                          </p>
                          <p className="text-orange-400 font-black text-3xl tracking-tight">
                            $
                            {precioVenta >= 1
                              ? `${Math.floor(precioVenta).toLocaleString(
                                  'es-AR'
                                )}M`
                              : `${Math.floor(
                                  precioVenta * 1000
                                ).toLocaleString('es-AR')}K`}
                          </p>
                        </div>

                        {/* Puntos totales */}
                        {jugador.puntos_totales !== undefined && (
                          <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl p-3 mb-4 text-center border-2 border-blue-500/40">
                            <p className="text-blue-200 text-sm font-medium mb-1">
                              Puntos Totales
                            </p>
                            <p className="text-blue-400 font-bold text-2xl">
                              {jugador.puntos_totales}
                            </p>
                          </div>
                        )}

                        {/* Botón de vender */}
                        <button
                          onClick={() => handleVender(jugador.id)}
                          disabled={vendiendo === jugador.id}
                          className="w-full bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg disabled:cursor-not-allowed"
                        >
                          {vendiendo === jugador.id ? (
                            <span className="flex items-center justify-center gap-2">
                              <svg
                                className="animate-spin h-5 w-5"
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
                              Vendiendo...
                            </span>
                          ) : (
                            `Vender por $${
                              precioVenta >= 1
                                ? `${Math.floor(precioVenta).toLocaleString(
                                    'es-AR'
                                  )}M`
                                : `${Math.floor(
                                    precioVenta * 1000
                                  ).toLocaleString('es-AR')}K`
                            }`
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border-2 border-white/20 text-center">
                <p className="text-white/80 text-lg">
                  No tienes jugadores en este torneo
                </p>
              </div>
            )}
          </>
        )}

        {/* Mis Pujas Tab */}
        {tabActiva === 'mis-pujas' && (
          <>
            {loadingPujas ? (
              <div className="text-center text-white text-xl py-10">
                Cargando tus pujas...
              </div>
            ) : misPujas.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {misPujas.map((puja) => {
                  // El backend puede devolver jugador en diferentes lugares
                  const jugador = puja.jugador || puja.item_mercado?.jugador;

                  if (!jugador) {
                    console.warn('Puja sin jugador:', puja);
                    return null;
                  }

                  const montoEnMillones = puja.monto / 1000000;

                  // Buscar el item_mercado_id en el mercado usando el jugador
                  let itemMercadoId = puja.item_mercado?.id;
                  if (!itemMercadoId && mercado?.items) {
                    const itemEnMercado = mercado.items.find(
                      (item) => item.jugador?.id === jugador.id
                    );
                    itemMercadoId = itemEnMercado?.id;
                  }

                  return (
                    <div
                      key={puja.id}
                      className="bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-lg rounded-2xl border-2 border-yellow-500/30 hover:border-yellow-500/50 transition-all hover:shadow-2xl overflow-hidden"
                    >
                      {/* Header con foto */}
                      <div className="relative h-56 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 flex items-center justify-center p-4">
                        {jugador.foto ? (
                          <img
                            src={jugador.foto}
                            alt={jugador.nombreCompleto || jugador.nombre}
                            className="h-full w-auto max-w-full object-contain rounded-lg"
                            onError={(e) => {
                              e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                jugador.nombreCompleto || jugador.nombre || 'J'
                              )}&size=200&background=F59E0B&color=fff`;
                            }}
                          />
                        ) : (
                          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center text-white text-4xl font-bold shadow-xl">
                            {(jugador.nombreCompleto || jugador.nombre || 'J')
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                        )}

                        <div className="absolute top-3 right-3 bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                          Ofertando
                        </div>

                        {jugador.clubLogo && (
                          <div className="absolute top-3 left-3 bg-white/90 p-2 rounded-lg shadow-lg">
                            <img
                              src={jugador.clubLogo}
                              alt={jugador.club}
                              className="w-8 h-8 object-contain"
                            />
                          </div>
                        )}
                      </div>

                      {/* Información del jugador */}
                      <div className="p-5">
                        <div className="text-center mb-4">
                          <h3 className="text-xl font-bold text-white mb-1 leading-tight">
                            {jugador.nombreCompleto || jugador.nombre}
                          </h3>
                          {jugador.club && (
                            <p className="text-white/70 text-sm">
                              {jugador.club}
                            </p>
                          )}
                          {(jugador.posicion || jugador.posicion) && (
                            <span className="inline-block mt-2 px-3 py-1 bg-yellow-500/30 text-yellow-300 rounded-full text-xs font-semibold">
                              {jugador.posicion || jugador.posicion}
                            </span>
                          )}
                        </div>

                        {/* Tu oferta actual */}
                        <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-xl p-4 mb-4 text-center border-2 border-yellow-500/40">
                          <p className="text-yellow-200 text-sm font-medium mb-2">
                            Tu Oferta Actual
                          </p>
                          <p className="text-yellow-400 font-black text-3xl tracking-tight">
                            $
                            {Math.floor(montoEnMillones).toLocaleString(
                              'es-AR'
                            )}
                            M
                          </p>
                          <p className="text-yellow-300/70 text-xs mt-2">
                            {new Date(puja.fecha_oferta).toLocaleDateString(
                              'es-AR'
                            )}
                          </p>
                        </div>

                        {/* Actualizar oferta */}
                        <div className="space-y-3 mb-4">
                          <label className="block text-white/70 text-sm">
                            Nueva oferta (mínimo:{' '}
                            {puja.monto.toLocaleString('es-AR')})
                          </label>
                          <input
                            type="number"
                            step="100000"
                            min={puja.monto}
                            value={montoNuevoPuja[puja.id] || ''}
                            onChange={(e) =>
                              setMontoNuevoPuja({
                                ...montoNuevoPuja,
                                [puja.id]: e.target.value,
                              })
                            }
                            placeholder={puja.monto.toLocaleString('es-AR')}
                            className="w-full bg-white/10 border-2 border-white/30 rounded-lg px-4 py-2 text-white placeholder-white/50 focus:outline-none focus:border-yellow-400 transition-colors"
                          />
                        </div>

                        {/* Botones de acción */}
                        <div className="space-y-2">
                          {!itemMercadoId && (
                            <div className="bg-red-500/20 border-2 border-red-500/50 rounded-lg p-2 mb-2 text-center">
                              <p className="text-red-300 text-xs">
                                No se puede actualizar: jugador no está en el
                                mercado actual
                              </p>
                            </div>
                          )}

                          <button
                            onClick={() =>
                              itemMercadoId &&
                              handleActualizarPuja(puja.id, itemMercadoId)
                            }
                            disabled={
                              editandoPuja === puja.id || !itemMercadoId
                            }
                            className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg disabled:cursor-not-allowed"
                          >
                            {editandoPuja === puja.id ? (
                              <span className="flex items-center justify-center gap-2">
                                <svg
                                  className="animate-spin h-5 w-5"
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
                                Actualizando...
                              </span>
                            ) : (
                              'Actualizar Oferta'
                            )}
                          </button>

                          <button
                            onClick={() => handleCancelarPuja(puja.id)}
                            disabled={cancelandoPuja === puja.id}
                            className="w-full bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg disabled:cursor-not-allowed"
                          >
                            {cancelandoPuja === puja.id ? (
                              <span className="flex items-center justify-center gap-2">
                                <svg
                                  className="animate-spin h-5 w-5"
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
                                Cancelando...
                              </span>
                            ) : (
                              'Cancelar Oferta'
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border-2 border-white/20 text-center">
                <p className="text-white/80 text-lg">No tienes pujas activas</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal de confirmación */}
      {showConfirmModal && confirmAction && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 max-w-md w-full border-2 border-white/20 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-4">
              {confirmAction.title}
            </h2>
            <p className="text-gray-300 mb-6">{confirmAction.message}</p>
            <div className="flex gap-4">
              <button
                onClick={handleConfirm}
                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all"
              >
                Confirmar
              </button>
              <button
                onClick={handleCancelConfirm}
                className="flex-1 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MercadoUsuario;
