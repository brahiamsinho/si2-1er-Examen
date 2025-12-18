from django.db import models
from django.core.validators import MinValueValidator
from django.utils import timezone
from django.conf import settings
from decimal import Decimal
from personal.models import Personal
from areas_comunes.models import AreaComun


class TareaMantenimientoManager(models.Manager):
    """Manager personalizado para TareaMantenimiento"""
    
    def pendientes(self):
        """Retorna tareas pendientes"""
        return self.filter(estado='pendiente')
    
    def en_progreso(self):
        """Retorna tareas en progreso"""
        return self.filter(estado='en_progreso')
    
    def vencidas(self):
        """Retorna tareas pendientes que ya vencieron"""
        hoy = timezone.now().date()
        return self.filter(
            estado__in=['pendiente', 'en_progreso'],
            fecha_limite__lt=hoy
        )
    
    def del_mes(self, año=None, mes=None):
        """Retorna tareas de un mes específico"""
        if not año or not mes:
            hoy = timezone.now()
            año = hoy.year
            mes = hoy.month
        return self.filter(
            fecha_creacion__year=año,
            fecha_creacion__month=mes
        )
    
    def por_tipo(self, tipo):
        """Retorna tareas de un tipo específico"""
        return self.filter(tipo=tipo)


class TareaMantenimiento(models.Model):
    """
    Modelo para gestionar tareas de mantenimiento del condominio.
    Incluye tipos (preventivo/correctivo/emergencia), asignación a personal,
    seguimiento de estados y control de costos.
    """
    
    TIPO_CHOICES = [
        ('preventivo', 'Mantenimiento Preventivo'),
        ('correctivo', 'Mantenimiento Correctivo'),
        ('emergencia', 'Emergencia'),
        ('instalacion', 'Instalación'),
        ('reparacion', 'Reparación'),
        ('limpieza', 'Limpieza Especial'),
    ]
    
    ESTADO_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('asignada', 'Asignada'),
        ('en_progreso', 'En Progreso'),
        ('completada', 'Completada'),
        ('cancelada', 'Cancelada'),
    ]
    
    PRIORIDAD_CHOICES = [
        ('baja', 'Baja'),
        ('media', 'Media'),
        ('alta', 'Alta'),
        ('critica', 'Crítica'),
    ]
    
    # Información básica
    titulo = models.CharField(
        max_length=200,
        help_text='Título breve de la tarea'
    )
    descripcion = models.TextField(
        help_text='Descripción detallada del mantenimiento requerido'
    )
    tipo = models.CharField(
        max_length=20,
        choices=TIPO_CHOICES,
        help_text='Tipo de mantenimiento'
    )
    prioridad = models.CharField(
        max_length=10,
        choices=PRIORIDAD_CHOICES,
        default='media',
        help_text='Prioridad de la tarea'
    )
    estado = models.CharField(
        max_length=15,
        choices=ESTADO_CHOICES,
        default='pendiente',
        help_text='Estado actual de la tarea'
    )
    
    # Asignación
    personal_asignado = models.ForeignKey(
        Personal,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tareas_asignadas',
        help_text='Personal responsable de ejecutar la tarea'
    )
    fecha_asignacion = models.DateTimeField(
        null=True,
        blank=True,
        help_text='Fecha en que se asignó al personal'
    )
    
    # Ubicación (opcional)
    area_comun = models.ForeignKey(
        AreaComun,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tareas_mantenimiento',
        help_text='Área común donde se realizará el mantenimiento (opcional)'
    )
    ubicacion_especifica = models.CharField(
        max_length=200,
        blank=True,
        help_text='Ubicación específica (ej: "Ascensor 2", "Piscina - Bomba de agua")'
    )
    
    # Fechas
    fecha_creacion = models.DateTimeField(
        auto_now_add=True,
        help_text='Fecha de creación de la tarea'
    )
    fecha_limite = models.DateField(
        help_text='Fecha límite para completar la tarea'
    )
    fecha_inicio = models.DateTimeField(
        null=True,
        blank=True,
        help_text='Fecha en que se inició el trabajo'
    )
    fecha_completado = models.DateTimeField(
        null=True,
        blank=True,
        help_text='Fecha en que se completó la tarea'
    )
    
    # Costos
    presupuesto_estimado = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        default=Decimal('0.00'),
        help_text='Presupuesto estimado en Bs.'
    )
    costo_real = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        default=Decimal('0.00'),
        help_text='Costo real ejecutado en Bs.'
    )
    
    # Observaciones
    observaciones = models.TextField(
        blank=True,
        help_text='Observaciones adicionales o notas del trabajo realizado'
    )
    
    # Metadata
    creado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='tareas_creadas',
        help_text='Usuario que creó la tarea'
    )
    actualizado_en = models.DateTimeField(
        auto_now=True,
        help_text='Última actualización'
    )
    
    objects = TareaMantenimientoManager()
    
    class Meta:
        verbose_name = 'Tarea de Mantenimiento'
        verbose_name_plural = 'Tareas de Mantenimiento'
        ordering = ['-fecha_creacion']
        indexes = [
            models.Index(fields=['estado', 'prioridad']),
            models.Index(fields=['fecha_limite']),
            models.Index(fields=['personal_asignado', 'estado']),
        ]
    
    def __str__(self):
        return f"{self.get_tipo_display()} - {self.titulo} ({self.get_estado_display()})"
    
    @property
    def esta_vencida(self):
        """Verifica si la tarea está vencida"""
        if self.estado in ['completada', 'cancelada']:
            return False
        return timezone.now().date() > self.fecha_limite
    
    @property
    def dias_restantes(self):
        """Calcula días restantes hasta la fecha límite"""
        if self.estado in ['completada', 'cancelada']:
            return 0
        delta = self.fecha_limite - timezone.now().date()
        return delta.days
    
    @property
    def desviacion_presupuesto(self):
        """Calcula la desviación del presupuesto"""
        if self.presupuesto_estimado == 0:
            return 0
        return self.costo_real - self.presupuesto_estimado
    
    @property
    def porcentaje_desviacion(self):
        """Calcula el porcentaje de desviación del presupuesto"""
        if self.presupuesto_estimado == 0:
            return 0
        return (self.desviacion_presupuesto / self.presupuesto_estimado) * 100
    
    def asignar_a(self, personal, usuario=None):
        """Asigna la tarea a un personal específico"""
        self.personal_asignado = personal
        self.fecha_asignacion = timezone.now()
        if self.estado == 'pendiente':
            self.estado = 'asignada'
        self.save()
        return True
    
    def iniciar_trabajo(self):
        """Marca la tarea como en progreso"""
        if self.estado in ['pendiente', 'asignada']:
            self.estado = 'en_progreso'
            self.fecha_inicio = timezone.now()
            self.save()
            return True
        return False
    
    def completar(self, costo_real=None, observaciones=None):
        """Marca la tarea como completada"""
        self.estado = 'completada'
        self.fecha_completado = timezone.now()
        if costo_real is not None:
            self.costo_real = costo_real
        if observaciones:
            self.observaciones = observaciones
        self.save()
        return True
    
    def cancelar(self, motivo=None):
        """Cancela la tarea"""
        self.estado = 'cancelada'
        if motivo:
            self.observaciones = f"CANCELADA: {motivo}\n{self.observaciones}"
        self.save()
        return True


