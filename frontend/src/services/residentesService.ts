import { apiRequest } from './api';
import type { 
  Residente, 
  ResidenteFormData, 
  ResidenteFilters, 
  PaginatedResponse, 
  ApiResponse,
  ResidenteOption 
} from '@/types';

// Mappers para convertir entre formatos del frontend y backend
const toDTO = (data: ResidenteFormData) => {
  // Validar formato de fecha
  let fechaFormateada;
  if (data.fecha_ingreso) {
    // Manejar tanto objetos Date como strings
    fechaFormateada = data.fecha_ingreso instanceof Date
      ? data.fecha_ingreso.toISOString().split('T')[0] 
      : data.fecha_ingreso;
  }
  
  // Crear DTO base sin el campo usuario
  const dto: Record<string, any> = {
    nombre: data.nombre,
    apellido: data.apellido,
    ci: data.ci,
    email: data.email,
    telefono: data.telefono,
    unidad_habitacional: data.unidad_habitacional,
    tipo: data.tipo,
    fecha_ingreso: fechaFormateada,
    estado: data.estado || 'en_proceso',
  };
  
  // Agregar usuario sólo si tiene un valor válido
  if (data.usuario !== null && data.usuario !== undefined) {
    dto.usuario = data.usuario;
  }
  
  // No incluir foto_perfil en el DTO - se enviará por FormData
  
  return dto;
};

const fromDTO = (data: any): Residente => ({
  id: data.id,
  nombre: data.nombre,
  apellido: data.apellido,
  ci: data.ci,
  email: data.email,
  telefono: data.telefono,
  // Campos específicos de Residente
  unidad_habitacional: data.unidad_habitacional,
  tipo: data.tipo,
  fecha_ingreso: data.fecha_ingreso,
  estado: data.estado,
  fecha_creacion: data.fecha_creacion,
  fecha_actualizacion: data.fecha_actualizacion,
  usuario: data.usuario,
  foto_perfil: data.foto_perfil || null,
  // Campos del usuario relacionado
  username: data.username,
  // Campos calculados/derivados
  nombre_completo: data.nombre_completo,
  puede_acceder: data.puede_acceder || false,
  estado_usuario: data.estado_usuario || 'sin_usuario',
});

