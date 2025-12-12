import { useState } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import type { Expensa } from "@/types";
import { ESTADO_EXPENSA_LABELS, ESTADO_EXPENSA_COLORS } from "@/types";

interface DeleteModalProps {
  open: boolean;
  onClose: () => void;
  item: Expensa | null;
  onConfirm: (id: number) => Promise<void>;
}

export function DeleteModal({
  open,
  onClose,
  item,
  onConfirm,
}: DeleteModalProps) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!item) return;

    try {
      setLoading(true);
      await onConfirm(item.id);
      onClose();
    } catch (error) {
      console.error("Error eliminando expensa:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat("es-BO", {
      style: "currency",
      currency: "BOB",
      minimumFractionDigits: 2,
    }).format(parseFloat(value));
  };

  const hasPagos = item && parseFloat(item.monto_pagado) > 0;

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            ¿Eliminar Expensa?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. La expensa será eliminada
            permanentemente del sistema.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {item && (
          <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Periodo:</p>
                <p className="font-medium">{item.periodo}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Unidad:</p>
                <p className="font-medium">{item.unidad_codigo}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Monto Total:</p>
                <p className="font-medium">
                  {formatCurrency(item.monto_total)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Estado:</p>
                <Badge variant={ESTADO_EXPENSA_COLORS[item.estado] as any}>
                  {ESTADO_EXPENSA_LABELS[item.estado]}
                </Badge>
              </div>
            </div>

            {hasPagos && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <div className="flex gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-800">
                    <p className="font-medium">¡Atención!</p>
                    <p className="mt-1">
                      Esta expensa tiene pagos registrados por un total de{" "}
                      <span className="font-semibold">
                        {formatCurrency(item.monto_pagado)}
                      </span>
                      . Al eliminarla, también se eliminarán todos los pagos
                      asociados.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <AlertDialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? "Eliminando..." : "Eliminar"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
