"""
Seeder para generar dataset de IA (imágenes de rostros y placas).

Este seeder:
- Descarga fotos de rostros desde randomuser.me API
- Genera imágenes sintéticas de placas vehiculares
- Organiza los archivos en media/dataset/
"""
import os
import random
import requests
from PIL import Image, ImageDraw, ImageFont
from django.conf import settings
from django.core.files.base import ContentFile
from django.db import transaction

from residentes.models import Residente
from .base_seeder import BaseSeeder


class IADatasetSeeder(BaseSeeder):
    """Seeder para generar dataset de entrenamiento de IA."""

    @classmethod
    def should_run(cls) -> bool:
        """
        Verifica si el seeder debe ejecutarse.
        
        Returns:
            False siempre (ejecutar solo con --force)
        """
        # Este seeder solo debe ejecutarse manualmente con --force
        # porque descarga archivos externos y puede ser lento
        return False

    @classmethod
    @transaction.atomic
    def run(cls):
        """Ejecuta el seeder de dataset de IA."""
        print("\n" + "=" * 80)
        print("SEEDER: IA Dataset (Rostros y Placas)")
        print("=" * 80)

        # Crear directorios
        cls._create_directories()

        # Generar dataset de rostros
        cls._generate_faces_dataset()

        # Generar dataset de placas
        cls._generate_plates_dataset()

        print("\n✅ Dataset de IA generado exitosamente")
        print("=" * 80)

    @classmethod
    def _create_directories(cls):
        """Crea los directorios necesarios para el dataset."""
        base_path = os.path.join(settings.MEDIA_ROOT, 'dataset')
        
        directories = [
            os.path.join(base_path, 'rostros'),
            os.path.join(base_path, 'placas'),
            os.path.join(base_path, 'anomalias'),
        ]

        for directory in directories:
            os.makedirs(directory, exist_ok=True)
            print(f"✓ Directorio creado: {directory}")

    @classmethod
    def _generate_faces_dataset(cls):
        """
        Genera dataset de rostros descargando fotos de residentes.
        Usa randomuser.me API para obtener fotos realistas.
        """
        print("\n📸 Generando dataset de rostros...")

        # Obtener residentes activos
        residentes = Residente.objects.filter(es_activo=True)[:15]

        if not residentes.exists():
            print("⚠️  No hay residentes en la BD. Ejecuta primero el seeder de residentes.")
            return

        print(f"Descargando fotos para {residentes.count()} residentes...")

        for residente in residentes:
            # Crear directorio para el residente
            residente_dir = os.path.join(
                settings.MEDIA_ROOT,
                'dataset',
                'rostros',
                str(residente.id)
            )
            os.makedirs(residente_dir, exist_ok=True)

            # Descargar 5 fotos por residente
            cls._download_face_photos(
                residente,
                residente_dir,
                count=5
            )

        print(f"✅ {residentes.count()} residentes con fotos generadas")

    @classmethod
    def _download_face_photos(cls, residente, output_dir: str, count: int = 5):
        """
        Descarga fotos de rostros desde randomuser.me.

        Args:
            residente: Instancia de Residente
            output_dir: Directorio de salida
            count: Cantidad de fotos a descargar
        """
        # Determinar género para la API
        gender = 'male' if residente.genero == 'M' else 'female'

        for i in range(count):
            try:
                # Llamar a randomuser.me API
                response = requests.get(
                    'https://randomuser.me/api/',
                    params={
                        'gender': gender,
                        'inc': 'picture',
                        'noinfo': True
                    },
                    timeout=10
                )

                if response.status_code == 200:
                    data = response.json()
                    photo_url = data['results'][0]['picture']['large']

                    # Descargar foto
                    photo_response = requests.get(photo_url, timeout=10)

                    if photo_response.status_code == 200:
                        # Guardar archivo
                        filename = f"{residente.id}_{i + 1}.jpg"
                        filepath = os.path.join(output_dir, filename)

                        with open(filepath, 'wb') as f:
                            f.write(photo_response.content)

                        print(f"  ✓ {residente.get_nombre_completo()}: foto {i + 1}/5")

            except Exception as e:
                print(f"  ✗ Error descargando foto {i + 1} para {residente.get_nombre_completo()}: {str(e)}")

    @classmethod
    def _generate_plates_dataset(cls):
        """
        Genera dataset de placas vehiculares sintéticas.
        Crea imágenes con texto de placas usando PIL.
        """
        print("\n🚗 Generando dataset de placas...")

        plates_dir = os.path.join(settings.MEDIA_ROOT, 'dataset', 'placas')

        # Generar 20 placas diferentes
        plate_formats = [
            ('ABC', '1234'),  # Formato estándar La Paz
            ('XYZ', '5678'),
            ('DEF', '9012'),
            ('GHI', '3456'),
            ('JKL', '7890'),
            ('MNO', '1357'),
            ('PQR', '2468'),
            ('STU', '8024'),
            ('VWX', '6913'),
            ('YZA', '4826'),
        ]

        for idx, (letters, numbers) in enumerate(plate_formats):
            # Crear imagen de placa
            img = Image.new('RGB', (400, 100), color='white')
            draw = ImageDraw.Draw(img)

            # Dibujar borde
            draw.rectangle([(5, 5), (395, 95)], outline='black', width=3)

            # Texto de la placa
            plate_text = f"{letters}-{numbers}"

            # Usar fuente grande y negrita
            try:
                # Intentar usar fuente del sistema
                font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 60)
            except:
                # Usar fuente por defecto si no encuentra
                font = ImageFont.load_default()

            # Centrar texto
            bbox = draw.textbbox((0, 0), plate_text, font=font)
            text_width = bbox[2] - bbox[0]
            text_height = bbox[3] - bbox[1]
            x = (400 - text_width) // 2
            y = (100 - text_height) // 2

            # Dibujar texto
            draw.text((x, y), plate_text, fill='black', font=font)

            # Guardar
            filename = f"placa_{letters}{numbers}.jpg"
            filepath = os.path.join(plates_dir, filename)
            img.save(filepath, 'JPEG')

            print(f"  ✓ Placa generada: {plate_text}")

            # Variación con ruido (simular foto real)
            img_noisy = cls._add_noise_to_plate(img)
            filename_noisy = f"placa_{letters}{numbers}_noisy.jpg"
            filepath_noisy = os.path.join(plates_dir, filename_noisy)
            img_noisy.save(filepath_noisy, 'JPEG')

        print(f"✅ {len(plate_formats) * 2} placas generadas (normales + con ruido)")

    @classmethod
    def _add_noise_to_plate(cls, img: Image.Image) -> Image.Image:
        """
        Agrega ruido a una imagen de placa para simular condiciones reales.

        Args:
            img: Imagen original

        Returns:
            Imagen con ruido agregado
        """
        import numpy as np

        # Convertir a numpy array
        img_array = np.array(img)

        # Agregar ruido gaussiano
        noise = np.random.normal(0, 10, img_array.shape)
        noisy_array = np.clip(img_array + noise, 0, 255).astype(np.uint8)

        # Convertir de vuelta a PIL Image
        return Image.fromarray(noisy_array)

    @classmethod
    def get_dependencies(cls) -> list:
        """
        Retorna las dependencias del seeder.

        Returns:
            Lista de clases de seeder requeridas
        """
        from .residente_seeder import ResidenteSeeder
        return [ResidenteSeeder]
