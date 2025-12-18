"""
Serializers para el módulo de mantenimiento.
"""
from rest_framework import serializers
from .models import TareaMantenimiento, RegistroMantenimiento, MaterialInsumo
from personal.serializers import PersonalSerializer
from areas_comunes.serializers import AreaComunSerializer


class MaterialInsumoSerializer(serializers.ModelSerializer):
    """Serializer para materiales e insumos"""
    costo_total = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        read_only=True
    )
    
    class Meta:
        model = MaterialInsumo
        fields = [
            'id',
            'tarea',
            'nombre',
            'descripcion',
            'cantidad',
            'unidad',
            'costo_unitario',
            'costo_total',
            'proveedor',
            'fecha_uso',
        ]
        read_only_fields = ['costo_total']


class RegistroMantenimientoSerializer(serializers.ModelSerializer):
    """Serializer para registros de historial de mantenimiento"""
    tipo_accion_display = serializers.CharField(source='get_tipo_accion_display', read_only=True)
    realizado_por_nombre = serializers.SerializerMethodField()
    
    class Meta:
        model = RegistroMantenimiento
        fields = [
            'id',
            'tarea',
            'tipo_accion',
            'tipo_accion_display',
            'descripcion',
            'realizado_por',
            'realizado_por_nombre',
            'fecha',
            'estado_anterior',
            'estado_nuevo',
        ]
        read_only_fields = ['fecha']
    
    def get_realizado_por_nombre(self, obj):
        if obj.realizado_por:
            return f"{obj.realizado_por.first_name} {obj.realizado_por.last_name}".strip() or obj.realizado_por.username
        return None


class TareaMantenimientoSerializer(serializers.ModelSerializer):
    """
    Serializer completo para TareaMantenimiento con información detallada.
    """
    # Read-only fields calculados
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    prioridad_display = serializers.CharField(source='get_prioridad_display', read_only=True)
    esta_vencida = serializers.BooleanField(read_only=True)
    dias_restantes = serializers.IntegerField(read_only=True)
    desviacion_presupuesto = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        read_only=True
    )
    porcentaje_desviacion = serializers.FloatField(read_only=True)
    
    # Información relacionada (solo nombres para listado)
    personal_asignado_nombre = serializers.SerializerMethodField()
    area_comun_nombre = serializers.SerializerMethodField()
    creado_por_nombre = serializers.SerializerMethodField()
    
    # Nested serializers opcionales (para detalle)
    personal_asignado_detalle = PersonalSerializer(source='personal_asignado', read_only=True)
    area_comun_detalle = AreaComunSerializer(source='area_comun', read_only=True)
    
    # Relaciones inversas
    registros = RegistroMantenimientoSerializer(many=True, read_only=True)
    materiales = MaterialInsumoSerializer(many=True, read_only=True)
    
    class Meta:
        model = TareaMantenimiento
        fields = [
            'id',
            'titulo',
            'descripcion',
            'tipo',
            'tipo_display',
            'prioridad',
            'prioridad_display',
            'estado',
            'estado_display',
            'personal_asignado',
            'personal_asignado_nombre',
            'personal_asignado_detalle',
            'fecha_asignacion',
            'area_comun',
            'area_comun_nombre',
            'area_comun_detalle',
            'ubicacion_especifica',
            'fecha_creacion',
            'fecha_limite',
            'fecha_inicio',
            'fecha_completado',
            'presupuesto_estimado',
            'costo_real',
            'desviacion_presupuesto',
            'porcentaje_desviacion',
            'observaciones',
            'creado_por',
            'creado_por_nombre',
            'actualizado_en',
            'esta_vencida',
            'dias_restantes',
            'registros',
            'materiales',
        ]
        read_only_fields = [
            'fecha_creacion',
            'actualizado_en',
            'fecha_asignacion',
            'fecha_inicio',
            'fecha_completado',
        ]
    
    def get_personal_asignado_nombre(self, obj):
        if obj.personal_asignado:
            return obj.personal_asignado.nombre_completo
        return None
    
    def get_area_comun_nombre(self, obj):
        if obj.area_comun:
            return obj.area_comun.nombre
        return None
    
    def get_creado_por_nombre(self, obj):
        if obj.creado_por:
            return f"{obj.creado_por.first_name} {obj.creado_por.last_name}".strip() or obj.creado_por.username
        return None


