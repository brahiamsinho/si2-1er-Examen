from rest_framework import serializers
from .models import Vehiculo
from residentes.models import Residente


class VehiculoSerializer(serializers.ModelSerializer):
    """Serializer completo para vehículos"""
    
    residente_nombre = serializers.CharField(source='residente_nombre', read_only=True)
    unidad_codigo = serializers.CharField(source='unidad.codigo', read_only=True)
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    esta_activo = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Vehiculo
        fields = [
            'id', 'placa', 'tipo', 'tipo_display', 'marca', 'modelo',
            'color', 'año', 'residente', 'residente_nombre',
            'unidad', 'unidad_codigo', 'estado', 'estado_display',
            'fecha_registro', 'fecha_autorizacion', 'fecha_vencimiento',
            'observaciones', 'foto_vehiculo', 'esta_activo',
            'fecha_actualizacion'
        ]
        read_only_fields = ['id', 'fecha_registro', 'fecha_actualizacion']


class VehiculoListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listados"""
    
    residente_nombre = serializers.CharField(source='residente_nombre', read_only=True)
    unidad_codigo = serializers.CharField(source='unidad.codigo', read_only=True)
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    esta_activo = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Vehiculo
        fields = [
            'id', 'placa', 'tipo', 'tipo_display', 'marca', 'modelo',
            'color', 'residente_nombre', 'unidad_codigo', 'esta_activo',
            'estado'
        ]


class VehiculoCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear vehículos"""
    
    class Meta:
        model = Vehiculo
        fields = [
            'placa', 'tipo', 'marca', 'modelo', 'color', 'año',
            'residente', 'unidad', 'estado', 'fecha_autorizacion',
            'fecha_vencimiento', 'observaciones', 'foto_vehiculo'
        ]
    
    def validate_placa(self, value):
        """Validar formato de placa"""
        import re
        # Normalizar: mayúsculas, sin espacios
        placa_normalizada = value.upper().strip().replace(' ', '')
        
        # Validar formato: ABC-1234 o ABC1234
        if not re.match(r'^[A-Z]{3}-?\d{4}$', placa_normalizada):
            raise serializers.ValidationError(
                "Formato de placa inválido. Use: ABC-1234 o ABC1234"
            )
        
        return placa_normalizada


class ReconocerPlacaSerializer(serializers.Serializer):
    """Serializer para endpoint de reconocimiento de placas"""
    
    imagen = serializers.ImageField(
        help_text="Imagen de la placa vehicular"
    )
    verificar = serializers.BooleanField(
        default=True,
        help_text="Si True, verifica si la placa está registrada"
    )
    
    def validate_imagen(self, value):
        """Validar tamaño y formato de imagen"""
        # Máximo 10 MB
        if value.size > 10 * 1024 * 1024:
            raise serializers.ValidationError(
                "La imagen no debe superar 10 MB"
            )
        
        # Formatos permitidos
        formatos_permitidos = ['image/jpeg', 'image/png', 'image/jpg']
        if value.content_type not in formatos_permitidos:
            raise serializers.ValidationError(
                f"Formato no soportado. Use: {', '.join(formatos_permitidos)}"
            )
        
        return value


class VerificarPlacaSerializer(serializers.Serializer):
    """Serializer para respuesta de verificación de placa"""
    
    placa = serializers.CharField()
    autorizada = serializers.BooleanField()
    vehiculo = VehiculoSerializer(required=False, allow_null=True)
    mensaje = serializers.CharField()
