"""
Endpoints REST API para servicios de IA.

Este módulo expone los servicios de reconocimiento facial, OCR y detección
de objetos mediante API REST.
"""
import base64
import logging
from io import BytesIO

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAuthenticated
from PIL import Image

from .ai_orchestrator import get_orchestrator

logger = logging.getLogger(__name__)


class FaceIdentificationView(APIView):
    """
    Endpoint para identificar personas mediante reconocimiento facial.

    POST /api/seguridad/ia/identificar-rostro/
    
    Body:
    - image (file): Archivo de imagen
    O
    - image_base64 (string): Imagen codificada en base64
    
    Response:
    {
        "success": true,
        "person_id": "123",
        "confidence": 0.85,
        "message": "Persona identificada"
    }
    """
    
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request):
        try:
            # Obtener imagen desde request
            image_bytes = None

            # Opción 1: Archivo subido
            if 'image' in request.FILES:
                image_file = request.FILES['image']
                
                # Validar formato
                if not image_file.content_type.startswith('image/'):
                    return Response(
                        {
                            'success': False,
                            'error': 'El archivo debe ser una imagen'
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                image_bytes = image_file.read()

            # Opción 2: Base64
            elif 'image_base64' in request.data:
                try:
                    image_base64 = request.data['image_base64']
                    # Remover prefijo data:image si existe
                    if ',' in image_base64:
                        image_base64 = image_base64.split(',')[1]
                    
                    image_bytes = base64.b64decode(image_base64)
                except Exception as e:
                    return Response(
                        {
                            'success': False,
                            'error': f'Error decodificando base64: {str(e)}'
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )

            else:
                return Response(
                    {
                        'success': False,
                        'error': 'Debe proporcionar "image" (file) o "image_base64"'
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Validar que sea imagen válida
            try:
                img = Image.open(BytesIO(image_bytes))
                img.verify()
            except Exception:
                return Response(
                    {
                        'success': False,
                        'error': 'Imagen inválida o corrupta'
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Identificar rostro
            orchestrator = get_orchestrator()
            result = orchestrator.identify_face(image_bytes=image_bytes)

            if result and result.get('residente_id'):
                # Consultar residente completo
                from residentes.models import Residente
                from residentes.serializers import ResidenteSerializer
                
                try:
                    residente = Residente.objects.get(ci=result['residente_id'])
                    residente_data = ResidenteSerializer(residente).data
                    
                    return Response({
                        'success': True,
                        'residente_id': result['residente_id'],
                        'confidence': round(result.get('confidence', 0.0), 3),
                        'service': result.get('service', 'deepface'),
                        'model': result.get('model', 'unknown'),
                        'message': 'Persona identificada exitosamente',
                        'residente': residente_data  # Objeto completo del residente
                    })
                except Residente.DoesNotExist:
                    # CI identificado pero residente no existe en BD
                    return Response({
                        'success': True,
                        'residente_id': result['residente_id'],
                        'confidence': round(result.get('confidence', 0.0), 3),
                        'service': result.get('service', 'deepface'),
                        'model': result.get('model', 'unknown'),
                        'message': 'Rostro identificado pero residente no encontrado en base de datos',
                        'residente': None
                    })
            else:
                return Response({
                    'success': False,
                    'residente_id': None,
                    'confidence': 0.0,
                    'message': 'No se pudo identificar la persona (rostro no registrado o baja confianza)',
                    'residente': None
                })

        except Exception as e:
            logger.error(f"Error in face identification: {str(e)}", exc_info=True)
            return Response(
                {
                    'success': False,
                    'error': f'Error procesando imagen: {str(e)}'
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class PlateOCRView(APIView):
    """
    Endpoint para lectura de placas vehiculares.

    POST /api/seguridad/ia/leer-placa/
    
    Body:
    - image (file): Archivo de imagen de la placa
    O
    - image_base64 (string): Imagen codificada en base64
    
    Response:
    {
        "success": true,
        "plate": "ABC-1234",
        "confidence": 0.92,
        "message": "Placa leída exitosamente"
    }
    """
    
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request):
        try:
            # Obtener imagen
            image_bytes = None

            if 'image' in request.FILES:
                image_file = request.FILES['image']
                
                if not image_file.content_type.startswith('image/'):
                    return Response(
                        {
                            'success': False,
                            'error': 'El archivo debe ser una imagen'
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                image_bytes = image_file.read()

            elif 'image_base64' in request.data:
                try:
                    image_base64 = request.data['image_base64']
                    if ',' in image_base64:
                        image_base64 = image_base64.split(',')[1]
                    
                    image_bytes = base64.b64decode(image_base64)
                except Exception as e:
                    return Response(
                        {
                            'success': False,
                            'error': f'Error decodificando base64: {str(e)}'
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )

            else:
                return Response(
                    {
                        'success': False,
                        'error': 'Debe proporcionar "image" (file) o "image_base64"'
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Validar imagen
            try:
                img = Image.open(BytesIO(image_bytes))
                img.verify()
            except Exception:
                return Response(
                    {
                        'success': False,
                        'error': 'Imagen inválida o corrupta'
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Leer placa
            orchestrator = get_orchestrator()
            plate_text, confidence = orchestrator.read_plate(image_bytes=image_bytes)

            if plate_text:
                # Buscar vehículo en la base de datos
                from vehiculos.models import Vehiculo
                from vehiculos.serializers import VehiculoSerializer
                
                # Normalizar placa para búsqueda (sin guiones/espacios, uppercase)
                plate_search = plate_text.upper().replace('-', '').replace(' ', '')
                
                try:
                    # Buscar vehículo (case-insensitive, sin guiones)
                    vehiculo = Vehiculo.objects.get(placa__iexact=plate_search)
                    vehiculo_data = VehiculoSerializer(vehiculo).data
                    
                    return Response({
                        'success': True,
                        'plate': plate_text,
                        'confidence': round(confidence, 3),
                        'message': 'Placa identificada exitosamente',
                        'vehiculo': vehiculo_data  # Objeto completo del vehículo
                    })
                except Vehiculo.DoesNotExist:
                    # Placa leída pero no registrada en BD
                    return Response({
                        'success': True,
                        'plate': plate_text,
                        'confidence': round(confidence, 3),
                        'message': 'Placa leída pero vehículo no registrado en base de datos',
                        'vehiculo': None
                    })
            else:
                return Response({
                    'success': False,
                    'plate': None,
                    'confidence': 0.0,
                    'message': 'No se pudo leer la placa (imagen poco clara o sin texto)',
                    'vehiculo': None
                })

        except Exception as e:
            logger.error(f"Error in plate OCR: {str(e)}", exc_info=True)
            return Response(
                {
                    'success': False,
                    'error': f'Error procesando imagen: {str(e)}'
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class AnomalyDetectionView(APIView):
    """
    Endpoint para detección de anomalías (perros, vehículos, objetos sospechosos).

    POST /api/seguridad/ia/detectar-anomalias/
    
    Body:
    - image (file): Archivo de imagen
    O
    - image_base64 (string): Imagen codificada en base64
    - return_image (bool, opcional): Si true, retorna imagen anotada en base64
    
    Response:
    {
        "success": true,
        "detections": [
            {
                "class": "dog",
                "label": "Perro suelto",
                "confidence": 0.89,
                "bbox": {"x1": 100, "y1": 50, "x2": 200, "y2": 150}
            }
        ],
        "count": 1,
        "annotated_image": "base64..." (si return_image=true),
        "message": "Detección completada"
    }
    """
    
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request):
        try:
            # Obtener imagen
            image_bytes = None

            if 'image' in request.FILES:
                image_file = request.FILES['image']
                
                if not image_file.content_type.startswith('image/'):
                    return Response(
                        {
                            'success': False,
                            'error': 'El archivo debe ser una imagen'
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                image_bytes = image_file.read()

            elif 'image_base64' in request.data:
                try:
                    image_base64 = request.data['image_base64']
                    if ',' in image_base64:
                        image_base64 = image_base64.split(',')[1]
                    
                    image_bytes = base64.b64decode(image_base64)
                except Exception as e:
                    return Response(
                        {
                            'success': False,
                            'error': f'Error decodificando base64: {str(e)}'
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )

            else:
                return Response(
                    {
                        'success': False,
                        'error': 'Debe proporcionar "image" (file) o "image_base64"'
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Validar imagen
            try:
                img = Image.open(BytesIO(image_bytes))
                img.verify()
            except Exception:
                return Response(
                    {
                        'success': False,
                        'error': 'Imagen inválida o corrupta'
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Obtener parámetro return_image
            return_image = request.data.get('return_image', 'false').lower() == 'true'

            # Detectar anomalías
            orchestrator = get_orchestrator()
            detections, annotated_image = orchestrator.detect_anomalies(
                image_bytes=image_bytes,
                return_image=return_image
            )

            # Preparar respuesta
            response_data = {
                'success': True,
                'detections': detections,
                'count': len(detections),
                'message': f'Detección completada: {len(detections)} objetos encontrados'
            }

            # Agregar imagen anotada si se solicitó
            if return_image and annotated_image:
                response_data['annotated_image'] = base64.b64encode(annotated_image).decode('utf-8')

            return Response(response_data)

        except Exception as e:
            logger.error(f"Error in anomaly detection: {str(e)}", exc_info=True)
            return Response(
                {
                    'success': False,
                    'error': f'Error procesando imagen: {str(e)}'
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class AIStatusView(APIView):
    """
    Endpoint para obtener el estado de los servicios de IA.

    GET /api/seguridad/ia/status/
    
    Response:
    {
        "providers": {
            "face": "deepface",
            "ocr": "azure"
        },
        "services_loaded": {
            "deepface": true,
            "azure_cv": true
        }
    }
    """
    
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            orchestrator = get_orchestrator()
            
            # Obtener stats de la base de datos facial
            face_stats = orchestrator.get_face_database_stats()
            
            return Response({
                'providers': {
                    'face': 'deepface',
                    'ocr': 'azure'
                },
                'face_database': face_stats,
                'message': 'Estado de servicios de IA'
            })

        except Exception as e:
            logger.error(f"Error getting AI status: {str(e)}", exc_info=True)
            return Response(
                {
                    'error': f'Error obteniendo estado: {str(e)}'
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class FaceDatabaseStatsView(APIView):
    """
    Endpoint para obtener estadísticas de la base de datos facial.

    GET /api/seguridad/ia/face-database-stats/
    
    Response:
    {
        "success": true,
        "total_residents": 3,
        "total_images": 3,
        "cache_exists": true,
        "model": "Facenet",
        "detector": "opencv",
        "database_path": "media/rostros"
    }
    """
    
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            orchestrator = get_orchestrator()
            stats = orchestrator.get_face_database_stats()
            
            return Response({
                'success': True,
                **stats
            })

        except Exception as e:
            logger.error(f"Error getting face database stats: {str(e)}", exc_info=True)
            return Response(
                {
                    'success': False,
                    'error': f'Error obteniendo estadísticas: {str(e)}'
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class RebuildFaceDatabaseView(APIView):
    """
    Endpoint para reconstruir la base de datos facial (caché).

    POST /api/seguridad/ia/rebuild-face-database/
    
    Response:
    {
        "success": true,
        "message": "Base de datos reconstruida exitosamente",
        "stats": {...}
    }
    """
    
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            orchestrator = get_orchestrator()
            
            # Reconstruir base de datos
            success = orchestrator.rebuild_face_database()
            
            if success:
                # Obtener nuevas estadísticas
                stats = orchestrator.get_face_database_stats()
                
                return Response({
                    'success': True,
                    'message': 'Base de datos reconstruida exitosamente',
                    'stats': stats
                })
            else:
                return Response(
                    {
                        'success': False,
                        'message': 'No se pudo reconstruir la base de datos'
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

        except Exception as e:
            logger.error(f"Error rebuilding face database: {str(e)}", exc_info=True)
            return Response(
                {
                    'success': False,
                    'error': f'Error reconstruyendo base de datos: {str(e)}'
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
