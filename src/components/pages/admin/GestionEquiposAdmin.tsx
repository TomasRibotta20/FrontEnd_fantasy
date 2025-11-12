import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../../services/apiClient';
import { Notification } from '../../common/Notification';
import FormacionEquipoCompacta from '../../common/FormacionEquipoCompacta';
import {
  equiposService,
  adminService,
} from '../../../services/jornadasService';

interface Jugador {
  id: number;
  equipo: number;
  jugador: number;
  es_titular: boolean;
}

interface Equipo {
  id: number;
  nombre: string;
  usuario: number;
  jugadores: Jugador[];
}

interface EquipoConDatos extends Equipo {
  puntajeTotal: number;
  jugadoresTitulares: number;
  jugadoresSuplentes: number;
}

interface PlayerData {
  id?: number;
  apiId: number;
  name: string;
  firstName?: string;
  lastName?: string;
  age: number;
  nationality: string;
  height?: number;
  weight?: number;
  photo: string;
  jerseyNumber: number;
  position: unknown;
  esTitular?: boolean;
  puntaje?: number;
}

interface EquipoConJugadoresCompletos extends EquipoConDatos {
  jugadoresCompletos?: PlayerData[];
}

const GestionEquiposAdmin = () => {
  const navigate = useNavigate();
  const [equipos, setEquipos] = useState<EquipoConJugadoresCompletos[]>([]);
  const [expandedEquipos, setExpandedEquipos] = useState<Set<number>>(
    new Set()
  );
  const [loadingEquipoId, setLoadingEquipoId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'warning' | 'info';
    text: string;
  } | null>(null);

  useEffect(() => {
    fetchEquipos();
  }, []);

  const fetchEquipos = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<Equipo[]>('/equipos/todos');

      // Obtener la jornada activa desde el endpoint correcto
      let jornadaActualId: number | null = null;
      try {
        console.log('[JORNADA-ACTIVA] Obteniendo jornada activa...');
        const jornadaActivaData = await adminService.getJornadaActiva();

        if (jornadaActivaData.jornada && jornadaActivaData.jornada.id) {
          jornadaActualId = jornadaActivaData.jornada.id;
          console.log(
            `[JORNADA-ACTIVA] Jornada activa encontrada:`,
            jornadaActivaData.jornada
          );
          console.log(
            `[JORNADA-ACTIVA] ID: ${jornadaActualId}, Nombre: ${jornadaActivaData.jornada.nombre}`
          );
        } else {
          console.warn('[JORNADA-ACTIVA] No hay jornada activa configurada');
        }
      } catch (error) {
        console.error(
          '[JORNADA-ACTIVA] Error al obtener jornada activa:',
          error
        );
      }

      // Procesar equipos para calcular estadísticas y obtener puntos
      const equiposConDatosPromises = response.data.map(async (equipo) => {
        const jugadoresTitulares = equipo.jugadores.filter(
          (j) => j.es_titular
        ).length;
        const jugadoresSuplentes = equipo.jugadores.filter(
          (j) => !j.es_titular
        ).length;

        // Obtener puntaje del equipo para la jornada actual (solo si hay jornada activa)
        let puntajeTotal = 0;
        if (jornadaActualId !== null) {
          try {
            console.log(
              `[PUNTAJES] Cargando puntaje para equipo ${equipo.id}, jornada ${jornadaActualId}`
            );
            const puntajeData = await equiposService.getPuntajesEquipoJornada(
              equipo.id,
              jornadaActualId
            );
            puntajeTotal = puntajeData?.puntajeTotal || 0;
            console.log(`[PUNTAJES] Equipo ${equipo.id}: ${puntajeTotal} pts`);
          } catch (error) {
            console.warn(
              `[PUNTAJES] No se pudo cargar puntaje del equipo ${equipo.id}:`,
              error
            );
            // Silenciar el error, el puntaje queda en 0
          }
        } else {
          console.log(
            `[PUNTAJES] Sin jornada activa, equipo ${equipo.id} tendrá 0 pts`
          );
        }

        return {
          ...equipo,
          jugadoresTitulares,
          jugadoresSuplentes,
          puntajeTotal,
          jugadoresCompletos: undefined,
        };
      });

      const equiposConDatos = await Promise.all(equiposConDatosPromises);
      setEquipos(equiposConDatos);
    } catch (error) {
      console.error('Error al cargar equipos:', error);
      setNotification({
        type: 'error',
        text: 'Error al cargar los equipos',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchJugadoresCompletos = async (equipoId: number) => {
    const equipo = equipos.find((e) => e.id === equipoId);
    if (!equipo || equipo.jugadoresCompletos) return; // Ya tiene los datos

    try {
      setLoadingEquipoId(equipoId);

      // Obtener los datos completos de cada jugador
      const jugadoresPromises = equipo.jugadores.map(async (j) => {
        try {
          const response = await apiClient.get(`/players/${j.jugador}`);
          const playerData = response.data.data || response.data;

          // Obtener datos de la posición
          let positionData = playerData.position;
          if (typeof playerData.position === 'number') {
            try {
              const posResponse = await apiClient.get(
                `/positions/${playerData.position}`
              );
              positionData = posResponse.data.data || posResponse.data;
            } catch (error) {
              console.error(
                `Error al cargar posición ${playerData.position}:`,
                error
              );
              positionData = { id: playerData.position, description: 'N/A' };
            }
          }

          // Mapear al formato que espera FormacionEquipoCompacta
          return {
            id: playerData.id,
            apiId: playerData.apiId,
            name:
              playerData.name ||
              `${playerData.firstname} ${playerData.lastname}`,
            firstName: playerData.firstname,
            lastName: playerData.lastname,
            age: playerData.age,
            nationality: playerData.nationality,
            height: playerData.height,
            weight: playerData.weight,
            photo: playerData.photo,
            jerseyNumber: playerData.jerseyNumber || 0,
            position: positionData,
            esTitular: j.es_titular,
          };
        } catch (error) {
          console.error(`Error al cargar jugador ${j.jugador}:`, error);
          return null;
        }
      });

      const jugadoresCompletos = (await Promise.all(jugadoresPromises)).filter(
        Boolean
      ) as PlayerData[];

      console.log('Jugadores completos cargados:', jugadoresCompletos);

      // Actualizar el equipo con los datos completos
      setEquipos((prev) =>
        prev.map((e) => (e.id === equipoId ? { ...e, jugadoresCompletos } : e))
      );
    } catch (error) {
      console.error('Error al cargar jugadores:', error);
      setNotification({
        type: 'error',
        text: 'Error al cargar los detalles de los jugadores',
      });
    } finally {
      setLoadingEquipoId(null);
    }
  };

  const toggleEquipo = async (equipoId: number) => {
    const newExpanded = new Set(expandedEquipos);
    if (newExpanded.has(equipoId)) {
      newExpanded.delete(equipoId);
    } else {
      newExpanded.add(equipoId);
      // Cargar los datos completos de los jugadores si no están cargados
      await fetchJugadoresCompletos(equipoId);
    }
    setExpandedEquipos(newExpanded);
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-20 pb-10 flex items-center justify-center">
        <div
          className="fixed inset-0 bg-cover bg-center bg-no-repeat -z-10"
          style={{
            backgroundImage: `url('/Background_LandingPage.png')`,
            filter: 'blur(2px)',
          }}
        >
          <div className="absolute inset-0 bg-black opacity-30"></div>
        </div>
        <div className="text-white text-2xl font-bold drop-shadow-lg">
          Cargando equipos...
        </div>
      </div>
    );
  }

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

      <Notification
        message={notification}
        onClose={() => setNotification(null)}
      />

      <div className="container mx-auto px-4 relative z-10">
        {/* Botón volver */}
        <div className="max-w-6xl mx-auto mb-6">
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

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-2 drop-shadow-lg">
            Gestión de Equipos
          </h1>
          <p className="text-white text-lg drop-shadow mb-4">
            Administra todos los equipos de usuarios del sistema
          </p>
        </div>

        {/* Estadísticas rápidas */}
        <div className="max-w-6xl mx-auto mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/15 backdrop-blur-lg rounded-xl p-5 border-2 border-white/30 text-center shadow-xl hover:bg-white/20 transition-all">
              <div className="text-4xl font-bold text-blue-400 mb-2 drop-shadow-lg">
                {equipos.length}
              </div>
              <div className="text-white text-sm font-semibold drop-shadow">
                Total Equipos
              </div>
            </div>
            <div className="bg-white/15 backdrop-blur-lg rounded-xl p-5 border-2 border-white/30 text-center shadow-xl hover:bg-white/20 transition-all">
              <div className="text-4xl font-bold text-green-400 mb-2 drop-shadow-lg">
                {equipos.filter((e) => e.jugadoresTitulares === 11).length}
              </div>
              <div className="text-white text-sm font-semibold drop-shadow">
                Equipos Completos
              </div>
            </div>
            <div className="bg-white/15 backdrop-blur-lg rounded-xl p-5 border-2 border-white/30 text-center shadow-xl hover:bg-white/20 transition-all">
              <div className="text-4xl font-bold text-yellow-400 mb-2 drop-shadow-lg">
                {equipos.reduce((sum, e) => sum + e.jugadores.length, 0)}
              </div>
              <div className="text-white text-sm font-semibold drop-shadow">
                Total Jugadores
              </div>
            </div>
          </div>
        </div>

        {/* Lista de equipos */}
        <div className="max-w-6xl mx-auto">
          <div className="bg-white/15 backdrop-blur-lg rounded-xl border-2 border-white/30 shadow-2xl">
            <div className="p-4 space-y-2">
              {equipos.length > 0 ? (
                equipos.map((equipo) => (
                  <div
                    key={equipo.id}
                    className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20"
                  >
                    {/* Fila colapsada */}
                    <div className="flex items-center justify-between p-4">
                      <div className="flex-1 flex items-center gap-4">
                        <div className="bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg p-2.5 shadow-lg">
                          <span className="text-2xl drop-shadow">🛡️</span>
                        </div>
                        <div className="flex-1">
                          <div className="text-white font-bold text-lg drop-shadow">
                            {equipo.nombre}
                          </div>
                          <div className="text-white/70 text-sm drop-shadow">
                            Usuario ID: {equipo.usuario}
                          </div>
                        </div>
                        <div className="text-right mr-4">
                          <div className="text-blue-300 font-bold text-2xl drop-shadow-lg">
                            {equipo.puntajeTotal} pts
                          </div>
                          <div className="text-white/70 text-xs drop-shadow">
                            {equipo.jugadoresTitulares} titulares /{' '}
                            {equipo.jugadoresSuplentes} suplentes
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleEquipo(equipo.id)}
                        className="bg-blue-500/30 hover:bg-blue-500/50 text-white px-4 py-2 rounded-lg font-bold transition-colors border-2 border-blue-500/50 shadow"
                      >
                        {expandedEquipos.has(equipo.id)
                          ? '▲ Ocultar'
                          : '▼ Ver Formación'}
                      </button>
                    </div>

                    {/* Fila expandida - Formación */}
                    {expandedEquipos.has(equipo.id) && (
                      <div className="border-t border-white/20 p-6 bg-black/20">
                        {loadingEquipoId === equipo.id ? (
                          <div className="text-center py-8">
                            <div className="text-white text-lg font-bold drop-shadow">
                              Cargando formación...
                            </div>
                          </div>
                        ) : equipo.jugadoresCompletos &&
                          equipo.jugadoresCompletos.length > 0 ? (
                          <div className="max-w-4xl mx-auto">
                            <h3 className="text-white font-bold text-xl mb-6 drop-shadow text-center">
                              Formación del Equipo
                            </h3>
                            <FormacionEquipoCompacta
                              players={equipo.jugadoresCompletos.filter(
                                (p) => p.esTitular
                              )}
                              showSuplentes={false}
                            />
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <div className="text-white/70">
                              No se pudieron cargar los datos de los jugadores
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="text-white/70 text-lg">
                    No hay equipos registrados
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GestionEquiposAdmin;
