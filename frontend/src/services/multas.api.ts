import { apiRequest } from "./api";
import type {
  Multa,
  MultaListItem,
  MultaCreateData,
  MultaUpdateData,
  MarcarPagadoData,
  CancelarMultaData,
  EstadisticasMultas,
  MultaFilters,
  MultasResidenteResumen,
  PaginatedResponse,
  ApiResponse,
} from "@/types";

// Mappers para convertir entre formatos del frontend y backend
const toDTO = (data: MultaCreateData | MultaUpdateData) => {
  // Validar y formatear fecha de vencimiento
  let fechaFormateada: string | undefined;
  if ("fecha_vencimiento" in data && data.fecha_vencimiento) {
    fechaFormateada =
      data.fecha_vencimiento instanceof Date
        ? data.fecha_vencimiento.toISOString().split("T")[0]
        : data.fecha_vencimiento;
  }

  // Crear DTO base
  const dto: Record<string, any> = {
    ...data,
    fecha_vencimiento: fechaFormateada,
    // Convertir monto a string si es number
    monto: typeof data.monto === "number" ? data.monto.toString() : data.monto,
  };

  // Limpiar campos undefined
  Object.keys(dto).forEach((key) => {
    if (dto[key] === undefined) {
      delete dto[key];
    }
  });

  return dto;
};

const fromDTO = (data: any): Multa => ({
  id: data.id,
  tipo: data.tipo,
  tipo_display: data.tipo_display,
  descripcion: data.descripcion,
  monto: data.monto,
  recargo_mora: data.recargo_mora || "0.00",
  monto_total: data.monto_total,

  residente: data.residente,
  residente_nombre: data.residente_nombre,
  residente_detalle: data.residente_detalle,

  unidad: data.unidad,
  unidad_nombre: data.unidad_nombre,
  unidad_detalle: data.unidad_detalle,

  estado: data.estado,
  estado_display: data.estado_display,
  fecha_emision: data.fecha_emision,
  fecha_vencimiento: data.fecha_vencimiento,
  fecha_pago: data.fecha_pago,
  esta_vencida: data.esta_vencida || false,
  dias_vencimiento: data.dias_vencimiento || 0,

  observaciones: data.observaciones || "",
  creado_por: data.creado_por || "",

  fecha_creacion: data.fecha_creacion,
  fecha_actualizacion: data.fecha_actualizacion,
});

const fromListDTO = (data: any): MultaListItem => ({
  id: data.id,
  tipo: data.tipo,
  tipo_display: data.tipo_display,
  descripcion: data.descripcion,
  monto: data.monto,
  monto_total: data.monto_total,
  residente: data.residente,
  residente_nombre: data.residente_nombre,
  unidad: data.unidad,
  unidad_nombre: data.unidad_nombre,
  estado: data.estado,
  estado_display: data.estado_display,
  fecha_emision: data.fecha_emision,
  fecha_vencimiento: data.fecha_vencimiento,
  esta_vencida: data.esta_vencida || false,
});

