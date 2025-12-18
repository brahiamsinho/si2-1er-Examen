"""
Servicio alternativo de reconocimiento facial usando Azure Face Verification.

En lugar de PersonGroups (que requiere Limited Access), este servicio:
1. Detecta rostros en imágenes
2. Compara rostros usando Face Verification (1-a-1)
3. No requiere entrenamiento previo

Limitaciones:
- Más lento (compara contra cada residente)
- No escala bien con muchos residentes
- Pero funciona con Free tier sin Limited Access
"""
import os
import logging
from typing import List, Dict, Optional, Tuple
from io import BytesIO

from azure.cognitiveservices.vision.face import FaceClient
from msrest.authentication import CognitiveServicesCredentials
from PIL import Image

logger = logging.getLogger(__name__)


class AzureFaceVerificationService:
    """Servicio de reconocimiento facial usando Face Verification API."""

    def __init__(self):
        """Inicializa el cliente de Azure Face API."""
        self.subscription_key = os.getenv('AZURE_FACE_SUBSCRIPTION_KEY')
        self.endpoint = os.getenv('AZURE_FACE_ENDPOINT')
        self.confidence_threshold = float(os.getenv('AI_FACE_CONFIDENCE_THRESHOLD', '0.6'))

        if not self.subscription_key or not self.endpoint:
            raise ValueError(
                "Azure Face credentials not configured. "
                "Set AZURE_FACE_SUBSCRIPTION_KEY and AZURE_FACE_ENDPOINT env vars."
            )

        self.client = FaceClient(
            self.endpoint,
            CognitiveServicesCredentials(self.subscription_key)
        )

    def detect_faces(self, image_path: str) -> List[str]:
        """
        Detecta rostros en una imagen y retorna sus Face IDs.
        
        Args:
            image_path: Ruta a la imagen
            
        Returns:
            Lista de Face IDs detectados
        """
        try:
            with open(image_path, 'rb') as image:
                detected_faces = self.client.face.detect_with_stream(
                    image,
                    return_face_id=True,
                    detection_model='detection_03',
                    recognition_model='recognition_03'
                )
            
            face_ids = [face.face_id for face in detected_faces]
            logger.info(f"Detected {len(face_ids)} faces in {image_path}")
            return face_ids

        except Exception as e:
            logger.error(f"Error detecting faces: {str(e)}")
            return []

    def verify_faces(self, face_id1: str, face_id2: str) -> Tuple[bool, float]:
        """
        Verifica si dos Face IDs corresponden a la misma persona.
        
        Args:
            face_id1: Primer Face ID
            face_id2: Segundo Face ID
            
        Returns:
            (is_identical, confidence)
        """
        try:
            result = self.client.face.verify_face_to_face(face_id1, face_id2)
            return result.is_identical, result.confidence

        except Exception as e:
            logger.error(f"Error verifying faces: {str(e)}")
            return False, 0.0

    def find_matching_resident(
        self, 
        target_face_id: str, 
        resident_faces: Dict[int, str]
    ) -> Optional[Tuple[int, float]]:
        """
        Encuentra el residente que coincide con el rostro objetivo.
        
        Args:
            target_face_id: Face ID del rostro a identificar
            resident_faces: Diccionario {residente_id: face_id}
            
        Returns:
            (residente_id, confidence) o None si no hay coincidencias
        """
        best_match = None
        best_confidence = 0.0

        for residente_id, resident_face_id in resident_faces.items():
            try:
                is_identical, confidence = self.verify_faces(target_face_id, resident_face_id)
                
                if is_identical and confidence > best_confidence and confidence >= self.confidence_threshold:
                    best_match = residente_id
                    best_confidence = confidence

            except Exception as e:
                logger.error(f"Error comparing with resident {residente_id}: {str(e)}")
                continue

        if best_match:
            return best_match, best_confidence
        return None

    def identify_person_from_image(
        self, 
        image_path: str,
        resident_faces: Dict[int, str]
    ) -> Optional[Dict]:
        """
        Identifica a una persona desde una imagen.
        
        Args:
            image_path: Ruta a la imagen
            resident_faces: Diccionario {residente_id: face_id} precalculados
            
        Returns:
            Diccionario con residente_id y confidence, o None
        """
        # Detectar rostros en la imagen objetivo
        detected_faces = self.detect_faces(image_path)
        
        if not detected_faces:
            logger.warning(f"No faces detected in {image_path}")
            return None

        # Por ahora, usar solo el primer rostro detectado
        target_face_id = detected_faces[0]
        
        # Buscar coincidencia
        match = self.find_matching_resident(target_face_id, resident_faces)
        
        if match:
            residente_id, confidence = match
            return {
                'residente_id': residente_id,
                'confidence': confidence,
                'service': 'azure_verification'
            }
        
        return None


def build_resident_faces_cache():
    """
    Construye un cache de Face IDs para todos los residentes.
    
    Esta función debe ejecutarse al iniciar la aplicación o cuando se
    actualicen fotos de residentes.
    
    Returns:
        Diccionario {residente_id: face_id}
    """
    from residentes.models import Residente
    from django.conf import settings
    
    service = AzureFaceVerificationService()
    cache = {}

    residentes = Residente.objects.filter(
        es_activo=True,
        foto_perfil__isnull=False
    ).exclude(foto_perfil='')

    for residente in residentes:
        try:
            foto_path = os.path.join(settings.MEDIA_ROOT, str(residente.foto_perfil))
            
            if not os.path.exists(foto_path):
                continue

            face_ids = service.detect_faces(foto_path)
            
            if face_ids:
                # Guardar el primer Face ID detectado
                cache[residente.id] = face_ids[0]
                logger.info(f"Cached face for {residente.get_nombre_completo()}")

        except Exception as e:
            logger.error(f"Error caching face for resident {residente.id}: {str(e)}")
            continue

    logger.info(f"Cached {len(cache)} resident faces")
    return cache
