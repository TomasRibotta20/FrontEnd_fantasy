import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';
import NavBar from './components/navbar/navbar';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import AdminRoute from './components/auth/AdminRoute';
import ErrorBoundary from './components/common/ErrorBoundary';
import { useAuth } from './hooks/useAuth';

// Componente de carga para Suspense
const PageLoader = () => (
  <div
    className="min-h-screen flex items-center justify-center"
    style={{
      backgroundImage: "url('/Background_LandingPage.png')",
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }}
  >
    <div className="absolute inset-0 bg-black opacity-40"></div>
    <div className="relative z-10 text-center text-white">
      <div className="animate-spin text-6xl mb-4">●</div>
      <p className="text-xl">Cargando...</p>
    </div>
  </div>
);

// Páginas principales (carga inmediata)
import LandingPage from './components/pages/landingpage';
import Login from './components/pages/auth/Login';
import CreateUser from './components/pages/register/CreateUser';
import LoggedMenu from './components/pages/LoggedMenu';

// Páginas secundarias (lazy loading)
const Club = lazy(() => import('./components/pages/clubCRUD/ClubName'));
const ClubReadUpdateDelete = lazy(
  () => import('./components/pages/clubCRUD/ClubReadUpdateDelete')
);
const ForgotPassword = lazy(
  () => import('./components/pages/auth/ForgotPassword')
);
const NewPassword = lazy(() => import('./components/pages/auth/NewPassword'));
const CrudPositions = lazy(
  () => import('./components/pages/posicionesCRUD/CrudPositions')
);
const UpdateTeam = lazy(
  () => import('./components/pages/equipoCRUD/UpdateTeam')
);

// Admin pages (lazy loading)
const AdminPage = lazy(() => import('./components/pages/admin/AdminPage'));
const PlayersCRUD = lazy(
  () => import('./components/pages/playersCRUD/PlayersCRUD')
);
const UsersCRUD = lazy(() => import('./components/pages/usersCRUD/UsersCRUD'));
const GestionJornadasAdmin = lazy(
  () => import('./components/pages/admin/GestionJornadasAdmin')
);
const GestionEquiposAdmin = lazy(
  () => import('./components/pages/admin/GestionEquiposAdmin')
);
const GestionTorneosAdmin = lazy(
  () => import('./components/pages/admin/GestionTorneosAdmin')
);
const GestionMercadoAdmin = lazy(
  () => import('./components/pages/admin/GestionMercadoAdmin')
);

// Jornadas pages (lazy loading)
const GestionJornadas = lazy(
  () => import('./components/pages/jornadas/GestionJornadas')
);
const DetalleJornada = lazy(
  () => import('./components/pages/jornadas/DetalleJornada')
);
const JornadasUsuario = lazy(
  () => import('./components/pages/jornadas/JornadasUsuario')
);
const MiEquipoJornada = lazy(
  () => import('./components/pages/jornadas/MiEquipoJornada')
);
const MisPuntosHistorial = lazy(
  () => import('./components/pages/jornadas/MisPuntosHistorial')
);
const DetalleJornadaEquipo = lazy(
  () => import('./components/pages/jornadas/DetalleJornadaEquipo')
);
const DebugEndpoints = lazy(
  () => import('./components/pages/jornadas/DebugEndpoints')
);

// Torneos pages (lazy loading)
const TorneosUsuario = lazy(
  () => import('./components/pages/torneos/TorneosUsuario')
);
const CrearTorneo = lazy(
  () => import('./components/pages/torneos/CrearTorneo')
);
const UnirseATorneo = lazy(
  () => import('./components/pages/torneos/UnirseATorneo')
);
const DetalleTorneo = lazy(
  () => import('./components/pages/torneos/DetalleTorneo')
);
const LeaderboardTorneo = lazy(
  () => import('./components/pages/torneos/LeaderboardTorneo')
);
const MercadoUsuario = lazy(
  () => import('./components/pages/torneos/MercadoUsuario')
);

