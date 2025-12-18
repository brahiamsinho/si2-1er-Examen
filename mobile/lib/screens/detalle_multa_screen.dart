import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/multa.dart';
import '../services/multa_service.dart';

class DetalleMultaScreen extends StatefulWidget {
  final int multaId;

  const DetalleMultaScreen({super.key, required this.multaId});

  @override
  State<DetalleMultaScreen> createState() => _DetalleMultaScreenState();
}

class _DetalleMultaScreenState extends State<DetalleMultaScreen> {
  final MultaService _multaService = MultaService();
  final _currencyFormat = NumberFormat.currency(locale: 'es_BO', symbol: 'Bs.');
  final _dateFormat = DateFormat('dd/MM/yyyy');
  
  Multa? _multa;
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _cargarDetalle();
  }

  Future<void> _cargarDetalle() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    final response = await _multaService.getMultaDetalle(widget.multaId);

    setState(() {
      _isLoading = false;
      if (response.success && response.data != null) {
        _multa = response.data;
      } else {
        _error = response.error;
      }
    });
  }

  Color _getEstadoColor() {
    if (_multa!.estaVencida && _multa!.estado == 'pendiente') {
      return Colors.red[700]!;
    }
    switch (_multa!.estado) {
      case 'pendiente':
        return Colors.orange[700]!;
      case 'pagado':
        return Colors.green[700]!;
      case 'cancelado':
        return Colors.grey[600]!;
      case 'en_disputa':
        return Colors.purple[700]!;
      default:
        return Colors.grey[600]!;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Detalle de Multa'),
        backgroundColor: Colors.red[700],
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _cargarDetalle,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? _buildErrorWidget()
              : _buildContent(),
    );
  }

  Widget _buildContent() {
    return RefreshIndicator(
      onRefresh: _cargarDetalle,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        child: Column(
          children: [
            _buildHeaderCard(),
            const SizedBox(height: 16),
            _buildInfoCard(),
            const SizedBox(height: 16),
            _buildMontoCard(),
            const SizedBox(height: 16),
            if (_multa!.observaciones != null && _multa!.observaciones!.isNotEmpty)
              _buildObservacionesCard(),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildHeaderCard() {
    final estadoColor = _getEstadoColor();
    
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [estadoColor, estadoColor.withOpacity(0.7)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            // Icono del tipo
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.2),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Icon(
                _getTipoIcon(_multa!.tipo),
                color: Colors.white,
                size: 40,
              ),
            ),
            const SizedBox(height: 16),
            
            // Tipo de multa
            Text(
              _multa!.tipoDisplay,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 24,
                fontWeight: FontWeight.bold,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            
            // Estado
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                _multa!.estaVencida && _multa!.estado == 'pendiente'
                    ? 'VENCIDA'
                    : _multa!.estadoDisplay.toUpperCase(),
                style: TextStyle(
                  color: estadoColor,
                  fontWeight: FontWeight.bold,
                  fontSize: 14,
                ),
              ),
            ),
            
            // Indicador de días vencidos
            if (_multa!.estaVencida && _multa!.estado == 'pendiente')
              Padding(
                padding: const EdgeInsets.only(top: 12),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.warning_amber, color: Colors.white70, size: 18),
                    const SizedBox(width: 6),
                    Text(
                      'Vencida hace ${_multa!.diasVencimiento.abs()} días',
                      style: const TextStyle(
                        color: Colors.white70,
                        fontSize: 14,
                      ),
                    ),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoCard() {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.info_outline, color: Colors.grey[600]),
                const SizedBox(width: 8),
                const Text(
                  'Información',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            const Divider(height: 1),
            const SizedBox(height: 16),
            
            // Descripción
            _buildInfoRow(
              'Descripción',
              _multa!.descripcion,
              Icons.description,
              isFullWidth: true,
            ),
            const SizedBox(height: 16),
            
            // Unidad
            if (_multa!.unidadNombre != null)
              _buildInfoRow(
                'Unidad',
                _multa!.unidadNombre!,
                Icons.home,
              ),
            
            // Fecha de emisión
            _buildInfoRow(
              'Fecha de Emisión',
              _dateFormat.format(_multa!.fechaEmision),
              Icons.calendar_today,
            ),
            
            // Fecha de vencimiento
            _buildInfoRow(
              'Fecha de Vencimiento',
              _dateFormat.format(_multa!.fechaVencimiento),
              Icons.event_busy,
              valueColor: _multa!.estaVencida ? Colors.red[700] : null,
            ),
            
            // Fecha de pago (si existe)
            if (_multa!.fechaPago != null)
              _buildInfoRow(
                'Fecha de Pago',
                _dateFormat.format(_multa!.fechaPago!),
                Icons.check_circle,
                valueColor: Colors.green[700],
              ),
            
            // Creado por
            if (_multa!.creadoPor != null && _multa!.creadoPor!.isNotEmpty)
              _buildInfoRow(
                'Registrado por',
                _multa!.creadoPor!,
                Icons.person,
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildMontoCard() {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.payments, color: Colors.grey[600]),
                const SizedBox(width: 8),
                const Text(
                  'Detalle del Monto',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            const Divider(height: 1),
            const SizedBox(height: 16),
            
            // Monto base
            _buildMontoRow('Monto de la Multa', _multa!.monto),
            
            // Recargo por mora
            if (_multa!.tieneRecargo) ...[
              const SizedBox(height: 8),
              _buildMontoRow(
                'Recargo por Mora',
                _multa!.recargoMora,
                isRecargo: true,
              ),
              const SizedBox(height: 12),
              const Divider(height: 1),
              const SizedBox(height: 12),
            ],
            
            // Monto total
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'MONTO TOTAL',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  _currencyFormat.format(_multa!.montoTotal),
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: _multa!.estado == 'pagado' ? Colors.green[700] : Colors.red[700],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildObservacionesCard() {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.note, color: Colors.grey[600]),
                const SizedBox(width: 8),
                const Text(
                  'Observaciones',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            const Divider(height: 1),
            const SizedBox(height: 12),
            Text(
              _multa!.observaciones!,
              style: TextStyle(
                color: Colors.grey[700],
                fontSize: 14,
                height: 1.5,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value, IconData icon, {bool isFullWidth = false, Color? valueColor}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: isFullWidth
          ? Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(icon, size: 18, color: Colors.grey[500]),
                    const SizedBox(width: 8),
                    Text(
                      label,
                      style: TextStyle(
                        color: Colors.grey[600],
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Padding(
                  padding: const EdgeInsets.only(left: 26),
                  child: Text(
                    value,
                    style: TextStyle(
                      fontSize: 15,
                      color: valueColor ?? Colors.grey[800],
                    ),
                  ),
                ),
              ],
            )
          : Row(
              children: [
                Icon(icon, size: 18, color: Colors.grey[500]),
                const SizedBox(width: 8),
                Text(
                  '$label:',
                  style: TextStyle(
                    color: Colors.grey[600],
                    fontSize: 14,
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    value,
                    style: TextStyle(
                      fontWeight: FontWeight.w500,
                      color: valueColor ?? Colors.grey[800],
                    ),
                    textAlign: TextAlign.end,
                  ),
                ),
              ],
            ),
    );
  }

  Widget _buildMontoRow(String label, double monto, {bool isRecargo = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            color: isRecargo ? Colors.red[600] : Colors.grey[700],
            fontSize: 14,
          ),
        ),
        Text(
          isRecargo ? '+ ${_currencyFormat.format(monto)}' : _currencyFormat.format(monto),
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w500,
            color: isRecargo ? Colors.red[600] : Colors.grey[800],
          ),
        ),
      ],
    );
  }

  IconData _getTipoIcon(String tipo) {
    switch (tipo) {
      case 'ruido':
        return Icons.volume_up;
      case 'estacionamiento':
        return Icons.local_parking;
      case 'area_comun':
        return Icons.meeting_room;
      case 'pago_atrasado':
        return Icons.payment;
      case 'dano_propiedad':
        return Icons.handyman;
      case 'incumplimiento':
        return Icons.rule;
      default:
        return Icons.report_problem;
    }
  }

  Widget _buildErrorWidget() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 64, color: Colors.red[300]),
            const SizedBox(height: 16),
            Text(
              'Error al cargar detalle',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Colors.grey[700],
              ),
            ),
            const SizedBox(height: 8),
            Text(
              _error ?? 'Error desconocido',
              style: TextStyle(color: Colors.grey[600]),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: _cargarDetalle,
              icon: const Icon(Icons.refresh),
              label: const Text('Reintentar'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.red[700],
                foregroundColor: Colors.white,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
