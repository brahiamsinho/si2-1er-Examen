// Types para el módulo de Vehículos

export interface Vehiculo {
  id: number;
  placa: string;
  tipo: TipoVehiculo;
  tipo_display: string;
  marca: string;
  modelo: string;
  color: string;
  año: number | null;
  residente: number;
  residente_nombre: string;
  unidad: number | null;
  unidad_codigo: string;
  estado: EstadoVehiculo;
  estado_display: string;
  fecha_registro: string;
  fecha_autorizacion: string;
  fecha_vencimiento: string | null;
  observaciones: string;
  foto_vehiculo: string | null;
  esta_activo: boolean;
  fecha_actualizacion: string;
}

export type TipoVehiculo = "auto" | "moto" | "camioneta" | "suv" | "otro";
export type EstadoVehiculo = "activo" | "inactivo" | "suspendido";

export interface VehiculoFormData {
  placa: string;
  tipo: TipoVehiculo;
  marca: string;
  modelo: string;
  color: string;
  año: number | null;
  residente: number;
  unidad: number | null;
  estado: EstadoVehiculo;
  fecha_autorizacion: string;
  fecha_vencimiento: string | null;
  observaciones: string;
}

export interface VehiculoFilters {
  search?: string;
  tipo?: TipoVehiculo | "";
  estado?: EstadoVehiculo | "";
  residente?: number | "";
  unidad?: number | "";
  page?: number;
  page_size?: number;
}

export interface PaginatedVehiculosResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Vehiculo[];
}

export const TIPOS_VEHICULO: { value: TipoVehiculo; label: string }[] = [
  { value: "auto", label: "Automóvil" },
  { value: "moto", label: "Motocicleta" },
  { value: "camioneta", label: "Camioneta" },
  { value: "suv", label: "SUV" },
  { value: "otro", label: "Otro" },
];

export const ESTADOS_VEHICULO: { value: EstadoVehiculo; label: string }[] = [
  { value: "activo", label: "Activo" },
  { value: "inactivo", label: "Inactivo" },
  { value: "suspendido", label: "Suspendido" },
];
