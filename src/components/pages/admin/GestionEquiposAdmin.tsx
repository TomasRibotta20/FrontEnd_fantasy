import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../../services/apiClient';
import { Notification } from '../../common/Notification';
import FormacionEquipoCompacta from '../../common/FormacionEquipoCompacta';
import type { PlayerPosition } from '../../../types/player.types';

/* ─── Tipos que refleja el backend con populate ─── */
interface BackendJugador {
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
  club?: { id: number; nombre?: string; logo?: string } | number;
}

interface BackendEquipoJugador {
  id: number;
  es_titular: boolean;
  jugador: BackendJugador | number;
}

interface BackendEquipo {
  id: number;
  nombre: string;
  presupuesto: number;
  presupuesto_bloqueado: number;
  puntos?: number;
  torneo_usuario?: {
    id: number;
    rol?: string;
    expulsado?: boolean;
    usuario: { id: number; username: string } | number;
    torneo: { id: number; nombre: string } | number;
  };
  jugadores: BackendEquipoJugador[];
}

/* ─── Tipos internos ─── */
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
  position: PlayerPosition;
  esTitular?: boolean;
}

interface EquipoProcesado {
  id: number;
  nombre: string;
  username: string;
  torneoNombre: string;
  puntos: number;
  presupuesto: number;
  titulares: number;
  suplentes: number;
  jugadoresCompletos: PlayerData[];
  expulsado: boolean;
}

