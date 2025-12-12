// ============================================
// TIPOS PRINCIPALES
// ============================================

export interface Expensa {
  id: number;
  unidad: number;
  unidad_codigo: string;
  unidad_direccion: string;
  periodo: string; // Formato: "YYYY-MM"
  monto_base: string;
  monto_adicional: string;
  monto_total: string;
  monto_pagado: string;
  saldo_pendiente: string;
  estado: EstadoExpensa;
  estado_display: string;
  fecha_emision: string;
  fecha_vencimiento: string;
  esta_vencida: boolean;
  dias_vencidos: number;
  conceptos: ConceptoPago[];
  pagos: Pago[];
  fecha_creacion: string;
  fecha_actualizacion: string;
}

export interface ExpensaListItem {
  id: number;
  unidad: number;
  unidad_codigo: string;
  unidad_direccion: string;
  periodo: string;
  monto_total: string;
  monto_pagado: string;
  saldo_pendiente: string;
  estado: EstadoExpensa;
  estado_display: string;
  fecha_emision: string;
  fecha_vencimiento: string;
  esta_vencida: boolean;
}

export interface ConceptoPago {
  id: number;
  expensa?: number;
  descripcion: string;
  monto: string;
  tipo: string;
  fecha_creacion?: string;
}

export interface Pago {
  id: number;
  expensa: number;
  monto: string;
  metodo_pago: MetodoPago;
  metodo_pago_display: string;
  numero_comprobante?: string;
  fecha_pago: string;
  observaciones?: string;
  registrado_por: number;
  registrado_por_nombre: string;
  fecha_creacion: string;
}

// ============================================
// ENUMS
// ============================================

export type EstadoExpensa =
  | "pendiente"
  | "pagado"
  | "pagado_parcial"
  | "vencido";
export type MetodoPago = "efectivo" | "transferencia" | "qr" | "tarjeta";

// ============================================
// DTOs PARA FORMULARIOS
// ============================================

export interface ExpensaCreateData {
  unidad: number;
  periodo: string;
  monto_base: number;
  monto_adicional?: number;
  fecha_emision: Date;
  fecha_vencimiento: Date;
  conceptos?: ConceptoPagoInput[];
}

export interface ConceptoPagoInput {
  descripcion: string;
  monto: number;
  tipo: string;
}

export interface RegistrarPagoData {
  monto: number;
  metodo_pago: MetodoPago;
  numero_comprobante?: string;
  fecha_pago?: Date;
  observaciones?: string;
}

export interface GenerarMasivoData {
  periodo: string;
  monto_base: number;
  fecha_vencimiento: Date;
  conceptos?: ConceptoPagoInput[];
  unidades?: number[];
}

// ============================================
// ESTADÍSTICAS Y REPORTES
// ============================================

export interface EstadisticasExpensas {
  total_expensas: number;
  total_generado: string;
  total_pagado: string;
  total_pendiente: string;
  tasa_cobro: number;
  expensas_pendientes: number;
  expensas_pagadas: number;
  expensas_parciales: number;
  expensas_vencidas: number;
}

export interface UnidadMorosa {
  unidad_id: number;
  unidad_codigo: string;
  unidad_direccion: string;
  total_adeudado: string;
  meses_adeudados: number;
  expensas_vencidas: ExpensaVencida[];
}

export interface ExpensaVencida {
  id: number;
  periodo: string;
  monto_total: number;
  monto_pagado: number;
  saldo_pendiente: number;
  fecha_vencimiento: string;
  dias_vencidos: number;
}

export interface ComprobanteData {
  expensa: Expensa;
  unidad: {
    codigo: string;
    direccion: string;
    propietario: string;
  };
  conceptos: ConceptoPago[];
  pagos: Pago[];
  fecha_generacion: string;
}

// ============================================
// FILTROS
// ============================================

export interface ExpensaFilters {
  page: number;
  page_size: number;
  search?: string;
  estado?: EstadoExpensa | "";
  periodo?: string;
  unidad?: number | "";
  vencidas?: boolean;
}

// ============================================
// CONSTANTES
// ============================================

export const ESTADO_EXPENSA_LABELS: Record<EstadoExpensa, string> = {
  pendiente: "Pendiente",
  pagado: "Pagado",
  pagado_parcial: "Pago Parcial",
  vencido: "Vencido",
};

export const ESTADO_EXPENSA_COLORS: Record<EstadoExpensa, string> = {
  pendiente: "bg-yellow-100 text-yellow-800 border-yellow-300",
  pagado: "bg-green-100 text-green-800 border-green-300",
  pagado_parcial: "bg-blue-100 text-blue-800 border-blue-300",
  vencido: "bg-red-100 text-red-800 border-red-300",
};

export const METODO_PAGO_LABELS: Record<MetodoPago, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia Bancaria",
  qr: "Pago QR",
  tarjeta: "Tarjeta",
};

export const TIPO_CONCEPTO_OPTIONS = [
  { value: "mantenimiento", label: "Mantenimiento" },
  { value: "agua", label: "Agua" },
  { value: "luz", label: "Luz" },
  { value: "gas", label: "Gas" },
  { value: "limpieza", label: "Limpieza" },
  { value: "seguridad", label: "Seguridad" },
  { value: "multa", label: "Multa" },
  { value: "otro", label: "Otro" },
];
