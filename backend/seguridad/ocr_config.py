"""
Configuración centralizada para OCR de placas vehiculares.

Este módulo contiene toda la configuración de Tesseract OCR sin valores hardcodeados.
"""
import re
from dataclasses import dataclass
from typing import List, Dict, Tuple


@dataclass
class OCRPreprocessingConfig:
    """Configuración de preprocesamiento de imágenes."""
    target_width: int = 400
    min_width_scale: int = 200
    max_width_scale: int = 600
    scale_factor_small: float = 2.0
    clahe_clip_limit: float = 2.0
    clahe_tile_size: Tuple[int, int] = (8, 8)
    bilateral_d: int = 9
    bilateral_sigma_color: int = 75
    bilateral_sigma_space: int = 75


@dataclass
class OCRValidationConfig:
    """Configuración de validación de placas por región."""
    region: str
    patterns: List[str]
    min_length: int
    max_length: int
    description: str


# Configuraciones por región
BOLIVIA_CONFIG = OCRValidationConfig(
    region="BOLIVIA",
    patterns=[
        r'^[A-Z]{3}\d{4}$',      # ABC1234 (tradicional)
        r'^\d{4}[A-Z]{3}$',      # 1234ABC (moderno)
        r'^[A-Z]{2}\d{3}[A-Z]$', # AB123C (antiguo)
        r'^[A-Z]{3}\d{3}$',      # ABC123 (taxi/otros)
    ],
    min_length=6,
    max_length=7,
    description="Placas bolivianas (ABC1234 o 1234ABC)"
)

ARGENTINA_CONFIG = OCRValidationConfig(
    region="ARGENTINA",
    patterns=[
        r'^[A-Z]{3}\d{3}$',      # ABC123
        r'^[A-Z]{2}\d{3}[A-Z]{2}$',  # AB123CD
    ],
    min_length=6,
    max_length=7,
    description="Placas argentinas (ABC123 o AB123CD)"
)

# Mapa de configuraciones por región
REGION_CONFIGS: Dict[str, OCRValidationConfig] = {
    "BOLIVIA": BOLIVIA_CONFIG,
    "ARGENTINA": ARGENTINA_CONFIG,
}


@dataclass
class OCRStrategyConfig:
    """Configuración de estrategias de OCR."""
    psm_modes: List[int]
    use_preprocessing: bool
    use_aggressive: bool
    character_whitelist: str
    min_confidence: float
    fragment_threshold: int


# Configuración de Tesseract PSM (Page Segmentation Mode)
# Referencia: https://tesseract-ocr.github.io/tessdoc/ImproveQuality.html
PSM_MODES = {
    6: "Uniform block of text",      # Texto uniforme
    7: "Single text line",            # Línea única (MEJOR para placas)
    8: "Single word",                 # Palabra única
    13: "Raw line (bypass layout)",   # Línea raw (sin análisis de layout)
}

# Estrategia por defecto para placas
DEFAULT_STRATEGY = OCRStrategyConfig(
    psm_modes=[7, 8, 13, 6],  # Probar en este orden
    use_preprocessing=True,
    use_aggressive=True,
    character_whitelist='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
    min_confidence=0.7,
    fragment_threshold=20,
)


