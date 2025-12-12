"""
Seeder para módulo de Pagos (Expensas y Pagos)
Genera expensas mensuales y pagos de prueba
"""
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
import random

from .base_seeder import BaseSeeder
from pagos.models import Expensa, ConceptoPago, Pago
from unidades.models import UnidadHabitacional
from users.models import CustomUser


class PagosSeeder(BaseSeeder):
    """Seeder para expensas y pagos"""
    
    @classmethod
    def run(cls):
        """Ejecutar seeder de pagos"""
        seeder = cls()
        seeder._ejecutar()
    
    def __init__(self):
        self.expensas = []
        self.conceptos = []
        self.pagos = []
    
    def _ejecutar(self):
        """Lógica de ejecución del seeder"""
        print("\n" + "=" * 60)
        print("INICIANDO SEEDER DE PAGOS")
        print("=" * 60)
        
        # Obtener todas las unidades
        unidades = list(UnidadHabitacional.objects.all())
        
        if not unidades:
            print("❌ No hay unidades. Ejecuta unidad_seeder primero.")
            return
        
        print(f"✅ Se encontraron {len(unidades)} unidades")
        
        # Obtener administrador para registrar pagos
        admin_user = CustomUser.objects.filter(is_superuser=True).first()
        
        if not admin_user:
            print("❌ No hay usuarios administradores")
            return
        
        # Generar expensas de los últimos 6 meses
        self.generar_expensas_multiples_meses(unidades, 6)
        
        # Registrar pagos aleatorios
        self.generar_pagos_aleatorios(admin_user)
        
        # Resumen
        print(f"\n✅ Expensas creadas: {len(self.expensas)}")
        print(f"✅ Conceptos creados: {len(self.conceptos)}")
        print(f"✅ Pagos registrados: {len(self.pagos)}")
        
        # Estadísticas
        total_generado = sum(e.monto_total for e in self.expensas)
        total_pagado = sum(p.monto for p in self.pagos)
        tasa_cobro = (float(total_pagado) / float(total_generado) * 100) if total_generado > 0 else 0
        
        print(f"\n📊 Estadísticas:")
        print(f"   Total generado: Bs. {total_generado:,.2f}")
        print(f"   Total pagado: Bs. {total_pagado:,.2f}")
        print(f"   Tasa de cobro: {tasa_cobro:.1f}%")
        
        # Estados de expensas
        estados = {}
        for expensa in self.expensas:
            estados[expensa.estado] = estados.get(expensa.estado, 0) + 1
        
        print(f"\n📈 Estados de expensas:")
        for estado, count in estados.items():
            print(f"   {estado}: {count}")
        
        print("\n" + "=" * 60)
    
    def generar_expensas_multiples_meses(self, unidades, num_meses):
        """Genera expensas para múltiples meses"""
        print(f"\n📅 Generando expensas de los últimos {num_meses} meses...")
        
        hoy = timezone.now().date()
        
        for i in range(num_meses):
            # Calcular mes anterior
            fecha = hoy - timedelta(days=30 * i)
            periodo = fecha.strftime("%Y-%m")
            
            # Fecha de emisión: día 1 del mes
            fecha_emision = fecha.replace(day=1)
            
            # Fecha de vencimiento: día 15 del mes
            try:
                fecha_vencimiento = fecha.replace(day=15)
            except ValueError:
                fecha_vencimiento = fecha.replace(day=28)
            
            print(f"   Generando periodo {periodo}...")
            
            # Crear expensas para todas las unidades
            for unidad in unidades:
                expensa = self.crear_expensa_con_conceptos(
                    unidad, periodo, fecha_emision, fecha_vencimiento
                )
                self.expensas.append(expensa)
    
    def crear_expensa_con_conceptos(self, unidad, periodo, fecha_emision, fecha_vencimiento):
        """Crea una expensa con sus conceptos"""
        
        # Monto base aleatorio entre 200 y 300
        monto_base = Decimal(random.randint(200, 300))
        
        # Crear expensa
        expensa = Expensa.objects.create(
            unidad=unidad,
            periodo=periodo,
            monto_base=monto_base,
            monto_adicional=Decimal('0.00'),
            fecha_emision=fecha_emision,
            fecha_vencimiento=fecha_vencimiento
        )
        
        # Crear conceptos de pago
        conceptos_data = [
            {
                'descripcion': 'Mantenimiento de áreas comunes',
                'monto': Decimal('150.00'),
                'tipo': 'mantenimiento'
            },
            {
                'descripcion': 'Servicio de agua',
                'monto': Decimal(random.randint(30, 60)),
                'tipo': 'agua'
            },
            {
                'descripcion': 'Servicio de limpieza',
                'monto': Decimal(random.randint(40, 80)),
                'tipo': 'limpieza'
            },
        ]
        
        # Ocasionalmente agregar multa
        if random.random() < 0.15:  # 15% de probabilidad
            conceptos_data.append({
                'descripcion': 'Multa por ruido excesivo',
                'monto': Decimal(random.randint(50, 150)),
                'tipo': 'multa'
            })
        
        # Crear conceptos
        for concepto_data in conceptos_data:
            concepto = ConceptoPago.objects.create(
                expensa=expensa,
                **concepto_data
            )
            self.conceptos.append(concepto)
        
        # Recalcular total
        expensa.refresh_from_db()
        
        return expensa
    
    def generar_pagos_aleatorios(self, admin_user):
        """Genera pagos aleatorios para las expensas"""
        print(f"\n💰 Generando pagos aleatorios...")
        
        for expensa in self.expensas:
            # Determinar si habrá pago
            probabilidad_pago = self.calcular_probabilidad_pago(expensa)
            
            if random.random() < probabilidad_pago:
                # Decidir si pago total o parcial
                if random.random() < 0.8:  # 80% pago total
                    monto = expensa.monto_total
                else:  # 20% pago parcial
                    monto = expensa.monto_total * Decimal(str(random.uniform(0.3, 0.9)))
                    monto = monto.quantize(Decimal('0.01'))
                
                # Crear pago
                self.crear_pago(expensa, monto, admin_user)
    
    def calcular_probabilidad_pago(self, expensa):
        """Calcula probabilidad de pago según antigüedad"""
        hoy = timezone.now().date()
        dias_desde_emision = (hoy - expensa.fecha_emision).days
        
        # Más antiguo = más probable que esté pagado
        if dias_desde_emision > 150:  # Más de 5 meses
            return 0.95
        elif dias_desde_emision > 120:  # Más de 4 meses
            return 0.85
        elif dias_desde_emision > 90:  # Más de 3 meses
            return 0.75
        elif dias_desde_emision > 60:  # Más de 2 meses
            return 0.65
        elif dias_desde_emision > 30:  # Más de 1 mes
            return 0.50
        else:  # Mes actual
            return 0.30
    
    def crear_pago(self, expensa, monto, admin_user):
        """Crea un pago para una expensa"""
        metodos = ['efectivo', 'transferencia', 'qr', 'tarjeta']
        metodo = random.choice(metodos)
        
        # Fecha de pago entre emisión y hoy
        hoy = timezone.now()
        dias_diff = (hoy.date() - expensa.fecha_emision).days
        
        if dias_diff > 0:
            fecha_pago = expensa.fecha_emision + timedelta(days=random.randint(1, dias_diff))
            fecha_pago = timezone.make_aware(
                timezone.datetime.combine(fecha_pago, timezone.datetime.min.time())
            )
        else:
            fecha_pago = hoy
        
        # Número de comprobante
        numero_comprobante = f"PAG-{expensa.id:04d}-{random.randint(1000, 9999)}"
        
        pago = Pago.objects.create(
            expensa=expensa,
            monto=monto,
            metodo_pago=metodo,
            numero_comprobante=numero_comprobante,
            fecha_pago=fecha_pago,
            observaciones="Pago registrado automáticamente" if monto == expensa.monto_total else "Pago parcial",
            registrado_por=admin_user
        )
        
        self.pagos.append(pago)


def run():
    """Función principal para ejecutar el seeder"""
    # Esta función ya no es necesaria con el nuevo sistema
    pass
