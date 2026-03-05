import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import LoadingSpinner from '../../common/LoadingSpinner';
import ConfirmModal from '../../common/ConfirmModal';
import {
  jornadasService,
  estadisticasService,
  adminService,
  type Jornada,
  type EstadisticaJugador,
} from '../../../services/jornadasService';
import {
  partidosService,
  type Partido,
  type PartidoCreate,
  type PartidoUpdate,
} from '../../../services/partidosService';
import apiClient from '../../../services/apiClient';

interface Club {
  id: number;
  nombre: string;
  escudo?: string;
}

const DetalleJornada = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [jornada, setJornada] = useState<Jornada | null>(null);
  const [puntajes, setPuntajes] = useState<EstadisticaJugador[]>([]);
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [esJornadaActiva, setEsJornadaActiva] = useState(false);
  const [modificacionesHabilitadas, setModificacionesHabilitadas] =
    useState(false);
  const [procesando, setProcesando] = useState(false);

  // Estados para CRUD de partidos
  const [clubs, setClubs] = useState<Club[]>([]);
  const [showPartidoModal, setShowPartidoModal] = useState(false);
  const [editingPartido, setEditingPartido] = useState<Partido | null>(null);
  const [partidoForm, setPartidoForm] = useState<Partial<PartidoCreate>>({
    id_api: 0,
    fecha: '',
    estado: 'NS',
    estado_detalle: 'No iniciado',
    estadio: '',
    jornadaId: Number(id),
    localId: 0,
    visitanteId: 0,
  });

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

  useEffect(() => {
    if (id) {
      loadJornadaData();
      loadClubs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadClubs = async () => {
    try {
      const response = await apiClient.get('/api/clubs');
      const data = response.data;
      setClubs(Array.isArray(data) ? data : data?.data || []);
    } catch {
      setClubs([]);
    }
  };

  const handleOpenCreatePartido = () => {
    setEditingPartido(null);
    setPartidoForm({
      id_api: 0,
      fecha: new Date().toISOString().slice(0, 16),
      estado: 'NS',
      estado_detalle: 'No iniciado',
      estadio: '',
      jornadaId: Number(id),
      localId: 0,
      visitanteId: 0,
    });
    setShowPartidoModal(true);
  };

  const handleOpenEditPartido = (partido: Partido) => {
    setEditingPartido(partido);
    setPartidoForm({
      estado: partido.estado,
      estado_detalle: partido.estado_detalle,
    });
    setShowPartidoModal(true);
  };

  const handleClosePartidoModal = () => {
    setShowPartidoModal(false);
    setEditingPartido(null);
    setPartidoForm({
      id_api: 0,
      fecha: '',
      estado: 'NS',
      estado_detalle: 'No iniciado',
      estadio: '',
      jornadaId: Number(id),
      localId: 0,
      visitanteId: 0,
    });
  };

  const handleSavePartido = async () => {
    try {
      setLoading(true);
      setError(null);

      if (editingPartido) {
        // Actualizar partido existente (solo estado y estado_detalle)
        const updateData: PartidoUpdate = {
          estado: partidoForm.estado,
          estado_detalle: partidoForm.estado_detalle,
        };
        await partidosService.updatePartido(editingPartido.id, updateData);
        setSuccess('Partido actualizado correctamente');
      } else {
        // Crear nuevo partido
        if (
          !partidoForm.id_api ||
          !partidoForm.fecha ||
          !partidoForm.localId ||
          !partidoForm.visitanteId
        ) {
          setError('Por favor completa todos los campos obligatorios');
          setLoading(false);
          return;
        }

        const createData: PartidoCreate = {
          id_api: partidoForm.id_api || 0,
          fecha: partidoForm.fecha || '',
          estado: partidoForm.estado || 'NS',
          estado_detalle: partidoForm.estado_detalle || 'No iniciado',
          estadio: partidoForm.estadio,
          jornadaId: Number(id),
          localId: partidoForm.localId || 0,
          visitanteId: partidoForm.visitanteId || 0,
        };
        await partidosService.createPartido(createData);
        setSuccess('Partido creado correctamente');
      }

      handleClosePartidoModal();
      await loadJornadaData(); // Recargar datos
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError('Error al guardar el partido');
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePartido = (partidoId: number) => {
    showConfirmation(
      'Eliminar Partido',
      '¿Estás seguro de eliminar este partido? Esta acción no se puede deshacer.',
      async () => {
        try {
          setLoading(true);
          setError(null);
          await partidosService.deletePartido(partidoId);
          setSuccess('Partido eliminado correctamente');
          await loadJornadaData();
          setTimeout(() => setSuccess(null), 3000);
        } catch {
          setError('Error al eliminar el partido');
          setTimeout(() => setError(null), 3000);
        } finally {
          setLoading(false);
        }
      },
    );
  };

  const loadJornadaData = async () => {
    if (!id) {
      return;
    }

    try {
      setLoading(true);

      // Cargar jornada
      const jornadaData = await jornadasService.getJornadaById(Number(id));
      setJornada(jornadaData);

      // Cargar configuración para saber si esta jornada está activa
      try {
        // Intentar primero con el servicio de admin
        const config = await adminService.getConfig();

        // Verificar si esta jornada es la activa
        // jornadaActiva puede ser un número o un objeto con id
        const jornadaActivaId =
          typeof config.jornadaActiva === 'object' &&
          config.jornadaActiva !== null
            ? (config.jornadaActiva as { id: number }).id
            : config.jornadaActiva;

        const esActiva = jornadaActivaId === Number(id);

        setEsJornadaActiva(esActiva);
        setModificacionesHabilitadas(config.modificacionesHabilitadas);
      } catch {
        // Fallback: Usar endpoints públicos
        try {
          const [jornadaActivaRes, estadoModsRes] = await Promise.all([
            apiClient.get('/api/config/jornada-activa'),
            apiClient.get('/api/config/estado-modificaciones'),
          ]);

          const jornadaActivaData = jornadaActivaRes.data;
          const estadoModsData = estadoModsRes.data;

          const jornadaActivaId = jornadaActivaData?.data?.jornada?.id || null;
          const modsHabilitadas =
            estadoModsData?.data?.modificacionesHabilitadas || false;

          const esActiva = jornadaActivaId === Number(id);

          setEsJornadaActiva(esActiva);
          setModificacionesHabilitadas(modsHabilitadas);
        } catch {
          setEsJornadaActiva(false);
          setModificacionesHabilitadas(false);
        }
      }

      // Cargar puntajes
      try {
        const puntajesData = await estadisticasService.getPuntajesJornada(
          Number(id),
        );

        // Asegurarse de que sea un array
        const puntajesArray = Array.isArray(puntajesData) ? puntajesData : [];

        setPuntajes(puntajesArray);
      } catch {
        setPuntajes([]);
      }

      // Cargar partidos de esta jornada
      try {
        const partidosData = await partidosService.getPartidos({
          jornadaId: Number(id),
        });
        const partidosArray = Array.isArray(partidosData) ? partidosData : [];

        setPartidos(partidosArray);
      } catch {
        setPartidos([]);
      }

      setError(null);
    } catch {
      setError('Error al cargar datos de la jornada');
      setPuntajes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleProcesarJornada = () => {
    if (!id) return;

    showConfirmation(
      'Procesar Jornada',
      '¿Estás seguro de procesar esta jornada? Esto calculará los puntos de todos los jugadores.',
      async () => {
        try {
          setProcesando(true);
          setError(null);
          const response = await fetch(
            `http://localhost:3000/api/admin/jornadas/${id}/procesar`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ activarJornada: true }),
            },
          );

          const data = await response.json();

          if (response.ok) {
            setSuccess(`${data.message || 'Jornada procesada correctamente'}`);
            await loadJornadaData(); // Recargar datos
            setTimeout(() => setSuccess(null), 5000);
          } else {
            setError(`${data.message || 'Error al procesar jornada'}`);
            setTimeout(() => setError(null), 5000);
          }
        } catch {
          setError('Error al procesar jornada');
          setTimeout(() => setError(null), 5000);
        } finally {
          setProcesando(false);
        }
      },
    );
  };

  const handleRecalcularPuntajes = () => {
    if (!id) return;

    showConfirmation(
      'Recalcular Puntajes',
      '¿Estás seguro de recalcular los puntajes de esta jornada? Esto sobrescribirá los puntajes actuales.',
      async () => {
        try {
          setProcesando(true);
          setError(null);
          const response = await fetch(
            `http://localhost:3000/api/admin/jornadas/${id}/recalcular`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
            },
          );

          const data = await response.json();

          if (response.ok) {
            setSuccess(
              `${data.message || 'Puntajes recalculados correctamente'}`,
            );
            await loadJornadaData(); // Recargar datos
            setTimeout(() => setSuccess(null), 5000);
          } else {
            setError(`${data.message || 'Error al recalcular puntajes'}`);
            setTimeout(() => setError(null), 5000);
          }
        } catch {
          setError('Error al recalcular puntajes');
          setTimeout(() => setError(null), 5000);
        } finally {
          setProcesando(false);
        }
      },
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 pt-20 pb-8 px-8 flex items-center justify-center">
        <LoadingSpinner variant="section" message="Cargando jornada..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 pt-20 pb-8 px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-500 text-white p-6 rounded-lg">
            <h2 className="text-2xl font-bold mb-2">Error</h2>
            <p className="mb-4">{error}</p>
            <div className="bg-red-700 p-3 rounded text-sm mb-4">
              <p className="font-mono">Jornada ID: {id}</p>
              <p className="font-mono mt-1">
                Verifica que el backend esté corriendo en http://localhost:3000
              </p>
            </div>
            <button
              onClick={() => navigate(-1)}
              className="mt-4 px-4 py-2 bg-white text-red-500 rounded-lg font-semibold hover:bg-gray-100"
            >
              ← Volver
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!jornada) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 pt-20 pb-8 px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-yellow-500 text-black p-6 rounded-lg">
            <h2 className="text-2xl font-bold mb-2">Jornada no encontrada</h2>
            <p className="mb-4">
              No se pudo cargar la información de la jornada {id}
            </p>
            <button
              onClick={() => navigate(-1)}
              className="mt-4 px-4 py-2 bg-black text-yellow-500 rounded-lg font-semibold hover:bg-gray-900"
            >
              ← Volver
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 pt-20 pb-8 px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <button
              onClick={() => navigate(-1)}
              className="text-white hover:text-gray-300 mb-4 flex items-center gap-2"
            >
              ← Volver
            </button>
            <h1 className="text-4xl font-bold text-white">
              {jornada.nombre || `Jornada ${jornada.numero || jornada.id}`}
            </h1>
            <div className="mt-2 space-y-1">
              {jornada.temporada && (
                <p className="text-gray-300">Temporada: {jornada.temporada}</p>
              )}
              {jornada.etapa && (
                <p className="text-gray-300">Etapa: {jornada.etapa}</p>
              )}
            </div>
          </div>
          <button
            onClick={loadJornadaData}
            disabled={loading}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold disabled:opacity-50"
          >
            Recargar
          </button>
        </div>

        {/* Estado de la Jornada */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <p className="text-gray-300 text-sm mb-2">Estado</p>
            <p
              className={`text-2xl font-bold ${
                esJornadaActiva ? 'text-green-400' : 'text-gray-400'
              }`}
            >
              {esJornadaActiva ? 'Activa' : 'Inactiva'}
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <p className="text-gray-300 text-sm mb-2">Modificaciones</p>
            <p
              className={`text-2xl font-bold ${
                modificacionesHabilitadas ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {modificacionesHabilitadas ? 'Permitidas' : 'Bloqueadas'}
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <p className="text-gray-300 text-sm mb-2">Puntos</p>
            <p
              className={`text-2xl font-bold ${
                puntajes.length > 0 ? 'text-blue-400' : 'text-yellow-400'
              }`}
            >
              {puntajes.length > 0 ? 'Calculados' : 'Pendientes'}
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <p className="text-gray-300 text-sm mb-2">Jugadores con Puntos</p>
            <p className="text-2xl font-bold text-white">{puntajes.length}</p>
          </div>
        </div>

        {/* Fechas */}
        {(jornada.fechaInicio || jornada.fechaFin) && (
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 mb-8 border border-white/20">
            <h2 className="text-xl font-bold text-white mb-4">Fechas</h2>
            <div className="grid grid-cols-2 gap-4">
              {jornada.fechaInicio && (
                <div>
                  <p className="text-gray-300 text-sm">Inicio</p>
                  <p className="text-white font-semibold">
                    {new Date(jornada.fechaInicio).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              )}
              {jornada.fechaFin && (
                <div>
                  <p className="text-gray-300 text-sm">Fin</p>
                  <p className="text-white font-semibold">
                    {new Date(jornada.fechaFin).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mensajes de Éxito/Error */}
        {success && (
          <div className="bg-green-600 text-white p-4 rounded-lg mb-6 flex items-center justify-between animate-pulse">
            <span className="font-semibold">{success}</span>
            <button onClick={() => setSuccess(null)} className="text-2xl">
              ✕
            </button>
          </div>
        )}
        {error && (
          <div className="bg-red-600 text-white p-4 rounded-lg mb-6 flex items-center justify-between animate-pulse">
            <span className="font-semibold">{error}</span>
            <button onClick={() => setError(null)} className="text-2xl">
              ✕
            </button>
          </div>
        )}

        {/* Botones de Acción (Solo para Admins) */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 mb-8 border border-white/20">
          <h2 className="text-xl font-bold text-white mb-4">
            Acciones de Administrador
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={handleProcesarJornada}
              disabled={procesando || loading}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {procesando ? 'Procesando...' : 'Procesar Jornada'}
            </button>
            <button
              onClick={handleRecalcularPuntajes}
              disabled={procesando || loading}
              className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {procesando ? 'Recalculando...' : 'Recalcular Puntajes'}
            </button>
          </div>
        </div>

        {/* Partidos de la Jornada */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 mb-8 border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-white">
                Partidos de la Jornada
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={loadJornadaData}
                disabled={loading}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-all flex items-center gap-2 disabled:opacity-50"
                title="Recargar partidos desde el servidor"
              >
                Recargar
              </button>
              <button
                onClick={handleOpenCreatePartido}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all flex items-center gap-2"
                title="Agregar un partido manualmente"
              >
                <span className="text-xl">+</span> Agregar Partido
              </button>
            </div>
          </div>

          {partidos.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <p className="mb-4">
                No hay partidos registrados para esta jornada
              </p>
              <button
                onClick={handleOpenCreatePartido}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all"
              >
                Crear Primer Partido
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {partidos.map((partido, index) => (
                <div
                  key={partido.id}
                  className="bg-black/30 rounded-lg p-4 border border-white/10 hover:border-white/30 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 font-mono text-sm">
                        #{index + 1}
                      </span>
                      <span className="text-gray-400 text-sm">
                        {new Date(partido.fecha).toLocaleString('es-ES', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          partido.estado === 'FT'
                            ? 'bg-green-600 text-white'
                            : partido.estado === 'LIVE'
                              ? 'bg-red-600 text-white animate-pulse'
                              : partido.estado === 'PST'
                                ? 'bg-yellow-600 text-white'
                                : partido.estado === 'CANC' ||
                                    partido.estado === 'ABD'
                                  ? 'bg-red-800 text-white'
                                  : 'bg-gray-600 text-white'
                        }`}
                      >
                        {partido.estado_detalle || partido.estado}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex-1 text-right">
                      <p className="text-white font-semibold text-lg">
                        {partido.local?.nombre || `Club ${partido.localId}`}
                      </p>
                    </div>
                    <div className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg shadow-lg">
                      <p className="text-white font-bold text-sm">VS</p>
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-semibold text-lg">
                        {partido.visitante?.nombre ||
                          `Club ${partido.visitanteId}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
                    <div className="flex items-center gap-3 text-sm">
                      {partido.estadio && (
                        <span className="text-gray-400">
                          Estadio: {partido.estadio}
                        </span>
                      )}
                      <span className="text-gray-500 font-mono text-xs">
                        ID: {partido.id} | API: {partido.id_api}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEditPartido(partido)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-semibold transition-all flex items-center gap-1"
                        title="Editar estado del partido"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeletePartido(partido.id)}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-semibold transition-all flex items-center gap-1"
                        title="Eliminar partido"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Estadísticas Resumidas */}
        {puntajes && puntajes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
              <p className="text-gray-300 text-sm mb-1">Total Jugadores</p>
              <p className="text-2xl font-bold text-white">{puntajes.length}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
              <p className="text-gray-300 text-sm mb-1">Puntos Totales</p>
              <p className="text-2xl font-bold text-yellow-400">
                {puntajes
                  .reduce((sum, p) => sum + (p.puntaje_total || 0), 0)
                  .toFixed(1)}
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
              <p className="text-gray-300 text-sm mb-1">Goles Totales</p>
              <p className="text-2xl font-bold text-green-400">
                {puntajes.reduce((sum, p) => sum + (p.goles || 0), 0)}
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
              <p className="text-gray-300 text-sm mb-1">Asistencias Totales</p>
              <p className="text-2xl font-bold text-blue-400">
                {puntajes.reduce((sum, p) => sum + (p.asistencias || 0), 0)}
              </p>
            </div>
          </div>
        )}

        {/* Tabla de Puntajes */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">
              Top 20 Mejores Puntajes
            </h2>
            {puntajes.length > 20 && (
              <p className="text-gray-400 text-sm">
                Mostrando 20 de {puntajes.length} jugadores
              </p>
            )}
          </div>

          {puntajes.length === 0 ? (
            <div className="text-center text-gray-400 py-12">
              <p className="text-lg mb-2">
                No hay puntajes registrados para esta jornada
              </p>
              <p className="text-sm">
                {esJornadaActiva
                  ? "Usa el botón 'Procesar Jornada' arriba para calcular los puntos"
                  : 'Esta jornada aún no ha sido procesada'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-white">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-left py-3 px-4">#</th>
                    <th className="text-left py-3 px-4">Jugador</th>
                    <th className="text-left py-3 px-4">Pos</th>
                    <th className="text-right py-3 px-4">Puntos</th>
                    <th className="text-right py-3 px-4">Rating</th>
                    <th className="text-right py-3 px-4">Goles</th>
                    <th className="text-right py-3 px-4">Asist.</th>
                    <th className="text-right py-3 px-4">Min</th>
                    <th className="text-right py-3 px-4">TA</th>
                    <th className="text-right py-3 px-4">TR</th>
                  </tr>
                </thead>
                <tbody>
                  {puntajes
                    .sort(
                      (a, b) => (b.puntaje_total || 0) - (a.puntaje_total || 0),
                    )
                    .slice(0, 20) // Mostrar solo los 20 primeros
                    .map((puntaje, index) => (
                      <tr
                        key={`${puntaje.id}`}
                        className={`border-b border-white/10 hover:bg-white/5 transition-colors ${
                          index < 3 ? 'bg-yellow-500/10' : ''
                        }`}
                      >
                        <td className="py-3 px-4">
                          <span
                            className={`font-bold ${
                              index === 0
                                ? 'text-yellow-400 text-xl'
                                : index === 1
                                  ? 'text-gray-300 text-lg'
                                  : index === 2
                                    ? 'text-orange-400'
                                    : 'text-white'
                            }`}
                          >
                            {index === 0
                              ? '1°'
                              : index === 1
                                ? '2°'
                                : index === 2
                                  ? '3°'
                                  : index + 1}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {puntaje.jugador?.photo && (
                              <img
                                src={puntaje.jugador.photo}
                                alt={puntaje.jugador.name}
                                className="w-8 h-8 rounded-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display =
                                    'none';
                                }}
                              />
                            )}
                            <div>
                              <p className="font-medium">
                                {puntaje.jugador?.name || 'Desconocido'}
                              </p>
                              <p className="text-xs text-gray-400">
                                ID: {puntaje.jugador?.id}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-300">
                          {puntaje.posicion || '-'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span
                            className={`px-3 py-1 rounded-full font-bold ${
                              (puntaje.puntaje_total || 0) >= 10
                                ? 'bg-green-600'
                                : (puntaje.puntaje_total || 0) >= 7
                                  ? 'bg-blue-600'
                                  : (puntaje.puntaje_total || 0) >= 5
                                    ? 'bg-indigo-600'
                                    : 'bg-gray-600'
                            }`}
                          >
                            {(puntaje.puntaje_total || 0).toFixed(1)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-gray-300">
                          {puntaje.rating ? puntaje.rating.toFixed(1) : '-'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {puntaje.goles ? (
                            <span className="text-green-400 font-bold">
                              {puntaje.goles}
                            </span>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {puntaje.asistencias ? (
                            <span className="text-blue-400 font-bold">
                              {puntaje.asistencias}
                            </span>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right text-gray-300">
                          {puntaje.minutos || 0}'
                        </td>
                        <td className="py-3 px-4 text-right">
                          {puntaje.tarjetas_amarillas ? (
                            <span className="text-yellow-400 font-bold">
                              🟨 {puntaje.tarjetas_amarillas}
                            </span>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {puntaje.tarjetas_rojas ? (
                            <span className="text-red-400 font-bold">
                              🟥 {puntaje.tarjetas_rojas}
                            </span>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal para Crear/Editar Partido */}
        {showPartidoModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border-2 border-white/20">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {editingPartido
                      ? 'Editar Partido'
                      : 'Agregar Partido Manual'}
                  </h2>
                  {!editingPartido && (
                    <p className="text-gray-400 text-sm mt-1">
                      Los partidos de la API se cargan automáticamente. Usa este
                      formulario para agregar partidos adicionales.
                    </p>
                  )}
                </div>
                <button
                  onClick={handleClosePartidoModal}
                  className="text-white hover:text-gray-300 text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                {!editingPartido ? (
                  <>
                    {/* Información importante */}
                    <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4">
                      <p className="text-yellow-200 text-sm">
                        <strong>Nota:</strong> Si el partido ya existe en la API
                        externa, será cargado automáticamente. Este formulario
                        es para agregar partidos que NO están en la API.
                      </p>
                    </div>

                    {/* Campos para crear partido */}
                    <div>
                      <label className="block text-white mb-2 font-semibold">
                        ID API *{' '}
                        <span className="text-gray-400 text-sm font-normal">
                          (ID del partido en la API externa)
                        </span>
                      </label>
                      <input
                        type="number"
                        value={partidoForm.id_api || ''}
                        onChange={(e) =>
                          setPartidoForm({
                            ...partidoForm,
                            id_api: Number(e.target.value),
                          })
                        }
                        className="w-full px-4 py-2 bg-black/30 border border-white/20 rounded-lg text-white"
                        placeholder="Ej: 12345"
                      />
                    </div>

                    <div>
                      <label className="block text-white mb-2 font-semibold">
                        Fecha y Hora *
                      </label>
                      <input
                        type="datetime-local"
                        value={partidoForm.fecha || ''}
                        onChange={(e) =>
                          setPartidoForm({
                            ...partidoForm,
                            fecha: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 bg-black/30 border border-white/20 rounded-lg text-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-white mb-2 font-semibold">
                          Club Local *
                        </label>
                        <select
                          value={partidoForm.localId || 0}
                          onChange={(e) =>
                            setPartidoForm({
                              ...partidoForm,
                              localId: Number(e.target.value),
                            })
                          }
                          className="w-full px-4 py-2 bg-black/30 border border-white/20 rounded-lg text-white"
                        >
                          <option value={0}>Selecciona club local</option>
                          {clubs.map((club) => (
                            <option key={club.id} value={club.id}>
                              {club.nombre}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-white mb-2 font-semibold">
                          Club Visitante *
                        </label>
                        <select
                          value={partidoForm.visitanteId || 0}
                          onChange={(e) =>
                            setPartidoForm({
                              ...partidoForm,
                              visitanteId: Number(e.target.value),
                            })
                          }
                          className="w-full px-4 py-2 bg-black/30 border border-white/20 rounded-lg text-white"
                        >
                          <option value={0}>Selecciona club visitante</option>
                          {clubs.map((club) => (
                            <option key={club.id} value={club.id}>
                              {club.nombre}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-white mb-2 font-semibold">
                        Estadio
                      </label>
                      <input
                        type="text"
                        value={partidoForm.estadio || ''}
                        onChange={(e) =>
                          setPartidoForm({
                            ...partidoForm,
                            estadio: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 bg-black/30 border border-white/20 rounded-lg text-white"
                        placeholder="Nombre del estadio"
                      />
                    </div>
                  </>
                ) : (
                  <div className="bg-blue-500/20 p-4 rounded-lg mb-4">
                    <p className="text-white text-sm">
                      Solo puedes editar el estado del partido. Para modificar
                      otros datos, elimina y crea uno nuevo.
                    </p>
                  </div>
                )}

                {/* Campos comunes (crear y editar) */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white mb-2 font-semibold">
                      Estado
                    </label>
                    <select
                      value={partidoForm.estado || 'NS'}
                      onChange={(e) =>
                        setPartidoForm({
                          ...partidoForm,
                          estado: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 bg-black/30 border border-white/20 rounded-lg text-white"
                    >
                      <option value="NS">No iniciado (NS)</option>
                      <option value="LIVE">En vivo (LIVE)</option>
                      <option value="HT">Medio tiempo (HT)</option>
                      <option value="FT">Finalizado (FT)</option>
                      <option value="PST">Pospuesto (PST)</option>
                      <option value="CANC">Cancelado (CANC)</option>
                      <option value="ABD">Abandonado (ABD)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-white mb-2 font-semibold">
                      Detalle del Estado
                    </label>
                    <input
                      type="text"
                      value={partidoForm.estado_detalle || ''}
                      onChange={(e) =>
                        setPartidoForm({
                          ...partidoForm,
                          estado_detalle: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 bg-black/30 border border-white/20 rounded-lg text-white"
                      placeholder="Ej: 45', Finalizado, etc."
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  onClick={handleSavePartido}
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold disabled:opacity-50 transition-all"
                >
                  {loading
                    ? 'Guardando...'
                    : editingPartido
                      ? 'Actualizar'
                      : 'Crear'}
                </button>
                <button
                  onClick={handleClosePartidoModal}
                  className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-all"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Confirmación */}
        <ConfirmModal
          open={showConfirmModal && confirmAction !== null}
          title={confirmAction?.title ?? ''}
          message={confirmAction?.message ?? ''}
          onConfirm={handleConfirm}
          onCancel={handleCancelConfirm}
        />
      </div>
    </div>
  );
};

export default DetalleJornada;
