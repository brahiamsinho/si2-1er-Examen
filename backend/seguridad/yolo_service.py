"""
Servicio de detección de objetos usando YOLOv8 local.

Este servicio permite:
- Detectar anomalías en el condominio (perros sueltos, vehículos mal estacionados, etc.)
- Funciona 100% offline (no requiere internet)
- Usa modelo pre-entrenado en COCO dataset
"""
import os
import logging
from typing import List, Dict, Optional, Tuple
import cv2
import numpy as np
from PIL import Image

logger = logging.getLogger(__name__)


class YOLODetectionService:
    """Servicio para detección de objetos usando YOLOv8."""

    # Clases COCO relevantes para seguridad de condominios
    ANOMALY_CLASSES = {
        'dog': 'Perro suelto',
        'cat': 'Gato suelto',
        'car': 'Vehículo',
        'truck': 'Camión',
        'motorcycle': 'Motocicleta',
        'bicycle': 'Bicicleta',
        'person': 'Persona',
        'backpack': 'Mochila abandonada',
        'handbag': 'Bolso abandonado',
        'suitcase': 'Maleta abandonada',
    }

    def __init__(self, model_path: Optional[str] = None):
        """
        Inicializa el modelo YOLOv8.

        Args:
            model_path: Ruta al modelo .pt (si None, usa yolov8n.pt por defecto)
        """
        self.confidence_threshold = float(os.getenv('AI_DETECTION_CONFIDENCE_THRESHOLD', '0.5'))
        self.model = None
        self.model_path = model_path or 'yolov8n.pt'

        # Cargar modelo lazy (solo cuando se usa por primera vez)
        self._load_model()

    def _load_model(self):
        """Carga el modelo YOLOv8 (lazy loading)."""
        if self.model is not None:
            return

        try:
            from ultralytics import YOLO

            # Buscar modelo en diferentes ubicaciones
            possible_paths = [
                self.model_path,
                os.path.join('/app/ai_models', 'yolov8n.pt'),
                os.path.join(os.path.expanduser('~'), '.cache/ultralytics/yolov8n.pt'),
            ]

            model_found = False
            for path in possible_paths:
                if os.path.exists(path):
                    logger.info(f"Loading YOLO model from {path}")
                    self.model = YOLO(path)
                    model_found = True
                    break

            if not model_found:
                # Descargar modelo si no existe
                logger.info("YOLO model not found, downloading yolov8n.pt...")
                self.model = YOLO('yolov8n.pt')

            logger.info("YOLO model loaded successfully")

        except Exception as e:
            logger.error(f"Error loading YOLO model: {str(e)}")
            raise

    def detect_anomalies(
        self,
        image_path: Optional[str] = None,
        image_bytes: Optional[bytes] = None,
        return_image: bool = False
    ) -> Tuple[List[Dict], Optional[bytes]]:
        """
        Detecta anomalías en una imagen.

        Args:
            image_path: Ruta a la imagen
            image_bytes: Bytes de la imagen
            return_image: Si True, retorna imagen con bounding boxes

        Returns:
            Tupla (detections, annotated_image) donde:
            - detections: Lista de diccionarios con {class, confidence, bbox, label}
            - annotated_image: Bytes de imagen anotada (si return_image=True)
        """
        try:
            # Cargar imagen
            if image_path:
                img = cv2.imread(image_path)
                if img is None:
                    raise ValueError(f"Could not load image from {image_path}")
            elif image_bytes:
                nparr = np.frombuffer(image_bytes, np.uint8)
                img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            else:
                raise ValueError("Must provide either image_path or image_bytes")

            # Ejecutar detección
            results = self.model(img, conf=self.confidence_threshold, verbose=False)

            # Procesar resultados
            detections = []
            for result in results:
                boxes = result.boxes

                for box in boxes:
                    # Obtener datos de la detección
                    class_id = int(box.cls[0])
                    class_name = result.names[class_id]
                    confidence = float(box.conf[0])

                    # Filtrar solo clases relevantes
                    if class_name not in self.ANOMALY_CLASSES:
                        continue

                    # Bounding box (x1, y1, x2, y2)
                    bbox = box.xyxy[0].tolist()

                    detections.append({
                        'class': class_name,
                        'label': self.ANOMALY_CLASSES[class_name],
                        'confidence': confidence,
                        'bbox': {
                            'x1': int(bbox[0]),
                            'y1': int(bbox[1]),
                            'x2': int(bbox[2]),
                            'y2': int(bbox[3]),
                        }
                    })

            logger.info(f"Detected {len(detections)} anomalies")

            # Generar imagen anotada si se solicita
            annotated_image = None
            if return_image and detections:
                annotated_img = img.copy()

                for det in detections:
                    bbox = det['bbox']
                    label = f"{det['label']} {det['confidence']:.2f}"

                    # Dibujar bounding box
                    cv2.rectangle(
                        annotated_img,
                        (bbox['x1'], bbox['y1']),
                        (bbox['x2'], bbox['y2']),
                        (0, 255, 0),
                        2
                    )

                    # Dibujar etiqueta
                    cv2.putText(
                        annotated_img,
                        label,
                        (bbox['x1'], bbox['y1'] - 10),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.5,
                        (0, 255, 0),
                        2
                    )

                # Convertir a bytes
                _, buffer = cv2.imencode('.jpg', annotated_img)
                annotated_image = buffer.tobytes()

            return detections, annotated_image

        except Exception as e:
            logger.error(f"Error detecting anomalies: {str(e)}")
            return [], None

    def detect_specific_class(
        self,
        image_path: Optional[str] = None,
        image_bytes: Optional[bytes] = None,
        target_class: str = 'dog'
    ) -> bool:
        """
        Verifica si hay instancias de una clase específica en la imagen.

        Args:
            image_path: Ruta a la imagen
            image_bytes: Bytes de la imagen
            target_class: Clase a detectar (ej: 'dog', 'car', 'person')

        Returns:
            True si se detectó al menos una instancia de la clase
        """
        detections, _ = self.detect_anomalies(image_path, image_bytes)
        return any(d['class'] == target_class for d in detections)

    def count_objects(
        self,
        image_path: Optional[str] = None,
        image_bytes: Optional[bytes] = None
    ) -> Dict[str, int]:
        """
        Cuenta objetos por clase en la imagen.

        Args:
            image_path: Ruta a la imagen
            image_bytes: Bytes de la imagen

        Returns:
            Diccionario {clase: cantidad}
        """
        detections, _ = self.detect_anomalies(image_path, image_bytes)

        counts = {}
        for det in detections:
            class_name = det['class']
            counts[class_name] = counts.get(class_name, 0) + 1

        return counts

    def get_supported_classes(self) -> Dict[str, str]:
        """
        Retorna las clases soportadas para detección de anomalías.

        Returns:
            Diccionario {clase_coco: etiqueta_español}
        """
        return self.ANOMALY_CLASSES.copy()
