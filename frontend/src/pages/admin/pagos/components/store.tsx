import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
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
import { CalendarIcon, Plus, Trash2 } from "lucide-react";
import type { Expensa, ExpensaCreateData, ConceptoPagoInput } from "@/types";
import { TIPO_CONCEPTO_OPTIONS } from "@/types";
import { unidadesApi } from "@/services/unidades.api";
import { cn } from "@/lib/utils";

const conceptoSchema = z.object({
  tipo: z.string().min(1, "El tipo es requerido"),
  descripcion: z.string().min(1, "La descripción es requerida"),
  monto: z.number().min(0, "El monto debe ser mayor o igual a 0"),
});

const expensaSchema = z
  .object({
    periodo: z
      .string()
      .regex(/^\d{4}-\d{2}$/, "El periodo debe tener formato YYYY-MM"),
    monto_base: z.number().min(0, "El monto base debe ser mayor o igual a 0"),
    fecha_emision: z.date(),
    fecha_vencimiento: z.date(),
    unidad: z.number().min(1, "Debe seleccionar una unidad"),
    conceptos: z
      .array(conceptoSchema)
      .min(1, "Debe agregar al menos un concepto"),
  })
  .refine((data) => data.fecha_vencimiento > data.fecha_emision, {
    message: "La fecha de vencimiento debe ser posterior a la fecha de emisión",
    path: ["fecha_vencimiento"],
  });

type ExpensaFormValues = z.infer<typeof expensaSchema>;

interface PagosStoreModalProps {
  open: boolean;
  onClose: () => void;
  item: Expensa | null;
  onCreate: (data: ExpensaCreateData) => Promise<void>;
  onUpdate: (id: number, data: ExpensaCreateData) => Promise<void>;
}

export function PagosStoreModal({
  open,
  onClose,
  item,
  onCreate,
  onUpdate,
}: PagosStoreModalProps) {
  const [loading, setLoading] = useState(false);
  const [unidades, setUnidades] = useState<{ id: number; codigo: string }[]>(
    []
  );
  const isEditing = !!item;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
    setValue,
    watch,
  } = useForm<ExpensaFormValues>({
    resolver: zodResolver(expensaSchema),
    defaultValues: {
      periodo: "",
      monto_base: 0,
      fecha_emision: new Date(),
      fecha_vencimiento: new Date(),
      unidad: 0,
      conceptos: [
        {
          tipo: "mantenimiento",
          descripcion: "",
          monto: 0,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "conceptos",
  });

  const fechaEmision = watch("fecha_emision");
  const fechaVencimiento = watch("fecha_vencimiento");

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
    if (open && item) {
      reset({
        periodo: item.periodo,
        monto_base: parseFloat(item.monto_base),
        fecha_emision: parseISO(item.fecha_emision),
        fecha_vencimiento: parseISO(item.fecha_vencimiento),
        unidad: item.unidad,
        conceptos: item.conceptos.map((c) => ({
          tipo: c.tipo,
          descripcion: c.descripcion,
          monto: parseFloat(c.monto),
        })),
      });
    } else if (open && !item) {
      reset({
        periodo: "",
        monto_base: 0,
        fecha_emision: new Date(),
        fecha_vencimiento: new Date(),
        unidad: 0,
        conceptos: [
          {
            tipo: "mantenimiento",
            descripcion: "",
            monto: 0,
          },
        ],
      });
    }
  }, [open, item, reset]);

  const onSubmit = async (data: ExpensaFormValues) => {
    try {
      setLoading(true);

      const payload: ExpensaCreateData = {
        periodo: data.periodo,
        monto_base: data.monto_base,
        fecha_emision: data.fecha_emision,
        fecha_vencimiento: data.fecha_vencimiento,
        unidad: data.unidad,
        conceptos: data.conceptos,
      };

      if (isEditing && item) {
        await onUpdate(item.id, payload);
      } else {
        await onCreate(payload);
      }

      onClose();
      reset();
    } catch (error) {
      console.error("Error guardando expensa:", error);
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Expensa" : "Nueva Expensa"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifica los datos de la expensa"
              : "Completa los datos para crear una nueva expensa"}
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
                placeholder="YYYY-MM"
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

            {/* Unidad */}
            <div className="space-y-2">
              <Label htmlFor="unidad">
                Unidad <span className="text-red-500">*</span>
              </Label>
              <Select
                value={watch("unidad")?.toString() || "0"}
                onValueChange={(value) => setValue("unidad", Number(value))}
                disabled={loading}
              >
                <SelectTrigger id="unidad">
                  <SelectValue placeholder="Seleccionar unidad" />
                </SelectTrigger>
                <SelectContent>
                  {unidades.map((unidad) => (
                    <SelectItem key={unidad.id} value={unidad.id.toString()}>
                      {unidad.codigo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.unidad && (
                <p className="text-sm text-red-500">{errors.unidad.message}</p>
              )}
            </div>

            {/* Fecha Emisión */}
            <div className="space-y-2">
              <Label>
                Fecha Emisión <span className="text-red-500">*</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !fechaEmision && "text-muted-foreground"
                    )}
                    disabled={loading}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {fechaEmision ? (
                      format(fechaEmision, "dd/MM/yyyy")
                    ) : (
                      <span>Seleccionar fecha</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={fechaEmision}
                    onSelect={(date) => date && setValue("fecha_emision", date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.fecha_emision && (
                <p className="text-sm text-red-500">
                  {errors.fecha_emision.message}
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
                  {/* Tipo */}
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
                    {errors.conceptos?.[index]?.tipo && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.conceptos[index]?.tipo?.message}
                      </p>
                    )}
                  </div>

                  {/* Descripción */}
                  <div className="md:col-span-5">
                    <Input
                      placeholder="Descripción"
                      {...register(`conceptos.${index}.descripcion`)}
                      disabled={loading}
                    />
                    {errors.conceptos?.[index]?.descripcion && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.conceptos[index]?.descripcion?.message}
                      </p>
                    )}
                  </div>

                  {/* Monto */}
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
                    {errors.conceptos?.[index]?.monto && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.conceptos[index]?.monto?.message}
                      </p>
                    )}
                  </div>

                  {/* Remove Button */}
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
              {loading ? "Guardando..." : isEditing ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
