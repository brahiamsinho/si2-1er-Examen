/**
 * Tabla de Tareas de Mantenimiento
 */
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Edit, MoreVertical, Trash2, UserPlus, Play, CheckCircle, XCircle, Smartphone, Image } from 'lucide-react';
import type { TareaMantenimiento } from '@/types/mantenimiento';
import { useState } from 'react';

interface TareasTableProps {
  tareas: TareaMantenimiento[];
  onEdit: (tarea: TareaMantenimiento) => void;
  onDelete: (tarea: TareaMantenimiento) => void;
  onAsignar: (tarea: TareaMantenimiento) => void;
  onIniciar: (tarea: TareaMantenimiento) => void;
  onCompletar: (tarea: TareaMantenimiento) => void;
  onCancelar: (tarea: TareaMantenimiento) => void;
}

const ESTADO_COLORS: Record<string, string> = {
  pendiente: 'bg-yellow-500',
  asignada: 'bg-blue-500',
  en_progreso: 'bg-purple-500',
  completada: 'bg-green-500',
  cancelada: 'bg-gray-500',
};

const PRIORIDAD_COLORS: Record<string, string> = {
  baja: 'bg-gray-400',
  media: 'bg-blue-400',
  alta: 'bg-orange-500',
  critica: 'bg-red-600',
};

const CATEGORIA_LABELS: Record<string, string> = {
  plomeria: 'Plomería',
  electricidad: 'Electricidad',
  cerrajeria: 'Cerrajería',
  pintura: 'Pintura',
  jardineria: 'Jardinería',
  limpieza: 'Limpieza',
  seguridad: 'Seguridad',
  ascensor: 'Ascensor',
  piscina: 'Piscina',
  gimnasio: 'Gimnasio',
  estacionamiento: 'Estacionamiento',
  areas_comunes: 'Áreas Comunes',
  otro: 'Otro',
};

export function TareasTable({
  tareas,
  onEdit,
  onDelete,
  onAsignar,
  onIniciar,
  onCompletar,
  onCancelar,
}: TareasTableProps) {
  const [imagenSeleccionada, setImagenSeleccionada] = useState<string | null>(null);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-ES');
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: 'BOB',
    }).format(parseFloat(amount));
  };

  return (
    <>
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Título</TableHead>
            <TableHead>Origen</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Prioridad</TableHead>
            <TableHead>Personal</TableHead>
            <TableHead>Fecha Límite</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tareas.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-muted-foreground">
                No se encontraron tareas
              </TableCell>
            </TableRow>
          ) : (
            tareas.map((tarea) => (
              <TableRow key={tarea.id} className={tarea.es_incidencia ? 'bg-orange-50 dark:bg-orange-950/20' : ''}>
                <TableCell className="font-medium">
                  <div className="flex flex-col gap-1">
                    <span>{tarea.titulo}</span>
                    {tarea.esta_vencida && (
                      <Badge variant="destructive" className="w-fit">Vencida</Badge>
                    )}
                    {tarea.es_incidencia && tarea.categoria_incidencia && (
                      <span className="text-xs text-muted-foreground">
                        📁 {CATEGORIA_LABELS[tarea.categoria_incidencia] || tarea.categoria_incidencia}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {tarea.es_incidencia ? (
                    <div className="flex flex-col gap-1">
                      <Badge className="bg-orange-500 hover:bg-orange-600 w-fit">
                        <Smartphone className="h-3 w-3 mr-1" />
                        Incidencia Móvil
                      </Badge>
                      {tarea.imagen_incidencia && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={() => setImagenSeleccionada(tarea.imagen_incidencia!)}
                        >
                          <Image className="h-3 w-3 mr-1" />
                          Ver Foto
                        </Button>
                      )}
                    </div>
                  ) : (
                    <Badge variant="outline" className="w-fit">
                      Interno
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="capitalize">{tarea.tipo.replace('_', ' ')}</TableCell>
                <TableCell>
                  <Badge className={ESTADO_COLORS[tarea.estado]}>
                    {tarea.estado.replace('_', ' ')}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={PRIORIDAD_COLORS[tarea.prioridad]}>
                    {tarea.prioridad}
                  </Badge>
                </TableCell>
                <TableCell>
                  {tarea.personal_asignado_detalle?.nombre_completo || 'Sin asignar'}
                </TableCell>
                <TableCell>
                  {formatDate(tarea.fecha_limite)}
                  {tarea.dias_restantes !== undefined && tarea.dias_restantes >= 0 && (
                    <span className="text-xs text-muted-foreground ml-1">
                      ({tarea.dias_restantes}d)
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(tarea)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      
                      {tarea.estado === 'pendiente' && (
                        <DropdownMenuItem onClick={() => onAsignar(tarea)}>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Asignar Personal
                        </DropdownMenuItem>
                      )}
                      
                      {tarea.estado === 'asignada' && (
                        <DropdownMenuItem onClick={() => onIniciar(tarea)}>
                          <Play className="h-4 w-4 mr-2" />
                          Iniciar Trabajo
                        </DropdownMenuItem>
                      )}
                      
                      {tarea.estado === 'en_progreso' && (
                        <DropdownMenuItem onClick={() => onCompletar(tarea)}>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Completar
                        </DropdownMenuItem>
                      )}
                      
                      {!['completada', 'cancelada'].includes(tarea.estado) && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => onCancelar(tarea)}>
                            <XCircle className="h-4 w-4 mr-2" />
                            Cancelar Tarea
                          </DropdownMenuItem>
                        </>
                      )}
                      
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onDelete(tarea)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>

    {/* Dialog para ver imagen de incidencia */}
    <Dialog open={!!imagenSeleccionada} onOpenChange={() => setImagenSeleccionada(null)}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            Foto de Incidencia
          </DialogTitle>
        </DialogHeader>
        {imagenSeleccionada && (
          <div className="flex justify-center">
            <img
              src={imagenSeleccionada}
              alt="Imagen de incidencia"
              className="max-h-[500px] rounded-lg object-contain"
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
    </>
  );
}