export const residentesApi = {
  // Listar residentes con filtros y paginación
  async list(filters?: ResidenteFilters): Promise<ApiResponse<PaginatedResponse<Residente>>> {
    const params = new URLSearchParams();
    
    if (filters?.search) params.append('search', filters.search);
    if (filters?.estado) params.append('estado', filters.estado);
    if (filters?.tipo) params.append('tipo', filters.tipo);
    // Solo enviar el filtro si es válido
    if (
      filters?.unidad_habitacional &&
      filters.unidad_habitacional !== 'all' &&
      filters.unidad_habitacional !== ''
    ) {
      params.append('unidad_habitacional', filters.unidad_habitacional);
    }
    
    const query = params.toString();
    const response = await apiRequest(`/api/residentes/${query ? `?${query}` : ''}`);
    
    if (response.success && response.data) {
      const data = response.data as any;
      return {
        success: true,
        data: {
          count: data.count,
          next: data.next,
          previous: data.previous,
          results: data.results.map(fromDTO),
        },
      };
    }
    
    return response as ApiResponse<PaginatedResponse<Residente>>;
  },

  // Obtener residente por ID
  async get(id: number): Promise<ApiResponse<Residente>> {
    const response = await apiRequest(`/api/residentes/${id}/`);
    
    if (response.success && response.data) {
      return {
        success: true,
        data: fromDTO(response.data),
      };
    }
    
    return response as ApiResponse<Residente>;
  },

  // Crear nuevo residente
  async create(data: ResidenteFormData): Promise<ApiResponse<Residente>> {
    const dto = toDTO(data);
    
    // Si hay foto, usar FormData para multipart/form-data
    if (data.foto_perfil) {
      const formData = new FormData();
      
      // Agregar campos del DTO al FormData
      Object.keys(dto).forEach(key => {
        if (dto[key] !== null && dto[key] !== undefined) {
          formData.append(key, dto[key]);
        }
      });
      
      // Agregar archivo de foto
      formData.append('foto_perfil', data.foto_perfil);
      
      const response = await apiRequest('/api/residentes/', {
        method: 'POST',
        body: formData,
        // No enviar Content-Type header, el navegador lo configurará automáticamente
        headers: {
          // Eliminar Content-Type para que el navegador agregue boundary
        },
      });
      
      if (response.success && response.data) {
        return {
          success: true,
          data: fromDTO(response.data),
        };
      }
      
      return response as ApiResponse<Residente>;
    }
    
    // Sin foto, usar JSON normal
    const response = await apiRequest('/api/residentes/', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
    
    if (response.success && response.data) {
      return {
        success: true,
        data: fromDTO(response.data),
      };
    }
    
    return response as ApiResponse<Residente>;
  },

  // Actualizar residente
  async update(id: number, data: ResidenteFormData): Promise<ApiResponse<Residente>> {
    const dto = toDTO(data);
    
    // Si hay foto (y es un archivo File, no una URL string), usar FormData para multipart/form-data
    if (data.foto_perfil && data.foto_perfil instanceof File) {
      const formData = new FormData();
      
      // Agregar campos del DTO al FormData (EXCEPTO foto_perfil)
      Object.keys(dto).forEach(key => {
        // Excluir foto_perfil del DTO porque lo agregaremos como File después
        if (key === 'foto_perfil') return;
        
        const value = dto[key];
        if (value !== null && value !== undefined) {
          // Convertir a string si es necesario
          formData.append(key, typeof value === 'string' ? value : String(value));
        }
      });
      
      // Agregar archivo de foto como File (no como string)
      formData.append('foto_perfil', data.foto_perfil);
      
      const response = await apiRequest(`/api/residentes/${id}/`, {
        method: 'PUT',
        body: formData,
        headers: {
          // Eliminar Content-Type para que el navegador agregue boundary
        },
      });
      
      if (response.success && response.data) {
        return {
          success: true,
          data: fromDTO(response.data),
        };
      }
      
      return response as ApiResponse<Residente>;
    }
    
    // Sin foto nueva, usar JSON normal con PUT
    const response = await apiRequest(`/api/residentes/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
    
    if (response.success && response.data) {
      return {
        success: true,
        data: fromDTO(response.data),
      };
    }
    
    return response as ApiResponse<Residente>;
  },

  // Eliminar residente
  async remove(id: number): Promise<ApiResponse> {
    return apiRequest(`/api/residentes/${id}/`, {
      method: 'DELETE',
    });
  },

  // Obtener residentes disponibles para autocompletado
  async getAvailable(): Promise<ApiResponse<ResidenteOption[]>> {
    const response = await apiRequest('/api/residentes/disponibles_para_usuario/');
    
    if (response.success && response.data) {
      const data = response.data as any;
      return {
        success: true,
        data: data.map((item: any) => ({
          id: item.id,
          nombre: item.nombre,
          apellido: item.apellido,
          email: item.email,
          ci: item.ci,
          telefono: item.telefono,
          unidad_habitacional: item.unidad_habitacional,
        })),
      };
    }
    
    return response as ApiResponse<ResidenteOption[]>;
  },

  // Obtener residentes por unidad habitacional
  async getByUnidad(unidad: string): Promise<ApiResponse<Residente[]>> {
    const response = await apiRequest(`/api/residentes/por_unidad/?unidad=${unidad}`);
    
    if (response.success && response.data) {
      const data = response.data as any;
      return {
        success: true,
        data: data.map(fromDTO),
      };
    }
    
    return response as ApiResponse<Residente[]>;
  },

  // Obtener estadísticas
  async getStatistics(): Promise<ApiResponse<{
    total: number;
    activos: number;
    inactivos: number;
    suspendidos: number;
    en_proceso: number;
    por_tipo: Record<string, number>;
    nuevos_este_mes: number;
  }>> {
    return apiRequest('/api/residentes/estadisticas/');
  },
};
