import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Notification } from '../../common/Notification';

interface Position {
  id: number;
  description: string;
}

function CrudPositions() {
  const navigate = useNavigate();
  const [positions, setPositions] = useState<Position[]>([]);
  const [filteredPositions, setFilteredPositions] = useState<Position[]>([]);
  const [editingPosition, setEditingPosition] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'warning' | 'info';
    text: string;
  } | null>(null);

  const [editData, setEditData] = useState({
    descripcion: '',
  });

  useEffect(() => {
    getPositions();
  }, []);

  useEffect(() => {
    const filtered = positions.filter((position) =>
      position.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredPositions(filtered);
  }, [searchTerm, positions]);

  const getPositions = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('http://localhost:3000/api/positions');
      const sortedPositions = response.data.data.sort(
        (a: Position, b: Position) => a.description.localeCompare(b.description)
      );
      setPositions(sortedPositions);
      setFilteredPositions(sortedPositions);
      setNotification({
        type: 'success',
        text: 'Posiciones cargadas exitosamente',
      });
    } catch (error) {
      console.error('Error al obtener posiciones:', error);
      setNotification({
        type: 'error',
        text: 'Error al obtener posiciones',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deletePosition = async (positionId: number) => {
    if (window.confirm('¿Estás seguro de eliminar esta posición?')) {
      setIsLoading(true);
      try {
        await axios.delete(`http://localhost:3000/api/positions/${positionId}`);
        setPositions((prevPositions) =>
          prevPositions.filter((position) => position.id !== positionId)
        );
        setNotification({
          type: 'success',
          text: 'Posición eliminada con éxito',
        });
      } catch (error) {
        console.error('Error al eliminar posición:', error);
        setNotification({
          type: 'error',
          text: 'Error al eliminar posición',
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleEdit = (position: Position) => {
    setEditingPosition(position.id);
    setEditData({
      descripcion: position.description || '',
    });
  };

  const saveEdit = async () => {
    if (!editingPosition) return;

    setIsLoading(true);
    try {
      const updateData = {
        descripcion: editData.descripcion,
      };

      await axios.patch(
        `http://localhost:3000/api/positions/${editingPosition}`,
        updateData
      );

      setPositions((prevPositions) =>
        prevPositions.map((position) =>
          position.id === editingPosition
            ? { ...position, description: updateData.descripcion }
            : position
        )
      );

      setNotification({
        type: 'success',
        text: 'Posición actualizada exitosamente',
      });
      cancelEdit();
    } catch (error) {
      console.error('Error al editar posición:', error);
      setNotification({
        type: 'error',
        text: 'Error al editar posición',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const cancelEdit = () => {
    setEditingPosition(null);
    setEditData({
      descripcion: '',
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
        <div className="max-w-4xl mx-auto mb-6">
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
            Gestión de Posiciones
          </h1>
          <p className="text-white text-lg drop-shadow">
            Administra las posiciones de juego
          </p>
        </div>

        {/* Controles superiores */}
        <div className="max-w-4xl mx-auto mb-6">
          <div className="bg-white/15 backdrop-blur-lg rounded-xl p-5 border-2 border-white/30 shadow-xl">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="flex-1 w-full">
                <input
                  type="text"
                  placeholder="Buscar posición..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-5 py-3 rounded-lg bg-white/20 border-2 border-white/30 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 font-medium shadow-inner"
                />
              </div>
              <button
                onClick={getPositions}
                disabled={isLoading}
                className="bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 px-8 rounded-lg font-bold hover:from-blue-600 hover:to-purple-600 transition-colors duration-300 shadow-xl border-2 border-white/30 disabled:opacity-50"
              >
                {isLoading ? 'Cargando...' : 'Recargar'}
              </button>
            </div>
          </div>
        </div>

        {/* Lista de posiciones */}
        <div className="max-w-4xl mx-auto">
          {isLoading && editingPosition === null ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-400 drop-shadow-lg"></div>
            </div>
          ) : filteredPositions.length === 0 ? (
            <div className="flex flex-col justify-center items-center h-64 text-center">
              <p className="text-white text-xl font-bold mb-2 drop-shadow-lg">
                {searchTerm
                  ? 'No se encontraron posiciones'
                  : 'No hay posiciones disponibles'}
              </p>
              <p className="text-white/80 text-sm drop-shadow">
                {searchTerm
                  ? 'Intenta con otro término de búsqueda'
                  : 'Carga las posiciones desde la API'}
              </p>
            </div>
          ) : (
            <div className="bg-white/15 backdrop-blur-lg rounded-xl border-2 border-white/30 overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-white">
                  <thead className="bg-white/20 border-b-2 border-white/30">
                    <tr>
                      <th className="p-5 text-left font-bold drop-shadow text-base">
                        ID
                      </th>
                      <th className="p-5 text-left font-bold drop-shadow text-base">
                        Descripción
                      </th>
                      <th className="p-5 text-center font-bold drop-shadow text-base">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPositions.map((position) => (
                      <tr
                        key={position.id}
                        className="border-b border-white/20 hover:bg-white/10 transition-colors"
                      >
                        {editingPosition === position.id ? (
                          <>
                            <td className="p-5 font-bold drop-shadow">
                              {position.id}
                            </td>
                            <td className="p-5">
                              <input
                                type="text"
                                value={editData.descripcion}
                                onChange={(e) =>
                                  setEditData({
                                    ...editData,
                                    descripcion: e.target.value,
                                  })
                                }
                                className="w-full px-4 py-2 rounded-lg bg-white/20 border-2 border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-blue-400 font-medium"
                                placeholder="Descripción de la posición"
                              />
                            </td>
                            <td className="p-5">
                              <div className="flex gap-2 justify-center">
                                <button
                                  onClick={saveEdit}
                                  disabled={isLoading}
                                  className="bg-green-500/80 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-bold transition-colors duration-300 shadow-lg border-2 border-green-400/50"
                                >
                                  Guardar
                                </button>
                                <button
                                  onClick={cancelEdit}
                                  className="bg-gray-500/80 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-bold transition-colors duration-300 shadow-lg border-2 border-gray-400/50"
                                >
                                  Cancelar
                                </button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="p-5">
                              <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white font-bold shadow-lg">
                                {position.id}
                              </span>
                            </td>
                            <td className="p-5">
                              <span className="text-lg font-bold drop-shadow">
                                {position.description}
                              </span>
                            </td>
                            <td className="p-5">
                              <div className="flex gap-2 justify-center">
                                <button
                                  onClick={() => handleEdit(position)}
                                  className="bg-yellow-500/80 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-bold transition-colors duration-300 shadow-lg border-2 border-yellow-400/50"
                                >
                                  Editar
                                </button>
                                <button
                                  onClick={() => deletePosition(position.id)}
                                  className="bg-red-500/80 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-bold transition-colors duration-300 shadow-lg border-2 border-red-400/50"
                                >
                                  Eliminar
                                </button>
                              </div>
                            </td>
                          </>
                        )}
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
  );
}

export default CrudPositions;
