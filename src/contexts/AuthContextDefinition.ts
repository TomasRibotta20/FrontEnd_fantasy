import { createContext } from 'react';

interface User {
  id: number;
  username: string;
  email: string;
  role?: string;
  rol?: string; // Backend envía "rol" en español
}

export interface AuthContextType {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export type { User };
