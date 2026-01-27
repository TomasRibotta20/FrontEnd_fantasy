import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { obtenerMisTorneos } from '../../services/torneosService';
import type { TorneoListItem } from '../../services/torneosService';
import {
  useTorneoSeleccionado,
  useMiEquipoId,
} from '../../hooks/useSessionData';

const SelectorTorneos = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [torneos, setTorneos] = useState<TorneoListItem[]>([]);
  const [torneoActual, setTorneoActual] = useState<TorneoListItem | null>(null);
  const [loading, setLoading] = useState(true);

  // ✅ Usar hooks en lugar de localStorage directamente
  const [torneoGuardadoId, setTorneoGuardadoId] = useTorneoSeleccionado();
  const [, setMiEquipoId] = useMiEquipoId();

  useEffect(() => {
    const fetchTorneos = async () => {
      try {
        const response = await obtenerMisTorneos();
        const torneosData = response.data || [];
        setTorneos(torneosData);

        if (torneosData.length === 0) {
          setLoading(false);
          return;
        }

        // PRIORIDAD 1: Verificar si hay un torneo guardado en el hook (selección del usuario)
        if (torneoGuardadoId) {
          const torneoGuardado = torneosData.find(
            (t: TorneoListItem) => t.torneo_id === parseInt(torneoGuardadoId)
          );
          if (torneoGuardado) {
            setTorneoActual(torneoGuardado);
            setLoading(false);
            return;
          }
        }

        // PRIORIDAD 2: Si NO hay selección guardada, buscar el primer torneo ACTIVO y guardarlo
        const torneoActivo = torneosData.find(
          (t: TorneoListItem) => t.estado === 'ACTIVO'
        );
        if (torneoActivo) {
          setTorneoActual(torneoActivo);
          setTorneoGuardadoId(torneoActivo.torneo_id.toString());
          setLoading(false);
          return;
        }

        // PRIORIDAD 3: Si no hay torneo activo, usar el primero disponible
        let torneoIdActual: number | null = null;

        // Intentar extraer de la URL (para rutas como /mercado/4, /leaderboard/3, /torneos/2)
        const pathMatch = location.pathname.match(
          /\/(mercado|leaderboard|torneos)\/(\d+)/
        );
        if (pathMatch) {
          torneoIdActual = parseInt(pathMatch[2]);
        }

        // Si no está en la URL, buscar en query params
        if (!torneoIdActual) {
          const torneoIdParam = searchParams.get('torneoId');
          if (torneoIdParam) {
            torneoIdActual = parseInt(torneoIdParam);
          }
        }

        // Como fallback, usar el torneo de la URL o el primero disponible
        if (torneoIdActual) {
          const torneoSeleccionado = torneosData.find(
            (t: TorneoListItem) => t.torneo_id === torneoIdActual
          );
          if (torneoSeleccionado) {
            setTorneoActual(torneoSeleccionado);
            setTorneoGuardadoId(torneoSeleccionado.torneo_id.toString());
          } else {
            setTorneoActual(torneosData[0]);
            setTorneoGuardadoId(torneosData[0].torneo_id.toString());
          }
        } else {
          // Último fallback: usar el primero y guardarlo
          setTorneoActual(torneosData[0]);
          setTorneoGuardadoId(torneosData[0].torneo_id.toString());
        }
      } catch (error) {
        console.error('Error al cargar torneos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTorneos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo ejecutar UNA VEZ al montar el componente

  const handleTorneoChange = (torneoId: number) => {
    const torneoSeleccionado = torneos.find((t) => t.torneo_id === torneoId);
    setTorneoActual(torneoSeleccionado || null);

    // ✅ GUARDAR la selección del usuario usando el hook (actualiza el estado global)
    setTorneoGuardadoId(torneoId.toString());

    // Obtener el equipoId del torneo seleccionado y guardarlo también
    const equipoId = torneoSeleccionado?.mi_equipo?.id;
    if (equipoId) {
      setMiEquipoId(equipoId.toString());
    }

    // Manejar rutas específicas que usan torneoId en la URL (no en query params)
    const currentPath = location.pathname;

    if (
      currentPath.includes('/mercado/') ||
      currentPath.includes('/leaderboard/') ||
      currentPath.includes('/torneos/')
    ) {
      // Para rutas que usan torneoId en el path, reemplazar el ID
      const newPath = currentPath.replace(/\/(\d+)$/, `/${torneoId}`);
      navigate(newPath, { replace: false });
      return;
    }

    // Para otras rutas, construir nuevos parámetros manteniendo la ruta actual
    const params = new URLSearchParams();
    params.append('torneoId', torneoId.toString());
    if (equipoId) {
      params.append('equipoId', equipoId.toString());
    }

    // Navegar sin forzar recarga - los componentes reaccionarán al cambio
    navigate(`${currentPath}?${params.toString()}`, { replace: false });
  };

  if (loading || torneos.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-white text-sm font-semibold drop-shadow-md hidden sm:inline">
        Torneo:
      </span>
      <select
        value={torneoActual?.torneo_id || ''}
        onChange={(e) => handleTorneoChange(parseInt(e.target.value))}
        className="bg-white/25 backdrop-blur-sm text-white text-sm font-semibold rounded-lg px-3 py-1.5 border-2 border-white/40 hover:border-white/60 focus:border-white/80 focus:outline-none transition-all duration-200 cursor-pointer drop-shadow-md appearance-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 0.5rem center',
          backgroundSize: '1.5em 1.5em',
          paddingRight: '2.5rem',
        }}
      >
        {torneos.map((torneo) => (
          <option
            key={torneo.torneo_id}
            value={torneo.torneo_id}
            className="bg-gray-800 text-white"
          >
            {torneo.nombre}
          </option>
        ))}
      </select>
    </div>
  );
};

export default SelectorTorneos;
