// Modelos para el módulo de Finanzas/Pagos

class Expensa {
  final int id;
  final int unidad;
  final String unidadCodigo;
  final String unidadDireccion;
  final String periodo;
  final double montoBase;
  final double montoAdicional;
  final double montoTotal;
  final double montoPagado;
  final double saldoPendiente;
  final String estado;
  final String estadoDisplay;
  final DateTime fechaEmision;
  final DateTime fechaVencimiento;
  final bool estaVencida;
  final int diasVencidos;
  final List<ConceptoPago> conceptos;
  final List<Pago> pagos;
  final DateTime fechaCreacion;
  final DateTime fechaActualizacion;

  Expensa({
    required this.id,
    required this.unidad,
    required this.unidadCodigo,
    required this.unidadDireccion,
    required this.periodo,
    required this.montoBase,
    required this.montoAdicional,
    required this.montoTotal,
    required this.montoPagado,
    required this.saldoPendiente,
    required this.estado,
    required this.estadoDisplay,
    required this.fechaEmision,
    required this.fechaVencimiento,
    required this.estaVencida,
    required this.diasVencidos,
    required this.conceptos,
    required this.pagos,
    required this.fechaCreacion,
    required this.fechaActualizacion,
  });

  factory Expensa.fromJson(Map<String, dynamic> json) {
    return Expensa(
      id: json['id'] ?? 0,
      unidad: json['unidad'] ?? 0,
      unidadCodigo: json['unidad_codigo'] ?? '',
      unidadDireccion: json['unidad_direccion'] ?? '',
      periodo: json['periodo'] ?? '',
      montoBase: _parseDouble(json['monto_base']),
      montoAdicional: _parseDouble(json['monto_adicional']),
      montoTotal: _parseDouble(json['monto_total']),
      montoPagado: _parseDouble(json['monto_pagado']),
      saldoPendiente: _parseDouble(json['saldo_pendiente']),
      estado: json['estado'] ?? 'pendiente',
      estadoDisplay: json['estado_display'] ?? 'Pendiente',
      fechaEmision: DateTime.parse(json['fecha_emision'] ?? DateTime.now().toIso8601String()),
      fechaVencimiento: DateTime.parse(json['fecha_vencimiento'] ?? DateTime.now().toIso8601String()),
      estaVencida: json['esta_vencida'] ?? false,
      diasVencidos: json['dias_vencidos'] ?? 0,
      conceptos: (json['conceptos'] as List<dynamic>?)
          ?.map((c) => ConceptoPago.fromJson(c))
          .toList() ?? [],
      pagos: (json['pagos'] as List<dynamic>?)
          ?.map((p) => Pago.fromJson(p))
          .toList() ?? [],
      fechaCreacion: DateTime.parse(json['fecha_creacion'] ?? DateTime.now().toIso8601String()),
      fechaActualizacion: DateTime.parse(json['fecha_actualizacion'] ?? DateTime.now().toIso8601String()),
    );
  }

  static double _parseDouble(dynamic value) {
    if (value == null) return 0.0;
    if (value is double) return value;
    if (value is int) return value.toDouble();
    if (value is String) return double.tryParse(value) ?? 0.0;
    return 0.0;
  }

  /// Obtiene el nombre del mes en español a partir del periodo (YYYY-MM)
  String get mesNombre {
    final meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    final parts = periodo.split('-');
    if (parts.length == 2) {
      final mes = int.tryParse(parts[1]);
      if (mes != null && mes >= 1 && mes <= 12) {
        return '${meses[mes - 1]} ${parts[0]}';
      }
    }
    return periodo;
  }

  /// Porcentaje pagado (0.0 - 1.0)
  double get porcentajePagado {
    if (montoTotal <= 0) return 0.0;
    return (montoPagado / montoTotal).clamp(0.0, 1.0);
  }
}


class ExpensaResumen {
  final int id;
  final int unidad;
  final String unidadCodigo;
  final String unidadDireccion;
  final String periodo;
  final double montoTotal;
  final double montoPagado;
  final double saldoPendiente;
  final String estado;
  final String estadoDisplay;
  final DateTime fechaEmision;
  final DateTime fechaVencimiento;
  final bool estaVencida;

  ExpensaResumen({
    required this.id,
    required this.unidad,
    required this.unidadCodigo,
    required this.unidadDireccion,
    required this.periodo,
    required this.montoTotal,
    required this.montoPagado,
    required this.saldoPendiente,
    required this.estado,
    required this.estadoDisplay,
    required this.fechaEmision,
    required this.fechaVencimiento,
    required this.estaVencida,
  });

