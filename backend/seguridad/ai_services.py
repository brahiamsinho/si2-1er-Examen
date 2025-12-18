"""
Servicios de IA para reconocimiento facial y OCR de placas
Integra AWS Rekognition y Google Vision API
"""

import logging
import base64
import io
from typing import Dict, Any, Optional, Tuple
from PIL import Image
import boto3
from google.cloud import vision
from django.conf import settings
from django.core.files.base import ContentFile
import json
from .plate_recognizer import plate_recognizer

logger = logging.getLogger(__name__)


class AWSRekognitionService:
    """Servicio para reconocimiento facial usando AWS Rekognition"""

    def __init__(self):
        try:
            aws_access_key = getattr(settings, "AWS_ACCESS_KEY_ID", "")
            aws_secret_key = getattr(settings, "AWS_SECRET_ACCESS_KEY", "")

            if not aws_access_key or not aws_secret_key:
                raise Exception("Credenciales de AWS no configuradas")

            self.client = boto3.client(
                "rekognition",
                aws_access_key_id=aws_access_key,
                aws_secret_access_key=aws_secret_key,
                region_name=getattr(settings, "AWS_REGION", "us-east-1"),
            )
            self.collection_id = getattr(
                settings, "AWS_REKOGNITION_COLLECTION_ID", "condominio-rostros"
            )
            self.available = True
        except Exception as e:
            logger.warning(f"AWS Rekognition no disponible: {e}")
            self.client = None
            self.available = False

    def crear_coleccion(self) -> Dict[str, Any]:
        """Crea una colección de rostros en AWS Rekognition"""
        if not self.available:
            return {
                "exito": False,
                "error": "AWS Rekognition no está configurado. Configure las credenciales de AWS.",
            }

        try:
            response = self.client.create_collection(CollectionId=self.collection_id)
            return {
                "exito": True,
                "collection_id": response["CollectionId"],
                "status_code": response["StatusCode"],
            }
        except self.client.exceptions.ResourceAlreadyExistsException:
            return {
                "exito": True,
                "mensaje": "La colección ya existe",
                "collection_id": self.collection_id,
            }
        except Exception as e:
            logger.error(f"Error creando colección: {e}")
            return {"exito": False, "error": str(e)}

    def indexar_rostro(self, imagen_bytes: bytes, persona_id: str) -> Dict[str, Any]:
        """Indexa un rostro en la colección de AWS Rekognition"""
        if not self.available:
            return {
                "exito": False,
                "error": "AWS Rekognition no está configurado. Configure las credenciales de AWS.",
            }

        try:
            response = self.client.index_faces(
                CollectionId=self.collection_id,
                Image={"Bytes": imagen_bytes},
                ExternalImageId=persona_id,
                MaxFaces=1,
                QualityFilter="AUTO",
            )

            if response["FaceRecords"]:
                face_record = response["FaceRecords"][0]
                return {
                    "exito": True,
                    "face_id": face_record["Face"]["FaceId"],
                    "confidence": face_record["Face"]["Confidence"],
                    "bounding_box": face_record["Face"]["BoundingBox"],
                }
            else:
                return {
                    "exito": False,
                    "error": "No se detectó ningún rostro en la imagen",
                }

        except Exception as e:
            logger.error(f"Error indexando rostro: {e}")
            return {"exito": False, "error": str(e)}

    def buscar_rostro(
        self, imagen_bytes: bytes, umbral_confianza: float = 80.0
    ) -> Dict[str, Any]:
        """Busca un rostro en la colección de AWS Rekognition"""
        if not self.available:
            return {
                "exito": False,
                "error": "AWS Rekognition no está configurado. Configure las credenciales de AWS.",
            }

        try:
            response = self.client.search_faces_by_image(
                CollectionId=self.collection_id,
                Image={"Bytes": imagen_bytes},
                MaxFaces=1,
                FaceMatchThreshold=umbral_confianza,
            )

            if response["FaceMatches"]:
                match = response["FaceMatches"][0]
                return {
                    "exito": True,
                    "persona_id": match["Face"]["ExternalImageId"],
                    "confidence": match["Similarity"],
                    "face_id": match["Face"]["FaceId"],
                }
            else:
                return {"exito": False, "mensaje": "No se encontró coincidencia"}

        except Exception as e:
            logger.error(f"Error buscando rostro: {e}")
            return {"exito": False, "error": str(e)}

    def eliminar_rostro(self, face_id: str) -> Dict[str, Any]:
        """Elimina un rostro de la colección"""
        if not self.available:
            return {
                "exito": False,
                "error": "AWS Rekognition no está configurado. Configure las credenciales de AWS.",
            }

        try:
            response = self.client.delete_faces(
                CollectionId=self.collection_id, FaceIds=[face_id]
            )
            return {"exito": True, "faces_deleted": response["DeletedFaces"]}
        except Exception as e:
            logger.error(f"Error eliminando rostro: {e}")
            return {"exito": False, "error": str(e)}


