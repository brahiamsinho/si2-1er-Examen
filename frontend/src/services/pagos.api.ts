import { apiRequest } from "@/services/api";
import type { PaginatedResponse } from "@/types";
import type {
  Expensa,
  ExpensaListItem,
  ExpensaCreateData,
  RegistrarPagoData,
  GenerarMasivoData,
  EstadisticasExpensas,
  UnidadMorosa,
  ComprobanteData,
  ConceptoPagoInput,
} from "@/types/pagos";
import { format } from "date-fns";

// ============================================
// DTO MAPPERS
// ============================================

const toDTO = (
  data: ExpensaCreateData | GenerarMasivoData | RegistrarPagoData
): any => {
  const dto: any = { ...data };

  // Convertir Dates a strings ISO
  if ("fecha_emision" in dto && dto.fecha_emision instanceof Date) {
    dto.fecha_emision = format(dto.fecha_emision, "yyyy-MM-dd");
  }
  if ("fecha_vencimiento" in dto && dto.fecha_vencimiento instanceof Date) {
    dto.fecha_vencimiento = format(dto.fecha_vencimiento, "yyyy-MM-dd");
  }
  if ("fecha_pago" in dto && dto.fecha_pago instanceof Date) {
    dto.fecha_pago = dto.fecha_pago.toISOString();
  }

  // Convertir números a strings para decimales
  if ("monto_base" in dto && typeof dto.monto_base === "number") {
    dto.monto_base = dto.monto_base.toFixed(2);
  }
  if ("monto_adicional" in dto && typeof dto.monto_adicional === "number") {
    dto.monto_adicional = dto.monto_adicional.toFixed(2);
  }
  if ("monto" in dto && typeof dto.monto === "number") {
    dto.monto = dto.monto.toFixed(2);
  }

  // Convertir conceptos
  if ("conceptos" in dto && dto.conceptos) {
    dto.conceptos = dto.conceptos.map((c: ConceptoPagoInput) => ({
      descripcion: c.descripcion,
      monto: typeof c.monto === "number" ? c.monto.toFixed(2) : c.monto,
      tipo: c.tipo,
    }));
  }

  return dto;
};

const fromDTO = (dto: any): Expensa => {
  return {
    ...dto,
    conceptos: dto.conceptos || [],
    pagos: dto.pagos || [],
  };
};

const fromListDTO = (dto: any): ExpensaListItem => {
  return { ...dto };
};

// ============================================
// API METHODS
// ============================================

export const expensasApi = {
  /**
   * Listar expensas con paginación y filtros
   */
  async list(params?: {
    page?: number;
    page_size?: number;
    search?: string;
    estado?: string;
    periodo?: string;
    unidad?: number;
    vencidas?: boolean;
  }): Promise<PaginatedResponse<ExpensaListItem>> {
    const queryParams = new URLSearchParams();

    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.page_size)
      queryParams.append("page_size", params.page_size.toString());
    if (params?.search) queryParams.append("search", params.search);
    if (params?.estado) queryParams.append("estado", params.estado);
    if (params?.periodo) queryParams.append("periodo", params.periodo);
    if (params?.unidad) queryParams.append("unidad", params.unidad.toString());
    if (params?.vencidas !== undefined)
      queryParams.append("vencidas", params.vencidas.toString());

    const query = queryParams.toString();
    const response = await apiRequest<PaginatedResponse<any>>(
      `/api/pagos/expensas/${query ? `?${query}` : ""}`
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || "Error al cargar expensas");
    }

    return {
      ...response.data,
      results: response.data.results.map(fromListDTO),
    };
  },

  /**
   * Obtener una expensa por ID
   */
  async get(id: number): Promise<Expensa> {
    const response = await apiRequest<any>(`/api/pagos/expensas/${id}/`);
    if (!response.success || !response.data) {
      throw new Error(response.error || "Error al cargar expensa");
    }
    return fromDTO(response.data);
  },

  /**
   * Crear una nueva expensa
   */
  async create(data: ExpensaCreateData): Promise<Expensa> {
    const dto = toDTO(data);
    const response = await apiRequest<any>("/api/pagos/expensas/", {
      method: "POST",
      body: dto,
    });
    if (!response.success || !response.data) {
      throw new Error(response.error || "Error al crear expensa");
    }
    return fromDTO(response.data);
  },

  /**
   * Actualizar una expensa
   */
  async update(id: number, data: Partial<ExpensaCreateData>): Promise<Expensa> {
    const dto = toDTO(data as ExpensaCreateData);
    const response = await apiRequest<any>(`/api/pagos/expensas/${id}/`, {
      method: "PATCH",
      body: dto,
    });
    if (!response.success || !response.data) {
      throw new Error(response.error || "Error al actualizar expensa");
    }
    return fromDTO(response.data);
  },

  /**
   * Eliminar una expensa
   */
  async delete(id: number): Promise<void> {
    const response = await apiRequest<void>(`/api/pagos/expensas/${id}/`, {
      method: "DELETE",
    });
    if (!response.success) {
      throw new Error(response.error || "Error al eliminar expensa");
    }
  },

  /**
   * Generar expensas masivas para un periodo
   */
  async generarMasivo(
    data: GenerarMasivoData
  ): Promise<{ message: string; periodo: string; cantidad: number }> {
    const dto = toDTO(data);
    const response = await apiRequest<{
      message: string;
      periodo: string;
      cantidad: number;
    }>("/api/pagos/expensas/generar_masivo/", { method: "POST", body: dto });
    if (!response.success || !response.data) {
      throw new Error(response.error || "Error al generar expensas");
    }
    return response.data;
  },

  /**
   * Registrar un pago para una expensa
   */
  async registrarPago(
    expensaId: number,
    data: RegistrarPagoData
  ): Promise<{ message: string; pago: any; expensa: Expensa }> {
    const dto = toDTO(data);
    const response = await apiRequest<{
      message: string;
      pago: any;
      expensa: any;
    }>(`/api/pagos/expensas/${expensaId}/registrar_pago/`, {
      method: "POST",
      body: dto,
    });
    if (!response.success || !response.data) {
      throw new Error(response.error || "Error al registrar pago");
    }
    return {
      ...response.data,
      expensa: fromDTO(response.data.expensa),
    };
  },

  /**
   * Obtener datos para comprobante de expensa
   */
  async comprobante(expensaId: number): Promise<ComprobanteData> {
    const response = await apiRequest<ComprobanteData>(
      `/api/pagos/expensas/${expensaId}/comprobante/`
    );
    if (!response.success || !response.data) {
      throw new Error(response.error || "Error al cargar comprobante");
    }
    return response.data;
  },

  /**
   * Obtener reporte de morosidad
   */
  async reporteMorosidad(): Promise<UnidadMorosa[]> {
    const response = await apiRequest<UnidadMorosa[]>(
      "/api/pagos/expensas/reporte_morosidad/"
    );
    if (!response.success || !response.data) {
      throw new Error(response.error || "Error al cargar reporte de morosidad");
    }
    return response.data;
  },

  /**
   * Obtener estadísticas de expensas
   */
  async estadisticas(periodo?: string): Promise<EstadisticasExpensas> {
    const params = periodo ? `?periodo=${periodo}` : "";
    const response = await apiRequest<EstadisticasExpensas>(
      `/api/pagos/expensas/estadisticas/${params}`
    );
    if (!response.success || !response.data) {
      throw new Error(response.error || "Error al cargar estadísticas");
    }
    return response.data;
  },
};
