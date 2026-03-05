import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense, useEffect, useRef } from 'react';
import NavBar from './components/navbar/navbar';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import AdminRoute from './components/auth/AdminRoute';
import ErrorBoundary from './components/common/ErrorBoundary';
import { useAuth } from './hooks/useAuth';

import LoadingSpinner from './components/common/LoadingSpinner';

// Componente de carga para Suspense
const PageLoader = () => (
  <LoadingSpinner variant="fullpage" message="Cargando..." />
);

// Páginas principales (carga inmediata)
import LandingPage from './components/pages/landingpage';
import Login from './components/pages/auth/Login';
import CreateUser from './components/pages/register/CreateUser';
import LoggedMenu from './components/pages/LoggedMenu';

// ── Import factories (permiten lazy loading + prefetch) ──────────────

// Páginas secundarias
const importClub = () => import('./components/pages/clubCRUD/ClubName');
const importClubRUD = () =>
  import('./components/pages/clubCRUD/ClubReadUpdateDelete');
const importForgotPassword = () =>
  import('./components/pages/auth/ForgotPassword');
const importNewPassword = () => import('./components/pages/auth/NewPassword');
const importCrudPositions = () =>
  import('./components/pages/posicionesCRUD/CrudPositions');
const importUpdateTeam = () =>
  import('./components/pages/equipoCRUD/UpdateTeam');

// Admin
const importAdminPage = () => import('./components/pages/admin/AdminPage');
const importPlayersCRUD = () =>
  import('./components/pages/playersCRUD/PlayersCRUD');
const importUsersCRUD = () => import('./components/pages/usersCRUD/UsersCRUD');
const importGestionJornadasAdmin = () =>
  import('./components/pages/admin/GestionJornadasAdmin');
const importGestionEquiposAdmin = () =>
  import('./components/pages/admin/GestionEquiposAdmin');
const importGestionTorneosAdmin = () =>
  import('./components/pages/admin/GestionTorneosAdmin');
const importGestionMercadoAdmin = () =>
  import('./components/pages/admin/GestionMercadoAdmin');
const importGestionAutomationAdmin = () =>
  import('./components/pages/admin/GestionAutomationAdmin');

// Jornadas
const importGestionJornadas = () =>
  import('./components/pages/jornadas/GestionJornadas');
const importDetalleJornada = () =>
  import('./components/pages/jornadas/DetalleJornada');
const importJornadasUsuario = () =>
  import('./components/pages/jornadas/JornadasUsuario');
const importMiEquipoJornada = () =>
  import('./components/pages/jornadas/MiEquipoJornada');
const importMisPuntosHistorial = () =>
  import('./components/pages/jornadas/MisPuntosHistorial');
const importDetalleJornadaEquipo = () =>
  import('./components/pages/jornadas/DetalleJornadaEquipo');
const importDebugEndpoints = () =>
  import('./components/pages/jornadas/DebugEndpoints');

// Torneos
const importTorneosUsuario = () =>
  import('./components/pages/torneos/TorneosUsuario');
const importCrearTorneo = () =>
  import('./components/pages/torneos/CrearTorneo');
const importUnirseATorneo = () =>
  import('./components/pages/torneos/UnirseATorneo');
const importDetalleTorneo = () =>
  import('./components/pages/torneos/DetalleTorneo');
const importLeaderboardTorneo = () =>
  import('./components/pages/torneos/LeaderboardTorneo');
const importMercadoUsuario = () =>
  import('./components/pages/torneos/MercadoUsuario');

// Equipo
const importVerEquipoOtroJugador = () =>
  import('./components/pages/equipoCRUD/VerEquipoOtroJugador');
const importGestionOfertas = () =>
  import('./components/pages/equipoCRUD/GestionOfertas');

// Perfil
const importMiPerfil = () => import('./components/pages/perfil/MiPerfil');

// ── Lazy components ──────────────────────────────────────────────────
const Club = lazy(importClub);
const ClubReadUpdateDelete = lazy(importClubRUD);
const ForgotPassword = lazy(importForgotPassword);
const NewPassword = lazy(importNewPassword);
const CrudPositions = lazy(importCrudPositions);
const UpdateTeam = lazy(importUpdateTeam);

