import { apiRequest } from "@/services/api";
import type { DashboardStats } from "@/types/dashboard";

// ============================================
// DASHBOARD API SERVICE
// ============================================

/**
 * Obtiene todas las estadísticas consolidadas del dashboard
 */
export const getDashboardStats = async (): Promise<DashboardStats> => {
  const response = await apiRequest<DashboardStats>("/api/dashboard/stats/");
  if (!response.success || !response.data) {
    throw new Error(response.error || "Error al cargar estadísticas del dashboard");
  }
  return response.data;
};
