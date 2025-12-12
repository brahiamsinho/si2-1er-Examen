import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  TIPOS_VEHICULO,
  ESTADOS_VEHICULO,
  type VehiculoFilters,
} from "@/types/vehiculos";
import { useResidentes } from "@/hooks/useResidentes";
import { useUnidades } from "@/hooks/useUnidades";
import { useEffect } from "react";

interface FiltersProps {
  filters: VehiculoFilters;
  onFiltersChange: (filters: VehiculoFilters) => void;
}

export function Filters({ filters, onFiltersChange }: FiltersProps) {
  const { residentes, cargarResidentes } = useResidentes();
  const { unidades, loadUnidades } = useUnidades();

  useEffect(() => {
    cargarResidentes();
    loadUnidades();
  }, [cargarResidentes, loadUnidades]);

  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, search: value, page: 1 });
  };

  const handleTipoChange = (value: string) => {
    onFiltersChange({ ...filters, tipo: value as any, page: 1 });
  };

  const handleEstadoChange = (value: string) => {
    onFiltersChange({ ...filters, estado: value as any, page: 1 });
  };

  const handleResidenteChange = (value: string) => {
    onFiltersChange({
      ...filters,
      residente: value ? Number(value) : "",
      page: 1,
    });
  };

  const handleUnidadChange = (value: string) => {
    onFiltersChange({
      ...filters,
      unidad: value ? Number(value) : "",
      page: 1,
    });
  };

  const handleReset = () => {
    onFiltersChange({
      search: "",
      tipo: "",
      estado: "",
      residente: "",
      unidad: "",
      page: 1,
      page_size: filters.page_size || 10,
    });
  };

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="flex items-center gap-2">
        <Filter className="h-5 w-5 text-muted-foreground" />
        <h3 className="font-semibold">Filtros</h3>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Búsqueda */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por placa, marca, modelo..."
            value={filters.search || ""}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-8"
          />
        </div>

        {/* Tipo */}
        <Select value={filters.tipo || ""} onValueChange={handleTipoChange}>
          <SelectTrigger>
            <SelectValue placeholder="Todos los tipos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos los tipos</SelectItem>
            {TIPOS_VEHICULO.map((tipo) => (
              <SelectItem key={tipo.value} value={tipo.value}>
                {tipo.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Estado */}
        <Select value={filters.estado || ""} onValueChange={handleEstadoChange}>
          <SelectTrigger>
            <SelectValue placeholder="Todos los estados" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos los estados</SelectItem>
            {ESTADOS_VEHICULO.map((estado) => (
              <SelectItem key={estado.value} value={estado.value}>
                {estado.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Residente */}
        <Select
          value={filters.residente ? String(filters.residente) : ""}
          onValueChange={handleResidenteChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Todos los residentes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos los residentes</SelectItem>
            {residentes.map((residente) => (
              <SelectItem key={residente.id} value={String(residente.id)}>
                {residente.nombre} {residente.apellido}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Unidad */}
        <Select
          value={filters.unidad ? String(filters.unidad) : ""}
          onValueChange={handleUnidadChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Todas las unidades" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todas las unidades</SelectItem>
            {unidades.map((unidad) => (
              <SelectItem key={unidad.id} value={String(unidad.id)}>
                {unidad.codigo}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Botón Reset */}
        <Button variant="outline" onClick={handleReset}>
          Limpiar filtros
        </Button>
      </div>
    </div>
  );
}
