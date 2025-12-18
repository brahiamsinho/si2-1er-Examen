import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/incidencia.dart';
import '../config/app_config.dart';
import 'auth_service.dart';

class IncidenciaService {
  String get baseUrl => '${AppConfig.apiBaseUrl}/api';
  final AuthService _authService = AuthService();

  /// Headers para las peticiones autenticadas
  Future<Map<String, String>> _getHeaders() async {
    final token = await _authService.getToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $token',
    };
  }

  /// Obtener categorías disponibles
  Future<ApiResponse<List<CategoriaIncidencia>>> getCategorias() async {
    try {
      final headers = await _getHeaders();
      final response = await http.get(
        Uri.parse('$baseUrl/mantenimiento/incidencias/categorias/'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['success'] == true) {
          final List<dynamic> categoriasJson = data['categorias'] ?? [];
          final categorias = categoriasJson
              .map((json) => CategoriaIncidencia.fromJson(json))
              .toList();
          return ApiResponse<List<CategoriaIncidencia>>(
            success: true,
            data: categorias,
          );
        }
      }
      // Fallback a categorías predefinidas
      return ApiResponse<List<CategoriaIncidencia>>(
        success: true,
        data: CategoriaIncidencia.defaultCategorias,
      );
    } catch (e) {
      // En caso de error, usar categorías predefinidas
      return ApiResponse<List<CategoriaIncidencia>>(
        success: true,
        data: CategoriaIncidencia.defaultCategorias,
      );
    }
  }

  /// Reportar una nueva incidencia
  Future<ApiResponse<Incidencia>> reportarIncidencia(
      CrearIncidenciaRequest request) async {
    try {
      final headers = await _getHeaders();
      final response = await http.post(
        Uri.parse('$baseUrl/mantenimiento/incidencias/reportar/'),
        headers: headers,
        body: json.encode(request.toJson()),
      );

      final data = json.decode(response.body);

      if (response.statusCode == 201) {
        if (data['success'] == true && data['data'] != null) {
          final incidencia = Incidencia.fromJson(data['data']);
          return ApiResponse<Incidencia>(
            success: true,
            data: incidencia,
            message: data['message'] ?? 'Incidencia reportada correctamente',
          );
        }
      }

      return ApiResponse<Incidencia>(
        success: false,
        error: data['error']?.toString() ?? 'Error al reportar incidencia',
      );
    } catch (e) {
      return ApiResponse<Incidencia>(
        success: false,
        error: 'Error de conexión: $e',
      );
    }
  }

  /// Obtener las incidencias del residente actual
  Future<ApiResponse<List<Incidencia>>> getMisIncidencias({
    String? estado,
    String? categoria,
  }) async {
    try {
      final headers = await _getHeaders();
      
      // Construir query params
      final queryParams = <String, String>{};
      if (estado != null) queryParams['estado'] = estado;
      if (categoria != null) queryParams['categoria'] = categoria;
      
      final uri = Uri.parse('$baseUrl/mantenimiento/incidencias/mis_incidencias/')
          .replace(queryParameters: queryParams.isNotEmpty ? queryParams : null);
      
      final response = await http.get(uri, headers: headers);

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['success'] == true) {
          final List<dynamic> results = data['results'] ?? [];
          final incidencias =
              results.map((json) => Incidencia.fromJson(json)).toList();
          return ApiResponse<List<Incidencia>>(
            success: true,
            data: incidencias,
            message: 'Incidencias obtenidas exitosamente',
          );
        }
      }

      final errorData = json.decode(response.body);
      return ApiResponse<List<Incidencia>>(
        success: false,
        error: errorData['error'] ?? 'Error al obtener incidencias',
      );
    } catch (e) {
      return ApiResponse<List<Incidencia>>(
        success: false,
        error: 'Error de conexión: $e',
      );
    }
  }

  /// Obtener detalle de una incidencia
  Future<ApiResponse<Incidencia>> getDetalleIncidencia(int id) async {
    try {
      final headers = await _getHeaders();
      final response = await http.get(
        Uri.parse('$baseUrl/mantenimiento/incidencias/$id/detalle/'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['success'] == true && data['data'] != null) {
          final incidencia = Incidencia.fromJson(data['data']);
          return ApiResponse<Incidencia>(
            success: true,
            data: incidencia,
          );
        }
      }

      final errorData = json.decode(response.body);
      return ApiResponse<Incidencia>(
        success: false,
        error: errorData['error'] ?? 'Error al obtener incidencia',
      );
    } catch (e) {
      return ApiResponse<Incidencia>(
        success: false,
        error: 'Error de conexión: $e',
      );
    }
  }
}
