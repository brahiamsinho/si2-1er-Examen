import { useState, useCallback } from "react";
import { toast } from "sonner";
import { multasApi } from "@/services/multas.api";
import type {
  Multa,
  MultaListItem,
  MultaCreateData,
  MultaUpdateData,
  MarcarPagadoData,
  CancelarMultaData,
  MultaFilters,
  EstadisticasMultas,
  PaginatedResponse,
} from "@/types";

interface UseMultasState {
  data: PaginatedResponse<MultaListItem> | null;
  loading: boolean;
  error: string | null;
  selectedItem: Multa | null;
  isStoreModalOpen: boolean;
  isDeleteModalOpen: boolean;
  isPayModalOpen: boolean;
  isCancelModalOpen: boolean;
  filters: MultaFilters;
  estadisticas: EstadisticasMultas | null;
  multasPendientes: number;
  multasVencidas: number;
  multasPagadas: number;
}

interface UseMultasActions {
  // Data operations
  loadData: (filters?: MultaFilters) => Promise<void>;
  loadItem: (id: number) => Promise<void>;
  createItem: (data: MultaCreateData) => Promise<boolean>;
  updateItem: (id: number, data: MultaUpdateData) => Promise<boolean>;
  deleteItem: (id: number) => Promise<boolean>;
  marcarPagado: (id: number, data?: MarcarPagadoData) => Promise<boolean>;
  cancelarMulta: (id: number, data: CancelarMultaData) => Promise<boolean>;

  // UI state management
  openStoreModal: (item?: Multa) => void;
  closeStoreModal: () => void;
  openDeleteModal: (item: Multa) => void;
  closeDeleteModal: () => void;
  openPayModal: (item: Multa) => void;
  closePayModal: () => void;
  openCancelModal: (item: Multa) => void;
  closeCancelModal: () => void;
  setFilters: (filters: MultaFilters) => void;
  clearError: () => void;

  // Utility functions
  loadEstadisticas: (filters?: MultaFilters) => Promise<void>;
  loadPendientes: (filters?: MultaFilters) => Promise<void>;
  loadVencidas: (filters?: MultaFilters) => Promise<void>;
}

