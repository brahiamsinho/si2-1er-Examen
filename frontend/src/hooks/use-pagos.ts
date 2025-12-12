import { useState, useCallback } from "react";
import { toast } from "sonner";
import { expensasApi } from "@/services/pagos.api";
import type { PaginatedResponse } from "@/types";
import type {
  Expensa,
  ExpensaListItem,
  ExpensaCreateData,
  RegistrarPagoData,
  GenerarMasivoData,
  EstadisticasExpensas,
  UnidadMorosa,
  ExpensaFilters,
} from "@/types/pagos";

export function usePagos() {
  const [data, setData] = useState<PaginatedResponse<ExpensaListItem>>({
    results: [],
    count: 0,
    next: null,
    previous: null,
    current_page: 1,
  });
  const [selectedItem, setSelectedItem] = useState<Expensa | null>(null);
  const [estadisticas, setEstadisticas] = useState<EstadisticasExpensas | null>(
    null
  );
  const [morosidad, setMorosidad] = useState<UnidadMorosa[]>([]);

  const [loading, setLoading] = useState(true); // Cambiar a true para mostrar loading inicial
  const [error, setError] = useState<string | null>(null);

  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isGenerarMasivoModalOpen, setIsGenerarMasivoModalOpen] =
    useState(false);
  const [isRegistrarPagoModalOpen, setIsRegistrarPagoModalOpen] =
    useState(false);
  const [isComprobanteModalOpen, setIsComprobanteModalOpen] = useState(false);
  const [isMorosidadModalOpen, setIsMorosidadModalOpen] = useState(false);

  const [filters, setFilters] = useState<ExpensaFilters>({
    page: 1,
    page_size: 10,
    search: "",
    estado: "",
    periodo: "",
    unidad: "",
    vencidas: false,
  });

  const loadData = useCallback(
    async (page = 1, pageSize = 10) => {
      setLoading(true);
      setError(null);
      try {
        const params: any = { page, page_size: pageSize };
        if (filters.search) params.search = filters.search;
        if (filters.estado) params.estado = filters.estado;
        if (filters.periodo) params.periodo = filters.periodo;
        if (filters.unidad) params.unidad = filters.unidad;
        if (filters.vencidas) params.vencidas = filters.vencidas;

        const response = await expensasApi.list(params);
        setData(response);
      } catch (err: any) {
        setError(err.message || "Error al cargar expensas");
        toast.error("Error al cargar expensas");
      } finally {
        setLoading(false);
      }
    },
    [filters]
  );

  const loadItem = useCallback(async (id: number) => {
    try {
      const item = await expensasApi.get(id);
      setSelectedItem(item);
    } catch (err: any) {
      toast.error("Error al cargar expensa");
    }
  }, []);

  const createItem = useCallback(
    async (formData: ExpensaCreateData): Promise<boolean> => {
      try {
        await expensasApi.create(formData);
        toast.success("Expensa creada exitosamente");
        return true;
      } catch (err: any) {
        toast.error(err.message || "Error al crear expensa");
        return false;
      }
    },
    []
  );

  const updateItem = useCallback(
    async (
      id: number,
      formData: Partial<ExpensaCreateData>
    ): Promise<boolean> => {
      try {
        await expensasApi.update(id, formData);
        toast.success("Expensa actualizada exitosamente");
        return true;
      } catch (err: any) {
        toast.error(err.message || "Error al actualizar expensa");
        return false;
      }
    },
    []
  );

  const deleteItem = useCallback(async (): Promise<boolean> => {
    if (!selectedItem) return false;
    try {
      await expensasApi.delete(selectedItem.id);
      toast.success("Expensa eliminada exitosamente");
      return true;
    } catch (err: any) {
      toast.error(err.message || "Error al eliminar expensa");
      return false;
    }
  }, [selectedItem]);

  const generarMasivo = useCallback(
    async (formData: GenerarMasivoData): Promise<boolean> => {
      try {
        const response = await expensasApi.generarMasivo(formData);
        toast.success(response.message);
        return true;
      } catch (err: any) {
        toast.error(err.message || "Error al generar expensas");
        return false;
      }
    },
    []
  );

  const registrarPago = useCallback(
    async (
      expensaId: number,
      formData: RegistrarPagoData
    ): Promise<boolean> => {
      try {
        await expensasApi.registrarPago(expensaId, formData);
        toast.success("Pago registrado exitosamente");
        return true;
      } catch (err: any) {
        toast.error(err.message || "Error al registrar pago");
        return false;
      }
    },
    []
  );

  const loadEstadisticas = useCallback(async (periodo?: string) => {
    try {
      const stats = await expensasApi.estadisticas(periodo);
      setEstadisticas(stats);
    } catch (err: any) {
      toast.error("Error al cargar estadísticas");
    }
  }, []);

  const loadMorosidad = useCallback(async () => {
    try {
      const data = await expensasApi.reporteMorosidad();
      setMorosidad(data);
    } catch (err: any) {
      toast.error("Error al cargar reporte de morosidad");
    }
  }, []);

  const openStoreModal = useCallback((item?: Expensa) => {
    if (item) {
      setSelectedItem(item);
    }
    setIsStoreModalOpen(true);
  }, []);

  const closeStoreModal = useCallback(() => {
    setIsStoreModalOpen(false);
    setSelectedItem(null);
  }, []);

  const openDeleteModal = useCallback((item: Expensa) => {
    setSelectedItem(item);
    setIsDeleteModalOpen(true);
  }, []);

  const closeDeleteModal = useCallback(() => {
    setIsDeleteModalOpen(false);
    setSelectedItem(null);
  }, []);

  const openGenerarMasivoModal = useCallback(() => {
    setIsGenerarMasivoModalOpen(true);
  }, []);

  const closeGenerarMasivoModal = useCallback(() => {
    setIsGenerarMasivoModalOpen(false);
  }, []);

  const openRegistrarPagoModal = useCallback((item: Expensa) => {
    setSelectedItem(item);
    setIsRegistrarPagoModalOpen(true);
  }, []);

  const closeRegistrarPagoModal = useCallback(() => {
    setIsRegistrarPagoModalOpen(false);
    setSelectedItem(null);
  }, []);

  const openComprobanteModal = useCallback((item: Expensa) => {
    setSelectedItem(item);
    setIsComprobanteModalOpen(true);
  }, []);

  const closeComprobanteModal = useCallback(() => {
    setIsComprobanteModalOpen(false);
    setSelectedItem(null);
  }, []);

  const openMorosidadModal = useCallback(() => {
    setIsMorosidadModalOpen(true);
    loadMorosidad();
  }, [loadMorosidad]);

  const closeMorosidadModal = useCallback(() => {
    setIsMorosidadModalOpen(false);
  }, []);

  return {
    data,
    selectedItem,
    estadisticas,
    morosidad,
    loading,
    error,
    filters,
    setFilters,
    isStoreModalOpen,
    isDeleteModalOpen,
    isGenerarMasivoModalOpen,
    isRegistrarPagoModalOpen,
    isComprobanteModalOpen,
    isMorosidadModalOpen,
    loadData,
    loadItem,
    createItem,
    updateItem,
    deleteItem,
    generarMasivo,
    registrarPago,
    loadEstadisticas,
    loadMorosidad,
    openStoreModal,
    closeStoreModal,
    openDeleteModal,
    closeDeleteModal,
    openGenerarMasivoModal,
    closeGenerarMasivoModal,
    openRegistrarPagoModal,
    closeRegistrarPagoModal,
    openComprobanteModal,
    closeComprobanteModal,
    openMorosidadModal,
    closeMorosidadModal,
  };
}
