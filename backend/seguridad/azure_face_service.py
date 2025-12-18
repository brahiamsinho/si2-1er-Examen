"""
Servicio de Reconocimiento Facial usando Azure Face API.

Este servicio permite:
- Crear y gestionar PersonGroups (grupos de personas)
- Registrar rostros de residentes
- Entrenar el modelo de reconocimiento
- Identificar personas desde imágenes
"""
import os
import logging
from typing import List, Dict, Optional, Tuple
from io import BytesIO

from azure.cognitiveservices.vision.face import FaceClient
from azure.cognitiveservices.vision.face.models import TrainingStatusType
from msrest.authentication import CognitiveServicesCredentials
from PIL import Image

logger = logging.getLogger(__name__)


class AzureFaceService:
    """Servicio para reconocimiento facial usando Azure Face API."""

    def __init__(self):
        """Inicializa el cliente de Azure Face API."""
        self.subscription_key = os.getenv('AZURE_FACE_SUBSCRIPTION_KEY')
        self.endpoint = os.getenv('AZURE_FACE_ENDPOINT')
        self.person_group_id = os.getenv('AZURE_FACE_PERSON_GROUP_ID', 'condominio-residentes')
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

    def create_person_group(self, name: str = "Residentes Condominio") -> bool:
        """
        Crea un PersonGroup en Azure para almacenar rostros de residentes.

        Args:
            name: Nombre descriptivo del grupo

        Returns:
            True si se creó exitosamente o ya existía
        """
        try:
            # Verificar si ya existe
            try:
                self.client.person_group.get(self.person_group_id)
                logger.info(f"PersonGroup '{self.person_group_id}' already exists")
                return True
            except Exception:
                pass

            # Crear nuevo PersonGroup
            self.client.person_group.create(
                person_group_id=self.person_group_id,
                name=name,
                recognition_model='recognition_03'  # Modelo compatible con Free tier
            )
            logger.info(f"PersonGroup '{self.person_group_id}' created successfully")
            return True

        except Exception as e:
            # Log detallado del error
            import traceback
            error_details = traceback.format_exc()
            logger.error(f"Error creating PersonGroup: {str(e)}")
            logger.error(f"Full traceback:\n{error_details}")
            print(f"Error creating PersonGroup: {str(e)}")
            print(f"Details: {error_details}")
            return False

    def add_person(
        self,
        person_id: str,
        name: str,
        image_paths: List[str]
    ) -> Optional[str]:
        """
        Registra una persona con sus fotos en el PersonGroup.

        Args:
            person_id: ID único del residente
            name: Nombre completo del residente
            image_paths: Lista de rutas a imágenes del rostro

        Returns:
            Azure Person ID si se registró exitosamente, None en caso contrario
        """
        try:
            # Crear persona en Azure
            person = self.client.person_group_person.create(
                self.person_group_id,
                name=name,
                user_data=person_id  # Guardamos el ID de nuestro sistema
            )

            # Agregar cada foto como rostro persistente
            for image_path in image_paths:
                if not os.path.exists(image_path):
                    logger.warning(f"Image not found: {image_path}")
                    continue

                with open(image_path, 'rb') as image_file:
                    self.client.person_group_person.add_face_from_stream(
                        self.person_group_id,
                        person.person_id,
                        image_file
                    )
                    logger.debug(f"Added face from {image_path}")

            logger.info(f"Person '{name}' registered with {len(image_paths)} faces")
            return person.person_id

        except Exception as e:
            logger.error(f"Error adding person: {str(e)}")
            return None

    def train_model(self, wait_for_completion: bool = True) -> bool:
        """
        Entrena el modelo de reconocimiento facial.

        Args:
            wait_for_completion: Si True, espera hasta que termine el entrenamiento

        Returns:
            True si el entrenamiento fue exitoso
        """
        try:
            # Iniciar entrenamiento
            self.client.person_group.train(self.person_group_id)
            logger.info("Training started...")

            if wait_for_completion:
                # Esperar hasta que termine
                import time
                while True:
                    status = self.client.person_group.get_training_status(
                        self.person_group_id
                    )

                    if status.status == TrainingStatusType.succeeded:
                        logger.info("Training completed successfully")
                        return True

                    elif status.status == TrainingStatusType.failed:
                        logger.error(f"Training failed: {status.message}")
                        return False

                    time.sleep(1)

            return True

        except Exception as e:
            logger.error(f"Error training model: {str(e)}")
            return False

    def identify_face(
        self,
        image_path: Optional[str] = None,
        image_bytes: Optional[bytes] = None
    ) -> Tuple[Optional[str], float]:
        """
        Identifica una persona desde una imagen.

        Args:
            image_path: Ruta a la imagen (opcional si se proporciona image_bytes)
            image_bytes: Bytes de la imagen (opcional si se proporciona image_path)

        Returns:
            Tupla (person_id, confidence) donde:
            - person_id: ID del residente identificado o None si no se encontró
            - confidence: Nivel de confianza (0.0 - 1.0)
        """
        try:
            # Detectar rostros en la imagen
            if image_path:
                with open(image_path, 'rb') as image_file:
                    detected_faces = self.client.face.detect_with_stream(
                        image_file,
                        return_face_id=True
                    )
            elif image_bytes:
                detected_faces = self.client.face.detect_with_stream(
                    BytesIO(image_bytes),
                    return_face_id=True
                )
            else:
                raise ValueError("Must provide either image_path or image_bytes")

            if not detected_faces:
                logger.warning("No faces detected in image")
                return None, 0.0

            # Identificar rostros
            face_ids = [face.face_id for face in detected_faces]
            results = self.client.face.identify(
                face_ids,
                self.person_group_id,
                confidence_threshold=self.confidence_threshold
            )

            # Procesar resultados
            for result in results:
                if result.candidates:
                    # Obtener el mejor match
                    best_match = result.candidates[0]

                    # Obtener datos de la persona
                    person = self.client.person_group_person.get(
                        self.person_group_id,
                        best_match.person_id
                    )

                    logger.info(
                        f"Identified: {person.name} "
                        f"(confidence: {best_match.confidence:.2f})"
                    )

                    # Retornar el person_id de nuestro sistema (guardado en user_data)
                    return person.user_data, best_match.confidence

            return None, 0.0

        except Exception as e:
            logger.error(f"Error identifying face: {str(e)}")
            return None, 0.0

    def delete_person(self, azure_person_id: str) -> bool:
        """
        Elimina una persona del PersonGroup.

        Args:
            azure_person_id: ID de la persona en Azure

        Returns:
            True si se eliminó exitosamente
        """
        try:
            self.client.person_group_person.delete(
                self.person_group_id,
                azure_person_id
            )
            logger.info(f"Person {azure_person_id} deleted")
            return True

        except Exception as e:
            logger.error(f"Error deleting person: {str(e)}")
            return False

    def list_persons(self) -> List[Dict]:
        """
        Lista todas las personas registradas en el PersonGroup.

        Returns:
            Lista de diccionarios con datos de personas
        """
        try:
            persons = self.client.person_group_person.list(self.person_group_id)
            return [
                {
                    'azure_id': p.person_id,
                    'name': p.name,
                    'person_id': p.user_data,
                    'faces_count': len(p.persisted_face_ids)
                }
                for p in persons
            ]

        except Exception as e:
            logger.error(f"Error listing persons: {str(e)}")
            return []
