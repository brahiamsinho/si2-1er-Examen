import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
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
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarIcon, Plus, Trash2, AlertCircle } from "lucide-react";
import type { GenerarMasivoData } from "@/types";
import { TIPO_CONCEPTO_OPTIONS } from "@/types";
import { unidadesApi } from "@/services/unidades.api";
import { cn } from "@/lib/utils";

const conceptoSchema = z.object({
  tipo: z.string().min(1, "El tipo es requerido"),
  descripcion: z.string().min(1, "La descripción es requerida"),
  monto: z.number().min(0, "El monto debe ser mayor o igual a 0"),
});

const generarMasivoSchema = z.object({
  periodo: z
    .string()
    .regex(/^\d{4}-\d{2}$/, "El periodo debe tener formato YYYY-MM"),
  monto_base: z.number().min(0, "El monto base debe ser mayor o igual a 0"),
  fecha_vencimiento: z.date(),
  conceptos: z
    .array(conceptoSchema)
    .min(1, "Debe agregar al menos un concepto"),
  unidades: z.array(z.number()).optional(),
});

type GenerarMasivoFormValues = z.infer<typeof generarMasivoSchema>;

interface GenerarMasivoModalProps {
  open: boolean;
  onClose: () => void;
  onGenerar: (data: GenerarMasivoData) => Promise<void>;
}