export const multasApi = {
  // Listar multas con filtros y paginación
  async list(
    filters?: MultaFilters
  ): Promise<ApiResponse<PaginatedResponse<MultaListItem>>> {
    const params = new URLSearchParams();

    if (filters?.search) params.append("search", filters.search);
    if (filters?.residente)
      params.append("residente", String(filters.residente));
    if (filters?.unidad && filters.unidad !== "all" && filters.unidad !== "") {
      params.append("unidad", String(filters.unidad));
    }
    if (filters?.tipo && filters.tipo !== "all")
      params.append("tipo", filters.tipo);
    if (filters?.estado && filters.estado !== "all")
      params.append("estado", filters.estado);
    if (filters?.año) params.append("año", String(filters.año));
    if (filters?.mes) params.append("mes", String(filters.mes));
    if (filters?.vencidas) params.append("vencidas", "true");

    const query = params.toString();
    const response = await apiRequest(
      `/api/multas/${query ? `?${query}` : ""}`
    );

    if (response.success && response.data) {
      const data = response.data as any;
      return {
        success: true,
        data: {
          count: data.count,
          next: data.next,
          previous: data.previous,
          results: Array.isArray(data.results)
            ? data.results.map(fromListDTO)
            : [],
        },
      };
    }

    return response as ApiResponse<PaginatedResponse<MultaListItem>>;
  },

  // Obtener una multa por ID
  async get(id: number): Promise<ApiResponse<Multa>> {
    const response = await apiRequest(`/api/multas/${id}/`);

    if (response.success && response.data) {
      return {
        success: true,
        data: fromDTO(response.data),
      };
    }

    return response as ApiResponse<Multa>;
  },

  // Crear una nueva multa
  async create(data: MultaCreateData): Promise<ApiResponse<Multa>> {
    const dto = toDTO(data);
    const response = await apiRequest("/api/multas/", {
      method: "POST",
      body: JSON.stringify(dto),
    });

    if (response.success && response.data) {
      return {
        success: true,
        data: fromDTO(response.data),
      };
    }

    return response as ApiResponse<Multa>;
  },

  // Actualizar una multa existente
  async update(id: number, data: MultaUpdateData): Promise<ApiResponse<Multa>> {
    const dto = toDTO(data);
    const response = await apiRequest(`/api/multas/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(dto),
    });

    if (response.success && response.data) {
      return {
        success: true,
        data: fromDTO(response.data),
      };
    }

    return response as ApiResponse<Multa>;
  },

  // Eliminar una multa
  async delete(id: number): Promise<ApiResponse<void>> {
    return await apiRequest(`/api/multas/${id}/`, {
      method: "DELETE",
    });
  },

  // Obtener multas pendientes
  async pendientes(
    filters?: MultaFilters
  ): Promise<ApiResponse<MultaListItem[]>> {
    const params = new URLSearchParams();
    if (filters?.residente)
      params.append("residente", String(filters.residente));
    if (filters?.unidad) params.append("unidad", String(filters.unidad));

    const query = params.toString();
    const response = await apiRequest(
      `/api/multas/pendientes/${query ? `?${query}` : ""}`
    );

    if (response.success && response.data) {
      return {
        success: true,
        data: Array.isArray(response.data)
          ? response.data.map(fromListDTO)
          : [],
      };
    }

    return response as ApiResponse<MultaListItem[]>;
  },

  // Obtener multas vencidas
  async vencidas(
    filters?: MultaFilters
  ): Promise<ApiResponse<MultaListItem[]>> {
    const params = new URLSearchParams();
    if (filters?.residente)
      params.append("residente", String(filters.residente));
    if (filters?.unidad) params.append("unidad", String(filters.unidad));

    const query = params.toString();
    const response = await apiRequest(
      `/api/multas/vencidas/${query ? `?${query}` : ""}`
    );

    if (response.success && response.data) {
      return {
        success: true,
        data: Array.isArray(response.data)
          ? response.data.map(fromListDTO)
          : [],
      };
    }

    return response as ApiResponse<MultaListItem[]>;
  },

  // Marcar multa como pagada
  async marcarPagado(
    id: number,
    data?: MarcarPagadoData
  ): Promise<ApiResponse<Multa>> {
    const response = await apiRequest(`/api/multas/${id}/marcar_pagado/`, {
      method: "POST",
      body: JSON.stringify(data || {}),
    });

    if (response.success && response.data) {
      return {
        success: true,
        data: fromDTO(response.data),
      };
    }

    return response as ApiResponse<Multa>;
  },

  // Cancelar multa
  async cancelar(
    id: number,
    data: CancelarMultaData
  ): Promise<ApiResponse<Multa>> {
    const response = await apiRequest(`/api/multas/${id}/cancelar/`, {
      method: "POST",
      body: JSON.stringify(data),
    });

    if (response.success && response.data) {
      return {
        success: true,
        data: fromDTO(response.data),
      };
    }

    return response as ApiResponse<Multa>;
  },

  // Obtener estadísticas
  async estadisticas(
    filters?: MultaFilters
  ): Promise<ApiResponse<EstadisticasMultas>> {
    const params = new URLSearchParams();
    if (filters?.año) params.append("año", String(filters.año));
    if (filters?.mes) params.append("mes", String(filters.mes));
    if (filters?.residente)
      params.append("residente", String(filters.residente));

    const query = params.toString();
    const response = await apiRequest(
      `/api/multas/estadisticas/${query ? `?${query}` : ""}`
    );

    return response as ApiResponse<EstadisticasMultas>;
  },

  // Obtener multas de un residente específico con resumen
  async porResidente(
    residenteId: number
  ): Promise<ApiResponse<MultasResidenteResumen>> {
    const response = await apiRequest(
      `/api/multas/por_residente/?residente=${residenteId}`
    );

    return response as ApiResponse<MultasResidenteResumen>;
  },
};
