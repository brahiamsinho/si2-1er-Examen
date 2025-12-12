from django.db import models
from django.core.validators import MinValueValidator
from django.utils import timezone
from decimal import Decimal
from residentes.models import Residente
from unidades.models import UnidadHabitacional


class MultaManager(models.Manager):
    """Manager personalizado para Multa"""
    
    def pendientes(self):
        """Retorna multas pendientes de pago"""
        return self.filter(estado='pendiente')
    
    def vencidas(self):
        """Retorna multas pendientes que ya vencieron"""
        hoy = timezone.now().date()
        return self.filter(
            estado='pendiente',
            fecha_vencimiento__lt=hoy
        )
    
    def del_mes(self, año=None, mes=None):
        """Retorna multas de un mes específico"""
        if not año or not mes:
            hoy = timezone.now()
            año = hoy.year
            mes = hoy.month
        return self.filter(
            fecha_emision__year=año,
            fecha_emision__month=mes
        )


class Multa(models.Model):
    """
    Modelo para gestionar multas/sanciones a residentes.
    Incluye tipos de infracción, montos, estados y fechas.
    """
    
    TIPO_CHOICES = [
        ('ruido', 'Ruido excesivo'),
        ('estacionamiento', 'Estacionamiento indebido'),
        ('area_comun', 'Mal uso de área común'),
        ('pago_atrasado', 'Pago de expensa atrasado'),
        ('dano_propiedad', 'Daño a propiedad común'),
        ('incumplimiento', 'Incumplimiento de reglamento'),
        ('otro', 'Otro'),
    ]
    
    ESTADO_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('pagado', 'Pagado'),
        ('cancelado', 'Cancelado'),
        ('en_disputa', 'En disputa'),
    ]
    
    # Información básica
    tipo = models.CharField(
        max_length=20,
        choices=TIPO_CHOICES,
        help_text='Tipo de infracción'
    )
    descripcion = models.TextField(
        help_text='Descripción detallada de la infracción'
    )
    monto = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('50.00'))],
        help_text='Monto de la multa (mínimo Bs. 50)'
    )
    
    # Relaciones
    residente = models.ForeignKey(
        Residente,
        on_delete=models.CASCADE,
        related_name='multas',
        help_text='Residente responsable'
    )
    unidad = models.ForeignKey(
        UnidadHabitacional,
        on_delete=models.SET_NULL,
        null=True,
        related_name='multas',
        help_text='Unidad habitacional asociada'
    )
    
    # Estado y fechas
    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        default='pendiente'
    )
    fecha_emision = models.DateField(
        auto_now_add=True,
        help_text='Fecha de emisión de la multa'
    )
    fecha_vencimiento = models.DateField(
        help_text='Fecha límite de pago'
    )
    fecha_pago = models.DateField(
        null=True,
        blank=True,
        help_text='Fecha en que se pagó la multa'
    )
    
    # Recargos por mora
    recargo_mora = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00'),
        help_text='Recargo adicional por mora'
    )
    
    # Observaciones
    observaciones = models.TextField(
        blank=True,
        help_text='Notas u observaciones adicionales'
    )
    
    # Auditoría
    creado_por = models.CharField(
        max_length=100,
        blank=True,
        help_text='Usuario que creó la multa'
    )
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    
    # Manager personalizado
    objects = MultaManager()
    
    class Meta:
        db_table = 'multas'
        verbose_name = 'Multa'
        verbose_name_plural = 'Multas'
        ordering = ['-fecha_emision', '-id']
        indexes = [
            models.Index(fields=['estado', 'fecha_vencimiento']),
            models.Index(fields=['residente', 'estado']),
            models.Index(fields=['tipo']),
        ]
    
    def __str__(self):
        return f"Multa {self.get_tipo_display()} - {self.residente_nombre} - Bs. {self.monto_total}"
    
    def save(self, *args, **kwargs):
        """Override save para setear fecha de vencimiento y unidad automáticamente"""
        # Si no tiene fecha de vencimiento, setear 30 días después de emisión
        if not self.fecha_vencimiento:
            if self.fecha_emision:
                from datetime import timedelta
                self.fecha_vencimiento = self.fecha_emision + timedelta(days=30)
            else:
                from datetime import timedelta
                self.fecha_vencimiento = timezone.now().date() + timedelta(days=30)
        
        # Si no tiene unidad asignada, obtenerla del residente
        if not self.unidad_id and self.residente_id:
            self.unidad = self.residente.get_unidad()
        
        # Calcular recargo por mora automáticamente
        if self.estado == 'pendiente' and self.esta_vencida:
            self.calcular_recargo_mora()
        
        super().save(*args, **kwargs)
    
    @property
    def residente_nombre(self):
        """Nombre completo del residente"""
        if not self.residente:
            return 'N/A'
        if hasattr(self.residente, 'usuario') and self.residente.usuario:
            return self.residente.usuario.get_full_name()
        return str(self.residente)
    
    @property
    def unidad_nombre(self):
        """Nombre de la unidad habitacional"""
        return self.unidad.numero if self.unidad else 'N/A'
    
    @property
    def esta_vencida(self):
        """Verifica si la multa está vencida"""
        if self.estado != 'pendiente':
            return False
        return timezone.now().date() > self.fecha_vencimiento
    
    @property
    def dias_vencimiento(self):
        """Días restantes para vencimiento (negativos si ya venció)"""
        if self.estado != 'pendiente':
            return 0
        delta = self.fecha_vencimiento - timezone.now().date()
        return delta.days
    
    @property
    def monto_total(self):
        """Monto total incluyendo recargo por mora"""
        return self.monto + self.recargo_mora
    
    def calcular_recargo_mora(self):
        """Calcula el recargo por mora basado en días de atraso"""
        if not self.esta_vencida:
            self.recargo_mora = Decimal('0.00')
            return
        
        dias_atraso = abs(self.dias_vencimiento)
        # 2% del monto original por cada día de atraso (máximo 50%)
        porcentaje_recargo = min(dias_atraso * 2, 50)
        self.recargo_mora = (self.monto * Decimal(str(porcentaje_recargo))) / Decimal('100')
    
    def marcar_como_pagado(self):
        """Marca la multa como pagada"""
        if self.estado == 'pendiente':
            self.estado = 'pagado'
            self.fecha_pago = timezone.now().date()
            self.save(update_fields=['estado', 'fecha_pago', 'fecha_actualizacion'])
    
    def cancelar(self, motivo=''):
        """Cancela la multa"""
        if self.estado == 'pendiente':
            self.estado = 'cancelado'
            if motivo:
                self.observaciones = f"{self.observaciones}\n[Cancelado] {motivo}"
            self.save(update_fields=['estado', 'observaciones', 'fecha_actualizacion'])
