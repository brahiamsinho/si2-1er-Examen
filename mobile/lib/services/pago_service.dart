import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/pago.dart';
import '../config/app_config.dart';
import 'auth_service.dart';

class PagoService {
  String get baseUrl => '${AppConfig.apiBaseUrl}/api/pagos';
  final AuthService _authService = AuthService();

  Future<Map<String, String>> _getHeaders() async {
    final token = await _authService.getToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $token',
    };
  }

  /// Obtiene todas las expensas del residente actual
  Future<ApiResponse<List<ExpensaResumen>>> getMisExpensas({
    String? estado,
    bool? vencidas,
  }) async {
    try {
      final headers = await _getHeaders();
      
      // Construir query params
      final queryParams = <String, String>{};
      if (estado != null) queryParams['estado'] = estado;
      if (vencidas == true) queryParams['vencidas'] = 'true';

      final uri = Uri.parse('$baseUrl/expensas/').replace(queryParameters: queryParams.isNotEmpty ? queryParams : null);
      
      final response = await http.get(uri, headers: headers);

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        
        // Manejar respuesta paginada o lista directa
        List<dynamic> results;
        if (data is Map && data.containsKey('results')) {
          results = data['results'] ?? [];
        } else if (data is List) {
          results = data;
        } else {
          results = [];
        }

        final expensas = results
            .map((json) => ExpensaResumen.fromJson(json))
            .toList();

        return ApiResponse<List<ExpensaResumen>>(
          success: true,
          data: expensas,
          message: 'Expensas obtenidas exitosamente',
        );
      } else {
        final errorData = json.decode(response.body);
        return ApiResponse<List<ExpensaResumen>>(
          success: false,
          error: errorData['error'] ?? errorData['detail'] ?? 'Error al obtener expensas',
        );
      }
    } catch (e) {
      return ApiResponse<List<ExpensaResumen>>(
        success: false,
        error: 'Error de conexión: $e',
      );
    }
  }

  /// Obtiene el detalle completo de una expensa (con conceptos y pagos)
  Future<ApiResponse<Expensa>> getExpensaDetalle(int expensaId) async {
    try {
      final headers = await _getHeaders();
      final response = await http.get(
        Uri.parse('$baseUrl/expensas/$expensaId/'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final expensa = Expensa.fromJson(data);

        return ApiResponse<Expensa>(
          success: true,
          data: expensa,
          message: 'Detalle de expensa obtenido',
        );
      } else {
        final errorData = json.decode(response.body);
        return ApiResponse<Expensa>(
          success: false,
          error: errorData['error'] ?? errorData['detail'] ?? 'Error al obtener detalle',
        );
      }
    } catch (e) {
      return ApiResponse<Expensa>(
        success: false,
        error: 'Error de conexión: $e',
      );
    }
  }

  /// Obtiene el historial de pagos del residente
  Future<ApiResponse<List<Pago>>> getMisPagos() async {
    try {
      final headers = await _getHeaders();
      final response = await http.get(
        Uri.parse('$baseUrl/pagos/'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        
        List<dynamic> results;
        if (data is Map && data.containsKey('results')) {
          results = data['results'] ?? [];
        } else if (data is List) {
          results = data;
        } else {
          results = [];
        }

        final pagos = results
            .map((json) => Pago.fromJson(json))
            .toList();

        return ApiResponse<List<Pago>>(
          success: true,
          data: pagos,
          message: 'Pagos obtenidos exitosamente',
        );
      } else {
        final errorData = json.decode(response.body);
        return ApiResponse<List<Pago>>(
          success: false,
          error: errorData['error'] ?? errorData['detail'] ?? 'Error al obtener pagos',
        );
      }
    } catch (e) {
      return ApiResponse<List<Pago>>(
        success: false,
        error: 'Error de conexión: $e',
      );
    }
  }

  /// Calcula el resumen financiero desde las expensas
  ResumenFinanciero calcularResumen(List<ExpensaResumen> expensas) {
    return ResumenFinanciero.fromExpensas(expensas);
  }
}
