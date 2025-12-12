import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { DollarSign, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TIPO_MULTA_COLORS, type Multa } from "@/types";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface MultaPayProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (observaciones?: string) => Promise<boolean>;
  multa: Multa;
}

export function MultaPay({ isOpen, onClose, onConfirm, multa }: MultaPayProps) {
  const [observaciones, setObservaciones] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    const success = await onConfirm(observaciones);
    setIsSubmitting(false);

    if (success) {
      setObservaciones("");
      onClose();
    }
  };

  const formatCurrency = (amount: string) => {
    return `Bs. ${parseFloat(amount).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "dd/MM/yyyy", { locale: es });
    } catch {
      return dateString;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            Marcar como Pagado
          </DialogTitle>
          <DialogDescription>Registrar el pago de esta multa</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Información de la multa */}
          <div className="rounded-lg border p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Tipo:</span>
              <Badge className={TIPO_MULTA_COLORS[multa.tipo]}>
                {multa.tipo_display}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Residente:</span>
              <span className="text-sm">{multa.residente_nombre}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Monto Original:</span>
              <span className="text-sm">{formatCurrency(multa.monto)}</span>
            </div>
            {parseFloat(multa.recargo_mora) > 0 && (
              <div className="flex items-center justify-between text-red-600">
                <span className="text-sm font-medium">Recargo por Mora:</span>
                <span className="text-sm font-semibold">
                  {formatCurrency(multa.recargo_mora)}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between border-t pt-2">
              <span className="text-base font-bold">Total a Pagar:</span>
              <span className="text-base font-bold text-green-600">
                {formatCurrency(multa.monto_total)}
              </span>
            </div>
          </div>

          {/* Alerta si está vencida */}
          {multa.esta_vencida && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-red-800">Multa vencida</p>
                <p className="text-red-700">
                  Fecha de vencimiento: {formatDate(multa.fecha_vencimiento)}
                </p>
                <p className="text-red-700">
                  Se aplicó un recargo por mora del{" "}
                  {(
                    (parseFloat(multa.recargo_mora) / parseFloat(multa.monto)) *
                    100
                  ).toFixed(1)}
                  %
                </p>
              </div>
            </div>
          )}

          {/* Observaciones */}
          <div className="space-y-2">
            <Label htmlFor="observaciones">Observaciones (opcional)</Label>
            <Textarea
              id="observaciones"
              placeholder="Número de comprobante, notas adicionales, etc."
              rows={3}
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={isSubmitting}>
            {isSubmitting ? "Procesando..." : "Confirmar Pago"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
