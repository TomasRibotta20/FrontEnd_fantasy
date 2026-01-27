import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import LoggedMenu from './LoggedMenu';
import { AuthContext } from '../../contexts/AuthContextDefinition';
import type {
  AuthContextType,
  User,
} from '../../contexts/AuthContextDefinition';
import { MemoryRouter } from 'react-router-dom';
import apiClient from '../../services/apiClient';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../services/apiClient');
vi.mock('../common/FormacionEquipoCompacta', () => ({
  default: () => <div data-testid="formacion-equipo">Formación del Equipo</div>,
}));
vi.mock('../common/WidgetPuntos', () => ({
  default: () => <div data-testid="widget-puntos">Widget de Puntos</div>,
}));

describe('LoggedMenu Component', () => {
  const mockUser: User = {
    id: 1,
    username: 'testuser',
    role: 'admin',
    email: '',
  };

  const mockAuthContext: AuthContextType = {
    user: mockUser,
    login: () => {},
    logout: () => Promise.resolve(),
    isAuthenticated: false,
    isLoading: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the welcome title', () => {
    vi.mocked(apiClient.get).mockRejectedValue(new Error('No team'));

    render(
      <AuthContext.Provider value={mockAuthContext}>
        <MemoryRouter>
          <LoggedMenu />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(screen.getByText('Bienvenido a TurboFantasy')).toBeInTheDocument();
  });

  it('should render all menu cards', () => {
    vi.mocked(apiClient.get).mockRejectedValue(new Error('No team'));

    render(
      <AuthContext.Provider value={mockAuthContext}>
        <MemoryRouter>
          <LoggedMenu />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(screen.getAllByText('Mi Equipo')).toHaveLength(2); // Aparece en el menú y en el título
    expect(screen.getByText('Jornadas y Puntos')).toBeInTheDocument();
    expect(screen.getByText('Mercado')).toBeInTheDocument();
    expect(screen.getByText('Mi Perfil')).toBeInTheDocument();
  });

  it('should show "Pronto" label on disabled menu cards', () => {
    vi.mocked(apiClient.get).mockRejectedValue(new Error('No team'));

    render(
      <AuthContext.Provider value={mockAuthContext}>
        <MemoryRouter>
          <LoggedMenu />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(screen.getByText('Pronto')).toBeInTheDocument();
  });

  it('should display "no team" message when user has no team', async () => {
    vi.mocked(apiClient.get).mockRejectedValue(new Error('No team'));

    render(
      <AuthContext.Provider value={mockAuthContext}>
        <MemoryRouter>
          <LoggedMenu />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(
        screen.getByText('Aún no tienes un equipo creado')
      ).toBeInTheDocument();
    });
  });

  it('should render team players when user has a team', async () => {
    const mockTeamData = {
      data: {
        id: 1,
        nombre: 'Mi Equipo',
        jugadores: [
          {
            id: 1,
            jugador: {
              id: 1,
              apiId: 100,
              name: 'Lionel Messi',
              age: 36,
              nationality: 'Argentina',
              photo: 'messi.jpg',
              jerseyNumber: 10,
              position: 'Forward',
            },
            es_titular: true,
          },
        ],
      },
    };

    vi.mocked(apiClient.get).mockResolvedValueOnce(mockTeamData);

    render(
      <AuthContext.Provider value={mockAuthContext}>
        <MemoryRouter>
          <LoggedMenu />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('formacion-equipo')).toBeInTheDocument();
    });
  });

  it('should render WidgetPuntos component', () => {
    vi.mocked(apiClient.get).mockRejectedValue(new Error('No team'));

    render(
      <AuthContext.Provider value={mockAuthContext}>
        <MemoryRouter>
          <LoggedMenu />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(screen.getByTestId('widget-puntos')).toBeInTheDocument();
  });

  it('should navigate to /CreateTeam when API returns 404', async () => {
    vi.mocked(apiClient.get).mockRejectedValue({ response: { status: 404 } });

    render(
      <AuthContext.Provider value={mockAuthContext}>
        <MemoryRouter>
          <LoggedMenu />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/CreateTeam');
    });
  });

  it('should handle click on enabled menu card', async () => {
    vi.mocked(apiClient.get).mockRejectedValue(new Error('No team'));
    const user = userEvent.setup();

    render(
      <AuthContext.Provider value={mockAuthContext}>
        <MemoryRouter>
          <LoggedMenu />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    // Buscamos específicamente por el texto del menú card usando el texto descriptivo
    const miEquipoCard = screen
      .getByText('Gestiona tu equipo y alineación')
      .closest('div');
    if (miEquipoCard) {
      await user.click(miEquipoCard);
      expect(mockNavigate).toHaveBeenCalledWith('/UpdateTeam');
    }
  });

  it('should fetch team scores from last jornada', async () => {
    const mockTeamData = {
      data: {
        id: 1,
        jugadores: [
          {
            id: 1,
            jugador: {
              id: 1,
              apiId: 100,
              name: 'Test Player',
              age: 25,
              nationality: 'AR',
              photo: '',
              jerseyNumber: 10,
              position: 'F',
            },
            es_titular: true,
          },
        ],
      },
    };

    const mockHistorial = {
      data: [{ jornada: { id: 5 } }],
    };

    const mockDetalle = {
      data: {
        jugadores: [{ id: 1, name: 'Test Player', puntaje: 85 }],
      },
    };

    vi.mocked(apiClient.get)
      .mockResolvedValueOnce(mockTeamData)
      .mockResolvedValueOnce(mockHistorial)
      .mockResolvedValueOnce(mockDetalle);

    render(
      <AuthContext.Provider value={mockAuthContext}>
        <MemoryRouter>
          <LoggedMenu />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith('/api/equipos/mi-equipo');
      expect(apiClient.get).toHaveBeenCalledWith('/api/equipos/1/historial');
      expect(apiClient.get).toHaveBeenCalledWith('/api/equipos/1/jornadas/5');
    });
  });
});