class GoogleVisionService:
    """Servicio para OCR de placas usando Google Vision API"""

    def __init__(self):
        try:
            self.client = vision.ImageAnnotatorClient()
            self.available = True
        except Exception as e:
            logger.warning(f"Google Vision API no disponible: {e}")
            self.client = None
            self.available = False

    def extraer_texto_placa(self, imagen_bytes: bytes) -> Dict[str, Any]:
        """Extrae texto de una imagen de placa usando Google Vision OCR"""
        if not self.available:
            return {
                "exito": False,
                "error": "Google Vision API no está configurado. Configure las credenciales de Google Cloud.",
            }

        try:
            # Usar reconocedor de placas bolivianas personalizado
            if not self.available:
                # Usar nuestro reconocedor personalizado
                resultado = plate_recognizer.recognize_plate(imagen_bytes)

                if resultado["exito"]:
                    return {
                        "exito": True,
                        "texto_completo": resultado["texto_completo"],
                        "placa_detectada": resultado["placa_detectada"],
                        "coordenadas": resultado["coordenadas"],
                        "confidence_promedio": resultado["confidence_promedio"],
                    }
                else:
                    return {
                        "exito": False,
                        "mensaje": resultado.get(
                            "mensaje", "No se pudo detectar la placa"
                        ),
                        "error": resultado.get("error", ""),
                    }

            image = vision.Image(content=imagen_bytes)

            # Configuración específica para placas de vehículos
            image_context = vision.ImageContext(
                text_detection_params=vision.TextDetectionParams(
                    enable_text_detection_confidence_score=True
                )
            )

            response = self.client.text_detection(
                image=image, image_context=image_context
            )

            if response.error.message:
                return {"exito": False, "error": response.error.message}

            texts = response.text_annotations
            if not texts:
                return {"exito": False, "mensaje": "No se detectó texto en la imagen"}

            # El primer texto es todo el texto detectado
            full_text = texts[0].description.strip()

            # Buscar patrones de placas bolivianas
            placa_detectada = self._extraer_placa_boliviana(full_text)

            # Obtener coordenadas del texto detectado
            coordenadas = []
            for text in texts[1:]:  # Saltar el primer elemento (texto completo)
                vertices = []
                for vertex in text.bounding_poly.vertices:
                    vertices.append({"x": vertex.x, "y": vertex.y})
                coordenadas.append(
                    {
                        "text": text.description,
                        "confidence": getattr(text, "confidence", 0.0),
                        "bounding_box": vertices,
                    }
                )

            return {
                "exito": True,
                "texto_completo": full_text,
                "placa_detectada": placa_detectada,
                "coordenadas": coordenadas,
                "confidence_promedio": sum(c["confidence"] for c in coordenadas)
                / len(coordenadas)
                if coordenadas
                else 0.0,
            }

        except Exception as e:
            logger.error(f"Error en OCR de placa: {e}")
            return {"exito": False, "error": str(e)}

    def _extraer_placa_boliviana(self, texto: str) -> Optional[str]:
        """Extrae placa boliviana del texto detectado"""
        import re

        # Patrones para placas bolivianas
        patrones = [
            r"[A-Z]{2}\s?\d{4}",  # Formato: AB 1234
            r"[A-Z]{3}\s?\d{3}",  # Formato: ABC 123
            r"[A-Z]{2}\s?\d{3}[A-Z]",  # Formato: AB 123C
        ]

        for patron in patrones:
            match = re.search(patron, texto.upper())
            if match:
                return match.group().replace(" ", "")

        return None

    def detectar_vehiculo(self, imagen_bytes: bytes) -> Dict[str, Any]:
        """Detecta tipo de vehículo en la imagen"""
        if not self.available:
            return {
                "exito": False,
                "error": "Google Vision API no está configurado. Configure las credenciales de Google Cloud.",
            }

        try:
            image = vision.Image(content=imagen_bytes)

            # Detectar objetos en la imagen
            objects = self.client.object_localization(image=image)

            vehiculos_detectados = []
            for obj in objects.localized_object_annotations:
                if obj.name.lower() in ["car", "truck", "bus", "motorcycle", "bicycle"]:
                    vehiculos_detectados.append(
                        {
                            "tipo": obj.name,
                            "confidence": obj.score,
                            "bounding_box": [
                                {"x": vertex.x, "y": vertex.y}
                                for vertex in obj.bounding_poly.normalized_vertices
                            ],
                        }
                    )

            return {"exito": True, "vehiculos": vehiculos_detectados}

        except Exception as e:
            logger.error(f"Error detectando vehículo: {e}")
            return {"exito": False, "error": str(e)}


