from django.db import models
from django.core.validators import MinValueValidator
from django.utils import timezone
from decimal import Decimal
from unidades.models import UnidadHabitacional


class Expensa(models.Model):
    """Modelo para expensas mensuales por unidad habitacional"""
    
    ESTADO_PENDIENTE = 'pendiente'
    ESTADO_PAGADO_PARCIAL = 'pagado_parcial'
    ESTADO_PAGADO = 'pagado'
    ESTADO_VENCIDO = 'vencido'
    
    ESTADOS_CHOICES = [
        (ESTADO_PENDIENTE, 'Pendiente'),
        (ESTADO_PAGADO_PARCIAL, 'Pago Parcial'),
        (ESTADO_PAGADO, 'Pagado'),
        (ESTADO_VENCIDO, 'Vencido'),
    ]
    
    # Relación con unidad
    unidad = models.ForeignKey(
        UnidadHabitacional,
        on_delete=models.CASCADE,
        related_name='expensas',
        verbose_name='Unidad Habitacional'
    )
    
    # Período de la expensa
    periodo = models.CharField(
        max_length=7,
        verbose_name='Período',
        help_text='Formato: YYYY-MM (ej: 2024-01)'
    )
    
    # Montos
    monto_base = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name='Monto Base'
    )
    
    monto_adicional = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name='Monto Adicional',
        help_text='Multas, servicios extra, etc.'
    )
    
    monto_total = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name='Monto Total'
    )
    
    monto_pagado = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name='Monto Pagado'
    )
    
    # Estado
    estado = models.CharField(
        max_length=20,
        choices=ESTADOS_CHOICES,
        default=ESTADO_PENDIENTE,
        verbose_name='Estado'
    )
    
    # Fechas
    fecha_emision = models.DateField(
        verbose_name='Fecha de Emisión'
    )
    
    fecha_vencimiento = models.DateField(
        verbose_name='Fecha de Vencimiento'
    )
    
    # Control
    fecha_creacion = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de Creación'
    )
    
    fecha_actualizacion = models.DateTimeField(
        auto_now=True,
        verbose_name='Fecha de Actualización'
    )
    
    class Meta:
        verbose_name = 'Expensa'
        verbose_name_plural = 'Expensas'
        ordering = ['-fecha_emision', '-periodo']
        unique_together = ['unidad', 'periodo']
        indexes = [
            models.Index(fields=['periodo']),
            models.Index(fields=['estado']),
            models.Index(fields=['fecha_vencimiento']),
        ]
    
    def __str__(self):
        return f"Expensa {self.periodo} - {self.unidad.codigo}"
    
    def save(self, *args, **kwargs):
        """Calcular monto total y actualizar estado"""
        # Calcular monto total
        self.monto_total = self.monto_base + self.monto_adicional
        
        # Actualizar estado basado en pagos
        if self.monto_pagado >= self.monto_total:
            self.estado = self.ESTADO_PAGADO
        elif self.monto_pagado > 0:
            self.estado = self.ESTADO_PAGADO_PARCIAL
        elif timezone.now().date() > self.fecha_vencimiento:
            self.estado = self.ESTADO_VENCIDO
        else:
            self.estado = self.ESTADO_PENDIENTE
            
        super().save(*args, **kwargs)
    
    @property
    def saldo_pendiente(self):
        """Retorna el saldo pendiente de pago"""
        return self.monto_total - self.monto_pagado
    
    @property
    def esta_vencida(self):
        """Verifica si la expensa está vencida"""
        return timezone.now().date() > self.fecha_vencimiento and self.estado != self.ESTADO_PAGADO
    
    @property
    def dias_vencidos(self):
        """Retorna los días de atraso"""
        if not self.esta_vencida:
            return 0
        return (timezone.now().date() - self.fecha_vencimiento).days


class ConceptoPago(models.Model):
    """Modelo para desglose de conceptos de una expensa"""
    
    expensa = models.ForeignKey(
        Expensa,
        on_delete=models.CASCADE,
        related_name='conceptos',
        verbose_name='Expensa'
    )
    
    descripcion = models.CharField(
        max_length=200,
        verbose_name='Descripción'
    )
    
    monto = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name='Monto'
    )
    
    tipo = models.CharField(
        max_length=50,
        verbose_name='Tipo',
        help_text='mantenimiento, agua, luz, multa, etc.'
    )
    
    fecha_creacion = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de Creación'
    )
    
    class Meta:
        verbose_name = 'Concepto de Pago'
        verbose_name_plural = 'Conceptos de Pago'
        ordering = ['tipo', 'descripcion']
    
    def __str__(self):
        return f"{self.descripcion} - Bs. {self.monto}"


class Pago(models.Model):
    """Modelo para registro de pagos realizados"""
    
    METODO_EFECTIVO = 'efectivo'
    METODO_TRANSFERENCIA = 'transferencia'
    METODO_QR = 'qr'
    METODO_TARJETA = 'tarjeta'
    
    METODOS_CHOICES = [
        (METODO_EFECTIVO, 'Efectivo'),
        (METODO_TRANSFERENCIA, 'Transferencia Bancaria'),
        (METODO_QR, 'QR'),
        (METODO_TARJETA, 'Tarjeta'),
    ]
    
    expensa = models.ForeignKey(
        Expensa,
        on_delete=models.CASCADE,
        related_name='pagos',
        verbose_name='Expensa'
    )
    
    monto = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        verbose_name='Monto Pagado'
    )
    
    metodo_pago = models.CharField(
        max_length=20,
        choices=METODOS_CHOICES,
        verbose_name='Método de Pago'
    )
    
    numero_comprobante = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name='Número de Comprobante',
        help_text='Número de referencia, transacción, etc.'
    )
    
    fecha_pago = models.DateTimeField(
        default=timezone.now,
        verbose_name='Fecha de Pago'
    )
    
    observaciones = models.TextField(
        blank=True,
        null=True,
        verbose_name='Observaciones'
    )
    
    # Control
    registrado_por = models.ForeignKey(
        'users.CustomUser',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='pagos_registrados',
        verbose_name='Registrado por'
    )
    
    fecha_creacion = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de Registro'
    )
    
    class Meta:
        verbose_name = 'Pago'
        verbose_name_plural = 'Pagos'
        ordering = ['-fecha_pago']
        indexes = [
            models.Index(fields=['fecha_pago']),
            models.Index(fields=['metodo_pago']),
        ]
    
    def __str__(self):
        return f"Pago Bs. {self.monto} - {self.get_metodo_pago_display()}"
    
    def save(self, *args, **kwargs):
        """Actualizar el monto pagado en la expensa"""
        super().save(*args, **kwargs)
        
        # Actualizar monto pagado en la expensa
        expensa = self.expensa
        total_pagado = expensa.pagos.aggregate(
            total=models.Sum('monto')
        )['total'] or Decimal('0.00')
        
        expensa.monto_pagado = total_pagado
        expensa.save()
