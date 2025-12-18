# Servicios de Inteligencia Artificial - Condominio Smart

Este módulo implementa servicios de IA para reconocimiento facial, OCR de placas vehiculares y detección de anomalías.

## 🎯 Características

### 1. Reconocimiento Facial (Azure Face API)
- Identificación de residentes mediante fotos
- Registro automático de rostros
- Modelo entrenado con Azure Cognitive Services
- Fallback a servicios locales si Azure no disponible

### 2. OCR de Placas (Azure Computer Vision + Tesseract)
- Lectura automática de placas vehiculares
- Preprocesamiento de imágenes para mejorar precisión
- Validación de formatos de placas bolivianas
- Backup con Tesseract OCR (100% offline)

### 3. Detección de Anomalías (YOLOv8)
- Detección de perros sueltos
- Vehículos mal estacionados
- Objetos abandonados (mochilas, maletas)
- Personas sospechosas
- Funciona 100% local (no requiere internet)

## 📦 Arquitectura

```
seguridad/
├── ai_orchestrator.py         # Orquestador principal (selecciona servicio según config)
├── azure_face_service.py      # Servicio de reconocimiento facial (Azure)
├── azure_cv_service.py        # Servicio de OCR (Azure Computer Vision)
├── yolo_service.py            # Servicio de detección de objetos (YOLOv8)
├── tesseract_service.py       # Servicio de OCR backup (Tesseract)
└── ia_views.py                # Endpoints REST API
```

## 🔧 Configuración

### 1. Variables de Entorno

Edita `backend/.env` y agrega:

```bash
# Azure Face API (Reconocimiento Facial)
AZURE_FACE_SUBSCRIPTION_KEY=tu_subscription_key
AZURE_FACE_ENDPOINT=https://tu-region.api.cognitive.microsoft.com/
AZURE_FACE_PERSON_GROUP_ID=condominio-residentes

# Azure Computer Vision (OCR)
AZURE_CV_SUBSCRIPTION_KEY=tu_subscription_key
AZURE_CV_ENDPOINT=https://tu-region.api.cognitive.microsoft.com/

# Configuración de Proveedores
AI_FACE_PROVIDER=azure          # Opciones: azure, local
AI_OCR_PROVIDER=azure           # Opciones: azure, local
AI_DETECTION_PROVIDER=local     # Opciones: local

# Thresholds de Confianza (0.0 - 1.0)
AI_FACE_CONFIDENCE_THRESHOLD=0.6
AI_OCR_CONFIDENCE_THRESHOLD=0.7
AI_DETECTION_CONFIDENCE_THRESHOLD=0.5
```

### 2. Obtener Credenciales Azure

