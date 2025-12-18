/**
 * Componente de Filtros para Mantenimiento
 */
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';
import type { MantenimientoFilters, TipoTarea, EstadoTarea, PrioridadTarea } from '@/types/mantenimiento';

interface FiltersProps {
  filters: MantenimientoFilters;
  onFilterChange: (filters: MantenimientoFilters) => void;
}

const TIPOS: { value: TipoTarea | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos los tipos' },
  { value: 'preventivo', label: 'Preventivo' },
  { value: 'correctivo', label: 'Correctivo' },
  { value: 'emergencia', label: 'Emergencia' },
  { value: 'instalacion', label: 'Instalación' },
  { value: 'reparacion', label: 'Reparación' },
  { value: 'limpieza', label: 'Limpieza' },
];

const ESTADOS: { value: EstadoTarea | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'asignada', label: 'Asignada' },
  { value: 'en_progreso', label: 'En Progreso' },
  { value: 'completada', label: 'Completada' },
  { value: 'cancelada', label: 'Cancelada' },
];

const PRIORIDADES: { value: PrioridadTarea | 'all'; label: string }[] = [
  { value: 'all', label: 'Todas las prioridades' },
  { value: 'baja', label: 'Baja' },
  { value: 'media', label: 'Media' },
  { value: 'alta', label: 'Alta' },
  { value: 'critica', label: 'Crítica' },
];

export function Filters({ filters, onFilterChange }: FiltersProps) {
  const handleSearchChange = (value: string) => {
    onFilterChange({ ...filters, search: value });
  };

  const handleTipoChange = (value: string) => {
    onFilterChange({ ...filters, tipo: value as TipoTarea | 'all' });
  };

  const handleEstadoChange = (value: string) => {
    onFilterChange({ ...filters, estado: value as EstadoTarea | 'all' });
  };

  const handlePrioridadChange = (value: string) => {
    onFilterChange({ ...filters, prioridad: value as PrioridadTarea | 'all' });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Buscar tareas..."
          value={filters.search || ''}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      <Select
        value={filters.tipo || 'all'}
        onValueChange={handleTipoChange}
      >
        <SelectTrigger>
          <SelectValue placeholder="Tipo" />
        </SelectTrigger>
        <SelectContent>
          {TIPOS.map((tipo) => (
            <SelectItem key={tipo.value} value={tipo.value}>
              {tipo.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.estado || 'all'}
        onValueChange={handleEstadoChange}
      >
        <SelectTrigger>
          <SelectValue placeholder="Estado" />
        </SelectTrigger>
        <SelectContent>
          {ESTADOS.map((estado) => (
            <SelectItem key={estado.value} value={estado.value}>
              {estado.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.prioridad || 'all'}
        onValueChange={handlePrioridadChange}
      >
        <SelectTrigger>
          <SelectValue placeholder="Prioridad" />
        </SelectTrigger>
        <SelectContent>
          {PRIORIDADES.map((prioridad) => (
            <SelectItem key={prioridad.value} value={prioridad.value}>
              {prioridad.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