export function useMultas(): UseMultasState & UseMultasActions {
  const [state, setState] = useState<UseMultasState>({
    data: null,
    loading: false,
    error: null,
    selectedItem: null,
    isStoreModalOpen: false,
    isDeleteModalOpen: false,
    isPayModalOpen: false,
    isCancelModalOpen: false,
    filters: {},
    estadisticas: null,
    multasPendientes: 0,
    multasVencidas: 0,
    multasPagadas: 0,
  });

  const loadData = useCallback(async (filters?: MultaFilters) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await multasApi.list(filters);

      if (response.success && response.data) {
        const multasPendientes =
          response.data.results?.filter((m) => m.estado === "pendiente")
            .length || 0;
        const multasVencidas =
          response.data.results?.filter(
            (m) => m.esta_vencida && m.estado === "pendiente"
          ).length || 0;
        const multasPagadas =
          response.data.results?.filter((m) => m.estado === "pagado").length ||
          0;

        setState((prev) => ({
          ...prev,
          data: response.data!,
          loading: false,
          filters: filters || prev.filters,
          multasPendientes,
          multasVencidas,
          multasPagadas,
        }));
      } else {
        throw new Error(response.error || "Error al cargar las multas");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Error desconocido";
      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      toast.error(errorMessage);
    }
  }, []);

  const loadItem = useCallback(async (id: number) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await multasApi.get(id);

      if (response.success && response.data) {
        setState((prev) => ({
          ...prev,
          selectedItem: response.data!,
          loading: false,
        }));
      } else {
        throw new Error(response.error || "Error al cargar la multa");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Error desconocido";
      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      toast.error(errorMessage);
    }
  }, []);

  const createItem = useCallback(
    async (data: MultaCreateData): Promise<boolean> => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const response = await multasApi.create(data);

        if (response.success) {
          setState((prev) => ({ ...prev, loading: false }));
          toast.success("Multa creada exitosamente");
          await loadData(state.filters);
          return true;
        } else {
          throw new Error(response.error || "Error al crear la multa");
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Error desconocido";
        setState((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));
        toast.error(errorMessage);
        return false;
      }
    },
    [state.filters, loadData]
  );

  const updateItem = useCallback(
    async (id: number, data: MultaUpdateData): Promise<boolean> => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const response = await multasApi.update(id, data);

        if (response.success) {
          setState((prev) => ({ ...prev, loading: false }));
          toast.success("Multa actualizada exitosamente");
          await loadData(state.filters);
          return true;
        } else {
          throw new Error(response.error || "Error al actualizar la multa");
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Error desconocido";
        setState((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));
        toast.error(errorMessage);
        return false;
      }
    },
    [state.filters, loadData]
  );

  const deleteItem = useCallback(
    async (id: number): Promise<boolean> => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const response = await multasApi.delete(id);

        if (response.success) {
          setState((prev) => ({ ...prev, loading: false }));
          toast.success("Multa eliminada exitosamente");
          await loadData(state.filters);
          return true;
        } else {
          throw new Error(response.error || "Error al eliminar la multa");
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Error desconocido";
        setState((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));
        toast.error(errorMessage);
        return false;
      }
    },
    [state.filters, loadData]
  );

  const marcarPagado = useCallback(
    async (id: number, data?: MarcarPagadoData): Promise<boolean> => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const response = await multasApi.marcarPagado(id, data);

        if (response.success) {
          setState((prev) => ({ ...prev, loading: false }));
          toast.success("Multa marcada como pagada");
          await loadData(state.filters);
          return true;
        } else {
          throw new Error(
            response.error || "Error al marcar la multa como pagada"
          );
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Error desconocido";
        setState((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));
        toast.error(errorMessage);
        return false;
      }
    },
    [state.filters, loadData]
  );

  const cancelarMulta = useCallback(
    async (id: number, data: CancelarMultaData): Promise<boolean> => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const response = await multasApi.cancelar(id, data);

        if (response.success) {
          setState((prev) => ({ ...prev, loading: false }));
          toast.success("Multa cancelada exitosamente");
          await loadData(state.filters);
          return true;
        } else {
          throw new Error(response.error || "Error al cancelar la multa");
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Error desconocido";
        setState((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));
        toast.error(errorMessage);
        return false;
      }
    },
    [state.filters, loadData]
  );

  const loadEstadisticas = useCallback(async (filters?: MultaFilters) => {
    try {
      const response = await multasApi.estadisticas(filters);

      if (response.success && response.data) {
        setState((prev) => ({
          ...prev,
          estadisticas: response.data!,
        }));
      }
    } catch (error) {
      console.error("Error al cargar estadísticas:", error);
    }
  }, []);

  const loadPendientes = useCallback(async (filters?: MultaFilters) => {
    try {
      const response = await multasApi.pendientes(filters);

      if (response.success && response.data) {
        setState((prev) => ({
          ...prev,
          multasPendientes: response.data?.length || 0,
        }));
      }
    } catch (error) {
      console.error("Error al cargar multas pendientes:", error);
    }
  }, []);

  const loadVencidas = useCallback(async (filters?: MultaFilters) => {
    try {
      const response = await multasApi.vencidas(filters);

      if (response.success && response.data) {
        setState((prev) => ({
          ...prev,
          multasVencidas: response.data?.length || 0,
        }));
      }
    } catch (error) {
      console.error("Error al cargar multas vencidas:", error);
    }
  }, []);

  const openStoreModal = useCallback((item?: Multa) => {
    setState((prev) => ({
      ...prev,
      isStoreModalOpen: true,
      selectedItem: item || null,
    }));
  }, []);

  const closeStoreModal = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isStoreModalOpen: false,
      selectedItem: null,
    }));
  }, []);

  const openDeleteModal = useCallback((item: Multa) => {
    setState((prev) => ({
      ...prev,
      isDeleteModalOpen: true,
      selectedItem: item,
    }));
  }, []);

  const closeDeleteModal = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isDeleteModalOpen: false,
      selectedItem: null,
    }));
  }, []);

  const openPayModal = useCallback((item: Multa) => {
    setState((prev) => ({
      ...prev,
      isPayModalOpen: true,
      selectedItem: item,
    }));
  }, []);

  const closePayModal = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isPayModalOpen: false,
      selectedItem: null,
    }));
  }, []);

  const openCancelModal = useCallback((item: Multa) => {
    setState((prev) => ({
      ...prev,
      isCancelModalOpen: true,
      selectedItem: item,
    }));
  }, []);

  const closeCancelModal = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isCancelModalOpen: false,
      selectedItem: null,
    }));
  }, []);

  const setFilters = useCallback((filters: MultaFilters) => {
    setState((prev) => ({ ...prev, filters }));
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    loadData,
    loadItem,
    createItem,
    updateItem,
    deleteItem,
    marcarPagado,
    cancelarMulta,
    openStoreModal,
    closeStoreModal,
    openDeleteModal,
    closeDeleteModal,
    openPayModal,
    closePayModal,
    openCancelModal,
    closeCancelModal,
    setFilters,
    clearError,
    loadEstadisticas,
    loadPendientes,
    loadVencidas,
  };
}
