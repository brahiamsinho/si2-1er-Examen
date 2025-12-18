import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import facialRecognitionAPI from "@/services/facial-recognition.api";
import type {
  FacialRecognitionResponse,
  FaceDatabaseStats,
} from "@/types/facial-recognition";

export const useFacialRecognition = () => {
  const { toast } = useToast();
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isRebuilding, setIsRebuilding] = useState(false);
  const [identificationResult, setIdentificationResult] =
    useState<FacialRecognitionResponse | null>(null);
  const [databaseStats, setDatabaseStats] = useState<FaceDatabaseStats | null>(
    null
  );

  /**
   * Identificar rostro desde una imagen
   */
  const identifyFace = useCallback(
    async (image: File) => {
      setIsIdentifying(true);
      setIdentificationResult(null);

      try {
        const result = await facialRecognitionAPI.identifyFace(image);
        setIdentificationResult(result);

        if (result.success && result.residente_id) {
          toast({
            title: "✅ Identificación exitosa",
            description: `Residente identificado: ${result.residente_id} (${
              Math.round((result.confidence || 0) * 100)
            }% confianza)`,
          });
        } else {
          toast({
            title: "⚠️ No identificado",
            description:
              result.message ||
              "No se pudo identificar el rostro (no registrado o baja confianza)",
            variant: "destructive",
          });
        }

        return result;
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.error || "Error al identificar rostro";

        toast({
          title: "❌ Error",
          description: errorMessage,
          variant: "destructive",
        });

        throw error;
      } finally {
        setIsIdentifying(false);
      }
    },
    [toast]
  );

  /**
   * Obtener estadísticas de la base de datos
   */
  const loadDatabaseStats = useCallback(async () => {
    setIsLoadingStats(true);

    try {
      const stats = await facialRecognitionAPI.getFaceDatabaseStats();
      setDatabaseStats(stats);
      return stats;
    } catch (error: any) {
      toast({
        title: "❌ Error",
        description: "Error al cargar estadísticas de la base de datos",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoadingStats(false);
    }
  }, [toast]);

  /**
   * Reconstruir base de datos facial
   */
  const rebuildDatabase = useCallback(async () => {
    setIsRebuilding(true);

    try {
      const result = await facialRecognitionAPI.rebuildFaceDatabase();

      if (result.success) {
        toast({
          title: "✅ Base de datos reconstruida",
          description: result.message,
        });

        // Actualizar estadísticas
        if (result.stats) {
          setDatabaseStats(result.stats);
        } else {
          await loadDatabaseStats();
        }
      } else {
        toast({
          title: "❌ Error",
          description: "No se pudo reconstruir la base de datos",
          variant: "destructive",
        });
      }

      return result;
    } catch (error: any) {
      toast({
        title: "❌ Error",
        description: "Error al reconstruir la base de datos",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsRebuilding(false);
    }
  }, [toast, loadDatabaseStats]);

  /**
   * Limpiar resultado de identificación
   */
  const clearIdentificationResult = useCallback(() => {
    setIdentificationResult(null);
  }, []);

  return {
    // Estado
    isIdentifying,
    isLoadingStats,
    isRebuilding,
    identificationResult,
    databaseStats,

    // Acciones
    identifyFace,
    loadDatabaseStats,
    rebuildDatabase,
    clearIdentificationResult,
  };
};

export default useFacialRecognition;
