"""
URLs para el módulo de multas.
"""
from rest_framework.routers import DefaultRouter
from .views import MultaViewSet

router = DefaultRouter()
router.register(r'', MultaViewSet, basename='multa')

urlpatterns = router.urls