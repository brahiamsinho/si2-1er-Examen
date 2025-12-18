/**
 * Tipos para el Dashboard Administrativo
 */

export interface KPIs {
  residentes: {
    total: number;
    activos: number;
  };
  unidades: {
    total: number;
    ocupadas: number;
    tasa_ocupacion: number;
  };
  vehiculos: number;
  reservas_pendientes: number;
}

export interface Finanzas {
  monto_emitido: number;
  monto_cobrado: number;
  monto_pendiente: number;
  tasa_cobro: number;
  ingresos_mes: number;
  expensas: {
    total: number;
    pendientes: number;
    vencidas: number;
  };
}

export interface Morosidad {
  unidades_morosas: number;
  tasa_morosidad: number;
  top_deudores: {
    unidad__codigo: string;
    unidad__id: number;
    deuda_total: number;
  }[];
}

export interface Multas {
  total: number;
  pendientes: number;
  pagadas: number;
  monto_pendiente: number;
  monto_cobrado: number;
  por_tipo: {
    tipo: string;
    cantidad: number;
  }[];
}

export interface Reservas {
  total: number;
  pendientes: number;
  mes_actual: number;
  por_area: {
    area_comun__nombre: string;
    total: number;
  }[];
}

export interface IA {
  reconocimientos_faciales: number;
  reconocimientos_placas: number;
  mes_actual: {
    exitosos: number;
    fallidos: number;
  };
}

export interface IngresoMes {
  mes: string;
  ingresos: number;
}

export interface ExpensaEstado {
  estado: string;
  cantidad: number;
}

export interface MultaMes {
  mes: string;
  cantidad: number;
}

export interface Graficos {
  ingresos_por_mes: IngresoMes[];
  expensas_por_estado: ExpensaEstado[];
  multas_por_mes: MultaMes[];
  multas_por_tipo: {
    tipo: string;
    cantidad: number;
  }[];
  reservas_por_area: {
    area_comun__nombre: string;
    total: number;
  }[];
}

export interface DashboardStats {
  kpis: KPIs;
  finanzas: Finanzas;
  morosidad: Morosidad;
  multas: Multas;
  reservas: Reservas;
  ia: IA;
  graficos: Graficos;
}
