"""
Tests para el módulo de mantenimiento.
"""
from django.test import TestCase
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal

from .models import TareaMantenimiento, RegistroMantenimiento, MaterialInsumo
from personal.models import Personal
from users.models import User


class TareaMantenimientoTestCase(TestCase):
    """Tests para el modelo TareaMantenimiento"""
    
    def setUp(self):
        """Configuración inicial para los tests"""
        self.usuario = User.objects.create_user(
            username='admin_test',
            password='test123'
        )
        
        self.personal = Personal.objects.create(
            nombre='Juan',
            apellido_paterno='Pérez',
            apellido_materno='García',
            tipo='mantenimiento',
            estado='activo'
        )
        
        self.tarea = TareaMantenimiento.objects.create(
            titulo='Reparar ascensor',
            descripcion='El ascensor 2 no funciona correctamente',
            tipo='correctivo',
            prioridad='alta',
            fecha_limite=timezone.now().date() + timedelta(days=7),
            presupuesto_estimado=Decimal('1500.00'),
            creado_por=self.usuario
        )
    
    def test_crear_tarea(self):
        """Test: Crear una tarea de mantenimiento"""
        self.assertEqual(self.tarea.titulo, 'Reparar ascensor')
        self.assertEqual(self.tarea.estado, 'pendiente')
        self.assertFalse(self.tarea.esta_vencida)
    
    def test_asignar_tarea(self):
        """Test: Asignar tarea a personal"""
        resultado = self.tarea.asignar_a(self.personal, self.usuario)
        self.assertTrue(resultado)
        self.assertEqual(self.tarea.personal_asignado, self.personal)
        self.assertEqual(self.tarea.estado, 'asignada')
        self.assertIsNotNone(self.tarea.fecha_asignacion)
    
    def test_iniciar_tarea(self):
        """Test: Iniciar trabajo en una tarea"""
        self.tarea.asignar_a(self.personal)
        resultado = self.tarea.iniciar_trabajo()
        self.assertTrue(resultado)
        self.assertEqual(self.tarea.estado, 'en_progreso')
        self.assertIsNotNone(self.tarea.fecha_inicio)
    
    def test_completar_tarea(self):
        """Test: Completar una tarea"""
        self.tarea.asignar_a(self.personal)
        self.tarea.iniciar_trabajo()
        
        costo_real = Decimal('1800.00')
        resultado = self.tarea.completar(costo_real=costo_real)
        
        self.assertTrue(resultado)
        self.assertEqual(self.tarea.estado, 'completada')
        self.assertEqual(self.tarea.costo_real, costo_real)
        self.assertIsNotNone(self.tarea.fecha_completado)
    
    def test_cancelar_tarea(self):
        """Test: Cancelar una tarea"""
        resultado = self.tarea.cancelar(motivo='No es necesaria')
        self.assertTrue(resultado)
        self.assertEqual(self.tarea.estado, 'cancelada')
        self.assertIn('CANCELADA', self.tarea.observaciones)
    
    def test_tarea_vencida(self):
        """Test: Verificar si una tarea está vencida"""
        # Crear tarea vencida
        tarea_vencida = TareaMantenimiento.objects.create(
            titulo='Tarea vencida',
            descripcion='Test',
            tipo='preventivo',
            fecha_limite=timezone.now().date() - timedelta(days=1),
            creado_por=self.usuario
        )
        self.assertTrue(tarea_vencida.esta_vencida)
    
    def test_desviacion_presupuesto(self):
        """Test: Calcular desviación de presupuesto"""
        self.tarea.costo_real = Decimal('1800.00')
        self.tarea.save()
        
        desviacion = self.tarea.desviacion_presupuesto
        self.assertEqual(desviacion, Decimal('300.00'))
        self.assertEqual(self.tarea.porcentaje_desviacion, 20.0)
