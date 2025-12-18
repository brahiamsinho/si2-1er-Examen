from django.db import models
from django.contrib.auth import get_user_model
import os

User = get_user_model()


def residente_foto_path(instance, filename):
    """Genera el path para guardar la foto del residente"""
    ext = filename.split('.')[-1]
    return f'rostros/{instance.ci}/perfil.{ext}'


class Residente(models.Model):
    """Modelo para residentes del condominio"""
    
    ESTADOS_CHOICES = [
        ('activo', 'Activo'),
        ('inactivo', 'Inactivo'),
        ('suspendido', 'Suspendido'),
        ('en_proceso', 'En Proceso de Aprobación'),
    ]
    
    TIPO_CHOICES = [
        ('propietario', 'Propietario'),
        ('inquilino', 'Inquilino'),
    ]
    
    # Datos personales básicos (obligatorios)
    nombre = models.CharField(
        max_length=100,
        verbose_name="Nombre",
        default=""
    )
    
    apellido = models.CharField(
        max_length=100,
        verbose_name="Apellido",
        default=""
    )
    
    ci = models.CharField(
        max_length=20,
        unique=True,
        verbose_name="Cédula de Identidad",
        default=""
    )
    
    email = models.EmailField(
        unique=True,
        verbose_name="Correo Electrónico",
        default=""
    )
    
    telefono = models.CharField(
        max_length=20,
        verbose_name="Teléfono",
        default=""
    )
    
    # Campo para unidad habitacional (ahora usa directamente el código)
    unidad_habitacional = models.CharField(
        max_length=10,
        verbose_name="Código de Unidad Habitacional",
        null=True,
        blank=True,
        help_text="Código de la unidad (ej: A-101, B-202)"
    )
    
    tipo = models.CharField(
        max_length=20,
        choices=TIPO_CHOICES,
        verbose_name="Tipo"
    )
    
    fecha_ingreso = models.DateField(
        verbose_name="Fecha de Ingreso"
    )
    
    estado = models.CharField(
        max_length=20,
        choices=ESTADOS_CHOICES,
        default='en_proceso',
        verbose_name="Estado"
    )
    
    # Foto de perfil para reconocimiento facial
    foto_perfil = models.ImageField(
        upload_to=residente_foto_path,
        verbose_name="Foto de Perfil",
        null=True,
        blank=True,
        help_text="Foto del residente para reconocimiento facial (formato JPG/PNG)"
    )
    
    # Relación con el usuario (opcional)
    usuario = models.OneToOneField(
        'users.CustomUser', 
        on_delete=models.SET_NULL,
        related_name='residente_profile',
        verbose_name="Usuario",
        null=True,
        blank=True
    )
    
    # Campos de control
    fecha_creacion = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Fecha de Creación"
    )
    
    fecha_actualizacion = models.DateTimeField(
        auto_now=True,
        verbose_name="Fecha de Actualización"
    )
    
    class Meta:
        verbose_name = "Residente"
        verbose_name_plural = "Residentes"
        ordering = ['-fecha_creacion']
        indexes = [
            models.Index(fields=['unidad_habitacional']),
            models.Index(fields=['fecha_ingreso']),
            models.Index(fields=['tipo']),
        ]
    
    def __str__(self):
        return f"{self.get_full_name()} - {self.unidad_habitacional or 'Sin unidad'}"
    
    def get_full_name(self):
        """Retorna el nombre completo del residente"""
        return f"{self.nombre} {self.apellido}".strip()
    
    @property
    def nombre_completo(self):
        """Retorna el nombre completo del residente"""
        return self.get_full_name()
    
    @property
    def estado_usuario(self):
        """Estado del usuario (activo/inactivo)"""
        if self.usuario:
            return 'activo' if self.usuario.is_active else 'inactivo'
        return 'sin_usuario'
    
    def cambiar_estado(self, nuevo_estado):
        """Cambia el estado del residente"""
        if nuevo_estado in [choice[0] for choice in self.ESTADOS_CHOICES]:
            self.estado = nuevo_estado
            self.save(update_fields=['estado', 'fecha_actualizacion'])
            return True
        return False
    
    def puede_acceder(self):
        """
        Verifica si el residente puede acceder al condominio.
        
        Lógica:
        - Si tiene usuario vinculado: debe estar activo (usuario.is_active) y estado='activo'
        - Si NO tiene usuario: solo verifica estado='activo'
        """
        if self.usuario:
            # Residente con cuenta de usuario: ambas condiciones
            return self.usuario.is_active and self.estado == 'activo'
        else:
            # Residente sin cuenta de usuario: solo estado del residente
            return self.estado == 'activo'
        
    def get_unidad(self):
        """
        Retorna el objeto UnidadHabitacional relacionado, o None si no hay código de unidad.
        """
        if not self.unidad_habitacional:
            return None
            
        # Importamos aquí para evitar importaciones circulares
        from unidades.models import UnidadHabitacional
        return UnidadHabitacional.find_by_code(self.unidad_habitacional)