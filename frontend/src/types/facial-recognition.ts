// Tipos para reconocimiento facial con DeepFace

export interface FacialRecognitionRequest {
  image: File;
}

export interface Residente {
  id: number;
  usuario: number | null;
  username: string | null;
  nombre: string;
  apellido: string;
  ci: string;
  email: string;
  telefono: string;
  unidad_habitacional: number | null;
  tipo: 'propietario' | 'inquilino';
  fecha_ingreso: string | null;
  estado: 'activo' | 'inactivo' | 'suspendido' | 'en_proceso';
  foto_perfil: string | null;
  nombre_completo: string;
  puede_acceder: boolean;
  estado_usuario: string | null;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

export interface FacialRecognitionResponse {
  success: boolean;
  residente_id?: number;
  confidence?: number;
  service?: string;
  model?: string;
  message?: string;
  residente?: Residente | null;  // Objeto completo del residente identificado
}

export interface FaceDatabaseStats {
  success: boolean;
  total_residents: number;
  total_images: number;
  cache_exists: boolean;
  database_path?: string;
  model?: string;
  detector?: string;
}

export interface RebuildDatabaseResponse {
  success: boolean;
  message: string;
  stats?: FaceDatabaseStats;
}

export interface AIStatusResponse {
  providers: {
    face: string;
    ocr: string;
  };
  face_database: FaceDatabaseStats;
  message: string;
}
