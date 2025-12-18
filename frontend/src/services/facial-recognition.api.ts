import { api } from "@/lib/api";
import type {
  FacialRecognitionResponse,
  FaceDatabaseStats,
  RebuildDatabaseResponse,
  AIStatusResponse,
} from "@/types/facial-recognition";

const BASE_URL = "/api/seguridad/ia";

// Timeout extendido para operaciones de IA (primera carga puede tomar 30-60s)
const AI_TIMEOUT = 60000; // 60 segundos

/**
 * Identificar persona desde una imagen
 */
export const identifyFace = async (
  image: File
): Promise<FacialRecognitionResponse> => {
  const formData = new FormData();
  formData.append("image", image);

  const response = await api.post<FacialRecognitionResponse>(
    `${BASE_URL}/identificar-rostro/`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      timeout: AI_TIMEOUT, // Timeout extendido para carga inicial del modelo
    }
  );

  return response.data;
};

/**
 * Obtener estadísticas de la base de datos facial
 */
export const getFaceDatabaseStats =
  async (): Promise<FaceDatabaseStats> => {
    const response = await api.get<FaceDatabaseStats>(
      `${BASE_URL}/face-database-stats/`,
      {
        timeout: AI_TIMEOUT, // Timeout extendido para carga inicial del modelo
      }
    );

    return response.data;
  };

/**
 * Reconstruir base de datos facial (caché)
 */
export const rebuildFaceDatabase =
  async (): Promise<RebuildDatabaseResponse> => {
    const response = await api.post<RebuildDatabaseResponse>(
      `${BASE_URL}/rebuild-face-database/`,
      {},
      {
        timeout: AI_TIMEOUT, // Timeout extendido para reconstrucción de caché
      }
    );

    return response.data;
  };

/**
 * Obtener estado de servicios de IA
 */
export const getAIStatus = async (): Promise<AIStatusResponse> => {
  const response = await api.get<AIStatusResponse>(`${BASE_URL}/status/`);

  return response.data;
};

export const facialRecognitionAPI = {
  identifyFace,
  getFaceDatabaseStats,
  rebuildFaceDatabase,
  getAIStatus,
};

export default facialRecognitionAPI;