  factory ExpensaResumen.fromJson(Map<String, dynamic> json) {
    return ExpensaResumen(
      id: json['id'] ?? 0,
      unidad: json['unidad'] ?? 0,
      unidadCodigo: json['unidad_codigo'] ?? '',
      unidadDireccion: json['unidad_direccion'] ?? '',
      periodo: json['periodo'] ?? '',
      montoTotal: Expensa._parseDouble(json['monto_total']),
      montoPagado: Expensa._parseDouble(json['monto_pagado']),
      saldoPendiente: Expensa._parseDouble(json['saldo_pendiente']),
      estado: json['estado'] ?? 'pendiente',
      estadoDisplay: json['estado_display'] ?? 'Pendiente',
      fechaEmision: DateTime.parse(json['fecha_emision'] ?? DateTime.now().toIso8601String()),
      fechaVencimiento: DateTime.parse(json['fecha_vencimiento'] ?? DateTime.now().toIso8601String()),
      estaVencida: json['esta_vencida'] ?? false,
    );
  }

  String get mesNombre {
    final meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    final parts = periodo.split('-');
    if (parts.length == 2) {
      final mes = int.tryParse(parts[1]);
      if (mes != null && mes >= 1 && mes <= 12) {
        return '${meses[mes - 1]} ${parts[0]}';
      }
    }
    return periodo;
  }

  double get porcentajePagado {
    if (montoTotal <= 0) return 0.0;
    return (montoPagado / montoTotal).clamp(0.0, 1.0);
  }
}


class ConceptoPago {
  final int id;
  final String descripcion;
  final double monto;
  final String tipo;
  final DateTime fechaCreacion;

  ConceptoPago({
    required this.id,
    required this.descripcion,
    required this.monto,
    required this.tipo,
    required this.fechaCreacion,
  });

  factory ConceptoPago.fromJson(Map<String, dynamic> json) {
    return ConceptoPago(
      id: json['id'] ?? 0,
      descripcion: json['descripcion'] ?? '',
      monto: Expensa._parseDouble(json['monto']),
      tipo: json['tipo'] ?? 'otro',
      fechaCreacion: DateTime.parse(json['fecha_creacion'] ?? DateTime.now().toIso8601String()),
    );
  }

  String get tipoDisplay {
    switch (tipo.toLowerCase()) {
      case 'mantenimiento':
        return 'Mantenimiento';
      case 'agua':
        return 'Agua';
      case 'luz':
        return 'Electricidad';
      case 'gas':
        return 'Gas';
      case 'multa':
        return 'Multa';
      case 'reserva':
        return 'Reserva';
      default:
        return tipo.isNotEmpty 
            ? tipo[0].toUpperCase() + tipo.substring(1) 
            : 'Otro';
    }
  }
}


class Pago {
  final int id;
  final int expensa;
  final double monto;
  final String metodoPago;
  final String metodoPagoDisplay;
  final String? numeroComprobante;
  final DateTime fechaPago;
  final String? observaciones;
  final int? registradoPor;
  final String? registradoPorNombre;
  final DateTime fechaCreacion;

  Pago({
    required this.id,
    required this.expensa,
    required this.monto,
    required this.metodoPago,
    required this.metodoPagoDisplay,
    this.numeroComprobante,
    required this.fechaPago,
    this.observaciones,
    this.registradoPor,
    this.registradoPorNombre,
    required this.fechaCreacion,
  });

  factory Pago.fromJson(Map<String, dynamic> json) {
    return Pago(
      id: json['id'] ?? 0,
      expensa: json['expensa'] ?? 0,
      monto: Expensa._parseDouble(json['monto']),
      metodoPago: json['metodo_pago'] ?? 'efectivo',
      metodoPagoDisplay: json['metodo_pago_display'] ?? 'Efectivo',
      numeroComprobante: json['numero_comprobante'],
      fechaPago: DateTime.parse(json['fecha_pago'] ?? DateTime.now().toIso8601String()),
      observaciones: json['observaciones'],
      registradoPor: json['registrado_por'],
      registradoPorNombre: json['registrado_por_nombre'],
      fechaCreacion: DateTime.parse(json['fecha_creacion'] ?? DateTime.now().toIso8601String()),
    );
  }
}


class ResumenFinanciero {
  final double totalPendiente;
  final double totalPagado;
  final int expensasPendientes;
  final int expensasVencidas;

  ResumenFinanciero({
    required this.totalPendiente,
    required this.totalPagado,
    required this.expensasPendientes,
    required this.expensasVencidas,
  });

  factory ResumenFinanciero.fromExpensas(List<ExpensaResumen> expensas) {
    double pendiente = 0;
    double pagado = 0;
    int pendientesCount = 0;
    int vencidasCount = 0;

    for (final exp in expensas) {
      pendiente += exp.saldoPendiente;
      pagado += exp.montoPagado;
      if (exp.estado != 'pagado') {
        pendientesCount++;
        if (exp.estaVencida) {
          vencidasCount++;
        }
      }
    }

    return ResumenFinanciero(
      totalPendiente: pendiente,
      totalPagado: pagado,
      expensasPendientes: pendientesCount,
      expensasVencidas: vencidasCount,
    );
  }
}
