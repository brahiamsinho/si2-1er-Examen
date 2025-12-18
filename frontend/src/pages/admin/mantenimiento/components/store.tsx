/**
 * Modal para crear/editar tareas
 */
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { TareaMantenimiento, TareaMantenimientoCreate } from '@/types/mantenimiento';

interface StoreModalProps {
  open: boolean;
  tarea?: TareaMantenimiento | null;
  onClose: () => void;
  onSubmit: (data: TareaMantenimientoCreate) => void;
  loading?: boolean;
}

export function StoreModal({ open, tarea, onClose, onSubmit, loading }: StoreModalProps) {
  const { register, handleSubmit, reset, setValue, watch } = useForm<TareaMantenimientoCreate>();
  const [tipo, setTipo] = useState('preventivo');
  const [prioridad, setPrioridad] = useState('media');

  useEffect(() => {
    if (tarea) {
      reset({
        titulo: tarea.titulo,
        descripcion: tarea.descripcion,
        tipo: tarea.tipo,
        prioridad: tarea.prioridad,
        ubicacion_especifica: tarea.ubicacion_especifica || '',
        presupuesto_estimado: tarea.presupuesto_estimado,
        fecha_limite: tarea.fecha_limite,
        observaciones: tarea.observaciones || '',
      });
      setTipo(tarea.tipo);
      setPrioridad(tarea.prioridad);
    } else {
      reset({
        titulo: '',
        descripcion: '',
        tipo: 'preventivo',
        prioridad: 'media',
        ubicacion_especifica: '',
        presupuesto_estimado: '0.00',
        fecha_limite: '',
        observaciones: '',
      });
      setTipo('preventivo');
      setPrioridad('media');
    }
  }, [tarea, reset]);

  const onSubmitForm = (data: TareaMantenimientoCreate) => {
    onSubmit({ ...data, tipo: tipo as any, prioridad: prioridad as any });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{tarea ? 'Editar Tarea' : 'Nueva Tarea'}</DialogTitle>
          <DialogDescription>
            {tarea ? 'Modifica los datos de la tarea' : 'Completa el formulario para crear una nueva tarea'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
          <div>
            <Label htmlFor="titulo">Título*</Label>
            <Input id="titulo" {...register('titulo', { required: true })} />
          </div>

          <div>
            <Label htmlFor="descripcion">Descripción*</Label>
            <Textarea id="descripcion" {...register('descripcion', { required: true })} rows={3} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tipo">Tipo*</Label>
              <Select value={tipo} onValueChange={(val) => { setTipo(val); setValue('tipo', val as any); }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="preventivo">Preventivo</SelectItem>
                  <SelectItem value="correctivo">Correctivo</SelectItem>
                  <SelectItem value="emergencia">Emergencia</SelectItem>
                  <SelectItem value="instalacion">Instalación</SelectItem>
                  <SelectItem value="reparacion">Reparación</SelectItem>
                  <SelectItem value="limpieza">Limpieza</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="prioridad">Prioridad*</Label>
              <Select value={prioridad} onValueChange={(val) => { setPrioridad(val); setValue('prioridad', val as any); }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baja">Baja</SelectItem>
                  <SelectItem value="media">Media</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="critica">Crítica</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="presupuesto_estimado">Presupuesto Estimado*</Label>
              <Input
                id="presupuesto_estimado"
                type="number"
                step="0.01"
                {...register('presupuesto_estimado', { required: true })}
              />
            </div>

            <div>
              <Label htmlFor="fecha_limite">Fecha Límite*</Label>
              <Input
                id="fecha_limite"
                type="date"
                {...register('fecha_limite', { required: true })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="ubicacion_especifica">Ubicación</Label>
            <Input id="ubicacion_especifica" {...register('ubicacion_especifica')} />
          </div>

          <div>
            <Label htmlFor="observaciones">Observaciones</Label>
            <Textarea id="observaciones" {...register('observaciones')} rows={2} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : tarea ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
