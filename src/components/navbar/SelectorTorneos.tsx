import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { obtenerMisTorneos } from '../../services/torneosService';
import type { TorneoListItem } from '../../services/torneosService';
import {
  useTorneoSeleccionado,
  useMiEquipoId,
} from '../../hooks/useSessionData';

/** Rutas que usan :torneoId como path param */
const PATH_PARAM_ROUTES = ['/mercado/', '/leaderboard/', '/torneos/'];

/** Selector de torneos en la barra de navegación. */
const SelectorTorneos = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [torneos, setTorneos] = useState<TorneoListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const initializedRef = useRef(false);

  // Fuente única de verdad
  const [torneoGuardadoId, setTorneoGuardadoId] = useTorneoSeleccionado();
  const [, setMiEquipoId] = useMiEquipoId();

  // Cargar lista de torneos (sin lógica de selección)
  const fetchTorneos = useCallback(async () => {
    try {
      const response = await obtenerMisTorneos();
      const torneosData: TorneoListItem[] = response.data || [];
      setTorneos(torneosData);

      // Si el torneo seleccionado ya no está en la lista (abandono/expulsión),
      // limpiar selección y permitir que el auto-select elija otro
      if (torneoGuardadoId) {
        const sigueExistiendo = torneosData.some(
          (t) => t.torneo_id === parseInt(torneoGuardadoId),
        );
        if (!sigueExistiendo) {
          setTorneoGuardadoId(null);
          setMiEquipoId(null);
          initializedRef.current = false;
        }
      }
    } catch {
      // error silenciado
    } finally {
      setLoading(false);
    }
  }, [torneoGuardadoId, setTorneoGuardadoId, setMiEquipoId]);

  // Cargar torneos al montar
  useEffect(() => {
    fetchTorneos();
  }, [fetchTorneos]);

  // Recargar la lista cuando el usuario navega a /torneos o /LoggedMenu (viene de crear/unirse)
  useEffect(() => {
    if (
      location.pathname === '/torneos' ||
      location.pathname === '/LoggedMenu'
    ) {
      fetchTorneos();
    }
  }, [location.pathname, fetchTorneos]);

  // Auto-seleccionar torneo cuando se carga la lista y no hay uno guardado
  useEffect(() => {
    if (torneos.length === 0 || initializedRef.current) return;

    // Si ya hay uno guardado y existe en la lista, no hacer nada
    if (torneoGuardadoId) {
      const existe = torneos.find(
        (t) => t.torneo_id === parseInt(torneoGuardadoId),
      );
      if (existe) {
        // Sincronizar equipoId por si cambió
        if (existe.mi_equipo?.id) {
          setMiEquipoId(existe.mi_equipo.id.toString());
        }
        initializedRef.current = true;
        return;
      }
    }

    // Auto-seleccionar: primer torneo ACTIVO, o el primero disponible
    const torneoActivo = torneos.find((t) => t.estado === 'ACTIVO');
    const torneoDefault = torneoActivo || torneos[0];

    setTorneoGuardadoId(torneoDefault.torneo_id.toString());
    if (torneoDefault.mi_equipo?.id) {
      setMiEquipoId(torneoDefault.mi_equipo.id.toString());
    }
    initializedRef.current = true;
  }, [torneos, torneoGuardadoId, setTorneoGuardadoId, setMiEquipoId]);

  // Derivar torneoActual del hook (no estado local separado)
  const torneoActual = torneos.find(
    (t) => torneoGuardadoId && t.torneo_id === parseInt(torneoGuardadoId),
  );

  const handleTorneoChange = (torneoId: number) => {
    const torneoSeleccionado = torneos.find((t) => t.torneo_id === torneoId);

    // Actualizar la fuente única de verdad
    setTorneoGuardadoId(torneoId.toString());

    // Guardar equipoId del nuevo torneo
    const equipoId = torneoSeleccionado?.mi_equipo?.id;
    if (equipoId) {
      setMiEquipoId(equipoId.toString());
    } else {
      setMiEquipoId(null);
    }

    // Solo navegar si estamos en una ruta con :torneoId en el path
    const currentPath = location.pathname;
    const isPathParamRoute = PATH_PARAM_ROUTES.some((r) =>
      currentPath.includes(r),
    );

    if (isPathParamRoute) {
      const newPath = currentPath.replace(/\/(\d+)(\/.*)?$/, `/${torneoId}$2`);
      navigate(newPath, { replace: true });
    }
    // Para todas las demás páginas: no navegar, los componentes reaccionan
    // automáticamente al cambio del hook useTorneoSeleccionado()
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