const AdminPage = lazy(importAdminPage);
const PlayersCRUD = lazy(importPlayersCRUD);
const UsersCRUD = lazy(importUsersCRUD);
const GestionJornadasAdmin = lazy(importGestionJornadasAdmin);
const GestionEquiposAdmin = lazy(importGestionEquiposAdmin);
const GestionTorneosAdmin = lazy(importGestionTorneosAdmin);
const GestionMercadoAdmin = lazy(importGestionMercadoAdmin);
const GestionAutomationAdmin = lazy(importGestionAutomationAdmin);

const GestionJornadas = lazy(importGestionJornadas);
const DetalleJornada = lazy(importDetalleJornada);
const JornadasUsuario = lazy(importJornadasUsuario);
const MiEquipoJornada = lazy(importMiEquipoJornada);
const MisPuntosHistorial = lazy(importMisPuntosHistorial);
const DetalleJornadaEquipo = lazy(importDetalleJornadaEquipo);
const DebugEndpoints = lazy(importDebugEndpoints);

const TorneosUsuario = lazy(importTorneosUsuario);
const CrearTorneo = lazy(importCrearTorneo);
const UnirseATorneo = lazy(importUnirseATorneo);
const DetalleTorneo = lazy(importDetalleTorneo);
const LeaderboardTorneo = lazy(importLeaderboardTorneo);
const MercadoUsuario = lazy(importMercadoUsuario);

const VerEquipoOtroJugador = lazy(importVerEquipoOtroJugador);
const GestionOfertas = lazy(importGestionOfertas);

const MiPerfil = lazy(importMiPerfil);

// ── Prefetch: descarga en segundo plano las páginas más usadas ──────
function prefetchUserRoutes() {
  const schedule =
    typeof requestIdleCallback === 'function'
      ? requestIdleCallback
      : (cb: () => void) => setTimeout(cb, 200);

  schedule(() => {
    // Páginas principales del usuario (alta prioridad)
    importTorneosUsuario();
    importMercadoUsuario();
    importUpdateTeam();
    importGestionOfertas();
    importDetalleTorneo();
    importJornadasUsuario();
  });

  // Páginas secundarias con un poco más de delay
  setTimeout(() => {
    importLeaderboardTorneo();
    importMiEquipoJornada();
    importDetalleJornada();
    importMisPuntosHistorial();
    importDetalleJornadaEquipo();
    importMiPerfil();
    importCrearTorneo();
    importUnirseATorneo();
    importVerEquipoOtroJugador();
  }, 2000);
}

function prefetchAdminRoutes() {
  setTimeout(() => {
    importAdminPage();
    importPlayersCRUD();
    importUsersCRUD();
    importGestionTorneosAdmin();
    importGestionJornadasAdmin();
    importGestionEquiposAdmin();
    importGestionMercadoAdmin();
  }, 2000);
}

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
  const { logout, isAuthenticated, user } = useAuth();
  const isAuthenticatedRef = useRef(isAuthenticated);

  // Mantener ref actualizada para usarla dentro del event listener
  useEffect(() => {
    isAuthenticatedRef.current = isAuthenticated;
  }, [isAuthenticated]);

  useEffect(() => {
    const handleSessionExpired = () => {
      // Solo redirigir si el usuario estaba autenticado
      // Evita el loop infinito cuando no hay sesión (browser nuevo)
      if (!isAuthenticatedRef.current) {
        return;
      }
      logout();
      window.location.href = '/login';
    };

    window.addEventListener('auth:sessionExpired', handleSessionExpired);
    return () => {
      window.removeEventListener('auth:sessionExpired', handleSessionExpired);
    };
  }, [logout]);

  // Prefetch de rutas cuando el usuario está autenticado
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    const isAdmin = user.role === 'admin' || user.rol === 'admin';
    if (isAdmin) {
      prefetchAdminRoutes();
    }
    prefetchUserRoutes();
  }, [isAuthenticated, user]);

  return null;
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
            <Route path="/new-password/:resetToken" element={<NewPassword />} />
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
            <Route
              path="/admin/automation"
              element={
                <AdminRoute>
                  <GestionAutomationAdmin />
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
              path="/mercado"
              element={
                <ProtectedRoute requireTeam={false}>
                  <Navigate to="/torneos" replace />
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