export function GenerarMasivoModal({
  open,
  onClose,
  onGenerar,
}: GenerarMasivoModalProps) {
  const [loading, setLoading] = useState(false);
  const [unidades, setUnidades] = useState<{ id: number; codigo: string }[]>(
    []
  );
  const [todasLasUnidades, setTodasLasUnidades] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
    setValue,
    watch,
  } = useForm<GenerarMasivoFormValues>({
    resolver: zodResolver(generarMasivoSchema),
    defaultValues: {
      periodo: "",
      monto_base: 0,
      fecha_vencimiento: new Date(),
      conceptos: [
        {
          tipo: "mantenimiento",
          descripcion: "",
          monto: 0,
        },
      ],
      unidades: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "conceptos",
  });

  const fechaVencimiento = watch("fecha_vencimiento");
  const unidadesSeleccionadas = watch("unidades") || [];

  useEffect(() => {
    const loadUnidades = async () => {
      try {
        const response = await unidadesApi.list({ page: 1, page_size: 100 });
        setUnidades(
          response.results.map((u) => ({
            id: u.id,
            codigo: u.codigo,
          }))
        );
      } catch (error) {
        console.error("Error cargando unidades:", error);
      }
    };
    loadUnidades();
  }, []);

  useEffect(() => {
    if (open) {
      reset({
        periodo: "",
        monto_base: 0,
        fecha_vencimiento: new Date(),
        conceptos: [
          {
            tipo: "mantenimiento",
            descripcion: "",
            monto: 0,
          },
        ],
        unidades: [],
      });
      setTodasLasUnidades(true);
    }
  }, [open, reset]);

  const onSubmit = async (data: GenerarMasivoFormValues) => {
    try {
      setLoading(true);

      const payload: GenerarMasivoData = {
        periodo: data.periodo,
        monto_base: data.monto_base,
        fecha_vencimiento: data.fecha_vencimiento,
        conceptos: data.conceptos,
        ...(todasLasUnidades ? {} : { unidades: data.unidades }),
      };

      await onGenerar(payload);
      onClose();
      reset();
    } catch (error) {
      console.error("Error generando expensas:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddConcepto = () => {
    append({
      tipo: "mantenimiento",
      descripcion: "",
      monto: 0,
    });
  };

  const handleToggleUnidad = (unidadId: number) => {
    const current = unidadesSeleccionadas;
    const isSelected = current.includes(unidadId);

    if (isSelected) {
      setValue(
        "unidades",
        current.filter((id) => id !== unidadId)
      );
    } else {
      setValue("unidades", [...current, unidadId]);
    }
  };

  const handleToggleTodasUnidades = (checked: boolean) => {
    setTodasLasUnidades(checked);
    if (checked) {
      setValue("unidades", []);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generar Expensas Masivas</DialogTitle>
          <DialogDescription>
            Genera expensas para todas o algunas unidades del condominio
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Periodo */}
            <div className="space-y-2">
              <Label htmlFor="periodo">
                Periodo <span className="text-red-500">*</span>
              </Label>
              <Input
                id="periodo"
                placeholder="YYYY-MM (ej: 2024-01)"
                {...register("periodo")}
                disabled={loading}
              />
              {errors.periodo && (
                <p className="text-sm text-red-500">{errors.periodo.message}</p>
              )}
            </div>

            {/* Monto Base */}
            <div className="space-y-2">
              <Label htmlFor="monto_base">
                Monto Base <span className="text-red-500">*</span>
              </Label>
              <Input
                id="monto_base"
                type="number"
                step="0.01"
                {...register("monto_base", { valueAsNumber: true })}
                disabled={loading}
              />
              {errors.monto_base && (
                <p className="text-sm text-red-500">
                  {errors.monto_base.message}
                </p>
              )}
            </div>

            {/* Fecha Vencimiento */}
            <div className="space-y-2 md:col-span-2">
              <Label>
                Fecha Vencimiento <span className="text-red-500">*</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !fechaVencimiento && "text-muted-foreground"
                    )}
                    disabled={loading}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {fechaVencimiento ? (
                      format(fechaVencimiento, "dd/MM/yyyy")
                    ) : (
                      <span>Seleccionar fecha</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={fechaVencimiento}
                    onSelect={(date) =>
                      date && setValue("fecha_vencimiento", date)
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.fecha_vencimiento && (
                <p className="text-sm text-red-500">
                  {errors.fecha_vencimiento.message}
                </p>
              )}
            </div>
          </div>

          {/* Conceptos */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>
                Conceptos <span className="text-red-500">*</span>
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddConcepto}
                disabled={loading}
              >
                <Plus className="mr-2 h-4 w-4" />
                Agregar Concepto
              </Button>
            </div>

            <div className="space-y-3 rounded-lg border p-4">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="grid gap-3 md:grid-cols-12 items-start"
                >
                  <div className="md:col-span-3">
                    <Select
                      value={watch(`conceptos.${index}.tipo`)}
                      onValueChange={(value) =>
                        setValue(`conceptos.${index}.tipo`, value)
                      }
                      disabled={loading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIPO_CONCEPTO_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="md:col-span-5">
                    <Input
                      placeholder="Descripción"
                      {...register(`conceptos.${index}.descripcion`)}
                      disabled={loading}
                    />
                  </div>

                  <div className="md:col-span-3">
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Monto"
                      {...register(`conceptos.${index}.monto`, {
                        valueAsNumber: true,
                      })}
                      disabled={loading}
                    />
                  </div>

                  <div className="md:col-span-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(index)}
                      disabled={fields.length === 1 || loading}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            {errors.conceptos && (
              <p className="text-sm text-red-500">{errors.conceptos.message}</p>
            )}
          </div>

          {/* Unidades */}
          <div className="space-y-2">
            <Label>Unidades</Label>
            <div className="flex items-center space-x-2 mb-3">
              <Checkbox
                id="todas-unidades"
                checked={todasLasUnidades}
                onCheckedChange={handleToggleTodasUnidades}
                disabled={loading}
              />
              <Label
                htmlFor="todas-unidades"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Generar para todas las unidades
              </Label>
            </div>

            {!todasLasUnidades && (
              <div className="rounded-lg border p-4">
                <div className="grid gap-2 md:grid-cols-4">
                  {unidades.map((unidad) => (
                    <div
                      key={unidad.id}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={`unidad-${unidad.id}`}
                        checked={unidadesSeleccionadas.includes(unidad.id)}
                        onCheckedChange={() => handleToggleUnidad(unidad.id)}
                        disabled={loading}
                      />
                      <Label
                        htmlFor={`unidad-${unidad.id}`}
                        className="text-sm font-normal"
                      >
                        {unidad.codigo}
                      </Label>
                    </div>
                  ))}
                </div>
                {!todasLasUnidades && unidadesSeleccionadas.length === 0 && (
                  <div className="flex items-center gap-2 mt-3 text-sm text-amber-600">
                    <AlertCircle className="h-4 w-4" />
                    <span>
                      Selecciona al menos una unidad o marca "todas las
                      unidades"
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Info Alert */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="flex gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">Información importante:</p>
                <ul className="mt-2 list-disc list-inside space-y-1">
                  <li>
                    Se generará una expensa por cada unidad{" "}
                    {todasLasUnidades
                      ? "del condominio"
                      : `seleccionada (${unidadesSeleccionadas.length})`}
                  </li>
                  <li>
                    El monto total será calculado como: Monto Base + Suma de
                    Conceptos
                  </li>
                  <li>La fecha de emisión será la fecha actual</li>
                  <li>
                    Esta acción no se puede deshacer, pero puedes eliminar las
                    expensas individualmente después
                  </li>
                </ul>
              </div>
            </div>
          </div>

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
              {loading ? "Generando..." : "Generar Expensas"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
