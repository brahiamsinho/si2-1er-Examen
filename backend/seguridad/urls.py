from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from . import facial_recognition_views
from . import ia_views

# ========== ROUTER PARA VIEWSETS (CRUD) ==========
router = DefaultRouter()
router.register(
    r"personas", views.PersonaAutorizadaViewSet, basename="personas-autorizadas"
)
router.register(
    r"vehiculos", views.VehiculoAutorizadoViewSet, basename="vehiculos-autorizados"
)
router.register(
    r"registros-acceso", views.RegistroAccesoViewSet, basename="registros-acceso"
)
router.register(
    r"registros-vehiculos",
    views.RegistroVehiculoViewSet,
    basename="registros-vehiculos",
)
router.register(r"alertas", views.AlertaSeguridadViewSet, basename="alertas-seguridad")

urlpatterns = [
    # ========== VIEWSETS (CRUD) ==========
    path("", include(router.urls)),
    
    # ========== INTELIGENCIA ARTIFICIAL - PROCESAMIENTO GENERAL ==========
    # Procesamiento de reconocimiento facial con lógica de negocio (registra acceso, alertas, etc.)
    path(
        "reconocimiento-facial/",
        views.procesar_reconocimiento_facial,
        name="reconocimiento-facial",
    ),
    # Procesamiento de reconocimiento de placas con OCR y lógica de negocio
    path(
        "reconocimiento-placa/",
        views.procesar_reconocimiento_placa,
        name="reconocimiento-placa",
    ),
    
    # ========== AWS REKOGNITION - OPERACIONES DIRECTAS ==========
    # Detectar caras en una imagen (sin registrar en BD)
    path(
        "detectar-caras/",
        facial_recognition_views.detect_faces,
        name="detect-faces",
    ),
    # Registrar una cara en AWS Rekognition collection
    path(
        "registrar-cara/",
        facial_recognition_views.register_face,
        name="register-face",
    ),
    # Reconocer una cara contra la collection de AWS
    path(
        "reconocer-cara/",
        facial_recognition_views.recognize_face,
        name="recognize-face",
    ),
    # Listar todas las caras registradas en AWS collection
    path(
        "caras-registradas/",
        facial_recognition_views.list_registered_faces,
        name="list-faces",
    ),
    # Eliminar una cara de AWS collection
    path(
        "eliminar-cara/",
        facial_recognition_views.delete_face,
        name="delete-face",
    ),
    
    # ========== SERVICIOS DE IA (DEEPFACE + AZURE CV) ==========
    # Identificación facial usando DeepFace (local)
    path(
        "ia/identificar-rostro/",
        ia_views.FaceIdentificationView.as_view(),
        name="ia-identificar-rostro",
    ),
    # Estadísticas de la base de datos facial
    path(
        "ia/face-database-stats/",
        ia_views.FaceDatabaseStatsView.as_view(),
        name="ia-face-database-stats",
    ),
    # Reconstruir base de datos facial (caché)
    path(
        "ia/rebuild-face-database/",
        ia_views.RebuildFaceDatabaseView.as_view(),
        name="ia-rebuild-face-database",
    ),
    # Lectura de placas usando Azure Computer Vision
    path(
        "ia/leer-placa/",
        ia_views.PlateOCRView.as_view(),
        name="ia-leer-placa",
    ),
    # Detección de anomalías usando YOLOv8
    path(
        "ia/detectar-anomalias/",
        ia_views.AnomalyDetectionView.as_view(),
        name="ia-detectar-anomalias",
    ),
    # Estado de los servicios de IA
    path(
        "ia/status/",
        ia_views.AIStatusView.as_view(),
        name="ia-status",
    ),
    
    # ========== ESTADÍSTICAS Y REPORTES ==========
    path("estadisticas/", views.estadisticas_seguridad, name="estadisticas-seguridad"),
]
