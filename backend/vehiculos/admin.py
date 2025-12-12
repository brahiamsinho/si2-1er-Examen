from django.contrib import admin
from django.utils.html import format_html
from .models import Vehiculo


@admin.register(Vehiculo)
class VehiculoAdmin(admin.ModelAdmin):
    list_display = [
        'placa', 'marca_modelo', 'color', 'tipo_badge',
        'residente_nombre', 'unidad_codigo', 'estado_badge',
        'esta_activo_badge', 'fecha_registro'
    ]
    list_filter = ['estado', 'tipo', 'fecha_registro']
    search_fields = [
        'placa', 'marca', 'modelo', 'color',
        'residente__usuario__first_name',
        'residente__usuario__last_name',
        'unidad__codigo'
    ]
    readonly_fields = ['fecha_registro', 'fecha_actualizacion']
    fieldsets = (
        ('Información del Vehículo', {
            'fields': ('placa', 'tipo', 'marca', 'modelo', 'color', 'año', 'foto_vehiculo')
        }),
        ('Propietario', {
            'fields': ('residente', 'unidad')
        }),
        ('Autorización', {
            'fields': (
                'estado', 'fecha_autorizacion', 'fecha_vencimiento',
                'observaciones'
            )
        }),
        ('Auditoría', {
            'fields': ('fecha_registro', 'fecha_actualizacion'),
            'classes': ('collapse',)
        })
    )
    date_hierarchy = 'fecha_registro'
    ordering = ['-fecha_registro']
    
    def marca_modelo(self, obj):
        return f"{obj.marca} {obj.modelo}"
    marca_modelo.short_description = 'Marca/Modelo'
    
    def residente_nombre(self, obj):
        return obj.residente_nombre
    residente_nombre.short_description = 'Residente'
    
    def unidad_codigo(self, obj):
        return obj.unidad.codigo if obj.unidad else 'N/A'
    unidad_codigo.short_description = 'Unidad'
    
    def tipo_badge(self, obj):
        colors = {
            'auto': '#2196f3',
            'moto': '#ff9800',
            'camioneta': '#4caf50',
            'suv': '#9c27b0',
            'otro': '#607d8b'
        }
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 3px;">{}</span>',
            colors.get(obj.tipo, '#999'),
            obj.get_tipo_display()
        )
    tipo_badge.short_description = 'Tipo'
    
    def estado_badge(self, obj):
        colors = {
            'activo': '#4caf50',
            'inactivo': '#9e9e9e',
            'suspendido': '#f44336'
        }
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 3px;">{}</span>',
            colors.get(obj.estado, '#999'),
            obj.get_estado_display()
        )
    estado_badge.short_description = 'Estado'
    
    def esta_activo_badge(self, obj):
        if obj.esta_activo:
            return format_html(
                '<span style="color: green; font-weight: bold;">✓ Autorizado</span>'
            )
        return format_html(
            '<span style="color: red; font-weight: bold;">✗ No autorizado</span>'
        )
    esta_activo_badge.short_description = 'Autorización'

