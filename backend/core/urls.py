"""
URL configuration for core project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.urls import path, include
from users.auth_views import logout_view
# import test_seguridad_simple  # Módulo eliminado - comentado temporalmente
from seguridad.facial_recognition_views import (
    detect_faces,
    register_face,
    recognize_face,
    list_registered_faces,
    delete_face,
)


# Endpoints principales del sistema
urlpatterns = [
    # Panel de administración de Django
    path("admin/", admin.site.urls),
    # ENDPOINTS DE API (todos bajo /api/)
    # Auth: login/logout/password/reset para clientes
    # Ruta personalizada para logout
    path("api/auth/logout/", logout_view, name="rest_logout"),
    # Resto de rutas de autenticación
    path("api/auth/", include("dj_rest_auth.urls")),
    # Auth: registro de clientes
    path("api/auth/registration/", include("dj_rest_auth.registration.urls")),
    # Admin: gestión de usuarios, roles y permisos
    path("api/admin/", include("users.urls")),
    # Residentes: gestión de residentes del condominio
    path("api/residentes/", include("residentes.urls")),
    # Personal: gestión de personal de empresa
    path("api/personal/", include("personal.urls")),
    # ML: servicios de inteligencia artificial
    path("api/ml/", include("services.urls")),
    # Notificaciones: gestión de notificaciones del condominio
    path("api/notificaciones/", include("notificaciones.urls")),
    path("api/bitacora/", include("bitacora.urls")),
    path("api/areas-comunes/", include("areas_comunes.urls")),
    # Reservas: gestión de reservas de áreas comunes
    path("api/reservas/", include("reservas.urls")),
    # Inventario: gestión de inventario
    path("api/inventario/", include("inventario.urls")),
    # Unidades: gestión de unidades habitacionales
    path("api/unidades/", include("unidades.urls")),
    # Pagos: gestión de expensas y pagos
    path("api/pagos/", include("pagos.urls")),
    # Vehículos: gestión de vehículos y reconocimiento de placas
    path("api/vehiculos/", include("vehiculos.urls")),
    # Multas: gestión de multas y sanciones
    path("api/multas/", include("multas.urls")),
    # Seguridad: reconocimiento facial y OCR de placas
    # path("api/seguridad/", include("seguridad.urls")),  # Temporalmente deshabilitado
    # Endpoints temporales de prueba - COMENTADOS (módulo test_seguridad_simple eliminado)
    # path(
    #     "api/seguridad/reconocimiento-placa/",
    #     test_seguridad_simple.test_plate_recognition,
    #     name="test-plate-recognition",
    # ),
    # path(
    #     "api/seguridad/personas/",
    #     test_seguridad_simple.handle_personas,
    #     name="handle-personas",
    # ),
    # path(
    #     "api/seguridad/vehiculos/",
    #     test_seguridad_simple.handle_vehiculos,
    #     name="handle-vehiculos",
    # ),
    # Reconocimiento facial con AWS Rekognition
    path(
        "api/seguridad/detectar-caras/",
        detect_faces,
        name="detect-faces",
    ),
    path(
        "api/seguridad/registrar-cara/",
        register_face,
        name="register-face",
    ),
    path(
        "api/seguridad/reconocer-cara/",
        recognize_face,
        name="recognize-face",
    ),
    path(
        "api/seguridad/caras-registradas/",
        list_registered_faces,
        name="list-faces",
    ),
    path(
        "api/seguridad/eliminar-cara/",
        delete_face,
        name="delete-face",
    ),
    # Auth social: endpoints para login social (navegador)
    path("accounts/", include("allauth.urls")),
]
