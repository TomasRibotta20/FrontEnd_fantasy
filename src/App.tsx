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
import { CreateTeam } from './components/pages/equipoCRUD/CreateTeam';
import UpdateTeam from './components/pages/equipoCRUD/UpdateTeam';
import AdminPage from './components/pages/admin/AdminPage';
import PlayersCRUD from './components/pages/playersCRUD/PlayersCRUD';
import UsersCRUD from './components/pages/usersCRUD/UsersCRUD';
import GestionJornadas from './components/pages/jornadas/GestionJornadas';
import GestionJornadasAdmin from './components/pages/admin/GestionJornadasAdmin';
import DetalleJornada from './components/pages/jornadas/DetalleJornada';
import JornadasUsuario from './components/pages/jornadas/JornadasUsuario';
import MiEquipoJornada from './components/pages/jornadas/MiEquipoJornada';
import MisPuntosHistorial from './components/pages/jornadas/MisPuntosHistorial';
import DetalleJornadaEquipo from './components/pages/jornadas/DetalleJornadaEquipo';
import DebugEndpoints from './components/pages/jornadas/DebugEndpoints';
import { useAuth } from './hooks/useAuth';

// Componente para redirigir usuarios autenticados
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? (
    <Navigate to="/LoggedMenu" replace />
  ) : (
    <>{children}</>
  );
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
              <ProtectedRoute>
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

          {/* Rutas de Administración */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute>
                <UsersCRUD />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/players"
            element={
              <ProtectedRoute>
                <PlayersCRUD />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/clubs"
            element={
              <ProtectedRoute>
                <ClubReadUpdateDelete />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/positions"
            element={
              <ProtectedRoute>
                <CrudPositions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/jornadas"
            element={
              <ProtectedRoute>
                <GestionJornadasAdmin />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/jornadas/:id/detalle"
            element={
              <ProtectedRoute>
                <DetalleJornada />
              </ProtectedRoute>
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
