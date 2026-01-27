import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
} from '@headlessui/react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import SelectorTorneos from './SelectorTorneos';
import {
  useTorneoSeleccionado,
  useMiEquipoId,
} from '../../hooks/useSessionData';

type NavigationItem = {
  name: string;
  href: string;
  current: boolean;
  requiresTorneo?: boolean;
};

const navigationBase: NavigationItem[] = [
  { name: 'Torneos', href: '/torneos', current: false, requiresTorneo: false },
  { name: 'Equipo', href: '/UpdateTeam', current: false, requiresTorneo: true },
  { name: 'Jornada', href: '/jornadas', current: false, requiresTorneo: false },
  { name: 'Mercado', href: '/mercado', current: false, requiresTorneo: true },
  {
    name: 'Mis Ofertas',
    href: '/mis-ofertas',
    current: false,
    requiresTorneo: false,
  },
];

function classNames(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

export default function NavBar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [torneoIdState] = useState<string | null>(null);
  const [equipoIdState, setEquipoIdState] = useState<string | null>(null);

  // ✅ Usar el hook en lugar de localStorage directamente
  const [torneoGuardadoId] = useTorneoSeleccionado();
  const [miEquipoId, setMiEquipoId] = useMiEquipoId();

  const searchParams = new URLSearchParams(location.search);
  const torneoId =
    torneoGuardadoId || searchParams.get('torneoId') || torneoIdState;
  const equipoId = equipoIdState || searchParams.get('equipoId') || miEquipoId;

  // Obtener el equipoId del torneo seleccionado
  useEffect(() => {
    const fetchEquipoDelTorneo = async () => {
      if (!torneoId || !isAuthenticated) {
        setEquipoIdState(null);
        return;
      }

      try {
        const response = await apiClient.post('/api/torneos/mis-torneos', {});
        const torneos = response.data?.data || response.data || [];
        const torneoActual = torneos.find(
          (t: { torneo_id: number }) => t.torneo_id.toString() === torneoId
        );

        if (torneoActual?.mi_equipo?.id) {
          const equipoIdStr = torneoActual.mi_equipo.id.toString();
          setEquipoIdState(equipoIdStr);
          setMiEquipoId(equipoIdStr); // ✅ Guardar en sessionStorage
        }
      } catch {
        setEquipoIdState(null);
      }
    };

    fetchEquipoDelTorneo();
  }, [torneoId, isAuthenticated, setMiEquipoId]);

  // Generar navegación dinámica con torneoId y equipoId
  const navigation = navigationBase.map((item) => {
    let href = item.href;

    if (item.name === 'Equipo' && equipoId) {
      // Para equipo, agregar equipoId como query param
      href = `${item.href}?equipoId=${equipoId}`;
    } else if (item.name === 'Mercado' && torneoId) {
      // Para mercado, usar torneoId en el path (no query params)
      href = `/mercado/${torneoId}`;
    } else if (item.name === 'Jornada' && torneoId && equipoId) {
      // Para jornadas, agregar tanto torneoId como equipoId
      href = `${item.href}?torneoId=${torneoId}&equipoId=${equipoId}`;
    } else if (item.requiresTorneo && torneoId) {
      // Para otras rutas que requieren torneo, agregar torneoId
      href = `${item.href}?torneoId=${torneoId}`;
    }

    return { ...item, href };
  });

  const handleLogout = () => {
    logout();
    navigate('/');
  };
  return (
    <Disclosure
      as="nav"
      className="fixed top-0 left-0 right-0 z-50 w-full backdrop-blur-lg bg-white/25 border-b-2 border-white/40 shadow-2xl"
    >
      <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
        <div className="relative flex h-16 items-center justify-between">
          {/* Mobile menu button - Solo mostrar si NO es admin */}
          {user?.role !== 'admin' && (
            <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
              <DisclosureButton className="group relative inline-flex items-center justify-center rounded-lg p-2 text-white hover:bg-white/20 hover:text-white focus:ring-2 focus:ring-white/50 focus:outline-hidden transition-all duration-200 border border-white/30">
                <span className="absolute -inset-0.5" />
                <span className="sr-only">Open main menu</span>
                <Bars3Icon
                  aria-hidden="true"
                  className="block size-6 group-data-open:hidden drop-shadow-md"
                />
                <XMarkIcon
                  aria-hidden="true"
                  className="hidden size-6 group-data-open:block drop-shadow-md"
                />
              </DisclosureButton>
            </div>
          )}
          <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
            <div className="flex shrink-0 items-center">
              <button
                onClick={() => {
                  let destination = '/';
                  if (isAuthenticated) {
                    if (user?.role === 'admin' || user?.rol === 'admin') {
                      destination = '/admin';
                    } else {
                      // Redirigir al LoggedMenu con torneoId si existe
                      destination = torneoId
                        ? `/LoggedMenu?torneoId=${torneoId}`
                        : '/LoggedMenu';
                    }
                  }
                  navigate(destination);
                }}
                className="transform transition-all duration-300 hover:scale-110 relative hover:opacity-80 hover:drop-shadow-2xl"
                aria-label="Ir a página principal"
              >
                <img
                  alt="Logo - Ir a inicio"
                  src="./src/assets/Ball_logo.png"
                  className="h-12 w-auto drop-shadow-lg"
                />
              </button>
            </div>
            {/* Solo mostrar navegación si NO es admin */}
            {user?.role !== 'admin' && (
              <div className="hidden sm:ml-6 sm:block">
                <div className="flex space-x-3 items-center h-16">
                  {navigation.map((item) => (
                    <button
                      key={item.name}
                      onClick={() => navigate(item.href)}
                      aria-current={item.current ? 'page' : undefined}
                      className={classNames(
                        item.current
                          ? 'bg-white/30 text-white shadow-xl border-white/50'
                          : 'text-white hover:bg-white/20 hover:text-white border-white/30 hover:border-white/50',
                        'rounded-xl px-5 py-2 text-sm font-bold transition-all duration-200 drop-shadow-md border-2'
                      )}
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Selector de torneos */}
          {isAuthenticated && user?.role !== 'admin' && (
            <div className="hidden sm:flex items-center ml-4">
              <SelectorTorneos />
            </div>
          )}

          <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
            {/* Mostrar botones de login/register si no está autenticado */}
            {!isAuthenticated ? (
              <div className="flex space-x-3">
                <button
                  onClick={() => navigate('/CreateUser')}
                  className="text-white hover:bg-white/20 hover:text-white px-5 py-2 rounded-xl text-sm font-bold transition-all duration-200 border-2 border-white/30 hover:border-white/50 drop-shadow-md"
                >
                  Registrarse
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-5 py-2 rounded-xl text-sm font-bold transition-all duration-200 shadow-xl hover:shadow-2xl border-2 border-white/30 drop-shadow-md"
                >
                  Iniciar Sesión
                </button>
              </div>
            ) : (
              /* Profile dropdown para usuarios autenticados */
              <Menu as="div" className="relative ml-3">
                <div>
                  <MenuButton className="relative flex items-center space-x-2 rounded-full bg-white/25 hover:bg-white/30 pl-1 pr-4 py-1 text-sm focus:outline-hidden focus-visible:ring-2 focus-visible:ring-white/50 transition-all duration-200 border-2 border-white/40 hover:border-white/60 drop-shadow-md">
                    <span className="absolute -inset-1.5" />
                    <span className="sr-only">Open user menu</span>
                    <img
                      alt=""
                      src="https://static.vecteezy.com/system/resources/previews/009/292/244/non_2x/default-avatar-icon-of-social-media-user-vector.jpg"
                      className="size-8 rounded-full border-2 border-white/50 shadow-md"
                    />
                    <span className="text-white font-bold drop-shadow-md">
                      {user?.username}
                    </span>
                  </MenuButton>
                </div>
                <MenuItems
                  transition
                  className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-xl backdrop-blur-lg bg-white/95 py-1 shadow-2xl border-2 border-white/40 transition focus:outline-hidden data-closed:scale-95 data-closed:transform data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in"
                >
                  <MenuItem>
                    <div className="block px-4 py-3 text-sm text-gray-600 border-b border-gray-200 bg-gray-50/50">
                      <p className="font-semibold text-gray-800">
                        {user?.username}
                      </p>
                    </div>
                  </MenuItem>
                  <MenuItem>
                    <a
                      href="#"
                      className="block px-4 py-2.5 text-sm text-gray-700 data-focus:bg-blue-50 data-focus:text-blue-600 data-focus:outline-hidden transition-colors duration-150 font-medium"
                    >
                      Tu Perfil
                    </a>
                  </MenuItem>
                  {user?.role === 'admin' || user?.rol === 'admin' ? (
                    <>
                      <MenuItem>
                        <button
                          onClick={() => navigate('/admin')}
                          className="block w-full text-left px-4 py-2.5 text-sm text-gray-700 data-focus:bg-purple-50 data-focus:text-purple-600 data-focus:outline-hidden transition-colors duration-150 font-medium"
                        >
                          Panel de Administración
                        </button>
                      </MenuItem>
                      <MenuItem>
                        <a
                          href="#"
                          className="block px-4 py-2.5 text-sm text-gray-700 data-focus:bg-blue-50 data-focus:text-blue-600 data-focus:outline-hidden transition-colors duration-150 font-medium"
                        >
                          Configuración
                        </a>
                      </MenuItem>
                    </>
                  ) : null}
                  <MenuItem>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2.5 text-sm text-red-600 data-focus:bg-red-50 data-focus:text-red-700 data-focus:outline-hidden transition-colors duration-150 font-medium border-t border-gray-200"
                    >
                      Cerrar Sesión
                    </button>
                  </MenuItem>
                </MenuItems>
              </Menu>
            )}
          </div>
        </div>
      </div>

      {/* Solo mostrar panel móvil si NO es admin */}
      {user?.role !== 'admin' && (
        <DisclosurePanel className="sm:hidden backdrop-blur-lg bg-white/20 border-t-2 border-white/30">
          <div className="space-y-2 px-3 pt-3 pb-4">
            {navigation.map((item) => (
              <DisclosureButton
                key={item.name}
                as="button"
                onClick={() => navigate(item.href)}
                aria-current={item.current ? 'page' : undefined}
                className={classNames(
                  item.current
                    ? 'bg-white/30 text-white shadow-xl border-white/50'
                    : 'text-white hover:bg-white/20 hover:text-white border-white/30 hover:border-white/50',
                  'block w-full text-left rounded-xl px-4 py-2.5 text-base font-bold transition-all duration-200 drop-shadow-md border-2'
                )}
              >
                {item.name}
              </DisclosureButton>
            ))}
          </div>
        </DisclosurePanel>
      )}
    </Disclosure>
  );
}
