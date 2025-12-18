// Tipos para reconocimiento de placas vehiculares

export interface Vehiculo {
  id: number;
  placa: string;
  marca: string;
  modelo: string;
  color: string;
  anio: number;
  tipo_vehiculo: 'auto' | 'moto' | 'camioneta' | 'otro';
  foto_vehiculo: string | null;
  estado: 'activo' | 'inactivo';
  residente?: {
    id: number;
    nombre: string;
    apellido: string;
    ci: string;
    unidad: {
      numero_unidad: string;
      bloque: string;
    };
  };
  fecha_registro: string;
}

export interface PlateRecognitionResponse {
  success: boolean;
  plate: string | null;
  confidence: number;
  message: string;
  vehiculo?: Vehiculo | null;
  error?: string;
}

export interface PlateRecognitionStats {
  total_scans: number;
  successful_scans: number;
  vehicles_found: number;
  vehicles_not_found: number;
  avg_confidence: number;
}