const GestionEquiposAdmin = () => {
  const navigate = useNavigate();
  const [equipos, setEquipos] = useState<EquipoProcesado[]>([]);
  const [expandedEquipos, setExpandedEquipos] = useState<Set<number>>(
    new Set(),
  );
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'warning' | 'info';
    text: string;
  } | null>(null);

  // Filtros
  const [filtroTorneo, setFiltroTorneo] = useState<string>('');
  const [filtroBusqueda, setFiltroBusqueda] = useState('');
  const [torneos, setTorneos] = useState<{ id: number; nombre: string }[]>([]);

  const mapearJugador = useCallback(
    (ej: BackendEquipoJugador): PlayerData | null => {
      if (typeof ej.jugador === 'number') return null;
      const j = ej.jugador;
      const firstName = j.primer_nombre || '';
      const lastName = j.apellido || '';
      let fullName = j.nombre || '';
      if (!fullName && (firstName || lastName)) {
        fullName = `${firstName} ${lastName}`.trim();
      }
      return {
        id: j.id,
        apiId: j.id_api || j.id || 0,
        name: fullName || 'Sin nombre',
        firstName,
        lastName,
        age: j.edad || 0,
        nationality: j.nacionalidad || '',
        height: j.altura ? parseInt(j.altura) : undefined,
        weight: j.peso ? parseInt(j.peso) : undefined,
        photo:
          j.foto || 'https://via.placeholder.com/64x64/4F46E5/FFFFFF?text=?',
        jerseyNumber: j.numero_camiseta || 0,
        position: j.posicion as PlayerPosition,
        esTitular: ej.es_titular,
      };
    },
    [],
  );

  const fetchEquipos = useCallback(async () => {
    try {
      setLoading(true);
      const response =
        await apiClient.get<BackendEquipo[]>('/api/equipos/todos');

      const torneosMap = new Map<number, string>();
      const procesados: EquipoProcesado[] = response.data.map((eq) => {
        const tu = eq.torneo_usuario;
        const username =
          tu && typeof tu.usuario === 'object'
            ? tu.usuario.username
            : `ID: ${tu?.usuario || '?'}`;
        const torneoNombre =
          tu && typeof tu.torneo === 'object' ? tu.torneo.nombre : 'Sin torneo';
        const torneoId = tu && typeof tu.torneo === 'object' ? tu.torneo.id : 0;
        if (torneoId && torneoNombre !== 'Sin torneo') {
          torneosMap.set(torneoId, torneoNombre);
        }

        const jugadoresMapeados = eq.jugadores
          .map(mapearJugador)
          .filter(Boolean) as PlayerData[];
        const titulares = jugadoresMapeados.filter((j) => j.esTitular).length;
        const suplentes = jugadoresMapeados.filter((j) => !j.esTitular).length;

        return {
          id: eq.id,
          nombre: eq.nombre,
          username,
          torneoNombre,
          puntos: eq.puntos || 0,
          presupuesto: eq.presupuesto || 0,
          titulares,
          suplentes,
          jugadoresCompletos: jugadoresMapeados,
          expulsado: tu?.expulsado || false,
        };
      });

      setEquipos(procesados);
      setTorneos(
        Array.from(torneosMap.entries()).map(([id, nombre]) => ({
          id,
          nombre,
        })),
      );
    } catch {
      setNotification({ type: 'error', text: 'Error al cargar los equipos' });
    } finally {
      setLoading(false);
    }
  }, [mapearJugador]);

  useEffect(() => {
    fetchEquipos();
  }, [fetchEquipos]);

  const toggleEquipo = (equipoId: number) => {
    setExpandedEquipos((prev) => {
      const next = new Set(prev);
      if (next.has(equipoId)) {
        next.delete(equipoId);
      } else {
        next.add(equipoId);
      }
      return next;
    });
  };

  // Equipos filtrados
  const equiposFiltrados = equipos.filter((eq) => {
    if (filtroTorneo && eq.torneoNombre !== filtroTorneo) return false;
    if (filtroBusqueda) {
      const q = filtroBusqueda.toLowerCase();
      return (
        eq.nombre.toLowerCase().includes(q) ||
        eq.username.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const formatMoney = (n: number) =>
    `$${n.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;

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
          <p className="text-white text-lg drop-shadow">
            Administra todos los equipos de usuarios del sistema
          </p>
        </div>

        {/* Estadísticas rápidas */}
        <div className="max-w-6xl mx-auto mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/15 backdrop-blur-lg rounded-xl p-5 border-2 border-white/30 text-center shadow-xl">
              <div className="text-4xl font-bold text-blue-400 mb-1 drop-shadow-lg">
                {equipos.length}
              </div>
              <div className="text-white text-sm font-semibold drop-shadow">
                Total Equipos
              </div>
            </div>
            <div className="bg-white/15 backdrop-blur-lg rounded-xl p-5 border-2 border-white/30 text-center shadow-xl">
              <div className="text-4xl font-bold text-green-400 mb-1 drop-shadow-lg">
                {equipos.filter((e) => e.titulares >= 11).length}
              </div>
              <div className="text-white text-sm font-semibold drop-shadow">
                Equipos Completos
              </div>
            </div>
            <div className="bg-white/15 backdrop-blur-lg rounded-xl p-5 border-2 border-white/30 text-center shadow-xl">
              <div className="text-4xl font-bold text-yellow-400 mb-1 drop-shadow-lg">
                {equipos.reduce(
                  (sum, e) => sum + e.jugadoresCompletos.length,
                  0,
                )}
              </div>
              <div className="text-white text-sm font-semibold drop-shadow">
                Total Jugadores
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="max-w-6xl mx-auto mb-6 flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Buscar por equipo o usuario..."
            value={filtroBusqueda}
            onChange={(e) => setFiltroBusqueda(e.target.value)}
            className="flex-1 min-w-[200px] p-2.5 rounded-lg bg-white/15 backdrop-blur-lg text-white border-2 border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-white/50"
          />
          <select
            value={filtroTorneo}
            onChange={(e) => setFiltroTorneo(e.target.value)}
            className="p-2.5 rounded-lg bg-white/15 backdrop-blur-lg text-white border-2 border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="" className="bg-gray-800 text-white">
              Todos los torneos
            </option>
            {torneos.map((t) => (
              <option
                key={t.id}
                value={t.nombre}
                className="bg-gray-800 text-white"
              >
                {t.nombre}
              </option>
            ))}
          </select>
          {(filtroBusqueda || filtroTorneo) && (
            <button
              onClick={() => {
                setFiltroBusqueda('');
                setFiltroTorneo('');
              }}
              className="px-4 py-2.5 rounded-lg bg-red-500/50 hover:bg-red-500/70 text-white border border-red-400/50 transition-all font-semibold"
            >
              ✕ Limpiar
            </button>
          )}
        </div>

        {/* Lista de equipos */}
        <div className="max-w-6xl mx-auto space-y-3">
          {equiposFiltrados.length > 0 ? (
            equiposFiltrados.map((equipo) => (
              <div
                key={equipo.id}
                className={`backdrop-blur-lg rounded-xl border-2 shadow-xl overflow-hidden ${
                  equipo.expulsado
                    ? 'bg-red-900/20 border-red-400/30 opacity-60'
                    : 'bg-white/10 border-white/30'
                }`}
              >
                {/* Fila colapsada */}
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition-all"
                  onClick={() => toggleEquipo(equipo.id)}
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {/* Avatar con inicial */}
                    <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg w-12 h-12 flex items-center justify-center shadow-lg flex-shrink-0">
                      <span className="text-white text-xl font-bold">
                        {equipo.nombre.charAt(0).toUpperCase()}
                      </span>
                    </div>

                    {/* Info principal */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-lg font-bold drop-shadow ${equipo.expulsado ? 'text-white/50 line-through' : 'text-white'}`}
                        >
                          {equipo.nombre}
                        </span>
                        {equipo.expulsado && (
                          <span className="text-xs bg-red-500/70 px-2 py-0.5 rounded-full text-white font-bold">
                            EXPULSADO
                          </span>
                        )}
                      </div>
                      <div className="text-white/70 text-sm flex flex-wrap gap-x-3 gap-y-0.5">
                        <span>👤 {equipo.username}</span>
                        <span>🏆 {equipo.torneoNombre}</span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="hidden sm:flex items-center gap-6 flex-shrink-0">
                      <div className="text-center">
                        <div className="text-blue-300 font-bold text-xl drop-shadow-lg">
                          {equipo.puntos.toFixed(1)}
                        </div>
                        <div className="text-white/60 text-xs">Puntos</div>
                      </div>
                      <div className="text-center">
                        <div className="text-green-300 font-bold text-sm drop-shadow">
                          {formatMoney(equipo.presupuesto)}
                        </div>
                        <div className="text-white/60 text-xs">Presupuesto</div>
                      </div>
                      <div className="text-center">
                        <div className="text-white/90 font-semibold text-sm">
                          {equipo.titulares}T / {equipo.suplentes}S
                        </div>
                        <div className="text-white/60 text-xs">Jugadores</div>
                      </div>
                    </div>
                  </div>

                  {/* Botón expandir */}
                  <button className="ml-4 bg-blue-500/30 hover:bg-blue-500/50 text-white px-4 py-2 rounded-lg font-bold transition-colors border border-blue-500/50 shadow flex-shrink-0 text-sm">
                    {expandedEquipos.has(equipo.id)
                      ? '▲ Ocultar'
                      : '▼ Formación'}
                  </button>
                </div>

                {/* Stats móvil */}
                <div className="sm:hidden px-4 pb-3 flex gap-4 text-sm text-white/80">
                  <span>⚽ {equipo.puntos.toFixed(1)} pts</span>
                  <span>💰 {formatMoney(equipo.presupuesto)}</span>
                  <span>
                    👥 {equipo.titulares}T/{equipo.suplentes}S
                  </span>
                </div>

                {/* Fila expandida - Formación */}
                {expandedEquipos.has(equipo.id) && (
                  <div className="border-t border-white/20 p-6 bg-black/20">
                    {equipo.jugadoresCompletos.length > 0 ? (
                      <div className="max-w-4xl mx-auto">
                        <h3 className="text-white font-bold text-xl mb-4 drop-shadow text-center">
                          Formación del Equipo
                        </h3>
                        <FormacionEquipoCompacta
                          players={equipo.jugadoresCompletos.filter(
                            (p) => p.esTitular,
                          )}
                          showSuplentes={false}
                        />

                        {/* Suplentes como lista */}
                        {equipo.jugadoresCompletos.filter((p) => !p.esTitular)
                          .length > 0 && (
                          <div className="mt-6">
                            <h4 className="text-white/80 font-semibold text-sm mb-2 text-center">
                              Suplentes
                            </h4>
                            <div className="flex flex-wrap justify-center gap-2">
                              {equipo.jugadoresCompletos
                                .filter((p) => !p.esTitular)
                                .map((p) => (
                                  <div
                                    key={p.id}
                                    className="bg-white/10 rounded-lg px-3 py-1.5 flex items-center gap-2 border border-white/20"
                                  >
                                    <img
                                      src={p.photo}
                                      alt={p.name}
                                      className="w-6 h-6 rounded-full object-cover"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src =
                                          'https://via.placeholder.com/24x24/4F46E5/FFFFFF?text=?';
                                      }}
                                    />
                                    <span className="text-white text-xs font-medium">
                                      {p.name}
                                    </span>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="text-white/60 text-lg">
                          Este equipo no tiene jugadores asignados
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="backdrop-blur-lg bg-white/10 rounded-xl border-2 border-white/30 p-12 text-center">
              <div className="text-white/60 text-lg">
                {equipos.length === 0
                  ? 'No hay equipos registrados'
                  : 'No se encontraron equipos con los filtros actuales'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GestionEquiposAdmin;
