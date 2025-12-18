"""
Admin para el módulo de mantenimiento.
"""
from django.contrib import admin
from django.utils.html import format_html
from .models import TareaMantenimiento, RegistroMantenimiento, MaterialInsumo


class MaterialInsumoInline(admin.TabularInline):
    """Inline para mostrar materiales dentro de una tarea"""
    model = MaterialInsumo
    extra = 1
    fields = ['nombre', 'cantidad', 'unidad', 'costo_unitario', 'proveedor', 'fecha_uso']


class RegistroMantenimientoInline(admin.TabularInline):
    """Inline para mostrar registros dentro de una tarea"""
    model = RegistroMantenimiento
    extra = 0
    can_delete = False
    readonly_fields = ['tipo_accion', 'descripcion', 'realizado_por', 'fecha', 'estado_anterior', 'estado_nuevo']
    
    def has_add_permission(self, request, obj=None):
        return False


@admin.register(TareaMantenimiento)
class TareaMantenimientoAdmin(admin.ModelAdmin):
    """Admin para TareaMantenimiento"""
    list_display = [
        'id',
        'titulo',
        'tipo_badge',
        'prioridad_badge',
        'estado_badge',
        'es_incidencia_badge',
        'personal_asignado',
        'fecha_limite',
        'vencida_badge',
        'presupuesto_estimado',
        'costo_real',
    ]
    list_filter = [
        'tipo',
        'estado',
        'prioridad',
        'es_incidencia',
        'categoria_incidencia',
        'personal_asignado',
        'area_comun',
        'fecha_creacion',
    ]
    search_fields = [
        'titulo',
        'descripcion',
        'ubicacion_especifica',
        'personal_asignado__nombre',
        'personal_asignado__apellido_paterno',
        'reportado_por_residente__nombre',
    ]
    readonly_fields = [
        'fecha_creacion',
        'fecha_asignacion',
        'fecha_inicio',
        'fecha_completado',
        'actualizado_en',
        'esta_vencida',
        'dias_restantes',
        'desviacion_presupuesto',
        'porcentaje_desviacion',
        'imagen_preview',
    ]
    fieldsets = (
        ('Información Básica', {
            'fields': (
                'titulo',
                'descripcion',
                'tipo',
                'prioridad',
                'estado',
            )
        }),
        ('Incidencia (si fue reportada por residente)', {
            'fields': (
                'es_incidencia',
                'categoria_incidencia',
                'reportado_por_residente',
                'imagen_incidencia',
                'imagen_preview',
            ),
            'classes': ('collapse',),
        }),
        ('Asignación', {
            'fields': (
                'personal_asignado',
                'fecha_asignacion',
            )
        }),
        ('Ubicación', {
            'fields': (
                'area_comun',
                'ubicacion_especifica',
            )
        }),
        ('Fechas', {
            'fields': (
                'fecha_creacion',
                'fecha_limite',
                'fecha_inicio',
                'fecha_completado',
                'actualizado_en',
                'esta_vencida',
                'dias_restantes',
            )
        }),
        ('Costos', {
            'fields': (
                'presupuesto_estimado',
                'costo_real',
                'desviacion_presupuesto',
                'porcentaje_desviacion',
            )
        }),
        ('Información Adicional', {
            'fields': (
                'observaciones',
                'creado_por',
            )
        }),
    )
    inlines = [MaterialInsumoInline, RegistroMantenimientoInline]
    date_hierarchy = 'fecha_creacion'
    
    def tipo_badge(self, obj):
        colors = {
            'preventivo': '#28a745',
            'correctivo': '#ffc107',
            'emergencia': '#dc3545',
            'instalacion': '#17a2b8',
            'reparacion': '#6c757d',
            'limpieza': '#007bff',
        }
        color = colors.get(obj.tipo, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 3px;">{}</span>',
            color,
            obj.get_tipo_display()
        )
    tipo_badge.short_description = 'Tipo'
    
    def prioridad_badge(self, obj):
        colors = {
            'baja': '#28a745',
            'media': '#ffc107',
            'alta': '#fd7e14',
            'critica': '#dc3545',
        }
        color = colors.get(obj.prioridad, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 3px;">{}</span>',
            color,
            obj.get_prioridad_display()
        )
    prioridad_badge.short_description = 'Prioridad'
    
    def estado_badge(self, obj):
        colors = {
            'pendiente': '#6c757d',
            'asignada': '#17a2b8',
            'en_progreso': '#ffc107',
            'completada': '#28a745',
            'cancelada': '#dc3545',
        }
        color = colors.get(obj.estado, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 3px;">{}</span>',
            color,
            obj.get_estado_display()
        )
    estado_badge.short_description = 'Estado'
    
    def vencida_badge(self, obj):
        if obj.esta_vencida:
            return format_html(
                '<span style="background-color: #dc3545; color: white; padding: 3px 10px; border-radius: 3px;">VENCIDA</span>'
            )
        elif obj.dias_restantes <= 3 and obj.estado not in ['completada', 'cancelada']:
            return format_html(
                '<span style="background-color: #ffc107; color: black; padding: 3px 10px; border-radius: 3px;">{} días</span>',
                obj.dias_restantes
            )
        return format_html(
            '<span style="color: #28a745;">OK</span>'
        )
    vencida_badge.short_description = 'Vencimiento'
    
    def es_incidencia_badge(self, obj):
        if obj.es_incidencia:
            return format_html(
                '<span style="background-color: #ff5722; color: white; padding: 3px 10px; border-radius: 3px;">📱 Móvil</span>'
            )
        return format_html('<span style="color: #6c757d;">-</span>')
    es_incidencia_badge.short_description = 'Origen'
    
    def imagen_preview(self, obj):
        if obj.imagen_incidencia:
            return format_html(
                '<img src="{}" style="max-width: 300px; max-height: 200px; border-radius: 8px;"/>',
                obj.imagen_incidencia.url
            )
        return "Sin imagen"
    imagen_preview.short_description = 'Vista previa de imagen'
    
    def save_model(self, request, obj, form, change):
        if not change:  # Nueva tarea
            obj.creado_por = request.user
        super().save_model(request, obj, form, change)


