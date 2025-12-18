from django.db import models
from django.core.validators import RegexValidator
from residentes.models import Residente
from unidades.models import UnidadHabitacional


class VehiculoManager(models.Manager):
    """Manager personalizado para Vehículo"""
    
    def activos(self):
        """Retorna solo vehículos activos"""
        return self.filter(estado='activo')
    
    def autorizados(self):
        """Retorna vehículos con autorización vigente"""
        from django.utils import timezone
        hoy = timezone.now().date()
        return self.filter(
            estado='activo',
            fecha_autorizacion_desde__lte=hoy,
            fecha_autorizacion_hasta__gte=hoy
        )


class Vehiculo(models.Model):
    """
    Modelo para vehículos autorizados del condominio.
    Un residente puede tener múltiples vehículos.
    """
    
    TIPO_CHOICES = [
        ('auto', 'Automóvil'),
        ('moto', 'Motocicleta'),
        ('camioneta', 'Camioneta'),
        ('suv', 'SUV'),
        ('otro', 'Otro'),
    ]
    
    ESTADO_CHOICES = [
        ('activo', 'Activo'),
        ('inactivo', 'Inactivo'),
        ('suspendido', 'Suspendido'),
    ]
    
    # Validador de placa boliviana (formato: 1234ABC o 1234-ABC)
    placa_validator = RegexValidator(
        regex=r'^\d{4}[-\s]?[A-Z]{3}$',
        message='Formato de placa inválido. Use: 1234ABC o 1234-ABC (ej: 1852PHD)',
        flags=0
    )
    
    # Información del vehículo
    placa = models.CharField(
        max_length=10,
        unique=True,
        validators=[placa_validator],
        help_text='Placa del vehículo (formato boliviano: 1852PHD)'
    )
    tipo = models.CharField(
        max_length=20,
        choices=TIPO_CHOICES,
        default='auto'
    )
    marca = models.CharField(max_length=50)
    modelo = models.CharField(max_length=50)
    color = models.CharField(max_length=30)
    año = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        help_text='Año del vehículo'
    )
    
    # Relación con residente y unidad
    residente = models.ForeignKey(
        Residente,
        on_delete=models.CASCADE,
        related_name='vehiculos',
        help_text='Residente propietario del vehículo'
    )
    unidad = models.ForeignKey(
        UnidadHabitacional,
        on_delete=models.SET_NULL,
        null=True,
        related_name='vehiculos',
        help_text='Unidad habitacional asociada'
    )
    
    # Estado y autorización
    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        default='activo'
    )
    fecha_registro = models.DateTimeField(auto_now_add=True)
    fecha_autorizacion = models.DateField(
        auto_now_add=True,
        help_text='Fecha en que se autorizó el vehículo'
    )
    fecha_vencimiento = models.DateField(
        null=True,
        blank=True,
        help_text='Fecha de vencimiento de autorización (opcional)'
    )
    
    # Información adicional
    observaciones = models.TextField(blank=True)
    foto_vehiculo = models.ImageField(
        upload_to='vehiculos/',
        null=True,
        blank=True,
        help_text='Foto del vehículo o placa'
    )
    
    # Auditoría
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    
    # Manager personalizado
    objects = VehiculoManager()
    
    class Meta:
        db_table = 'vehiculos'
        verbose_name = 'Vehículo'
        verbose_name_plural = 'Vehículos'
        ordering = ['-fecha_registro']
        indexes = [
            models.Index(fields=['placa']),
            models.Index(fields=['estado']),
            models.Index(fields=['residente']),
        ]
    
    def __str__(self):
        return f"{self.placa} - {self.marca} {self.modelo} ({self.residente})"
    
    def save(self, *args, **kwargs):
        # Normalizar placa: mayúsculas y sin espacios
        if self.placa:
            self.placa = self.placa.upper().strip().replace(' ', '')
        
        # Asignar unidad desde residente si no está definida
        if not self.unidad and self.residente:
            self.unidad = self.residente.get_unidad()
        
        super().save(*args, **kwargs)
    
    @property
    def esta_activo(self):
        """Verifica si el vehículo está activo y autorizado"""
        if self.estado != 'activo':
            return False
        
        if self.fecha_vencimiento:
            from django.utils import timezone
            return self.fecha_vencimiento >= timezone.now().date()
        
        return True
    
    @property
    def residente_nombre(self):
        """Nombre completo del residente"""
        if not self.residente:
            return 'N/A'
        if hasattr(self.residente, 'usuario') and self.residente.usuario:
            return self.residente.usuario.get_full_name()
        return str(self.residente)
