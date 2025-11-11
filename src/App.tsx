import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import NavBar from './components/navbar/navbar';
import LandingPage from './components/pages/landingpage';
import Club from './components/pages/clubCRUD/ClubName';
import ClubReadUpdateDelete from './components/pages/clubCRUD/ClubReadUpdateDelete';
import CreateUser from './components/pages/register/CreateUser';
import Login from './components/pages/auth/Login';
import LoggedMenu from './components/pages/LoggedMenu';
import CrudPositions from './components/pages/posicionesCRUD/CrudPositions';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import AdminRoute from './components/auth/AdminRoute';
import { CreateTeam } from './components/pages/equipoCRUD/CreateTeam';
import UpdateTeam from './components/pages/equipoCRUD/UpdateTeam';
import AdminPage from './components/pages/admin/AdminPage';
import PlayersCRUD from './components/pages/playersCRUD/PlayersCRUD';
import UsersCRUD from './components/pages/usersCRUD/UsersCRUD';
import GestionJornadas from './components/pages/jornadas/GestionJornadas';
import GestionJornadasAdmin from './components/pages/admin/GestionJornadasAdmin';
import GestionEquiposAdmin from './components/pages/admin/GestionEquiposAdmin';
import DetalleJornada from './components/pages/jornadas/DetalleJornada';
import JornadasUsuario from './components/pages/jornadas/JornadasUsuario';
import MiEquipoJornada from './components/pages/jornadas/MiEquipoJornada';
import MisPuntosHistorial from './components/pages/jornadas/MisPuntosHistorial';
import DetalleJornadaEquipo from './components/pages/jornadas/DetalleJornadaEquipo';
import DebugEndpoints from './components/pages/jornadas/DebugEndpoints';
import { useAuth } from './hooks/useAuth';

// Componente para redirigir usuarios autenticados
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();

  if (isAuthenticated && user) {
    // Redirigir según el rol
    const redirectPath = user.role === 'admin' ? '/admin' : '/LoggedMenu';
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <NavBar />
        <Routes>
          <Route
            path="/"
            element={
              <PublicRoute>
                <LandingPage />
              </PublicRoute>
            }
          ></Route>
          <Route path="/CreateUser" element={<CreateUser />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/club"
            element={
              <ProtectedRoute>
                <Club />
              </ProtectedRoute>
            }
          ></Route>
          <Route
            path="/ClubName"
            element={
              <ProtectedRoute>
                <Club />
              </ProtectedRoute>
            }
          ></Route>
          <Route
            path="/ClubReadUpdateDelete"
            element={
              <ProtectedRoute>
                <ClubReadUpdateDelete />
              </ProtectedRoute>
            }
          />
          <Route
            path="/LoggedMenu"
            element={
              <ProtectedRoute>
                <LoggedMenu />
              </ProtectedRoute>
            }
          />
          <Route
            path="/CreateTeam"
            element={
              <ProtectedRoute requireTeam={false}>
                <CreateTeam />
              </ProtectedRoute>
            }
          />
          <Route
            path="/crear-equipo"
            element={
              <ProtectedRoute requireTeam={false}>
                <CreateTeam />
              </ProtectedRoute>
            }
          />

          <Route
            path="/CrudPositions"
            element={
              <ProtectedRoute>
                <CrudPositions />
              </ProtectedRoute>
            }
          />

          <Route
            path="/UpdateTeam"
            element={
              <ProtectedRoute>
                <UpdateTeam />
              </ProtectedRoute>
            }
          />

          {/* Rutas de Administración - Solo accesibles para usuarios con rol admin */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <AdminRoute>
                <UsersCRUD />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/players"
            element={
              <AdminRoute>
                <PlayersCRUD />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/clubs"
            element={
              <AdminRoute>
                <ClubReadUpdateDelete />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/positions"
            element={
              <AdminRoute>
                <CrudPositions />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/equipos"
            element={
              <AdminRoute>
                <GestionEquiposAdmin />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/jornadas"
            element={
              <AdminRoute>
                <GestionJornadasAdmin />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/jornadas/:id/detalle"
            element={
              <AdminRoute>
                <DetalleJornada />
              </AdminRoute>
            }
          />

          {/* Rutas de Jornadas para Usuarios */}
          <Route
            path="/jornada"
            element={
              <ProtectedRoute>
                <GestionJornadas />
              </ProtectedRoute>
            }
          />
          <Route
            path="/jornadas"
            element={
              <ProtectedRoute>
                <JornadasUsuario />
              </ProtectedRoute>
            }
          />
          <Route
            path="/jornadas/:jornadaId/mi-equipo"
            element={
              <ProtectedRoute>
                <MiEquipoJornada />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mis-puntos/historial"
            element={
              <ProtectedRoute>
                <MisPuntosHistorial />
              </ProtectedRoute>
            }
          />
          <Route
            path="/equipos/:equipoId/jornadas/:jornadaId"
            element={
              <ProtectedRoute>
                <DetalleJornadaEquipo />
              </ProtectedRoute>
            }
          />
          <Route
            path="/debug/endpoints"
            element={
              <ProtectedRoute>
                <DebugEndpoints />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
