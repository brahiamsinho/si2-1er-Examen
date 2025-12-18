"""
Signals para el módulo de mantenimiento.
Crea notificaciones automáticas cuando se asignan o completan tareas.
"""
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from .models import TareaMantenimiento, RegistroMantenimiento
from notificaciones.models import Notificacion


@receiver(post_save, sender=TareaMantenimiento)
def notificar_asignacion_tarea(sender, instance, created, **kwargs):
    """
    Crea notificación cuando se asigna una tarea a personal.
    """
    # Solo notificar si la tarea tiene personal asignado
    if not instance.personal_asignado:
        return
    
    # Verificar si el personal tiene usuario asociado
    if not instance.personal_asignado.usuario:
        return
    
    # Si la tarea acaba de ser creada y tiene personal asignado
    if created and instance.personal_asignado:
        Notificacion.objects.create(
            usuario=instance.personal_asignado.usuario,
            tipo='tarea_asignada',
            titulo='Nueva tarea de mantenimiento asignada',
            mensaje=f'Se te ha asignado la tarea: {instance.titulo}. Prioridad: {instance.get_prioridad_display()}. Fecha límite: {instance.fecha_limite.strftime("%d/%m/%Y")}',
            link=f'/admin/mantenimiento/{instance.id}',
        )


@receiver(pre_save, sender=TareaMantenimiento)
def notificar_cambios_tarea(sender, instance, **kwargs):
    """
    Notifica al personal cuando cambia el estado de su tarea.
    """
    # Si la tarea es nueva, no hacer nada (se maneja en post_save)
    if not instance.pk:
        return
    
    # Obtener el estado anterior
    try:
        tarea_anterior = TareaMantenimiento.objects.get(pk=instance.pk)
    except TareaMantenimiento.DoesNotExist:
        return
    
    # Si cambió el personal asignado (reasignación)
    if (tarea_anterior.personal_asignado != instance.personal_asignado and 
        instance.personal_asignado and 
        instance.personal_asignado.usuario):
        
        Notificacion.objects.create(
            usuario=instance.personal_asignado.usuario,
            tipo='tarea_reasignada',
            titulo='Tarea reasignada a ti',
            mensaje=f'Se te ha reasignado la tarea: {instance.titulo}. Fecha límite: {instance.fecha_limite.strftime("%d/%m/%Y")}',
            link=f'/admin/mantenimiento/{instance.id}',
        )
    
    # Si la tarea se completó
    if (tarea_anterior.estado != 'completada' and 
        instance.estado == 'completada' and 
        instance.creado_por):
        
        Notificacion.objects.create(
            usuario=instance.creado_por,
            tipo='tarea_completada',
            titulo='Tarea de mantenimiento completada',
            mensaje=f'La tarea "{instance.titulo}" ha sido completada por {instance.personal_asignado.nombre_completo if instance.personal_asignado else "el sistema"}.',
            link=f'/admin/mantenimiento/{instance.id}',
        )
    
    # Si la tarea se canceló
    if (tarea_anterior.estado != 'cancelada' and 
        instance.estado == 'cancelada'):
        
        # Notificar al personal asignado (si existe)
        if instance.personal_asignado and instance.personal_asignado.usuario:
            Notificacion.objects.create(
                usuario=instance.personal_asignado.usuario,
                tipo='tarea_cancelada',
                titulo='Tarea cancelada',
                mensaje=f'La tarea "{instance.titulo}" ha sido cancelada.',
                link=f'/admin/mantenimiento/{instance.id}',
            )
        
        # Notificar al creador
        if instance.creado_por:
            Notificacion.objects.create(
                usuario=instance.creado_por,
                tipo='tarea_cancelada',
                titulo='Tarea de mantenimiento cancelada',
                mensaje=f'La tarea "{instance.titulo}" ha sido cancelada.',
                link=f'/admin/mantenimiento/{instance.id}',
            )
