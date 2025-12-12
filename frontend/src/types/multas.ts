// Tipos para el módulo de Multas

export type TipoMulta =
  | "ruido"
  | "estacionamiento"
  | "area_comun"
  | "pago_atrasado"
  | "dano_propiedad"
  | "incumplimiento"
  | "otro";

export type EstadoMulta = "pendiente" | "pagado" | "cancelado" | "en_disputa";

export type Multa = {
  id: number;
  tipo: TipoMulta;
  tipo_display: string;
  descripcion: string;
  monto: string; // Decimal como string
  recargo_mora: string; // Decimal como string
  monto_total: string; // Decimal como string

  // Relaciones
  residente: number;
  residente_nombre: string;
  residente_detalle?: {
    id: number;
    nombre: string;
    apellido: string;
    ci: string;
    email: string;
    telefono: string;
    unidad_habitacional: string;
  };

  unidad: number | null;
  unidad_nombre: string;
  unidad_detalle?: {
    id: number;
    codigo: string;
    direccion: string;
  };

  // Estado y fechas
  estado: EstadoMulta;
  estado_display: string;
  fecha_emision: string; // YYYY-MM-DD
  fecha_vencimiento: string; // YYYY-MM-DD
  fecha_pago: string | null; // YYYY-MM-DD
  esta_vencida: boolean;
  dias_vencimiento: number;

  // Observaciones
  observaciones: string;
  creado_por: string;

  // Auditoría
  fecha_creacion: string; // ISO datetime
  fecha_actualizacion: string; // ISO datetime
};

export type MultaListItem = {
  id: number;
  tipo: TipoMulta;
  tipo_display: string;
  descripcion: string;
  monto: string;
  monto_total: string;
  residente: number;
  residente_nombre: string;
  unidad: number | null;
  unidad_nombre: string;
  estado: EstadoMulta;
  estado_display: string;
  fecha_emision: string;
  fecha_vencimiento: string;
  esta_vencida: boolean;
};

export type MultaCreateData = {
  tipo: TipoMulta;
  descripcion: string;
  monto: string | number; // Permitir ambos para facilitar formularios
  residente: number;
  unidad?: number | null;
  fecha_vencimiento: string | Date; // Permitir Date para date picker
  observaciones?: string;
  creado_por?: string;
};

export type MultaUpdateData = Partial<MultaCreateData>;

export type MarcarPagadoData = {
  observaciones?: string;
};

export type CancelarMultaData = {
  motivo: string;
};

export type EstadisticasMultas = {
  total_multas: number;
  total_monto: string;
  total_pendiente: string;
  total_pagado: string;
  total_cancelado: string;
  multas_vencidas: number;
  monto_vencido: string;
  por_tipo: Array<{
    tipo: TipoMulta;
    tipo_display: string;
    cantidad: number;
    monto_total: string;
  }>;
  por_estado: Array<{
    estado: EstadoMulta;
    estado_display: string;
    cantidad: number;
    monto_total: string;
  }>;
  por_mes: Array<{
    mes: string; // "YYYY-MM"
    cantidad: number;
    monto_total: string;
  }>;
};

export type MultaFilters = {
  search?: string;
  residente?: number | string;
  unidad?: number | string;
  tipo?: TipoMulta | "all";
  estado?: EstadoMulta | "all";
  año?: number | string;
  mes?: number | string;
  vencidas?: boolean;
};

export type MultasResidenteResumen = {
  residente: {
    id: number;
    nombre_completo: string;
    ci: string;
    unidad_habitacional: string;
  };
  multas: MultaListItem[];
  total_multas: number;
  total_pendiente: string;
  total_pagado: string;
  multas_vencidas: number;
};

// Constantes para los labels de tipo
export const TIPO_MULTA_LABELS: Record<TipoMulta, string> = {
  ruido: "Ruido excesivo",
  estacionamiento: "Estacionamiento indebido",
  area_comun: "Mal uso de área común",
  pago_atrasado: "Pago de expensa atrasado",
  dano_propiedad: "Daño a propiedad común",
  incumplimiento: "Incumplimiento de reglamento",
  otro: "Otro",
};

// Constantes para los labels de estado
export const ESTADO_MULTA_LABELS: Record<EstadoMulta, string> = {
  pendiente: "Pendiente",
  pagado: "Pagado",
  cancelado: "Cancelado",
  en_disputa: "En disputa",
};

// Colores para badges de tipo
export const TIPO_MULTA_COLORS: Record<TipoMulta, string> = {
  ruido: "bg-orange-100 text-orange-800",
  estacionamiento: "bg-blue-100 text-blue-800",
  area_comun: "bg-purple-100 text-purple-800",
  pago_atrasado: "bg-red-100 text-red-800",
  dano_propiedad: "bg-pink-100 text-pink-800",
  incumplimiento: "bg-yellow-100 text-yellow-800",
  otro: "bg-gray-100 text-gray-800",
};

// Colores para badges de estado
export const ESTADO_MULTA_COLORS: Record<EstadoMulta, string> = {
  pendiente: "bg-yellow-100 text-yellow-800",
  pagado: "bg-green-100 text-green-800",
  cancelado: "bg-gray-100 text-gray-800",
  en_disputa: "bg-orange-100 text-orange-800",
};
