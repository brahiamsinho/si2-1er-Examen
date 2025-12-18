"""
Servicio de Reconocimiento Facial usando DeepFace (Local, sin API keys).

DeepFace es una librería que unifica múltiples modelos de reconocimiento facial:
- VGG-Face, Facenet, OpenFace, DeepFace, DeepID, ArcFace, Dlib, SFace

Ventajas:
- ✅ Gratis y sin límites de uso
- ✅ Funciona offline (no requiere internet)
- ✅ Sin necesidad de API keys o permisos especiales
- ✅ Excelente precisión (comparable a servicios cloud)
- ✅ Múltiples backends de detección

Este servicio:
1. Usa el modelo configurado en DEEPFACE_MODEL (default: Facenet)
2. Almacena rostros en DEEPFACE_DATABASE_PATH
3. Verifica rostros con DeepFace.verify()
4. Busca en base de datos con DeepFace.find()
"""
import os
import logging
from typing import List, Dict, Optional, Tuple
from pathlib import Path

from deepface import DeepFace
from django.conf import settings

logger = logging.getLogger(__name__)


class DeepFaceService:
    """Servicio para reconocimiento facial usando DeepFace."""

    def __init__(self):
        """Inicializa el servicio DeepFace."""
        self.model_name = os.getenv('DEEPFACE_MODEL', 'Facenet')
        self.detector_backend = os.getenv('DEEPFACE_DETECTOR', 'opencv')
        self.database_path = os.getenv('DEEPFACE_DATABASE_PATH', 'media/rostros')
        self.confidence_threshold = float(os.getenv('AI_FACE_CONFIDENCE_THRESHOLD', '0.6'))
        
        # Construir ruta absoluta a la base de datos
        if not os.path.isabs(self.database_path):
            self.database_path = os.path.join(settings.BASE_DIR, self.database_path)
        
        logger.info(f"DeepFace initialized: model={self.model_name}, detector={self.detector_backend}")
        logger.info(f"Database path: {self.database_path}")

    def verify_faces(
        self, 
        img1_path: str, 
        img2_path: str
    ) -> Tuple[bool, float]:
        """
        Verifica si dos imágenes corresponden a la misma persona.
        
        Args:
            img1_path: Ruta a la primera imagen
            img2_path: Ruta a la segunda imagen
            
        Returns:
            (is_same_person, confidence) - tupla con resultado y confianza
        """
        try:
            result = DeepFace.verify(
                img1_path=img1_path,
                img2_path=img2_path,
                model_name=self.model_name,
                detector_backend=self.detector_backend,
                enforce_detection=True
            )
            
            # DeepFace retorna 'verified' (bool) y 'distance' (float)
            # Distance menor = mayor similitud
            # Convertimos distance a confidence (1 - normalized_distance)
            is_verified = result['verified']
            distance = result['distance']
            
            # Para Facenet, threshold típico es ~0.4
            # Convertimos a confidence: confidence = 1 - (distance / threshold)
            threshold = result.get('threshold', 0.4)
            confidence = max(0.0, min(1.0, 1 - (distance / threshold)))
            
            logger.info(f"Verification result: verified={is_verified}, confidence={confidence:.2f}")
            return is_verified, confidence

        except Exception as e:
            logger.error(f"Error verifying faces: {str(e)}")
            return False, 0.0

    def find_person(
        self, 
        img_path: str,
        return_top_n: int = 1
    ) -> Optional[List[Dict]]:
        """
        Busca una persona en la base de datos de rostros.
        
        Args:
            img_path: Ruta a la imagen a buscar
            return_top_n: Número de mejores coincidencias a retornar
            
        Returns:
            Lista de diccionarios con resultados, o None si no hay coincidencias
            Cada dict contiene: identity, distance, confidence, threshold
        """
        try:
            # Verificar que existe la base de datos
            if not os.path.exists(self.database_path):
                logger.warning(f"Database path does not exist: {self.database_path}")
                return None

            # Buscar en la base de datos
            results = DeepFace.find(
                img_path=img_path,
                db_path=self.database_path,
                model_name=self.model_name,
                detector_backend=self.detector_backend,
                enforce_detection=True,
                silent=True
            )
            
            if not results or len(results) == 0:
                logger.info("No matches found in database")
                return None
            
            # DeepFace.find() retorna un DataFrame
            df = results[0]  # Primer DataFrame (solo hay uno)
            
            if df.empty:
                logger.info("No matches found (empty dataframe)")
                return None
            
            # Convertir a lista de diccionarios
            matches = []
            for idx, row in df.head(return_top_n).iterrows():
                identity_path = row['identity']
                
                # Encontrar la columna de distance (puede variar el nombre)
                distance_col = None
                for col in df.columns:
                    if 'distance' in col.lower() or 'cosine' in col.lower():
                        distance_col = col
                        break
                
                if distance_col:
                    distance = row[distance_col]
                else:
                    # Fallback: buscar todas las columnas numéricas
                    numeric_cols = df.select_dtypes(include=['float64', 'float32']).columns
                    distance_col = [c for c in numeric_cols if c != 'threshold'][0] if len(numeric_cols) > 0 else None
                    distance = row[distance_col] if distance_col else 0.5
                
                threshold = row.get('threshold', 0.4) if 'threshold' in row else 0.4
                
                # Convertir distance a confidence
                confidence = max(0.0, min(1.0, 1 - (distance / threshold)))
                
                # Filtrar por threshold de confianza
                if confidence >= self.confidence_threshold:
                    matches.append({
                        'identity': identity_path,
                        'distance': distance,
                        'confidence': confidence,
                        'threshold': threshold,
                        'residente_id': self._extract_residente_id(identity_path)
                    })
            
            if matches:
                logger.info(f"Found {len(matches)} matches above confidence threshold")
                return matches
            else:
                logger.info("No matches above confidence threshold")
                return None

        except Exception as e:
            logger.error(f"Error finding person: {str(e)}")
            import traceback
            logger.error(traceback.format_exc())
            return None

    def _extract_residente_id(self, identity_path: str) -> Optional[int]:
        """
        Extrae el ID del residente desde la ruta de la imagen.
        
        Asume estructura: media/rostros/{ci}/perfil.jpg
        
        Args:
            identity_path: Ruta completa a la imagen
            
        Returns:
            ID del residente (CI) o None
        """
        try:
            # Obtener el nombre del directorio padre (debería ser el CI)
            path = Path(identity_path)
            ci = path.parent.name
            
            # Intentar convertir a int (validar que sea un número)
            return int(ci) if ci.isdigit() else None
            
        except Exception as e:
            logger.error(f"Error extracting residente_id from {identity_path}: {str(e)}")
            return None

    def identify_person_from_image(
        self, 
        image_path: str
    ) -> Optional[Dict]:
        """
        Identifica a una persona desde una imagen.
        
        Args:
            image_path: Ruta a la imagen
            
        Returns:
            Diccionario con residente_id y confidence, o None
        """
        matches = self.find_person(image_path, return_top_n=1)
        
        if matches and len(matches) > 0:
            best_match = matches[0]
            return {
                'residente_id': best_match['residente_id'],
                'confidence': best_match['confidence'],
                'service': 'deepface',
                'model': self.model_name
            }
        
        return None

    def analyze_face(self, img_path: str) -> Optional[Dict]:
        """
        Analiza atributos faciales (edad, género, emoción, etc.).
        
        Args:
            img_path: Ruta a la imagen
            
        Returns:
            Diccionario con atributos detectados o None
        """
        try:
            result = DeepFace.analyze(
                img_path=img_path,
                actions=['age', 'gender', 'emotion'],
                detector_backend=self.detector_backend,
                enforce_detection=True,
                silent=True
            )
            
            if result and len(result) > 0:
                # DeepFace.analyze retorna lista de resultados (uno por rostro)
                return result[0]
            
            return None

        except Exception as e:
            logger.error(f"Error analyzing face: {str(e)}")
            return None

    def rebuild_database(self) -> bool:
        """
        Reconstruye la representación vectorial de la base de datos.
        
        Útil cuando se agregan/eliminan fotos de residentes.
        
        Returns:
            True si se reconstruyó exitosamente
        """
        try:
            # DeepFace automáticamente reconstruye si detecta cambios
            # Forzamos reconstrucción eliminando el archivo de cache
            cache_file = os.path.join(self.database_path, f"representations_{self.model_name}.pkl")
            
            if os.path.exists(cache_file):
                os.remove(cache_file)
                logger.info(f"Removed cache file: {cache_file}")
            
            # Ejecutar find con una imagen dummy para forzar reconstrucción
            # (DeepFace creará nuevo cache automáticamente)
            logger.info("Database cache will be rebuilt on next search")
            return True

        except Exception as e:
            logger.error(f"Error rebuilding database: {str(e)}")
            return False

    def get_database_stats(self) -> Dict:
        """
        Obtiene estadísticas de la base de datos de rostros.
        
        Returns:
            Diccionario con estadísticas
        """
        try:
            if not os.path.exists(self.database_path):
                return {
                    'total_residents': 0,
                    'total_images': 0,
                    'cache_exists': False
                }
            
            # Contar residentes (directorios)
            residents = [d for d in os.listdir(self.database_path) 
                        if os.path.isdir(os.path.join(self.database_path, d))]
            
            # Contar imágenes totales
            total_images = 0
            for resident in residents:
                resident_path = os.path.join(self.database_path, resident)
                images = [f for f in os.listdir(resident_path) 
                         if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
                total_images += len(images)
            
            # Verificar si existe cache
            cache_file = os.path.join(self.database_path, f"representations_{self.model_name}.pkl")
            cache_exists = os.path.exists(cache_file)
            
            return {
                'total_residents': len(residents),
                'total_images': total_images,
                'cache_exists': cache_exists,
                'database_path': self.database_path,
                'model': self.model_name
            }

        except Exception as e:
            logger.error(f"Error getting database stats: {str(e)}")
            return {
                'error': str(e)
            }
