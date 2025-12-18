"""
Management command para entrenar el modelo de reconocimiento facial en Azure.

Uso:
    python manage.py train_face_model
    python manage.py train_face_model --recreate  # Elimina y recrea el PersonGroup
"""
import os
import glob
from django.core.management.base import BaseCommand, CommandError
from django.conf import settings

from residentes.models import Residente
from seguridad.ai_orchestrator import get_orchestrator


class Command(BaseCommand):
    help = 'Entrena el modelo de reconocimiento facial en Azure Face API'

    def add_arguments(self, parser):
        parser.add_argument(
            '--recreate',
            action='store_true',
            help='Elimina y recrea el PersonGroup antes de entrenar',
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('\n' + '=' * 80))
        self.stdout.write(self.style.SUCCESS('ENTRENAMIENTO DE MODELO DE RECONOCIMIENTO FACIAL'))
        self.stdout.write(self.style.SUCCESS('=' * 80 + '\n'))

        # Obtener orquestador
        orchestrator = get_orchestrator()

        # Verificar configuración
        if orchestrator.face_provider != 'azure':
            raise CommandError(
                f'Este comando solo funciona con Azure Face API. '
                f'Proveedor actual: {orchestrator.face_provider}'
            )

        # Paso 1: Crear PersonGroup
        self.stdout.write('📋 Paso 1: Creando PersonGroup...')
        if not orchestrator.create_person_group():
            raise CommandError('Error al crear PersonGroup')
        self.stdout.write(self.style.SUCCESS('  ✓ PersonGroup creado/verificado\n'))

        # Paso 2: Obtener dataset de rostros
        self.stdout.write('📸 Paso 2: Procesando dataset de rostros...')
        dataset_path = os.path.join(settings.MEDIA_ROOT, 'dataset', 'rostros')

        if not os.path.exists(dataset_path):
            raise CommandError(
                f'Dataset no encontrado en {dataset_path}\n'
                'Ejecuta primero: python manage.py seed ia_dataset --force'
            )

        # Obtener directorios de residentes
        residente_dirs = [
            d for d in glob.glob(os.path.join(dataset_path, '*'))
            if os.path.isdir(d)
        ]

        if not residente_dirs:
            raise CommandError(
                'No hay directorios de residentes en el dataset.\n'
                'Ejecuta primero: python manage.py seed ia_dataset --force'
            )

        self.stdout.write(f'  ✓ Encontrados {len(residente_dirs)} residentes con fotos\n')

        # Paso 3: Registrar cada residente en Azure
        self.stdout.write('🔄 Paso 3: Registrando residentes en Azure...')
        registered_count = 0
        error_count = 0

        for residente_dir in residente_dirs:
            # Obtener ID del residente desde el nombre del directorio
            residente_id = os.path.basename(residente_dir)

            try:
                # Obtener residente de la BD
                residente = Residente.objects.get(id=residente_id)

                # Obtener todas las fotos del residente
                image_paths = glob.glob(os.path.join(residente_dir, '*.jpg'))

                if not image_paths:
                    self.stdout.write(
                        self.style.WARNING(
                            f'  ⚠️  Sin fotos para {residente.get_nombre_completo()}'
                        )
                    )
                    continue

                # Registrar en Azure
                azure_person_id = orchestrator.add_person(
                    person_id=str(residente.id),
                    name=residente.get_nombre_completo(),
                    image_paths=image_paths
                )

                if azure_person_id:
                    registered_count += 1
                    self.stdout.write(
                        self.style.SUCCESS(
                            f'  ✓ {residente.get_nombre_completo()}: '
                            f'{len(image_paths)} fotos registradas'
                        )
                    )
                else:
                    error_count += 1
                    self.stdout.write(
                        self.style.ERROR(
                            f'  ✗ Error registrando {residente.get_nombre_completo()}'
                        )
                    )

            except Residente.DoesNotExist:
                self.stdout.write(
                    self.style.WARNING(
                        f'  ⚠️  Residente ID {residente_id} no existe en BD'
                    )
                )
                error_count += 1
                continue

            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(
                        f'  ✗ Error procesando directorio {residente_dir}: {str(e)}'
                    )
                )
                error_count += 1
                continue

        self.stdout.write(
            f'\n  📊 Registrados: {registered_count}, Errores: {error_count}\n'
        )

        if registered_count == 0:
            raise CommandError('No se pudo registrar ningún residente')

        # Paso 4: Entrenar modelo
        self.stdout.write('🚀 Paso 4: Entrenando modelo...')
        self.stdout.write('  ⏳ Esto puede tomar unos minutos...')

        if orchestrator.train_face_model():
            self.stdout.write(self.style.SUCCESS('  ✓ Modelo entrenado exitosamente\n'))
        else:
            raise CommandError('Error durante el entrenamiento')

        # Resumen final
        self.stdout.write(self.style.SUCCESS('\n' + '=' * 80))
        self.stdout.write(
            self.style.SUCCESS(
                f'✅ ENTRENAMIENTO COMPLETADO: {registered_count} personas registradas'
            )
        )
        self.stdout.write(self.style.SUCCESS('=' * 80 + '\n'))

        # Instrucciones siguientes
        self.stdout.write('📝 Próximos pasos:')
        self.stdout.write('  1. Probar reconocimiento: POST /api/seguridad/ia/identificar-rostro/')
        self.stdout.write('  2. Verificar estado: GET /api/seguridad/ia/status/')
        self.stdout.write('')
