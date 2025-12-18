"""
Orquestador de servicios de IA.

Este módulo proporciona una interfaz unificada para los servicios de IA:
- DeepFace: Reconocimiento facial local (sin API keys)
- Azure Computer Vision: OCR para placas vehiculares
- Tesseract OCR: OCR local como fallback de Azure CV
"""
import os
import logging
from typing import Optional, Tuple, List, Dict

logger = logging.getLogger(__name__)


class AIOrchestrator:
    """Orquestador para servicios de IA."""

    def __init__(self):
        """Inicializa el orquestrador."""
        # Servicios lazy-loaded
        self._deepface = None
        self._azure_cv = None
        self._tesseract = None

    def _get_deepface(self):
        """Lazy loading de DeepFace Service."""
        if self._deepface is None:
            try:
                from .deepface_service import DeepFaceService
                self._deepface = DeepFaceService()
                logger.info("DeepFace Service initialized")
            except Exception as e:
                logger.error(f"Failed to initialize DeepFace: {str(e)}")
                raise

        return self._deepface

    def _get_azure_cv(self):
        """Lazy loading de Azure Computer Vision Service."""
        if self._azure_cv is None:
            try:
                from .azure_cv_service import AzureComputerVisionService
                self._azure_cv = AzureComputerVisionService()
                logger.info("Azure Computer Vision Service initialized")
            except Exception as e:
                logger.error(f"Failed to initialize Azure CV: {str(e)}")
                raise

        return self._azure_cv

    def _get_tesseract(self):
        """Lazy loading de Tesseract OCR Service."""
        if self._tesseract is None:
            try:
                from .tesseract_ocr_service import TesseractOCRService
                self._tesseract = TesseractOCRService()
                logger.info("Tesseract OCR Service initialized")
            except Exception as e:
                logger.error(f"Failed to initialize Tesseract: {str(e)}")
                raise

        return self._tesseract

    # ==================== RECONOCIMIENTO FACIAL ====================

    def identify_face(
        self,
        image_path: Optional[str] = None,
        image_bytes: Optional[bytes] = None
    ) -> Optional[Dict]:
        """
        Identifica una persona desde una imagen usando DeepFace.

        Args:
            image_path: Ruta a la imagen (opcional si se proporciona image_bytes)
            image_bytes: Bytes de la imagen (opcional si se proporciona image_path)

        Returns:
            Dict con residente_id, confidence, service, model o None
        """
        import tempfile
        temp_file = None
        
        try:
            # Si se proporcionan bytes, crear archivo temporal
            if image_bytes:
                with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as f:
                    f.write(image_bytes)
                    temp_file = f.name
                    image_path = temp_file
            
            if not image_path:
                logger.error("No image_path or image_bytes provided")
                return None
            
            service = self._get_deepface()
            return service.identify_person_from_image(image_path)
        except Exception as e:
            logger.error(f"Error identifying face: {str(e)}")
            return None
        finally:
            # Limpiar archivo temporal
            if temp_file and os.path.exists(temp_file):
                try:
                    os.unlink(temp_file)
                except Exception as e:
                    logger.warning(f"Failed to delete temp file {temp_file}: {str(e)}")

    def verify_faces(
        self,
        img1_path: str,
        img2_path: str
    ) -> Tuple[bool, float]:
        """
        Verifica si dos imágenes corresponden a la misma persona.

        Args:
            img1_path: Ruta a la primera imagen
            img2_path: Ruta a la segunda imagen

        Returns:
            Tupla (is_same_person, confidence)
        """
        try:
            service = self._get_deepface()
            return service.verify_faces(img1_path, img2_path)
        except Exception as e:
            logger.error(f"Error verifying faces: {str(e)}")
            return False, 0.0

    def analyze_face(self, image_path: str) -> Optional[Dict]:
        """
        Analiza atributos faciales (edad, género, emoción).

        Args:
            image_path: Ruta a la imagen

        Returns:
            Dict con atributos detectados o None
        """
        try:
            service = self._get_deepface()
            return service.analyze_face(image_path)
        except Exception as e:
            logger.error(f"Error analyzing face: {str(e)}")
            return None

    def rebuild_face_database(self) -> bool:
        """
        Reconstruye la base de datos de rostros.
        
        Útil cuando se agregan/eliminan fotos de residentes.

        Returns:
            True si se reconstruyó exitosamente
        """
        try:
            service = self._get_deepface()
            return service.rebuild_database()
        except Exception as e:
            logger.error(f"Error rebuilding database: {str(e)}")
            return False

    def get_face_database_stats(self) -> Dict:
        """
        Obtiene estadísticas de la base de datos de rostros.

        Returns:
            Dict con estadísticas
        """
        try:
            service = self._get_deepface()
            return service.get_database_stats()
        except Exception as e:
            logger.error(f"Error getting database stats: {str(e)}")
            return {'error': str(e)}

    # ==================== OCR (PLACAS) ====================

    def read_plate(
        self,
        image_path: Optional[str] = None,
        image_bytes: Optional[bytes] = None
    ) -> Tuple[Optional[str], float]:
        """
        Lee una placa vehicular desde una imagen.
        Usa Azure Computer Vision como servicio primario y Tesseract OCR como fallback.

        Args:
            image_path: Ruta a la imagen
            image_bytes: Bytes de la imagen

        Returns:
            Tupla (plate_text, confidence)
        """
        # Intentar con Azure Computer Vision primero
        try:
            service = self._get_azure_cv()
            plate_text, confidence = service.read_plate(image_path, image_bytes)
            
            if plate_text:
                logger.info(f"✅ Azure CV detectó placa: {plate_text} (confianza: {confidence:.2f})")
                return plate_text, confidence
            else:
                logger.warning("Azure CV no detectó ninguna placa, intentando con Tesseract...")
                
        except Exception as e:
            logger.warning(f"⚠️ Azure CV falló: {str(e)}, usando Tesseract como fallback")

        # Fallback a Tesseract OCR (local, sin API keys)
        try:
            tesseract = self._get_tesseract()
            plate_text, confidence = tesseract.read_plate(image_path, image_bytes, preprocess=True)
            
            if plate_text:
                logger.info(f"✅ Tesseract detectó placa: {plate_text} (confianza: {confidence:.2f})")
            else:
                logger.warning("❌ Tesseract tampoco detectó ninguna placa")
                
            return plate_text, confidence
            
        except Exception as e:
            logger.error(f"❌ Error en Tesseract OCR: {str(e)}")
            return None, 0.0

    def extract_text(
        self,
        image_path: Optional[str] = None,
        image_bytes: Optional[bytes] = None
    ) -> List[str]:
        """
        Extrae todo el texto de una imagen usando Azure Computer Vision.

        Args:
            image_path: Ruta a la imagen
            image_bytes: Bytes de la imagen

        Returns:
            Lista de líneas de texto
        """
        try:
            service = self._get_azure_cv()
            return service.extract_text(image_path, image_bytes)
        except Exception as e:
            logger.error(f"Error extracting text: {str(e)}")
            return []


    # ==================== UTILIDADES ====================

    def get_status(self) -> Dict[str, any]:
        """
        Retorna el estado de los servicios de IA configurados.

        Returns:
            Diccionario con configuración y estado
        """
        return {
            'provider': 'Microsoft Azure + Tesseract (fallback)',
            'services_loaded': {
                'deepface': self._deepface is not None,
                'azure_cv': self._azure_cv is not None,
                'tesseract_ocr': self._tesseract is not None,
            },
            'capabilities': {
                'facial_recognition': True,
                'ocr': True,
                'ocr_fallback': True,
            }
        }


# Instancia global singleton
_orchestrator = None


def get_orchestrator() -> AIOrchestrator:
    """
    Retorna la instancia singleton del orquestador.

    Returns:
        Instancia de AIOrchestrator
    """
    global _orchestrator
    if _orchestrator is None:
        _orchestrator = AIOrchestrator()
    return _orchestrator