class OCRConfig:
    """
    Configuración global de OCR.
    
    Centraliza toda la configuración sin hardcoding.
    """
    
    def __init__(
        self,
        region: str = "BOLIVIA",
        target_width: int = 400,
        min_confidence: float = 0.7,
        fragment_threshold: int = 20,
        psm_modes: List[int] = None,
        character_whitelist: str = None,
    ):
        """
        Inicializar configuración OCR.
        
        Args:
            region: Región para validación de placas
            target_width: Ancho objetivo para redimensionar imagen
            min_confidence: Confianza mínima para aceptar resultado
            fragment_threshold: Umbral de confianza para fragmentos
            psm_modes: Modos PSM de Tesseract a probar
            character_whitelist: Caracteres permitidos
        """
        self.preprocessing = OCRPreprocessingConfig(target_width=target_width)
        
        # Configuración de región
        if region not in REGION_CONFIGS:
            raise ValueError(f"Región '{region}' no soportada. Opciones: {list(REGION_CONFIGS.keys())}")
        self.validation = REGION_CONFIGS[region]
        
        # Configuración de estrategia
        self.strategy = OCRStrategyConfig(
            psm_modes=psm_modes or DEFAULT_STRATEGY.psm_modes,
            use_preprocessing=DEFAULT_STRATEGY.use_preprocessing,
            use_aggressive=DEFAULT_STRATEGY.use_aggressive,
            character_whitelist=character_whitelist or DEFAULT_STRATEGY.character_whitelist,
            min_confidence=min_confidence,
            fragment_threshold=fragment_threshold,
        )
    
    def is_valid_plate(self, text: str) -> bool:
        """
        Validar si el texto cumple con el patrón de placa de la región.
        
        Args:
            text: Texto a validar
            
        Returns:
            True si es válido según los patrones de la región
        """
        text = text.strip().upper().replace(' ', '').replace('-', '')
        
        if not (self.validation.min_length <= len(text) <= self.validation.max_length):
            return False
        
        return any(re.match(pattern, text) for pattern in self.validation.patterns)
    
    def get_psm_configs(self) -> List[Tuple[str, str]]:
        """
        Obtener configuraciones de PSM para Tesseract.
        
        Returns:
            Lista de tuplas (nombre, config_string)
        """
        configs = []
        for psm in self.strategy.psm_modes:
            description = PSM_MODES.get(psm, f"PSM {psm}")
            config = f'--oem 3 --psm {psm}'
            configs.append((f"PSM {psm} ({description})", config))
        return configs
    
    def get_whitelist_config(self) -> str:
        """
        Obtener configuración de whitelist para Tesseract.
        
        Returns:
            String de configuración
        """
        return f' -c tessedit_char_whitelist={self.strategy.character_whitelist}'
    
    def __repr__(self) -> str:
        """Representación string de la configuración."""
        return (
            f"OCRConfig(\n"
            f"  región={self.validation.region},\n"
            f"  target_width={self.preprocessing.target_width},\n"
            f"  min_confidence={self.strategy.min_confidence},\n"
            f"  psm_modes={self.strategy.psm_modes}\n"
            f")"
        )


OCR_CONFUSIONS = {
    'LETTER_TO_LETTER': {
        'B': ['8', 'D', 'P', 'R'],
        'D': ['B', 'O', 'Q', '0'],
        'O': ['0', 'D', 'Q'],
        'I': ['1', 'L', 'J', '1'],
        'L': ['1', 'I', 'J'],
        'P': ['B', 'R', 'F'],
        'S': ['5', '8'],
        'Z': ['2', '7'],
        'G': ['6', 'C'],
        'Q': ['0', 'O'],
        'U': ['V', 'Y'],
        'V': ['U', 'Y'],
        'H': ['N', 'M', 'K', 'R'],
        'K': ['H', 'R', 'X'],
        'M': ['N', 'W', 'H'],
        'N': ['M', 'H'],
        'W': ['M', 'VV'],
        'E': ['F', '3'],
        'F': ['E', 'P'],
        'C': ['G', 'O', '0'],
        'A': ['4', 'R'],
        'R': ['P', 'K', 'B'],
        'T': ['I', '7', '1'],
        'Y': ['V', 'U'],
        'J': ['I', '1', 'L'],
        'X': ['K', 'Y'],
    },
    'DIGIT_TO_DIGIT': {
        '0': ['O', 'Q', 'D'],
        '1': ['I', 'L', 'J', 'T'],
        '2': ['Z', '7'],
        '3': ['8', 'B', 'E'],
        '4': ['A'],
        '5': ['S', '8'],
        '6': ['G', 'b'],
        '7': ['Z', 'T', '1'],
        '8': ['B', '3', 'S', '5'],
        '9': ['g', 'q'],
    }
}

