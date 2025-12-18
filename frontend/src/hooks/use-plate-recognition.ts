import { useState, useCallback } from 'react';
import { plateRecognitionApi } from '@/services/plate-recognition.api';
import type { PlateRecognitionResponse } from '@/types/plate-recognition';

interface UsePlateRecognitionReturn {
  isLoading: boolean;
  result: PlateRecognitionResponse | null;
  error: string | null;
  recognizePlate: (imageData: string | File) => Promise<void>;
  reset: () => void;
}

export const usePlateRecognition = (): UsePlateRecognitionReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PlateRecognitionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const recognizePlate = useCallback(async (imageData: string | File) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await plateRecognitionApi.recognizePlate(imageData);
      setResult(response);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al procesar la imagen';
      setError(errorMessage);
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setIsLoading(false);
    setResult(null);
    setError(null);
  }, []);

  return {
    isLoading,
    result,
    error,
    recognizePlate,
    reset,
  };
};
