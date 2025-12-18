"""
Seeder para datos de prueba del módulo de mantenimiento.
"""
from decimal import Decimal
from django.utils import timezone
from datetime import timedelta
import random

from seeders.base_seeder import BaseSeeder
from mantenimiento.models import TareaMantenimiento, MaterialInsumo, RegistroMantenimiento
from personal.models import Personal
from areas_comunes.models import AreaComun
from django.contrib.auth import get_user_model

User = get_user_model()


class MantenimientoSeeder(BaseSeeder):
    """Seeder para tareas de mantenimiento"""
    
    @classmethod
    def should_run(cls):
        """Ejecutar si no hay tareas de mantenimiento"""
        return TareaMantenimiento.objects.count() == 0
    
    @classmethod
    def run(cls):
        """Crear tareas de mantenimiento de prueba"""
        print("📋 Creando tareas de mantenimiento...")
        
        # Obtener usuarios y personal necesarios
        try:
            admin = User.objects.filter(is_superuser=True).first()
            if not admin:
                admin = User.objects.first()
            
            # Obtener personal activo disponible
            personal_mantenimiento = list(Personal.objects.filter(estado=True))
            
            if not personal_mantenimiento:
                print("❌ No hay personal disponible. Crear personal primero.")
                return
            
            areas_comunes = list(AreaComun.objects.all())
            
        except Exception as e:
            print(f"❌ Error obteniendo datos necesarios: {e}")
            return
        
        # Definir tareas de ejemplo
        tareas_ejemplo = [
            {
                'titulo': 'Mantenimiento preventivo de ascensor',
                'descripcion': 'Revisión trimestral del sistema de ascensores. Incluye lubricación, ajuste de cables y verificación de sistemas de seguridad.',
                'tipo': 'preventivo',
                'prioridad': 'media',
                'presupuesto_estimado': Decimal('800.00'),
                'ubicacion': 'Ascensor Torre A',
                'dias_limite': 15,
            },
            {
                'titulo': 'Reparación de bomba de agua',
                'descripcion': 'La bomba principal del tanque de agua presenta fallas. Se requiere revisión urgente y posible reemplazo de componentes.',
                'tipo': 'correctivo',
                'prioridad': 'alta',
                'presupuesto_estimado': Decimal('1500.00'),
                'ubicacion': 'Cuarto de máquinas - Piso -1',
                'dias_limite': 5,
            },
            {
                'titulo': 'Limpieza profunda de piscina',
                'descripcion': 'Limpieza completa de piscina incluyendo desinfección, limpieza de filtros y revisión de sistema de cloración automática.',
                'tipo': 'limpieza',
                'prioridad': 'media',
                'presupuesto_estimado': Decimal('600.00'),
                'ubicacion': 'Área de piscinas',
                'dias_limite': 10,
            },
            {
                'titulo': 'Instalación de cámaras de seguridad',
                'descripcion': 'Instalación de 4 nuevas cámaras de seguridad en puntos ciegos identificados. Incluye cableado y configuración del sistema.',
                'tipo': 'instalacion',
                'prioridad': 'alta',
                'presupuesto_estimado': Decimal('2500.00'),
                'ubicacion': 'Perímetro del condominio',
                'dias_limite': 20,
            },
            {
                'titulo': 'Fuga de agua en estacionamiento',
                'descripcion': 'Se detectó fuga de agua en tubería del estacionamiento subterráneo. Requiere atención inmediata para evitar daños mayores.',
                'tipo': 'emergencia',
                'prioridad': 'critica',
                'presupuesto_estimado': Decimal('1200.00'),
                'ubicacion': 'Estacionamiento - Nivel -2',
                'dias_limite': 2,
            },
            {
                'titulo': 'Reparación de portón automático',
                'descripcion': 'El portón de acceso vehicular no abre correctamente. Se requiere revisión del motor y sensores.',
                'tipo': 'reparacion',
                'prioridad': 'alta',
                'presupuesto_estimado': Decimal('900.00'),
                'ubicacion': 'Acceso principal',
                'dias_limite': 7,
            },
            {
                'titulo': 'Mantenimiento de jardines',
                'descripcion': 'Poda de árboles y arbustos, control de plagas y fertilización de áreas verdes comunes.',
                'tipo': 'preventivo',
                'prioridad': 'baja',
                'presupuesto_estimado': Decimal('500.00'),
                'ubicacion': 'Jardines áreas comunes',
                'dias_limite': 30,
            },
            {
                'titulo': 'Revisión eléctrica del salón de eventos',
                'descripcion': 'Revisión general del sistema eléctrico del salón de eventos. Incluye verificación de tableros y toma corrientes.',
                'tipo': 'preventivo',
                'prioridad': 'media',
                'presupuesto_estimado': Decimal('700.00'),
                'ubicacion': 'Salón de eventos',
                'dias_limite': 14,
            },
            {
                'titulo': 'Pintura de áreas comunes',
                'descripcion': 'Repintado de paredes y techos del lobby principal y pasillos de planta baja.',
                'tipo': 'preventivo',
                'prioridad': 'baja',
                'presupuesto_estimado': Decimal('3000.00'),
                'ubicacion': 'Lobby y pasillos PB',
                'dias_limite': 45,
            },
            {
                'titulo': 'Reparación de luces en estacionamiento',
                'descripcion': 'Varias luminarias del estacionamiento no funcionan. Se requiere reemplazo de balastros y tubos fluorescentes.',
                'tipo': 'correctivo',
                'prioridad': 'media',
                'presupuesto_estimado': Decimal('400.00'),
                'ubicacion': 'Estacionamiento general',
                'dias_limite': 10,
            },
        ]
        
        tareas_creadas = []
        
        for i, tarea_data in enumerate(tareas_ejemplo):
            try:
                # Asignar personal aleatoriamente (algunos sin asignar)
                personal = random.choice(personal_mantenimiento) if random.random() > 0.2 else None
                
                # Buscar área común relacionada si existe
                area = None
                if areas_comunes and random.random() > 0.5:
                    area = random.choice(areas_comunes)
                
                # Calcular fecha límite
                fecha_limite = timezone.now().date() + timedelta(days=tarea_data['dias_limite'])
                
                # Crear tarea
                tarea = TareaMantenimiento.objects.create(
                    titulo=tarea_data['titulo'],
                    descripcion=tarea_data['descripcion'],
                    tipo=tarea_data['tipo'],
                    prioridad=tarea_data['prioridad'],
                    presupuesto_estimado=tarea_data['presupuesto_estimado'],
                    ubicacion_especifica=tarea_data['ubicacion'],
                    fecha_limite=fecha_limite,
                    creado_por=admin,
                    area_comun=area,
                )
                
                # Asignar personal si corresponde
                if personal:
                    tarea.personal_asignado = personal
                    tarea.fecha_asignacion = timezone.now()
                    tarea.estado = 'asignada'
                    
                    # Algunas tareas ya iniciadas
                    if random.random() > 0.6:
                        tarea.estado = 'en_progreso'
                        tarea.fecha_inicio = timezone.now() - timedelta(days=random.randint(1, 5))
                        
                        # Algunas tareas ya completadas
                        if random.random() > 0.7:
                            tarea.estado = 'completada'
                            tarea.fecha_completado = timezone.now() - timedelta(days=random.randint(1, 3))
                            # Costo real con variación del 80-120% del presupuesto
                            variacion = random.uniform(0.8, 1.2)
                            tarea.costo_real = tarea.presupuesto_estimado * Decimal(str(variacion))
                            tarea.observaciones = f"Trabajo completado satisfactoriamente. Duración: {random.randint(2, 8)} horas."
                
                tarea.save()
                tareas_creadas.append(tarea)
                
                # Crear registro inicial
                RegistroMantenimiento.objects.create(
                    tarea=tarea,
                    tipo_accion='creacion',
                    descripcion=f'Tarea creada: {tarea.titulo}',
                    realizado_por=admin
                )
                
                # Si la tarea está asignada, crear registro de asignación
                if tarea.personal_asignado:
                    RegistroMantenimiento.objects.create(
                        tarea=tarea,
                        tipo_accion='asignacion',
                        descripcion=f'Tarea asignada a {tarea.personal_asignado.nombre_completo}',
                        realizado_por=admin
                    )
                
                # Si está en progreso o completada, agregar materiales de ejemplo
                if tarea.estado in ['en_progreso', 'completada']:
                    # Agregar algunos materiales aleatorios
                    num_materiales = random.randint(1, 4)
                    materiales_ejemplo = [
                        ('Cable eléctrico 2x10', 'metros', Decimal('8.50')),
                        ('Tubo PVC 2 pulgadas', 'metros', Decimal('12.00')),
                        ('Cemento', 'bolsas', Decimal('45.00')),
                        ('Pintura blanca', 'litros', Decimal('35.00')),
                        ('Tornillos', 'unidades', Decimal('0.50')),
                        ('Lubricante industrial', 'litros', Decimal('25.00')),
                        ('Luminaria LED', 'unidades', Decimal('120.00')),
                        ('Filtro de agua', 'unidades', Decimal('180.00')),
                    ]
                    
                    for _ in range(num_materiales):
                        material_data = random.choice(materiales_ejemplo)
                        cantidad = Decimal(str(random.uniform(1, 10)))
                        
                        MaterialInsumo.objects.create(
                            tarea=tarea,
                            nombre=material_data[0],
                            cantidad=cantidad,
                            unidad=material_data[1],
                            costo_unitario=material_data[2],
                            proveedor=random.choice(['Ferretería Central', 'Distribuidora López', 'Casa del Constructor']),
                            fecha_uso=timezone.now().date() - timedelta(days=random.randint(0, 5))
                        )
                
                print(f"  ✅ {tarea.titulo} ({tarea.get_estado_display()})")
                
            except Exception as e:
                print(f"  ❌ Error creando tarea {tarea_data['titulo']}: {e}")
        
        print(f"\n✅ Creadas {len(tareas_creadas)} tareas de mantenimiento exitosamente")
        print(f"   - Pendientes: {TareaMantenimiento.objects.filter(estado='pendiente').count()}")
        print(f"   - Asignadas: {TareaMantenimiento.objects.filter(estado='asignada').count()}")
        print(f"   - En progreso: {TareaMantenimiento.objects.filter(estado='en_progreso').count()}")
        print(f"   - Completadas: {TareaMantenimiento.objects.filter(estado='completada').count()}")
