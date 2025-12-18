import { useEffect, useState } from "react";
import { Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useVehiculos } from "@/hooks/use-vehiculos";
import { Filters } from "./components/filters";
import { VehiculosTable } from "./components/table";
import { CreateEditDialog } from "./components/create-dialog";
import AdminLayout from "@/app/layout/admin-layout";
import type {
  Vehiculo,
  VehiculoFilters,
  VehiculoFormData,
} from "@/types/vehiculos";

export default function VehiculosPage() {
  const {
    data,
    isLoading,
    loadVehiculos,
    createVehiculo,
    updateVehiculo,
    deleteVehiculo,
    changeStatus,
  } = useVehiculos();

  const [filters, setFilters] = useState<VehiculoFilters>({
    page: 1,
    page_size: 10,
    search: "",
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedVehiculo, setSelectedVehiculo] = useState<Vehiculo | null>(
    null
  );
  const [confirmDelete, setConfirmDelete] = useState<{
    open: boolean;
    id: number | null;
  }>({
    open: false,
    id: null,
  });

  useEffect(() => {
    loadVehiculos(filters);
  }, [filters, loadVehiculos]);

  const handleFiltersChange = (newFilters: VehiculoFilters) => {
    setFilters(newFilters);
  };

  const handleCreate = () => {
    setSelectedVehiculo(null);
    setDialogOpen(true);
  };

  const handleEdit = (vehiculo: Vehiculo) => {
    setSelectedVehiculo(vehiculo);
    setDialogOpen(true);
  };

  const handleSubmit = async (data: VehiculoFormData) => {
    if (selectedVehiculo) {
      await updateVehiculo(selectedVehiculo.id, data);
    } else {
      await createVehiculo(data);
    }
    setDialogOpen(false);
    setSelectedVehiculo(null);
    loadVehiculos(filters);
  };

  const handleDeleteClick = (id: number) => {
    setConfirmDelete({ open: true, id });
  };

  const handleConfirmDelete = async () => {
    if (confirmDelete.id) {
      await deleteVehiculo(confirmDelete.id);
      setConfirmDelete({ open: false, id: null });
      loadVehiculos(filters);
    }
  };

  const handleChangeStatus = async (id: number, estado: string) => {
    await changeStatus(id, estado);
    loadVehiculos(filters);
  };

  const handlePageChange = (newPage: number) => {
    setFilters({ ...filters, page: newPage });
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setFilters({ ...filters, page_size: newPageSize, page: 1 });
  };

  const totalPages = Math.ceil(data.count / (filters.page_size || 10));

  return (
    <AdminLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Car className="h-6 w-6" />
          <h1 className="text-3xl font-bold">Gestión de Vehículos</h1>
        </div>
        <Button onClick={handleCreate}>
          <Car className="mr-2 h-4 w-4" />
          Nuevo Vehículo
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <Filters filters={filters} onFiltersChange={handleFiltersChange} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vehículos Registrados ({data.count})</CardTitle>
        </CardHeader>
        <CardContent>
          <VehiculosTable
            vehiculos={data.results}
            isLoading={isLoading}
            onEdit={handleEdit}
            onDelete={handleDeleteClick}
            onChangeStatus={handleChangeStatus}
          />

          {/* Paginación */}
          {data.count > 0 && (
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Mostrando{" "}
                  {((filters.page || 1) - 1) * (filters.page_size || 10) + 1} -{" "}
                  {Math.min(
                    (filters.page || 1) * (filters.page_size || 10),
                    data.count
                  )}{" "}
                  de {data.count} resultados
                </span>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={filters.page_size || 10}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  className="border rounded px-2 py-1 text-sm"
                >
                  <option value={10}>10 por página</option>
                  <option value={25}>25 por página</option>
                  <option value={50}>50 por página</option>
                  <option value={100}>100 por página</option>
                </select>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange((filters.page || 1) - 1)}
                  disabled={!data.previous}
                >
                  Anterior
                </Button>

                <span className="text-sm">
                  Página {filters.page || 1} de {totalPages}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange((filters.page || 1) + 1)}
                  disabled={!data.next}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <CreateEditDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setSelectedVehiculo(null);
        }}
        onSubmit={handleSubmit}
        vehiculo={selectedVehiculo}
        isLoading={isLoading}
      />

      <ConfirmDialog
        open={confirmDelete.open}
        onClose={() => setConfirmDelete({ open: false, id: null })}
        onConfirm={handleConfirmDelete}
        title="Eliminar Vehículo"
        description="¿Está seguro que desea eliminar este vehículo? Esta acción no se puede deshacer."
        isLoading={isLoading}
      />
      </div>
    </AdminLayout>
  );
}
