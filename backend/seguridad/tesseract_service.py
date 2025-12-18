"""
Servicio de OCR local usando Tesseract.

Este servicio sirve como backup cuando Azure Computer Vision no está disponible.
Funciona 100% offline.
"""
import os
import logging
from typing import Optional, Tuple, List
import re

import cv2
import numpy as np
import pytesseract
from PIL import Image

logger = logging.getLogger(__name__)


class TesseractOCRService:
    """Servicio de OCR local usando Tesseract."""

    def __init__(self):
        """Inicializa el servicio Tesseract."""
        self.confidence_threshold = float(os.getenv('AI_OCR_CONFIDENCE_THRESHOLD', '0.7'))

        # Configurar path de tesseract si es necesario (Windows)
        tesseract_cmd = os.getenv('TESSERACT_CMD')
        if tesseract_cmd:
            pytesseract.pytesseract.tesseract_cmd = tesseract_cmd

    def preprocess_image(self, image_bytes: bytes) -> np.ndarray:
        """
        Preprocesa la imagen para mejorar OCR.

        Args:
            image_bytes: Bytes de la imagen original

        Returns:
            Imagen procesada como numpy array
        """
        try:
            # Convertir bytes a numpy array
            nparr = np.frombuffer(image_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

            # Convertir a escala de grises
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

            # Redimensionar si es muy pequeña
            height, width = gray.shape
            if height < 100 or width < 100:
                scale = max(100 / height, 100 / width)
                gray = cv2.resize(gray, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)

            # Aplicar desenfoque
            blurred = cv2.GaussianBlur(gray, (5, 5), 0)

            # Mejorar contraste (CLAHE)
            clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
            enhanced = clahe.apply(blurred)

            # Threshold binario
            _, thresh = cv2.threshold(enhanced, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

            # Eliminar ruido
            kernel = np.ones((1, 1), np.uint8)
            cleaned = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)

            return cleaned

        except Exception as e:
            logger.warning(f"Error preprocessing image: {str(e)}")
            # Si falla, retornar imagen original
            nparr = np.frombuffer(image_bytes, np.uint8)
            return cv2.imdecode(nparr, cv2.IMREAD_GRAYSCALE)

    def _is_valid_plate(self, text: str) -> bool:
        """
        Valida si el texto parece una placa vehicular.

        Args:
            text: Texto a validar

        Returns:
            True si parece una placa válida
        """
        text = text.strip().upper().replace(' ', '').replace('-', '')

        patterns = [
            r'^[A-Z]{3}\d{4}$',  # ABC1234
            r'^\d{4}[A-Z]{3}$',  # 1234ABC
            r'^[A-Z]{2}\d{3}[A-Z]$',  # AB123C (motos)
        ]

        return any(re.match(pattern, text) for pattern in patterns)

    def read_plate(
        self,
        image_path: Optional[str] = None,
        image_bytes: Optional[bytes] = None,
        preprocess: bool = True
    ) -> Tuple[Optional[str], float]:
        """
        Lee el texto de una placa vehicular.

        Args:
            image_path: Ruta a la imagen
            image_bytes: Bytes de la imagen
            preprocess: Si True, preprocesa la imagen

        Returns:
            Tupla (plate_text, confidence)
        """
        try:
            # Obtener bytes
            if image_path:
                with open(image_path, 'rb') as f:
                    image_data = f.read()
            elif image_bytes:
                image_data = image_bytes
            else:
                raise ValueError("Must provide either image_path or image_bytes")

            # Preprocesar
            if preprocess:
                img = self.preprocess_image(image_data)
            else:
                nparr = np.frombuffer(image_data, np.uint8)
                img = cv2.imdecode(nparr, cv2.IMREAD_GRAYSCALE)

            # Configuración de Tesseract para placas
            # --psm 7: Tratar la imagen como una sola línea de texto
            # --oem 3: Usar modo de motor LSTM
            custom_config = r'--oem 3 --psm 7 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

            # Ejecutar OCR con datos de confianza
            data = pytesseract.image_to_data(
                img,
                config=custom_config,
                output_type=pytesseract.Output.DICT,
                lang='eng'
            )

            # Extraer texto y confianza
            valid_texts = []
            for i, text in enumerate(data['text']):
                if not text.strip():
                    continue

                confidence = float(data['conf'][i]) / 100.0  # Convertir a 0-1

                if confidence < self.confidence_threshold:
                    continue

                # Limpiar texto
                clean_text = text.strip().upper().replace(' ', '')

                if self._is_valid_plate(clean_text):
                    valid_texts.append((clean_text, confidence))

            if not valid_texts:
                # Si no hay placas válidas, intentar extraer todo el texto
                all_text = ' '.join([t for t in data['text'] if t.strip()])
                all_text = all_text.upper().replace(' ', '').replace('-', '')

                if all_text:
                    # Calcular confianza promedio
                    confidences = [float(c) / 100.0 for c in data['conf'] if c != '-1']
                    avg_confidence = sum(confidences) / len(confidences) if confidences else 0.0

                    # Formatear si parece placa
                    if len(all_text) == 7 and all_text[:3].isalpha() and all_text[3:].isdigit():
                        plate_text = f"{all_text[:3]}-{all_text[3:]}"
                        return plate_text, avg_confidence

                    return all_text, avg_confidence

                return None, 0.0

            # Retornar la placa con mayor confianza
            best_plate, best_confidence = max(valid_texts, key=lambda x: x[1])

            # Formatear (agregar guion si es necesario)
            if len(best_plate) == 7 and best_plate[:3].isalpha() and best_plate[3:].isdigit():
                best_plate = f"{best_plate[:3]}-{best_plate[3:]}"

            logger.info(f"Plate detected: {best_plate} (confidence: {best_confidence:.2f})")

            return best_plate, best_confidence

        except Exception as e:
            logger.error(f"Error reading plate with Tesseract: {str(e)}")
            return None, 0.0

    def extract_text(
        self,
        image_path: Optional[str] = None,
        image_bytes: Optional[bytes] = None
    ) -> List[str]:
        """
        Extrae todo el texto de una imagen.

        Args:
            image_path: Ruta a la imagen
            image_bytes: Bytes de la imagen

        Returns:
            Lista de líneas de texto
        """
        try:
            # Obtener bytes
            if image_path:
                with open(image_path, 'rb') as f:
                    image_data = f.read()
            elif image_bytes:
                image_data = image_bytes
            else:
                raise ValueError("Must provide either image_path or image_bytes")

            # Preprocesar
            img = self.preprocess_image(image_data)

            # Ejecutar OCR
            text = pytesseract.image_to_string(img, lang='spa+eng')

            # Dividir en líneas y limpiar
            lines = [line.strip() for line in text.split('\n') if line.strip()]

            return lines

        except Exception as e:
            logger.error(f"Error extracting text with Tesseract: {str(e)}")
            return []
