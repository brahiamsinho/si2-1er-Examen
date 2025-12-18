/// Modelos para el módulo de Multas

class Multa {
  final int id;
  final String tipo;
  final String tipoDisplay;
  final String descripcion;
  final double monto;
  final double recargoMora;
  final double montoTotal;
  final int residenteId;
  final String residenteNombre;
  final int? unidadId;
  final String? unidadNombre;
  final String estado;
  final String estadoDisplay;
  final DateTime fechaEmision;
  final DateTime fechaVencimiento;
  final DateTime? fechaPago;
  final bool estaVencida;
  final int diasVencimiento;
  final String? observaciones;
  final String? creadoPor;
  final DateTime fechaCreacion;
  final DateTime fechaActualizacion;

  Multa({
    required this.id,
    required this.tipo,
    required this.tipoDisplay,
    required this.descripcion,
    required this.monto,
    required this.recargoMora,
    required this.montoTotal,
    required this.residenteId,
    required this.residenteNombre,
    this.unidadId,
    this.unidadNombre,
    required this.estado,
    required this.estadoDisplay,
    required this.fechaEmision,
    required this.fechaVencimiento,
    this.fechaPago,
    required this.estaVencida,
    required this.diasVencimiento,
    this.observaciones,
    this.creadoPor,
    required this.fechaCreacion,
    required this.fechaActualizacion,
  });

  factory Multa.fromJson(Map<String, dynamic> json) {
    return Multa(
      id: json['id'] ?? 0,
      tipo: json['tipo'] ?? '',
      tipoDisplay: json['tipo_display'] ?? _getTipoDisplay(json['tipo'] ?? ''),
      descripcion: json['descripcion'] ?? '',
      monto: _parseDouble(json['monto']),
      recargoMora: _parseDouble(json['recargo_mora']),
      montoTotal: _parseDouble(json['monto_total'] ?? json['monto']),
      residenteId: json['residente'] ?? 0,
      residenteNombre: json['residente_nombre'] ?? '',
      unidadId: json['unidad'],
      unidadNombre: json['unidad_nombre'],
      estado: json['estado'] ?? 'pendiente',
      estadoDisplay: json['estado_display'] ?? _getEstadoDisplay(json['estado'] ?? 'pendiente'),
      fechaEmision: _parseDate(json['fecha_emision']),
      fechaVencimiento: _parseDate(json['fecha_vencimiento']),
      fechaPago: json['fecha_pago'] != null ? _parseDate(json['fecha_pago']) : null,
      estaVencida: json['esta_vencida'] ?? false,
      diasVencimiento: json['dias_vencimiento'] ?? 0,
      observaciones: json['observaciones'],
      creadoPor: json['creado_por'],
      fechaCreacion: _parseDateTime(json['fecha_creacion']),
      fechaActualizacion: _parseDateTime(json['fecha_actualizacion']),
    );
  }

  static double _parseDouble(dynamic value) {
    if (value == null) return 0.0;
    if (value is double) return value;
    if (value is int) return value.toDouble();
    if (value is String) return double.tryParse(value) ?? 0.0;
    return 0.0;
  }

  static DateTime _parseDate(dynamic value) {
    if (value == null) return DateTime.now();
    if (value is String) {
      return DateTime.tryParse(value) ?? DateTime.now();
    }
    return DateTime.now();
  }

  static DateTime _parseDateTime(dynamic value) {
    return _parseDate(value);
  }

  static String _getTipoDisplay(String tipo) {
    const Map<String, String> tipos = {
      'ruido': 'Ruido excesivo',
      'estacionamiento': 'Estacionamiento indebido',
      'area_comun': 'Mal uso de área común',
      'pago_atrasado': 'Pago de expensa atrasado',
      'dano_propiedad': 'Daño a propiedad común',
      'incumplimiento': 'Incumplimiento de reglamento',
      'otro': 'Otro',
    };
    return tipos[tipo] ?? tipo;
  }

  static String _getEstadoDisplay(String estado) {
    const Map<String, String> estados = {
      'pendiente': 'Pendiente',
      'pagado': 'Pagado',
      'cancelado': 'Cancelado',
      'en_disputa': 'En disputa',
    };
    return estados[estado] ?? estado;
  }

  /// Días restantes para vencer (negativo si ya venció)
  int get diasParaVencer {
    final hoy = DateTime.now();
    return fechaVencimiento.difference(hoy).inDays;
  }

  /// Indica si tiene recargo por mora
  bool get tieneRecargo => recargoMora > 0;
}

/// Resumen de multas para estadísticas
class ResumenMultas {
  final int totalMultas;
  final int pendientes;
  final int pagadas;
  final int vencidas;
  final double montoTotalPendiente;
  final double montoTotalPagado;

  ResumenMultas({
    required this.totalMultas,
    required this.pendientes,
    required this.pagadas,
    required this.vencidas,
    required this.montoTotalPendiente,
    required this.montoTotalPagado,
  });

  factory ResumenMultas.fromMultas(List<Multa> multas) {
    final pendientesList = multas.where((m) => m.estado == 'pendiente').toList();
    final pagadasList = multas.where((m) => m.estado == 'pagado').toList();
    final vencidasList = multas.where((m) => m.estaVencida).toList();

    return ResumenMultas(
      totalMultas: multas.length,
      pendientes: pendientesList.length,
      pagadas: pagadasList.length,
      vencidas: vencidasList.length,
      montoTotalPendiente: pendientesList.fold(0.0, (sum, m) => sum + m.montoTotal),
      montoTotalPagado: pagadasList.fold(0.0, (sum, m) => sum + m.montoTotal),
    );
  }
}