// Equipo pages (lazy loading)
const VerEquipoOtroJugador = lazy(
  () => import('./components/pages/equipoCRUD/VerEquipoOtroJugador')
);
const GestionOfertas = lazy(
  () => import('./components/pages/equipoCRUD/GestionOfertas')
);

// Perfil (lazy loading)
const MiPerfil = lazy(() => import('./components/pages/perfil/MiPerfil'));

// Componente interno que usa useAuth (debe estar DENTRO de AuthProvider)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();

  if (isAuthenticated && user) {
    const redirectPath =
      user.role === 'admin' || user.rol === 'admin' ? '/admin' : '/LoggedMenu';
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
}

// Componente que maneja el listener de sesión expirada (DENTRO de AuthProvider)
function SessionExpirationHandler() {
  const { logout } = useAuth();

  useEffect(() => {
    const handleSessionExpired = () => {
      logout();
      window.location.href = '/login';
    };

    window.addEventListener('auth:sessionExpired', handleSessionExpired);
    return () => {
      window.removeEventListener('auth:sessionExpired', handleSessionExpired);
    };
  }, [logout]);

  return null; // No renderiza nada, solo maneja el evento
}

// Componente con todas las rutas (DENTRO de AuthProvider)
function AppRoutes() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <SessionExpirationHandler />
        <NavBar />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route
              path="/"
              element={
                <PublicRoute>
                  <LandingPage />
                </PublicRoute>
              }
            />
            <Route path="/CreateUser" element={<CreateUser />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/new-password" element={<NewPassword />} />
            <Route
              path="/club"
              element={
                <ProtectedRoute>
                  <Club />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ClubName"
              element={
                <ProtectedRoute>
                  <Club />
                </ProtectedRoute>
              }
            />
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
              path="/home"
              element={
                <ProtectedRoute>
                  <LoggedMenu />
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
                <ProtectedRoute requireTeam={false}>
                  <UpdateTeam />
                </ProtectedRoute>
              }
            />
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
            <Route
              path="/admin/torneos"
              element={
                <AdminRoute>
                  <GestionTorneosAdmin />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/mercado"
              element={
                <AdminRoute>
                  <GestionMercadoAdmin />
                </AdminRoute>
              }
            />

            {/* Rutas de Torneos */}
            <Route
              path="/torneos"
              element={
                <ProtectedRoute requireTeam={false}>
                  <TorneosUsuario />
                </ProtectedRoute>
              }
            />
            <Route
              path="/torneos/crear"
              element={
                <ProtectedRoute requireTeam={false}>
                  <CrearTorneo />
                </ProtectedRoute>
              }
            />
            <Route
              path="/torneos/unirse"
              element={
                <ProtectedRoute requireTeam={false}>
                  <UnirseATorneo />
                </ProtectedRoute>
              }
            />
            <Route
              path="/torneos/:torneoId"
              element={
                <ProtectedRoute requireTeam={false}>
                  <DetalleTorneo />
                </ProtectedRoute>
              }
            />
            <Route
              path="/leaderboard/:torneoId"
              element={
                <ProtectedRoute requireTeam={false}>
                  <LeaderboardTorneo />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ver-equipo"
              element={
                <ProtectedRoute requireTeam={false}>
                  <VerEquipoOtroJugador />
                </ProtectedRoute>
              }
            />
            <Route
              path="/mis-ofertas"
              element={
                <ProtectedRoute requireTeam={false}>
                  <GestionOfertas />
                </ProtectedRoute>
              }
            />
            <Route
              path="/mercado/:torneoId"
              element={
                <ProtectedRoute requireTeam={false}>
                  <MercadoUsuario />
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
            <Route
              path="/perfil"
              element={
                <ProtectedRoute requireTeam={false}>
                  <MiPerfil />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

// Componente principal - AuthProvider envuelve TODO
function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
