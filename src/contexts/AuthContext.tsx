import React, { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { AuthContext } from './AuthContextDefinition';
import type { AuthContextType, User } from './AuthContextDefinition';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Verificar si hay una sesión guardada al iniciar la app
  useEffect(() => {
    const savedUser = localStorage.getItem('authUser');

    if (savedUser && savedUser !== 'undefined' && savedUser !== 'null') {
      try {
        const parsedUser = JSON.parse(savedUser);
        // Verificar que parsedUser es un objeto válido
        if (
          parsedUser &&
          typeof parsedUser === 'object' &&
          parsedUser.id &&
          parsedUser.username
        ) {
          setUser(parsedUser);
        } else {
          localStorage.removeItem('authUser');
        }
      } catch (error) {
        console.error(
          'Error al parsear los datos del usuario guardados:',
          error
        );
        localStorage.removeItem('authUser');
      }
    }
    setIsLoading(false);
  }, []);

  const login = (userData: User) => {
    console.log('Intentando login con:', { userData });

    if (!userData) {
      console.error('userData es null o undefined');
      return;
    }
    if (!userData.id && userData.id !== 0) {
      console.error('userData.id está faltando:', userData);
      return;
    }
    if (!userData.username) {
      console.error('userData.username está faltando:', userData);
      return;
    }

    setUser(userData);

    // Solo guardar datos del usuario en localStorage (la cookie maneja la autenticación)
    try {
      localStorage.setItem('authUser', JSON.stringify(userData));
    } catch (error) {
      console.error('Error al guardar datos del usuario:', error);
    }
  };

  const logout = async () => {
    setUser(null);
    localStorage.removeItem('authUser');

    // Hacer request al backend para limpiar la cookie
    try {
      await fetch('http://localhost:3000/api/auth/logout', {
        method: 'POST',
        credentials: 'include', // Importante para incluir cookies
      });
    } catch (error) {
      console.error('Error al hacer logout en el servidor:', error);
    }
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
