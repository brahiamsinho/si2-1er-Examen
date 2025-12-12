from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Sum, Count
from django.utils import timezone
from datetime import datetime
from decimal import Decimal

from .models import Expensa, ConceptoPago, Pago
from .serializers import (
    ExpensaSerializer, ExpensaListSerializer, ExpensaCreateSerializer,
    ConceptoPagoSerializer, PagoSerializer, GenerarExpensasMasivoSerializer,
    RegistrarPagoSerializer, ReporteMorosidadSerializer
)
from unidades.models import UnidadHabitacional


class ExpensaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de expensas.
    
    Endpoints:
    - GET /api/expensas/ - Listar expensas
    - POST /api/expensas/ - Crear expensa
    - GET /api/expensas/{id}/ - Detalle de expensa
    - PUT/PATCH /api/expensas/{id}/ - Actualizar expensa
    - DELETE /api/expensas/{id}/ - Eliminar expensa
    - POST /api/expensas/generar_masivo/ - Generar expensas masivas
    - POST /api/expensas/{id}/registrar_pago/ - Registrar pago
    - GET /api/expensas/{id}/comprobante/ - Generar comprobante
    - GET /api/expensas/reporte_morosidad/ - Reporte de morosidad
    - GET /api/expensas/estadisticas/ - Estadísticas generales
    """
    
    queryset = Expensa.objects.select_related('unidad').prefetch_related(
        'conceptos', 'pagos__registrado_por'
    ).all()
    permission_classes = [IsAuthenticated]
    filterset_fields = ['unidad', 'estado', 'periodo']
    search_fields = ['unidad__codigo', 'unidad__direccion', 'periodo']
    ordering_fields = ['fecha_emision', 'fecha_vencimiento', 'monto_total', 'periodo']
    ordering = ['-periodo', '-fecha_emision']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return ExpensaListSerializer
        elif self.action == 'create':
            return ExpensaCreateSerializer
        return ExpensaSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Administradores y staff ven todas las expensas
        if self.request.user.is_staff or self.request.user.is_superuser:
            pass  # No filtrar, devolver todas
        # Residentes solo ven sus unidades
        elif hasattr(self.request.user, 'residente') and self.request.user.residente:
            unidad_ids = self.request.user.residente.unidades.values_list('id', flat=True)
            queryset = queryset.filter(unidad_id__in=unidad_ids)
        else:
            # Otros usuarios sin perfil residente no ven expensas
            queryset = queryset.none()
        
        # Filtros adicionales
        estado = self.request.query_params.get('estado', None)
        if estado:
            queryset = queryset.filter(estado=estado)
        
        vencidas = self.request.query_params.get('vencidas', None)
        if vencidas == 'true':
            queryset = queryset.filter(
                fecha_vencimiento__lt=timezone.now().date(),
                estado__in=['pendiente', 'pagado_parcial']
            )
        
        periodo = self.request.query_params.get('periodo', None)
        if periodo:
            queryset = queryset.filter(periodo=periodo)
        
        return queryset
    
    @action(detail=False, methods=['post'])
    def generar_masivo(self, request):
        """
        Genera expensas para todas las unidades o las seleccionadas.
        
        Body:
        {
            "periodo": "2024-01",
            "monto_base": 250.00,
            "fecha_vencimiento": "2024-01-15",
            "conceptos": [
                {"descripcion": "Mantenimiento", "monto": 150.00, "tipo": "mantenimiento"},
                {"descripcion": "Agua", "monto": 50.00, "tipo": "agua"}
            ],
            "unidades": [1, 2, 3]  // Opcional
        }
        """
        serializer = GenerarExpensasMasivoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        periodo = serializer.validated_data['periodo']
        monto_base = serializer.validated_data['monto_base']
        fecha_vencimiento = serializer.validated_data['fecha_vencimiento']
        conceptos_data = serializer.validated_data.get('conceptos', [])
        unidades_ids = serializer.validated_data.get('unidades', None)
        
        # Obtener unidades
        if unidades_ids:
            unidades = UnidadHabitacional.objects.filter(id__in=unidades_ids)
        else:
            unidades = UnidadHabitacional.objects.filter(estado='ocupado')
        
        # Verificar si ya existen expensas para este periodo
        existentes = Expensa.objects.filter(
            periodo=periodo,
            unidad__in=unidades
        ).count()
        
        if existentes > 0:
            return Response({
                'error': f'Ya existen {existentes} expensas para el periodo {periodo}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Crear expensas
        expensas_creadas = []
        fecha_emision = timezone.now().date()
        
        for unidad in unidades:
            expensa = Expensa.objects.create(
                unidad=unidad,
                periodo=periodo,
                monto_base=monto_base,
                fecha_emision=fecha_emision,
                fecha_vencimiento=fecha_vencimiento
            )
            
            # Crear conceptos
            for concepto_data in conceptos_data:
                ConceptoPago.objects.create(
                    expensa=expensa,
                    descripcion=concepto_data['descripcion'],
                    monto=concepto_data['monto'],
                    tipo=concepto_data.get('tipo', 'otro')
                )
            
            expensas_creadas.append(expensa)
        
        return Response({
            'message': f'{len(expensas_creadas)} expensas generadas exitosamente',
            'periodo': periodo,
            'cantidad': len(expensas_creadas)
        }, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def registrar_pago(self, request, pk=None):
        """
        Registra un pago para una expensa.
        
        Body:
        {
            "monto": 250.00,
            "metodo_pago": "efectivo",
            "numero_comprobante": "REC-001",
            "fecha_pago": "2024-01-10T10:30:00Z",
            "observaciones": "Pago total"
        }
        """
        expensa = self.get_object()
        
        serializer = RegistrarPagoSerializer(
            data=request.data,
            context={'expensa': expensa}
        )
        serializer.is_valid(raise_exception=True)
        
        # Crear pago
        pago = Pago.objects.create(
            expensa=expensa,
            monto=serializer.validated_data['monto'],
            metodo_pago=serializer.validated_data['metodo_pago'],
            numero_comprobante=serializer.validated_data.get('numero_comprobante', ''),
            fecha_pago=serializer.validated_data.get('fecha_pago', timezone.now()),
            observaciones=serializer.validated_data.get('observaciones', ''),
            registrado_por=request.user
        )
        
        # Recargar expensa para obtener valores actualizados
        expensa.refresh_from_db()
        
        return Response({
            'message': 'Pago registrado exitosamente',
            'pago': PagoSerializer(pago).data,
            'expensa': ExpensaSerializer(expensa).data
        }, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['get'])
    def comprobante(self, request, pk=None):
        """
        Genera datos para comprobante de expensa (para PDF frontend).
        """
        expensa = self.get_object()
        
        return Response({
            'expensa': ExpensaSerializer(expensa).data,
            'unidad': {
                'codigo': expensa.unidad.codigo,
                'direccion': expensa.unidad.direccion,
                'propietario': expensa.unidad.propietario.get_full_name() if expensa.unidad.propietario else 'N/A'
            },
            'conceptos': ConceptoPagoSerializer(expensa.conceptos.all(), many=True).data,
            'pagos': PagoSerializer(expensa.pagos.all(), many=True).data,
            'fecha_generacion': timezone.now()
        })
    
    @action(detail=False, methods=['get'])
    def reporte_morosidad(self, request):
        """
        Genera reporte de unidades con deudas.
        """
        expensas_vencidas = Expensa.objects.filter(
            estado__in=['pendiente', 'pagado_parcial'],
            fecha_vencimiento__lt=timezone.now().date()
        ).select_related('unidad')
        
        # Agrupar por unidad
        morosidad = {}
        for expensa in expensas_vencidas:
            unidad_id = expensa.unidad.id
            if unidad_id not in morosidad:
                morosidad[unidad_id] = {
                    'unidad_id': unidad_id,
                    'unidad_codigo': expensa.unidad.codigo,
                    'unidad_direccion': expensa.unidad.direccion,
                    'total_adeudado': Decimal('0.00'),
                    'meses_adeudados': 0,
                    'expensas_vencidas': []
                }
            
            morosidad[unidad_id]['total_adeudado'] += expensa.saldo_pendiente
            morosidad[unidad_id]['meses_adeudados'] += 1
            morosidad[unidad_id]['expensas_vencidas'].append({
                'id': expensa.id,
                'periodo': expensa.periodo,
                'monto_total': float(expensa.monto_total),
                'saldo_pendiente': float(expensa.saldo_pendiente),
                'dias_vencidos': expensa.dias_vencidos
            })
        
        return Response(list(morosidad.values()))
    
    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        """
        Estadísticas generales de expensas.
        """
        periodo = request.query_params.get('periodo', None)
        
        queryset = self.get_queryset()
        if periodo:
            queryset = queryset.filter(periodo=periodo)
        
        stats = queryset.aggregate(
            total_expensas=Count('id'),
            monto_total=Sum('monto_total'),
            monto_pagado=Sum('monto_pagado'),
            pendientes=Count('id', filter=Q(estado='pendiente')),
            pagadas=Count('id', filter=Q(estado='pagado')),
            parciales=Count('id', filter=Q(estado='pagado_parcial')),
            vencidas=Count('id', filter=Q(estado='vencido'))
        )
        
        stats['tasa_cobro'] = (
            (float(stats['monto_pagado'] or 0) / float(stats['monto_total'] or 1)) * 100
            if stats['monto_total'] else 0
        )
        
        return Response(stats)


class ConceptoPagoViewSet(viewsets.ModelViewSet):
    """ViewSet para conceptos de pago"""
    
    queryset = ConceptoPago.objects.select_related('expensa').all()
    serializer_class = ConceptoPagoSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['expensa', 'tipo']


class PagoViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet de solo lectura para pagos.
    Los pagos se crean a través de ExpensaViewSet.registrar_pago
    """
    
    queryset = Pago.objects.select_related(
        'expensa__unidad', 'registrado_por'
    ).all()
    serializer_class = PagoSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['expensa', 'metodo_pago']
    search_fields = ['numero_comprobante', 'expensa__unidad__codigo']
    ordering_fields = ['fecha_pago', 'monto']
    ordering = ['-fecha_pago']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filtro por unidad del residente
        if hasattr(self.request.user, 'residente'):
            unidad_ids = self.request.user.residente.unidades.values_list('id', flat=True)
            queryset = queryset.filter(expensa__unidad_id__in=unidad_ids)
        
        return queryset
