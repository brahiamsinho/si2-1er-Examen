// Tipo principal de Notificación
export type Notificacion = {
  id: number;
  nombre: string;
  descripcion: string;
  tipo:
    | "general"
    | "mantenimiento"
    | "reunion"
    | "emergencia"
    | "evento"
    | "aviso"
    | "pagos";
  titulo?: string; // Añadido para compatibilidad
  tipo_display: string;
  estado:
    | "borrador"
    | "programada"
    | "enviada"
    | "cancelada"
    | "PENDIENTE"
    | "ENVIADA"
    | "LEIDA"
    | "CANCELADA"; // Ampliado para compatibilidad
  estado_display: {
    estado: string;
    color: string;
  };
  roles_destinatarios: number[];
  roles_destinatarios_info: {
    id: number;
    nombre: string;
    descripcion: string;
    total_usuarios: number;
  }[];
  es_individual: boolean;
  fecha_programada: string | null;
  fecha_expiracion: string | null;
  prioridad: "baja" | "normal" | "alta" | "urgente";
  prioridad_display: string;
  requiere_confirmacion: boolean;
  activa: boolean;
  creado_por: number | null;
  creado_por_info: {
    id: number;
    username: string;
    email: string;
    nombre_completo: string;
  } | null;
  fecha_creacion: string;
  fecha_actualizacion: string;
  total_destinatarios: number;
  destinatarios?: {
    id: number;
    nombre: string;
  };
};

// Tipo para el formulario de notificación
export type NotificacionFormData = {
  nombre: string;
  descripcion: string;
  tipo:
    | "general"
    | "mantenimiento"
    | "reunion"
    | "emergencia"
    | "evento"
    | "aviso"
    | "pagos";
  estado: "borrador" | "programada" | "enviada" | "cancelada";
  roles_destinatarios: number[];
  es_individual: boolean;
  usuarios_seleccionados?: number[];
  fecha_programada: Date | null;
  fecha_expiracion: Date | null;
  prioridad: "baja" | "normal" | "alta" | "urgente";
  requiere_confirmacion: boolean;
  activa: boolean;
};

// Modificamos NotificacionFilters para que incluya propiedades de paginación
export type NotificacionFilters = {
  search?: string;
  tipo?: string;
  estado?: string;
  prioridad?: string;
  es_individual?: boolean;
  activa?: boolean;
  rol_destinatario?: number;
  fecha_desde?: string;
  fecha_hasta?: string;
  page?: number; // Añadido para paginación
  page_size?: number; // Añadido para paginación
};

// Actualizamos PaginatedResponse para incluir total_pages y current_page
export type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
  total_pages?: number; // Añadido para compatibilidad
  current_page?: number; // Añadido para paginación
};

// Actualizamos NotificacionEstadisticas para incluir leidas y no_leidas
export type NotificacionEstadisticas = {
  total: number;
  leidas: number; // Añadido para compatibilidad con página
  no_leidas: number; // Añadido para compatibilidad con página
  por_estado: {
    borrador: number;
    programada: number;
    enviada: number;
    cancelada: number;
  };
  por_tipo: Record<string, number>;
  por_prioridad: {
    baja: number;
    normal: number;
    alta: number;
    urgente: number;
  };
  individuales: number;
  activas: number;
};
