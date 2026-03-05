import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ConfirmModal from '../../common/ConfirmModal';
import {
  obtenerTodosLosTorneos,
  obtenerTorneoAdmin,
  crearTorneo,
  actualizarTorneoParcialAdmin,
  eliminarTorneo,
  type FiltrosTorneos,
  type CrearTorneoData,
  type ActualizacionParcialTorneo,
} from '../../../services/torneosService';

interface Torneo {
  id: number;
  nombre: string;
  descripcion?: string;
  estado: 'EN_ESPERA' | 'ACTIVO' | 'FINALIZADO';
  codigo_acceso: string;
  cupo_maximo: number;
  cant_participantes: number;
  fecha_creacion: string;
  creador_id: number;
}

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

interface TorneoDetalleAdmin {
  id: number;
  nombre: string;
  descripcion?: string;
  estado: 'EN_ESPERA' | 'ACTIVO' | 'FINALIZADO';
  codigo: string;
  participantes?: Participante[];
}

interface ParticipanteBackend {
  inscripcion_id: number;
  usuario: {
    id: number;
    username: string;
    email: string;
    rol: string;
  };
  equipo: {
    id: number;
    nombre: string;
    puntos: number;
    presupuesto: number;
  };
}

type ModalMode = 'create' | 'edit' | 'view' | null;

