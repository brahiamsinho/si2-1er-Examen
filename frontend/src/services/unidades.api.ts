import { getUnidades } from "./unidadesService";
import type { PaginatedResponse, Unidad } from "@/types";

/**
 * API client for Unidades module
 * Wrapper around unidadesService to provide a consistent API interface
 */
export const unidadesApi = {
  /**
   * List all unidades with pagination and optional filters
   */
  list: async (
    params: {
      page?: number;
      page_size?: number;
      estado?: string;
      search?: string;
    } = {}
  ): Promise<PaginatedResponse<Unidad>> => {
    const response = await getUnidades(params);
    if (!response.success || !response.data) {
      throw new Error(response.error || "Error cargando unidades");
    }
    return response.data;
  },
};
