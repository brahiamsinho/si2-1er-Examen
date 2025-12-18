"""
Servicio OCR local usando Tesseract (fallback gratuito cuando Azure CV falla).

Este servicio no requiere API keys ni conexión a internet.
Usa configuración centralizada sin valores hardcodeados.
"""
import logging
import re
from typing import Optional, Tuple, List
from io import BytesIO

import cv2
import numpy as np
import pytesseract
from PIL import Image
from django.conf import settings

from .ocr_config import OCRConfig, OCR_CONFUSIONS

logger = logging.getLogger(__name__)


class TesseractOCRService:
    """
    Servicio OCR local usando Tesseract para lectura de placas vehiculares.
    
    Ventajas:
    - 100% gratis, sin límites de API
    - Funciona offline (sin internet)
    - No requiere credenciales
    - Configuración flexible por región
    
    Desventajas:
    - Menos preciso que Azure CV sin preprocesamiento
    - Requiere instalación de tesseract-ocr en el sistema
    """
    
    def __init__(self, config: Optional[OCRConfig] = None):
        """
        Inicializar servicio Tesseract OCR.
        
        Args:
            config: Configuración OCR personalizada (opcional)
        """
        self.available = self._check_tesseract_availability()
        
        # Cargar configuración desde settings o usar proporcionada
        if config is None:
            self.config = OCRConfig(
                region=getattr(settings, 'OCR_REGION', 'BOLIVIA'),
                target_width=getattr(settings, 'OCR_TARGET_WIDTH', 400),
                min_confidence=getattr(settings, 'OCR_MIN_CONFIDENCE', 0.7),
                fragment_threshold=getattr(settings, 'OCR_FRAGMENT_THRESHOLD', 20),
                psm_modes=getattr(settings, 'OCR_PSM_MODES', [7, 8, 13, 6]),
                character_whitelist=getattr(settings, 'OCR_CHARACTER_WHITELIST', 
                                           'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'),
            )
        else:
            self.config = config
        
        if self.available:
            logger.info(f"✅ Tesseract OCR disponible como fallback")
            logger.info(f"📋 Configuración: {self.config}")
        else:
            logger.warning("⚠️ Tesseract OCR no disponible. Instala: apt-get install tesseract-ocr")
    
    def _check_tesseract_availability(self) -> bool:
        """Verificar si Tesseract está instalado."""
        try:
            pytesseract.get_tesseract_version()
            return True
        except Exception as e:
            logger.error(f"Tesseract no disponible: {e}")
            return False
    
    def preprocess_plate_image(self, image_bytes: bytes, aggressive: bool = False, strategy: str = 'normal') -> np.ndarray:
        """
        Preprocesar imagen de placa para mejorar OCR.
        
        Usa configuración centralizada sin valores hardcodeados.
        
        Aplica las siguientes transformaciones:
        1. Redimensionamiento inteligente (configurable)
        2. Conversión a escala de grises
        3. Filtro bilateral (reducción de ruido)
        4. CLAHE (mejora de contraste adaptativo)
        5. Sharpening (aumento de nitidez)
        6. Umbralización adaptativa (binarización)
        7. Operaciones morfológicas (erosión/dilatación)
        
        Args:
            image_bytes: Bytes de la imagen
            aggressive: Si True, usa preprocesamiento más agresivo
            strategy: Estrategia específica ('normal', 'shadow', 'worn', 'otsu', 'plate_detect')
            
        Returns:
            Imagen preprocesada como numpy array
        """
        try:
            # Convertir bytes a numpy array
            nparr = np.frombuffer(image_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if img is None:
                raise ValueError("No se pudo decodificar la imagen")
            
            # 1. Redimensionamiento inteligente (usa config.preprocessing.target_width)
            height, width = img.shape[:2]
            target_width = self.config.preprocessing.target_width
            min_width = self.config.preprocessing.min_width_scale
            max_width = self.config.preprocessing.max_width_scale
            
            if width < min_width:
                # Imagen muy pequeña, escalar
                scale_factor = self.config.preprocessing.scale_factor_small
            elif width > max_width:
                # Imagen muy grande, reducir
                scale_factor = target_width / width
            else:
                # Tamaño aceptable
                scale_factor = 1.0
            
            if scale_factor != 1.0:
                new_width = int(width * scale_factor)
                new_height = int(height * scale_factor)
                img = cv2.resize(img, (new_width, new_height), interpolation=cv2.INTER_CUBIC)
                logger.debug(f"📐 Redimensionado: {width}x{height} → {new_width}x{new_height} (factor: {scale_factor:.2f})")
            
            # 2. Convertir a escala de grises
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            
            # === ESTRATEGIAS ESPECÍFICAS ===
            
            # Estrategia para placas con sombras
            if strategy == 'shadow':
                # Normalizar iluminación usando división por desenfoque
                blur = cv2.GaussianBlur(gray, (21, 21), 0)
                normalized = cv2.divide(gray, blur, scale=255)
                gray = normalized
            
            # Estrategia para placas desgastadas/rayadas
            elif strategy == 'worn':
                # Reducción agresiva de ruido
                denoised = cv2.fastNlMeansDenoising(gray, None, h=10, templateWindowSize=7, searchWindowSize=21)
                gray = denoised
            
            # Estrategia OTSU (binarización automática)
            elif strategy == 'otsu':
                # Aplicar desenfoque gaussiano
                blur = cv2.GaussianBlur(gray, (5, 5), 0)
                # Umbralización OTSU
                _, binary = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
                return binary
            
            # Estrategia de detección de placa (recorte automático)
            elif strategy == 'plate_detect':
                processed = self._detect_and_crop_plate(img)
                if processed is not None:
                    gray = processed
            
            # 3. Filtro bilateral para reducir ruido manteniendo bordes
            denoised = cv2.bilateralFilter(gray, 11, 17, 17)
            
            # 4. CLAHE (Contrast Limited Adaptive Histogram Equalization)
            clip_limit = 3.0 if aggressive else 2.0
            clahe = cv2.createCLAHE(clipLimit=clip_limit, tileGridSize=(8,8))
            enhanced = clahe.apply(denoised)
            
            # 5. Sharpening (aumentar nitidez de caracteres)
            kernel_sharpen = np.array([[-1,-1,-1],
                                       [-1, 9,-1],
                                       [-1,-1,-1]])
            sharpened = cv2.filter2D(enhanced, -1, kernel_sharpen)
            
            # 6. Umbralización adaptativa (binarización)
            binary = cv2.adaptiveThreshold(
                sharpened,
                255,
                cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                cv2.THRESH_BINARY,
                11,
                2
            )
            
            # 7. Operaciones morfológicas para limpiar la imagen
            if aggressive:
                # Más agresivo: erosión + dilatación
                kernel = np.ones((2,2), np.uint8)
                processed = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel)
                processed = cv2.morphologyEx(processed, cv2.MORPH_OPEN, kernel)
            else:
                # Normal
                kernel = np.ones((2,2), np.uint8)
                processed = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel)
            
            return processed
            
        except Exception as e:
            logger.error(f"Error en preprocesamiento: {str(e)}")
            # Retornar imagen original en escala de grises como fallback
            nparr = np.frombuffer(image_bytes, np.uint8)
            return cv2.imdecode(nparr, cv2.IMREAD_GRAYSCALE)
    
    def _detect_and_crop_plate(self, img: np.ndarray) -> Optional[np.ndarray]:
        """
        Detectar y recortar la región de la placa usando detección de contornos.
        
        Args:
            img: Imagen original en color
            
        Returns:
            Imagen recortada en escala de grises o None si no se detecta
        """
        try:
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            
            # Aplicar desenfoque para reducir ruido
            blur = cv2.GaussianBlur(gray, (5, 5), 0)
            
            # Detectar bordes con Canny
            edges = cv2.Canny(blur, 50, 150)
            
            # Encontrar contornos
            contours, _ = cv2.findContours(edges, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
            
            # Buscar contornos rectangulares (placas suelen ser rectangulares)
            for contour in sorted(contours, key=cv2.contourArea, reverse=True)[:10]:
                # Aproximar contorno a polígono
                perimeter = cv2.arcLength(contour, True)
                approx = cv2.approxPolyDP(contour, 0.02 * perimeter, True)
                
                # Si tiene 4 vértices (rectángulo)
                if len(approx) == 4:
                    x, y, w, h = cv2.boundingRect(approx)
                    
                    # Validar proporciones típicas de placa (ancho > alto)
                    aspect_ratio = w / float(h)
                    if 2.0 <= aspect_ratio <= 5.0:
                        # Validar área mínima
                        if w * h > 1000:
                            # Recortar región
                            plate_region = gray[y:y+h, x:x+w]
                            return plate_region
            
            return None
            
        except Exception as e:
            logger.debug(f"Error en detección de placa: {str(e)}")
            return None
    
    def _fix_common_ocr_errors(self, text: str) -> str:
        """
        Corregir errores comunes de OCR en placas bolivianas.
        
        Formato boliviano moderno: 1234ABC (4 dígitos + 3 letras)
        Formato tradicional: ABC1234 (3 letras + 4 dígitos)
        
        Args:
            text: Texto a corregir
            
        Returns:
            Texto corregido
        """
        if not text or len(text) < 6:
            return text
        
        text = text.upper().strip()
        
        # Si tiene exactamente 7 caracteres, intentar corregir posición por posición
        if len(text) == 7:
            result = list(text)
            
            # Detectar si es formato 1234ABC o ABC1234
            # Contar dígitos en primeras 4 posiciones vs últimas 4
            first_four_digits = sum(1 for c in text[:4] if c.isdigit())
            last_four_digits = sum(1 for c in text[3:] if c.isdigit())
            
            if first_four_digits >= 2:  # Probablemente formato 1234ABC
                # Posiciones 0-3 deben ser dígitos
                for i in range(4):
                    c = result[i]
                    if c == 'O': result[i] = '0'
                    elif c == 'I': result[i] = '1'
                    elif c == 'L': result[i] = '1'
                    elif c == 'S': result[i] = '5'
                    elif c == 'B' and i < 2: result[i] = '8'  # B→8 solo al inicio
                    elif c == 'Z': result[i] = '2'
                    elif c == 'G': result[i] = '6'
                    elif c == 'T': result[i] = '7'
                    elif c == 'F': result[i] = '1'  # F→1 MUY COMÚN
                    elif c == 'A' and i == 0: result[i] = '4'  # A→4 solo al inicio
                
                # Posiciones 4-6 deben ser letras
                for i in range(4, 7):
                    c = result[i]
                    if c == '0': result[i] = 'O'
                    elif c == '1': result[i] = 'I'
                    elif c == '8': result[i] = 'B'
                    elif c == '5': result[i] = 'S'
                    elif c == '6': result[i] = 'G'
                    elif c == '2': result[i] = 'Z'
                    elif c == '7': result[i] = 'T'
                    # U→D al final es común
                    if i == 6 and result[i] == 'U':
                        result[i] = 'D'
            
            elif last_four_digits >= 2:  # Probablemente formato ABC1234
                # Posiciones 0-2 deben ser letras
                for i in range(3):
                    c = result[i]
                    if c == '0': result[i] = 'O'
                    elif c == '1': result[i] = 'I'
                    elif c == '8': result[i] = 'B'
                    elif c == '5': result[i] = 'S'
                
                # Posiciones 3-6 deben ser dígitos
                for i in range(3, 7):
                    c = result[i]
                    if c == 'O': result[i] = '0'
                    elif c == 'I': result[i] = '1'
                    elif c == 'L': result[i] = '1'
                    elif c == 'S': result[i] = '5'
                    elif c == 'B': result[i] = '8'
                    elif c == 'Z': result[i] = '2'
                    elif c == 'G': result[i] = '6'
            
            return ''.join(result)
        
        return text
    
    def _force_bolivian_format(self, text: str) -> Optional[str]:
        """
        Forzar texto de 7 caracteres a formato boliviano válido.
        
        Intenta interpretar como:
        - 4 dígitos + 3 letras (1234ABC) - formato moderno
        - 3 letras + 4 dígitos (ABC1234) - formato tradicional
        
        Args:
            text: Texto de 7 caracteres
            
        Returns:
            Placa corregida o None si no es posible
        """
        if len(text) != 7:
            return None
        
        text = text.upper()
        
        # Mapeo de confusiones letra→dígito (incluye F→1 que es MUY común)
        to_digit = {'O': '0', 'I': '1', 'L': '1', 'S': '5', 'B': '8', 'Z': '2', 'G': '6', 'T': '7', 'A': '4', 'F': '1'}
        # Mapeo de confusiones dígito→letra  
        to_letter = {'0': 'O', '1': 'I', '8': 'B', '5': 'S', '6': 'G', '2': 'Z', '7': 'T', '4': 'A'}
        
        # Intento 1: Formato 1234ABC (moderno boliviano)
        digits = ''
        letters = ''
        for i, c in enumerate(text):
            if i < 4:  # Primeros 4 deben ser dígitos
                if c.isdigit():
                    digits += c
                elif c in to_digit:
                    digits += to_digit[c]
                else:
                    digits += c  # Mantener aunque sea raro
            else:  # Últimos 3 deben ser letras
                if c.isalpha():
                    letters += c
                elif c in to_letter:
                    letters += to_letter[c]
                else:
                    letters += c
        
        candidate1 = digits + letters
        if len(candidate1) == 7 and candidate1[:4].isdigit() and candidate1[4:].isalpha():
            return candidate1
        
        # Intento 2: Formato ABC1234 (tradicional)
        letters = ''
        digits = ''
        for i, c in enumerate(text):
            if i < 3:  # Primeros 3 deben ser letras
                if c.isalpha():
                    letters += c
                elif c in to_letter:
                    letters += to_letter[c]
                else:
                    letters += c
            else:  # Últimos 4 deben ser dígitos
                if c.isdigit():
                    digits += c
                elif c in to_digit:
                    digits += to_digit[c]
                else:
                    digits += c
        
        candidate2 = letters + digits
        if len(candidate2) == 7 and candidate2[:3].isalpha() and candidate2[3:].isdigit():
            return candidate2
        
        return None
    
    def _apply_smart_corrections(self, text: str) -> List[Tuple[str, int]]:
        """
        Corrección rápida basada en patrones bolivianos (O(n) - sin combinatorias).
        Detecta formato 4 dígitos + 3 letras y corrige errores comunes.
        """
        text = text.upper().strip()
        
        if len(text) != 7:
            return [(text, 0)]
        
        digit_count = sum(c.isdigit() for c in text)
        letter_count = sum(c.isalpha() for c in text)
        
        if digit_count < 3 or letter_count < 2:
            return [(text, 0)]
        
        candidates = []
        
        if text[:4].replace('O', '0').replace('I', '1').replace('L', '1').replace('S', '5').replace('B', '8').isdigit():
            digits = text[:4]
            letters = text[4:]
            
            digits = digits.replace('O', '0').replace('I', '1').replace('L', '1').replace('S', '5').replace('B', '8').replace('Z', '2').replace('G', '6')
            
            letters = letters.replace('0', 'O').replace('1', 'I').replace('8', 'B').replace('5', 'S').replace('6', 'G').replace('2', 'Z')
            letters = letters.replace('D', 'D').replace('P', 'P').replace('H', 'H')
            
            candidate = digits + letters
            if candidate != text and self.config.is_valid_plate(candidate):
                candidates.append((candidate, 100))
        
        if text[4:].replace('O', '0').replace('I', '1').isdigit() or letter_count >= 3:
            letters = text[:3]
            digits = text[3:]
            
            letters = letters.replace('0', 'O').replace('1', 'I').replace('8', 'B').replace('5', 'S').replace('6', 'G').replace('2', 'Z')
            
            digits = digits.replace('O', '0').replace('I', '1').replace('L', '1').replace('S', '5').replace('B', '8').replace('Z', '2').replace('G', '6')
            
            candidate = letters + digits
            if candidate != text and self.config.is_valid_plate(candidate):
                candidates.append((candidate, 100))
        
        corrected = ''
        for i, char in enumerate(text):
            if i < 4:
                if char == 'O': corrected += '0'
                elif char == 'I': corrected += '1'
                elif char == 'L': corrected += '1'
                elif char == 'S': corrected += '5'
                elif char == 'B' and not char.isdigit(): corrected += '8'
                else: corrected += char
            else:
                if char == '0': corrected += 'O'
                elif char == '1': corrected += 'I'
                elif char == '8': corrected += 'B'
                elif char == '5': corrected += 'S'
                else: corrected += char
        
        if corrected != text and self.config.is_valid_plate(corrected):
            candidates.append((corrected, 90))
        
        if not candidates:
            return [(text, 0)]
        
        return candidates[:3]
    
    def read_plate(
        self,
        image_path: Optional[str] = None,
        image_bytes: Optional[bytes] = None,
        preprocess: bool = True
    ) -> Tuple[Optional[str], float]:
        """
        Leer placa vehicular usando Tesseract OCR con múltiples estrategias.
        
        Args:
            image_path: Ruta a la imagen (opcional)
            image_bytes: Bytes de la imagen (opcional)
            preprocess: Si True, preprocesa la imagen antes de OCR
            
        Returns:
            Tupla (plate_text, confidence) donde:
            - plate_text: Texto de la placa o None si no se encontró
            - confidence: Nivel de confianza (0.0 - 1.0)
        """
        if not self.available:
            logger.error("Tesseract no disponible")
            return None, 0.0
        
        try:
            # Obtener bytes de la imagen
            if image_path:
                with open(image_path, 'rb') as f:
                    image_data = f.read()
            elif image_bytes:
                image_data = image_bytes
            else:
                raise ValueError("Must provide either image_path or image_bytes")
            
            strategies = []
            whitelist = self.config.get_whitelist_config()
            
            # Estrategia 1: Preprocesamiento normal con diferentes PSM
            if preprocess:
                processed_img = self.preprocess_plate_image(image_data, aggressive=False, strategy='normal')
                strategies.append(('preprocesada + PSM 7', processed_img, '--oem 3 --psm 7'))
                strategies.append(('preprocesada + PSM 8', processed_img, '--oem 3 --psm 8'))
                strategies.append(('preprocesada + PSM 6', processed_img, '--oem 3 --psm 6'))
            
            # Estrategia 2: Preprocesamiento agresivo
            if preprocess:
                aggressive_img = self.preprocess_plate_image(image_data, aggressive=True, strategy='normal')
                strategies.append(('agresiva + PSM 7', aggressive_img, '--oem 3 --psm 7'))
                strategies.append(('agresiva + PSM 8', aggressive_img, '--oem 3 --psm 8'))
            
            # Estrategia 3: OTSU (binarización automática)
            if preprocess:
                otsu_img = self.preprocess_plate_image(image_data, aggressive=False, strategy='otsu')
                strategies.append(('otsu + PSM 7', otsu_img, '--oem 3 --psm 7'))
            
            # Estrategia 4: Original sin preprocesamiento
            nparr = np.frombuffer(image_data, np.uint8)
            gray_img = cv2.imdecode(nparr, cv2.IMREAD_GRAYSCALE)
            strategies.append(('original + PSM 7', gray_img, '--oem 3 --psm 7'))
            strategies.append(('original + PSM 8', gray_img, '--oem 3 --psm 8'))
            
            logger.info(f"🔍 Probando {len(strategies)} estrategias OCR...")
            
            # Almacenar todos los candidatos detectados para análisis
            all_candidates = []
            
            best_result = None
            best_confidence = 0.0
            
            for strategy_name, img, base_config in strategies:
                config = base_config + whitelist
                
                try:
                    full_text = pytesseract.image_to_string(img, config=config)
                    cleaned_text = re.sub(r'[^A-Z0-9]', '', full_text.upper().strip())
                    
                    # LOG DETALLADO: Ver qué está leyendo (usar WARNING para que sea visible)
                    if cleaned_text:
                        logger.warning(f"📋 {strategy_name}: RAW='{cleaned_text}'")
                    
                    # Aplicar corrección de errores comunes
                    corrected_text = self._fix_common_ocr_errors(cleaned_text)
                    
                    if corrected_text != cleaned_text:
                        logger.warning(f"  ↳ Corregido: '{cleaned_text}' → '{corrected_text}'")
                    
                    # Guardar todos los candidatos de 6-7 caracteres
                    if len(corrected_text) >= 6 and len(corrected_text) <= 10:
                        all_candidates.append((corrected_text, strategy_name))
                    
                    # Aplicar correcciones inteligentes basadas en confusiones OCR
                    correction_candidates = self._apply_smart_corrections(corrected_text)
                    
                    # Buscar patrones de placa en el texto
                    potential_plates = []
                    
                    # Procesar candidatos de corrección inteligente
                    for candidate, score in correction_candidates:
                        if candidate:
                            # Guardar todos los candidatos de corrección
                            if len(candidate) >= 6 and (candidate, strategy_name) not in all_candidates:
                                all_candidates.append((candidate, strategy_name + " (corr)"))
                            
                            if self.config.is_valid_plate(candidate):
                                if candidate not in potential_plates:
                                    potential_plates.append(candidate)
                                    logger.info(f"  🔧 VÁLIDO tras corrección: '{candidate}'")
                    
                    # Validar texto corregido original si no está en candidatos
                    if corrected_text and self.config.is_valid_plate(corrected_text):
                        if corrected_text not in potential_plates:
                            potential_plates.append(corrected_text)
                            logger.info(f"  ✓ VÁLIDO: '{corrected_text}'")
                    
                    # Probar validación con texto original (sin corrección)
                    if cleaned_text and cleaned_text != corrected_text and self.config.is_valid_plate(cleaned_text):
                        if cleaned_text not in potential_plates:
                            potential_plates.append(cleaned_text)
                            logger.info(f"  ✓ VÁLIDO (sin corrección): '{cleaned_text}'")
                    
                    # Buscar fragmentos de placa con image_to_data (SOLO si no hay candidatos)
                    if not potential_plates:
                        result = pytesseract.image_to_data(
                            img,
                            config=config,
                            output_type=pytesseract.Output.DICT
                        )
                        
                        # Usar umbral desde configuración
                        fragment_threshold = self.config.strategy.fragment_threshold
                        for i, conf in enumerate(result['conf']):
                            if int(conf) > fragment_threshold:
                                text = result['text'][i].strip().upper()
                                text = re.sub(r'[^A-Z0-9]', '', text)
                                text = self._fix_common_ocr_errors(text)
                                
                                if len(text) >= 5 and text not in potential_plates:
                                    # Validación usando configuración
                                    if self.config.is_valid_plate(text):
                                        potential_plates.append(text)
                                        logger.debug(f"  ↳ Fragmento válido: '{text}' (conf: {conf})")
                    
                    # Actualizar mejor resultado
                    if potential_plates:
                        # Filtrar placas válidas
                        valid_plates = [p for p in potential_plates if self.config.is_valid_plate(p)]
                        
                        if valid_plates:
                            best_plate = max(valid_plates, key=len)
                            # Usar confianza desde configuración
                            confidence = self.config.strategy.min_confidence
                            
                            if confidence > best_confidence or (confidence == best_confidence and len(best_plate) > len(best_result or '')):
                                best_result = best_plate
                                best_confidence = confidence
                                logger.debug(f"  ✓ Mejor resultado: '{best_result}' ({strategy_name}, conf: {confidence:.2f})")
                
                except Exception as e:
                    logger.debug(f"  ✗ Estrategia {strategy_name} falló: {str(e)}")
                    continue
            
            if best_result:
                logger.info(f"✅ Tesseract detectó placa: {best_result} (confianza: {best_confidence:.2f})")
                return best_result, best_confidence
            else:
                # FALLBACK: Si no hay placas válidas, intentar forzar corrección en los mejores candidatos
                logger.warning(f"⚠️ No se encontró placa válida. Candidatos detectados: {len(all_candidates)}")
                for candidate, src in all_candidates[:5]:
                    logger.warning(f"  📝 Candidato: '{candidate}' (desde: {src})")
                
                # Intentar forzar corrección en candidatos de 6-8 caracteres
                for candidate, src in all_candidates:
                    if 6 <= len(candidate) <= 8:
                        # Forzar formato boliviano 1234ABC
                        forced = self._force_bolivian_format(candidate)
                        if forced and self.config.is_valid_plate(forced):
                            logger.warning(f"✅ Placa forzada: '{forced}' (original: '{candidate}')")
                            return forced, 0.65
                        else:
                            logger.warning(f"  ❌ No se pudo forzar: '{candidate}' → '{forced}' (válida: {self.config.is_valid_plate(forced) if forced else False})")
                
                # ÚLTIMO INTENTO: Si el candidato tiene 7 chars y parece placa, devolverlo igual
                for candidate, src in all_candidates:
                    if len(candidate) == 7:
                        # Verificar si tiene al menos algunos dígitos y letras
                        has_digits = any(c.isdigit() for c in candidate)
                        has_letters = any(c.isalpha() for c in candidate)
                        if has_digits and has_letters:
                            logger.warning(f"⚠️ Devolviendo candidato sin validar: '{candidate}' (formato mixto)")
                            return candidate, 0.5
                
                logger.warning("❌ Tesseract no detectó placa válida en ninguna estrategia")
                return None, 0.0
            
        except Exception as e:
            logger.error(f"❌ Error en Tesseract OCR: {str(e)}", exc_info=True)
            return None, 0.0
