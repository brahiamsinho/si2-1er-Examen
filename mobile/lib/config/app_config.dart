/// Configuración de la aplicación
class AppConfig {
  // URLs del backend
  // IMPORTANTE: Para depuración inalámbrica desde teléfono físico,
  // usa tu IP local (la de tu computadora en la red WiFi)
  static const String _physicalDeviceUrl = "http://192.168.0.143:8000"; // Tu IP local
  static const String _emulatorUrl = "http://10.0.2.2:8000"; // IP especial del emulador Android
  static const String _cloudUrl = "http://3.230.69.204:8000";
  
  // Cambiar esta variable según el entorno de pruebas
  static const _BackendMode _backendMode = _BackendMode.physicalDevice;
  
  /// URL base de la API
  static String get apiBaseUrl {
    switch (_backendMode) {
      case _BackendMode.physicalDevice:
        return _physicalDeviceUrl;
      case _BackendMode.emulator:
        return _emulatorUrl;
      case _BackendMode.cloud:
        return _cloudUrl;
    }
  }
  
  /// URL completa de la API con el prefijo /api
  static String get apiUrl => "$apiBaseUrl/api";
  
  /// Configuración de timeouts
  static const Duration requestTimeout = Duration(seconds: 30);
  static const Duration connectionTimeout = Duration(seconds: 15);
  
  /// Configuración de la aplicación
  static const String appName = "Condominio Smart";
  static const String appVersion = "1.0.0";
  
  /// Configuración de notificaciones
  static const String notificationChannelId = "condominio_notifications";
  static const String notificationChannelName = "Notificaciones del Condominio";
  
  /// Configuración de debug
  static const bool isDebugMode = true;
  
  /// Información del entorno actual
  static String get environmentInfo {
    switch (_backendMode) {
      case _BackendMode.physicalDevice:
        return "Dispositivo físico";
      case _BackendMode.emulator:
        return "Emulador";
      case _BackendMode.cloud:
        return "Nube";
    }
  }
  
  /// Método para obtener información de configuración
  static Map<String, dynamic> getConfigInfo() {
    return {
      'environment': environmentInfo,
      'apiBaseUrl': apiBaseUrl,
      'apiUrl': apiUrl,
      'appName': appName,
      'appVersion': appVersion,
      'isDebugMode': isDebugMode,
    };
  }
}

/// Enum para modo de backend
enum _BackendMode {
  physicalDevice, // Teléfono físico conectado por WiFi
  emulator,       // Emulador Android
  cloud,          // Servidor en la nube
}

/// Enum para diferentes entornos (legacy)
enum Environment {
  local,
  cloud,
  production,
}

/// Configuración avanzada por entorno
class EnvironmentConfig {
  static const Map<Environment, Map<String, String>> _configs = {
    Environment.local: {
      'baseUrl': 'http://10.0.2.2:8000',
      'name': 'Local',
    },
    Environment.cloud: {
      'baseUrl': 'http://3.230.69.204:8000',
      'name': 'Nube AWS',
    },
    Environment.production: {
      'baseUrl': 'https://tu-dominio.com',
      'name': 'Producción',
    },
  };
  
  static Map<String, String> getConfig(Environment env) {
    return _configs[env] ?? _configs[Environment.local]!;
  }
}
