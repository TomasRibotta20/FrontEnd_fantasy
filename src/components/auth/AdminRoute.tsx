import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-2xl font-bold drop-shadow-lg">
          Cargando...
        </div>
      </div>
    );
  }

  // Si no está autenticado, redirigir al login
  if (!user) {
    return <Navigate to="/Login" replace />;
  }

  // Si no es admin, redirigir al LoggedMenu
  if (user.role !== 'admin') {
    return <Navigate to="/LoggedMenu" replace />;
  }

  // Si es admin, mostrar el contenido
  return <>{children}</>;
};

export default AdminRoute;
