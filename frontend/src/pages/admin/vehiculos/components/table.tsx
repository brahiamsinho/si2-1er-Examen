import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2, Ban, CheckCircle } from "lucide-react";
import type { Vehiculo } from "@/types/vehiculos";
import { formatDate } from "@/lib/utils";

interface VehiculosTableProps {
  vehiculos: Vehiculo[];
  isLoading: boolean;
  onEdit: (vehiculo: Vehiculo) => void;
  onDelete: (id: number) => void;
  onChangeStatus: (id: number, estado: string) => void;
}

export function VehiculosTable({
  vehiculos,
  isLoading,
  onEdit,
  onDelete,
  onChangeStatus,
}: VehiculosTableProps) {
  const getEstadoBadge = (estado: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      activo: "default",
      inactivo: "secondary",
      suspendido: "destructive",
    };

    return (
      <Badge variant={variants[estado] || "secondary"}>
        {estado.charAt(0).toUpperCase() + estado.slice(1)}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="rounded-md border">
        <div className="p-8 text-center text-muted-foreground">
          Cargando vehículos...
        </div>
      </div>
    );
  }

  if (!vehiculos || vehiculos.length === 0) {
    return (
      <div className="rounded-md border">
        <div className="p-8 text-center text-muted-foreground">
          No se encontraron vehículos
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Placa</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Marca/Modelo</TableHead>
            <TableHead>Color</TableHead>
            <TableHead>Residente</TableHead>
            <TableHead>Unidad</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Vencimiento</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {vehiculos.map((vehiculo) => (
            <TableRow key={vehiculo.id}>
              <TableCell className="font-medium">{vehiculo.placa}</TableCell>
              <TableCell>{vehiculo.tipo_display}</TableCell>
              <TableCell>
                {vehiculo.marca} {vehiculo.modelo}
              </TableCell>
              <TableCell>{vehiculo.color}</TableCell>
              <TableCell>{vehiculo.residente_nombre}</TableCell>
              <TableCell>{vehiculo.unidad_codigo || "-"}</TableCell>
              <TableCell>{getEstadoBadge(vehiculo.estado)}</TableCell>
              <TableCell>
                {vehiculo.fecha_vencimiento
                  ? formatDate(vehiculo.fecha_vencimiento)
                  : "Sin vencimiento"}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Abrir menú</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onEdit(vehiculo)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                    {vehiculo.estado === "activo" ? (
                      <DropdownMenuItem
                        onClick={() => onChangeStatus(vehiculo.id, "inactivo")}
                      >
                        <Ban className="mr-2 h-4 w-4" />
                        Desactivar
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem
                        onClick={() => onChangeStatus(vehiculo.id, "activo")}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Activar
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDelete(vehiculo.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
