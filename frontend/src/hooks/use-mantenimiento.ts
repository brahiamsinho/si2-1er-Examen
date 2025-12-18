/**
 * Hook personalizado para gestionar Tareas de Mantenimiento
 */
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { mantenimientoApi, type PaginatedResponse } from '@/services/mantenimiento.api';
import type {
  TareaMantenimiento,
  TareaMantenimientoCreate,
  TareaMantenimientoUpdate,
  AsignarTareaPayload,
  IniciarTareaPayload,
  CompletarTareaPayload,
  CancelarTareaPayload,
  MantenimientoFilters,
  EstadisticasMantenimiento,
} from '@/types/mantenimiento';

interface UseMantenimientoState {
  data: PaginatedResponse<TareaMantenimiento> | null;
  loading: boolean;
  error: string | null;
  selectedItem: TareaMantenimiento | null;
  isStoreModalOpen: boolean;
  isDeleteModalOpen: boolean;
  isAsignarModalOpen: boolean;
  isCompletarModalOpen: boolean;
  isCancelarModalOpen: boolean;
  filters: MantenimientoFilters;
  estadisticas: EstadisticasMantenimiento | null;
  tareasPendientes: number;
  tareasVencidas: number;
  tareasEnProgreso: number;
}

interface UseMantenimientoActions {
  // Data operations
  loadData: (filters?: MantenimientoFilters) => Promise<void>;
  loadItem: (id: number) => Promise<void>;
  createItem: (data: TareaMantenimientoCreate) => Promise<boolean>;
  updateItem: (id: number, data: TareaMantenimientoUpdate) => Promise<boolean>;
  deleteItem: (id: number) => Promise<boolean>;
  
  // Acciones específicas
  asignarTarea: (id: number, data: AsignarTareaPayload) => Promise<boolean>;
  iniciarTarea: (id: number, data?: IniciarTareaPayload) => Promise<boolean>;
  completarTarea: (id: number, data?: CompletarTareaPayload) => Promise<boolean>;
  cancelarTarea: (id: number, data: CancelarTareaPayload) => Promise<boolean>;

  // UI state management
  openStoreModal: (item?: TareaMantenimiento) => void;
  closeStoreModal: () => void;
  openDeleteModal: (item: TareaMantenimiento) => void;
  closeDeleteModal: () => void;
  openAsignarModal: (item: TareaMantenimiento) => void;
  closeAsignarModal: () => void;
  openCompletarModal: (item: TareaMantenimiento) => void;
  closeCompletarModal: () => void;
  openCancelarModal: (item: TareaMantenimiento) => void;
  closeCancelarModal: () => void;
  setFilters: (filters: MantenimientoFilters) => void;
  clearError: () => void;

  // Utility functions
  loadEstadisticas: (filters?: MantenimientoFilters) => Promise<void>;
  changePage: (page: number) => Promise<void>;
}

