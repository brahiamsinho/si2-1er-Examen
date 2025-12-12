import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format, parseISO } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, AlertCircle } from "lucide-react";
import type { Expensa, RegistrarPagoData, MetodoPago } from "@/types";
import { METODO_PAGO_LABELS } from "@/types";
import { cn } from "@/lib/utils";

const registrarPagoSchema = z.object({
  monto: z.number().min(0.01, "El monto debe ser mayor a 0"),
  metodo_pago: z.enum(["efectivo", "transferencia", "qr", "tarjeta"], {
    message: "Debe seleccionar un método de pago",
  }),
  numero_comprobante: z.string().optional(),
  fecha_pago: z.date(),
  observaciones: z.string().optional(),
});

type RegistrarPagoFormValues = z.infer<typeof registrarPagoSchema>;

interface RegistrarPagoModalProps {
  open: boolean;
  onClose: () => void;
  expensa: Expensa | null;
  onRegistrar: (expensaId: number, data: RegistrarPagoData) => Promise<void>;
}

export function RegistrarPagoModal({
  open,
  onClose,
  expensa,
  onRegistrar,
}: RegistrarPagoModalProps) {
  const [loading, setLoading] = useState(false);

  const saldoPendiente = expensa ? parseFloat(expensa.saldo_pendiente) : 0;

  const pagoSchema = registrarPagoSchema.refine(
    (data) => data.monto <= saldoPendiente,
    {
      message: `El monto no puede ser mayor al saldo pendiente (Bs. ${saldoPendiente.toFixed(
        2
      )})`,
      path: ["monto"],
    }
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<RegistrarPagoFormValues>({
    resolver: zodResolver(registrarPagoSchema),
    defaultValues: {
      monto: 0,
      metodo_pago: "efectivo",
      numero_comprobante: "",
      fecha_pago: new Date(),
      observaciones: "",
    },
  });

  const metodoPago = watch("metodo_pago");
  const fechaPago = watch("fecha_pago");
  const montoIngresado = watch("monto");

  useEffect(() => {
    if (open && expensa) {
      reset({
        monto: parseFloat(expensa.saldo_pendiente),
        metodo_pago: "efectivo",
        numero_comprobante: "",
        fecha_pago: new Date(),
        observaciones: "",
      });
    }
  }, [open, expensa, reset]);

  const onSubmit = async (data: RegistrarPagoFormValues) => {
    if (!expensa) return;

    try {
      setLoading(true);

      const payload: RegistrarPagoData = {
        monto: data.monto,
        metodo_pago: data.metodo_pago,
        numero_comprobante: data.numero_comprobante || undefined,
        fecha_pago: data.fecha_pago,
        observaciones: data.observaciones || undefined,
      };

      await onRegistrar(expensa.id, payload);
      onClose();
      reset();
    } catch (error) {
      console.error("Error registrando pago:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-BO", {
      style: "currency",
      currency: "BOB",
      minimumFractionDigits: 2,
    }).format(value);
  };

  const requiereComprobante = metodoPago && metodoPago !== "efectivo";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Registrar Pago</DialogTitle>
          <DialogDescription>
            Registra un nuevo pago para la expensa
          </DialogDescription>
        </DialogHeader>

        {expensa && (
          <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Periodo:</p>
                <p className="font-medium">{expensa.periodo}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Unidad:</p>
                <p className="font-medium">{expensa.unidad_codigo}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Monto Total:</p>
                <p className="font-medium">
                  {formatCurrency(parseFloat(expensa.monto_total))}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Monto Pagado:</p>
                <p className="font-medium text-green-600">
                  {formatCurrency(parseFloat(expensa.monto_pagado))}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-muted-foreground">Saldo Pendiente:</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(parseFloat(expensa.saldo_pendiente))}
                </p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Monto */}
            <div className="space-y-2">
              <Label htmlFor="monto">
                Monto a Pagar <span className="text-red-500">*</span>
              </Label>
              <Input
                id="monto"
                type="number"
                step="0.01"
                {...register("monto", { valueAsNumber: true })}
                disabled={loading}
              />
              {errors.monto && (
                <p className="text-sm text-red-500">{errors.monto.message}</p>
              )}
              {montoIngresado > 0 && montoIngresado <= saldoPendiente && (
                <p className="text-sm text-muted-foreground">
                  Nuevo saldo: {formatCurrency(saldoPendiente - montoIngresado)}
                </p>
              )}
            </div>

            {/* Método de Pago */}
            <div className="space-y-2">
              <Label htmlFor="metodo_pago">
                Método de Pago <span className="text-red-500">*</span>
              </Label>
              <Select
                value={metodoPago}
                onValueChange={(value) =>
                  setValue("metodo_pago", value as MetodoPago)
                }
                disabled={loading}
              >
                <SelectTrigger id="metodo_pago">
                  <SelectValue placeholder="Seleccionar método" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(METODO_PAGO_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.metodo_pago && (
                <p className="text-sm text-red-500">
                  {errors.metodo_pago.message}
                </p>
              )}
            </div>

            {/* Número de Comprobante */}
            <div className="space-y-2">
              <Label htmlFor="numero_comprobante">
                N° Comprobante{" "}
                {requiereComprobante && <span className="text-red-500">*</span>}
              </Label>
              <Input
                id="numero_comprobante"
                placeholder="Ej: 001234"
                {...register("numero_comprobante")}
                disabled={loading}
              />
              {errors.numero_comprobante && (
                <p className="text-sm text-red-500">
                  {errors.numero_comprobante.message}
                </p>
              )}
            </div>

            {/* Fecha de Pago */}
            <div className="space-y-2">
              <Label>
                Fecha de Pago <span className="text-red-500">*</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !fechaPago && "text-muted-foreground"
                    )}
                    disabled={loading}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {fechaPago ? (
                      format(fechaPago, "dd/MM/yyyy")
                    ) : (
                      <span>Seleccionar fecha</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={fechaPago}
                    onSelect={(date) => date && setValue("fecha_pago", date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.fecha_pago && (
                <p className="text-sm text-red-500">
                  {errors.fecha_pago.message}
                </p>
              )}
            </div>
          </div>

          {/* Observaciones */}
          <div className="space-y-2">
            <Label htmlFor="observaciones">Observaciones</Label>
            <Textarea
              id="observaciones"
              placeholder="Información adicional sobre el pago..."
              {...register("observaciones")}
              disabled={loading}
              rows={3}
            />
          </div>

          {/* Info Alert */}
          {montoIngresado > 0 && montoIngresado < saldoPendiente && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div className="flex gap-2">
                <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium">Pago Parcial</p>
                  <p className="mt-1">
                    El monto ingresado es menor al saldo pendiente. La expensa
                    quedará en estado "Pagado Parcial" y podrás registrar más
                    pagos posteriormente.
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Registrando..." : "Registrar Pago"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
