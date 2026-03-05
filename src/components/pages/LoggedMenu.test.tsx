import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import LoggedMenu from './LoggedMenu';
import { MemoryRouter } from 'react-router-dom';
import apiClient from '../../services/apiClient';

// ═══ Mocks ═══

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../services/apiClient');

vi.mock('../../services/torneosService', () => ({
  obtenerDetalleTorneo: vi.fn(),
}));

vi.mock('../common/FormacionEquipoCompacta', () => ({
  default: () => <div data-testid="formacion-equipo">Formación del Equipo</div>,
}));

vi.mock('../common/WidgetPuntos', () => ({
  default: () => <div data-testid="widget-puntos">Widget de Puntos</div>,
}));

// Mock useSessionData hooks - por defecto sin torneo seleccionado
const mockSetTorneoId = vi.fn();
const mockSetEquipoId = vi.fn();
const mockClearTorneo = vi.fn();
const mockClearEquipo = vi.fn();
let mockTorneoId: string | null = null;

vi.mock('../../hooks/useSessionData', () => ({
  useTorneoSeleccionado: () => [mockTorneoId, mockSetTorneoId, mockClearTorneo],
  useMiEquipoId: () => [null, mockSetEquipoId, mockClearEquipo],
}));

// ═══ Tests ═══

