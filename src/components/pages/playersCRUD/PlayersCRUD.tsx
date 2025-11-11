import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../../services/apiClient';
import { Notification } from '../../common/Notification';

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
  club: number;
}

interface Position {
  id: number;
  description: string;
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
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPlayers();
    fetchPositions();
    fetchClubs();
  }, []);

  const fetchPlayers = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get('/players?limit=100');
      const playersData = response.data.data || response.data;
      setPlayers(playersData);
    } catch (error) {
      console.error('Error al cargar jugadores:', error);
      setNotification({ type: 'error', text: 'Error al cargar jugadores' });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPositions = async () => {
    try {
      const response = await apiClient.get('/positions');
      setPositions(response.data.data || response.data);
    } catch (error) {
      console.error('Error al cargar posiciones:', error);
    }
  };

  const fetchClubs = async () => {
    try {
      const response = await apiClient.get('/clubs');
      setClubs(response.data.data || response.data);
    } catch (error) {
      console.error('Error al cargar clubes:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await apiClient.put(`/players/${editingId}`, formData);
        setNotification({
          type: 'success',
          text: 'Jugador actualizado exitosamente',
        });
      } else {
        await apiClient.post('/players', formData);
        setNotification({
          type: 'success',
          text: 'Jugador creado exitosamente',
        });
      }
      resetForm();
      fetchPlayers();
    } catch (error) {
      console.error('Error al guardar jugador:', error);
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

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estás seguro de eliminar este jugador?')) {
      try {
        await apiClient.delete(`/players/${id}`);
        setNotification({
          type: 'success',
          text: 'Jugador eliminado exitosamente',
        });
        fetchPlayers();
      } catch (error) {
        console.error('Error al eliminar jugador:', error);
        setNotification({ type: 'error', text: 'Error al eliminar jugador' });
      }
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

  const filteredPlayers = players.filter(
    (player) =>
      player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      player.nationality.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

        <h1 className="text-4xl font-bold text-white text-center mb-8">
          Gestión de Jugadores
        </h1>

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
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-white">
                  Lista de Jugadores ({filteredPlayers.length})
                </h2>
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="p-2 rounded bg-white/20 text-white border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-400"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
                    <table className="w-full text-white">
                      <thead className="bg-white/20 sticky top-0">
                        <tr>
                          <th className="p-3 text-left">Foto</th>
                          <th className="p-3 text-left">Nombre</th>
                          <th className="p-3 text-left">Edad</th>
                          <th className="p-3 text-left">Nacionalidad</th>
                          <th className="p-3 text-left">Dorsal</th>
                          <th className="p-3 text-left">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPlayers.map((player) => (
                          <tr
                            key={player.id}
                            className="border-b border-white/10 hover:bg-white/5"
                          >
                            <td className="p-3">
                              <img
                                src={player.photo}
                                alt={player.name}
                                className="w-10 h-10 rounded-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src =
                                    'https://via.placeholder.com/40x40/4F46E5/FFFFFF?text=?';
                                }}
                              />
                            </td>
                            <td className="p-3">{player.name}</td>
                            <td className="p-3">{player.age}</td>
                            <td className="p-3">{player.nationality}</td>
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
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
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
    </div>
  );
};

export default PlayersCRUD;
