import { apiRequest } from "./api";
import type {
  Vehiculo,
  VehiculoFormData,
  VehiculoFilters,
  PaginatedVehiculosResponse,
} from "@/types/vehiculos";

/**
 * API Service para el módulo de Vehículos
 */

export const vehiculosApi = {
  /**
   * Obtener lista de vehículos con paginación y filtros
   */
  async getAll(filters?: VehiculoFilters): Promise<PaginatedVehiculosResponse> {
    const params = new URLSearchParams();

    if (filters?.search) params.append("search", filters.search);
    if (filters?.tipo) params.append("tipo", filters.tipo);
    if (filters?.estado) params.append("estado", filters.estado);
    if (filters?.residente)
      params.append("residente", filters.residente.toString());
    if (filters?.unidad) params.append("unidad", filters.unidad.toString());
    if (filters?.page) params.append("page", filters.page.toString());
    if (filters?.page_size)
      params.append("page_size", filters.page_size.toString());

    const queryString = params.toString();
    const url = `/api/vehiculos/${queryString ? `?${queryString}` : ""}`;

    const response = await apiRequest<PaginatedVehiculosResponse>(url, {
      method: "GET",
    });

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || "Error al obtener vehículos");
  },

  /**
   * Obtener un vehículo por ID
   */
  async getById(id: number): Promise<Vehiculo> {
    const response = await apiRequest<Vehiculo>(`/api/vehiculos/${id}/`, {
      method: "GET",
    });

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || "Error al obtener vehículo");
  },

  /**
   * Crear un nuevo vehículo
   */
  async create(data: VehiculoFormData): Promise<Vehiculo> {
    const response = await apiRequest<Vehiculo>("/api/vehiculos/", {
      method: "POST",
      body: data,
    });

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || "Error al crear vehículo");
  },

  /**
   * Actualizar un vehículo existente
   */
  async update(id: number, data: Partial<VehiculoFormData>): Promise<Vehiculo> {
    const response = await apiRequest<Vehiculo>(`/api/vehiculos/${id}/`, {
      method: "PATCH",
      body: data,
    });

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || "Error al actualizar vehículo");
  },

  /**
   * Eliminar un vehículo
   */
  async delete(id: number): Promise<void> {
    const response = await apiRequest<void>(`/api/vehiculos/${id}/`, {
      method: "DELETE",
    });

    if (!response.success) {
      throw new Error(response.error || "Error al eliminar vehículo");
    }
  },

  /**
   * Cambiar el estado de un vehículo
   */
  async changeStatus(id: number, estado: string): Promise<Vehiculo> {
    const response = await apiRequest<Vehiculo>(`/api/vehiculos/${id}/`, {
      method: "PATCH",
      body: { estado },
    });

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || "Error al cambiar estado del vehículo");
  },
};