class RegistroMantenimiento(models.Model):
    """
    Modelo para registrar el historial de acciones y actualizaciones
    de una tarea de mantenimiento.
    """
    
    TIPO_ACCION_CHOICES = [
        ('creacion', 'Creación'),
        ('asignacion', 'Asignación'),
        ('inicio', 'Inicio de trabajo'),
        ('actualizacion', 'Actualización'),
        ('completado', 'Completado'),
        ('cancelacion', 'Cancelación'),
        ('comentario', 'Comentario'),
    ]
    
    tarea = models.ForeignKey(
        TareaMantenimiento,
        on_delete=models.CASCADE,
        related_name='registros',
        help_text='Tarea asociada'
    )
    tipo_accion = models.CharField(
        max_length=15,
        choices=TIPO_ACCION_CHOICES,
        help_text='Tipo de acción realizada'
    )
    descripcion = models.TextField(
        help_text='Descripción de la acción'
    )
    realizado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        help_text='Usuario que realizó la acción'
    )
    fecha = models.DateTimeField(
        auto_now_add=True,
        help_text='Fecha y hora de la acción'
    )
    
    # Campos opcionales para rastrear cambios
    estado_anterior = models.CharField(
        max_length=15,
        blank=True,
        help_text='Estado antes del cambio'
    )
    estado_nuevo = models.CharField(
        max_length=15,
        blank=True,
        help_text='Estado después del cambio'
    )
    
    class Meta:
        verbose_name = 'Registro de Mantenimiento'
        verbose_name_plural = 'Registros de Mantenimiento'
        ordering = ['-fecha']
    
    def __str__(self):
        return f"{self.get_tipo_accion_display()} - {self.tarea.titulo} ({self.fecha.strftime('%d/%m/%Y %H:%M')})"


class MaterialInsumo(models.Model):
    """
    Modelo para registrar materiales e insumos utilizados
    en las tareas de mantenimiento.
    """
    
    tarea = models.ForeignKey(
        TareaMantenimiento,
        on_delete=models.CASCADE,
        related_name='materiales',
        help_text='Tarea asociada'
    )
    nombre = models.CharField(
        max_length=200,
        help_text='Nombre del material o insumo'
    )
    descripcion = models.TextField(
        blank=True,
        help_text='Descripción del material'
    )
    cantidad = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        help_text='Cantidad utilizada'
    )
    unidad = models.CharField(
        max_length=50,
        help_text='Unidad de medida (ej: kg, m, litros, unidades)'
    )
    costo_unitario = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        help_text='Costo por unidad en Bs.'
    )
    proveedor = models.CharField(
        max_length=200,
        blank=True,
        help_text='Proveedor del material'
    )
    fecha_uso = models.DateField(
        default=timezone.now,
        help_text='Fecha de uso del material'
    )
    
    class Meta:
        verbose_name = 'Material/Insumo'
        verbose_name_plural = 'Materiales/Insumos'
        ordering = ['-fecha_uso']
    
    def __str__(self):
        return f"{self.nombre} - {self.cantidad} {self.unidad}"
    
    @property
    def costo_total(self):
        """Calcula el costo total del material"""
        return self.cantidad * self.costo_unitario
