import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { TIPO_MULTA_LABELS, ESTADO_MULTA_LABELS } from "@/types";
import type { Residente } from "@/types";
import type { Unidad } from "@/types/unidades";

interface MultaFiltersComponentProps {
  search: string;
  setSearch: (value: string) => void;
  tipoFilter: string;
  setTipoFilter: (value: string) => void;
  estadoFilter: string;
  setEstadoFilter: (value: string) => void;
  residenteFilter: string;
  setResidenteFilter: (value: string) => void;
  unidadFilter: string;
  setUnidadFilter: (value: string) => void;
  residentes: Residente[];
  unidades: Unidad[];
  loadingResidentes?: boolean;
  loadingUnidades?: boolean;
}

export function MultaFiltersComponent({
  search,
  setSearch,
  tipoFilter,
  setTipoFilter,
  estadoFilter,
  setEstadoFilter,
  residenteFilter,
  setResidenteFilter,
  unidadFilter,
  setUnidadFilter,
  residentes,
  unidades,
  loadingResidentes,
  loadingUnidades,
}: MultaFiltersComponentProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Filtros</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar multas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>

          {/* Filtro por tipo */}
          <Select value={tipoFilter} onValueChange={setTipoFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Tipo de multa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              {Object.entries(TIPO_MULTA_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Filtro por estado */}
          <Select value={estadoFilter} onValueChange={setEstadoFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              {Object.entries(ESTADO_MULTA_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Filtro por residente */}
          <Select
            value={residenteFilter}
            onValueChange={setResidenteFilter}
            disabled={loadingResidentes}
          >
            <SelectTrigger>
              <SelectValue placeholder="Residente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los residentes</SelectItem>
              {residentes.map((residente) => (
                <SelectItem key={residente.id} value={String(residente.id)}>
                  {residente.nombre_completo} - {residente.unidad_habitacional}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Filtro por unidad */}
          <Select
            value={unidadFilter}
            onValueChange={setUnidadFilter}
            disabled={loadingUnidades}
          >
            <SelectTrigger>
              <SelectValue placeholder="Unidad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las unidades</SelectItem>
              {unidades.map((unidad) => (
                <SelectItem key={unidad.id} value={String(unidad.id)}>
                  {unidad.codigo} - {unidad.direccion}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
