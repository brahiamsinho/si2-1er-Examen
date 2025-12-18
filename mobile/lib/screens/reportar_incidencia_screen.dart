import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:fluttertoast/fluttertoast.dart';
import '../models/incidencia.dart';
import '../services/incidencia_service.dart';

class ReportarIncidenciaScreen extends StatefulWidget {
  const ReportarIncidenciaScreen({super.key});

  @override
  State<ReportarIncidenciaScreen> createState() =>
      _ReportarIncidenciaScreenState();
}

class _ReportarIncidenciaScreenState extends State<ReportarIncidenciaScreen> {
  final _formKey = GlobalKey<FormState>();
  final _tituloController = TextEditingController();
  final _descripcionController = TextEditingController();
  final _ubicacionController = TextEditingController();
  final _incidenciaService = IncidenciaService();
  final _imagePicker = ImagePicker();

  List<CategoriaIncidencia> _categorias = [];
  CategoriaIncidencia? _categoriaSeleccionada;
  File? _imagenSeleccionada;
  String? _imagenBase64;
  bool _isLoading = false;
  bool _isLoadingCategorias = true;

  @override
  void initState() {
    super.initState();
    _cargarCategorias();
  }

  @override
  void dispose() {
    _tituloController.dispose();
    _descripcionController.dispose();
    _ubicacionController.dispose();
    super.dispose();
  }

  Future<void> _cargarCategorias() async {
    final response = await _incidenciaService.getCategorias();
    if (mounted) {
      setState(() {
        _categorias = response.data ?? CategoriaIncidencia.defaultCategorias;
        _isLoadingCategorias = false;
      });
    }
  }

  Future<void> _tomarFoto() async {
    try {
      final XFile? imagen = await _imagePicker.pickImage(
        source: ImageSource.camera,
        maxWidth: 1024,
        maxHeight: 1024,
        imageQuality: 85,
      );
      if (imagen != null) {
        await _procesarImagen(imagen);
      }
    } catch (e) {
      _mostrarError('Error al acceder a la cámara');
    }
  }

  Future<void> _seleccionarDeGaleria() async {
    try {
      final XFile? imagen = await _imagePicker.pickImage(
        source: ImageSource.gallery,
        maxWidth: 1024,
        maxHeight: 1024,
        imageQuality: 85,
      );
      if (imagen != null) {
        await _procesarImagen(imagen);
      }
    } catch (e) {
      _mostrarError('Error al acceder a la galería');
    }
  }

  Future<void> _procesarImagen(XFile imagen) async {
    final bytes = await imagen.readAsBytes();
    final base64String = base64Encode(bytes);
    
    // Detectar tipo de imagen
    String mimeType = 'image/jpeg';
    if (imagen.path.toLowerCase().endsWith('.png')) {
      mimeType = 'image/png';
    } else if (imagen.path.toLowerCase().endsWith('.gif')) {
      mimeType = 'image/gif';
    }

    setState(() {
      _imagenSeleccionada = File(imagen.path);
      _imagenBase64 = 'data:$mimeType;base64,$base64String';
    });
  }

  void _removerImagen() {
    setState(() {
      _imagenSeleccionada = null;
      _imagenBase64 = null;
    });
  }

  void _mostrarOpcionesImagen() {
    showModalBottomSheet(
      context: context,
      builder: (context) => SafeArea(
        child: Wrap(
          children: [
            ListTile(
              leading: const Icon(Icons.camera_alt, color: Colors.green),
              title: const Text('Tomar foto'),
              onTap: () {
                Navigator.pop(context);
                _tomarFoto();
              },
            ),
            ListTile(
              leading: const Icon(Icons.photo_library, color: Colors.blue),
              title: const Text('Seleccionar de galería'),
              onTap: () {
                Navigator.pop(context);
                _seleccionarDeGaleria();
              },
            ),
            if (_imagenSeleccionada != null)
              ListTile(
                leading: const Icon(Icons.delete, color: Colors.red),
                title: const Text('Eliminar foto'),
                onTap: () {
                  Navigator.pop(context);
                  _removerImagen();
                },
              ),
          ],
        ),
      ),
    );
  }

  Future<void> _enviarReporte() async {
    if (!_formKey.currentState!.validate()) return;
    if (_categoriaSeleccionada == null) {
      _mostrarError('Selecciona una categoría');
      return;
    }

    setState(() => _isLoading = true);

    final request = CrearIncidenciaRequest(
      titulo: _tituloController.text.trim(),
      descripcion: _descripcionController.text.trim(),
      categoriaIncidencia: _categoriaSeleccionada!.value,
      ubicacionEspecifica: _ubicacionController.text.trim().isNotEmpty
          ? _ubicacionController.text.trim()
          : null,
      imagenBase64: _imagenBase64,
    );

    final response = await _incidenciaService.reportarIncidencia(request);

    if (mounted) {
      setState(() => _isLoading = false);

      if (response.success) {
        _mostrarExito(response.message ?? 'Incidencia reportada correctamente');
        Navigator.pop(context, true); // Retornar true para indicar éxito
      } else {
        _mostrarError(response.error ?? 'Error al reportar incidencia');
      }
    }
  }

  void _mostrarError(String mensaje) {
    Fluttertoast.showToast(
      msg: mensaje,
      backgroundColor: Colors.red,
      textColor: Colors.white,
    );
  }

