"""
Configuración del admin para multas.
"""
from django.contrib import admin
from django.utils.html import format_html
from .models import Multa


@admin.register(Multa)
class MultaAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'tipo_badge',
        'residente_nombre',
        'unidad_nombre',
        'monto_display',
        'estado_badge',
        'fecha_emision',
        'fecha_vencimiento',
        'vencimiento_badge',
    )
    list_filter = (
        'estado',
        'tipo',
        'fecha_emision',
        'fecha_vencimiento',
    )
    search_fields = (
        'descripcion',
        'residente__usuario__first_name',
        'residente__usuario__last_name',
        'unidad__numero',
    )
    readonly_fields = (
        'fecha_emision',
        'fecha_creacion',
        'fecha_actualizacion',
        'monto_total',
        'esta_vencida',
        'dias_vencimiento',
    )
    fieldsets = (
        ('Información básica', {
            'fields': (
                'tipo',
                'descripcion',
                'monto',
                'recargo_mora',
                'monto_total',
            )
        }),
        ('Responsable', {
            'fields': (
                'residente',
                'unidad',
            )
        }),
        ('Estado y fechas', {
            'fields': (
                'estado',
                'fecha_emision',
                'fecha_vencimiento',
                'fecha_pago',
                'esta_vencida',
                'dias_vencimiento',
            )
        }),
        ('Observaciones', {
            'fields': (
                'observaciones',
                'creado_por',
            )
        }),
        ('Auditoría', {
            'fields': (
                'fecha_creacion',
                'fecha_actualizacion',
            ),
            'classes': ('collapse',)
        }),
    )
    
    def tipo_badge(self, obj):
        """Badge coloreado para tipo"""
        colors = {
            'ruido': '#e74c3c',
            'estacionamiento': '#3498db',
            'area_comun': '#9b59b6',
            'pago_atrasado': '#e67e22',
            'dano_propiedad': '#c0392b',
            'incumplimiento': '#34495e',
            'otro': '#95a5a6',
        }
        color = colors.get(obj.tipo, '#95a5a6')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 3px; font-size: 11px; font-weight: bold;">{}</span>',
            color,
            obj.get_tipo_display()
        )
    tipo_badge.short_description = 'Tipo'
    
    def estado_badge(self, obj):
        """Badge coloreado para estado"""
        colors = {
            'pendiente': '#f39c12',
            'pagado': '#27ae60',
            'cancelado': '#95a5a6',
            'en_disputa': '#e74c3c',
        }
        color = colors.get(obj.estado, '#95a5a6')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 3px; font-size: 11px; font-weight: bold;">{}</span>',
            color,
            obj.get_estado_display()
        )
    estado_badge.short_description = 'Estado'
    
    def vencimiento_badge(self, obj):
        """Badge indicando si está vencida"""
        if obj.estado != 'pendiente':
            return '-'
        
        if obj.esta_vencida:
            dias = abs(obj.dias_vencimiento)
            return format_html(
                '<span style="background-color: #e74c3c; color: white; padding: 3px 8px; border-radius: 3px; font-size: 11px; font-weight: bold;">Vencida hace {} días</span>',
                dias
            )
        else:
            dias = obj.dias_vencimiento
            if dias <= 7:
                color = '#f39c12'
            else:
                color = '#27ae60'
            return format_html(
                '<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 3px; font-size: 11px; font-weight: bold;">Vence en {} días</span>',
                color,
                dias
            )
    vencimiento_badge.short_description = 'Vencimiento'
    
    def monto_display(self, obj):
        """Muestra monto total con recargos"""
        if obj.recargo_mora > 0:
            return format_html(
                'Bs. {}<br/><small style="color: #e74c3c;">+ Bs. {} mora</small>',
                obj.monto,
                obj.recargo_mora
            )
        return f'Bs. {obj.monto}'
    monto_display.short_description = 'Monto'
    
    def get_queryset(self, request):
        """Optimizar queries"""
        qs = super().get_queryset(request)
        return qs.select_related('residente', 'unidad')
    
    actions = ['marcar_como_pagadas', 'cancelar_multas']
    
    def marcar_como_pagadas(self, request, queryset):
        """Acción para marcar multas como pagadas"""
        count = 0
        for multa in queryset.filter(estado='pendiente'):
            multa.marcar_como_pagado()
            count += 1
        
        self.message_user(
            request,
            f'{count} multa(s) marcada(s) como pagada(s).'
        )
    marcar_como_pagadas.short_description = 'Marcar como pagadas'
    
    def cancelar_multas(self, request, queryset):
        """Acción para cancelar multas"""
        count = 0
        for multa in queryset.filter(estado='pendiente'):
            multa.cancelar('Cancelado desde admin')
            count += 1
        
        self.message_user(
            request,
            f'{count} multa(s) cancelada(s).'
        )
    cancelar_multas.short_description = 'Cancelar multas'
