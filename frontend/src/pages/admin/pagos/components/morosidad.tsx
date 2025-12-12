import { useState } from "react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, FileText } from "lucide-react";
import type { UnidadMorosa } from "@/types";

interface MorosidadModalProps {
  open: boolean;
  onClose: () => void;
  data: UnidadMorosa[];
}

export function MorosidadModal({ open, onClose, data }: MorosidadModalProps) {
  const [expandedUnits, setExpandedUnits] = useState<Set<number>>(new Set());

  const formatCurrency = (value: string | number) => {
    const numValue = typeof value === "string" ? parseFloat(value) : value;
    return new Intl.NumberFormat("es-BO", {
      style: "currency",
      currency: "BOB",
      minimumFractionDigits: 2,
    }).format(numValue);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "dd/MM/yyyy", { locale: es });
    } catch {
      return dateString;
    }
  };

  const toggleUnit = (unidadId: number) => {
    const newExpanded = new Set(expandedUnits);
    if (newExpanded.has(unidadId)) {
      newExpanded.delete(unidadId);
    } else {
      newExpanded.add(unidadId);
    }
    setExpandedUnits(newExpanded);
  };

  const totalMorosidad = data.reduce(
    (sum, unidad) => sum + parseFloat(unidad.total_adeudado),
    0
  );

  const totalMeses = data.reduce(
    (sum, unidad) => sum + unidad.meses_adeudados,
    0
  );

  if (!data.length) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reporte de Morosidad</DialogTitle>
            <DialogDescription>
              Estado de cuentas pendientes por unidad
            </DialogDescription>
          </DialogHeader>
          <div className="flex h-64 items-center justify-center rounded-lg border border-dashed">
            <div className="text-center">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold">
                No hay unidades morosas
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Todas las unidades están al día con sus pagos.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={onClose}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Reporte de Morosidad</DialogTitle>
          <DialogDescription>
            Estado de cuentas pendientes por unidad habitacional
          </DialogDescription>
        </DialogHeader>

        {/* Resumen */}
        <div className="grid grid-cols-3 gap-4 bg-muted/30 p-4 rounded-lg">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">
              Unidades Morosas
            </p>
            <p className="text-2xl font-bold text-red-600">{data.length}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">Total Adeudado</p>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(totalMorosidad)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">
              Meses Adeudados
            </p>
            <p className="text-2xl font-bold text-red-600">{totalMeses}</p>
          </div>
        </div>

        {/* Tabla de Unidades Morosas */}
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Unidad</TableHead>
                <TableHead>Dirección</TableHead>
                <TableHead className="text-right">Total Adeudado</TableHead>
                <TableHead className="text-center">Meses Adeudados</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((unidad) => (
                <Collapsible
                  key={unidad.unidad_id}
                  open={expandedUnits.has(unidad.unidad_id)}
                  onOpenChange={() => toggleUnit(unidad.unidad_id)}
                  asChild
                >
                  <>
                    <TableRow className="cursor-pointer hover:bg-muted/50">
                      <TableCell>
                        <CollapsibleTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-0 h-auto"
                          >
                            {expandedUnits.has(unidad.unidad_id) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        </CollapsibleTrigger>
                      </TableCell>
                      <TableCell className="font-medium">
                        {unidad.unidad_codigo}
                      </TableCell>
                      <TableCell>{unidad.unidad_direccion}</TableCell>
                      <TableCell className="text-right font-semibold text-red-600">
                        {formatCurrency(unidad.total_adeudado)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="destructive">
                          {unidad.meses_adeudados}{" "}
                          {unidad.meses_adeudados === 1 ? "mes" : "meses"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                    <CollapsibleContent asChild>
                      <TableRow>
                        <TableCell colSpan={5} className="bg-muted/20 p-0">
                          <div className="p-4">
                            <h4 className="text-sm font-semibold mb-3">
                              Expensas Vencidas
                            </h4>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Periodo</TableHead>
                                  <TableHead>Fecha Vencimiento</TableHead>
                                  <TableHead className="text-right">
                                    Monto Total
                                  </TableHead>
                                  <TableHead className="text-right">
                                    Pagado
                                  </TableHead>
                                  <TableHead className="text-right">
                                    Saldo Pendiente
                                  </TableHead>
                                  <TableHead className="text-center">
                                    Días Vencidos
                                  </TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {unidad.expensas_vencidas.map((expensa) => (
                                  <TableRow key={expensa.id}>
                                    <TableCell className="font-medium">
                                      {expensa.periodo}
                                    </TableCell>
                                    <TableCell>
                                      {formatDate(expensa.fecha_vencimiento)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      {formatCurrency(expensa.monto_total)}
                                    </TableCell>
                                    <TableCell className="text-right text-green-600">
                                      {formatCurrency(expensa.monto_pagado)}
                                    </TableCell>
                                    <TableCell className="text-right font-semibold text-red-600">
                                      {formatCurrency(expensa.saldo_pendiente)}
                                    </TableCell>
                                    <TableCell className="text-center">
                                      <Badge variant="outline">
                                        {expensa.dias_vencidos} días
                                      </Badge>
                                    </TableCell>
                                  </TableRow>
                                ))}
                                <TableRow className="bg-muted/50 font-semibold">
                                  <TableCell colSpan={4} className="text-right">
                                    TOTAL UNIDAD
                                  </TableCell>
                                  <TableCell className="text-right text-red-600">
                                    {formatCurrency(unidad.total_adeudado)}
                                  </TableCell>
                                  <TableCell></TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </div>
                        </TableCell>
                      </TableRow>
                    </CollapsibleContent>
                  </>
                </Collapsible>
              ))}
            </TableBody>
          </Table>
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