  void _mostrarExito(String mensaje) {
    Fluttertoast.showToast(
      msg: mensaje,
      backgroundColor: Colors.green,
      textColor: Colors.white,
    );
  }

  IconData _getIconoCategoria(String? value) {
    switch (value) {
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Reportar Incidencia'),
        backgroundColor: Colors.red,
        foregroundColor: Colors.white,
      ),
      body: _isLoadingCategorias
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Información
                    Card(
                      color: Colors.red[50],
                      child: Padding(
                        padding: const EdgeInsets.all(12),
                        child: Row(
                          children: [
                            Icon(Icons.info_outline, color: Colors.red[700]),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Text(
                                'Reporta cualquier problema que encuentres en las áreas comunes del condominio.',
                                style: TextStyle(color: Colors.red[700]),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Foto del problema
                    const Text(
                      '📷 Foto del problema (opcional)',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                    const SizedBox(height: 8),
                    GestureDetector(
                      onTap: _mostrarOpcionesImagen,
                      child: Container(
                        height: 200,
                        decoration: BoxDecoration(
                          color: Colors.grey[200],
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: Colors.grey[400]!),
                        ),
                        child: _imagenSeleccionada != null
                            ? Stack(
                                fit: StackFit.expand,
                                children: [
                                  ClipRRect(
                                    borderRadius: BorderRadius.circular(11),
                                    child: Image.file(
                                      _imagenSeleccionada!,
                                      fit: BoxFit.cover,
                                    ),
                                  ),
                                  Positioned(
                                    top: 8,
                                    right: 8,
                                    child: CircleAvatar(
                                      backgroundColor: Colors.red,
                                      radius: 18,
                                      child: IconButton(
                                        icon: const Icon(
                                          Icons.close,
                                          size: 18,
                                          color: Colors.white,
                                        ),
                                        onPressed: _removerImagen,
                                      ),
                                    ),
                                  ),
                                ],
                              )
                            : Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(
                                    Icons.add_a_photo,
                                    size: 48,
                                    color: Colors.grey[500],
                                  ),
                                  const SizedBox(height: 8),
                                  Text(
                                    'Toca para agregar foto',
                                    style: TextStyle(color: Colors.grey[600]),
                                  ),
                                ],
                              ),
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Categoría
                    const Text(
                      '🏷️ Categoría *',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                    const SizedBox(height: 8),
                    DropdownButtonFormField<CategoriaIncidencia>(
                      value: _categoriaSeleccionada,
                      decoration: InputDecoration(
                        hintText: 'Selecciona una categoría',
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                        prefixIcon: Icon(
                          _getIconoCategoria(_categoriaSeleccionada?.value),
                          color: Colors.red,
                        ),
                      ),
                      items: _categorias
                          .map((cat) => DropdownMenuItem(
                                value: cat,
                                child: Row(
                                  children: [
                                    Icon(
                                      _getIconoCategoria(cat.value),
                                      size: 20,
                                      color: Colors.grey[700],
                                    ),
                                    const SizedBox(width: 8),
                                    Text(cat.label),
                                  ],
                                ),
                              ))
                          .toList(),
                      onChanged: (value) {
                        setState(() => _categoriaSeleccionada = value);
                      },
                      validator: (value) =>
                          value == null ? 'Selecciona una categoría' : null,
                    ),
                    const SizedBox(height: 20),

                    // Título
                    const Text(
                      '📝 Título del problema *',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextFormField(
                      controller: _tituloController,
                      decoration: InputDecoration(
                        hintText: 'Ej: Fuga de agua en pasillo',
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                      validator: (value) {
                        if (value == null || value.trim().isEmpty) {
                          return 'Ingresa un título';
                        }
                        if (value.trim().length < 5) {
                          return 'El título debe tener al menos 5 caracteres';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 20),

                    // Descripción
                    const Text(
                      '📋 Descripción *',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextFormField(
                      controller: _descripcionController,
                      maxLines: 4,
                      decoration: InputDecoration(
                        hintText:
                            'Describe el problema con detalle...\n¿Qué encontraste? ¿Desde cuándo está así?',
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                      validator: (value) {
                        if (value == null || value.trim().isEmpty) {
                          return 'Ingresa una descripción';
                        }
                        if (value.trim().length < 10) {
                          return 'La descripción debe tener al menos 10 caracteres';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 20),

                    // Ubicación
                    const Text(
                      '📍 Ubicación específica (opcional)',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextFormField(
                      controller: _ubicacionController,
                      decoration: InputDecoration(
                        hintText: 'Ej: Pasillo del 2do piso, junto al ascensor',
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                        prefixIcon: const Icon(Icons.location_on),
                      ),
                    ),
                    const SizedBox(height: 32),

                    // Botón enviar
                    ElevatedButton.icon(
                      onPressed: _isLoading ? null : _enviarReporte,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.red,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                      icon: _isLoading
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                valueColor:
                                    AlwaysStoppedAnimation<Color>(Colors.white),
                              ),
                            )
                          : const Icon(Icons.send),
                      label: Text(
                        _isLoading ? 'Enviando...' : 'Enviar Reporte',
                        style: const TextStyle(fontSize: 16),
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],
                ),
              ),
            ),
    );
  }
}
