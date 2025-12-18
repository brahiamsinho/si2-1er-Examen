/**
 * Página de Gestión de Mantenimiento
 */
import { useEffect } from 'react';
import AdminLayout from '@/app/layout/admin-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Wrench, AlertTriangle, Clock } from 'lucide-react';
import { useMantenimiento } from '@/hooks/use-mantenimiento';
import { Filters } from './components/filters';
import { TareasTable } from './components/table';
import { StoreModal } from './components/store';
import { DeleteModal } from './components/delete';

export default function MantenimientoPage() {
  const {
    data,
    loading,
    selectedItem,
    isStoreModalOpen,
    isDeleteModalOpen,
    filters,
    tareasPendientes,
    tareasVencidas,
    tareasEnProgreso,
    loadData,
    createItem,
    updateItem,
    deleteItem,
    iniciarTarea,
    completarTarea,
    openStoreModal,
    closeStoreModal,
    openDeleteModal,
    closeDeleteModal,
    openAsignarModal,
    openCompletarModal,
    openCancelarModal,
    setFilters,
  } = useMantenimiento();

  useEffect(() => {
    loadData(filters);
  }, [filters]);

  const handleSubmit = async (formData: any) => {
    let success = false;
    if (selectedItem) {
      success = await updateItem(selectedItem.id, formData);
    } else {
      success = await createItem(formData);
    }
    if (success) {
      loadData(filters);
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    const success = await deleteItem(selectedItem.id);
    if (success) {
      loadData(filters);
    }
  };

  const handleIniciar = async (tarea: any) => {
    const success = await iniciarTarea(tarea.id);
    if (success) loadData(filters);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Gestión de Mantenimiento</h1>
            <p className="text-muted-foreground mt-1">
              Administra tareas de mantenimiento del condominio
            </p>
          </div>
          <Button onClick={() => openStoreModal()}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Tarea
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tareasPendientes}</div>
              <p className="text-xs text-muted-foreground">Tareas sin asignar</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vencidas</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{tareasVencidas}</div>
              <p className="text-xs text-muted-foreground">Requieren atención urgente</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En Progreso</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tareasEnProgreso}</div>
              <p className="text-xs text-muted-foreground">En ejecución</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>Filtra las tareas por diferentes criterios</CardDescription>
          </CardHeader>
          <CardContent>
            <Filters filters={filters} onFilterChange={setFilters} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tareas de Mantenimiento</CardTitle>
            <CardDescription>
              {data?.count || 0} tarea(s) encontrada(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Cargando...</div>
            ) : (
              <TareasTable
                tareas={data?.results || []}
                onEdit={openStoreModal}
                onDelete={openDeleteModal}
                onAsignar={openAsignarModal}
                onIniciar={handleIniciar}
                onCompletar={openCompletarModal}
                onCancelar={openCancelarModal}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <StoreModal
        open={isStoreModalOpen}
        tarea={selectedItem}
        onClose={closeStoreModal}
        onSubmit={handleSubmit}
        loading={loading}
      />

      <DeleteModal
        open={isDeleteModalOpen}
        tarea={selectedItem}
        onClose={closeDeleteModal}
        onConfirm={handleDelete}
        loading={loading}
      />
    </AdminLayout>
  );
}
