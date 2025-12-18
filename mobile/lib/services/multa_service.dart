import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/multa.dart';
import '../config/app_config.dart';
import 'auth_service.dart';

class MultaService {
  String get baseUrl => '${AppConfig.apiBaseUrl}/api/multas';
  final AuthService _authService = AuthService();

  Future<Map<String, String>> _getHeaders() async {
    final token = await _authService.getToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $token',
    };
  }

  /// Obtiene todas las multas del residente actual
  Future<ApiResponse<List<Multa>>> getMisMultas({
    String? estado,
    String? tipo,
  }) async {
    try {
      final headers = await _getHeaders();
      
      // Construir query params
      final queryParams = <String, String>{};
      if (estado != null) queryParams['estado'] = estado;
      if (tipo != null) queryParams['tipo'] = tipo;

      final uri = Uri.parse('$baseUrl/').replace(
        queryParameters: queryParams.isNotEmpty ? queryParams : null,
      );
      
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

        final multas = results
            .map((json) => Multa.fromJson(json))
            .toList();

        return ApiResponse<List<Multa>>(
          success: true,
          data: multas,
          message: 'Multas obtenidas exitosamente',
        );
      } else {
        final errorData = json.decode(response.body);
        return ApiResponse<List<Multa>>(
          success: false,
          error: errorData['error'] ?? errorData['detail'] ?? 'Error al obtener multas',
        );
      }
    } catch (e) {
      return ApiResponse<List<Multa>>(
        success: false,
        error: 'Error de conexión: $e',
      );
    }
  }

  /// Obtiene el detalle de una multa específica
  Future<ApiResponse<Multa>> getMultaDetalle(int multaId) async {
    try {
      final headers = await _getHeaders();
      final response = await http.get(
        Uri.parse('$baseUrl/$multaId/'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final multa = Multa.fromJson(data);

        return ApiResponse<Multa>(
          success: true,
          data: multa,
          message: 'Detalle de multa obtenido',
        );
      } else {
        final errorData = json.decode(response.body);
        return ApiResponse<Multa>(
          success: false,
          error: errorData['error'] ?? errorData['detail'] ?? 'Error al obtener detalle',
        );
      }
    } catch (e) {
      return ApiResponse<Multa>(
        success: false,
        error: 'Error de conexión: $e',
      );
    }
  }

  /// Obtiene multas pendientes
  Future<ApiResponse<List<Multa>>> getMultasPendientes() async {
    try {
      final headers = await _getHeaders();
      final response = await http.get(
        Uri.parse('$baseUrl/pendientes/'),
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

        final multas = results
            .map((json) => Multa.fromJson(json))
            .toList();

        return ApiResponse<List<Multa>>(
          success: true,
          data: multas,
          message: 'Multas pendientes obtenidas',
        );
      } else {
        final errorData = json.decode(response.body);
        return ApiResponse<List<Multa>>(
          success: false,
          error: errorData['error'] ?? errorData['detail'] ?? 'Error al obtener multas pendientes',
        );
      }
    } catch (e) {
      return ApiResponse<List<Multa>>(
        success: false,
        error: 'Error de conexión: $e',
      );
    }
  }

  /// Obtiene multas vencidas
  Future<ApiResponse<List<Multa>>> getMultasVencidas() async {
    try {
      final headers = await _getHeaders();
      final response = await http.get(
        Uri.parse('$baseUrl/vencidas/'),
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

        final multas = results
            .map((json) => Multa.fromJson(json))
            .toList();

        return ApiResponse<List<Multa>>(
          success: true,
          data: multas,
          message: 'Multas vencidas obtenidas',
        );
      } else {
        final errorData = json.decode(response.body);
        return ApiResponse<List<Multa>>(
          success: false,
          error: errorData['error'] ?? errorData['detail'] ?? 'Error al obtener multas vencidas',
        );
      }
    } catch (e) {
      return ApiResponse<List<Multa>>(
        success: false,
        error: 'Error de conexión: $e',
      );
    }
  }

  /// Calcula el resumen de multas a partir de una lista
  ResumenMultas calcularResumen(List<Multa> multas) {
    return ResumenMultas.fromMultas(multas);
  }
}
