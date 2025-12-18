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
from django.conf import settings
from django.conf.urls.static import static
from users.auth_views import logout_view
from core.dashboard_views import dashboard_stats


# Endpoints principales del sistema
urlpatterns = [
    # Panel de administración de Django
    path("admin/", admin.site.urls),
    # Dashboard: estadísticas consolidadas
    path("api/dashboard/stats/", dashboard_stats, name="dashboard-stats"),
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
    # Mantenimiento: gestión de tareas de mantenimiento
    path("api/mantenimiento/", include("mantenimiento.urls")),
    # Seguridad: reconocimiento facial, OCR de placas, y gestión de accesos
    path("api/seguridad/", include("seguridad.urls")),
    # Auth social: endpoints para login social (navegador)
    path("accounts/", include("allauth.urls")),
]

# Servir archivos media en desarrollo
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
