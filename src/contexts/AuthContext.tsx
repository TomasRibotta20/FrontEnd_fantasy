import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { ReactNode } from 'react';
import { AuthContext } from './AuthContextDefinition';
import type { AuthContextType, User } from './AuthContextDefinition';
import apiClient from '../services/apiClient';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const refreshIntervalRef = useRef<number | null>(null);

  // Función para verificar la sesión con el backend
  const verifySession = useCallback(async (): Promise<User | null> => {
    try {
      // El backend usa /api/users/profile para obtener el usuario actual
      // basándose en la cookie HttpOnly
      const response = await apiClient.get('/api/users/profile');
      const userData =
        response.data?.data || response.data?.user || response.data;
      if (userData) {
        // Normalizar el campo "rol" del backend a "role" del frontend
        return {
          ...userData,
          role: userData.rol || userData.role,
        };
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  // Función para refrescar el token periódicamente
  const startRefreshTokenInterval = useCallback(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }

    // Refrescar token cada 14 minutos (antes de que expire a los 15 min)
    refreshIntervalRef.current = setInterval(async () => {
      try {
        await apiClient.post('/api/auth/refreshToken');
      } catch {
        // Si falla el refresh, cerrar sesión
        setUser(null);
      }
    }, 14 * 60 * 1000) as unknown as number;
  }, []);

  // Verificar sesión al iniciar la app (en lugar de leer localStorage)
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      const currentUser = await verifySession();
      if (currentUser) {
        setUser(currentUser);
        startRefreshTokenInterval();
      } else {
        // Si no hay sesión válida, limpiar datos del torneo guardados
        localStorage.removeItem('torneoSeleccionadoId');
        localStorage.removeItem('miEquipoId');
        sessionStorage.removeItem('torneoSeleccionadoId');
        sessionStorage.removeItem('miEquipoId');
      }
      setIsLoading(false);
    };

    initAuth();

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [verifySession, startRefreshTokenInterval]);

  const login = useCallback(
    (userData: User) => {
      if (!userData?.id || !userData?.username) {
        return;
      }
      setUser(userData);
      startRefreshTokenInterval();
    },
    [startRefreshTokenInterval]
  );

  const logout = useCallback(async () => {
    // Limpiar intervalo de refresh
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }

    setUser(null);

    // Limpiar datos de sesión del localStorage (donde se guarda el torneo)
    localStorage.removeItem('torneoSeleccionadoId');
    localStorage.removeItem('miEquipoId');
    // También limpiar sessionStorage por si acaso
    sessionStorage.removeItem('torneoSeleccionadoId');
    sessionStorage.removeItem('miEquipoId');

    // Hacer request al backend para limpiar la cookie
    try {
      await apiClient.post('/api/auth/logout');
    } catch {
      // Error al hacer logout en el servidor
    }
  }, []);

  const value: AuthContextType = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
