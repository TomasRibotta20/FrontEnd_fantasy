import { useEffect, useState } from 'react';
import axios from 'axios';
import { Button_1 } from '../../button';
import CardDefault from '../../CardDefault';

function PositionReadUpdateDelete() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [editingPosition, setEditingPosition] = useState<number | null>(null);
  const [editData, setEditData] = useState({
    descripcion: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

interface Position {
  id: number;
  description: string;
}


  useEffect(() => {
    getPositions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [message]);

  const getPositions = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('http://localhost:3000/api/positions');
      console.log('Datos obtenidos:', response.data);
      setPositions(response.data.data.sort((a: Position, b: Position) => a.description.localeCompare(b.description)));
      setMessage({
        type: 'success',
        text: 'Se han encontrado todas las posiciones',
      });
    } catch (error) {
      console.error('Error al obtener posiciones:', error);
      setMessage({
        type: 'error',
        text: 'Error al obtener posiciones. Inténtalo de nuevo.',
      });
    } finally {
      setIsLoading(false);
    }
  };
  const deletePosition = async (positionId: number) => {
    setIsLoading(true);
    try {
      await axios.delete(`http://localhost:3000/api/positions/${positionId}`);
      setPositions((prevPositions) => prevPositions.filter((position) => position.id !== positionId));
      setMessage({
        type: 'success',
        text: 'Posición eliminada con éxito.',
      });
    } catch (error) {
      console.error('Error al eliminar posición:', error);
      setMessage({
        type: 'error',
        text: 'Error al eliminar posición. Inténtalo de nuevo.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (positionId: number) => {
    const position = positions.find((p) => p.id === positionId);
    if (position) {
      setEditingPosition(positionId);
      setEditData({
        descripcion: position.description || '',
      });
    }
  };

  const saveEdit = async (positionId: number) => {
    setIsLoading(true);

    try {
      const updateData = {
        descripcion: editData.descripcion,
      };

      await axios.patch(
        `http://localhost:3000/api/positions/${positionId}`,
        updateData
      );

      setPositions((prevPositions) =>
        prevPositions.map((position) =>
          position.id === positionId ? { ...position, ...updateData } : position
        )
      );

      await axios.patch(
        `http://localhost:3000/api/positions/${positionId}`,
        updateData
      );

      setPositions((prevPositions) =>
        prevPositions.map((position) =>
          position.id === positionId ? { ...position, ...updateData } : position
        )
      );

      await axios.patch(
        `http://localhost:3000/api/positions/${positionId}`,
        updateData
      );

      setPositions((prevPositions) =>
        prevPositions.map((position) =>
          position.id === positionId ? { ...position, ...updateData } : position
        )
      );
      setMessage({
        type: 'success',
        text: 'Posición editada con éxito.',
      });
      setEditingPosition(null);
      setEditData({
        descripcion: '',
      });
 
    } catch (error) {
      console.error('Error al editar posición:', error);
      setMessage({
        type: 'error',
        text: 'Error al editar posición. Inténtalo de nuevo.',
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
    <div
      style={{
        backgroundImage: `url('/Background_LandingPage.png')`,
        minHeight: '100vh',
        backgroundSize: 'cover',
        backgroundAttachment: 'fixed',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
      className="relative pb-20"
    >
      <div
        style={{
          minHeight: '100%',
          height: '100%',
        }}
        className="absolute inset-0 bg-black opacity-30 z-0"
      ></div>

      <div className="fixed bottom-4 -mb-5 left-1/2 transform -translate-x-1/2 z-50 flex flex-col items-center">
        {message && (
          <div
            className={` z-10 mt-2 px-3 py-1 rounded text-sm text-center self-center box-border bg-yellow-200 ${
              message.type === 'success' ? 'success' : 'error'
            }`}
            style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
          >
            {message.text}
          </div>
        )}
        <Button_1
          onClick={getPositions}
          disabled={isLoading}
          size="lg"
          className=" block mx-auto mt-4 mb-8 z-10"
        >
          {isLoading ? 'Cargando...' : 'Recargar Posiciones'}
        </Button_1>
      </div>

      <div className="fixed top-16 left-0 right-0 flex justify-center box-border pb-4 bg-gradient-to-t from-green-400 to-blue-500 border-b-4 border-white z-40">
        <h2
          className="static max-lg:5z-50 center w-full text-center align-text-top mt-4 text-3xl font-semibold inner-shadow-lg box-shadow-lg text-white text-shadow-lg"
          style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
        >
          Lista de Posiciones
        </h2>
      </div>

      <div
        className="relative z-10 flex flex-wrap justify-center items-start gap-4 p-4"
        style={{ marginTop: '128px' }}
      >
        {positions && positions.length > 0 ? (
          positions.map((position: Position) => (
            <div key={position.id} className="mb-4">
              {editingPosition === position.id ? (
                <div className="border-4 border-gray-600 p-4 w-80 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col inner-shadow-lg max-h-96 overflow-y-auto">
                  <h3 className="text-xl font-medium text-black mb-3 text-center">
                    Editar Posición
                  </h3>

                  <div className="space-y-3 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-black mb-1">
                        Descripción de la Posición
                      </label>
                      <input
                        type="text"
                        value={editData.descripcion}
                        onChange={(e) =>
                          setEditData({ ...editData, descripcion: e.target.value })
                        }
                        className="w-full px-2 py-1 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Descripción de la posición"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => saveEdit(position.id)}
                      disabled={isLoading}
                      className="flex-1 px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50"
                    >
                      Guardar
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="flex-1 px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <CardDefault
                  position={position}
                  onEdit={() => handleEdit(position.id)}
                  onDelete={() => deletePosition(position.id)}
                />
              )}
            </div>
          ))
        ) : (
          <div>
            <p className="text-black text-xl w-full z-10 mt-1 -mb-5 px-3 py-1 rounded text-center self-center box-border bg-yellow-200">
              No hay posiciones disponibles.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default PositionReadUpdateDelete;
