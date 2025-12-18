"""
URLs para el módulo de mantenimiento.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    TareaMantenimientoViewSet,
    RegistroMantenimientoViewSet,
    MaterialInsumoViewSet,
    IncidenciaViewSet,
)

router = DefaultRouter()
router.register(r'tareas', TareaMantenimientoViewSet, basename='tarea-mantenimiento')
router.register(r'registros', RegistroMantenimientoViewSet, basename='registro-mantenimiento')
router.register(r'materiales', MaterialInsumoViewSet, basename='material-insumo')
router.register(r'incidencias', IncidenciaViewSet, basename='incidencia')

urlpatterns = [
    path('', include(router.urls)),
]
