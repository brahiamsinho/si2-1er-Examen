"""
Serializers para el módulo de multas.
"""
from rest_framework import serializers
from .models import Multa
from residentes.serializers import ResidenteSerializer
from unidades.serializers import UnidadHabitacionalSerializer


class MultaSerializer(serializers.ModelSerializer):
    """
    Serializer completo para Multa con información de residente y unidad.
    """
    residente_nombre = serializers.CharField(read_only=True)
    unidad_nombre = serializers.CharField(read_only=True)
    esta_vencida = serializers.BooleanField(read_only=True)
    dias_vencimiento = serializers.IntegerField(read_only=True)
    monto_total = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        read_only=True
    )
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    
    # Nested serializers opcionales (solo para lectura detallada)
    residente_detalle = ResidenteSerializer(source='residente', read_only=True)
    unidad_detalle = UnidadHabitacionalSerializer(source='unidad', read_only=True)
    
    class Meta:
        model = Multa
        fields = [
            'id',
            'tipo',
            'tipo_display',
            'descripcion',
            'monto',
            'recargo_mora',
            'monto_total',
            'residente',
            'residente_nombre',
            'residente_detalle',
            'unidad',
            'unidad_nombre',
            'unidad_detalle',
            'estado',
            'estado_display',
            'fecha_emision',
            'fecha_vencimiento',
            'fecha_pago',
            'esta_vencida',
            'dias_vencimiento',
            'observaciones',
            'creado_por',
            'fecha_creacion',
            'fecha_actualizacion',
        ]
        read_only_fields = [
            'fecha_emision',
            'recargo_mora',
            'fecha_creacion',
            'fecha_actualizacion',
        ]


class MultaListSerializer(serializers.ModelSerializer):
    """
    Serializer simplificado para listados de multas.
    Optimizado para rendimiento en listados.
    """
    residente_nombre = serializers.CharField(read_only=True)
    unidad_nombre = serializers.CharField(read_only=True)
    monto_total = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        read_only=True
    )
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    esta_vencida = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Multa
        fields = [
            'id',
            'tipo',
            'tipo_display',
            'descripcion',
            'monto',
            'monto_total',
            'residente',
            'residente_nombre',
            'unidad',
            'unidad_nombre',
            'estado',
            'estado_display',
            'fecha_emision',
            'fecha_vencimiento',
            'esta_vencida',
        ]


class MultaCreateSerializer(serializers.ModelSerializer):
    """
    Serializer para crear nuevas multas.
    Incluye validaciones específicas.
    """
    
    class Meta:
        model = Multa
        fields = [
            'tipo',
            'descripcion',
            'monto',
            'residente',
            'unidad',
            'fecha_vencimiento',
            'observaciones',
            'creado_por',
        ]
    
    def validate_monto(self, value):
        """Validar que el monto sea mayor al mínimo"""
        from decimal import Decimal
        if value < Decimal('50.00'):
            raise serializers.ValidationError(
                "El monto mínimo de una multa es Bs. 50"
            )
        return value
    
    def validate(self, data):
        """Validaciones generales"""
        # Si no se especifica unidad, se tomará del residente automáticamente
        if not data.get('unidad') and data.get('residente'):
            data['unidad'] = data['residente'].get_unidad()
        
        # Validar fecha de vencimiento si se proporciona
        if data.get('fecha_vencimiento'):
            from django.utils import timezone
            if data['fecha_vencimiento'] < timezone.now().date():
                raise serializers.ValidationError({
                    'fecha_vencimiento': 'La fecha de vencimiento no puede ser en el pasado'
                })
        
        return data


class MarcarPagadoSerializer(serializers.Serializer):
    """
    Serializer para marcar una multa como pagada.
    """
    fecha_pago = serializers.DateField(required=False)
    observaciones = serializers.CharField(
        required=False,
        allow_blank=True,
        help_text='Observaciones sobre el pago'
    )


class EstadisticasMultasSerializer(serializers.Serializer):
    """
    Serializer para estadísticas de multas.
    """
    total_multas = serializers.IntegerField()
    total_pendientes = serializers.IntegerField()
    total_pagadas = serializers.IntegerField()
    total_canceladas = serializers.IntegerField()
    total_en_disputa = serializers.IntegerField()
    total_vencidas = serializers.IntegerField()
    
    monto_total_pendiente = serializers.DecimalField(max_digits=12, decimal_places=2)
    monto_total_pagado = serializers.DecimalField(max_digits=12, decimal_places=2)
    monto_total_recargos = serializers.DecimalField(max_digits=12, decimal_places=2)
    
    por_tipo = serializers.DictField(child=serializers.IntegerField())
    por_mes = serializers.DictField(child=serializers.IntegerField())
