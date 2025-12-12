"""
Seeder para generar multas de prueba.
"""
import random
from decimal import Decimal
from datetime import timedelta
from django.utils import timezone
from seeders.base_seeder import BaseSeeder
from multas.models import Multa
from residentes.models import Residente


class MultasSeeder(BaseSeeder):
    """Seeder para crear multas de prueba"""
    
    model = Multa
    dependencies = ['residente']  # Requiere residentes creados
    
    # Descripciones por tipo de multa
    DESCRIPCIONES = {
        'ruido': [
            'Música a alto volumen después de las 22:00 horas',
            'Fiesta con ruido excesivo en horario nocturno',
            'Gritos y discusiones en áreas comunes',
            'Ruido de obras sin autorización en horario prohibido',
            'Mascota ladrando excesivamente durante la noche',
        ],
        'estacionamiento': [
            'Vehículo estacionado en espacio asignado a otro residente',
            'Estacionamiento en zona de acceso/emergencia',
            'Vehículo bloqueando entrada/salida del edificio',
            'Ocupación de dos espacios de estacionamiento',
            'Estacionamiento en zona verde',
        ],
        'area_comun': [
            'Daño al mobiliario del salón de eventos',
            'Uso de área común sin reserva previa',
            'Dejar basura en área de piscina',
            'No limpiar área común después de uso',
            'Uso indebido de gimnasio (equipos dañados)',
        ],
        'pago_atrasado': [
            'Pago de expensa mensual con más de 30 días de atraso',
            'Cuota de mantenimiento extraordinario no pagada',
            'Servicio de agua común sin pagar por 2 meses',
            'Deuda acumulada de expensas por 3 meses',
        ],
        'dano_propiedad': [
            'Daño a puerta del ascensor',
            'Rotura de vidrio en área común',
            'Daño a sistema de riego del jardín',
            'Grafiti en pared del edificio',
            'Daño a cámara de seguridad',
        ],
        'incumplimiento': [
            'Tenencia de mascota no autorizada',
            'Modificación de fachada sin permiso',
            'Ingreso de visitas sin registro',
            'Realización de actividad comercial no permitida',
            'No asistencia a junta de propietarios (3 ausencias)',
        ],
        'otro': [
            'Comportamiento inapropiado con personal de seguridad',
            'Amenazas a otros residentes',
            'Acumulación de objetos en balcón (riesgo)',
        ],
    }
    
    def should_run(self):
        """Solo ejecutar si hay residentes y no hay multas"""
        residentes_count = Residente.objects.count()
        multas_count = self.model.objects.count()
        
        if residentes_count == 0:
            self.stdout.write(
                self.style.WARNING('⚠️  No hay residentes. Ejecuta el seeder de residentes primero.')
            )
            return False
        
        if multas_count > 0:
            self.stdout.write(
                self.style.WARNING(
                    f'⚠️  Ya existen {multas_count} multas en la base de datos.'
                )
            )
            return False
        
        return True
    
    @classmethod
    def run(cls):
        """Método principal para ejecutar el seeder"""
        seeder = cls()
        
        # Verificar residentes
        residentes_count = Residente.objects.count()
        if residentes_count == 0:
            print('⚠️  No hay residentes. Ejecuta el seeder de residentes primero.')
            return
        
        # Verificar si ya hay multas (solo si no es forzado)
        multas_count = Multa.objects.count()
        if multas_count > 0:
            print(f'⚠️  Ya existen {multas_count} multas en la base de datos.')
            # Continuar de todas formas si se usa --force
        
        # Generar datos
        multas_data = seeder.generate_data()
        
        if not multas_data:
            print('No se generaron datos de multas')
            return
        
        # Crear instancias
        instances = []
        for data in multas_data:
            instance = seeder.create_instance(data)
            instances.append(instance)
        
        # Mostrar resumen
        summary = seeder.get_summary(instances)
        print(f"\n✅ {summary['total']} multas generadas")
        print(f"\nPor estado:")
        for estado, count in summary['por_estado'].items():
            print(f"  {estado}: {count}")
        print(f"\nPor tipo:")
        for tipo, count in summary['por_tipo'].items():
            print(f"  {tipo}: {count}")
        print(f"\nMontos:")
        print(f"  Total: {summary['monto_total']}")
        print(f"  Pendiente: {summary['monto_pendiente']}")
        print(f"  Vencidas: {summary['vencidas']}")
    
    def generate_data(self):
        """Genera datos de multas"""
        residentes = list(Residente.objects.all())
        
        if not residentes:
            print('No hay residentes disponibles')
            return []
        
        multas_data = []
        hoy = timezone.now().date()
        
        # Distribuir multas entre residentes (algunos con varias, otros sin ninguna)
        residentes_con_multas = random.sample(
            residentes,
            min(len(residentes), random.randint(8, 12))
        )
        
        for residente in residentes_con_multas:
            # Cada residente puede tener de 1 a 4 multas
            num_multas = random.choices(
                [1, 2, 3, 4],
                weights=[50, 30, 15, 5]  # Más probable tener pocas multas
            )[0]
            
            for _ in range(num_multas):
                # Seleccionar tipo de multa
                tipo = random.choice([choice[0] for choice in Multa.TIPO_CHOICES])
                
                # Seleccionar descripción
                descripcion = random.choice(self.DESCRIPCIONES[tipo])
                
                # Generar monto según tipo
                montos_por_tipo = {
                    'ruido': (50, 200),
                    'estacionamiento': (100, 300),
                    'area_comun': (150, 500),
                    'pago_atrasado': (200, 1000),
                    'dano_propiedad': (300, 2000),
                    'incumplimiento': (100, 500),
                    'otro': (50, 300),
                }
                monto_min, monto_max = montos_por_tipo[tipo]
                monto = Decimal(str(random.randint(monto_min, monto_max)))
                
                # Fecha de emisión (últimos 6 meses)
                dias_atras = random.randint(0, 180)
                fecha_emision = hoy - timedelta(days=dias_atras)
                
                # Fecha de vencimiento (30 días después de emisión)
                fecha_vencimiento = fecha_emision + timedelta(days=30)
                
                # Determinar estado
                # 60% pendientes, 30% pagadas, 8% canceladas, 2% en disputa
                estado = random.choices(
                    ['pendiente', 'pagado', 'cancelado', 'en_disputa'],
                    weights=[60, 30, 8, 2]
                )[0]
                
                # Fecha de pago (solo si está pagada)
                fecha_pago = None
                if estado == 'pagado':
                    # Pago entre 0 y 45 días después de emisión
                    dias_hasta_pago = random.randint(0, 45)
                    fecha_pago = fecha_emision + timedelta(days=dias_hasta_pago)
                
                # Recargo por mora (solo si está vencida y pendiente)
                recargo_mora = Decimal('0.00')
                if estado == 'pendiente' and fecha_vencimiento < hoy:
                    dias_atraso = (hoy - fecha_vencimiento).days
                    porcentaje = min(dias_atraso * 2, 50)  # 2% por día, máx 50%
                    recargo_mora = (monto * Decimal(str(porcentaje))) / Decimal('100')
                
                # Observaciones opcionales
                observaciones = ''
                if random.random() < 0.3:  # 30% tienen observaciones
                    observaciones_posibles = [
                        'Primera infracción',
                        'Reincidencia',
                        'Compromiso de no repetir',
                        'Notificado por correo electrónico',
                        'Testigos: vecinos del 3er piso',
                    ]
                    observaciones = random.choice(observaciones_posibles)
                
                multas_data.append({
                    'tipo': tipo,
                    'descripcion': descripcion,
                    'monto': monto,
                    'residente': residente,
                    'unidad': residente.get_unidad(),
                    'estado': estado,
                    'fecha_emision': fecha_emision,
                    'fecha_vencimiento': fecha_vencimiento,
                    'fecha_pago': fecha_pago,
                    'recargo_mora': recargo_mora,
                    'observaciones': observaciones,
                    'creado_por': 'admin',
                })
        
        return multas_data
    
    def create_instance(self, data):
        """Crea una instancia de multa con los datos generados"""
        # Extraer fecha_emision antes de crear
        fecha_emision = data.pop('fecha_emision')
        
        # Crear la multa
        multa = self.model.objects.create(**data)
        
        # Actualizar fecha_emision manualmente (ya que auto_now_add lo sobreescribe)
        self.model.objects.filter(pk=multa.pk).update(fecha_emision=fecha_emision)
        
        # Recargar para tener los datos actualizados
        multa.refresh_from_db()
        
        return multa
    
    def get_summary(self, instances):
        """Genera resumen de las multas creadas"""
        total = len(instances)
        
        # Contar por estado
        por_estado = {}
        for estado_key, estado_label in Multa.ESTADO_CHOICES:
            count = sum(1 for m in instances if m.estado == estado_key)
            if count > 0:
                por_estado[estado_label] = count
        
        # Contar por tipo
        por_tipo = {}
        for tipo_key, tipo_label in Multa.TIPO_CHOICES:
            count = sum(1 for m in instances if m.tipo == tipo_key)
            if count > 0:
                por_tipo[tipo_label] = count
        
        # Montos
        monto_total = sum(m.monto_total for m in instances)
        monto_pendiente = sum(
            m.monto_total for m in instances if m.estado == 'pendiente'
        )
        
        # Vencidas
        vencidas = sum(1 for m in instances if m.esta_vencida)
        
        return {
            'total': total,
            'por_estado': por_estado,
            'por_tipo': por_tipo,
            'monto_total': f'Bs. {monto_total:,.2f}',
            'monto_pendiente': f'Bs. {monto_pendiente:,.2f}',
            'vencidas': vencidas,
        }


# Instancia global para registro
multas_seeder = MultasSeeder()
