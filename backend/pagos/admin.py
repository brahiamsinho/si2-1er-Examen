from django.contrib import admin
from django.utils.html import format_html
from .models import Expensa, ConceptoPago, Pago


class ConceptoPagoInline(admin.TabularInline):
    model = ConceptoPago
    extra = 1
    fields = ['descripcion', 'monto', 'tipo']


class PagoInline(admin.TabularInline):
    model = Pago
    extra = 0
    readonly_fields = ['fecha_pago', 'registrado_por', 'fecha_creacion']
    fields = ['monto', 'metodo_pago', 'numero_comprobante', 'fecha_pago', 'registrado_por']
    
    def has_add_permission(self, request, obj=None):
        return False


@admin.register(Expensa)
class ExpensaAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'unidad', 'periodo', 'monto_total_display',
        'monto_pagado_display', 'saldo_display', 'estado_badge',
        'fecha_vencimiento', 'esta_vencida_badge'
    ]
    list_filter = ['estado', 'periodo', 'fecha_vencimiento', 'fecha_emision']
    search_fields = ['unidad__codigo', 'unidad__direccion', 'periodo']
    readonly_fields = [
        'monto_total', 'monto_pagado', 'estado',
        'fecha_creacion', 'fecha_actualizacion'
    ]
    fieldsets = (
        ('Información General', {
            'fields': ('unidad', 'periodo')
        }),
        ('Montos', {
            'fields': (
                'monto_base', 'monto_adicional',
                'monto_total', 'monto_pagado'
            )
        }),
        ('Fechas', {
            'fields': (
                'fecha_emision', 'fecha_vencimiento',
                'fecha_creacion', 'fecha_actualizacion'
            )
        }),
        ('Estado', {
            'fields': ('estado',)
        })
    )
    inlines = [ConceptoPagoInline, PagoInline]
    date_hierarchy = 'fecha_emision'
    ordering = ['-periodo', '-fecha_emision']
    
    def monto_total_display(self, obj):
        return f"Bs. {obj.monto_total}"
    monto_total_display.short_description = 'Monto Total'
    
    def monto_pagado_display(self, obj):
        return f"Bs. {obj.monto_pagado}"
    monto_pagado_display.short_description = 'Pagado'
    
    def saldo_display(self, obj):
        saldo = obj.saldo_pendiente
        color = 'green' if saldo == 0 else 'red'
        return format_html(
            '<span style="color: {}; font-weight: bold;">Bs. {}</span>',
            color, saldo
        )
    saldo_display.short_description = 'Saldo'
    
    def estado_badge(self, obj):
        colors = {
            'pendiente': '#ffc107',
            'pagado_parcial': '#ff9800',
            'pagado': '#4caf50',
            'vencido': '#f44336'
        }
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 3px;">{}</span>',
            colors.get(obj.estado, '#999'),
            obj.get_estado_display()
        )
    estado_badge.short_description = 'Estado'
    
    def esta_vencida_badge(self, obj):
        if obj.esta_vencida:
            return format_html(
                '<span style="color: red; font-weight: bold;">✗ {} días</span>',
                obj.dias_vencidos
            )
        return format_html('<span style="color: green;">✓ Al día</span>')
    esta_vencida_badge.short_description = 'Vencimiento'


@admin.register(ConceptoPago)
class ConceptoPagoAdmin(admin.ModelAdmin):
    list_display = ['id', 'expensa', 'descripcion', 'monto_display', 'tipo', 'fecha_creacion']
    list_filter = ['tipo', 'fecha_creacion']
    search_fields = ['descripcion', 'expensa__periodo', 'expensa__unidad__codigo']
    readonly_fields = ['fecha_creacion']
    ordering = ['-fecha_creacion']
    
    def monto_display(self, obj):
        return f"Bs. {obj.monto}"
    monto_display.short_description = 'Monto'


@admin.register(Pago)
class PagoAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'expensa', 'monto_display', 'metodo_pago',
        'numero_comprobante', 'fecha_pago', 'registrado_por'
    ]
    list_filter = ['metodo_pago', 'fecha_pago']
    search_fields = [
        'numero_comprobante',
        'expensa__periodo',
        'expensa__unidad__codigo',
        'registrado_por__username'
    ]
    readonly_fields = ['fecha_creacion', 'registrado_por']
    date_hierarchy = 'fecha_pago'
    ordering = ['-fecha_pago']
    
    def monto_display(self, obj):
        return f"Bs. {obj.monto}"
    monto_display.short_description = 'Monto'
    
    def save_model(self, request, obj, form, change):
        if not change:  # Solo en creación
            obj.registrado_por = request.user
        super().save_model(request, obj, form, change)

