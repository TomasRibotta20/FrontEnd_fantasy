import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import apiClient from '../../services/apiClient';
import {
  useTorneoSeleccionado,
  useMiEquipoId,
} from '../../hooks/useSessionData';

interface ProtectedRouteProps {
  children: ReactNode;
  redirectTo?: string;
  requireTeam?: boolean;
}

/** Componente de ruta protegida que requiere autenticación. */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  redirectTo = '/login',
  requireTeam = true,
}) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const [hasTeam, setHasTeam] = useState<boolean | null>(null);
  const [checkingTeam, setCheckingTeam] = useState(true);
  const [torneoId] = useTorneoSeleccionado();
  const [equipoId] = useMiEquipoId();

  useEffect(() => {
    const checkUserTeam = async () => {
      // Si hay torneoId o equipoId en el estado global, el usuario está en un torneo
      if (
        location.pathname.startsWith('/torneos') ||
        location.pathname.startsWith('/jornadas') ||
        location.pathname.startsWith('/equipos') ||
        location.pathname.startsWith('/mis-puntos') ||
        location.pathname.startsWith('/LoggedMenu') ||
        location.pathname.startsWith('/leaderboard') ||
        location.pathname.startsWith('/ver-equipo') ||
        location.pathname.startsWith('/mercado') ||
        location.pathname.startsWith('/mis-ofertas') ||
        equipoId ||
        torneoId ||
        !requireTeam
      ) {
        setCheckingTeam(false);
        setHasTeam(true);
        return;
      }

      // Solo verificamos si el usuario está autenticado
      if (isAuthenticated && !isLoading) {
        try {
          const response = await apiClient.get('/api/equipos/mi-equipo');
          if (response.data !== null) {
            setHasTeam(true);
          } else {
            setHasTeam(false);
          }
        } catch {
          // Si hay error (404, 500, etc.), asumimos que no tiene equipo
          setHasTeam(false);
        } finally {
          setCheckingTeam(false);
        }
      } else {
        setCheckingTeam(false);
      }
    };

    checkUserTeam();
  }, [
    isAuthenticated,
    isLoading,
    location.pathname,
    torneoId,
    equipoId,
    requireTeam,
  ]);

  if (isLoading || checkingTeam) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full border-blue-600 border-t-transparent"></div>
          <p className="mt-2 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  // Si requiere equipo y no lo tiene, redirigir a torneos (excepto en ciertas rutas)
  if (
    requireTeam &&
    hasTeam === false &&
    !location.pathname.startsWith('/torneos') &&
    !location.pathname.startsWith('/jornadas') &&
    !location.pathname.startsWith('/LoggedMenu')
  ) {
    return <Navigate to="/torneos" replace />;
  }

  return <>{children}</>;
};