class SeguridadAIService:
    """Servicio principal que integra AWS Rekognition y Google Vision"""

    def __init__(self):
        self.aws_service = AWSRekognitionService()
        self.google_service = GoogleVisionService()

    def procesar_reconocimiento_facial(
        self, imagen_bytes: bytes, tipo_acceso: str
    ) -> Dict[str, Any]:
        """Procesa reconocimiento facial completo"""
        try:
            # Buscar rostro en la colección
            resultado_busqueda = self.aws_service.buscar_rostro(imagen_bytes)

            if not resultado_busqueda["exito"]:
                return {
                    "exito": False,
                    "mensaje": resultado_busqueda.get(
                        "mensaje", "Error en reconocimiento"
                    ),
                    "tipo_acceso": tipo_acceso,
                }

            return {
                "exito": True,
                "persona_id": resultado_busqueda["persona_id"],
                "confidence": resultado_busqueda["confidence"],
                "tipo_acceso": tipo_acceso,
                "face_id": resultado_busqueda.get("face_id"),
            }

        except Exception as e:
            logger.error(f"Error en procesamiento facial: {e}")
            return {"exito": False, "error": str(e), "tipo_acceso": tipo_acceso}

    def procesar_reconocimiento_placa(self, imagen_bytes: bytes) -> Dict[str, Any]:
        """Procesa reconocimiento de placa completo"""
        try:
            # Usar AIOrchestrator con fallback automático a Tesseract
            from .ai_orchestrator import get_orchestrator
            
            orchestrator = get_orchestrator()
            placa_detectada, confidence = orchestrator.read_plate(image_bytes=imagen_bytes)
            
            if not placa_detectada:
                return {
                    "exito": False,
                    "mensaje": "No se pudo detectar una placa válida en la imagen",
                }

            return {
                "exito": True,
                "placa": placa_detectada,
                "confidence": confidence,
                "coordenadas": [],
                "vehiculos_detectados": [],
                "texto_completo": placa_detectada,
            }

        except Exception as e:
            logger.error(f"Error en procesamiento de placa: {e}")
            return {"exito": False, "error": str(e)}


# Instancias globales de servicios
aws_rekognition = AWSRekognitionService()
google_vision = GoogleVisionService()
seguridad_ai = SeguridadAIService()
