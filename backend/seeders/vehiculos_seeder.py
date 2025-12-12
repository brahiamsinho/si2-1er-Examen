"""
Seeder para módulo de Vehículos
Genera vehículos de prueba asociados a residentes
"""
from django.utils import timezone
from datetime import timedelta
import random

from seeders.base_seeder import BaseSeeder
from vehiculos.models import Vehiculo
from residentes.models import Residente
from unidades.models import UnidadHabitacional


class VehiculosSeeder(BaseSeeder):
    """Seeder para vehículos autorizados"""
    
    @classmethod
    def run(cls):
        """Ejecutar seeder de vehículos"""
        seeder = cls()
        seeder._ejecutar()
    
    def __init__(self):
        self.vehiculos = []
        self.marcas_modelos = {
            'Toyota': ['Corolla', 'Camry', 'RAV4', 'Hilux', 'Yaris'],
            'Nissan': ['Sentra', 'Versa', 'X-Trail', 'Frontier', 'Kicks'],
            'Hyundai': ['Accent', 'Elantra', 'Tucson', 'Santa Fe', 'i10'],
            'Chevrolet': ['Cruze', 'Spark', 'Tracker', 'Onix', 'Captiva'],
            'Suzuki': ['Swift', 'Vitara', 'Baleno', 'Dzire', 'Jimny'],
            'Honda': ['Civic', 'Accord', 'CR-V', 'City', 'HR-V'],
            'Ford': ['Focus', 'Fiesta', 'Escape', 'Explorer', 'Ranger'],
            'Mazda': ['3', '6', 'CX-5', 'CX-3', 'CX-9'],
        }
        
        self.colores = [
            'Blanco', 'Negro', 'Gris', 'Plata', 'Rojo',
            'Azul', 'Verde', 'Amarillo', 'Naranja', 'Café'
        ]
        
        self.tipos = ['auto', 'moto', 'camioneta', 'suv']
    
    def _ejecutar(self):
        """Lógica de ejecución del seeder"""
        print("\n" + "=" * 60)
        print("INICIANDO SEEDER DE VEHÍCULOS")
        print("=" * 60)
        
        # Obtener residentes
        residentes = list(Residente.objects.all())
        
        if not residentes:
            print("❌ No hay residentes. Ejecuta residente_seeder primero.")
            return
        
        print(f"✅ Se encontraron {len(residentes)} residentes")
        
        # Generar vehículos
        self.generar_vehiculos(residentes)
        
        # Resumen
        print(f"\n✅ Vehículos creados: {len(self.vehiculos)}")
        
        # Estadísticas
        por_tipo = {}
        por_estado = {}
        
        for vehiculo in self.vehiculos:
            por_tipo[vehiculo.tipo] = por_tipo.get(vehiculo.tipo, 0) + 1
            por_estado[vehiculo.estado] = por_estado.get(vehiculo.estado, 0) + 1
        
        print(f"\n📊 Por tipo:")
        for tipo, count in por_tipo.items():
            print(f"   {tipo}: {count}")
        
        print(f"\n📈 Por estado:")
        for estado, count in por_estado.items():
            print(f"   {estado}: {count}")
        
        print("\n" + "=" * 60)
    
    def generar_vehiculos(self, residentes):
        """Genera vehículos para los residentes"""
        print(f"\n🚗 Generando vehículos...")
        
        letras_placas = [
            'ABC', 'DEF', 'GHI', 'JKL', 'MNO', 'PQR', 'STU', 'VWX', 'YZA',
            'BCD', 'EFG', 'HIJ', 'KLM', 'NOP', 'QRS', 'TUV', 'WXY', 'ZAB'
        ]
        
        placas_usadas = set()
        
        for residente in residentes:
            # Cada residente puede tener 1-3 vehículos
            num_vehiculos = random.randint(1, 3) if random.random() < 0.7 else 1
            
            for i in range(num_vehiculos):
                # Generar placa única
                placa = self.generar_placa_unica(letras_placas, placas_usadas)
                
                # Seleccionar marca y modelo
                marca = random.choice(list(self.marcas_modelos.keys()))
                modelo = random.choice(self.marcas_modelos[marca])
                
                # Datos del vehículo
                color = random.choice(self.colores)
                tipo = random.choice(self.tipos)
                año = random.randint(2010, 2024)
                
                # Estado (90% activo, 10% otros)
                if random.random() < 0.9:
                    estado = 'activo'
                else:
                    estado = random.choice(['inactivo', 'suspendido'])
                
                # Fecha de vencimiento (50% con vencimiento, 50% sin)
                fecha_vencimiento = None
                if random.random() < 0.5:
                    dias_adelante = random.randint(30, 365)
                    fecha_vencimiento = (timezone.now().date() + timedelta(days=dias_adelante))
                
                # Observaciones ocasionales
                observaciones = ""
                if random.random() < 0.2:
                    obs_opciones = [
                        "Vehículo de trabajo",
                        "Vehículo familiar",
                        "Uso ocasional",
                        "Vehículo de visita",
                    ]
                    observaciones = random.choice(obs_opciones)
                
                # Crear vehículo
                vehiculo = Vehiculo.objects.create(
                    placa=placa,
                    tipo=tipo,
                    marca=marca,
                    modelo=modelo,
                    color=color,
                    año=año,
                    residente=residente,
                    unidad=residente.get_unidad(),  # Usar método get_unidad()
                    estado=estado,
                    fecha_vencimiento=fecha_vencimiento,
                    observaciones=observaciones
                )
                
                self.vehiculos.append(vehiculo)
                placas_usadas.add(placa)
        
        print(f"   ✓ {len(self.vehiculos)} vehículos generados")
    
    def generar_placa_unica(self, letras_placas, placas_usadas):
        """Genera una placa única que no esté en uso"""
        max_intentos = 100
        
        for _ in range(max_intentos):
            letras = random.choice(letras_placas)
            numeros = f"{random.randint(1000, 9999)}"
            placa = f"{letras}-{numeros}"
            
            if placa not in placas_usadas:
                return placa
        
        # Si no se encontró una placa única, generar una aleatoria
        import string
        letras = ''.join(random.choices(string.ascii_uppercase, k=3))
        numeros = f"{random.randint(1000, 9999)}"
        return f"{letras}-{numeros}"


def run():
    """Función principal para ejecutar el seeder"""
    seeder = VehiculosSeeder()
    seeder.run()