class TareaMantenimientoListSerializer(serializers.ModelSerializer):
    """
    Serializer ligero para listados de tareas (sin nested serializers).
    """
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    prioridad_display = serializers.CharField(source='get_prioridad_display', read_only=True)
    personal_asignado_nombre = serializers.SerializerMethodField()
    personal_asignado_detalle = PersonalSerializer(source='personal_asignado', read_only=True)
    area_comun_nombre = serializers.SerializerMethodField()
    esta_vencida = serializers.BooleanField(read_only=True)
    dias_restantes = serializers.IntegerField(read_only=True)
    # Campos de incidencia
    categoria_incidencia_display = serializers.CharField(
        source='get_categoria_incidencia_display', 
        read_only=True
    )
    reportado_por_residente_nombre = serializers.SerializerMethodField()
    
    class Meta:
        model = TareaMantenimiento
        fields = [
            'id',
            'titulo',
            'tipo',
            'tipo_display',
            'prioridad',
            'prioridad_display',
            'estado',
            'estado_display',
            'personal_asignado',
            'personal_asignado_nombre',
            'personal_asignado_detalle',
            'area_comun',
            'area_comun_nombre',
            'ubicacion_especifica',
            'fecha_limite',
            'presupuesto_estimado',
            'costo_real',
            'esta_vencida',
            'dias_restantes',
            'fecha_creacion',
            # Campos de incidencia
            'es_incidencia',
            'categoria_incidencia',
            'categoria_incidencia_display',
            'imagen_incidencia',
            'reportado_por_residente',
            'reportado_por_residente_nombre',
        ]
    
    def get_personal_asignado_nombre(self, obj):
        if obj.personal_asignado:
            return obj.personal_asignado.nombre_completo
        return None
    
    def get_area_comun_nombre(self, obj):
        if obj.area_comun:
            return obj.area_comun.nombre
        return None
    
    def get_reportado_por_residente_nombre(self, obj):
        if obj.reportado_por_residente:
            return obj.reportado_por_residente.nombre_completo
        return None


class AsignarTareaSerializer(serializers.Serializer):
    """Serializer para asignar una tarea a personal"""
    personal_id = serializers.IntegerField(required=True)
    
    def validate_personal_id(self, value):
        from personal.models import Personal
        try:
            Personal.objects.get(id=value)
        except Personal.DoesNotExist:
            raise serializers.ValidationError("Personal no encontrado")
        return value


class CompletarTareaSerializer(serializers.Serializer):
    """Serializer para completar una tarea"""
    costo_real = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        required=False,
        allow_null=True
    )
    observaciones = serializers.CharField(
        required=False,
        allow_blank=True,
        allow_null=True
    )


class CancelarTareaSerializer(serializers.Serializer):
    """Serializer para cancelar una tarea"""
    motivo = serializers.CharField(
        required=True,
        allow_blank=False
    )


