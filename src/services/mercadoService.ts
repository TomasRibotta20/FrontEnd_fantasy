import apiClient from './apiClient';

// Tipos para Mercado
export interface Jugador {
  id: number;
  nombre: string;
  nombreCompleto?: string;
  foto?: string;
  club?: string;
  clubLogo?: string;
  posicion?: string;
  precio_actual?: number;
  puntos_totales?: number;
}

export interface ItemMercado {
  id: number;
  jugador: Jugador;
  cantidad_pujas: number;
}

export interface MercadoActivo {
  id: number;
  numero_mercado: number;
  fecha_apertura: string;
  estado: 'ACTIVO' | 'ABIERTO' | 'CERRADO';
  items: ItemMercado[];
}

export interface Mercado {
  id: number;
  torneo_id: number;
  estado: 'ACTIVO' | 'ABIERTO' | 'CERRADO';
  fecha_inicio: string;
  fecha_fin?: string;
}

// Servicios para Usuario
export const obtenerMercadoActivo = async (torneoId: number): Promise<MercadoActivo> => {
  const response = await apiClient.get(`/api/mercado/activo/torneo/${torneoId}`);
  // La respuesta viene envuelta en { data: {...} }
  return response.data.data || response.data;
};

// Servicios para Admin
export const listarMercadosPorTorneo = async (torneoId: number): Promise<Mercado[]> => {
  try {
    // Intentar primero con el endpoint de mercado activo
    const response = await apiClient.get(`/api/mercado/activo/torneo/${torneoId}`);
    const mercadoActivo = response.data?.data || response.data;
    
        // Si hay mercado activo, mapearlo a la interfaz Mercado
    if (mercadoActivo && mercadoActivo.id) {
      const mercado: Mercado = {
        id: mercadoActivo.id,
        torneo_id: torneoId,
        estado: mercadoActivo.estado,
        fecha_inicio: mercadoActivo.fecha_apertura || mercadoActivo.fecha_inicio,
        fecha_fin: mercadoActivo.fecha_cierre || mercadoActivo.fecha_fin
      };
      
            return [mercado];
    }
    
    return [];
  } catch (error) {
    const err = error as { response?: { status?: number } };
        // Si no hay mercado activo, devolver array vacío
    if (err.response?.status === 404) {
      return [];
    }
    throw error;
  }
};

export const habilitarMercado = async (torneoId: number): Promise<Mercado> => {
  const response = await apiClient.post(`/api/mercado/abrir`, { torneoId });
  return response.data;
};

export const cerrarMercado = async (mercadoId: number): Promise<void> => {
    const response = await apiClient.post(`/api/mercado/${mercadoId}/cerrar`);
    return response.data;
};

export const obtenerDetalleMercado = async (mercadoId: number): Promise<Mercado> => {
  const response = await apiClient.get(`/api/mercado/${mercadoId}`);
  return response.data;
};

export interface PujaData {
  itemMercadoId: number;
  monto: number;
}

export const realizarPuja = async (equipoId: number, pujaData: PujaData) => {
  const response = await apiClient.post(`/api/mercado-puja/equipo/${equipoId}/ofertar`, pujaData);
  return response.data;
};

// Obtener mi equipo en un torneo
export interface MiJugador {
  id: number;
  nombre: string;
  nombreCompleto?: string;
  firstname?: string;
  lastname?: string;
  foto?: string;
  photo?: string;
  club?: string;
  clubLogo?: string;
  posicion?: string;
  position?: string | { id: number; description: string };
  precio_actual?: number;
  puntos_totales?: number;
  es_titular: boolean;
  age?: number;
  nationality?: string;
  height?: string;
  weight?: string;
  jerseyNumber?: number;
}

export const obtenerMiEquipoEnTorneo = async (equipoId?: number) => {
  const endpoint = equipoId 
    ? `/api/equipos/detalle-equipo/${equipoId}` 
    : '/api/equipos/detalle-equipo';
  const response = await apiClient.get(endpoint);
  const equipoData = response.data?.data || response.data;
  
  // Mapear la estructura del backend a nuestra interfaz
  // El backend envía campos en español: primer_nombre, apellido, nombre, foto, etc.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const jugadoresMapeados = equipoData.jugadores.map((item: any) => {
    const jugador = item.jugador || item;
    
    // Construir nombre completo (campos en español del backend)
    const firstname = jugador.primer_nombre || jugador.firstname || '';
    const lastname = jugador.apellido || jugador.lastname || '';
    const nombreCompleto = firstname && lastname 
      ? `${firstname} ${lastname}`.trim()
      : firstname || lastname || jugador.nombre || jugador.name || 'Jugador';
    
    // Extraer posición (puede venir como objeto con descripcion)
    let posicion = 'N/A';
    const posicionData = jugador.posicion || jugador.position;
    if (posicionData) {
      if (typeof posicionData === 'object' && posicionData.descripcion) {
        posicion = posicionData.descripcion;
      } else if (typeof posicionData === 'object' && posicionData.description) {
        posicion = posicionData.description;
      } else if (typeof posicionData === 'string') {
        posicion = posicionData;
      }
    }
    
    return {
      id: jugador.id,
      nombre: jugador.nombre || jugador.name || nombreCompleto,
      nombreCompleto,
      firstname: firstname,
      lastname: lastname,
      foto: jugador.foto || jugador.photo,
      photo: jugador.foto || jugador.photo,
      club: jugador.club?.nombre || jugador.club?.name || jugador.clubName,
      clubLogo: jugador.club?.logo || jugador.clubLogo,
      posicion,
      position: posicionData,
      precio_actual: jugador.precio_actual || jugador.precio,
      puntos_totales: jugador.puntaje || jugador.puntos_totales,
      es_titular: item.es_titular || false,
      age: jugador.edad || jugador.age,
      nationality: jugador.nacionalidad || jugador.nationality,
      height: jugador.altura || jugador.height,
      weight: jugador.peso || jugador.weight,
      jerseyNumber: jugador.numero_camiseta || jugador.jerseyNumber
    };
  });
  
  return {
    id: equipoData.id,
    jugadores: jugadoresMapeados
  };
};

export interface VenderJugadorData {
  jugadorId: number;
}

export const venderJugador = async (equipoId: number, data: VenderJugadorData) => {
  const response = await apiClient.post(`/api/equipos/mi-equipo/${equipoId}/vender-jugador`, data);
  return response.data;
};

// Tipos para Mis Pujas
export interface MiPuja {
  id: number;
  monto: number;
  fecha_oferta: string;
  estado: string;
  precio_referencia: number;
  jugador?: Jugador;
  mercado?: any;
  item_mercado?: {
    id: number;
    jugador: Jugador;
  };
}

// Obtener mis pujas activas
export const obtenerMisPujas = async (equipoId: number): Promise<MiPuja[]> => {
  const response = await apiClient.get(`/api/mercado-puja/equipo/${equipoId}/mis-ofertas`);
  
  // El backend devuelve en response.data.data
  let pujas: MiPuja[] = [];
  
  if (response.data?.data && Array.isArray(response.data.data)) {
    pujas = response.data.data;
  } else if (Array.isArray(response.data)) {
    pujas = response.data;
  }
  
    return pujas;
};

// Cancelar una puja
export const cancelarPuja = async (pujaId: number) => {
  const response = await apiClient.delete(`/api/mercado-puja/puja/${pujaId}/cancelar`);
  return response.data;
};

