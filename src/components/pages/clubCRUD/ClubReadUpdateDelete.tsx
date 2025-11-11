import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Notification } from '../../common/Notification';

interface Club {
  id: number;
  id_api: number;
  codigo: string;
  nombre: string;
  logo: string;
  pais: string;
  fundado: number;
  estadio_nombre: string;
  estadio_ciudad: string;
  estadio_capacidad: number;
  estadio_imagen: string;
}

function ClubReadUpdateDelete() {
  const navigate = useNavigate();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [filteredClubs, setFilteredClubs] = useState<Club[]>([]);
  const [editingClub, setEditingClub] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'warning' | 'info';
    text: string;
  } | null>(null);

  const [editData, setEditData] = useState({
    nombre: '',
    codigo: '',
    logo: '',
    pais: '',
    fundado: '',
    estadio_nombre: '',
    estadio_ciudad: '',
    estadio_capacidad: '',
    estadio_imagen: '',
  });

  useEffect(() => {
    getClubs();
  }, []);

  useEffect(() => {
    const filtered = clubs.filter(
      (club) =>
        (club.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (club.codigo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (club.pais || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredClubs(filtered);
  }, [searchTerm, clubs]);

  const getClubs = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('http://localhost:3000/api/clubs');
      const sortedClubs = response.data.data.sort((a: Club, b: Club) =>
        a.nombre.localeCompare(b.nombre)
      );
      setClubs(sortedClubs);
      setFilteredClubs(sortedClubs);
      setNotification({
        type: 'success',
        text: 'Clubes cargados exitosamente',
      });
    } catch (error) {
      console.error('Error al obtener clubes:', error);
      setNotification({
        type: 'error',
        text: 'Error al obtener clubes',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteClub = async (clubId: number) => {
    if (window.confirm('¿Estás seguro de eliminar este club?')) {
      setIsLoading(true);
      try {
        await axios.delete(`http://localhost:3000/api/clubs/${clubId}`);
        setClubs((prevClubs) => prevClubs.filter((club) => club.id !== clubId));
        setNotification({
          type: 'success',
          text: 'Club eliminado con éxito',
        });
      } catch (error) {
        console.error('Error al eliminar club:', error);
        setNotification({
          type: 'error',
          text: 'Error al eliminar club',
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleEdit = (club: Club) => {
    setEditingClub(club.id);
    setEditData({
      nombre: club.nombre || '',
      codigo: club.codigo || '',
      logo: club.logo || '',
      pais: club.pais || '',
      fundado: club.fundado ? club.fundado.toString() : '',
      estadio_nombre: club.estadio_nombre || '',
      estadio_ciudad: club.estadio_ciudad || '',
      estadio_capacidad: club.estadio_capacidad
        ? club.estadio_capacidad.toString()
        : '',
      estadio_imagen: club.estadio_imagen || '',
    });
  };

  const saveEdit = async () => {
    if (!editingClub) return;

    setIsLoading(true);
    try {
      const updateData = {
        nombre: editData.nombre,
        codigo: editData.codigo,
        logo: editData.logo,
        pais: editData.pais,
        fundado: editData.fundado ? parseInt(editData.fundado) : 0,
        estadio_nombre: editData.estadio_nombre,
        estadio_ciudad: editData.estadio_ciudad,
        estadio_capacidad: editData.estadio_capacidad
          ? parseInt(editData.estadio_capacidad)
          : 0,
        estadio_imagen: editData.estadio_imagen,
      };

      await axios.patch(
        `http://localhost:3000/api/clubs/${editingClub}`,
        updateData
      );

      setClubs((prevClubs) =>
        prevClubs.map((club) =>
          club.id === editingClub ? { ...club, ...updateData } : club
        )
      );

      setNotification({
        type: 'success',
        text: 'Club actualizado exitosamente',
      });
      cancelEdit();
    } catch (error) {
      console.error('Error al editar club:', error);
      setNotification({
        type: 'error',
        text: 'Error al editar club',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const cancelEdit = () => {
    setEditingClub(null);
    setEditData({
      nombre: '',
      codigo: '',
      logo: '',
      pais: '',
      fundado: '',
      estadio_nombre: '',
      estadio_ciudad: '',
      estadio_capacidad: '',
      estadio_imagen: '',
    });
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
        <div className="max-w-7xl mx-auto mb-6">
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

        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-2 drop-shadow-lg">
            Gestión de Clubes
          </h1>
          <p className="text-white text-lg drop-shadow">
            Administra todos los clubes de fútbol
          </p>
        </div>

        {/* Controles superiores */}
        <div className="max-w-7xl mx-auto mb-6">
          <div className="bg-white/15 backdrop-blur-lg rounded-xl p-5 border-2 border-white/30 shadow-xl">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="flex-1 w-full">
                <input
                  type="text"
                  placeholder="Buscar por nombre, código o país..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-5 py-3 rounded-lg bg-white/20 border-2 border-white/30 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 font-medium shadow-inner"
                />
              </div>
              <button
                onClick={getClubs}
                disabled={isLoading}
                className="bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 px-8 rounded-lg font-bold hover:from-blue-600 hover:to-purple-600 transition-colors duration-300 shadow-xl border-2 border-white/30 disabled:opacity-50"
              >
                {isLoading ? 'Cargando...' : 'Recargar'}
              </button>
            </div>
          </div>
        </div>

        {/* Grid de clubes */}
        <div className="max-w-7xl mx-auto">
          {isLoading && editingClub === null ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-400 drop-shadow-lg"></div>
            </div>
          ) : filteredClubs.length === 0 ? (
            <div className="flex flex-col justify-center items-center h-64 text-center">
              <p className="text-white text-xl font-bold mb-2 drop-shadow-lg">
                {searchTerm
                  ? 'No se encontraron clubes'
                  : 'No hay clubes disponibles'}
              </p>
              <p className="text-white/80 text-sm drop-shadow">
                {searchTerm
                  ? 'Intenta con otro término de búsqueda'
                  : 'Carga los clubes desde la API'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredClubs.map((club) => (
                <div key={club.id} className="group">
                  {editingClub === club.id ? (
                    <div className="bg-white/15 backdrop-blur-lg rounded-xl p-6 border-2 border-white/30 shadow-2xl">
                      <h3 className="text-xl font-bold text-white mb-4 drop-shadow-lg text-center">
                        Editar Club
                      </h3>

                      <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar pr-2">
                        <div>
                          <label className="block text-white text-sm font-bold mb-1 drop-shadow">
                            Nombre
                          </label>
                          <input
                            type="text"
                            value={editData.nombre}
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                nombre: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 rounded-lg bg-white/20 border-2 border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-blue-400 font-medium"
                          />
                        </div>

                        <div>
                          <label className="block text-white text-sm font-bold mb-1 drop-shadow">
                            Código
                          </label>
                          <input
                            type="text"
                            value={editData.codigo}
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                codigo: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 rounded-lg bg-white/20 border-2 border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-blue-400 font-medium"
                          />
                        </div>

                        <div>
                          <label className="block text-white text-sm font-bold mb-1 drop-shadow">
                            País
                          </label>
                          <input
                            type="text"
                            value={editData.pais}
                            onChange={(e) =>
                              setEditData({ ...editData, pais: e.target.value })
                            }
                            className="w-full px-3 py-2 rounded-lg bg-white/20 border-2 border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-blue-400 font-medium"
                          />
                        </div>

                        <div>
                          <label className="block text-white text-sm font-bold mb-1 drop-shadow">
                            Año Fundación
                          </label>
                          <input
                            type="number"
                            value={editData.fundado}
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                fundado: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 rounded-lg bg-white/20 border-2 border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-blue-400 font-medium"
                          />
                        </div>

                        <div>
                          <label className="block text-white text-sm font-bold mb-1 drop-shadow">
                            Estadio
                          </label>
                          <input
                            type="text"
                            value={editData.estadio_nombre}
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                estadio_nombre: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 rounded-lg bg-white/20 border-2 border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-blue-400 font-medium"
                          />
                        </div>

                        <div>
                          <label className="block text-white text-sm font-bold mb-1 drop-shadow">
                            Ciudad Estadio
                          </label>
                          <input
                            type="text"
                            value={editData.estadio_ciudad}
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                estadio_ciudad: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 rounded-lg bg-white/20 border-2 border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-blue-400 font-medium"
                          />
                        </div>

                        <div>
                          <label className="block text-white text-sm font-bold mb-1 drop-shadow">
                            Capacidad
                          </label>
                          <input
                            type="number"
                            value={editData.estadio_capacidad}
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                estadio_capacidad: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 rounded-lg bg-white/20 border-2 border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-blue-400 font-medium"
                          />
                        </div>
                      </div>

                      <div className="flex gap-3 mt-4">
                        <button
                          onClick={saveEdit}
                          disabled={isLoading}
                          className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white py-2 px-4 rounded-lg font-bold hover:from-green-600 hover:to-emerald-600 transition-colors duration-300 shadow-xl border-2 border-white/30"
                        >
                          Guardar
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="flex-1 bg-gray-500/80 text-white py-2 px-4 rounded-lg font-bold hover:bg-gray-600 transition-colors duration-300 shadow-xl border-2 border-white/30"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white/15 backdrop-blur-lg rounded-xl p-6 border-2 border-white/30 hover:border-white/60 transition-all duration-300 shadow-xl hover:shadow-2xl h-full flex flex-col">
                      <div className="flex items-start gap-4 mb-4">
                        <img
                          src={club.logo}
                          alt={club.nombre}
                          className="w-16 h-16 object-contain rounded-lg bg-white/10 p-2 shadow-lg"
                          onError={(e) => {
                            e.currentTarget.src =
                              'https://via.placeholder.com/64x64/3B82F6/FFFFFF?text=⚽';
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xl font-bold text-white mb-1 drop-shadow-lg truncate">
                            {club.nombre}
                          </h3>
                          <p className="text-white/80 text-sm font-semibold drop-shadow">
                            {club.codigo} • {club.pais}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2 mb-4 flex-1">
                        <div className="bg-white/10 rounded-lg p-3">
                          <p className="text-white/70 text-xs font-semibold mb-1">
                            Fundado
                          </p>
                          <p className="text-white font-bold drop-shadow">
                            {club.fundado}
                          </p>
                        </div>
                        <div className="bg-white/10 rounded-lg p-3">
                          <p className="text-white/70 text-xs font-semibold mb-1">
                            Estadio
                          </p>
                          <p className="text-white font-bold drop-shadow truncate">
                            {club.estadio_nombre}
                          </p>
                          <p className="text-white/80 text-sm drop-shadow truncate">
                            {club.estadio_ciudad} •{' '}
                            {club.estadio_capacidad.toLocaleString()} personas
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(club)}
                          className="flex-1 bg-yellow-500/80 hover:bg-yellow-600 text-white py-2 px-4 rounded-lg font-bold transition-colors duration-300 shadow-lg border-2 border-yellow-400/50"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => deleteClub(club.id)}
                          className="flex-1 bg-red-500/80 hover:bg-red-600 text-white py-2 px-4 rounded-lg font-bold transition-colors duration-300 shadow-lg border-2 border-red-400/50"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
            .custom-scrollbar::-webkit-scrollbar {
              width: 6px;
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
}

export default ClubReadUpdateDelete;