export function useMantenimiento(): UseMantenimientoState & UseMantenimientoActions {
  const [state, setState] = useState<UseMantenimientoState>({
    data: null,
    loading: false,
    error: null,
    selectedItem: null,
    isStoreModalOpen: false,
    isDeleteModalOpen: false,
    isAsignarModalOpen: false,
    isCompletarModalOpen: false,
    isCancelarModalOpen: false,
    filters: {},
    estadisticas: null,
    tareasPendientes: 0,
    tareasVencidas: 0,
    tareasEnProgreso: 0,
  });

  const loadData = useCallback(async (filters?: MantenimientoFilters) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const data = await mantenimientoApi.list(filters);

      const tareasPendientes = data.results?.filter((t) => t.estado === 'pendiente').length || 0;
      const tareasVencidas = data.results?.filter((t) => t.esta_vencida && t.estado !== 'completada' && t.estado !== 'cancelada').length || 0;
      const tareasEnProgreso = data.results?.filter((t) => t.estado === 'en_progreso').length || 0;

      setState((prev) => ({
        ...prev,
        data,
        loading: false,
        filters: filters || prev.filters,
        tareasPendientes,
        tareasVencidas,
        tareasEnProgreso,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
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
      const data = await mantenimientoApi.get(id);
      setState((prev) => ({
        ...prev,
        selectedItem: data,
        loading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      toast.error(errorMessage);
    }
  }, []);

  const createItem = useCallback(async (data: TareaMantenimientoCreate): Promise<boolean> => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      await mantenimientoApi.create(data);
      toast.success('Tarea creada exitosamente');
      setState((prev) => ({ ...prev, loading: false, isStoreModalOpen: false }));
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al crear tarea';
      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      toast.error(errorMessage);
      return false;
    }
  }, []);

  const updateItem = useCallback(async (id: number, data: TareaMantenimientoUpdate): Promise<boolean> => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      await mantenimientoApi.update(id, data);
      toast.success('Tarea actualizada exitosamente');
      setState((prev) => ({ ...prev, loading: false, isStoreModalOpen: false }));
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al actualizar tarea';
      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      toast.error(errorMessage);
      return false;
    }
  }, []);

  const deleteItem = useCallback(async (id: number): Promise<boolean> => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      await mantenimientoApi.delete(id);
      toast.success('Tarea eliminada exitosamente');
      setState((prev) => ({ ...prev, loading: false, isDeleteModalOpen: false }));
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al eliminar tarea';
      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      toast.error(errorMessage);
      return false;
    }
  }, []);

  const asignarTarea = useCallback(async (id: number, data: AsignarTareaPayload): Promise<boolean> => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      await mantenimientoApi.asignar(id, data);
      toast.success('Tarea asignada exitosamente');
      setState((prev) => ({ ...prev, loading: false, isAsignarModalOpen: false }));
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al asignar tarea';
      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      toast.error(errorMessage);
      return false;
    }
  }, []);

  const iniciarTarea = useCallback(async (id: number, data?: IniciarTareaPayload): Promise<boolean> => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      await mantenimientoApi.iniciar(id, data || {});
      toast.success('Tarea iniciada exitosamente');
      setState((prev) => ({ ...prev, loading: false }));
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al iniciar tarea';
      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      toast.error(errorMessage);
      return false;
    }
  }, []);

  const completarTarea = useCallback(async (id: number, data?: CompletarTareaPayload): Promise<boolean> => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      await mantenimientoApi.completar(id, data || {});
      toast.success('Tarea completada exitosamente');
      setState((prev) => ({ ...prev, loading: false, isCompletarModalOpen: false }));
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al completar tarea';
      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      toast.error(errorMessage);
      return false;
    }
  }, []);

  const cancelarTarea = useCallback(async (id: number, data: CancelarTareaPayload): Promise<boolean> => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      await mantenimientoApi.cancelar(id, data);
      toast.success('Tarea cancelada exitosamente');
      setState((prev) => ({ ...prev, loading: false, isCancelarModalOpen: false }));
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al cancelar tarea';
      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      toast.error(errorMessage);
      return false;
    }
  }, []);

  const loadEstadisticas = useCallback(async (filters?: MantenimientoFilters) => {
    try {
      const data = await mantenimientoApi.estadisticas();
      setState((prev) => ({ ...prev, estadisticas: data }));
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    }
  }, []);

  const changePage = useCallback(async (page: number) => {
    await loadData({ ...state.filters, page });
  }, [loadData, state.filters]);

  const openStoreModal = useCallback((item?: TareaMantenimiento) => {
    setState((prev) => ({
      ...prev,
      selectedItem: item || null,
      isStoreModalOpen: true,
    }));
  }, []);

  const closeStoreModal = useCallback(() => {
    setState((prev) => ({
      ...prev,
      selectedItem: null,
      isStoreModalOpen: false,
    }));
  }, []);

  const openDeleteModal = useCallback((item: TareaMantenimiento) => {
    setState((prev) => ({
      ...prev,
      selectedItem: item,
      isDeleteModalOpen: true,
    }));
  }, []);

  const closeDeleteModal = useCallback(() => {
    setState((prev) => ({
      ...prev,
      selectedItem: null,
      isDeleteModalOpen: false,
    }));
  }, []);

  const openAsignarModal = useCallback((item: TareaMantenimiento) => {
    setState((prev) => ({
      ...prev,
      selectedItem: item,
      isAsignarModalOpen: true,
    }));
  }, []);

  const closeAsignarModal = useCallback(() => {
    setState((prev) => ({
      ...prev,
      selectedItem: null,
      isAsignarModalOpen: false,
    }));
  }, []);

  const openCompletarModal = useCallback((item: TareaMantenimiento) => {
    setState((prev) => ({
      ...prev,
      selectedItem: item,
      isCompletarModalOpen: true,
    }));
  }, []);

  const closeCompletarModal = useCallback(() => {
    setState((prev) => ({
      ...prev,
      selectedItem: null,
      isCompletarModalOpen: false,
    }));
  }, []);

  const openCancelarModal = useCallback((item: TareaMantenimiento) => {
    setState((prev) => ({
      ...prev,
      selectedItem: item,
      isCancelarModalOpen: true,
    }));
  }, []);

  const closeCancelarModal = useCallback(() => {
    setState((prev) => ({
      ...prev,
      selectedItem: null,
      isCancelarModalOpen: false,
    }));
  }, []);

  const setFilters = useCallback((filters: MantenimientoFilters) => {
    setState((prev) => ({
      ...prev,
      filters,
    }));
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({
      ...prev,
      error: null,
    }));
  }, []);

  return {
    ...state,
    loadData,
    loadItem,
    createItem,
    updateItem,
    deleteItem,
    asignarTarea,
    iniciarTarea,
    completarTarea,
    cancelarTarea,
    loadEstadisticas,
    changePage,
    openStoreModal,
    closeStoreModal,
    openDeleteModal,
    closeDeleteModal,
    openAsignarModal,
    closeAsignarModal,
    openCompletarModal,
    closeCompletarModal,
    openCancelarModal,
    closeCancelarModal,
    setFilters,
    clearError,
  };
}
