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
import { X, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TIPO_MULTA_COLORS, type Multa } from "@/types";

interface MultaCancelProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (motivo: string) => Promise<boolean>;
  multa: Multa;
}

export function MultaCancel({
  isOpen,
  onClose,
  onConfirm,
  multa,
}: MultaCancelProps) {
  const [motivo, setMotivo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleConfirm = async () => {
    if (!motivo.trim()) {
      setError("Debe proporcionar un motivo para cancelar la multa");
      return;
    }

    if (motivo.trim().length < 10) {
      setError("El motivo debe tener al menos 10 caracteres");
      return;
    }

    setIsSubmitting(true);
    setError("");
    const success = await onConfirm(motivo.trim());
    setIsSubmitting(false);

    if (success) {
      setMotivo("");
      onClose();
    }
  };

  const formatCurrency = (amount: string) => {
    return `Bs. ${parseFloat(amount).toFixed(2)}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <X className="h-5 w-5 text-orange-600" />
            Cancelar Multa
          </DialogTitle>
          <DialogDescription>
            Esta acción cancelará la multa de forma permanente
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Advertencia */}
          <div className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-orange-800">Atención</p>
              <p className="text-orange-700">
                La cancelación de una multa es irreversible. Asegúrese de
                proporcionar un motivo válido y detallado.
              </p>
            </div>
          </div>

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
              <span className="text-sm font-medium">Monto:</span>
              <span className="text-sm font-semibold">
                {formatCurrency(multa.monto_total)}
              </span>
            </div>
            <div className="border-t pt-2">
              <span className="text-sm font-medium">Descripción:</span>
              <p className="text-sm text-muted-foreground mt-1">
                {multa.descripcion}
              </p>
            </div>
          </div>

          {/* Motivo de cancelación */}
          <div className="space-y-2">
            <Label htmlFor="motivo">Motivo de Cancelación *</Label>
            <Textarea
              id="motivo"
              placeholder="Explique detalladamente por qué se cancela esta multa..."
              rows={4}
              value={motivo}
              onChange={(e) => {
                setMotivo(e.target.value);
                setError("");
              }}
              className={error ? "border-red-500" : ""}
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <p className="text-xs text-muted-foreground">
              Mínimo 10 caracteres. Este motivo quedará registrado en el
              sistema.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Volver
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isSubmitting || !motivo.trim()}
            variant="destructive"
          >
            {isSubmitting ? "Cancelando..." : "Confirmar Cancelación"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
