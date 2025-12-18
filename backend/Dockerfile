FROM python:3.12-slim

WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    TZ=America/La_Paz

# Configurar zona horaria
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Dependencias para psycopg2 + IA (tesseract, OpenCV)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libpq-dev bash tzdata \
    libglib2.0-0 libsm6 libxext6 libxrender-dev libgomp1 \
    libglib2.0-0 libgtk-3-0 libavcodec-dev libavformat-dev libswscale-dev \
    tesseract-ocr tesseract-ocr-spa tesseract-ocr-eng \
    libgl1 \
    && rm -rf /var/lib/apt/lists/*

# Requisitos primero (mejor cache)
COPY requirements.txt /app/
RUN pip install -r requirements.txt

# Pre-descargar modelo YOLOv8 (evita descarga en runtime)
RUN mkdir -p /app/ai_models && \
    python -c "from ultralytics import YOLO; YOLO('yolov8n.pt')" && \
    mv ~/.cache/ultralytics/* /app/ai_models/ || true

# Código
COPY . /app/

EXPOSE 8000
