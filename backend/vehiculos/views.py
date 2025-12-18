from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from django.utils import timezone
import logging

from .models import Vehiculo
from .serializers import (
    VehiculoSerializer, VehiculoListSerializer, VehiculoCreateSerializer,
    ReconocerPlacaSerializer, VerificarPlacaSerializer
)
from .ocr_service import get_ocr_service

logger = logging.getLogger(__name__)


class VehiculoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de vehículos autorizados.
    
    Endpoints:
    - GET /api/vehiculos/ - Listar vehículos
    - POST /api/vehiculos/ - Registrar vehículo
    - GET /api/vehiculos/{id}/ - Detalle de vehículo
    - PUT/PATCH /api/vehiculos/{id}/ - Actualizar vehículo
    - DELETE /api/vehiculos/{id}/ - Eliminar vehículo
    - POST /api/vehiculos/reconocer_placa/ - Reconocer placa desde imagen
    - GET /api/vehiculos/verificar/{placa}/ - Verificar si placa está autorizada
    - GET /api/vehiculos/activos/ - Listar solo vehículos activos
    """
    
    queryset = Vehiculo.objects.select_related(
        'residente__usuario', 'unidad'
    ).all()
    permission_classes = [IsAuthenticated]
    filterset_fields = ['estado', 'tipo', 'residente', 'unidad']
    search_fields = ['placa', 'marca', 'modelo', 'color', 'residente__usuario__first_name', 'residente__usuario__last_name']
    ordering_fields = ['fecha_registro', 'placa', 'marca']
    ordering = ['-fecha_registro']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return VehiculoListSerializer
        elif self.action == 'create':
            return VehiculoCreateSerializer
        return VehiculoSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Si es residente (y NO es admin/staff), solo ver sus propios vehículos
        if hasattr(self.request.user, 'residente') and not self.request.user.is_staff:
            queryset = queryset.filter(residente=self.request.user.residente)
        
        # Filtros adicionales
        estado = self.request.query_params.get('estado', None)
        if estado:
            queryset = queryset.filter(estado=estado)
        
        solo_activos = self.request.query_params.get('solo_activos', None)
        if solo_activos == 'true':
            queryset = queryset.filter(estado='activo')
        
        return queryset
    
    @action(detail=False, methods=['post'])
    def reconocer_placa(self, request):
        """
        Reconoce la placa de un vehículo desde una imagen usando Azure Vision.
        
        Body (multipart/form-data):
        {
            "imagen": <archivo de imagen>,
            "verificar": true/false  // opcional, por defecto true
        }
        
        Response:
        {
            "placa": "ABC-1234",
            "autorizada": true,
            "vehiculo": {...},  // si está registrado
            "mensaje": "Placa reconocida y autorizada"
        }
        """
        serializer = ReconocerPlacaSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        imagen = serializer.validated_data['imagen']
        verificar = serializer.validated_data.get('verificar', True)
        
        try:
            # Obtener servicio de OCR
            ocr_service = get_ocr_service()
            
            # Leer bytes de la imagen
            imagen_bytes = imagen.read()
            
            # Reconocer placa
            placa_reconocida = ocr_service.reconocer_placa(imagen_bytes)
            
            if not placa_reconocida:
                return Response({
                    'error': 'No se pudo reconocer la placa en la imagen',
                    'mensaje': 'Asegúrate de que la imagen sea clara y la placa sea visible'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Si se solicitó verificación, buscar vehículo
            resultado = {
                'placa': placa_reconocida,
                'autorizada': False,
                'vehiculo': None,
                'mensaje': 'Placa reconocida'
            }
            
            if verificar:
                try:
                    vehiculo = Vehiculo.objects.select_related(
                        'residente__usuario', 'unidad'
                    ).get(placa=placa_reconocida)
                    
                    if vehiculo.esta_activo:
                        resultado['autorizada'] = True
                        resultado['vehiculo'] = VehiculoSerializer(vehiculo).data
                        resultado['mensaje'] = f'Placa autorizada - {vehiculo.residente_nombre}'
                    else:
                        resultado['vehiculo'] = VehiculoSerializer(vehiculo).data
                        resultado['mensaje'] = f'Vehículo registrado pero {vehiculo.estado}'
                        
                except Vehiculo.DoesNotExist:
                    resultado['mensaje'] = 'Placa NO autorizada - Vehículo no registrado'
            
            return Response(resultado, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error al reconocer placa: {e}")
            return Response({
                'error': 'Error al procesar la imagen',
                'detalle': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'], url_path='verificar/(?P<placa>[^/.]+)')
    def verificar(self, request, placa=None):
        """
        Verifica si una placa está autorizada.
        
        GET /api/vehiculos/verificar/ABC-1234/
        
        Response:
        {
            "placa": "ABC-1234",
            "autorizada": true,
            "vehiculo": {...},
            "mensaje": "Placa autorizada"
        }
        """
        # Normalizar placa
        placa_normalizada = placa.upper().strip().replace(' ', '')
        
        try:
            vehiculo = Vehiculo.objects.select_related(
                'residente__usuario', 'unidad'
            ).get(placa=placa_normalizada)
            
            if vehiculo.esta_activo:
                return Response({
                    'placa': placa_normalizada,
                    'autorizada': True,
                    'vehiculo': VehiculoSerializer(vehiculo).data,
                    'mensaje': f'Placa autorizada - {vehiculo.residente_nombre}'
                })
            else:
                return Response({
                    'placa': placa_normalizada,
                    'autorizada': False,
                    'vehiculo': VehiculoSerializer(vehiculo).data,
                    'mensaje': f'Vehículo registrado pero {vehiculo.estado}'
                })
                
        except Vehiculo.DoesNotExist:
            return Response({
                'placa': placa_normalizada,
                'autorizada': False,
                'vehiculo': None,
                'mensaje': 'Placa NO autorizada - Vehículo no registrado'
            }, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=False, methods=['get'])
    def activos(self, request):
        """
        Lista solo los vehículos activos y autorizados.
        """
        vehiculos_activos = self.get_queryset().filter(
            estado='activo'
        )
        
        # Filtrar por vencimiento si aplica
        hoy = timezone.now().date()
        vehiculos_validos = [
            v for v in vehiculos_activos
            if not v.fecha_vencimiento or v.fecha_vencimiento >= hoy
        ]
        
        serializer = VehiculoListSerializer(vehiculos_validos, many=True)
        return Response({
            'count': len(vehiculos_validos),
            'results': serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        """
        Estadísticas de vehículos.
        """
        queryset = self.get_queryset()
        
        stats = {
            'total': queryset.count(),
            'por_estado': {},
            'por_tipo': {},
            'activos_validos': 0
        }
        
        # Contar por estado
        for estado_key, estado_label in Vehiculo.ESTADO_CHOICES:
            count = queryset.filter(estado=estado_key).count()
            stats['por_estado'][estado_label] = count
        
        # Contar por tipo
        for tipo_key, tipo_label in Vehiculo.TIPO_CHOICES:
            count = queryset.filter(tipo=tipo_key).count()
            stats['por_tipo'][tipo_label] = count
        
        # Contar activos y válidos
        hoy = timezone.now().date()
        for vehiculo in queryset.filter(estado='activo'):
            if not vehiculo.fecha_vencimiento or vehiculo.fecha_vencimiento >= hoy:
                stats['activos_validos'] += 1
        
        return Response(stats)