/** Panel de administración de torneos. */
const GestionTorneosAdmin = () => {
  const navigate = useNavigate();
  const [torneos, setTorneos] = useState<Torneo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Estados para filtros
  const [filtros, setFiltros] = useState<FiltrosTorneos>({});
  const [showFilters, setShowFilters] = useState(false);

  // Estados para modales
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedTorneo, setSelectedTorneo] = useState<Torneo | null>(null);
  const [torneoDetalle, setTorneoDetalle] = useState<TorneoDetalleAdmin | null>(
    null,
  );

  // Estados para dropdown de participantes
  const [expandedTorneoId, setExpandedTorneoId] = useState<number | null>(null);
  const [participantesCache, setParticipantesCache] = useState<
    Record<number, Participante[]>
  >({});

  // Estados para formularios
  const [formData, setFormData] = useState<Partial<CrearTorneoData>>({
    nombre: '',
    descripcion: '',
    cupoMaximo: 10,
    nombre_equipo: '',
  });

  const [formDataParcial, setFormDataParcial] =
    useState<ActualizacionParcialTorneo>({});
  const [confirmEliminar, setConfirmEliminar] = useState<Torneo | null>(null);

  useEffect(() => {
    loadTorneos();
  }, []);

  const loadTorneos = async (filtrosAplicados?: FiltrosTorneos) => {
    try {
      setLoading(true);
      setError(null);
      const data = await obtenerTodosLosTorneos(filtrosAplicados);
      // Intentar extraer los torneos de diferentes estructuras posibles
      let torneosData: Torneo[] = [];

      if (Array.isArray(data)) {
        torneosData = data;
      } else if (data && typeof data === 'object') {
        // Probar diferentes propiedades comunes
        if (Array.isArray(data.data)) {
          torneosData = data.data;
        } else if (Array.isArray(data.torneos)) {
          torneosData = data.torneos;
        } else if (Array.isArray(data.results)) {
          torneosData = data.results;
        }
      }

      setTorneos(torneosData);
    } catch (err) {
      setError('Error al cargar los torneos');
      setTorneos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAplicarFiltros = () => {
    loadTorneos(filtros);
    setShowFilters(false);
  };

  const handleLimpiarFiltros = () => {
    setFiltros({});
    loadTorneos();
    setShowFilters(false);
  };

  const toggleParticipantes = async (torneoId: number) => {
    if (expandedTorneoId === torneoId) {
      // Si ya está expandido, contraerlo
      setExpandedTorneoId(null);
    } else {
      // Si no está expandido, cargarlo si no está en caché
      if (!participantesCache[torneoId]) {
        try {
          const response = await obtenerTorneoAdmin(torneoId);
          // Extraer participantes de la estructura del backend
          let participantesData: Participante[] = [];

          if (response?.data?.participantes) {
            // Transformar la estructura del backend a la estructura que usamos
            participantesData = response.data.participantes.map(
              (p: ParticipanteBackend, index: number) => ({
                pos: index + 1,
                usuario_id: p.usuario.id,
                usuario: p.usuario.username,
                equipo_id: p.equipo.id,
                nombre_equipo: p.equipo.nombre,
                puntos: p.equipo.puntos,
                es_mi_equipo: false,
                es_admin: p.usuario.rol === 'creador',
              }),
            );
          }

          setParticipantesCache((prev) => ({
            ...prev,
            [torneoId]: participantesData,
          }));
        } catch (err) {
          setError('Error al cargar participantes');
          return;
        }
      }
      setExpandedTorneoId(torneoId);
    }
  };

  const handleVerDetalle = async (torneo: Torneo) => {
    try {
      setLoading(true);
      const response = await obtenerTorneoAdmin(torneo.id);
      // El backend devuelve { data: { info_basica, participantes, responsable, fechas } }
      const rawData = response?.data || response;
      const infoBasica = rawData?.info_basica || rawData;
      const participantesRaw = rawData?.participantes || [];

      const detalle: TorneoDetalleAdmin = {
        id: infoBasica?.id || torneo.id,
        nombre: infoBasica?.nombre || torneo.nombre,
        descripcion: torneo.descripcion,
        estado: infoBasica?.estado || torneo.estado,
        codigo: infoBasica?.codigo_acceso || torneo.codigo_acceso,
        participantes: participantesRaw.map(
          (p: ParticipanteBackend, index: number) => ({
            pos: index + 1,
            usuario_id: p.usuario?.id,
            usuario: p.usuario?.username || 'Desconocido',
            equipo_id: p.equipo?.id,
            nombre_equipo: p.equipo?.nombre || 'Sin equipo',
            puntos: p.equipo?.puntos || 0,
            es_mi_equipo: false,
            es_admin:
              p.usuario?.rol === 'creador' || p.usuario?.rol === 'CREADOR',
          }),
        ),
      };

      setTorneoDetalle(detalle);
      setSelectedTorneo(torneo);
      setModalMode('view');
    } catch (err) {
      setError('Error al cargar detalles del torneo');
    } finally {
      setLoading(false);
    }
  };

  const handleCrearTorneo = async () => {
    try {
      setLoading(true);
      await crearTorneo(formData as CrearTorneoData);
      setSuccess('Torneo creado exitosamente');
      setModalMode(null);
      setFormData({
        nombre: '',
        descripcion: '',
        cupoMaximo: 10,
        nombre_equipo: '',
      });
      loadTorneos();
    } catch (err) {
      setError('Error al crear el torneo');
    } finally {
      setLoading(false);
    }
  };

  const handleEditar = async () => {
    if (!selectedTorneo) return;
    try {
      setLoading(true);
      await actualizarTorneoParcialAdmin(selectedTorneo.id, formDataParcial);
      setSuccess('Torneo actualizado exitosamente');
      setModalMode(null);
      setSelectedTorneo(null);
      setFormDataParcial({});
      loadTorneos();
    } catch (err) {
      setError('Error al actualizar el torneo');
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = (torneo: Torneo) => {
    setConfirmEliminar(torneo);
  };

  const confirmDelete = async () => {
    if (!confirmEliminar) return;
    try {
      setLoading(true);
      await eliminarTorneo(confirmEliminar.id);
      setSuccess('Torneo eliminado exitosamente');
      loadTorneos();
    } catch (err) {
      setError('Error al eliminar el torneo');
    } finally {
      setLoading(false);
      setConfirmEliminar(null);
    }
  };

  const abrirModalCrear = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      cupoMaximo: 10,
      nombre_equipo: '',
    });
    setModalMode('create');
  };

  const abrirModalEditar = (torneo: Torneo) => {
    setSelectedTorneo(torneo);
    setFormDataParcial({});
    setModalMode('edit');
  };

  const cerrarModal = () => {
    setModalMode(null);
    setSelectedTorneo(null);
    setTorneoDetalle(null);
    setFormData({
      nombre: '',
      descripcion: '',
      cupoMaximo: 10,
      nombre_equipo: '',
    });
    setFormDataParcial({});
  };

  const getEstadoBadge = (estado: string) => {
    const colores = {
      EN_ESPERA: 'bg-yellow-500',
      ACTIVO: 'bg-green-500',
      FINALIZADO: 'bg-gray-500',
    };
    return colores[estado as keyof typeof colores] || 'bg-gray-500';
  };

  return (
    <div className="min-h-screen pt-20 pb-10">
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
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin')}
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg backdrop-blur-sm border border-white/30 transition-all"
            >
              ← Volver
            </button>
            <h1 className="text-4xl font-bold text-white drop-shadow-lg">
              Gestión de Torneos
            </h1>
          </div>
          <button
            onClick={abrirModalCrear}
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-bold shadow-lg transition-all"
          >
            + Crear Torneo
          </button>
        </div>

        {/* Mensajes */}
        {error && (
          <div className="bg-red-500/80 backdrop-blur-sm text-white p-4 rounded-lg mb-4 border border-red-300">
            {error}
            <button onClick={() => setError(null)} className="ml-4 font-bold">
              ✕
            </button>
          </div>
        )}
        {success && (
          <div className="bg-green-500/80 backdrop-blur-sm text-white p-4 rounded-lg mb-4 border border-green-300">
            {success}
            <button onClick={() => setSuccess(null)} className="ml-4 font-bold">
              ✕
            </button>
          </div>
        )}

        {/* Botón de filtros */}
        <div className="mb-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-bold shadow-lg transition-all"
          >
            {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
          </button>
        </div>

        {/* Panel de filtros */}
        {showFilters && (
          <div className="bg-white/10 backdrop-blur-lg p-6 rounded-lg border border-white/30 mb-6">
            <h3 className="text-xl font-bold text-white mb-4">Filtros</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-white font-bold block mb-2">
                  Estado
                </label>
                <select
                  value={filtros.estado || ''}
                  onChange={(e) =>
                    setFiltros({
                      ...filtros,
                      estado: (e.target.value || undefined) as
                        | 'EN_ESPERA'
                        | 'ACTIVO'
                        | 'FINALIZADO'
                        | undefined,
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-white/20 text-white border border-white/30"
                >
                  <option value="" className="bg-gray-800 text-white">
                    Todos
                  </option>
                  <option value="EN_ESPERA" className="bg-gray-800 text-white">
                    En Espera
                  </option>
                  <option value="ACTIVO" className="bg-gray-800 text-white">
                    Activo
                  </option>
                  <option value="FINALIZADO" className="bg-gray-800 text-white">
                    Finalizado
                  </option>
                </select>
              </div>
              <div>
                <label className="text-white font-bold block mb-2">
                  Min. Participantes
                </label>
                <input
                  type="number"
                  value={filtros.min_participantes || ''}
                  onChange={(e) =>
                    setFiltros({
                      ...filtros,
                      min_participantes: parseInt(e.target.value) || undefined,
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-white/20 text-white border border-white/30"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-white font-bold block mb-2">
                  Max. Participantes
                </label>
                <input
                  type="number"
                  value={filtros.max_participantes || ''}
                  onChange={(e) =>
                    setFiltros({
                      ...filtros,
                      max_participantes: parseInt(e.target.value) || undefined,
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-white/20 text-white border border-white/30"
                  placeholder="100"
                />
              </div>
              <div>
                <label className="text-white font-bold block mb-2">
                  Límite
                </label>
                <input
                  type="number"
                  value={filtros.limit || ''}
                  onChange={(e) =>
                    setFiltros({
                      ...filtros,
                      limit: parseInt(e.target.value) || undefined,
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-white/20 text-white border border-white/30"
                  placeholder="Sin límite"
                />
              </div>
            </div>
            <div className="flex gap-4 mt-4">
              <button
                onClick={handleAplicarFiltros}
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-bold transition-all"
              >
                Aplicar Filtros
              </button>
              <button
                onClick={handleLimpiarFiltros}
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-bold transition-all"
              >
                Limpiar
              </button>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-10">
            <div className="text-white text-xl">Cargando...</div>
          </div>
        )}

        {/* Tabla de torneos */}
        {!loading && (
          <div className="bg-white/10 backdrop-blur-lg rounded-lg border border-white/30 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-black/30">
                  <tr>
                    <th className="px-6 py-3 text-left text-white font-bold">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-white font-bold">
                      Nombre
                    </th>
                    <th className="px-6 py-3 text-left text-white font-bold">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-white font-bold">
                      Código
                    </th>
                    <th className="px-6 py-3 text-left text-white font-bold">
                      Participantes
                    </th>
                    <th className="px-6 py-3 text-left text-white font-bold">
                      Cupo Máx.
                    </th>
                    <th className="px-6 py-3 text-center text-white font-bold">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {torneos.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-8 text-center text-white text-lg"
                      >
                        No hay torneos disponibles
                      </td>
                    </tr>
                  ) : (
                    torneos.map((torneo) => (
                      <>
                        <tr
                          key={torneo.id}
                          className="border-t border-white/20 hover:bg-white/5"
                        >
                          <td className="px-6 py-4 text-white">{torneo.id}</td>
                          <td className="px-6 py-4 text-white font-bold">
                            {torneo.nombre}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`${getEstadoBadge(
                                torneo.estado,
                              )} text-white px-3 py-1 rounded-full text-sm font-bold`}
                            >
                              {torneo.estado}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-white font-mono">
                            {torneo.codigo_acceso}
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => toggleParticipantes(torneo.id)}
                              className={`
                                group relative
                                bg-gradient-to-r from-blue-500 to-purple-500 
                                hover:from-blue-600 hover:to-purple-600
                                text-white font-bold
                                px-4 py-2 rounded-lg
                                shadow-lg hover:shadow-xl
                                transition-all duration-300
                                flex items-center gap-3
                                ${
                                  expandedTorneoId === torneo.id
                                    ? 'ring-2 ring-white/50'
                                    : ''
                                }
                              `}
                              title="Ver participantes"
                            >
                              <span className="flex items-center gap-2">
                                <span className="text-lg">
                                  {torneo.cant_participantes}
                                </span>
                              </span>
                              <span
                                className={`
                                text-sm transition-transform duration-300
                                ${
                                  expandedTorneoId === torneo.id
                                    ? 'rotate-180'
                                    : 'rotate-0'
                                }
                              `}
                              >
                                ▼
                              </span>
                            </button>
                          </td>
                          <td className="px-6 py-4 text-white">
                            {torneo.cupo_maximo}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2 justify-center">
                              <button
                                onClick={() => handleVerDetalle(torneo)}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm font-bold"
                                title="Ver detalles"
                              >
                                Ver
                              </button>
                              <button
                                onClick={() => abrirModalEditar(torneo)}
                                className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm font-bold"
                                title="Editar torneo"
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => handleEliminar(torneo)}
                                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm font-bold"
                                title="Eliminar"
                              >
                                Eliminar
                              </button>
                            </div>
                          </td>
                        </tr>
                        {expandedTorneoId === torneo.id && (
                          <tr
                            key={`${torneo.id}-participantes`}
                            className="bg-white/5"
                          >
                            <td colSpan={7} className="px-6 py-4">
                              <div className="bg-black/20 rounded-lg p-4">
                                <h4 className="text-white font-bold mb-3 flex items-center gap-2">
                                  <span>Participantes del Torneo</span>
                                </h4>
                                {participantesCache[torneo.id] &&
                                participantesCache[torneo.id].length > 0 ? (
                                  <div className="overflow-x-auto">
                                    <table className="w-full">
                                      <thead className="bg-black/30">
                                        <tr>
                                          <th className="px-4 py-2 text-left text-white text-sm">
                                            Pos
                                          </th>
                                          <th className="px-4 py-2 text-left text-white text-sm">
                                            Usuario
                                          </th>
                                          <th className="px-4 py-2 text-left text-white text-sm">
                                            Equipo
                                          </th>
                                          <th className="px-4 py-2 text-left text-white text-sm">
                                            Puntos
                                          </th>
                                          <th className="px-4 py-2 text-left text-white text-sm">
                                            Rol
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {participantesCache[torneo.id].map(
                                          (p) => (
                                            <tr
                                              key={p.equipo_id}
                                              className="border-t border-white/10"
                                            >
                                              <td className="px-4 py-2 text-white font-bold">
                                                {p.pos}
                                              </td>
                                              <td className="px-4 py-2 text-white">
                                                {p.usuario}
                                              </td>
                                              <td className="px-4 py-2 text-white">
                                                {p.nombre_equipo}
                                              </td>
                                              <td className="px-4 py-2 text-white font-bold">
                                                {p.puntos}
                                              </td>
                                              <td className="px-4 py-2">
                                                {p.es_admin && (
                                                  <span className="bg-purple-500 text-white px-2 py-1 rounded text-xs font-bold">
                                                    Admin
                                                  </span>
                                                )}
                                              </td>
                                            </tr>
                                          ),
                                        )}
                                      </tbody>
                                    </table>
                                  </div>
                                ) : (
                                  <p className="text-white/70 text-center py-4">
                                    No hay participantes en este torneo
                                  </p>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal para Crear Torneo */}
      {modalMode === 'create' && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Crear Nuevo Torneo</h2>
            <div className="space-y-4">
              <div>
                <label className="block font-bold mb-1">Nombre *</label>
                <input
                  type="text"
                  value={formData.nombre || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, nombre: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Liga Fantasy 2024"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Descripción</label>
                <textarea
                  value={formData.descripcion || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, descripcion: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={3}
                  placeholder="Descripción del torneo"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Cupo Máximo *</label>
                <input
                  type="number"
                  value={formData.cupoMaximo || 10}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      cupoMaximo: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                  min="2"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">
                  Nombre de tu Equipo *
                </label>
                <input
                  type="text"
                  value={formData.nombre_equipo || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, nombre_equipo: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Mi Equipo Fantasy"
                />
              </div>
            </div>
            <div className="flex gap-4 mt-6">
              <button
                onClick={handleCrearTorneo}
                disabled={
                  loading || !formData.nombre || !formData.nombre_equipo
                }
                className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-bold disabled:opacity-50"
              >
                Crear
              </button>
              <button
                onClick={cerrarModal}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-bold"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Editar Torneo */}
      {modalMode === 'edit' && selectedTorneo && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Editar Torneo</h2>
            <p className="text-sm text-gray-600 mb-4">
              Solo se actualizarán los campos que modifiques
            </p>
            <div className="space-y-4">
              <div>
                <label className="block font-bold mb-1">Nombre</label>
                <input
                  type="text"
                  value={formDataParcial.nombre || ''}
                  onChange={(e) =>
                    setFormDataParcial({
                      ...formDataParcial,
                      nombre: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder={selectedTorneo.nombre}
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Descripción</label>
                <textarea
                  value={formDataParcial.descripcion || ''}
                  onChange={(e) =>
                    setFormDataParcial({
                      ...formDataParcial,
                      descripcion: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={3}
                  placeholder={selectedTorneo.descripcion || 'Sin descripción'}
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Cupo Máximo</label>
                <input
                  type="number"
                  value={formDataParcial.cupoMaximo || ''}
                  onChange={(e) =>
                    setFormDataParcial({
                      ...formDataParcial,
                      cupoMaximo: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder={selectedTorneo.cupo_maximo.toString()}
                  min="2"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Código de Acceso</label>
                <input
                  type="text"
                  value={formDataParcial.codigo_acceso || ''}
                  onChange={(e) =>
                    setFormDataParcial({
                      ...formDataParcial,
                      codigo_acceso: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder={selectedTorneo.codigo_acceso}
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Estado</label>
                <select
                  value={formDataParcial.estado || ''}
                  onChange={(e) =>
                    setFormDataParcial({
                      ...formDataParcial,
                      estado: (e.target.value || undefined) as
                        | 'EN_ESPERA'
                        | 'ACTIVO'
                        | 'FINALIZADO'
                        | undefined,
                    })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="" className="bg-gray-800 text-white">
                    No cambiar ({selectedTorneo.estado})
                  </option>
                  <option value="EN_ESPERA" className="bg-gray-800 text-white">
                    EN_ESPERA
                  </option>
                  <option value="ACTIVO" className="bg-gray-800 text-white">
                    ACTIVO
                  </option>
                  <option value="FINALIZADO" className="bg-gray-800 text-white">
                    FINALIZADO
                  </option>
                </select>
              </div>
            </div>
            <div className="flex gap-4 mt-6">
              <button
                onClick={handleEditar}
                disabled={loading}
                className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-bold disabled:opacity-50"
              >
                Actualizar
              </button>
              <button
                onClick={cerrarModal}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-bold"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Ver Detalles */}
      {modalMode === 'view' && selectedTorneo && torneoDetalle && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Detalles del Torneo</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-bold text-gray-600">ID:</p>
                  <p>{torneoDetalle.id}</p>
                </div>
                <div>
                  <p className="font-bold text-gray-600">Estado:</p>
                  <span
                    className={`${getEstadoBadge(
                      torneoDetalle.estado,
                    )} text-white px-3 py-1 rounded-full text-sm font-bold`}
                  >
                    {torneoDetalle.estado}
                  </span>
                </div>
                <div>
                  <p className="font-bold text-gray-600">Nombre:</p>
                  <p>{torneoDetalle.nombre}</p>
                </div>
                <div>
                  <p className="font-bold text-gray-600">Código:</p>
                  <p className="font-mono">{torneoDetalle.codigo}</p>
                </div>
                <div>
                  <p className="font-bold text-gray-600">Descripción:</p>
                  <p>{torneoDetalle.descripcion || 'Sin descripción'}</p>
                </div>
                <div>
                  <p className="font-bold text-gray-600">Participantes:</p>
                  <p>{torneoDetalle.participantes?.length || 0}</p>
                </div>
              </div>

              {torneoDetalle.participantes &&
                torneoDetalle.participantes.length > 0 && (
                  <div>
                    <h3 className="font-bold text-lg mt-4 mb-2">
                      Participantes:
                    </h3>
                    <div className="max-h-60 overflow-y-auto border rounded-lg">
                      <table className="w-full">
                        <thead className="bg-gray-100 sticky top-0">
                          <tr>
                            <th className="px-4 py-2 text-left">Pos</th>
                            <th className="px-4 py-2 text-left">Usuario</th>
                            <th className="px-4 py-2 text-left">Equipo</th>
                            <th className="px-4 py-2 text-left">Puntos</th>
                          </tr>
                        </thead>
                        <tbody>
                          {torneoDetalle.participantes.map(
                            (p: Participante) => (
                              <tr key={p.equipo_id} className="border-t">
                                <td className="px-4 py-2">{p.pos}</td>
                                <td className="px-4 py-2">{p.usuario}</td>
                                <td className="px-4 py-2">{p.nombre_equipo}</td>
                                <td className="px-4 py-2 font-bold">
                                  {p.puntos}
                                </td>
                              </tr>
                            ),
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
            </div>
            <div className="flex gap-4 mt-6">
              <button
                onClick={cerrarModal}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-bold"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
      <ConfirmModal
        open={confirmEliminar !== null}
        title="Eliminar torneo"
        message={`¿Estás seguro de eliminar el torneo "${confirmEliminar?.nombre ?? ''}"?`}
        confirmLabel="Eliminar"
        confirmClassName="bg-red-600 hover:bg-red-700"
        onConfirm={confirmDelete}
        onCancel={() => setConfirmEliminar(null)}
      />
    </div>
  );
};

export default GestionTorneosAdmin;
