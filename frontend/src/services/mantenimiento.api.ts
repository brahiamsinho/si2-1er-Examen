/**
 * API Service para Mantenimiento
 */
import { apiRequest } from './api';
import type {
  TareaMantenimiento,
  TareaMantenimientoCreate,
  TareaMantenimientoUpdate,
  AsignarTareaPayload,
  IniciarTareaPayload,
  CompletarTareaPayload,
  CancelarTareaPayload,
  EstadisticasMantenimiento,
  MantenimientoFilters,
  MaterialInsumo,
  RegistroMantenimiento
} from '@/types/mantenimiento';

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

const BASE_URL = '/api/mantenimiento/tareas';

/**
 * Servicio para gestionar tareas de mantenimiento
 */
export const mantenimientoApi = {
  /**
   * Listar tareas con filtros y paginación
   */
  async list(params?: MantenimientoFilters & { page?: number; page_size?: number }): Promise<PaginatedResponse<TareaMantenimiento>> {
    // Limpiar parámetros 'all'
    const cleanParams = params ? { ...params } : {};
    if (cleanParams.tipo === 'all') delete cleanParams.tipo;
    if (cleanParams.estado === 'all') delete cleanParams.estado;
    if (cleanParams.prioridad === 'all') delete cleanParams.prioridad;
    if (cleanParams.personal_asignado === 'all') delete cleanParams.personal_asignado;
    if (cleanParams.area_comun === 'all') delete cleanParams.area_comun;

    const queryString = new URLSearchParams(cleanParams as any).toString();
    const url = queryString ? `${BASE_URL}/?${queryString}` : `${BASE_URL}/`;
    
    const response = await apiRequest<PaginatedResponse<TareaMantenimiento>>(url);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Error al cargar tareas');
    }
    return response.data;
  },

  /**
   * Obtener detalle de una tarea
   */
  async get(id: number): Promise<TareaMantenimiento> {
    const response = await apiRequest<TareaMantenimiento>(`${BASE_URL}/${id}/`);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Error al cargar tarea');
    }
    return response.data;
  },

  /**
   * Crear nueva tarea
   */
  async create(data: TareaMantenimientoCreate): Promise<TareaMantenimiento> {
    const response = await apiRequest<TareaMantenimiento>(BASE_URL + '/', { method: 'POST', body: data });
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Error al crear tarea');
    }
    return response.data;
  },

  /**
   * Actualizar tarea existente
   */
  async update(id: number, data: TareaMantenimientoUpdate): Promise<TareaMantenimiento> {
    const response = await apiRequest<TareaMantenimiento>(`${BASE_URL}/${id}/`, { method: 'PATCH', body: data });
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Error al actualizar tarea');
    }
    return response.data;
  },

  /**
   * Eliminar tarea
   */
  async delete(id: number): Promise<void> {
    const response = await apiRequest<void>(`${BASE_URL}/${id}/`, { method: 'DELETE' });
    if (!response.success) {
      throw new Error(response.error || 'Error al eliminar tarea');
    }
  },

  /**
   * ACCIÓN: Asignar tarea a personal
   */
  async asignar(id: number, data: AsignarTareaPayload): Promise<TareaMantenimiento> {
    const response = await apiRequest<TareaMantenimiento>(`${BASE_URL}/${id}/asignar/`, { method: 'POST', body: data });
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Error al asignar tarea');
    }
    return response.data;
  },

  /**
   * ACCIÓN: Iniciar trabajo en tarea
   */
  async iniciar(id: number, data: IniciarTareaPayload = {}): Promise<TareaMantenimiento> {
    const response = await apiRequest<TareaMantenimiento>(`${BASE_URL}/${id}/iniciar/`, { method: 'POST', body: data });
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Error al iniciar tarea');
    }
    return response.data;
  },

  /**
   * ACCIÓN: Completar tarea
   */
  async completar(id: number, data: CompletarTareaPayload = {}): Promise<TareaMantenimiento> {
    const response = await apiRequest<TareaMantenimiento>(`${BASE_URL}/${id}/completar/`, { method: 'POST', body: data });
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Error al completar tarea');
    }
    return response.data;
  },

  /**
   * ACCIÓN: Cancelar tarea
   */
  async cancelar(id: number, data: CancelarTareaPayload): Promise<TareaMantenimiento> {
    const response = await apiRequest<TareaMantenimiento>(`${BASE_URL}/${id}/cancelar/`, { method: 'POST', body: data });
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Error al cancelar tarea');
    }
    return response.data;
  },

  /**
   * Obtener estadísticas generales
   */
  async estadisticas(): Promise<EstadisticasMantenimiento> {
    const response = await apiRequest<EstadisticasMantenimiento>(`${BASE_URL}/estadisticas/`);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Error al cargar estadísticas');
    }
    return response.data;
  },

  /**
   * Agregar material/insumo a una tarea
   */
  async agregarMaterial(tareaId: number, data: Omit<MaterialInsumo, 'id' | 'tarea' | 'costo_total'>): Promise<MaterialInsumo> {
    const response = await apiRequest<MaterialInsumo>('/api/mantenimiento/materiales/', { method: 'POST', body: { ...data, tarea: tareaId } });
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Error al agregar material');
    }
    return response.data;
  },

  /**
   * Agregar registro al historial de una tarea
   */
  async agregarRegistro(tareaId: number, data: Omit<RegistroMantenimiento, 'id' | 'tarea' | 'fecha_registro' | 'realizado_por'>): Promise<RegistroMantenimiento> {
    const response = await apiRequest<RegistroMantenimiento>('/api/mantenimiento/registros/', { method: 'POST', body: { ...data, tarea: tareaId } });
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Error al agregar registro');
    }
    return response.data;
  },
};