@admin.register(RegistroMantenimiento)
class RegistroMantenimientoAdmin(admin.ModelAdmin):
    """Admin para RegistroMantenimiento"""
    list_display = [
        'id',
        'tarea',
        'tipo_accion_badge',
        'descripcion',
        'realizado_por',
        'fecha',
    ]
    list_filter = [
        'tipo_accion',
        'fecha',
    ]
    search_fields = [
        'descripcion',
        'tarea__titulo',
        'realizado_por__username',
    ]
    readonly_fields = ['fecha']
    date_hierarchy = 'fecha'
    
    def tipo_accion_badge(self, obj):
        colors = {
            'creacion': '#007bff',
            'asignacion': '#17a2b8',
            'inicio': '#ffc107',
            'actualizacion': '#6c757d',
            'completado': '#28a745',
            'cancelacion': '#dc3545',
            'comentario': '#6f42c1',
        }
        color = colors.get(obj.tipo_accion, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 3px;">{}</span>',
            color,
            obj.get_tipo_accion_display()
        )
    tipo_accion_badge.short_description = 'Tipo de Acción'


@admin.register(MaterialInsumo)
class MaterialInsumoAdmin(admin.ModelAdmin):
    """Admin para MaterialInsumo"""
    list_display = [
        'id',
        'nombre',
        'tarea',
        'cantidad',
        'unidad',
        'costo_unitario',
        'costo_total',
        'proveedor',
        'fecha_uso',
    ]
    list_filter = [
        'unidad',
        'fecha_uso',
    ]
    search_fields = [
        'nombre',
        'descripcion',
        'proveedor',
        'tarea__titulo',
    ]
    readonly_fields = ['costo_total']
    date_hierarchy = 'fecha_uso'
