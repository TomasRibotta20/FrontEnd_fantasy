import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../../services/apiClient';
import { Notification } from '../../common/Notification';
import ConfirmModal from '../../common/ConfirmModal';

interface Player {
  id: number;
  apiId: number;
  name: string;
  firstname?: string;
  lastname?: string;
  age: number;
  nationality: string;
  height?: string;
  weight?: string;
  photo: string;
  jerseyNumber: number | null;
  position: number;
  positionName?: string;
  club: number;
  clubName?: string;
}

// Interfaz para los datos del backend (en español)
interface BackendPlayer {
  id: number;
  id_api?: number;
  nombre?: string;
  primer_nombre?: string;
  apellido?: string;
  edad?: number;
  nacionalidad?: string;
  altura?: string;
  peso?: string;
  foto?: string;
  numero_camiseta?: number | null;
  posicion?: { id: number; descripcion?: string } | number;
  club?: { id: number; nombre?: string } | number;
}

interface PaginationMeta {
  totalItems: number;
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
}

interface Position {
  id: number;
  description?: string;
  descripcion?: string;
}

interface Club {
  id: number;
  nombre: string;
}

const PlayersCRUD = () => {
  const navigate = useNavigate();
  const [players, setPlayers] = useState<Player[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'warning' | 'info';
    text: string;
  } | null>(null);

  // Estado para paginación y búsqueda del servidor
  const [pagination, setPagination] = useState<PaginationMeta>({
    totalItems: 0,
    currentPage: 1,
    itemsPerPage: 50,
    totalPages: 0,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedPosition, setSelectedPosition] = useState<string>('');
  const [selectedClub, setSelectedClub] = useState<string>('');
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [formData, setFormData] = useState({
    apiId: 0,
    name: '',
    firstname: '',
    lastname: '',
    age: 0,
    nationality: '',
    height: '',
    weight: '',
    photo: '',
    jerseyNumber: null as number | null,
    position: 0,
    club: 0,
  });

  const [editingId, setEditingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  // Estado para traer precios
  const [isLoadingPrices, setIsLoadingPrices] = useState(false);
  const [confirmPrices, setConfirmPrices] = useState(false);

  // Debounce para la búsqueda
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPagination((prev) => ({ ...prev, currentPage: 1 }));
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  // Cargar jugadores cuando cambian los filtros o la página
  useEffect(() => {
    fetchPlayers();
  }, [debouncedSearch, selectedPosition, selectedClub, pagination.currentPage]);

  useEffect(() => {
    fetchPositions();
    fetchClubs();
  }, []);

  const mapBackendPlayer = useCallback((p: BackendPlayer): Player => {
    const firstName = p.primer_nombre || '';
    const lastName = p.apellido || '';
    let fullName = p.nombre || '';
    if (!fullName && (firstName || lastName)) {
      fullName = `${firstName} ${lastName}`.trim();
    }

    return {
      id: p.id,
      apiId: p.id_api || 0,
      name: fullName,
      firstname: firstName,
      lastname: lastName,
      age: p.edad || 0,
      nationality: p.nacionalidad || '',
      height: p.altura || '',
      weight: p.peso || '',
      photo: p.foto || '',
      jerseyNumber: p.numero_camiseta ?? null,
      position:
        typeof p.posicion === 'object' ? p.posicion?.id : p.posicion || 0,
      positionName:
        typeof p.posicion === 'object' ? p.posicion?.descripcion : undefined,
      club: typeof p.club === 'object' ? p.club?.id : p.club || 0,
      clubName: typeof p.club === 'object' ? p.club?.nombre : undefined,
    };
  }, []);

  const fetchPlayers = async () => {
    try {
      setIsLoading(true);

      // Construir query params para búsqueda del servidor
      const params = new URLSearchParams();
      params.append('page', pagination.currentPage.toString());
      params.append('limit', pagination.itemsPerPage.toString());

      if (debouncedSearch) {
        params.append('nombre', debouncedSearch);
      }
      if (selectedPosition) {
        params.append('posicion', selectedPosition);
      }
      if (selectedClub) {
        params.append('club', selectedClub);
      }

      const response = await apiClient.get(`/api/players?${params.toString()}`);
      const playersData = response.data.data || response.data;
      const meta = response.data.meta;

      // Mapear campos del backend (español) al frontend (inglés)
      const mappedPlayers: Player[] = Array.isArray(playersData)
        ? playersData.map(mapBackendPlayer)
        : [];

      setPlayers(mappedPlayers);

      if (meta) {
        setPagination({
          totalItems: meta.totalItems || 0,
          currentPage: meta.currentPage || 1,
          itemsPerPage: meta.itemsPerPage || 50,
          totalPages: meta.totalPages || 1,
        });
      }
    } catch {
      setNotification({ type: 'error', text: 'Error al cargar jugadores' });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPositions = async () => {
    try {
      const response = await apiClient.get('/api/positions');
      setPositions(response.data.data || response.data);
    } catch {
      // Error al cargar posiciones
    }
  };

  const fetchClubs = async () => {
    try {
      const response = await apiClient.get('/api/clubs');
      setClubs(response.data.data || response.data);
    } catch {
      // Error al cargar clubes
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await apiClient.put(`/api/players/${editingId}`, formData);
        setNotification({
          type: 'success',
          text: 'Jugador actualizado exitosamente',
        });
      } else {
        await apiClient.post('/api/players', formData);
        setNotification({
          type: 'success',
          text: 'Jugador creado exitosamente',
        });
      }
      resetForm();
      fetchPlayers();
    } catch {
      setNotification({ type: 'error', text: 'Error al guardar jugador' });
    }
  };

  const handleEdit = (player: Player) => {
    setFormData({
      apiId: player.apiId,
      name: player.name,
      firstname: player.firstname || '',
      lastname: player.lastname || '',
      age: player.age,
      nationality: player.nationality,
      height: player.height || '',
      weight: player.weight || '',
      photo: player.photo,
      jerseyNumber: player.jerseyNumber,
      position: player.position,
      club: player.club,
    });
    setEditingId(player.id);
  };

  const handleDelete = (id: number) => {
    setConfirmDeleteId(id);
  };

  const confirmDelete = async () => {
    if (confirmDeleteId === null) return;
    try {
      await apiClient.delete(`/api/players/${confirmDeleteId}`);
      setNotification({
        type: 'success',
        text: 'Jugador eliminado exitosamente',
      });
      fetchPlayers();
    } catch {
      setNotification({ type: 'error', text: 'Error al eliminar jugador' });
    } finally {
      setConfirmDeleteId(null);
    }
  };

  const resetForm = () => {
    setFormData({
      apiId: 0,
      name: '',
      firstname: '',
      lastname: '',
      age: 0,
      nationality: '',
      height: '',
      weight: '',
      photo: '',
      jerseyNumber: null,
      position: 0,
      club: 0,
    });
    setEditingId(null);
  };

  // Funciones de paginación
  const goToPage = (page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, currentPage: page }));
    }
  };

  const handleItemsPerPageChange = (newLimit: number) => {
    setPagination((prev) => ({
      ...prev,
      itemsPerPage: newLimit,
      currentPage: 1,
    }));
  };

  // Limpiar filtros
  const clearFilters = () => {
    setSearchTerm('');
    setDebouncedSearch('');
    setSelectedPosition('');
    setSelectedClub('');
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  // Traer precios de jugadores
  const handleTraerPrecios = async () => {
    setConfirmPrices(false);
    setIsLoadingPrices(true);
    try {
      if (selectedClub) {
        // Calcular precios solo del club seleccionado
        const response = await apiClient.post(
          `/api/precios/calcular/${selectedClub}`,
        );
        const data = response.data?.data;
        const guardado = data?.resultado_guardado;
        setNotification({
          type: 'success',
          text: `Precios calculados para ${data?.club?.nombre || 'el club'}. Creados: ${guardado?.precios_creados || 0}, Actualizados: ${guardado?.precios_actualizados || 0}`,
        });
      } else {
        // Calcular precios de TODOS los clubes
        const response = await apiClient.post('/api/precios/calcular-todos');
        const data = response.data?.data;
        setNotification({
          type: 'success',
          text: `Precios calculados para todos los clubes. Exitosos: ${data?.exitosos || 0}, Errores: ${data?.errores || 0}`,
        });
      }
      // Recargar jugadores para ver precios actualizados
      fetchPlayers();
    } catch {
      setNotification({
        type: 'error',
        text: 'Error al calcular precios de jugadores',
      });
    } finally {
      setIsLoadingPrices(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-10">
      <Notification
        message={notification}
        onClose={() => setNotification(null)}
      />

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
        {/* Botón volver */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center gap-2 bg-white/15 hover:bg-white/25 backdrop-blur-lg text-white px-4 py-2 rounded-lg font-bold transition-all border-2 border-white/30 hover:border-white/50 drop-shadow-md"
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
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          <h1 className="text-4xl font-bold text-white text-center">
            Gestión de Jugadores
          </h1>
          <button
            onClick={() => setConfirmPrices(true)}
            disabled={isLoadingPrices}
            className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg font-bold transition-all shadow-lg"
          >
            {isLoadingPrices ? (
              <>
                <svg
                  className="animate-spin h-5 w-5"
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
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  ></path>
                </svg>
                Calculando...
              </>
            ) : (
              <>
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
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {selectedClub
                  ? 'Traer Precios (Club)'
                  : 'Traer Precios (Todos)'}
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulario */}
          <div className="lg:col-span-1">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-4">
                {editingId ? 'Editar Jugador' : 'Nuevo Jugador'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-white text-sm font-bold mb-2">
                    API ID
                  </label>
                  <input
                    type="number"
                    value={formData.apiId}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        apiId: parseInt(e.target.value),
                      })
                    }
                    className="w-full p-2 rounded bg-white/20 text-white border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-white text-sm font-bold mb-2">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full p-2 rounded bg-white/20 text-white border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-white text-sm font-bold mb-2">
                      Nombre
                    </label>
                    <input
                      type="text"
                      value={formData.firstname}
                      onChange={(e) =>
                        setFormData({ ...formData, firstname: e.target.value })
                      }
                      className="w-full p-2 rounded bg-white/20 text-white border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                  <div>
                    <label className="block text-white text-sm font-bold mb-2">
                      Apellido
                    </label>
                    <input
                      type="text"
                      value={formData.lastname}
                      onChange={(e) =>
                        setFormData({ ...formData, lastname: e.target.value })
                      }
                      className="w-full p-2 rounded bg-white/20 text-white border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-white text-sm font-bold mb-2">
                      Edad
                    </label>
                    <input
                      type="number"
                      value={formData.age}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          age: parseInt(e.target.value),
                        })
                      }
                      className="w-full p-2 rounded bg-white/20 text-white border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-white text-sm font-bold mb-2">
                      Dorsal
                    </label>
                    <input
                      type="number"
                      value={formData.jerseyNumber || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          jerseyNumber: e.target.value
                            ? parseInt(e.target.value)
                            : null,
                        })
                      }
                      className="w-full p-2 rounded bg-white/20 text-white border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-white text-sm font-bold mb-2">
                    Nacionalidad
                  </label>
                  <input
                    type="text"
                    value={formData.nationality}
                    onChange={(e) =>
                      setFormData({ ...formData, nationality: e.target.value })
                    }
                    className="w-full p-2 rounded bg-white/20 text-white border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-white text-sm font-bold mb-2">
                      Altura (cm)
                    </label>
                    <input
                      type="text"
                      value={formData.height}
                      onChange={(e) =>
                        setFormData({ ...formData, height: e.target.value })
                      }
                      className="w-full p-2 rounded bg-white/20 text-white border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                  <div>
                    <label className="block text-white text-sm font-bold mb-2">
                      Peso (kg)
                    </label>
                    <input
                      type="text"
                      value={formData.weight}
                      onChange={(e) =>
                        setFormData({ ...formData, weight: e.target.value })
                      }
                      className="w-full p-2 rounded bg-white/20 text-white border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-white text-sm font-bold mb-2">
                    Posición
                  </label>
                  <select
                    value={formData.position}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        position: parseInt(e.target.value),
                      })
                    }
                    className="w-full p-2 rounded bg-white/20 text-white border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    required
                  >
                    <option value={0} className="bg-gray-800">
                      Seleccionar posición
                    </option>
                    {positions.map((pos) => (
                      <option
                        key={pos.id}
                        value={pos.id}
                        className="bg-gray-800"
                      >
                        {pos.description}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-white text-sm font-bold mb-2">
                    Club
                  </label>
                  <select
                    value={formData.club}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        club: parseInt(e.target.value),
                      })
                    }
                    className="w-full p-2 rounded bg-white/20 text-white border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    required
                  >
                    <option value={0} className="bg-gray-800">
                      Seleccionar club
                    </option>
                    {clubs.map((club) => (
                      <option
                        key={club.id}
                        value={club.id}
                        className="bg-gray-800"
                      >
                        {club.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-white text-sm font-bold mb-2">
                    URL Foto
                  </label>
                  <input
                    type="url"
                    value={formData.photo}
                    onChange={(e) =>
                      setFormData({ ...formData, photo: e.target.value })
                    }
                    className="w-full p-2 rounded bg-white/20 text-white border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    required
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white py-2 px-4 rounded-lg font-bold hover:from-blue-600 hover:to-purple-600 transition-all"
                  >
                    {editingId ? 'Actualizar' : 'Crear'}
                  </button>
                  {editingId && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg font-bold hover:bg-gray-600 transition-all"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* Lista */}
          <div className="lg:col-span-2">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
              {/* Header con contador y filtros */}
              <div className="flex flex-col gap-4 mb-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-white">
                    Jugadores ({pagination.totalItems} total)
                  </h2>
                  <div className="flex items-center gap-2">
                    <label className="text-white text-sm">Mostrar:</label>
                    <select
                      value={pagination.itemsPerPage}
                      onChange={(e) =>
                        handleItemsPerPageChange(Number(e.target.value))
                      }
                      className="p-2 rounded bg-white/20 text-white border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      <option value={25} className="bg-gray-800">
                        25
                      </option>
                      <option value={50} className="bg-gray-800">
                        50
                      </option>
                      <option value={100} className="bg-gray-800">
                        100
                      </option>
                      <option value={200} className="bg-gray-800">
                        200
                      </option>
                    </select>
                  </div>
                </div>

                {/* Filtros */}
                <div className="flex flex-wrap gap-3">
                  <input
                    type="text"
                    placeholder="Buscar por nombre..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 min-w-[200px] p-2 rounded bg-white/20 text-white border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-white/60"
                  />
                  <select
                    value={selectedPosition}
                    onChange={(e) => {
                      setSelectedPosition(e.target.value);
                      setPagination((prev) => ({ ...prev, currentPage: 1 }));
                    }}
                    className="p-2 rounded bg-white/20 text-white border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <option value="" className="bg-gray-800">
                      Todas las posiciones
                    </option>
                    {positions.map((pos) => (
                      <option
                        key={pos.id}
                        value={pos.id}
                        className="bg-gray-800"
                      >
                        {pos.descripcion || pos.description}
                      </option>
                    ))}
                  </select>
                  <select
                    value={selectedClub}
                    onChange={(e) => {
                      setSelectedClub(e.target.value);
                      setPagination((prev) => ({ ...prev, currentPage: 1 }));
                    }}
                    className="p-2 rounded bg-white/20 text-white border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <option value="" className="bg-gray-800">
                      Todos los clubes
                    </option>
                    {clubs.map((club) => (
                      <option
                        key={club.id}
                        value={club.id}
                        className="bg-gray-800"
                      >
                        {club.nombre}
                      </option>
                    ))}
                  </select>
                  {(searchTerm || selectedPosition || selectedClub) && (
                    <button
                      onClick={clearFilters}
                      className="px-3 py-2 rounded bg-red-500/50 hover:bg-red-500/70 text-white border border-red-400/50 transition-all"
                    >
                      ✕ Limpiar
                    </button>
                  )}
                </div>
              </div>

              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-400"></div>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                      <table className="w-full text-white">
                        <thead className="bg-white/20 sticky top-0">
                          <tr>
                            <th className="p-3 text-left">Foto</th>
                            <th className="p-3 text-left">Nombre</th>
                            <th className="p-3 text-left">Posición</th>
                            <th className="p-3 text-left">Club</th>
                            <th className="p-3 text-left">Edad</th>
                            <th className="p-3 text-left">Nacionalidad</th>
                            <th className="p-3 text-left">Dorsal</th>
                            <th className="p-3 text-left">Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {players.length === 0 ? (
                            <tr>
                              <td
                                colSpan={8}
                                className="p-8 text-center text-white/60"
                              >
                                No se encontraron jugadores con los filtros
                                actuales
                              </td>
                            </tr>
                          ) : (
                            players.map((player) => (
                              <tr
                                key={player.id}
                                className="border-b border-white/10 hover:bg-white/5"
                              >
                                <td className="p-3">
                                  <img
                                    src={player.photo}
                                    alt={player.name}
                                    className="w-10 h-10 rounded-full object-cover"
                                    loading="lazy"
                                    onError={(e) => {
                                      const target =
                                        e.target as HTMLImageElement;
                                      target.src =
                                        'https://via.placeholder.com/40x40/4F46E5/FFFFFF?text=?';
                                    }}
                                  />
                                </td>
                                <td className="p-3 font-medium">
                                  {player.name || '-'}
                                </td>
                                <td className="p-3">
                                  <span className="px-2 py-1 rounded-full text-xs bg-blue-500/30">
                                    {player.positionName ||
                                      positions.find(
                                        (p) => p.id === player.position,
                                      )?.descripcion ||
                                      player.position}
                                  </span>
                                </td>
                                <td className="p-3">
                                  {player.clubName ||
                                    clubs.find((c) => c.id === player.club)
                                      ?.nombre ||
                                    player.club}
                                </td>
                                <td className="p-3">{player.age}</td>
                                <td className="p-3">
                                  {player.nationality || '-'}
                                </td>
                                <td className="p-3">
                                  {player.jerseyNumber || '-'}
                                </td>
                                <td className="p-3">
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleEdit(player)}
                                      className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm transition-all"
                                    >
                                      Editar
                                    </button>
                                    <button
                                      onClick={() => handleDelete(player.id)}
                                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-all"
                                    >
                                      Eliminar
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Paginación */}
                  {pagination.totalPages > 1 && (
                    <div className="flex flex-wrap justify-center items-center gap-2 mt-4 pt-4 border-t border-white/20">
                      <button
                        onClick={() => goToPage(1)}
                        disabled={pagination.currentPage === 1}
                        className="px-3 py-1 rounded bg-white/20 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/30 transition-all"
                      >
                        ⟨⟨
                      </button>
                      <button
                        onClick={() => goToPage(pagination.currentPage - 1)}
                        disabled={pagination.currentPage === 1}
                        className="px-3 py-1 rounded bg-white/20 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/30 transition-all"
                      >
                        ⟨
                      </button>

                      {/* Números de página */}
                      {Array.from(
                        { length: Math.min(5, pagination.totalPages) },
                        (_, i) => {
                          let pageNum: number;
                          if (pagination.totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (pagination.currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (
                            pagination.currentPage >=
                            pagination.totalPages - 2
                          ) {
                            pageNum = pagination.totalPages - 4 + i;
                          } else {
                            pageNum = pagination.currentPage - 2 + i;
                          }

                          return (
                            <button
                              key={pageNum}
                              onClick={() => goToPage(pageNum)}
                              className={`px-3 py-1 rounded transition-all ${
                                pagination.currentPage === pageNum
                                  ? 'bg-blue-500 text-white font-bold'
                                  : 'bg-white/20 text-white hover:bg-white/30'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        },
                      )}

                      <button
                        onClick={() => goToPage(pagination.currentPage + 1)}
                        disabled={
                          pagination.currentPage === pagination.totalPages
                        }
                        className="px-3 py-1 rounded bg-white/20 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/30 transition-all"
                      >
                        ⟩
                      </button>
                      <button
                        onClick={() => goToPage(pagination.totalPages)}
                        disabled={
                          pagination.currentPage === pagination.totalPages
                        }
                        className="px-3 py-1 rounded bg-white/20 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/30 transition-all"
                      >
                        ⟩⟩
                      </button>

                      <span className="text-white/70 text-sm ml-2">
                        Página {pagination.currentPage} de{' '}
                        {pagination.totalPages}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
            .custom-scrollbar::-webkit-scrollbar {
              width: 8px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
              background: rgba(255, 255, 255, 0.05);
              border-radius: 10px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
              background: linear-gradient(180deg, rgba(59, 130, 246, 0.6) 0%, rgba(147, 51, 234, 0.6) 100%);
              border-radius: 10px;
            }
          `,
        }}
      />
      <ConfirmModal
        open={confirmDeleteId !== null}
        title="Eliminar jugador"
        message="¿Estás seguro de eliminar este jugador?"
        confirmLabel="Eliminar"
        confirmClassName="bg-red-600 hover:bg-red-700"
        onConfirm={confirmDelete}
        onCancel={() => setConfirmDeleteId(null)}
      />
      <ConfirmModal
        open={confirmPrices}
        title="Calcular Precios"
        message={
          selectedClub
            ? `¿Calcular precios con IA para el club "${clubs.find((c) => c.id === Number(selectedClub))?.nombre || selectedClub}"? Esto puede tardar unos segundos.`
            : '¿Calcular precios con IA para TODOS los clubes? Este proceso puede tardar varios minutos.'
        }
        confirmLabel={selectedClub ? 'Calcular Club' : 'Calcular Todos'}
        confirmClassName="bg-green-600 hover:bg-green-700"
        onConfirm={handleTraerPrecios}
        onCancel={() => setConfirmPrices(false)}
      />
    </div>
  );
};

export default PlayersCRUD;
