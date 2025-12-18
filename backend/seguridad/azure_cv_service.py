"""
Servicio de OCR usando Azure Computer Vision para lectura de placas vehiculares.

Este servicio permite:
- Leer texto de placas vehiculares
- Preprocesar imágenes para mejorar precisión
- Filtrar resultados no relevantes
"""
import os
import logging
from typing import Optional, Tuple, List
from io import BytesIO
import re

from azure.cognitiveservices.vision.computervision import ComputerVisionClient
from azure.cognitiveservices.vision.computervision.models import OperationStatusCodes
from msrest.authentication import CognitiveServicesCredentials
import cv2
import numpy as np
from PIL import Image

logger = logging.getLogger(__name__)


class AzureComputerVisionService:
    """Servicio para OCR de placas usando Azure Computer Vision."""

    def __init__(self):
        """Inicializa el cliente de Azure Computer Vision."""
        self.subscription_key = os.getenv('AZURE_CV_SUBSCRIPTION_KEY')
        self.endpoint = os.getenv('AZURE_CV_ENDPOINT')
        self.confidence_threshold = float(os.getenv('AI_OCR_CONFIDENCE_THRESHOLD', '0.7'))

        if not self.subscription_key or not self.endpoint:
            raise ValueError(
                "Azure Computer Vision credentials not configured. "
                "Set AZURE_CV_SUBSCRIPTION_KEY and AZURE_CV_ENDPOINT env vars."
            )

        self.client = ComputerVisionClient(
            self.endpoint,
            CognitiveServicesCredentials(self.subscription_key)
        )

    def preprocess_image(self, image_bytes: bytes) -> bytes:
        """
        Preprocesa la imagen para mejorar la lectura de placas.

        Args:
            image_bytes: Bytes de la imagen original

        Returns:
            Bytes de la imagen procesada
        """
        try:
            # Convertir bytes a numpy array
            nparr = np.frombuffer(image_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

            # Convertir a escala de grises
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

            # Aplicar desenfoque para reducir ruido
            blurred = cv2.GaussianBlur(gray, (5, 5), 0)

            # Mejorar contraste (CLAHE)
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
            enhanced = clahe.apply(blurred)

            # Aplicar threshold adaptativo
            thresh = cv2.adaptiveThreshold(
                enhanced,
                255,
                cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                cv2.THRESH_BINARY,
                11,
                2
            )

            # Convertir de vuelta a bytes
            _, buffer = cv2.imencode('.jpg', thresh)
            return buffer.tobytes()

        except Exception as e:
            logger.warning(f"Error preprocessing image: {str(e)}, using original")
            return image_bytes

    def _is_valid_plate(self, text: str) -> bool:
        """
        Valida si el texto parece una placa vehicular boliviana.

        Formatos comunes:
        - ABC-1234 (La Paz, Cochabamba, etc.)
        - 1234-ABC (Algunas regiones)
        - ABC1234 (sin guion)

        Args:
            text: Texto a validar

        Returns:
            True si parece una placa válida
        """
        # Limpiar texto
        text = text.strip().upper().replace(' ', '')

        # Patrones de placas
        patterns = [
            r'^[A-Z]{3}-?\d{4}$',  # ABC-1234 o ABC1234
            r'^\d{4}-?[A-Z]{3}$',  # 1234-ABC o 1234ABC
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
            image_path: Ruta a la imagen (opcional si se proporciona image_bytes)
            image_bytes: Bytes de la imagen (opcional si se proporciona image_path)
            preprocess: Si True, preprocesa la imagen antes de OCR

        Returns:
            Tupla (plate_text, confidence) donde:
            - plate_text: Texto de la placa o None si no se encontró
            - confidence: Nivel de confianza (0.0 - 1.0)
        """
        try:
            # Obtener bytes de la imagen
            if image_path:
                with open(image_path, 'rb') as f:
                    image_data = f.read()
            elif image_bytes:
                image_data = image_bytes
            else:
                raise ValueError("Must provide either image_path or image_bytes")

            # Preprocesar si está habilitado
            if preprocess:
                image_data = self.preprocess_image(image_data)

            # Iniciar operación de lectura (Read API)
            stream = BytesIO(image_data)
            read_operation = self.client.read_in_stream(stream, raw=True)

            # Obtener operation location
            operation_location = read_operation.headers["Operation-Location"]
            operation_id = operation_location.split("/")[-1]

            # Esperar resultados
            import time
            max_attempts = 10
            for _ in range(max_attempts):
                result = self.client.get_read_result(operation_id)

                if result.status == OperationStatusCodes.succeeded:
                    break

                if result.status == OperationStatusCodes.failed:
                    logger.error("OCR operation failed")
                    return None, 0.0

                time.sleep(0.5)
            else:
                logger.error("OCR operation timeout")
                return None, 0.0

            # Procesar resultados
            if not result.analyze_result or not result.analyze_result.read_results:
                return None, 0.0

            # Extraer todo el texto detectado
            all_text = []
            max_confidence = 0.0

            for page in result.analyze_result.read_results:
                for line in page.lines:
                    text = line.text.strip()
                    confidence = getattr(line, 'confidence', 0.9)  # Algunas versiones no retornan confidence

                    # Validar si parece una placa
                    if self._is_valid_plate(text):
                        all_text.append(text)
                        max_confidence = max(max_confidence, confidence)

            # Si no se encontró placa válida, retornar el texto más largo
            if not all_text:
                for page in result.analyze_result.read_results:
                    for line in page.lines:
                        all_text.append(line.text.strip())

            if not all_text:
                return None, 0.0

            # Retornar el texto más largo (probablemente la placa)
            plate_text = max(all_text, key=len).upper()

            # Limpiar formato
            plate_text = plate_text.replace(' ', '').replace('-', '')

            # Normalizar formato boliviano (####ABC sin guion para búsqueda en BD)
            # Formato boliviano: 4 dígitos + 3 letras (ej: 1852PHD)
            if len(plate_text) == 7:
                if plate_text[:4].isdigit() and plate_text[4:].isalpha():
                    # Ya está en formato correcto: 1852PHD
                    pass
                elif plate_text[:3].isalpha() and plate_text[3:].isdigit():
                    # Formato inverso (raro): ABC1234 -> dejar sin guion
                    pass

            logger.info(f"Plate detected: {plate_text} (confidence: {max_confidence:.2f})")

            return plate_text, max_confidence

        except Exception as e:
            logger.error(f"Error reading plate: {str(e)}")
            return None, 0.0

    def extract_text(
        self,
        image_path: Optional[str] = None,
        image_bytes: Optional[bytes] = None
    ) -> List[str]:
        """
        Extrae todo el texto de una imagen (no solo placas).

        Args:
            image_path: Ruta a la imagen
            image_bytes: Bytes de la imagen

        Returns:
            Lista de líneas de texto detectadas
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

            # Leer
            stream = BytesIO(image_data)
            read_operation = self.client.read_in_stream(stream, raw=True)
            operation_id = read_operation.headers["Operation-Location"].split("/")[-1]

            # Esperar
            import time
            for _ in range(10):
                result = self.client.get_read_result(operation_id)
                if result.status == OperationStatusCodes.succeeded:
                    break
                time.sleep(0.5)
            else:
                return []

            # Extraer texto
            lines = []
            if result.analyze_result and result.analyze_result.read_results:
                for page in result.analyze_result.read_results:
                    for line in page.lines:
                        lines.append(line.text.strip())

            return lines

        except Exception as e:
            logger.error(f"Error extracting text: {str(e)}")
            return []
