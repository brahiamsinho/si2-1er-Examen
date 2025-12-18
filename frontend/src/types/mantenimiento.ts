/**
 * Types para el módulo de Mantenimiento
 */

export type TipoTarea = 'preventivo' | 'correctivo' | 'emergencia' | 'instalacion' | 'reparacion' | 'limpieza';
export type EstadoTarea = 'pendiente' | 'asignada' | 'en_progreso' | 'completada' | 'cancelada';
export type PrioridadTarea = 'baja' | 'media' | 'alta' | 'critica';
export type TipoAccionRegistro = 'creacion' | 'asignacion' | 'inicio' | 'progreso' | 'pausa' | 'completado' | 'cancelado' | 'observacion';

// Categorías de incidencias reportadas desde el móvil
export type CategoriaIncidencia = 
  | 'plomeria' 
  | 'electricidad' 
  | 'cerrajeria' 
  | 'pintura' 
  | 'jardineria' 
  | 'limpieza' 
  | 'seguridad' 
  | 'ascensor' 
  | 'piscina' 
  | 'gimnasio' 
  | 'estacionamiento' 
  | 'areas_comunes' 
  | 'otro';

export interface Personal {
  id: number;
  nombre: string;
  apellido: string;
  codigo_empleado: string;
  email: string;
  telefono: string;
  estado: boolean;
  nombre_completo?: string;
}

export interface AreaComun {
  id: number;
  nombre: string;
  tipo: string;
  capacidad_maxima?: number;
  estado: boolean;
}

export interface MaterialInsumo {
  id: number;
  tarea: number;
  nombre: string;
  cantidad: string;
  unidad: string;
  costo_unitario: string;
  costo_total?: string;
  proveedor?: string;
  fecha_uso: string;
}

export interface RegistroMantenimiento {
  id: number;
  tarea: number;
  tipo_accion: TipoAccionRegistro;
  descripcion: string;
  realizado_por: number;
  realizado_por_nombre?: string;
  fecha_registro: string;
}

export interface TareaMantenimiento {
  id: number;
  titulo: string;
  descripcion: string;
  tipo: TipoTarea;
  estado: EstadoTarea;
  prioridad: PrioridadTarea;
  
  // Relaciones
  area_comun?: number | null;
  area_comun_detalle?: AreaComun | null;
  personal_asignado?: number | null;
  personal_asignado_detalle?: Personal | null;
  creado_por: number;
  creado_por_nombre?: string;
  
  // Ubicación y presupuesto
  ubicacion_especifica?: string;
  presupuesto_estimado: string;
  costo_real?: string | null;
  
  // Fechas
  fecha_creacion: string;
  fecha_limite: string;
  fecha_asignacion?: string | null;
  fecha_inicio?: string | null;
  fecha_completado?: string | null;
  
  // Observaciones
  observaciones?: string;
  
  // Campos de incidencia (reportada desde móvil)
  es_incidencia?: boolean;
  categoria_incidencia?: CategoriaIncidencia | null;
  categoria_incidencia_display?: string;
  imagen_incidencia?: string | null;
  reportado_por_residente?: number | null;
  reportado_por_residente_nombre?: string;
  
  // Propiedades calculadas (del backend)
  esta_vencida?: boolean;
  dias_restantes?: number;
  desviacion_presupuesto?: number;
  porcentaje_completado?: number;
  
  // Relaciones anidadas (en detail view)
  materiales?: MaterialInsumo[];
  historial?: RegistroMantenimiento[];
}

export interface TareaMantenimientoListItem {
  id: number;
  titulo: string;
  tipo: TipoTarea;
  estado: EstadoTarea;
  prioridad: PrioridadTarea;
  personal_asignado?: number | null;
  personal_asignado_nombre?: string;
  area_comun_nombre?: string;
  presupuesto_estimado: string;
  fecha_limite: string;
  esta_vencida?: boolean;
  dias_restantes?: number;
}

export interface TareaMantenimientoCreate {
  titulo: string;
  descripcion: string;
  tipo: TipoTarea;
  prioridad: PrioridadTarea;
  area_comun?: number | null;
  personal_asignado?: number | null;
  ubicacion_especifica?: string;
  presupuesto_estimado: string;
  fecha_limite: string;
  observaciones?: string;
}

export interface TareaMantenimientoUpdate extends Partial<TareaMantenimientoCreate> {
  estado?: EstadoTarea;
  costo_real?: string;
}

export interface AsignarTareaPayload {
  personal_asignado: number;
  observaciones?: string;
}

export interface IniciarTareaPayload {
  observaciones?: string;
}

export interface CompletarTareaPayload {
  costo_real?: string;
  observaciones?: string;
}

export interface CancelarTareaPayload {
  motivo: string;
}

export interface EstadisticasMantenimiento {
  total_tareas: number;
  pendientes: number;
  asignadas: number;
  en_progreso: number;
  completadas: number;
  canceladas: number;
  vencidas: number;
  por_tipo: Record<TipoTarea, number>;
  por_prioridad: Record<PrioridadTarea, number>;
  presupuesto_total: string;
  costo_real_total: string;
  desviacion_promedio: number;
}

export interface MantenimientoFilters {
  search?: string;
  tipo?: TipoTarea | 'all';
  estado?: EstadoTarea | 'all';
  prioridad?: PrioridadTarea | 'all';
  personal_asignado?: number | 'all';
  area_comun?: number | 'all';
  fecha_limite_desde?: string;
  fecha_limite_hasta?: string;
  vencidas?: boolean;
  es_incidencia?: boolean | 'all';
  ordering?: string;
}
