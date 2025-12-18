"""
Seeder para entrenar Azure Face API con las fotos REALES de residentes.

Este seeder:
1. Crea el PersonGroup en Azure si no existe
2. Registra cada residente que tenga foto_perfil
3. Entrena el modelo de reconocimiento facial

Uso:
    python manage.py seed train_azure_faces --force
    
NOTA: Este seeder requiere azure-cognitiveservices-vision-face instalado.
"""
import os
import logging
from django.conf import settings
from django.db import transaction

from residentes.models import Residente
from .base_seeder import BaseSeeder

logger = logging.getLogger(__name__)

# Importación opcional de Azure Face Service
try:
    from seguridad.azure_face_service import AzureFaceService
    AZURE_FACE_AVAILABLE = True
except ImportError:
    AZURE_FACE_AVAILABLE = False
    logger.warning("Azure Face SDK no está disponible. Instala: pip install azure-cognitiveservices-vision-face")


class TrainAzureFacesSeeder(BaseSeeder):
    """Seeder para entrenar Azure Face API con fotos de residentes."""

    @classmethod
    def should_run(cls) -> bool:
        """
        Verifica si el seeder debe ejecutarse.
        
        Solo se ejecuta si:
        1. Azure Face SDK está disponible
        2. Se fuerza con --force (ya que es un entrenamiento costoso)
        
        Returns:
            False siempre (ejecutar solo con --force por seguridad)
        """
        if not AZURE_FACE_AVAILABLE:
            logger.info("Azure Face SDK no disponible, saltando entrenamiento facial")
            return False
        
        return False

    @classmethod
    @transaction.atomic
    def run(cls):
        """Ejecuta el entrenamiento de Azure Face API."""
        print("\n" + "=" * 80)
        print("🤖 ENTRENAMIENTO DE AZURE FACE API")
        print("=" * 80)

        try:
            # Inicializar servicio Azure
            print("\n📡 Conectando a Azure Face API...")
            azure_service = AzureFaceService()
            print("✅ Conexión exitosa")

            # Paso 1: Crear PersonGroup
            print(f"\n📦 Creando PersonGroup '{azure_service.person_group_id}'...")
            if azure_service.create_person_group():
                print("✅ PersonGroup listo")
            else:
                print("❌ Error creando PersonGroup")
                return

            # Paso 2: Obtener residentes con fotos
            residentes_con_foto = Residente.objects.filter(
                es_activo=True,
                foto_perfil__isnull=False
            ).exclude(foto_perfil='')

            total = residentes_con_foto.count()
            print(f"\n👤 Residentes encontrados con foto: {total}")

            if total == 0:
                print("⚠️  No hay residentes con fotos para entrenar.")
                print("   Sube fotos de perfil primero usando el formulario de residentes.")
                return

            # Paso 3: Registrar cada residente
            print("\n📸 Registrando residentes en Azure...")
            registrados = 0
            errores = 0

            for idx, residente in enumerate(residentes_con_foto, 1):
                try:
                    # Verificar que el archivo existe
                    foto_path = os.path.join(settings.MEDIA_ROOT, str(residente.foto_perfil))
                    
                    if not os.path.exists(foto_path):
                        print(f"  ⚠️  [{idx}/{total}] {residente.get_nombre_completo()}: Archivo no existe")
                        errores += 1
                        continue

                    # Registrar en Azure (por ahora solo con 1 foto)
                    # En producción ideal: tener múltiples fotos del mismo residente
                    azure_person_id = azure_service.add_person(
                        person_id=str(residente.id),
                        name=residente.get_nombre_completo(),
                        image_paths=[foto_path]
                    )

                    if azure_person_id:
                        print(f"  ✅ [{idx}/{total}] {residente.get_nombre_completo()}")
                        registrados += 1
                    else:
                        print(f"  ❌ [{idx}/{total}] {residente.get_nombre_completo()}: Error en Azure")
                        errores += 1

                except Exception as e:
                    print(f"  ❌ [{idx}/{total}] {residente.get_nombre_completo()}: {str(e)}")
                    errores += 1

            # Paso 4: Entrenar el modelo
            if registrados > 0:
                print(f"\n🎓 Entrenando modelo con {registrados} residentes...")
                print("   (Esto puede tomar ~30 segundos)")
                
                if azure_service.train_model(wait_for_completion=True):
                    print("\n" + "=" * 80)
                    print("✅ ENTRENAMIENTO COMPLETADO EXITOSAMENTE")
                    print("=" * 80)
                    print(f"📊 Resumen:")
                    print(f"   - Residentes registrados: {registrados}")
                    print(f"   - Errores: {errores}")
                    print(f"   - Confianza mínima: {azure_service.confidence_threshold}")
                    print(f"   - PersonGroup ID: {azure_service.person_group_id}")
                    print("\n💡 Ya puedes usar el reconocimiento facial en el sistema")
                else:
                    print("\n❌ Error durante el entrenamiento")
            else:
                print("\n⚠️  No se registró ningún residente. No hay nada que entrenar.")

        except ValueError as e:
            print(f"\n❌ Error de configuración: {str(e)}")
            print("\n💡 Verifica que las variables de entorno estén configuradas:")
            print("   - AZURE_FACE_SUBSCRIPTION_KEY")
            print("   - AZURE_FACE_ENDPOINT")
            
        except Exception as e:
            print(f"\n❌ Error inesperado: {str(e)}")
            logger.exception("Error durante entrenamiento de Azure Face API")

    @classmethod
    def get_dependencies(cls) -> list:
        """
        Retorna las dependencias del seeder.

        Returns:
            Lista de clases de seeder requeridas
        """
        from .residente_seeder import ResidenteSeeder
        return [ResidenteSeeder]