describe('LoggedMenu Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTorneoId = null;
    // Por defecto, la llamada POST a mis-torneos falla (sin torneos)
    vi.mocked(apiClient.post).mockRejectedValue(new Error('No torneos'));
    vi.mocked(apiClient.get).mockRejectedValue(new Error('No data'));
  });

  // ─── Renderizado básico ───

  it('should render the welcome title', () => {
    render(
      <MemoryRouter>
        <LoggedMenu />
      </MemoryRouter>,
    );

    expect(screen.getByText('Bienvenido a TurboFantasy')).toBeInTheDocument();
  });

  it('should render all menu cards', () => {
    render(
      <MemoryRouter>
        <LoggedMenu />
      </MemoryRouter>,
    );

    expect(screen.getAllByText('Mi Equipo').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Jornadas y Puntos')).toBeInTheDocument();
    expect(screen.getByText('Mercado')).toBeInTheDocument();
    expect(screen.getByText('Mi Perfil')).toBeInTheDocument();
    expect(screen.getByText('Torneos')).toBeInTheDocument();
    expect(screen.getByText('Leaderboard')).toBeInTheDocument();
  });

  it('should show "Seleccioná un torneo" label on disabled menu cards when no torneo is selected', () => {
    render(
      <MemoryRouter>
        <LoggedMenu/>
      </MemoryRouter>,
    );

    // Cards that require torneoId show this label
    const labels = screen.getAllByText('Seleccioná un torneo');
    expect(labels.length).toBeGreaterThanOrEqual(1);
  });

  it('should render WidgetPuntos component', () => {
    render(
      <MemoryRouter>
        <LoggedMenu />
      </MemoryRouter>,
    );

    expect(screen.getByTestId('widget-puntos')).toBeInTheDocument();
  });

  // ─── Sin equipo ───

  it('should display "no team" message when user has no team data', async () => {
    render(
      <MemoryRouter>
        <LoggedMenu />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(
        screen.getByText('Unite a un torneo para tener tu equipo'),
      ).toBeInTheDocument();
    });
  });

  // ─── Con torneo activo ───

  it('should fetch team players when a torneo activo is found', async () => {
    // Simular que no hay torneoId guardado, así el componente busca torneos activos
    const mockTorneosResponse = {
      data: {
        data: [
          {
            torneo_id: 5,
            estado: 'ACTIVO',
            mi_equipo: { id: 10 },
          },
        ],
      },
    };

    const mockEquipoResponse = {
      data: {
        data: {
          id: 10,
          nombre: 'Mi Equipo Test',
          jugadores: [
            {
              id: 1,
              jugador: {
                id: 1,
                id_api: 100,
                nombre: 'L. Messi',
                nombre_completo: 'Lionel Messi',
                foto: 'messi.jpg',
                edad: 36,
                nacionalidad: 'Argentina',
                numero_camiseta: 10,
                posicion: { id: 4, descripcion: 'Delantero' },
              },
              es_titular: true,
            },
          ],
        },
      },
    };

    vi.mocked(apiClient.post).mockResolvedValueOnce(mockTorneosResponse);
    vi.mocked(apiClient.get).mockResolvedValueOnce(mockEquipoResponse);

    render(
      <MemoryRouter>
        <LoggedMenu />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('formacion-equipo')).toBeInTheDocument();
    });

    // Verifica que se guardó el torneoId
    expect(mockSetTorneoId).toHaveBeenCalledWith('5');
  });

  it('should call detalle-equipo endpoint with the correct equipoId', async () => {
    const mockTorneosResponse = {
      data: {
        data: [
          {
            torneo_id: 5,
            estado: 'ACTIVO',
            mi_equipo: { id: 10 },
          },
        ],
      },
    };

    const mockEquipoResponse = {
      data: {
        data: {
          id: 10,
          nombre: 'Mi Equipo Test',
          jugadores: [],
        },
      },
    };

    vi.mocked(apiClient.post).mockResolvedValueOnce(mockTorneosResponse);
    vi.mocked(apiClient.get).mockResolvedValueOnce(mockEquipoResponse);

    render(
      <MemoryRouter>
        <LoggedMenu />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith(
        '/api/equipos/detalle-equipo/10',
      );
    });
  });

  // ─── Navegación ───

  it('should navigate when clicking an enabled menu card', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <LoggedMenu />
      </MemoryRouter>,
    );

    // "Jornadas y Puntos" is always enabled (enabled: true)
    const jornadasCard = screen
      .getByText('Ver tus puntos y estadísticas')
      .closest('.group');

    if (jornadasCard) {
      await user.click(jornadasCard);
      expect(mockNavigate).toHaveBeenCalledWith('/jornadas');
    }
  });

  it('should NOT navigate when clicking a disabled menu card', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <LoggedMenu />
      </MemoryRouter>,
    );

    // "Mi Equipo" is disabled when no torneoId
    const miEquipoCard = screen
      .getByText('Gestiona tu equipo y alineación')
      .closest('.group');

    if (miEquipoCard) {
      await user.click(miEquipoCard);
      expect(mockNavigate).not.toHaveBeenCalled();
    }
  });

  // ─── Historial de puntajes ───

  it('should fetch historial when team is loaded', async () => {
    const mockTorneosResponse = {
      data: {
        data: [
          {
            torneo_id: 5,
            estado: 'ACTIVO',
            mi_equipo: { id: 10 },
          },
        ],
      },
    };

    const mockEquipoResponse = {
      data: {
        data: {
          id: 10,
          nombre: 'Mi Equipo Test',
          jugadores: [
            {
              id: 1,
              jugador: {
                id: 1,
                id_api: 100,
                nombre: 'Test Player',
                nombre_completo: 'Test Player Full',
                foto: 'photo.jpg',
                edad: 25,
                nacionalidad: 'AR',
                numero_camiseta: 10,
                posicion: { id: 4, descripcion: 'Delantero' },
              },
              es_titular: true,
            },
          ],
        },
      },
    };

    const mockHistorialResponse = {
      data: [
        {
          jornada: { id: 5 },
          jugadores: [{ id: 1, name: 'Test Player', puntaje: 8.5 }],
        },
      ],
    };

    vi.mocked(apiClient.post).mockResolvedValueOnce(mockTorneosResponse);
    vi.mocked(apiClient.get)
      .mockResolvedValueOnce(mockEquipoResponse) // detalle-equipo
      .mockResolvedValueOnce(mockHistorialResponse); // historial

    render(
      <MemoryRouter>
        <LoggedMenu />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith('/api/equipos/10/historial');
    });
  });

  it('should handle errors gracefully when fetching torneos fails', async () => {
    vi.mocked(apiClient.post).mockRejectedValueOnce(new Error('Network error'));

    render(
      <MemoryRouter>
        <LoggedMenu />
      </MemoryRouter>,
    );

    // Should still render without crashing
    await waitFor(() => {
      expect(screen.getByText('Bienvenido a TurboFantasy')).toBeInTheDocument();
      expect(
        screen.getByText('Unite a un torneo para tener tu equipo'),
      ).toBeInTheDocument();
    });
  });
});
