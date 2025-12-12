import { useState, useCallback } from "react";
import { vehiculosApi } from "@/services/vehiculos.api";
import type {
  Vehiculo,
  VehiculoFormData,
  VehiculoFilters,
  PaginatedVehiculosResponse,
} from "@/types/vehiculos";
import { toast } from "sonner";

const EMPTY_RESPONSE: PaginatedVehiculosResponse = {
  count: 0,
  next: null,
  previous: null,
  results: [],
};

export function useVehiculos() {
  const [data, setData] = useState<PaginatedVehiculosResponse>(EMPTY_RESPONSE);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadVehiculos = useCallback(async (filters?: VehiculoFilters) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await vehiculosApi.getAll(filters);
      setData(response);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error al cargar vehículos";
      setError(errorMessage);
      toast.error(errorMessage);
      setData(EMPTY_RESPONSE);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createVehiculo = useCallback(async (vehiculoData: VehiculoFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const newVehiculo = await vehiculosApi.create(vehiculoData);
      toast.success("Vehículo registrado exitosamente");
      return newVehiculo;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error al crear vehículo";
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateVehiculo = useCallback(
    async (id: number, vehiculoData: Partial<VehiculoFormData>) => {
      setIsLoading(true);
      setError(null);

      try {
        const updatedVehiculo = await vehiculosApi.update(id, vehiculoData);
        toast.success("Vehículo actualizado exitosamente");
        return updatedVehiculo;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Error al actualizar vehículo";
        setError(errorMessage);
        toast.error(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const deleteVehiculo = useCallback(async (id: number) => {
    setIsLoading(true);
    setError(null);

    try {
      await vehiculosApi.delete(id);
      toast.success("Vehículo eliminado exitosamente");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error al eliminar vehículo";
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const changeStatus = useCallback(async (id: number, estado: string) => {
    setIsLoading(true);
    setError(null);

    try {
      await vehiculosApi.changeStatus(id, estado);
      toast.success("Estado actualizado exitosamente");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error al cambiar estado";
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    data,
    isLoading,
    error,
    loadVehiculos,
    createVehiculo,
    updateVehiculo,
    deleteVehiculo,
    changeStatus,
  };
}
