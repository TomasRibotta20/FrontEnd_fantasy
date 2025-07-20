import { useEffect, useState } from 'react';
import axios from 'axios';
import { Button_1 } from '../../components/button';
import CardDefault from '../../components/CardDefault';


function ClubReadUpdateDelete() {

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  interface Club {
    id: number;
    name: string;
    // add other properties as needed
  }
  const [editingClub, setEditingClub] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  interface Club {
    id: number;
    name: string;
  }

  const [clubs, setClubs] = useState<Club[]>([]);

  useEffect(() => {
    getClubs();
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

  const getClubs = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('http://localhost:3000/api/clubs');
      console.log('Datos obtenidos:', response.data);
      setClubs(response.data.data.sort((a: Club, b: Club) => a.id - b.id));
      setMessage({
        type: 'success',
        text: 'Se han encontrado todos los clubes',
      });
    } catch (error) {
      console.error('Error al obtener clubes:', error);
      setMessage({
        type: 'error',
        text: 'Error al obtener clubes. Inténtalo de nuevo.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteClub = async (clubId: number) => {
    setIsLoading(true);
    try {
      await axios.delete(`http://localhost:3000/api/clubs/${clubId}`);
      setClubs((prevClubs) => prevClubs.filter((club) => club.id !== clubId));
      setMessage({
        type: 'success',
        text: 'Club eliminado con éxito.',
      });
    } catch (error) {
      console.error('Error al eliminar club:', error);
      setMessage({
        type: 'error',
        text: 'Error al eliminar club. Inténtalo de nuevo.',
      });
    } finally {
      setIsLoading(false);
    }
  };

    const handleEdit = (clubId: number) => {
      const club = clubs.find((c) => c.id === clubId);
      if (club) {
        setEditingClub(clubId);
        setEditName(club.name);
      }
    };

  const saveEdit = async (clubId: number) => {
    setIsLoading(true);

    try {
      await axios.patch(`http://localhost:3000/api/clubs/${clubId}`, {
        name: editName,
      });
      setClubs((prevClubs) =>
        prevClubs.map((club) =>
          club.id === clubId ? { ...club, name: editName } : club
        )
      );
      setMessage({
        type: 'success',
        text: 'Club editado con éxito.',
      });
      setEditingClub(null);
      setEditName('');

    } catch (error) {
      console.error('Error al editar club:', error);
      setMessage({
        type: 'error',
        text: 'Error al editar club. Inténtalo de nuevo.',
      });
    } finally {
      setIsLoading(false);
    }
  };

    const cancelEdit = () => {
      setEditingClub(null);
      setEditName('');
    };

  return (
    <div
      style={{
        backgroundImage: `url('/Background_LandingPage.png')`,
        height: 'calc(100vh - 64px)',
        backgroundSize: 'cover',
      }}
      className="relative"
    >
      <div className="absolute inset-0 bg-black opacity-30 z-0"></div>

      <div className="relative flex z-10 justify-center box-border pb-4 bg-gradient-to-t from-green-400 to-blue-500 border-b-4 border-white">
        <h2
          className="static max-lg:5z-50 center w-full text-center align-text-top mt-4 text-3xl font-semibold inner-shadow-lg box-shadow-lg text-white text-shadow-lg"
          style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
        >
          Lista de Clubes
        </h2>
      </div>

      <div className="relative z-50 flex flex-wrap justify-center items-start gap-4 p-4 mt-4">
        {clubs && clubs.length > 0 ? (
          clubs.map((club: Club) => (
            <div key={club.id} className="mb-4">
              {editingClub === club.id ? (
                <div className="border-4 border-gray-600 p-4 w-70 h-40 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col justify-between inner-shadow-lg">
                  <div className="mb-3">
                    <label className="block text-xl font-medium text-black mb-1 text-center">
                      Nombre del Club
                    </label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-2 py-1 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Nombre del club"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button_1
                      type="button"
                      onClick={() => saveEdit(club.id)}
                      disabled={isLoading || !editName.trim()}
                      size="sm"
                      className="w-25 h-10 flex items-center justify-center"
                    >
                      Guardar
                    </Button_1>
                    <Button_1
                      type="button"
                      onClick={cancelEdit}
                      size="sm"
                      variant="danger"
                      className="ml-8 w-25 h-10 flex items-center justify-center"
                    >
                      Cancelar
                    </Button_1>
                  </div>
                </div>
              ) : (
                <CardDefault
                  club={club}
                  onEdit={() => handleEdit(club.id)}
                  onDelete={() => deleteClub(club.id)}
                  className="mb-4"
                />
              )}
            </div>
          ))
        ) : (
          <div>
            <p className="text-black text-xl w-full z-10 mt-1 -mb-5 px-3 py-1 rounded text-center self-center box-border bg-yellow-200">
              No hay clubes disponibles.
            </p>
          </div>
        )}
      </div>

      <div className="fixed bottom-4 mb-5 left-1/2 transform -translate-x-1/2 z-10 flex flex-col items-center">
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
          onClick={getClubs}
          disabled={isLoading}
          size="lg"
          className="center text-center align-text-top mt-4 w-auto self-center"
        >
          {isLoading ? 'Cargando...' : 'Recargar Clubes'}
        </Button_1>
      </div>
    </div>
  );
}

export default ClubReadUpdateDelete;
