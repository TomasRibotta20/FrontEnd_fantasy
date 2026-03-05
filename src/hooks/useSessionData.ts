import { useState, useEffect, useCallback } from 'react';

/**
 * Hook para manejar datos de sesión usando localStorage
 * (persiste entre pestañas y sesiones del navegador)
 * Usa eventos personalizados para sincronizar cambios entre componentes
 * de la misma pestaña (ya que StorageEvent solo funciona entre pestañas)
 */
export function useSessionData<T>(
  key: string,
  defaultValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  // Sincronizar con localStorage y disparar evento personalizado
  useEffect(() => {
    try {
      if (value === null || value === undefined) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, JSON.stringify(value));
      }
      // Disparar evento personalizado para notificar a otros componentes en la misma pestaña
      window.dispatchEvent(new CustomEvent('sessionDataChange', { 
        detail: { key, value } 
      }));
    } catch {
      // Error al guardar en localStorage
    }
  }, [key, value]);

  // Escuchar cambios en otras pestañas (StorageEvent)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.storageArea === localStorage) {
        try {
          setValue(e.newValue ? JSON.parse(e.newValue) : defaultValue);
        } catch {
          setValue(defaultValue);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, defaultValue]);

  // Escuchar cambios en la misma pestaña (CustomEvent)
  useEffect(() => {
    const handleSessionDataChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ key: string; value: T }>;
      if (customEvent.detail.key === key) {
        // Solo actualizar si el valor es diferente para evitar loops
        setValue((prev) => {
          const newValue = customEvent.detail.value;
          if (JSON.stringify(prev) !== JSON.stringify(newValue)) {
            return newValue;
          }
          return prev;
        });
      }
    };

    window.addEventListener('sessionDataChange', handleSessionDataChange);
    return () => window.removeEventListener('sessionDataChange', handleSessionDataChange);
  }, [key]);

  const clear = useCallback(() => {
    localStorage.removeItem(key);
    setValue(defaultValue);
  }, [key, defaultValue]);

  return [value, setValue, clear];
}

// Hooks específicos para tu aplicación
export function useTorneoSeleccionado() {
  return useSessionData<string | null>('torneoSeleccionadoId', null);
}

export function useMiEquipoId() {
  return useSessionData<string | null>('miEquipoId', null);
}