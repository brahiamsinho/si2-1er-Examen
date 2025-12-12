import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { TIPO_MULTA_LABELS, type Multa, type Residente } from "@/types";
import type { Unidad } from "@/types/unidades";
import { cn } from "@/lib/utils";

// Schema de validación
const multaSchema = z.object({
  tipo: z.enum(
    [
      "ruido",
      "estacionamiento",
      "area_comun",
      "pago_atrasado",
      "dano_propiedad",
      "incumplimiento",
      "otro",
    ],
    {
      required_error: "El tipo de multa es requerido",
    }
  ),
  descripcion: z
    .string()
    .min(10, "La descripción debe tener al menos 10 caracteres"),
  monto: z
    .string()
    .refine(
      (val) => !isNaN(parseFloat(val)),
      "El monto debe ser un número válido"
    )
    .refine((val) => parseFloat(val) >= 50, "El monto mínimo es Bs. 50"),
  residente: z.number({
    required_error: "Debe seleccionar un residente",
    invalid_type_error: "Debe seleccionar un residente válido",
  }),
  unidad: z.number().optional().nullable(),
  fecha_vencimiento: z
    .date({
      required_error: "La fecha de vencimiento es requerida",
    })
    .refine((date) => date > new Date(), {
      message: "La fecha de vencimiento debe ser posterior a hoy",
    }),
  observaciones: z.string().optional(),
});

type MultaFormData = z.infer<typeof multaSchema>;

interface MultaStoreProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<boolean>;
  multa?: Multa | null;
  residentes: Residente[];
  unidades: Unidad[];
}

export function MultaStore({
  isOpen,
  onClose,
  onSubmit,
  multa,
  residentes,
  unidades,
}: MultaStoreProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = useForm<MultaFormData>({
    resolver: zodResolver(multaSchema),
    defaultValues: {
      tipo: multa?.tipo || "ruido",
      descripcion: multa?.descripcion || "",
      monto: multa?.monto || "",
      residente: multa?.residente || undefined,
      unidad: multa?.unidad || null,
      fecha_vencimiento: multa?.fecha_vencimiento
        ? new Date(multa.fecha_vencimiento)
        : undefined,
      observaciones: multa?.observaciones || "",
    },
  });

  const selectedResidente = watch("residente");
  const selectedDate = watch("fecha_vencimiento");

  // Auto-seleccionar unidad cuando se selecciona un residente
  useEffect(() => {
    if (selectedResidente && residentes.length > 0) {
      const residente = residentes.find((r) => r.id === selectedResidente);
      if (residente) {
        const unidad = unidades.find(
          (u) => u.codigo === residente.unidad_habitacional
        );
        if (unidad) {
          setValue("unidad", unidad.id);
        }
      }
    }
  }, [selectedResidente, residentes, unidades, setValue]);

  const handleFormSubmit = async (data: MultaFormData) => {
    const success = await onSubmit({
      ...data,
      monto: parseFloat(data.monto),
    });

    if (success) {
      reset();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{multa ? "Editar Multa" : "Nueva Multa"}</DialogTitle>
          <DialogDescription>
            {multa
              ? "Modifica los datos de la multa existente"
              : "Registra una nueva multa para un residente"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* Tipo de multa */}
          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo de Multa *</Label>
            <Select
              value={watch("tipo")}
              onValueChange={(value: any) => setValue("tipo", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccione el tipo" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TIPO_MULTA_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.tipo && (
              <p className="text-sm text-red-600">{errors.tipo.message}</p>
            )}
          </div>

          {/* Residente */}
          <div className="space-y-2">
            <Label htmlFor="residente">Residente *</Label>
            <Select
              value={selectedResidente?.toString()}
              onValueChange={(value) => setValue("residente", parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccione el residente" />
              </SelectTrigger>
              <SelectContent>
                {residentes.map((residente) => (
                  <SelectItem
                    key={residente.id}
                    value={residente.id.toString()}
                  >
                    {residente.nombre_completo} -{" "}
                    {residente.unidad_habitacional}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.residente && (
              <p className="text-sm text-red-600">{errors.residente.message}</p>
            )}
          </div>

          {/* Monto */}
          <div className="space-y-2">
            <Label htmlFor="monto">Monto (Bs.) *</Label>
            <Input
              id="monto"
              type="number"
              step="0.01"
              min="50"
              placeholder="50.00"
              {...register("monto")}
            />
            {errors.monto && (
              <p className="text-sm text-red-600">{errors.monto.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Monto mínimo: Bs. 50.00
            </p>
          </div>

          {/* Fecha de vencimiento */}
          <div className="space-y-2">
            <Label>Fecha de Vencimiento *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? (
                    format(selectedDate, "PPP", { locale: es })
                  ) : (
                    <span>Seleccione una fecha</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) =>
                    setValue("fecha_vencimiento", date as Date)
                  }
                  disabled={(date) =>
                    date <= new Date() || date < new Date("1900-01-01")
                  }
                  initialFocus
                  locale={es}
                />
              </PopoverContent>
            </Popover>
            {errors.fecha_vencimiento && (
              <p className="text-sm text-red-600">
                {errors.fecha_vencimiento.message}
              </p>
            )}
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción *</Label>
            <Textarea
              id="descripcion"
              placeholder="Describe detalladamente la infracción..."
              rows={4}
              {...register("descripcion")}
            />
            {errors.descripcion && (
              <p className="text-sm text-red-600">
                {errors.descripcion.message}
              </p>
            )}
          </div>

          {/* Observaciones */}
          <div className="space-y-2">
            <Label htmlFor="observaciones">Observaciones</Label>
            <Textarea
              id="observaciones"
              placeholder="Notas adicionales (opcional)"
              rows={2}
              {...register("observaciones")}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "Guardando..."
                : multa
                ? "Actualizar"
                : "Crear Multa"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