#### Azure Face API:
1. Ir a [Azure Portal](https://portal.azure.com)
2. Crear recurso "Face"
3. Copiar **Key** y **Endpoint**

#### Azure Computer Vision:
1. Ir a [Azure Portal](https://portal.azure.com)
2. Crear recurso "Computer Vision"
3. Copiar **Key** y **Endpoint**

## 🚀 Instalación y Uso

### Paso 1: Rebuil Docker Containers

```bash
# Detener containers actuales
docker-compose down

# Reconstruir con nuevas dependencias
docker-compose up -d --build

# Esperar a que termine la build (puede tomar 5-10 minutos)
docker-compose logs -f backend
```

### Paso 2: Generar Dataset de Entrenamiento

```bash
# Generar fotos de rostros y placas
docker-compose exec backend python manage.py seed ia_dataset --force
```

Esto creará:
- `media/dataset/rostros/{residente_id}/` → 5 fotos por residente
- `media/dataset/placas/` → 20 placas sintéticas

### Paso 3: Entrenar Modelo de Reconocimiento Facial

```bash
# Entrenar modelo en Azure
docker-compose exec backend python manage.py train_face_model
```

**Salida esperada:**
```
================================================================================
ENTRENAMIENTO DE MODELO DE RECONOCIMIENTO FACIAL
================================================================================

📋 Paso 1: Creando PersonGroup...
  ✓ PersonGroup creado/verificado

📸 Paso 2: Procesando dataset de rostros...
  ✓ Encontrados 15 residentes con fotos

🔄 Paso 3: Registrando residentes en Azure...
  ✓ Juan Pérez: 5 fotos registradas
  ✓ María García: 5 fotos registradas
  ...

  📊 Registrados: 15, Errores: 0

🚀 Paso 4: Entrenando modelo...
  ⏳ Esto puede tomar unos minutos...
  ✓ Modelo entrenado exitosamente

================================================================================
✅ ENTRENAMIENTO COMPLETADO: 15 personas registradas
================================================================================
```

## 📡 API Endpoints

### Base URL
```
http://localhost:8000/api/seguridad/ia/
```

### 1. Identificar Rostro

**POST** `/identificar-rostro/`

**Body (multipart/form-data):**
```
image: [archivo de imagen]
```

O

**Body (JSON):**
```json
{
  "image_base64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ..."
}
```

**Response:**
```json
{
  "success": true,
  "person_id": "123",
  "confidence": 0.85,
  "message": "Persona identificada exitosamente"
}
```

### 2. Leer Placa

**POST** `/leer-placa/`

**Body:**
```
image: [archivo de imagen de placa]
```

**Response:**
```json
{
  "success": true,
  "plate": "ABC-1234",
  "confidence": 0.92,
  "message": "Placa leída exitosamente"
}
```

### 3. Detectar Anomalías

**POST** `/detectar-anomalias/`

**Body:**
```
image: [archivo de imagen]
return_image: true  (opcional)
```

**Response:**
```json
{
  "success": true,
  "detections": [
    {
      "class": "dog",
      "label": "Perro suelto",
      "confidence": 0.89,
      "bbox": {
        "x1": 100,
        "y1": 50,
        "x2": 200,
        "y2": 150
      }
    }
  ],
  "count": 1,
  "annotated_image": "base64...",
  "message": "Detección completada: 1 objetos encontrados"
}
```

### 4. Estado de Servicios

**GET** `/status/`

**Response:**
```json
{
  "providers": {
    "face": "azure",
    "ocr": "azure",
    "detection": "local"
  },
  "services_loaded": {
    "azure_face": true,
    "azure_cv": true,
    "yolo": true,
    "tesseract": false
  }
}
```

## 🧪 Pruebas con cURL

```bash
# 1. Identificar rostro
curl -X POST http://localhost:8000/api/seguridad/ia/identificar-rostro/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@/path/to/face.jpg"

# 2. Leer placa
curl -X POST http://localhost:8000/api/seguridad/ia/leer-placa/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@/path/to/plate.jpg"

# 3. Detectar anomalías
curl -X POST http://localhost:8000/api/seguridad/ia/detectar-anomalias/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@/path/to/scene.jpg" \
  -F "return_image=true"

# 4. Estado
curl -X GET http://localhost:8000/api/seguridad/ia/status/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## ⚙️ Configuración Avanzada

### Cambiar Proveedor de Servicios

```bash
# Usar solo servicios locales (sin Azure)
AI_FACE_PROVIDER=local        # ⚠️ No disponible aún
AI_OCR_PROVIDER=local         # Usa Tesseract
AI_DETECTION_PROVIDER=local   # Usa YOLOv8
```

### Ajustar Thresholds de Confianza

```bash
# Más estricto (menos falsos positivos)
AI_FACE_CONFIDENCE_THRESHOLD=0.8
AI_OCR_CONFIDENCE_THRESHOLD=0.9
AI_DETECTION_CONFIDENCE_THRESHOLD=0.7

# Menos estricto (más detecciones)
AI_FACE_CONFIDENCE_THRESHOLD=0.4
AI_OCR_CONFIDENCE_THRESHOLD=0.5
AI_DETECTION_CONFIDENCE_THRESHOLD=0.3
```

## 🐛 Troubleshooting

### Error: "Azure Face credentials not configured"
**Solución:** Verifica que `AZURE_FACE_SUBSCRIPTION_KEY` y `AZURE_FACE_ENDPOINT` estén en `.env`

### Error: "YOLO model not found"
**Solución:** El modelo se descarga automáticamente. Si falla, ejecuta:
```bash
docker-compose exec backend python -c "from ultralytics import YOLO; YOLO('yolov8n.pt')"
```

### Error: "Tesseract not found"
**Solución:** Rebuild container:
```bash
docker-compose up -d --build backend
```

### Baja precisión en OCR de placas
**Soluciones:**
1. Asegúrate que la foto esté bien iluminada
2. La placa debe estar centrada
3. Usa imágenes de al menos 640x480 píxeles
4. Baja el threshold: `AI_OCR_CONFIDENCE_THRESHOLD=0.5`

## 📊 Clases Detectables (YOLOv8)

| Clase COCO | Etiqueta Español | Uso |
|------------|------------------|-----|
| `dog` | Perro suelto | Seguridad |
| `cat` | Gato suelto | Seguridad |
| `car` | Vehículo | Estacionamiento |
| `truck` | Camión | Estacionamiento |
| `motorcycle` | Motocicleta | Estacionamiento |
| `bicycle` | Bicicleta | Objetos |
| `person` | Persona | Vigilancia |
| `backpack` | Mochila abandonada | Seguridad |
| `handbag` | Bolso abandonado | Seguridad |
| `suitcase` | Maleta abandonada | Seguridad |

## 📝 Notas Importantes

- **Azure Face API**: Gratis hasta 30,000 transacciones/mes
- **Azure Computer Vision**: Gratis hasta 5,000 transacciones/mes
- **YOLOv8**: 100% gratuito, funciona offline
- **Tesseract**: 100% gratuito, funciona offline

## 🔗 Referencias

- [Azure Face API Docs](https://learn.microsoft.com/en-us/azure/cognitive-services/computer-vision/overview-identity)
- [Azure Computer Vision Docs](https://learn.microsoft.com/en-us/azure/cognitive-services/computer-vision/overview-ocr)
- [Ultralytics YOLOv8](https://docs.ultralytics.com/)
- [Tesseract OCR](https://github.com/tesseract-ocr/tesseract)
