/// Modelo para representar una incidencia/reporte de problema
class Incidencia {
  final int? id;
  final String titulo;
  final String descripcion;
  final String categoriaIncidencia;
  final String? categoriaDisplay;
  final String? estado;
  final String? estadoDisplay;
  final String? prioridad;
  final String? prioridadDisplay;
  final String? ubicacionEspecifica;
  final DateTime? fechaCreacion;
  final DateTime? fechaLimite;
  final String? imagenUrl;
  final String? observaciones;

  Incidencia({
    this.id,
    required this.titulo,
    required this.descripcion,
    required this.categoriaIncidencia,
    this.categoriaDisplay,
    this.estado,
    this.estadoDisplay,
    this.prioridad,
    this.prioridadDisplay,
    this.ubicacionEspecifica,
    this.fechaCreacion,
    this.fechaLimite,
    this.imagenUrl,
    this.observaciones,
  });

  factory Incidencia.fromJson(Map<String, dynamic> json) {
    return Incidencia(
      id: json['id'],
      titulo: json['titulo'] ?? '',
      descripcion: json['descripcion'] ?? '',
      categoriaIncidencia: json['categoria_incidencia'] ?? '',
      categoriaDisplay: json['categoria_display'],
      estado: json['estado'],
      estadoDisplay: json['estado_display'],
      prioridad: json['prioridad'],
      prioridadDisplay: json['prioridad_display'],
      ubicacionEspecifica: json['ubicacion_especifica'],
      fechaCreacion: json['fecha_creacion'] != null
          ? DateTime.parse(json['fecha_creacion'])
          : null,
      fechaLimite: json['fecha_limite'] != null
          ? DateTime.parse(json['fecha_limite'])
          : null,
      imagenUrl: json['imagen_url'],
      observaciones: json['observaciones'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'titulo': titulo,
      'descripcion': descripcion,
      'categoria_incidencia': categoriaIncidencia,
      if (ubicacionEspecifica != null && ubicacionEspecifica!.isNotEmpty)
        'ubicacion_especifica': ubicacionEspecifica,
    };
  }

  /// Color según el estado
  String get estadoColor {
    switch (estado) {
      case 'pendiente':
        return 'orange';
      case 'asignada':
        return 'blue';
      case 'en_progreso':
        return 'purple';
      case 'completada':
        return 'green';
      case 'cancelada':
        return 'red';
      default:
        return 'grey';
    }
  }

  /// Icono según la categoría
  String get categoriaIcon {
    switch (categoriaIncidencia) {
      case 'plomeria':
        return 'plumbing';
      case 'electricidad':
        return 'electric_bolt';
      case 'cerrajeria':
        return 'lock';
      case 'pintura':
        return 'format_paint';
      case 'jardineria':
        return 'park';
      case 'limpieza':
        return 'cleaning_services';
      case 'seguridad':
        return 'security';
      case 'ascensor':
        return 'elevator';
      case 'piscina':
        return 'pool';
      case 'gimnasio':
        return 'fitness_center';
      case 'estacionamiento':
        return 'local_parking';
      case 'areas_comunes':
        return 'meeting_room';
      default:
        return 'report_problem';
    }
  }
}

/// Categorías disponibles para reportar incidencias
class CategoriaIncidencia {
  final String value;
  final String label;

  CategoriaIncidencia({required this.value, required this.label});

  factory CategoriaIncidencia.fromJson(Map<String, dynamic> json) {
    return CategoriaIncidencia(
      value: json['value'] ?? '',
      label: json['label'] ?? '',
    );
  }

  /// Lista de categorías predefinidas (fallback si la API no responde)
  static List<CategoriaIncidencia> get defaultCategorias => [
        CategoriaIncidencia(value: 'plomeria', label: 'Plomería'),
        CategoriaIncidencia(value: 'electricidad', label: 'Electricidad'),
        CategoriaIncidencia(value: 'cerrajeria', label: 'Cerrajería'),
        CategoriaIncidencia(value: 'pintura', label: 'Pintura'),
        CategoriaIncidencia(value: 'jardineria', label: 'Jardinería'),
        CategoriaIncidencia(value: 'limpieza', label: 'Limpieza'),
        CategoriaIncidencia(value: 'seguridad', label: 'Seguridad'),
        CategoriaIncidencia(value: 'ascensor', label: 'Ascensor'),
        CategoriaIncidencia(value: 'piscina', label: 'Piscina'),
        CategoriaIncidencia(value: 'gimnasio', label: 'Gimnasio'),
        CategoriaIncidencia(value: 'estacionamiento', label: 'Estacionamiento'),
        CategoriaIncidencia(value: 'areas_comunes', label: 'Áreas Comunes'),
        CategoriaIncidencia(value: 'otro', label: 'Otro'),
      ];
}

/// Request para crear una incidencia
class CrearIncidenciaRequest {
  final String titulo;
  final String descripcion;
  final String categoriaIncidencia;
  final String? ubicacionEspecifica;
  final String? imagenBase64;

  CrearIncidenciaRequest({
    required this.titulo,
    required this.descripcion,
    required this.categoriaIncidencia,
    this.ubicacionEspecifica,
    this.imagenBase64,
  });

  Map<String, dynamic> toJson() {
    return {
      'titulo': titulo,
      'descripcion': descripcion,
      'categoria_incidencia': categoriaIncidencia,
      if (ubicacionEspecifica != null && ubicacionEspecifica!.isNotEmpty)
        'ubicacion_especifica': ubicacionEspecifica,
      if (imagenBase64 != null && imagenBase64!.isNotEmpty)
        'imagen_base64': imagenBase64,
    };
  }
}
