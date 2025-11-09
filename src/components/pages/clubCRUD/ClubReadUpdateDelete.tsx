import { useEffect, useState } from 'react';
import axios from 'axios';
import { Button_1 } from '../../button';
import CardDefault from '../../CardDefault';

function ClubReadUpdateDelete() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

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

  const [editingClub, setEditingClub] = useState<number | null>(null);
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
      setEditData({
        nombre: club.nombre || '',
        codigo: club.codigo || '',
        logo: club.logo || '',
        pais: club.pais || '',
        fundado: club.fundado ? club.fundado.toString() : '',
        estadio_nombre: club.estadio_nombre || '',
        estadio_ciudad: club.estadio_ciudad || '',
        estadio_capacidad: club.estadio_capacidad ? club.estadio_capacidad.toString() : '',
        estadio_imagen: club.estadio_imagen || '',
      });
    }
  };

  const saveEdit = async (clubId: number) => {
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
        estadio_capacidad: editData.estadio_capacidad ? parseInt(editData.estadio_capacidad) : 0,
        estadio_imagen: editData.estadio_imagen,
      };

      await axios.patch(`http://localhost:3000/api/clubs/${clubId}`, updateData);
      
      setClubs((prevClubs) =>
        prevClubs.map((club) =>
          club.id === clubId ? { ...club, ...updateData } : club
        )
      );
      setMessage({
        type: 'success',
        text: 'Club editado con éxito.',
      });
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
          onClick={getClubs}
          disabled={isLoading}
          size="lg"
          className=" block mx-auto mt-4 mb-8 z-10"
        >
          {isLoading ? 'Cargando...' : 'Recargar Clubes'}
        </Button_1>
      </div>

      <div className="fixed top-16 left-0 right-0 flex justify-center box-border pb-4 bg-gradient-to-t from-green-400 to-blue-500 border-b-4 border-white z-40">
        <h2
          className="static max-lg:5z-50 center w-full text-center align-text-top mt-4 text-3xl font-semibold inner-shadow-lg box-shadow-lg text-white text-shadow-lg"
          style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
        >
          Lista de Clubes
        </h2>
      </div>

      <div
        className="relative z-10 flex flex-wrap justify-center items-start gap-4 p-4"
        style={{ marginTop: '128px' }}
      >
        {clubs && clubs.length > 0 ? (
          clubs.map((club: Club) => (
            <div key={club.id} className="mb-4">
              {editingClub === club.id ? (
                <div className="border-4 border-gray-600 p-4 w-80 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col inner-shadow-lg max-h-96 overflow-y-auto">
                  <h3 className="text-xl font-medium text-black mb-3 text-center">
                    Editar Club
                  </h3>
                  
                  <div className="space-y-3 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-black mb-1">
                        Nombre del Club
                      </label>
                      <input
                        type="text"
                        value={editData.nombre}
                        onChange={(e) => setEditData({...editData, nombre: e.target.value})}
                        className="w-full px-2 py-1 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Nombre del club"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-black mb-1">
                        Código
                      </label>
                      <input
                        type="text"
                        value={editData.codigo}
                        onChange={(e) => setEditData({...editData, codigo: e.target.value})}
                        className="w-full px-2 py-1 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Código del club"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-black mb-1">
                        Logo (URL)
                      </label>
                      <input
                        type="text"
                        value={editData.logo}
                        onChange={(e) => setEditData({...editData, logo: e.target.value})}
                        className="w-full px-2 py-1 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="URL del logo"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-black mb-1">
                        País
                      </label>
                      <input
                        type="text"
                        value={editData.pais}
                        onChange={(e) => setEditData({...editData, pais: e.target.value})}
                        className="w-full px-2 py-1 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="País"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-black mb-1">
                        Año de Fundación
                      </label>
                      <input
                        type="number"
                        value={editData.fundado}
                        onChange={(e) => setEditData({...editData, fundado: e.target.value})}
                        className="w-full px-2 py-1 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Año de fundación"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-black mb-1">
                        Nombre del Estadio
                      </label>
                      <input
                        type="text"
                        value={editData.estadio_nombre}
                        onChange={(e) => setEditData({...editData, estadio_nombre: e.target.value})}
                        className="w-full px-2 py-1 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Nombre del estadio"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-black mb-1">
                        Ciudad del Estadio
                      </label>
                      <input
                        type="text"
                        value={editData.estadio_ciudad}
                        onChange={(e) => setEditData({...editData, estadio_ciudad: e.target.value})}
                        className="w-full px-2 py-1 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Ciudad del estadio"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-black mb-1">
                        Capacidad del Estadio
                      </label>
                      <input
                        type="number"
                        value={editData.estadio_capacidad}
                        onChange={(e) => setEditData({...editData, estadio_capacidad: e.target.value})}
                        className="w-full px-2 py-1 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Capacidad del estadio"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-black mb-1">
                        Imagen del Estadio (URL)
                      </label>
                      <input
                        type="text"
                        value={editData.estadio_imagen}
                        onChange={(e) => setEditData({...editData, estadio_imagen: e.target.value})}
                        className="w-full px-2 py-1 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="URL de la imagen del estadio"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 mt-auto">
                    <Button_1
                      type="button"
                      onClick={() => saveEdit(club.id)}
                      disabled={isLoading || !editData.nombre.trim()}
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
    </div>
  );
}

export default ClubReadUpdateDelete;
