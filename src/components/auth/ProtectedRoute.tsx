import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import apiClient from '../../services/apiClient';

interface ProtectedRouteProps {
  children: ReactNode;
  redirectTo?: string;
  requireTeam?: boolean; // Nueva prop para indicar si requiere equipo
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  redirectTo = '/login',
  requireTeam = true, // Por defecto requiere equipo
}) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const [hasTeam, setHasTeam] = useState<boolean | null>(null);
  const [checkingTeam, setCheckingTeam] = useState(true);

  useEffect(() => {
    const checkUserTeam = async () => {
      // Si estamos en la página de crear equipo, no verificamos
      if (location.pathname === '/crear-equipo' || !requireTeam) {
        setCheckingTeam(false);
        setHasTeam(true);
        return;
      }

      // Solo verificamos si el usuario está autenticado
      if (isAuthenticated && !isLoading) {
        try {
          const response = await apiClient.get('equipos/mi-equipo');
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
  }, [isAuthenticated, isLoading, location.pathname, requireTeam]);

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

  // Si requiere equipo y no lo tiene, redirigir a crear equipo
  if (
    requireTeam &&
    hasTeam === false &&
    location.pathname !== '/crear-equipo'
  ) {
    return <Navigate to="/crear-equipo" replace />;
  }

  return <>{children}</>;
};
