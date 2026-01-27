import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { obtenerMisTorneos } from '../../../services/torneosService';
import type { TorneoListItem } from '../../../services/torneosService';
import { useAuth } from '../../../hooks/useAuth';

function TorneosUsuario() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [torneos, setTorneos] = useState<TorneoListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState<string>('');
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const cargarTorneos = async (estado?: string) => {
    try {
      setIsLoading(true);
      const response = await obtenerMisTorneos(estado);
      setTorneos(response.data || []);
    } catch (error) {
      console.error('Error al cargar torneos:', error);
      setMessage({
        type: 'error',
        text: 'Error al cargar los torneos',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    cargarTorneos(filtroEstado);
  }, [filtroEstado]);

  const handleFiltroChange = (estado: string) => {
    setFiltroEstado(estado);
  };

  const getEstadoBadge = (estado: string) => {
    const badges = {
      EN_ESPERA: 'bg-yellow-500 text-white',
      ACTIVO: 'bg-green-500 text-white',
      FINALIZADO: 'bg-gray-500 text-white',
    };
    return badges[estado as keyof typeof badges] || 'bg-gray-400 text-white';
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundImage: `url('/Background_LandingPage.png')`,
        backgroundSize: 'cover',
        backgroundAttachment: 'fixed',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
      className="relative z-0"
    >
      <div className="absolute inset-0 bg-black opacity-40 z-10"></div>

      <div className="relative z-20 container mx-auto px-4 py-8 pt-32">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-lg">
            Mis Torneos
          </h1>
          <p className="text-xl text-white/90 drop-shadow-md">
            Bienvenido, {user?.username}
          </p>
        </div>

        {/* Mensajes */}
        {message && (
          <div
            className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-50 p-4 rounded-2xl shadow-2xl backdrop-blur-lg border-2 ${
              message.type === 'success'
                ? 'bg-green-500/90 border-green-400/50'
                : 'bg-red-500/90 border-red-400/50'
            } text-white font-bold min-w-[300px] text-center drop-shadow-xl`}
          >
            {message.text}
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => navigate('/torneos/crear')}
            className="bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-3 rounded-xl font-bold text-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Crear Torneo
          </button>
          <button
            onClick={() => navigate('/torneos/unirse')}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-3 rounded-xl font-bold text-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Unirse a Torneo
          </button>
        </div>

        {/* Filtros */}
        <div className="flex justify-center gap-3 mb-8">
          <button
            onClick={() => handleFiltroChange('')}
            className={`px-6 py-2 rounded-lg font-semibold transition-all duration-200 ${
              filtroEstado === ''
                ? 'bg-white text-gray-800 shadow-lg'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => handleFiltroChange('EN_ESPERA')}
            className={`px-6 py-2 rounded-lg font-semibold transition-all duration-200 ${
              filtroEstado === 'EN_ESPERA'
                ? 'bg-yellow-500 text-white shadow-lg'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            En Espera
          </button>
          <button
            onClick={() => handleFiltroChange('ACTIVO')}
            className={`px-6 py-2 rounded-lg font-semibold transition-all duration-200 ${
              filtroEstado === 'ACTIVO'
                ? 'bg-green-500 text-white shadow-lg'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            Activos
          </button>
          <button
            onClick={() => handleFiltroChange('FINALIZADO')}
            className={`px-6 py-2 rounded-lg font-semibold transition-all duration-200 ${
              filtroEstado === 'FINALIZADO'
                ? 'bg-gray-500 text-white shadow-lg'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            Finalizados
          </button>
        </div>

        {/* Lista de torneos */}
        {isLoading ? (
          <div className="text-center text-white text-2xl py-20">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-white"></div>
            <p className="mt-4">Cargando torneos...</p>
          </div>
        ) : torneos.length === 0 ? (
          <div className="backdrop-blur-lg bg-white/10 rounded-2xl border-2 border-white/40 p-12 text-center shadow-2xl">
            <p className="text-2xl text-white mb-4">
              No tienes torneos{' '}
              {filtroEstado ? `en estado ${filtroEstado}` : ''}
            </p>
            <p className="text-white/80 mb-6">
              Crea un nuevo torneo o únete a uno existente para comenzar
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => navigate('/torneos/crear')}
                className="bg-green-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-600 transition-colors"
              >
                Crear Torneo
              </button>
              <button
                onClick={() => navigate('/torneos/unirse')}
                className="bg-blue-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
              >
                Unirse a Torneo
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {torneos.map((torneo) => (
              <div
                key={torneo.torneo_id}
                className="backdrop-blur-lg bg-white/10 rounded-2xl border-2 border-white/40 p-6 shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 cursor-pointer"
                onClick={() => navigate(`/torneos/${torneo.torneo_id}`)}
              >
                {/* Estado Badge */}
                <div className="flex justify-between items-start mb-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${getEstadoBadge(
                      torneo.estado
                    )}`}
                  >
                    {torneo.estado.replace('_', ' ')}
                  </span>
                  {torneo.mi_rol === 'creador' && (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500 text-white">
                      CREADOR
                    </span>
                  )}
                </div>

                {/* Nombre del torneo */}
                <h3 className="text-2xl font-bold text-white mb-2">
                  {torneo.nombre}
                </h3>

                {/* Participantes */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-white font-semibold">
                    Participantes: {torneo.cant_participantes} /{' '}
                    {torneo.cupo_maximo}
                  </span>
                </div>

                {/* Información del equipo */}
                {torneo.mi_equipo && (
                  <div className="bg-green-500/20 p-3 rounded-lg mb-3 border-2 border-green-400/30">
                    <p className="text-xs text-white/70 mb-1">Tu equipo:</p>
                    <p className="text-lg font-bold text-white">
                      {torneo.mi_equipo.nombre}
                    </p>
                    <div className="flex justify-between mt-2 text-sm">
                      <span className="text-white/90">
                        Puntos:{' '}
                        <span className="font-bold text-green-300">
                          {Number(torneo.mi_equipo.puntos).toFixed(2)}
                        </span>
                      </span>
                      <span className="text-white/90">
                        Presupuesto:{' '}
                        <span className="font-bold text-white">
                          ${torneo.mi_equipo.presupuesto}
                        </span>
                      </span>
                    </div>
                  </div>
                )}

                {/* Código de acceso */}
                <div className="bg-blue-500/20 p-3 rounded-lg mb-3 border-2 border-blue-400/30">
                  <p className="text-xs text-white/70 mb-1">
                    Código de acceso:
                  </p>
                  <p className="text-xl font-mono font-bold text-white tracking-wider">
                    {torneo.codigo_acceso}
                  </p>
                </div>

                {/* Botones de acción */}
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/torneos/${torneo.torneo_id}`);
                    }}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    Ver Detalles →
                  </button>

                  {torneo.estado === 'ACTIVO' && torneo.mi_equipo?.id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/UpdateTeam?equipoId=${torneo.mi_equipo.id}`);
                      }}
                      className="flex-1 bg-green-500 text-white py-2 rounded-lg font-semibold hover:bg-green-600 transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      Ver Equipo
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default TorneosUsuario;
