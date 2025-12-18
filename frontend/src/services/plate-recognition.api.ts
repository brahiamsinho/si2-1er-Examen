import { api } from '@/lib/api';
import type { PlateRecognitionResponse } from '@/types/plate-recognition';

export const plateRecognitionApi = {
  recognizePlate: async (imageData: string | File): Promise<PlateRecognitionResponse> => {
    const formData = new FormData();

    if (imageData instanceof File) {
      formData.append('image', imageData);
    } else {
      const base64Data = imageData.includes('base64,')
        ? imageData.split('base64,')[1]
        : imageData;
      formData.append('image_base64', base64Data);
    }

    const response = await api.post<PlateRecognitionResponse>(
      '/api/seguridad/ia/leer-placa/',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000,
      }
    );

    return response.data;
  },
};
