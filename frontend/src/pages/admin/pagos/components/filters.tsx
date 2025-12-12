import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X } from "lucide-react";
import type { ExpensaFilters, EstadoExpensa } from "@/types";
import { ESTADO_EXPENSA_LABELS } from "@/types";
import { unidadesApi } from "@/services/unidades.api";

interface PagosFiltersProps {
  filters: ExpensaFilters;
  onFiltersChange: (filters: ExpensaFilters) => void;
  onSearch: () => void;
  disabled?: boolean;
}

export function PagosFilters({
  filters,
  onFiltersChange,
  onSearch,
  disabled = false,
}: PagosFiltersProps) {
  const [unidades, setUnidades] = useState<{ id: number; codigo: string }[]>(
    []
  );

  useEffect(() => {
    const loadUnidades = async () => {
      try {
        const response = await unidadesApi.list({ page: 1, page_size: 100 });
        setUnidades(
          response.results.map((u) => ({
            id: u.id,
            codigo: u.codigo,
          }))
        );
      } catch (error) {
        console.error("Error cargando unidades:", error);
      }
    };
    loadUnidades();
  }, []);

  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, search: value || "", page: 1 });
  };

  const handleEstadoChange = (value: string) => {
    onFiltersChange({
      ...filters,
      estado: value === "todos" ? "" : (value as EstadoExpensa),
      page: 1,
    });
  };

  const handlePeriodoChange = (value: string) => {
    onFiltersChange({ ...filters, periodo: value || "", page: 1 });
  };

  const handleUnidadChange = (value: string) => {
    onFiltersChange({
      ...filters,
      unidad: value === "todas" ? "" : Number(value),
      page: 1,
    });
  };

  const handleVencidasChange = (checked: boolean) => {
    onFiltersChange({ ...filters, vencidas: checked, page: 1 });
  };

  const handleClearFilters = () => {
    onFiltersChange({
      page: 1,
      page_size: filters.page_size,
      search: "",
      estado: "",
      periodo: "",
      unidad: "",
      vencidas: false,
    });
    onSearch();
  };

  const hasActiveFilters =
    filters.search ||
    filters.estado ||
    filters.periodo ||
    filters.unidad ||
    filters.vencidas;

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="grid gap-4 md:grid-cols-6">
        {/* Search */}
        <div className="md:col-span-2">
          <Label htmlFor="search">Búsqueda</Label>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Buscar por unidad o periodo..."
              value={filters.search || ""}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-8"
              disabled={disabled}
            />
          </div>
        </div>

        {/* Estado */}
        <div>
          <Label htmlFor="estado">Estado</Label>
          <Select
            value={filters.estado || "todos"}
            onValueChange={handleEstadoChange}
            disabled={disabled}
          >
            <SelectTrigger id="estado">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {Object.entries(ESTADO_EXPENSA_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Periodo */}
        <div>
          <Label htmlFor="periodo">Periodo</Label>
          <Input
            id="periodo"
            type="text"
            placeholder="YYYY-MM"
            value={filters.periodo || ""}
            onChange={(e) => handlePeriodoChange(e.target.value)}
            pattern="\d{4}-\d{2}"
            disabled={disabled}
          />
        </div>

        {/* Unidad */}
        <div>
          <Label htmlFor="unidad">Unidad</Label>
          <Select
            value={filters.unidad?.toString() || "todas"}
            onValueChange={handleUnidadChange}
            disabled={disabled}
          >
            <SelectTrigger id="unidad">
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              {unidades.map((unidad) => (
                <SelectItem key={unidad.id} value={unidad.id.toString()}>
                  {unidad.codigo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Vencidas Checkbox */}
        <div className="flex items-end">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="vencidas"
              checked={filters.vencidas || false}
              onCheckedChange={handleVencidasChange}
              disabled={disabled}
            />
            <Label
              htmlFor="vencidas"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Solo vencidas
            </Label>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-4 flex gap-2">
        <Button onClick={onSearch} disabled={disabled}>
          <Search className="mr-2 h-4 w-4" />
          Buscar
        </Button>
        {hasActiveFilters && (
          <Button
            variant="outline"
            onClick={handleClearFilters}
            disabled={disabled}
          >
            <X className="mr-2 h-4 w-4" />
            Limpiar Filtros
          </Button>
        )}
      </div>
    </div>
  );
}
