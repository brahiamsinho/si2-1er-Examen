import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  TIPOS_VEHICULO,
  ESTADOS_VEHICULO,
  type Vehiculo,
  type VehiculoFormData,
} from "@/types/vehiculos";
import { useResidentes } from "@/hooks/useResidentes";
import { useUnidades } from "@/hooks/useUnidades";

const vehiculoSchema = z.object({
  placa: z
    .string()
    .min(1, "La placa es requerida")
    .regex(/^[A-Z]{3}-?\d{4}$/, "Formato inválido. Use: ABC-1234 o ABC1234")
    .transform((val) => val.toUpperCase()),
  tipo: z.enum(["auto", "moto", "camioneta", "suv", "otro"], {
    required_error: "Seleccione un tipo de vehículo",
  }),
  marca: z.string().min(1, "La marca es requerida"),
  modelo: z.string().min(1, "El modelo es requerido"),
  color: z.string().min(1, "El color es requerido"),
  año: z.coerce
    .number()
    .min(1900)
    .max(new Date().getFullYear() + 1)
    .nullable()
    .optional(),
  residente: z.coerce.number({
    required_error: "Seleccione un residente",
  }),
  unidad: z.coerce.number().nullable().optional(),
  estado: z.enum(["activo", "inactivo", "suspendido"]),
  fecha_autorizacion: z
    .string()
    .min(1, "La fecha de autorización es requerida"),
  fecha_vencimiento: z.string().nullable().optional(),
  observaciones: z.string().optional().default(""),
});

type VehiculoFormValues = z.infer<typeof vehiculoSchema>;

interface CreateEditDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: VehiculoFormData) => Promise<void>;
  vehiculo?: Vehiculo | null;
  isLoading: boolean;
}

export function CreateEditDialog({
  open,
  onClose,
  onSubmit,
  vehiculo,
  isLoading,
}: CreateEditDialogProps) {
  const { residentes, cargarResidentes } = useResidentes();
  const { unidades, loadUnidades } = useUnidades();
  const [selectedResidente, setSelectedResidente] = useState<number | null>(
    null
  );

  const form = useForm<VehiculoFormValues>({
    resolver: zodResolver(vehiculoSchema),
    defaultValues: {
      placa: "",
      tipo: "auto",
      marca: "",
      modelo: "",
      color: "",
      año: new Date().getFullYear(),
      residente: 0,
      unidad: null,
      estado: "activo",
      fecha_autorizacion: new Date().toISOString().split("T")[0],
      fecha_vencimiento: null,
      observaciones: "",
    },
  });

  useEffect(() => {
    cargarResidentes();
    loadUnidades();
  }, [cargarResidentes, loadUnidades]);

  useEffect(() => {
    if (vehiculo) {
      form.reset({
        placa: vehiculo.placa,
        tipo: vehiculo.tipo,
        marca: vehiculo.marca,
        modelo: vehiculo.modelo,
        color: vehiculo.color,
        año: vehiculo.año || new Date().getFullYear(),
        residente: vehiculo.residente,
        unidad: vehiculo.unidad,
        estado: vehiculo.estado,
        fecha_autorizacion: vehiculo.fecha_autorizacion,
        fecha_vencimiento: vehiculo.fecha_vencimiento || null,
        observaciones: vehiculo.observaciones || "",
      });
      setSelectedResidente(vehiculo.residente);
    } else {
      form.reset({
        placa: "",
        tipo: "auto",
        marca: "",
        modelo: "",
        color: "",
        año: new Date().getFullYear(),
        residente: 0,
        unidad: null,
        estado: "activo",
        fecha_autorizacion: new Date().toISOString().split("T")[0],
        fecha_vencimiento: null,
        observaciones: "",
      });
      setSelectedResidente(null);
    }
  }, [vehiculo, form]);

  const handleSubmit = async (data: VehiculoFormValues) => {
    await onSubmit(data as VehiculoFormData);
    form.reset();
    onClose();
  };

  const handleResidenteChange = (value: string) => {
    const residenteId = Number(value);
    setSelectedResidente(residenteId);
    form.setValue("residente", residenteId);

    // Auto-seleccionar la primera unidad del residente
    const residente = residentes.find((r) => r.id === residenteId);
    if (residente && residente.unidades && residente.unidades.length > 0) {
      form.setValue("unidad", residente.unidades[0].id);
    }
  };

  // Filtrar unidades del residente seleccionado
  const unidadesDisponibles = selectedResidente
    ? residentes.find((r) => r.id === selectedResidente)?.unidades || []
    : [];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {vehiculo ? "Editar Vehículo" : "Registrar Nuevo Vehículo"}
          </DialogTitle>
          <DialogDescription>
            {vehiculo
              ? "Modifique los datos del vehículo"
              : "Complete el formulario para registrar un nuevo vehículo"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              {/* Placa */}
              <FormField
                control={form.control}
                name="placa"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Placa *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="ABC-1234"
                        {...field}
                        onChange={(e) =>
                          field.onChange(e.target.value.toUpperCase())
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Tipo */}
              <FormField
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TIPOS_VEHICULO.map((tipo) => (
                          <SelectItem key={tipo.value} value={tipo.value}>
                            {tipo.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Marca */}
              <FormField
                control={form.control}
                name="marca"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Marca *</FormLabel>
                    <FormControl>
                      <Input placeholder="Toyota" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Modelo */}
              <FormField
                control={form.control}
                name="modelo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Modelo *</FormLabel>
                    <FormControl>
                      <Input placeholder="Corolla" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Color */}
              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color *</FormLabel>
                    <FormControl>
                      <Input placeholder="Blanco" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Año */}
              <FormField
                control={form.control}
                name="año"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Año</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="2024"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? Number(e.target.value) : null
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Residente */}
              <FormField
                control={form.control}
                name="residente"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Residente *</FormLabel>
                    <Select
                      onValueChange={handleResidenteChange}
                      value={field.value ? String(field.value) : ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione residente" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {residentes.map((residente) => (
                          <SelectItem
                            key={residente.id}
                            value={String(residente.id)}
                          >
                            {residente.nombre} {residente.apellido}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Unidad */}
              <FormField
                control={form.control}
                name="unidad"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidad</FormLabel>
                    <Select
                      onValueChange={(value) =>
                        field.onChange(value ? Number(value) : null)
                      }
                      value={field.value ? String(field.value) : ""}
                      disabled={
                        !selectedResidente || unidadesDisponibles.length === 0
                      }
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione unidad" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {unidadesDisponibles.map((unidad) => (
                          <SelectItem key={unidad.id} value={String(unidad.id)}>
                            {unidad.codigo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Estado */}
              <FormField
                control={form.control}
                name="estado"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione estado" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ESTADOS_VEHICULO.map((estado) => (
                          <SelectItem key={estado.value} value={estado.value}>
                            {estado.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Fecha Autorización */}
              <FormField
                control={form.control}
                name="fecha_autorizacion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha Autorización *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Fecha Vencimiento */}
              <FormField
                control={form.control}
                name="fecha_vencimiento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha Vencimiento</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Observaciones */}
            <FormField
              control={form.control}
              name="observaciones"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observaciones</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Observaciones adicionales..."
                      {...field}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading
                  ? "Guardando..."
                  : vehiculo
                  ? "Guardar Cambios"
                  : "Registrar Vehículo"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
