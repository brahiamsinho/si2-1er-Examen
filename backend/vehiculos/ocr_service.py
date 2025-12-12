"""
Servicio de reconocimiento de placas vehiculares usando Azure Computer Vision.
"""
import os
import re
import logging
from typing import Optional, Dict, List
from io import BytesIO

logger = logging.getLogger(__name__)


class AzureVisionOCRService:
    """
    Servicio para reconocimiento óptico de caracteres (OCR) de placas vehiculares
    usando Azure Computer Vision API.
    """
    
    def __init__(self):
        self.endpoint = os.getenv('AZURE_VISION_ENDPOINT', '')
        self.subscription_key = os.getenv('AZURE_VISION_SUBSCRIPTION_KEY', '')
        self.enabled = bool(self.endpoint and self.subscription_key)
        
        if not self.enabled:
            logger.warning(
                "Azure Vision no configurado. "
                "Establece AZURE_VISION_ENDPOINT y AZURE_VISION_SUBSCRIPTION_KEY"
            )
    
    def reconocer_placa(self, imagen_bytes: bytes) -> Optional[str]:
        """
        Reconoce la placa de un vehículo desde una imagen.
        
        Args:
            imagen_bytes: Bytes de la imagen
            
        Returns:
            str: Placa detectada en formato normalizado (ej: ABC-1234)
            None: Si no se detectó placa
        """
        if not self.enabled:
            logger.warning("Azure Vision no está configurado")
            return None
        
        try:
            # Importar SDK de Azure (solo si está configurado)
            from azure.ai.vision.imageanalysis import ImageAnalysisClient
            from azure.ai.vision.imageanalysis.models import VisualFeatures
            from azure.core.credentials import AzureKeyCredential
            
            # Crear cliente
            client = ImageAnalysisClient(
                endpoint=self.endpoint,
                credential=AzureKeyCredential(self.subscription_key)
            )
            
            # Analizar imagen para extraer texto
            result = client.analyze(
                image_data=imagen_bytes,
                visual_features=[VisualFeatures.READ]
            )
            
            if not result.read or not result.read.blocks:
                logger.info("No se detectó texto en la imagen")
                return None
            
            # Extraer todo el texto detectado
            textos_detectados = []
            for block in result.read.blocks:
                for line in block.lines:
                    textos_detectados.append(line.text)
            
            logger.info(f"Textos detectados: {textos_detectados}")
            
            # Buscar patrón de placa en los textos
            placa = self._extraer_placa_de_textos(textos_detectados)
            
            if placa:
                logger.info(f"Placa reconocida: {placa}")
            else:
                logger.warning("No se encontró patrón de placa en los textos")
            
            return placa
            
        except ImportError:
            logger.error(
                "SDK de Azure no instalado. "
                "Instala: pip install azure-ai-vision-imageanalysis"
            )
            return None
        except Exception as e:
            logger.error(f"Error al reconocer placa con Azure Vision: {e}")
            return None
    
    def _extraer_placa_de_textos(self, textos: List[str]) -> Optional[str]:
        """
        Extrae y valida el patrón de placa vehicular de una lista de textos.
        
        Patrones soportados (Bolivia):
        - ABC-1234
        - ABC1234
        - ABC 1234
        
        Args:
            textos: Lista de strings detectados en la imagen
            
        Returns:
            str: Placa normalizada (ABC-1234) o None
        """
        # Patrón: 3 letras + opcional(guión/espacio) + 4 dígitos
        patron_placa = re.compile(
            r'\b([A-Z]{3})[\s\-]?(\d{4})\b',
            re.IGNORECASE
        )
        
        for texto in textos:
            # Limpiar texto: eliminar caracteres especiales, espacios extras
            texto_limpio = texto.upper().strip()
            
            # Buscar patrón
            match = patron_placa.search(texto_limpio)
            if match:
                letras, numeros = match.groups()
                placa_normalizada = f"{letras}-{numeros}"
                
                # Validar que las letras sean alfabéticas y números sean dígitos
                if letras.isalpha() and numeros.isdigit():
                    return placa_normalizada
        
        # Si no se encontró con el patrón estricto, intentar con patrón más flexible
        for texto in textos:
            # Eliminar espacios y caracteres no alfanuméricos
            texto_compacto = re.sub(r'[^A-Z0-9]', '', texto.upper())
            
            # Verificar si tiene formato ABC1234
            if len(texto_compacto) == 7:
                letras = texto_compacto[:3]
                numeros = texto_compacto[3:]
                
                if letras.isalpha() and numeros.isdigit():
                    return f"{letras}-{numeros}"
        
        return None


class MockOCRService:
    """
    Servicio mock para desarrollo sin Azure.
    Simula reconocimiento de placas para testing.
    """
    
    def __init__(self):
        self.enabled = True
        logger.info("Usando servicio MOCK de OCR (desarrollo)")
    
    def reconocer_placa(self, imagen_bytes: bytes) -> Optional[str]:
        """
        Simula reconocimiento de placa.
        Para testing, retorna una placa de prueba.
        """
        # En desarrollo, retornar placa de prueba
        placas_prueba = [
            'ABC-1234',
            'XYZ-5678',
            'DEF-9012',
        ]
        
        import random
        placa = random.choice(placas_prueba)
        logger.info(f"[MOCK] Placa simulada: {placa}")
        return placa


def get_ocr_service():
    """
    Factory para obtener el servicio de OCR apropiado.
    
    Returns:
        AzureVisionOCRService si está configurado
        MockOCRService para desarrollo
    """
    azure_service = AzureVisionOCRService()
    
    if azure_service.enabled:
        return azure_service
    else:
        logger.warning(
            "Azure Vision no configurado. Usando servicio MOCK. "
            "Para producción, configura las variables de entorno."
        )
        return MockOCRService()
