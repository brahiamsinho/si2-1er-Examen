import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { getUnidades } from '@/services/unidadesService';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { DatePicker } from '@/components/date-picker';
import { Loader2, Upload, X, User } from 'lucide-react';
import type { Residente } from '@/types';
import type { Unidad } from '@/types/unidades';
import { toast } from 'sonner';

// Esquema de validación para residentes
const residenteSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  apellido: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
  telefono: z.string().min(8, 'El teléfono debe tener al menos 8 caracteres'),
  email: z.string().email('Email inválido'),
  ci: z.string().min(7, 'La CI debe tener al menos 7 caracteres'),
  unidad_habitacional: z.string().optional(),
  tipo: z.enum(['propietario', 'inquilino']),
  fecha_ingreso: z.date().nullable(),
  estado: z.enum(['activo', 'inactivo', 'suspendido', 'en_proceso']),
  usuario: z.number().optional(),
});

// Extraer el tipo inferido del esquema
type ResidenteFormValues = z.infer<typeof residenteSchema>;

interface ResidenteStoreProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ResidenteFormValues) => Promise<boolean>;
  initialData?: Residente | null;
  loading?: boolean;
}

export function ResidenteStore({ 
  isOpen, 
  onClose, 
  onSubmit, 
  initialData, 
  loading = false 
}: ResidenteStoreProps) {
  const isEdit = !!initialData;
  const title = isEdit ? 'Editar Residente' : 'Crear Residente';
  const description = isEdit 
    ? 'Modifica la información del residente seleccionado' 
    : 'Agrega un nuevo residente';
    
  // Estado para almacenar las unidades habitacionales disponibles
  const [unidades, setUnidades] = useState<Unidad[]>([]);
  const [loadingUnidades, setLoadingUnidades] = useState(false);
  
  // Estado para preview de foto
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [fotoFile, setFotoFile] = useState<File | null>(null);

  const form = useForm<ResidenteFormValues>({
    resolver: zodResolver(residenteSchema),
    defaultValues: {
      nombre: '',
      apellido: '',
      telefono: '',
      email: '',
      ci: '',
      unidad_habitacional: '',
      tipo: 'propietario',
      fecha_ingreso: null,
      estado: 'activo',
    },
  });

  // Cargar las unidades habitacionales
  useEffect(() => {
    const fetchUnidades = async () => {
      if (!isOpen) return;
      
      try {
        setLoadingUnidades(true);
        const response = await getUnidades({ estado: '' });
        if (response.success && response.data) {
          setUnidades(response.data.results);
        }
      } catch (error) {
        console.error('Error al cargar unidades:', error);
        // No mostrar toast de error para evitar frustración del usuario
        // toast.error('No se pudieron cargar las unidades habitacionales');
        // Asegurarse de tener un array vacío para evitar errores
        setUnidades([]);
      } finally {
        setLoadingUnidades(false);
      }
    };
    
    fetchUnidades();
  }, [isOpen]);

  // Cargar datos iniciales cuando se abre el modal en modo edición
  useEffect(() => {
    if (isOpen && initialData) {
      // Verificar si el código de unidad existe en la lista
      let unidadValue = initialData.unidad_habitacional || '';
      if (
        !unidadValue ||
        unidadValue === '' ||
        !unidades.some((u) => u.codigo === unidadValue)
      ) {
        unidadValue = '';
      }
      form.reset({
        nombre: initialData.nombre,
        apellido: initialData.apellido,
        telefono: initialData.telefono,
        email: initialData.email,
        ci: initialData.ci,
        unidad_habitacional: unidadValue,
        tipo: initialData.tipo,
        fecha_ingreso: initialData.fecha_ingreso ? new Date(initialData.fecha_ingreso) : null,
        estado: initialData.estado,
        usuario: initialData.usuario,
      });
      
      // Establecer preview de foto existente
      if (initialData.foto_perfil) {
        setFotoPreview(initialData.foto_perfil);
      } else {
        setFotoPreview(null);
      }
      setFotoFile(null);
    } else if (isOpen && !initialData) {
      // Resetear formulario para crear nuevo
      form.reset({
        nombre: '',
        apellido: '',
        telefono: '',
        email: '',
        ci: '',
        unidad_habitacional: '',
        tipo: 'propietario',
        fecha_ingreso: null,
        estado: 'activo',
      });
      setFotoPreview(null);
      setFotoFile(null);
    }
  }, [isOpen, initialData, form]);

  const handleSubmit = async (data: ResidenteFormValues) => {
    // Validación manual para asegurar que tenemos todos los campos necesarios
    if (!data.nombre || !data.apellido || !data.telefono || !data.email || !data.ci) {
      toast.error('Por favor completa todos los campos obligatorios');
      return;
    }
    
    // Requerir fecha_ingreso solo en creación; en edición puede omitirse
    if (!isEdit && !data.fecha_ingreso) {
      form.setError('fecha_ingreso', { type: 'required', message: 'La fecha de ingreso es requerida' });
      toast.error('La fecha de ingreso es requerida para nuevos residentes');
      return;
    }
    
    try {
      // Agregar indicador visual - usaremos el estado loading
      toast.loading(isEdit ? 'Actualizando...' : 'Creando...', { id: 'submitToast' });
      
      // Agregar foto SOLO si hay un archivo nuevo (File object)
      const dataWithPhoto: any = { ...data };
      if (fotoFile instanceof File) {
        dataWithPhoto.foto_perfil = fotoFile;
      }
      // Si no hay archivo nuevo, NO incluir el campo foto_perfil
      
      // Llamar a la función onSubmit proporcionada por el componente padre
      const success = await onSubmit(dataWithPhoto);
      
      if (success) {
        toast.success(isEdit ? 'Residente actualizado exitosamente' : 'Residente creado exitosamente', { id: 'submitToast' });
        form.reset();
        setFotoPreview(null);
        setFotoFile(null);
        onClose();
      } else {
        // Feedback si no se pudo guardar
        toast.error('No se pudo guardar los cambios. Revisa los campos y vuelve a intentar.', { id: 'submitToast' });
      }
    } catch (error) {
      toast.error('Error al procesar la solicitud', { id: 'submitToast' });
    }
  };

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      toast.error('Solo se permiten archivos JPG y PNG');
      return;
    }

    // Validar tamaño (máximo 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error('La imagen no puede superar los 5MB');
      return;
    }

    // Crear preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setFotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    
    setFotoFile(file);
  };

  const handleRemoveFoto = () => {
    setFotoPreview(null);
    setFotoFile(null);
  };

  const handleClose = () => {
    form.reset();
    setFotoPreview(null);
    setFotoFile(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={(e) => {
              // Prevenir el envío automático del formulario
              e.preventDefault();
              console.log('[ResidenteStore] onSubmit del formulario capturado');
            }}
            className="space-y-6"
          >
            {/* Información Personal */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Información Personal</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nombre */}
                <FormField
                  control={form.control}
                  name="nombre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nombre" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Apellido */}
                <FormField
                  control={form.control}
                  name="apellido"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Apellido *</FormLabel>
                      <FormControl>
                        <Input placeholder="Apellido" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Teléfono */}
                <FormField
                  control={form.control}
                  name="telefono"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teléfono *</FormLabel>
                      <FormControl>
                        <Input placeholder="Teléfono" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Email */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email *</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* CI */}
                <FormField
                  control={form.control}
                  name="ci"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cédula de Identidad *</FormLabel>
                      <FormControl>
                        <Input placeholder="CI" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Unidad Habitacional */}
                <FormField
                  control={form.control}
                  name="unidad_habitacional"
                  render={({ field }) => {
                    // El valor siempre debe ser string y no puede ser vacío
                    const value = typeof field.value === 'string' && field.value !== "" ? field.value : 'none';
                    return (
                      <FormItem>
                        <FormLabel>Unidad Habitacional</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(value === "none" ? "" : value)}
                          value={value}
                          disabled={loadingUnidades}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={loadingUnidades ? "Cargando unidades..." : "Seleccionar unidad"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">-- Sin unidad asignada --</SelectItem>
                            {unidades
                              .filter((unidad) => 
                                typeof unidad.codigo === 'string' && 
                                unidad.codigo.trim() !== "" && 
                                unidad.codigo !== "" && 
                                unidad.codigo !== null
                              )
                              .map((unidad) => (
                                <SelectItem key={unidad.id} value={unidad.codigo || `unidad-${unidad.id}`}>
                                  {unidad.codigo} - {unidad.direccion} ({unidad.estado === "OCUPADA" ? "Ocupada" : unidad.estado === "DESOCUPADA" ? "Desocupada" : "En Mantenimiento"})
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                        {!loadingUnidades && unidades.length === 0 && (
                          <p className="text-xs text-muted-foreground mt-1">No hay unidades habitacionales disponibles.</p>
                        )}
                      </FormItem>
                    );
                  }}
                />
              </div>
            </div>

            {/* Foto de Perfil */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Foto de Perfil</h3>
              <div className="flex flex-col items-center gap-4">
                {/* Preview de la foto */}
                <div className="relative">
                  {fotoPreview ? (
                    <div className="relative">
                      <img
                        src={fotoPreview}
                        alt="Preview"
                        className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveFoto}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-gray-100 flex items-center justify-center border-4 border-gray-200">
                      <User className="h-16 w-16 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Input de foto */}
                <div className="flex flex-col items-center gap-2">
                  <Label 
                    htmlFor="foto_perfil" 
                    className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                  >
                    <Upload className="h-4 w-4" />
                    {fotoPreview ? 'Cambiar Foto' : 'Subir Foto'}
                  </Label>
                  <Input
                    id="foto_perfil"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={handleFotoChange}
                    className="hidden"
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    JPG o PNG, máximo 5MB
                  </p>
                </div>
              </div>
            </div>

            {/* Información de Residencia */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Información de Residencia</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tipo de Residente */}
                <FormField
                  control={form.control}
                  name="tipo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Residente *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="propietario">Propietario</SelectItem>
                          <SelectItem value="inquilino">Inquilino</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Fecha de Ingreso */}
                <FormField
                  control={form.control}
                  name="fecha_ingreso"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha de Ingreso *</FormLabel>
                      <FormControl>
                        <DatePicker
                          value={field.value ?? null}
                          onChange={field.onChange}
                          placeholder="Seleccionar fecha"
                          maxDate={new Date()}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

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
                        <SelectValue placeholder="Seleccionar estado" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="activo">Activo</SelectItem>
                      <SelectItem value="inactivo">Inactivo</SelectItem>
                      <SelectItem value="suspendido">Suspendido</SelectItem>
                      <SelectItem value="en_proceso">En Proceso</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Mostrar estado del formulario para depurar */}
            <div className="text-xs text-muted-foreground mb-2">
              Estado: {form.formState.isSubmitting ? 'Enviando...' : 'Listo para enviar'}
              {form.formState.isSubmitSuccessful && ' (Envío exitoso)'}
              {Object.keys(form.formState.errors).length > 0 && ' (Con errores)'}
            </div>
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button 
                type="button" 
                disabled={loading}
                onClick={async () => {
                  // Si estamos en modo edición, asegurarnos de tener una fecha válida
                  if (isEdit && !form.getValues().fecha_ingreso) {
                    form.setValue('fecha_ingreso', initialData?.fecha_ingreso ? new Date(initialData.fecha_ingreso) : new Date());
                  }
                  
                  // Validar el formulario antes de enviar
                  const isValid = await form.trigger();
                  
                  // Obtener valores del formulario
                  const values = form.getValues();
                  
                  // Si hay error de validación con usuario, pero el resto está bien, intentamos proceder
                  const userError = form.formState.errors.usuario;
                  const otherErrors = Object.keys(form.formState.errors).filter(k => k !== 'usuario').length > 0;
                  
                  if (isValid || (userError && !otherErrors)) {
                    // Procesar manualmente con datos limpios incluyendo foto
                    await handleSubmit({
                      nombre: values.nombre,
                      apellido: values.apellido,
                      telefono: values.telefono,
                      email: values.email,
                      ci: values.ci,
                      unidad_habitacional: values.unidad_habitacional,
                      tipo: values.tipo as 'propietario' | 'inquilino',
                      fecha_ingreso: values.fecha_ingreso,
                      estado: values.estado as 'activo' | 'inactivo' | 'suspendido' | 'en_proceso',
                      usuario: values.usuario,
                      foto_perfil: fotoFile
                    });
                  } else {
                    toast.error('Por favor corrige los errores en el formulario');
                  }
                }}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEdit ? 'Actualizar' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
