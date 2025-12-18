"""
Views para el módulo de mantenimiento.
"""
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.db.models import Q, Sum, Count
from decimal import Decimal

from .models import TareaMantenimiento, RegistroMantenimiento, MaterialInsumo
from .serializers import (
    TareaMantenimientoSerializer,
    TareaMantenimientoListSerializer,
    RegistroMantenimientoSerializer,
    MaterialInsumoSerializer,
    AsignarTareaSerializer,
    CompletarTareaSerializer,
    CancelarTareaSerializer,
)
from personal.models import Personal


class TareaMantenimientoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar tareas de mantenimiento.
    Incluye filtros, búsqueda y acciones personalizadas.
    """
    queryset = TareaMantenimiento.objects.select_related(
        'personal_asignado',
        'area_comun',
        'creado_por'
    ).prefetch_related('registros', 'materiales')
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['tipo', 'estado', 'prioridad', 'personal_asignado', 'area_comun']
    search_fields = ['titulo', 'descripcion', 'ubicacion_especifica']
    ordering_fields = ['fecha_creacion', 'fecha_limite', 'prioridad', 'estado']
    ordering = ['-fecha_creacion']
    
    def get_serializer_class(self):
        """Usa serializer ligero para listados"""
        if self.action == 'list':
            return TareaMantenimientoListSerializer
        return TareaMantenimientoSerializer
    
    def get_queryset(self):
        """
        Filtros adicionales por query params:
        - vencidas: true/false
        - personal: ID del personal (alias de personal_asignado)
        - desde: fecha_desde (YYYY-MM-DD)
        - hasta: fecha_hasta (YYYY-MM-DD)
        """
        queryset = super().get_queryset()
        
        # Filtro por tareas vencidas
        vencidas = self.request.query_params.get('vencidas')
        if vencidas == 'true':
            queryset = queryset.vencidas()
        elif vencidas == 'false':
            hoy = timezone.now().date()
            queryset = queryset.filter(
                Q(fecha_limite__gte=hoy) | Q(estado__in=['completada', 'cancelada'])
            )
        
        # Filtro por personal (alias)
        personal_id = self.request.query_params.get('personal')
        if personal_id:
            queryset = queryset.filter(personal_asignado_id=personal_id)
        
        # Filtro por rango de fechas
        fecha_desde = self.request.query_params.get('desde')
        fecha_hasta = self.request.query_params.get('hasta')
        if fecha_desde:
            queryset = queryset.filter(fecha_creacion__date__gte=fecha_desde)
        if fecha_hasta:
            queryset = queryset.filter(fecha_creacion__date__lte=fecha_hasta)
        
        return queryset
    
    def perform_create(self, serializer):
        """Asigna el usuario que crea la tarea y crea registro inicial"""
        tarea = serializer.save(creado_por=self.request.user)
        
        # Crear registro de creación
        RegistroMantenimiento.objects.create(
            tarea=tarea,
            tipo_accion='creacion',
            descripcion=f'Tarea creada: {tarea.titulo}',
            realizado_por=self.request.user
        )
    
    def perform_update(self, serializer):
        """Crea registro de actualización"""
        tarea_anterior = self.get_object()
        estado_anterior = tarea_anterior.estado
        
        tarea = serializer.save()
        
        # Si cambió el estado, crear registro
        if estado_anterior != tarea.estado:
            RegistroMantenimiento.objects.create(
                tarea=tarea,
                tipo_accion='actualizacion',
                descripcion=f'Estado cambiado de {estado_anterior} a {tarea.estado}',
                realizado_por=self.request.user,
                estado_anterior=estado_anterior,
                estado_nuevo=tarea.estado
            )
    
    @action(detail=True, methods=['post'])
    def asignar(self, request, pk=None):
        """
        Asigna una tarea a un personal específico.
        Body: { "personal_id": 123 }
        """
        tarea = self.get_object()
        serializer = AsignarTareaSerializer(data=request.data)
        
        if serializer.is_valid():
            personal_id = serializer.validated_data['personal_id']
            try:
                personal = Personal.objects.get(id=personal_id)
                personal_anterior = tarea.personal_asignado
                
                # Asignar tarea
                tarea.asignar_a(personal, request.user)
                
                # Crear registro
                descripcion = f'Tarea asignada a {personal.nombre_completo}'
                if personal_anterior:
                    descripcion = f'Tarea reasignada de {personal_anterior.nombre_completo} a {personal.nombre_completo}'
                
                RegistroMantenimiento.objects.create(
                    tarea=tarea,
                    tipo_accion='asignacion',
                    descripcion=descripcion,
                    realizado_por=request.user
                )
                
                return Response({
                    'success': True,
                    'message': 'Tarea asignada correctamente',
                    'tarea': TareaMantenimientoSerializer(tarea).data
                })
            except Personal.DoesNotExist:
                return Response(
                    {'error': 'Personal no encontrado'},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def iniciar(self, request, pk=None):
        """Marca una tarea como 'en progreso'"""
        tarea = self.get_object()
        
        if tarea.iniciar_trabajo():
            RegistroMantenimiento.objects.create(
                tarea=tarea,
                tipo_accion='inicio',
                descripcion='Trabajo iniciado',
                realizado_por=request.user,
                estado_anterior=tarea.estado,
                estado_nuevo='en_progreso'
            )
            
            return Response({
                'success': True,
                'message': 'Tarea iniciada correctamente',
                'tarea': TareaMantenimientoSerializer(tarea).data
            })
        
        return Response(
            {'error': 'No se puede iniciar esta tarea. Verifica su estado actual.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    @action(detail=True, methods=['post'])
    def completar(self, request, pk=None):
        """
        Marca una tarea como completada.
        Body: { "costo_real": 1500.00, "observaciones": "..." }
        """
        tarea = self.get_object()
        serializer = CompletarTareaSerializer(data=request.data)
        
        if serializer.is_valid():
            costo_real = serializer.validated_data.get('costo_real')
            observaciones = serializer.validated_data.get('observaciones')
            
            if tarea.completar(costo_real, observaciones):
                descripcion = 'Tarea completada'
                if costo_real:
                    descripcion += f' con costo real de Bs. {costo_real}'
                
                RegistroMantenimiento.objects.create(
                    tarea=tarea,
                    tipo_accion='completado',
                    descripcion=descripcion,
                    realizado_por=request.user,
                    estado_anterior='en_progreso',
                    estado_nuevo='completada'
                )
                
                return Response({
                    'success': True,
                    'message': 'Tarea completada correctamente',
                    'tarea': TareaMantenimientoSerializer(tarea).data
                })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def cancelar(self, request, pk=None):
        """
        Cancela una tarea.
        Body: { "motivo": "..." }
        """
        tarea = self.get_object()
        serializer = CancelarTareaSerializer(data=request.data)
        
        if serializer.is_valid():
            motivo = serializer.validated_data['motivo']
            estado_anterior = tarea.estado
            
            if tarea.cancelar(motivo):
                RegistroMantenimiento.objects.create(
                    tarea=tarea,
                    tipo_accion='cancelacion',
                    descripcion=f'Tarea cancelada: {motivo}',
                    realizado_por=request.user,
                    estado_anterior=estado_anterior,
                    estado_nuevo='cancelada'
                )
                
                return Response({
                    'success': True,
                    'message': 'Tarea cancelada correctamente',
                    'tarea': TareaMantenimientoSerializer(tarea).data
                })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        """
        Retorna estadísticas generales de mantenimiento.
        """
        queryset = self.get_queryset()
        
        # Estadísticas por estado
        por_estado = queryset.values('estado').annotate(
            total=Count('id')
        ).order_by('estado')
        
        # Estadísticas por tipo
        por_tipo = queryset.values('tipo').annotate(
            total=Count('id')
        ).order_by('tipo')
        
        # Estadísticas por prioridad
        por_prioridad = queryset.values('prioridad').annotate(
            total=Count('id')
        ).order_by('prioridad')
        
        # Costos
        costos = queryset.aggregate(
            presupuesto_total=Sum('presupuesto_estimado'),
            costo_total=Sum('costo_real')
        )
        
        # Tareas vencidas
        tareas_vencidas = queryset.vencidas().count()
        
        # Tareas del mes actual
        tareas_mes = queryset.del_mes().count()
        
        return Response({
            'por_estado': list(por_estado),
            'por_tipo': list(por_tipo),
            'por_prioridad': list(por_prioridad),
            'costos': costos,
            'tareas_vencidas': tareas_vencidas,
            'tareas_mes': tareas_mes,
            'total_tareas': queryset.count()
        })


class RegistroMantenimientoViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet de solo lectura para registros de mantenimiento.
    """
    queryset = RegistroMantenimiento.objects.select_related(
        'tarea',
        'realizado_por'
    )
    serializer_class = RegistroMantenimientoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['tarea', 'tipo_accion']
    ordering_fields = ['fecha']
    ordering = ['-fecha']


class MaterialInsumoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para materiales e insumos de tareas de mantenimiento.
    """
    queryset = MaterialInsumo.objects.select_related('tarea')
    serializer_class = MaterialInsumoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['tarea']
    search_fields = ['nombre', 'descripcion', 'proveedor']
    ordering_fields = ['fecha_uso', 'costo_total']
    ordering = ['-fecha_uso']