class ReportarIncidenciaSerializer(serializers.ModelSerializer):
    """
    Serializer para que residentes reporten incidencias desde la app móvil.
    Crea automáticamente una tarea de mantenimiento tipo 'correctivo'.
    """
    imagen_base64 = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True,
        help_text='Imagen en formato base64 (data:image/...;base64,...)'
    )
    categoria_display = serializers.CharField(
        source='get_categoria_incidencia_display',
        read_only=True
    )
    estado_display = serializers.CharField(
        source='get_estado_display',
        read_only=True
    )
    residente_nombre = serializers.SerializerMethodField()
    imagen_url = serializers.SerializerMethodField()
    
    class Meta:
        model = TareaMantenimiento
        fields = [
            'id',
            'titulo',
            'descripcion',
            'categoria_incidencia',
            'categoria_display',
            'imagen_base64',
            'imagen_incidencia',
            'imagen_url',
            'ubicacion_especifica',
            'estado',
            'estado_display',
            'prioridad',
            'fecha_creacion',
            'residente_nombre',
        ]
        read_only_fields = [
            'id',
            'estado',
            'estado_display',
            'prioridad',
            'fecha_creacion',
            'imagen_incidencia',
            'residente_nombre',
        ]
    
    def get_residente_nombre(self, obj):
        if obj.reportado_por_residente:
            return obj.reportado_por_residente.nombre_completo
        return None
    
    def get_imagen_url(self, obj):
        if obj.imagen_incidencia:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.imagen_incidencia.url)
            return obj.imagen_incidencia.url
        return None
    
    def validate_categoria_incidencia(self, value):
        categorias_validas = [c[0] for c in TareaMantenimiento.CATEGORIA_INCIDENCIA_CHOICES]
        if value not in categorias_validas:
            raise serializers.ValidationError(
                f"Categoría inválida. Opciones: {', '.join(categorias_validas)}"
            )
        return value
    
    def create(self, validated_data):
        import base64
        from django.core.files.base import ContentFile
        from django.utils import timezone
        
        # Extraer imagen base64 si existe
        imagen_base64 = validated_data.pop('imagen_base64', None)
        
        # Obtener residente del contexto
        request = self.context.get('request')
        residente = None
        if request and hasattr(request.user, 'residente'):
            residente = request.user.residente
        
        # Configurar campos automáticos
        validated_data['tipo'] = 'correctivo'
        validated_data['es_incidencia'] = True
        validated_data['reportado_por_residente'] = residente
        validated_data['creado_por'] = request.user if request else None
        validated_data['prioridad'] = 'media'  # Prioridad por defecto
        validated_data['fecha_limite'] = timezone.now().date() + timezone.timedelta(days=7)
        
        # Crear la tarea
        tarea = TareaMantenimiento.objects.create(**validated_data)
        
        # Procesar imagen base64 si existe
        if imagen_base64:
            try:
                # Remover prefijo data:image/...;base64,
                if ';base64,' in imagen_base64:
                    format_part, imgstr = imagen_base64.split(';base64,')
                    ext = format_part.split('/')[-1]
                    if ext not in ['jpeg', 'jpg', 'png', 'gif']:
                        ext = 'jpg'
                else:
                    imgstr = imagen_base64
                    ext = 'jpg'
                
                # Decodificar y guardar
                data = base64.b64decode(imgstr)
                filename = f'incidencia_{tarea.id}_{timezone.now().strftime("%Y%m%d_%H%M%S")}.{ext}'
                tarea.imagen_incidencia.save(filename, ContentFile(data), save=True)
            except Exception as e:
                # Si falla la imagen, no bloquear la creación
                pass
        
        # Crear registro de creación
        from .models import RegistroMantenimiento
        RegistroMantenimiento.objects.create(
            tarea=tarea,
            tipo_accion='creacion',
            descripcion=f'Incidencia reportada por residente: {tarea.titulo}',
            realizado_por=request.user if request else None
        )
        
        return tarea


class MisIncidenciasSerializer(serializers.ModelSerializer):
    """
    Serializer para listar las incidencias reportadas por un residente.
    """
    categoria_display = serializers.CharField(
        source='get_categoria_incidencia_display',
        read_only=True
    )
    estado_display = serializers.CharField(
        source='get_estado_display',
        read_only=True
    )
    prioridad_display = serializers.CharField(
        source='get_prioridad_display',
        read_only=True
    )
    imagen_url = serializers.SerializerMethodField()
    
    class Meta:
        model = TareaMantenimiento
        fields = [
            'id',
            'titulo',
            'descripcion',
            'categoria_incidencia',
            'categoria_display',
            'estado',
            'estado_display',
            'prioridad',
            'prioridad_display',
            'ubicacion_especifica',
            'fecha_creacion',
            'fecha_limite',
            'imagen_url',
            'observaciones',
        ]
    
    def get_imagen_url(self, obj):
        if obj.imagen_incidencia:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.imagen_incidencia.url)
            return obj.imagen_incidencia.url
        return None
