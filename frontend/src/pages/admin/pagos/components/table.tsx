import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertCircle,
  DollarSign,
  Eye,
  MoreHorizontal,
  Pencil,
  Trash2,
  FileText,
} from "lucide-react";
import type { PaginatedResponse, ExpensaListItem } from "@/types";
import { ESTADO_EXPENSA_LABELS, ESTADO_EXPENSA_COLORS } from "@/types";

interface PagosTableProps {
  data: PaginatedResponse<ExpensaListItem>;
  loading: boolean;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onRegistrarPago: (id: number) => void;
  onVerComprobante: (id: number) => void;
  onPageChange: (page: number) => void;
}

export function PagosTable({
  data,
  loading,
  onEdit,
  onDelete,
  onRegistrarPago,
  onVerComprobante,
  onPageChange,
}: PagosTableProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-BO", {
      style: "currency",
      currency: "BOB",
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "dd/MM/yyyy", { locale: es });
    } catch {
      return dateString;
    }
  };

  const isVencida = (fechaVencimiento: string) => {
    const today = new Date();
    const vencimiento = parseISO(fechaVencimiento);
    return vencimiento < today;
  };

  const canRegistrarPago = (expensa: ExpensaListItem) => {
    return (
      expensa.estado !== "pagado" && parseFloat(expensa.saldo_pendiente) > 0
    );
  };

  if (loading && data.results.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-2" />
          <p className="text-muted-foreground">Cargando expensas...</p>
        </div>
      </div>
    );
  }

  if (data.results.length === 0) {
    if (loading) {
      return (
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-2" />
            <p className="text-muted-foreground">Cargando expensas...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed">
        <div className="text-center">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-semibold">No hay expensas</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Comienza generando expensas masivas para las unidades.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Periodo</TableHead>
              <TableHead>Unidad</TableHead>
              <TableHead className="text-right">Monto Total</TableHead>
              <TableHead className="text-right">Pagado</TableHead>
              <TableHead className="text-right">Saldo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Vencimiento</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.results.map((expensa) => (
              <TableRow key={expensa.id}>
                <TableCell className="font-medium">{expensa.periodo}</TableCell>
                <TableCell>{expensa.unidad_codigo}</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(parseFloat(expensa.monto_total))}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(parseFloat(expensa.monto_pagado))}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(parseFloat(expensa.saldo_pendiente))}
                </TableCell>
                <TableCell>
                  <Badge variant={ESTADO_EXPENSA_COLORS[expensa.estado] as any}>
                    {ESTADO_EXPENSA_LABELS[expensa.estado]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {formatDate(expensa.fecha_vencimiento)}
                    {isVencida(expensa.fecha_vencimiento) &&
                      expensa.estado !== "pagado" && (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {canRegistrarPago(expensa) && (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => onRegistrarPago(expensa.id)}
                      >
                        <DollarSign className="h-4 w-4 mr-1" />
                        Pagar
                      </Button>
                    )}
                    {parseFloat(expensa.monto_pagado) > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onVerComprobante(expensa.id)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Comprobante
                      </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onEdit(expensa.id)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDelete(expensa.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {data.count > data.results.length && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {data.results.length} de {data.count} expensas
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange((data.current_page || 1) - 1)}
              disabled={!data.previous || loading}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange((data.current_page || 1) + 1)}
              disabled={!data.next || loading}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
