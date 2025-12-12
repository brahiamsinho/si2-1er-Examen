"""
ViewSet para el módulo de multas.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count, Sum, Q
from django.utils import timezone
from decimal import Decimal
from .models import Multa
from .serializers import (
    MultaSerializer,
    MultaListSerializer,
    MultaCreateSerializer,
    MarcarPagadoSerializer,
    EstadisticasMultasSerializer,
)


class MultaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de multas.
    
    Provee endpoints para:
    - CRUD completo de multas
    - Listar multas pendientes
    - Listar multas vencidas
    - Marcar como pagado
    - Estadísticas
    """
    queryset = Multa.objects.select_related('residente', 'unidad').all()
    serializer_class = MultaSerializer
    
    def get_serializer_class(self):
        """Usar serializer apropiado según la acción"""
        if self.action == 'list':
            return MultaListSerializer
        elif self.action == 'create':
            return MultaCreateSerializer
        elif self.action == 'marcar_pagado':
            return MarcarPagadoSerializer
        elif self.action == 'estadisticas':
            return EstadisticasMultasSerializer
        return MultaSerializer
    
    def get_queryset(self):
        """
        Filtrar queryset según parámetros.
        Permite filtros por: residente, tipo, estado, vencidas
        """
        queryset = super().get_queryset()
        
        # Filtro por residente
        residente_id = self.request.query_params.get('residente')
        if residente_id:
            queryset = queryset.filter(residente_id=residente_id)
        
        # Filtro por unidad
        unidad_id = self.request.query_params.get('unidad')
        if unidad_id:
            queryset = queryset.filter(unidad_id=unidad_id)
        
        # Filtro por tipo
        tipo = self.request.query_params.get('tipo')
        if tipo:
            queryset = queryset.filter(tipo=tipo)
        
        # Filtro por estado
        estado = self.request.query_params.get('estado')
        if estado:
            queryset = queryset.filter(estado=estado)
        
        # Filtro por año
        año = self.request.query_params.get('año')
        if año:
            queryset = queryset.filter(fecha_emision__year=año)
        
        # Filtro por mes
        mes = self.request.query_params.get('mes')
        if mes:
            queryset = queryset.filter(fecha_emision__month=mes)
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def pendientes(self, request):
        """
        Lista multas pendientes de pago.
        GET /api/multas/pendientes/
        """
        multas = self.get_queryset().filter(estado='pendiente')
        
        serializer = MultaListSerializer(multas, many=True)
        return Response({
            'count': multas.count(),
            'results': serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def vencidas(self, request):
        """
        Lista multas vencidas (pendientes y pasada la fecha de vencimiento).
        GET /api/multas/vencidas/
        """
        hoy = timezone.now().date()
        multas = self.get_queryset().filter(
            estado='pendiente',
            fecha_vencimiento__lt=hoy
        )
        
        serializer = MultaListSerializer(multas, many=True)
        return Response({
            'count': multas.count(),
            'results': serializer.data
        })
    
    @action(detail=True, methods=['post'])
    def marcar_pagado(self, request, pk=None):
        """
        Marca una multa como pagada.
        POST /api/multas/{id}/marcar_pagado/
        
        Body (opcional):
        {
            "fecha_pago": "2025-12-08",
            "observaciones": "Pago realizado en efectivo"
        }
        """
        multa = self.get_object()
        
        if multa.estado != 'pendiente':
            return Response(
                {'detail': f'La multa ya está en estado: {multa.get_estado_display()}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = MarcarPagadoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Calcular recargo por mora antes de marcar como pagado
        multa.calcular_recargo_mora()
        multa.marcar_como_pagado()
        
        # Agregar observaciones si se proporcionaron
        if serializer.validated_data.get('observaciones'):
            multa.observaciones = f"{multa.observaciones}\n{serializer.validated_data['observaciones']}"
            multa.save(update_fields=['observaciones'])
        
        # Override fecha_pago si se proporcionó
        if serializer.validated_data.get('fecha_pago'):
            multa.fecha_pago = serializer.validated_data['fecha_pago']
            multa.save(update_fields=['fecha_pago'])
        
        return Response(
            MultaSerializer(multa).data,
            status=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['post'])
    def cancelar(self, request, pk=None):
        """
        Cancela una multa.
        POST /api/multas/{id}/cancelar/
        
        Body (opcional):
        {
            "motivo": "Razón de cancelación"
        }
        """
        multa = self.get_object()
        
        if multa.estado != 'pendiente':
            return Response(
                {'detail': f'Solo se pueden cancelar multas pendientes'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        motivo = request.data.get('motivo', '')
        multa.cancelar(motivo)
        
        return Response(
            MultaSerializer(multa).data,
            status=status.HTTP_200_OK
        )
    
    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        """
        Obtiene estadísticas generales de multas.
        GET /api/multas/estadisticas/
        
        Query params opcionales:
        - año: filtrar por año
        - mes: filtrar por mes
        """
        queryset = self.get_queryset()
        
        # Conteos por estado
        total_multas = queryset.count()
        total_pendientes = queryset.filter(estado='pendiente').count()
        total_pagadas = queryset.filter(estado='pagado').count()
        total_canceladas = queryset.filter(estado='cancelado').count()
        total_en_disputa = queryset.filter(estado='en_disputa').count()
        
        # Multas vencidas
        hoy = timezone.now().date()
        total_vencidas = queryset.filter(
            estado='pendiente',
            fecha_vencimiento__lt=hoy
        ).count()
        
        # Montos
        pendientes = queryset.filter(estado='pendiente')
        pagadas = queryset.filter(estado='pagado')
        
        monto_total_pendiente = sum(m.monto_total for m in pendientes) or Decimal('0.00')
        monto_total_pagado = sum(m.monto_total for m in pagadas) or Decimal('0.00')
        monto_total_recargos = queryset.aggregate(
            total=Sum('recargo_mora')
        )['total'] or Decimal('0.00')
        
        # Estadísticas por tipo
        por_tipo = {}
        for choice in Multa.TIPO_CHOICES:
            tipo_key = choice[0]
            count = queryset.filter(tipo=tipo_key).count()
            if count > 0:
                por_tipo[choice[1]] = count
        
        # Estadísticas por mes (últimos 12 meses)
        from datetime import timedelta
        hace_12_meses = timezone.now().date() - timedelta(days=365)
        por_mes = {}
        
        for i in range(12):
            fecha = timezone.now().date() - timedelta(days=30*i)
            mes_nombre = fecha.strftime('%B %Y')
            count = queryset.filter(
                fecha_emision__year=fecha.year,
                fecha_emision__month=fecha.month
            ).count()
            if count > 0:
                por_mes[mes_nombre] = count
        
        data = {
            'total_multas': total_multas,
            'total_pendientes': total_pendientes,
            'total_pagadas': total_pagadas,
            'total_canceladas': total_canceladas,
            'total_en_disputa': total_en_disputa,
            'total_vencidas': total_vencidas,
            'monto_total_pendiente': monto_total_pendiente,
            'monto_total_pagado': monto_total_pagado,
            'monto_total_recargos': monto_total_recargos,
            'por_tipo': por_tipo,
            'por_mes': por_mes,
        }
        
        serializer = EstadisticasMultasSerializer(data)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def por_residente(self, request):
        """
        Lista multas agrupadas por residente.
        GET /api/multas/por_residente/
        """
        residente_id = request.query_params.get('residente')
        if not residente_id:
            return Response(
                {'detail': 'Parámetro residente es requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        multas = self.get_queryset().filter(residente_id=residente_id)
        
        total = multas.count()
        pendientes = multas.filter(estado='pendiente').count()
        pagadas = multas.filter(estado='pagado').count()
        monto_pendiente = sum(m.monto_total for m in multas.filter(estado='pendiente'))
        
        serializer = MultaListSerializer(multas, many=True)
        
        return Response({
            'residente_id': residente_id,
            'total_multas': total,
            'pendientes': pendientes,
            'pagadas': pagadas,
            'monto_total_pendiente': monto_pendiente,
            'multas': serializer.data
        })

