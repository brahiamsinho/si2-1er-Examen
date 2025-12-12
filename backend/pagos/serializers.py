from rest_framework import serializers
from decimal import Decimal
from .models import Expensa, ConceptoPago, Pago
from unidades.models import UnidadHabitacional


class ConceptoPagoSerializer(serializers.ModelSerializer):
    """Serializer para conceptos de pago"""
    
    class Meta:
        model = ConceptoPago
        fields = [
            'id', 'descripcion', 'monto', 'tipo', 'fecha_creacion'
        ]
        read_only_fields = ['id', 'fecha_creacion']


class PagoSerializer(serializers.ModelSerializer):
    """Serializer para pagos"""
    
    registrado_por_nombre = serializers.SerializerMethodField()
    metodo_pago_display = serializers.CharField(
        source='get_metodo_pago_display',
        read_only=True
    )
    
    class Meta:
        model = Pago
        fields = [
            'id', 'expensa', 'monto', 'metodo_pago', 'metodo_pago_display',
            'numero_comprobante', 'fecha_pago', 'observaciones',
            'registrado_por', 'registrado_por_nombre', 'fecha_creacion'
        ]
        read_only_fields = ['id', 'registrado_por', 'fecha_creacion']
    
    def get_registrado_por_nombre(self, obj):
        if obj.registrado_por:
            return f"{obj.registrado_por.first_name} {obj.registrado_por.last_name}".strip() or obj.registrado_por.username
        return "Sistema"


class ExpensaSerializer(serializers.ModelSerializer):
    """Serializer completo para expensas"""
    
    unidad_codigo = serializers.CharField(source='unidad.codigo', read_only=True)
    unidad_direccion = serializers.CharField(source='unidad.direccion', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    saldo_pendiente = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    esta_vencida = serializers.BooleanField(read_only=True)
    dias_vencidos = serializers.IntegerField(read_only=True)
    conceptos = ConceptoPagoSerializer(many=True, read_only=True)
    pagos = PagoSerializer(many=True, read_only=True)
    
    class Meta:
        model = Expensa
        fields = [
            'id', 'unidad', 'unidad_codigo', 'unidad_direccion',
            'periodo', 'monto_base', 'monto_adicional', 'monto_total',
            'monto_pagado', 'saldo_pendiente', 'estado', 'estado_display',
            'fecha_emision', 'fecha_vencimiento', 'esta_vencida', 'dias_vencidos',
            'conceptos', 'pagos', 'fecha_creacion', 'fecha_actualizacion'
        ]
        read_only_fields = [
            'id', 'monto_total', 'monto_pagado', 'estado', 
            'fecha_creacion', 'fecha_actualizacion'
        ]


class ExpensaListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listados"""
    
    unidad_codigo = serializers.CharField(source='unidad.codigo', read_only=True)
    unidad_direccion = serializers.CharField(source='unidad.direccion', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    saldo_pendiente = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    esta_vencida = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Expensa
        fields = [
            'id', 'unidad', 'unidad_codigo', 'unidad_direccion',
            'periodo', 'monto_total', 'monto_pagado', 'saldo_pendiente',
            'estado', 'estado_display', 'fecha_emision', 'fecha_vencimiento',
            'esta_vencida'
        ]


class ExpensaCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear expensas con conceptos"""
    
    conceptos = ConceptoPagoSerializer(many=True, required=False)
    
    class Meta:
        model = Expensa
        fields = [
            'unidad', 'periodo', 'monto_base', 'monto_adicional',
            'fecha_emision', 'fecha_vencimiento', 'conceptos'
        ]
    
    def create(self, validated_data):
        conceptos_data = validated_data.pop('conceptos', [])
        expensa = Expensa.objects.create(**validated_data)
        
        # Crear conceptos
        for concepto_data in conceptos_data:
            ConceptoPago.objects.create(expensa=expensa, **concepto_data)
        
        return expensa


class GenerarExpensasMasivoSerializer(serializers.Serializer):
    """Serializer para generación masiva de expensas"""
    
    periodo = serializers.CharField(
        max_length=7,
        help_text='Formato: YYYY-MM'
    )
    monto_base = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        min_value=Decimal('0.00')
    )
    fecha_vencimiento = serializers.DateField()
    conceptos = ConceptoPagoSerializer(many=True, required=False)
    unidades = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        help_text='IDs de unidades. Si vacío, genera para todas'
    )


class RegistrarPagoSerializer(serializers.Serializer):
    """Serializer para registrar un pago"""
    
    monto = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        min_value=Decimal('0.01')
    )
    metodo_pago = serializers.ChoiceField(choices=Pago.METODOS_CHOICES)
    numero_comprobante = serializers.CharField(
        max_length=100,
        required=False,
        allow_blank=True
    )
    fecha_pago = serializers.DateTimeField(required=False)
    observaciones = serializers.CharField(
        required=False,
        allow_blank=True
    )
    
    def validate_monto(self, value):
        expensa = self.context.get('expensa')
        if expensa and value > expensa.saldo_pendiente:
            raise serializers.ValidationError(
                f"El monto no puede ser mayor al saldo pendiente (Bs. {expensa.saldo_pendiente})"
            )
        return value


class ReporteMorosidadSerializer(serializers.Serializer):
    """Serializer para reporte de morosidad"""
    
    unidad_id = serializers.IntegerField()
    unidad_codigo = serializers.CharField()
    unidad_direccion = serializers.CharField()
    total_adeudado = serializers.DecimalField(max_digits=10, decimal_places=2)
    meses_adeudados = serializers.IntegerField()
    expensas_vencidas = serializers.ListField()
