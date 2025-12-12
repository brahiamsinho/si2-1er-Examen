import { useRef } from "react";
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
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Printer } from "lucide-react";
import type { Expensa } from "@/types";
import { METODO_PAGO_LABELS } from "@/types";

interface ComprobanteModalProps {
  open: boolean;
  onClose: () => void;
  expensa: Expensa | null;
}

export function ComprobanteModal({
  open,
  onClose,
  expensa,
}: ComprobanteModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

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
      return format(parseISO(dateString), "dd 'de' MMMM 'de' yyyy", {
        locale: es,
      });
    } catch {
      return dateString;
    }
  };

  const formatDateShort = (dateString: string) => {
    try {
      return format(parseISO(dateString), "dd/MM/yyyy", { locale: es });
    } catch {
      return dateString;
    }
  };

  const handlePrint = () => {
    if (printRef.current) {
      const printContent = printRef.current.innerHTML;
      const originalContent = document.body.innerHTML;

      document.body.innerHTML = printContent;
      window.print();
      document.body.innerHTML = originalContent;
      window.location.reload(); // Recargar para restaurar React
    }
  };

  if (!expensa) return null;

  const totalConceptos = expensa.conceptos.reduce(
    (sum, concepto) => sum + parseFloat(concepto.monto),
    0
  );
  const montoTotal = parseFloat(expensa.monto_base) + totalConceptos;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Comprobante de Expensa</DialogTitle>
          <DialogDescription>
            Detalle completo de la expensa y sus pagos
          </DialogDescription>
        </DialogHeader>

        <div ref={printRef} className="space-y-6 p-6 bg-white">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold">COMPROBANTE DE EXPENSA</h1>
            <p className="text-lg font-medium">Condominium Smart</p>
            <p className="text-sm text-muted-foreground">
              Sistema de Gestión de Condominios
            </p>
          </div>

          <Separator />

          {/* Información de la Expensa */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">N° de Expensa</p>
                <p className="text-lg font-semibold">#{expensa.id}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Periodo</p>
                <p className="text-lg font-semibold">{expensa.periodo}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Unidad Habitacional
                </p>
                <p className="text-lg font-semibold">{expensa.unidad_codigo}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">
                  Fecha de Emisión
                </p>
                <p className="text-lg font-semibold">
                  {formatDate(expensa.fecha_emision)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Fecha de Vencimiento
                </p>
                <p className="text-lg font-semibold">
                  {formatDate(expensa.fecha_vencimiento)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Estado</p>
                <p className="text-lg font-semibold capitalize">
                  {expensa.estado}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Conceptos */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Detalle de Conceptos</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Monto Base</TableCell>
                  <TableCell>Cuota mensual base</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(expensa.monto_base)}
                  </TableCell>
                </TableRow>
                {expensa.conceptos.map((concepto, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium capitalize">
                      {concepto.tipo}
                    </TableCell>
                    <TableCell>{concepto.descripcion}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(concepto.monto)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50 font-semibold">
                  <TableCell colSpan={2} className="text-right">
                    MONTO TOTAL
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(expensa.monto_total)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {/* Pagos Realizados */}
          {expensa.pagos && expensa.pagos.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-3">Pagos Realizados</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Método</TableHead>
                      <TableHead>N° Comprobante</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expensa.pagos.map((pago, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {formatDateShort(pago.fecha_pago)}
                        </TableCell>
                        <TableCell>
                          {METODO_PAGO_LABELS[pago.metodo_pago]}
                        </TableCell>
                        <TableCell>
                          {pago.numero_comprobante || "N/A"}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(pago.monto)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/50 font-semibold">
                      <TableCell colSpan={3} className="text-right">
                        TOTAL PAGADO
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        {formatCurrency(expensa.monto_pagado)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </>
          )}

          {/* Resumen de Saldo */}
          <Separator />
          <div className="grid grid-cols-3 gap-4 bg-muted/30 p-4 rounded-lg">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Monto Total</p>
              <p className="text-xl font-bold">
                {formatCurrency(expensa.monto_total)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Pagado</p>
              <p className="text-xl font-bold text-green-600">
                {formatCurrency(expensa.monto_pagado)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">
                Saldo Pendiente
              </p>
              <p className="text-xl font-bold text-red-600">
                {formatCurrency(expensa.saldo_pendiente)}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-sm text-muted-foreground mt-8">
            <p>Documento generado el {formatDate(new Date().toISOString())}</p>
            <p className="mt-2">
              Para consultas o aclaraciones, contacte a la administración del
              condominio
            </p>
          </div>
        </div>

        <DialogFooter className="print:hidden">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
