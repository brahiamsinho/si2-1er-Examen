from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ExpensaViewSet, ConceptoPagoViewSet, PagoViewSet

router = DefaultRouter()
router.register(r'expensas', ExpensaViewSet, basename='expensa')
router.register(r'conceptos', ConceptoPagoViewSet, basename='concepto')
router.register(r'pagos', PagoViewSet, basename='pago')

urlpatterns = [
    path('', include(router.urls)),
]
