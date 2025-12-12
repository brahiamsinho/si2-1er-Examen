import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TIPO_MULTA_COLORS, ESTADO_MULTA_COLORS, type Multa } from "@/types";

interface MultaDeleteProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<boolean>;
  multa: Multa;
}

export function MultaDelete({
  isOpen,
  onClose,
  onConfirm,
  multa,
}: MultaDeleteProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    const success = await onConfirm();
    setIsSubmitting(false);

    if (success) {
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
            <Trash2 className="h-5 w-5 text-red-600" />
            Eliminar Multa
          </DialogTitle>
          <DialogDescription>
            Esta acción no se puede deshacer
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Advertencia */}
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-red-800">¡Cuidado!</p>
              <p className="text-red-700">
                Está a punto de eliminar permanentemente esta multa del sistema.
                Esta acción no se puede revertir.
              </p>
            </div>
          </div>

          {/* Información de la multa a eliminar */}
          <div className="rounded-lg border p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Tipo:</span>
              <Badge className={TIPO_MULTA_COLORS[multa.tipo]}>
                {multa.tipo_display}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Estado:</span>
              <Badge className={ESTADO_MULTA_COLORS[multa.estado]}>
                {multa.estado_display}
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

          <p className="text-sm text-muted-foreground">
            ¿Está seguro que desea eliminar esta multa?
          </p>
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
          <Button
            onClick={handleConfirm}
            disabled={isSubmitting}
            variant="destructive"
          >
            {isSubmitting ? "Eliminando..." : "Sí, Eliminar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
