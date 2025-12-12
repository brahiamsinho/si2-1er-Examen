import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Plus,
} from "lucide-react";
import { usePagos } from "@/hooks/use-pagos";
import { PagosFilters } from "./components/filters";
import { PagosTable } from "./components/table";
import { PagosStoreModal } from "./components/store";
import { GenerarMasivoModal } from "./components/generar-masivo";
import { RegistrarPagoModal } from "./components/registrar-pago";
import { ComprobanteModal } from "./components/comprobante";
import { MorosidadModal } from "./components/morosidad";
import { DeleteModal } from "./components/delete";

export default function PagosPage() {
  const {
    data,
    selectedItem,
    estadisticas,
    morosidad,
    loading,
    error,
    filters,
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
    setFilters,
  } = usePagos();

  useEffect(() => {
    loadData(filters.page, filters.page_size);
  }, [filters, loadData]);

  useEffect(() => {
    loadEstadisticas();
  }, [loadEstadisticas]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-BO", {
      style: "currency",
      currency: "BOB",
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const handleEdit = async (id: number) => {
    await loadItem(id);
    openStoreModal();
  };

  const handleDelete = async (id: number) => {
    await loadItem(id);
    openDeleteModal();
  };

  const handleRegistrarPago = async (id: number) => {
    await loadItem(id);
    openRegistrarPagoModal();
  };

  const handleVerComprobante = async (id: number) => {
    await loadItem(id);
    openComprobanteModal();
  };

  const handleViewMorosidad = async () => {
    await loadMorosidad();
    openMorosidadModal();
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Pagos y Expensas
          </h1>
          <p className="text-muted-foreground">
            Gestión de expensas mensuales y registro de pagos
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleViewMorosidad}
            disabled={loading}
          >
            <AlertCircle className="mr-2 h-4 w-4" />
            Ver Morosidad
          </Button>
          <Button onClick={openGenerarMasivoModal} disabled={loading}>
            <Plus className="mr-2 h-4 w-4" />
            Generar Masivo
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {estadisticas && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Generado
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(estadisticas.total_generado)}
              </div>
              <p className="text-xs text-muted-foreground">
                {estadisticas.total_expensas} expensas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Pagado
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(estadisticas.total_pagado)}
              </div>
              <p className="text-xs text-muted-foreground">
                {estadisticas.expensas_pagadas} completadas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Tasa de Cobro
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatPercentage(estadisticas.tasa_cobro)}
              </div>
              <p className="text-xs text-muted-foreground">
                Del total generado
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Morosidad</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(estadisticas.total_pendiente)}
              </div>
              <p className="text-xs text-muted-foreground">
                {estadisticas.expensas_pendientes} pendientes
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <PagosFilters
        filters={filters}
        onFiltersChange={setFilters}
        onSearch={loadData}
        disabled={loading}
      />

      {/* Error Message */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Table */}
      <PagosTable
        data={data}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onRegistrarPago={handleRegistrarPago}
        onVerComprobante={handleVerComprobante}
        onPageChange={(page) => setFilters({ ...filters, page })}
      />

      {/* Modals */}
      <PagosStoreModal
        open={isStoreModalOpen}
        onClose={closeStoreModal}
        item={selectedItem}
        onCreate={createItem}
        onUpdate={updateItem}
      />

      <GenerarMasivoModal
        open={isGenerarMasivoModalOpen}
        onClose={closeGenerarMasivoModal}
        onGenerar={generarMasivo}
      />

      <RegistrarPagoModal
        open={isRegistrarPagoModalOpen}
        onClose={closeRegistrarPagoModal}
        expensa={selectedItem}
        onRegistrar={registrarPago}
      />

      <ComprobanteModal
        open={isComprobanteModalOpen}
        onClose={closeComprobanteModal}
        expensa={selectedItem}
      />

      <MorosidadModal
        open={isMorosidadModalOpen}
        onClose={closeMorosidadModal}
        data={morosidad}
      />

      <DeleteModal
        open={isDeleteModalOpen}
        onClose={closeDeleteModal}
        item={selectedItem}
        onConfirm={deleteItem}
      />
    </div>
  );
}
