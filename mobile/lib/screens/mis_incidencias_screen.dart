import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/incidencia.dart';
import '../services/incidencia_service.dart';
import 'reportar_incidencia_screen.dart';

class MisIncidenciasScreen extends StatefulWidget {
  const MisIncidenciasScreen({super.key});

  @override
  State<MisIncidenciasScreen> createState() => _MisIncidenciasScreenState();
}

class _MisIncidenciasScreenState extends State<MisIncidenciasScreen> {
  final _incidenciaService = IncidenciaService();
  List<Incidencia> _incidencias = [];
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _cargarIncidencias();
  }

  Future<void> _cargarIncidencias() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final response = await _incidenciaService.getMisIncidencias();

    if (mounted) {
      setState(() {
        _isLoading = false;
        if (response.success) {
          _incidencias = response.data ?? [];
        } else {
          _errorMessage = response.error;
        }
      });
    }
  }

  Future<void> _irAReportar() async {
    final result = await Navigator.push<bool>(
      context,
      MaterialPageRoute(
        builder: (context) => const ReportarIncidenciaScreen(),
      ),
    );

    if (result == true) {
      _cargarIncidencias();
    }
  }

  Color _getColorEstado(String? estado) {
    switch (estado) {
      case 'pendiente':
        return Colors.orange;
      case 'asignada':
        return Colors.blue;
      case 'en_progreso':
        return Colors.purple;
      case 'completada':
        return Colors.green;
      case 'cancelada':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  IconData _getIconoCategoria(String? categoria) {
    switch (categoria) {
      case 'plomeria':
        return Icons.plumbing;
      case 'electricidad':
        return Icons.electric_bolt;
      case 'cerrajeria':
        return Icons.lock;
      case 'pintura':
        return Icons.format_paint;
      case 'jardineria':
        return Icons.park;
      case 'limpieza':
        return Icons.cleaning_services;
      case 'seguridad':
        return Icons.security;
      case 'ascensor':
        return Icons.elevator;
      case 'piscina':
        return Icons.pool;
      case 'gimnasio':
        return Icons.fitness_center;
      case 'estacionamiento':
        return Icons.local_parking;
      case 'areas_comunes':
        return Icons.meeting_room;
      default:
        return Icons.report_problem;
    }
  }

  String _formatearFecha(DateTime? fecha) {
    if (fecha == null) return '-';
    return DateFormat('dd/MM/yyyy HH:mm').format(fecha);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Mis Incidencias'),
        backgroundColor: Colors.red,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _cargarIncidencias,
            tooltip: 'Actualizar',
          ),
        ],
      ),
      body: _buildBody(),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _irAReportar,
        backgroundColor: Colors.red,
        foregroundColor: Colors.white,
        icon: const Icon(Icons.add_a_photo),
        label: const Text('Reportar'),
      ),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_errorMessage != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 64, color: Colors.red[300]),
            const SizedBox(height: 16),
            Text(
              _errorMessage!,
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey[600]),
            ),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: _cargarIncidencias,
              icon: const Icon(Icons.refresh),
              label: const Text('Reintentar'),
            ),
          ],
        ),
      );
    }

    if (_incidencias.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.check_circle_outline, size: 64, color: Colors.green[300]),
            const SizedBox(height: 16),
            const Text(
              '¡No has reportado incidencias!',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Si encuentras algún problema, repórtalo\npresionando el botón de abajo.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey[600]),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _cargarIncidencias,
      child: ListView.builder(
        padding: const EdgeInsets.all(12),
        itemCount: _incidencias.length,
        itemBuilder: (context, index) {
          final incidencia = _incidencias[index];
          return _buildIncidenciaCard(incidencia);
        },
      ),
    );
  }

  Widget _buildIncidenciaCard(Incidencia incidencia) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: () => _mostrarDetalleIncidencia(incidencia),
        borderRadius: BorderRadius.circular(8),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header con categoría y estado
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.red[50],
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Icon(
                      _getIconoCategoria(incidencia.categoriaIncidencia),
                      color: Colors.red,
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          incidencia.titulo,
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          incidencia.categoriaDisplay ?? incidencia.categoriaIncidencia,
                          style: TextStyle(
                            color: Colors.grey[600],
                            fontSize: 13,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: _getColorEstado(incidencia.estado).withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: _getColorEstado(incidencia.estado),
                      ),
                    ),
                    child: Text(
                      incidencia.estadoDisplay ?? incidencia.estado ?? 'Pendiente',
                      style: TextStyle(
                        color: _getColorEstado(incidencia.estado),
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              // Descripción
              Text(
                incidencia.descripcion,
                style: TextStyle(color: Colors.grey[700]),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),

              // Ubicación si existe
              if (incidencia.ubicacionEspecifica != null &&
                  incidencia.ubicacionEspecifica!.isNotEmpty) ...[
                const SizedBox(height: 8),
                Row(
                  children: [
                    Icon(Icons.location_on, size: 16, color: Colors.grey[500]),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Text(
                        incidencia.ubicacionEspecifica!,
                        style: TextStyle(
                          color: Colors.grey[500],
                          fontSize: 13,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ],

              const SizedBox(height: 8),
              const Divider(),

              // Fecha
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Icon(Icons.access_time, size: 14, color: Colors.grey[500]),
                      const SizedBox(width: 4),
                      Text(
                        _formatearFecha(incidencia.fechaCreacion),
                        style: TextStyle(
                          color: Colors.grey[500],
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                  if (incidencia.imagenUrl != null)
                    Row(
                      children: [
                        Icon(Icons.image, size: 14, color: Colors.grey[500]),
                        const SizedBox(width: 4),
                        Text(
                          'Con foto',
                          style: TextStyle(
                            color: Colors.grey[500],
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _mostrarDetalleIncidencia(Incidencia incidencia) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.7,
        minChildSize: 0.5,
        maxChildSize: 0.95,
        expand: false,
        builder: (context, scrollController) => SingleChildScrollView(
          controller: scrollController,
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Handle
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey[300],
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 20),

              // Estado
              Center(
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 8,
                  ),
                  decoration: BoxDecoration(
                    color: _getColorEstado(incidencia.estado).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: _getColorEstado(incidencia.estado),
                    ),
                  ),
                  child: Text(
                    incidencia.estadoDisplay ?? incidencia.estado ?? 'Pendiente',
                    style: TextStyle(
                      color: _getColorEstado(incidencia.estado),
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 20),

              // Título
              Text(
                incidencia.titulo,
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),

              // Categoría
              Row(
                children: [
                  Icon(
                    _getIconoCategoria(incidencia.categoriaIncidencia),
                    size: 20,
                    color: Colors.red,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    incidencia.categoriaDisplay ?? incidencia.categoriaIncidencia,
                    style: TextStyle(
                      color: Colors.grey[600],
                      fontSize: 15,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // Imagen si existe
              if (incidencia.imagenUrl != null) ...[
                ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: Image.network(
                    incidencia.imagenUrl!,
                    fit: BoxFit.cover,
                    width: double.infinity,
                    height: 200,
                    loadingBuilder: (context, child, loadingProgress) {
                      if (loadingProgress == null) return child;
                      return Container(
                        height: 200,
                        color: Colors.grey[200],
                        child: const Center(
                          child: CircularProgressIndicator(),
                        ),
                      );
                    },
                    errorBuilder: (context, error, stackTrace) {
                      return Container(
                        height: 200,
                        color: Colors.grey[200],
                        child: const Icon(
                          Icons.image_not_supported,
                          size: 48,
                          color: Colors.grey,
                        ),
                      );
                    },
                  ),
                ),
                const SizedBox(height: 16),
              ],

              // Descripción
              const Text(
                'Descripción',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                incidencia.descripcion,
                style: TextStyle(color: Colors.grey[700]),
              ),
              const SizedBox(height: 16),

              // Ubicación
              if (incidencia.ubicacionEspecifica != null &&
                  incidencia.ubicacionEspecifica!.isNotEmpty) ...[
                const Text(
                  'Ubicación',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    const Icon(Icons.location_on, color: Colors.red),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        incidencia.ubicacionEspecifica!,
                        style: TextStyle(color: Colors.grey[700]),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
              ],

              // Fechas
              const Text(
                'Información',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
              ),
              const SizedBox(height: 8),
              _buildInfoRow(
                'Fecha de reporte',
                _formatearFecha(incidencia.fechaCreacion),
              ),
              if (incidencia.fechaLimite != null)
                _buildInfoRow(
                  'Fecha límite',
                  DateFormat('dd/MM/yyyy').format(incidencia.fechaLimite!),
                ),
              if (incidencia.prioridadDisplay != null)
                _buildInfoRow('Prioridad', incidencia.prioridadDisplay!),

              // Observaciones
              if (incidencia.observaciones != null &&
                  incidencia.observaciones!.isNotEmpty) ...[
                const SizedBox(height: 16),
                const Text(
                  'Observaciones',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.grey[100],
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    incidencia.observaciones!,
                    style: TextStyle(color: Colors.grey[700]),
                  ),
                ),
              ],

              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(color: Colors.grey[600]),
          ),
          Text(
            value,
            style: const TextStyle(fontWeight: FontWeight.w500),
          ),
        ],
      ),
    );
  }
}
