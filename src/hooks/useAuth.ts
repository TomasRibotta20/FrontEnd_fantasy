import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContextDefinition';
import type { AuthContextType } from '../contexts/AuthContextDefinition';

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};
