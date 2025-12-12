import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Edit, Trash2, DollarSign, X, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TIPO_MULTA_COLORS,
  ESTADO_MULTA_COLORS,
  type MultaListItem,
} from "@/types";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface MultaTableProps {
  multas: MultaListItem[];
  loading: boolean;
  onEdit: (multa: MultaListItem) => void;
  onDelete: (multa: MultaListItem) => void;
  onPay: (multa: MultaListItem) => void;
  onCancel: (multa: MultaListItem) => void;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function MultaTable({
  multas,
  loading,
  onEdit,
  onDelete,
  onPay,
  onCancel,
  page,
  totalPages,
  onPageChange,
}: MultaTableProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-12 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!multas || multas.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">
              No hay multas registradas
            </h3>
            <p className="text-muted-foreground mt-2">
              Comienza agregando una nueva multa usando el botón superior.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "dd MMM yyyy", { locale: es });
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount: string) => {
    return `Bs. ${parseFloat(amount).toFixed(2)}`;
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Residente</TableHead>
                <TableHead>Unidad</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha Emisión</TableHead>
                <TableHead>Vencimiento</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {multas.map((multa) => (
                <TableRow key={multa.id}>
                  <TableCell>
                    <Badge className={TIPO_MULTA_COLORS[multa.tipo]}>
                      {multa.tipo_display}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <div className="truncate" title={multa.descripcion}>
                      {multa.descripcion}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{multa.residente_nombre}</div>
                  </TableCell>
                  <TableCell>{multa.unidad_nombre || "-"}</TableCell>
                  <TableCell>
                    <div className="font-semibold">
                      {formatCurrency(multa.monto_total)}
                    </div>
                    {parseFloat(multa.monto_total) >
                      parseFloat(multa.monto) && (
                      <div className="text-xs text-red-600">(+recargo)</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge className={ESTADO_MULTA_COLORS[multa.estado]}>
                        {multa.estado_display}
                      </Badge>
                      {multa.esta_vencida && multa.estado === "pendiente" && (
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(multa.fecha_emision)}</TableCell>
                  <TableCell>
                    <div
                      className={
                        multa.esta_vencida ? "text-red-600 font-semibold" : ""
                      }
                    >
                      {formatDate(multa.fecha_vencimiento)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      {multa.estado === "pendiente" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onPay(multa)}
                          title="Marcar como pagado"
                        >
                          <DollarSign className="h-4 w-4 text-green-600" />
                        </Button>
                      )}
                      {multa.estado === "pendiente" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onCancel(multa)}
                          title="Cancelar multa"
                        >
                          <X className="h-4 w-4 text-orange-600" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(multa)}
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(multa)}
                        title="Eliminar"
                        className="hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="mt-4">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => page > 1 && onPageChange(page - 1)}
                    className={
                      page === 1
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>

                {[...Array(totalPages)].map((_, i) => {
                  const pageNumber = i + 1;
                  if (
                    pageNumber === 1 ||
                    pageNumber === totalPages ||
                    (pageNumber >= page - 1 && pageNumber <= page + 1)
                  ) {
                    return (
                      <PaginationItem key={pageNumber}>
                        <PaginationLink
                          onClick={() => onPageChange(pageNumber)}
                          isActive={page === pageNumber}
                          className="cursor-pointer"
                        >
                          {pageNumber}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  } else if (
                    pageNumber === page - 2 ||
                    pageNumber === page + 2
                  ) {
                    return (
                      <PaginationItem key={pageNumber}>
                        <span className="px-2">...</span>
                      </PaginationItem>
                    );
                  }
                  return null;
                })}

                <PaginationItem>
                  <PaginationNext
                    onClick={() => page < totalPages && onPageChange(page + 1)}
                    className={
                      page === totalPages
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
