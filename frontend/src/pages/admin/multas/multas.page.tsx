import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Plus,
  AlertTriangle,
  Clock,
  CheckCircle,
  DollarSign,
} from "lucide-react";
import { useMultas } from "@/hooks/use-multas";
import { MultaTable } from "./components/table";
import { MultaFiltersComponent } from "./components/filters";
import { MultaStore } from "./components/store";
import { MultaDelete } from "./components/delete";
import { MultaPay } from "./components/pay";
import { MultaCancel } from "./components/cancel";
import AdminLayout from "@/app/layout/admin-layout";
import { getUnidades } from "@/services/unidadesService";
import { residentesApi } from "@/services/residentesService";
import type { Unidad } from "@/types/unidades";
import type { Residente } from "@/types";

const ITEMS_PER_PAGE = 10;

export default function MultasPage() {
  const [page, setPage] = useState<number>(1);
  const [search, setSearch] = useState<string>("");
  const [searchDebounced, setSearchDebounced] = useState<string>("");
  const [tipoFilter, setTipoFilter] = useState<string>("all");
  const [estadoFilter, setEstadoFilter] = useState<string>("all");
  const [residenteFilter, setResidenteFilter] = useState<string>("all");
  const [unidadFilter, setUnidadFilter] = useState<string>("all");
  const [unidades, setUnidades] = useState<Unidad[]>([]);
  const [residentes, setResidentes] = useState<Residente[]>([]);
  const [loadingUnidades, setLoadingUnidades] = useState<boolean>(false);
  const [loadingResidentes, setLoadingResidentes] = useState<boolean>(false);

  const {
    data,
    loading,
    error,
    selectedItem,
    isStoreModalOpen,
    isDeleteModalOpen,
    isPayModalOpen,
    isCancelModalOpen,
    multasPendientes,
    multasVencidas,
    multasPagadas,
    loadData,
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
    clearError,
  } = useMultas();

  // Función para cargar datos con filtros y paginación
  const fetchMultas = async (
    pageNumber = 1,
    searchQuery = "",
    tipo = "all",
    estado = "all",
    residente = "all",
    unidad = "all"
  ) => {
    const filters: any = {
      ...(searchQuery && { search: searchQuery }),
      ...(tipo !== "all" && { tipo }),
      ...(estado !== "all" && { estado }),
      ...(residente !== "all" && residente && { residente }),
      ...(unidad !== "all" && unidad && { unidad }),
    };

    await loadData(filters);
  };

  // Debounce para el campo de búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounced(search);
    }, 1000);

    return () => clearTimeout(timer);
  }, [search]);

  // Cargar datos al montar el componente y cuando cambien los filtros
  useEffect(() => {
    fetchMultas(
      page,
      searchDebounced,
      tipoFilter,
      estadoFilter,
      residenteFilter,
      unidadFilter
    );
  }, [
    page,
    searchDebounced,
    tipoFilter,
    estadoFilter,
    residenteFilter,
    unidadFilter,
  ]);

  // Cargar unidades habitacionales
  useEffect(() => {
    const fetchUnidades = async () => {
      try {
        setLoadingUnidades(true);
        const response = await getUnidades({});

        if (response.success && response.data) {
          setUnidades(response.data.results);
        }
      } catch (error) {
        console.error("Error al cargar unidades:", error);
        setUnidades([]);
      } finally {
        setLoadingUnidades(false);
      }
    };

    fetchUnidades();
  }, []);

  // Cargar residentes
  useEffect(() => {
    const fetchResidentes = async () => {
      try {
        setLoadingResidentes(true);
        const response = await residentesApi.list({});

        if (response.success && response.data) {
          setResidentes(response.data.results);
        }
      } catch (error) {
        console.error("Error al cargar residentes:", error);
        setResidentes([]);
      } finally {
        setLoadingResidentes(false);
      }
    };

    fetchResidentes();
  }, []);

  const handleCreate = () => {
    openStoreModal();
  };

  const handleEdit = (multa: any) => {
    openStoreModal(multa);
  };

  const handleDelete = (multa: any) => {
    openDeleteModal(multa);
  };

  const handlePay = (multa: any) => {
    openPayModal(multa);
  };

  const handleCancel = (multa: any) => {
    openCancelModal(multa);
  };

  const handleStoreSubmit = async (data: any) => {
    try {
      if (selectedItem) {
        const result = await updateItem(selectedItem.id, data);
        return result;
      } else {
        const result = await createItem(data);
        return result;
      }
    } catch (error) {
      return false;
    }
  };

  const handleDeleteConfirm = async () => {
    if (selectedItem) {
      return await deleteItem(selectedItem.id);
    }
    return false;
  };

  const handlePayConfirm = async (observaciones?: string) => {
    if (selectedItem) {
      return await marcarPagado(selectedItem.id, { observaciones });
    }
    return false;
  };

  const handleCancelConfirm = async (motivo: string) => {
    if (selectedItem) {
      return await cancelarMulta(selectedItem.id, { motivo });
    }
    return false;
  };

  const totalPages = Math.ceil((data?.count || 0) / ITEMS_PER_PAGE);
  const totalMultas = data?.count || 0;

  // Calcular monto total pendiente
  const montoTotalPendiente =
    data?.results
      ?.filter((m) => m.estado === "pendiente")
      .reduce((acc, m) => acc + parseFloat(m.monto_total || "0"), 0)
      .toFixed(2) || "0.00";

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Gestión de Multas
            </h1>
            <p className="text-muted-foreground">
              Administra las multas y sanciones de los residentes
            </p>
          </div>
          <Button
            onClick={handleCreate}
            className="flex items-center gap-2 w-full sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            Agregar Multa
          </Button>
        </div>

        {/* Estadísticas Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Multas
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalMultas}</div>
              <p className="text-xs text-muted-foreground">
                Todas las multas registradas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {multasPendientes}
              </div>
              <p className="text-xs text-muted-foreground">Multas sin pagar</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vencidas</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {multasVencidas}
              </div>
              <p className="text-xs text-muted-foreground">
                Con recargo por mora
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Monto Pendiente
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                Bs. {montoTotalPendiente}
              </div>
              <p className="text-xs text-muted-foreground">Total por cobrar</p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <MultaFiltersComponent
          search={search}
          setSearch={setSearch}
          tipoFilter={tipoFilter}
          setTipoFilter={setTipoFilter}
          estadoFilter={estadoFilter}
          setEstadoFilter={setEstadoFilter}
          residenteFilter={residenteFilter}
          setResidenteFilter={setResidenteFilter}
          unidadFilter={unidadFilter}
          setUnidadFilter={setUnidadFilter}
          residentes={residentes}
          unidades={unidades}
          loadingResidentes={loadingResidentes}
          loadingUnidades={loadingUnidades}
        />

        {/* Tabla */}
        <MultaTable
          multas={data?.results || []}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onPay={handlePay}
          onCancel={handleCancel}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />

        {/* Modales */}
        {isStoreModalOpen && (
          <MultaStore
            isOpen={isStoreModalOpen}
            onClose={closeStoreModal}
            onSubmit={handleStoreSubmit}
            multa={selectedItem}
            residentes={residentes}
            unidades={unidades}
          />
        )}

        {isDeleteModalOpen && selectedItem && (
          <MultaDelete
            isOpen={isDeleteModalOpen}
            onClose={closeDeleteModal}
            onConfirm={handleDeleteConfirm}
            multa={selectedItem}
          />
        )}

        {isPayModalOpen && selectedItem && (
          <MultaPay
            isOpen={isPayModalOpen}
            onClose={closePayModal}
            onConfirm={handlePayConfirm}
            multa={selectedItem}
          />
        )}

        {isCancelModalOpen && selectedItem && (
          <MultaCancel
            isOpen={isCancelModalOpen}
            onClose={closeCancelModal}
            onConfirm={handleCancelConfirm}
            multa={selectedItem}
          />
        )}
      </div>
    </AdminLayout>
  );
}
