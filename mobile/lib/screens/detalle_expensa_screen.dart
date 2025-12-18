import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/pago.dart';
import '../services/pago_service.dart';

class DetalleExpensaScreen extends StatefulWidget {
  final int expensaId;

  const DetalleExpensaScreen({super.key, required this.expensaId});

  @override
  State<DetalleExpensaScreen> createState() => _DetalleExpensaScreenState();
}

class _DetalleExpensaScreenState extends State<DetalleExpensaScreen> {
  final PagoService _pagoService = PagoService();
  final _currencyFormat = NumberFormat.currency(locale: 'es_BO', symbol: 'Bs.');
  final _dateFormat = DateFormat('dd/MM/yyyy');

  Expensa? _expensa;
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

    final response = await _pagoService.getExpensaDetalle(widget.expensaId);

    setState(() {
      _isLoading = false;
      if (response.success && response.data != null) {
        _expensa = response.data;
      } else {
        _error = response.error;
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_expensa != null ? 'Expensa ${_expensa!.mesNombre}' : 'Detalle de Expensa'),
        backgroundColor: Colors.green[700],
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
    if (_expensa == null) return const SizedBox.shrink();

    return RefreshIndicator(
      onRefresh: _cargarDetalle,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header con estado y montos principales
            _buildHeaderCard(),
            
            const SizedBox(height: 16),
            
            // Información de la unidad
            _buildInfoCard(),
            
            const SizedBox(height: 16),
            
            // Desglose de conceptos
            if (_expensa!.conceptos.isNotEmpty) ...[
              _buildConceptosSection(),
              const SizedBox(height: 16),
            ],
            
            // Historial de pagos
            _buildPagosSection(),
            
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildHeaderCard() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: _expensa!.estado == 'pagado'
              ? [Colors.green[600]!, Colors.green[800]!]
              : _expensa!.estaVencida
                  ? [Colors.red[600]!, Colors.red[800]!]
                  : [Colors.orange[600]!, Colors.orange[800]!],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.2),
            blurRadius: 8,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                _expensa!.mesNombre,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  _expensa!.estadoDisplay,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            ],
          ),
          
          const SizedBox(height: 20),
          
          // Monto total
          const Text(
            'Monto Total',
            style: TextStyle(
              color: Colors.white70,
              fontSize: 14,
            ),
          ),
          Text(
            _currencyFormat.format(_expensa!.montoTotal),
            style: const TextStyle(
              color: Colors.white,
              fontSize: 32,
              fontWeight: FontWeight.bold,
            ),
          ),
          
          const SizedBox(height: 16),
          
          // Barra de progreso
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Pagado: ${_currencyFormat.format(_expensa!.montoPagado)}',
                    style: const TextStyle(color: Colors.white70, fontSize: 13),
                  ),
                  Text(
                    '${(_expensa!.porcentajePagado * 100).toStringAsFixed(0)}%',
                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: LinearProgressIndicator(
                  value: _expensa!.porcentajePagado,
                  backgroundColor: Colors.white.withOpacity(0.3),
                  valueColor: const AlwaysStoppedAnimation<Color>(Colors.white),
                  minHeight: 8,
                ),
              ),
            ],
          ),
          
          if (_expensa!.saldoPendiente > 0) ...[
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.15),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Saldo Pendiente',
                    style: TextStyle(color: Colors.white, fontWeight: FontWeight.w500),
                  ),
                  Text(
                    _currencyFormat.format(_expensa!.saldoPendiente),
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildInfoCard() {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Información',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            _buildInfoRow(Icons.home, 'Unidad', '${_expensa!.unidadCodigo} - ${_expensa!.unidadDireccion}'),
            _buildInfoRow(Icons.calendar_today, 'Fecha Emisión', _dateFormat.format(_expensa!.fechaEmision)),
            _buildInfoRow(
              Icons.event,
              'Vencimiento',
              _dateFormat.format(_expensa!.fechaVencimiento),
              valueColor: _expensa!.estaVencida ? Colors.red : null,
            ),
            if (_expensa!.estaVencida && _expensa!.diasVencidos > 0)
              _buildInfoRow(
                Icons.warning,
                'Días vencido',
                '${_expensa!.diasVencidos} días',
                valueColor: Colors.red,
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value, {Color? valueColor}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Icon(icon, size: 20, color: Colors.grey[600]),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              label,
              style: TextStyle(color: Colors.grey[600], fontSize: 14),
            ),
          ),
          Text(
            value,
            style: TextStyle(
              fontWeight: FontWeight.w500,
              color: valueColor ?? Colors.grey[800],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildConceptosSection() {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.receipt_long, color: Colors.green[700]),
                const SizedBox(width: 8),
                const Text(
                  'Desglose de Conceptos',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            const Divider(),
            ..._expensa!.conceptos.map((concepto) => _buildConceptoItem(concepto)),
            const Divider(),
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Total',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 15,
                    ),
                  ),
                  Text(
                    _currencyFormat.format(_expensa!.montoTotal),
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 15,
                      color: Colors.green[700],
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

  Widget _buildConceptoItem(ConceptoPago concepto) {
    IconData icon;
    Color iconColor;
    
    switch (concepto.tipo.toLowerCase()) {
      case 'mantenimiento':
        icon = Icons.build;
        iconColor = Colors.blue;
        break;
      case 'agua':
        icon = Icons.water_drop;
        iconColor = Colors.cyan;
        break;
      case 'luz':
        icon = Icons.lightbulb;
        iconColor = Colors.amber;
        break;
      case 'gas':
        icon = Icons.local_fire_department;
        iconColor = Colors.orange;
        break;
      case 'multa':
        icon = Icons.gavel;
        iconColor = Colors.red;
        break;
      case 'reserva':
        icon = Icons.event;
        iconColor = Colors.purple;
        break;
      default:
        icon = Icons.attach_money;
        iconColor = Colors.grey;
    }

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: iconColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, size: 20, color: iconColor),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  concepto.descripcion,
                  style: const TextStyle(fontWeight: FontWeight.w500),
                ),
                Text(
                  concepto.tipoDisplay,
                  style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                ),
              ],
            ),
          ),
          Text(
            _currencyFormat.format(concepto.monto),
            style: const TextStyle(fontWeight: FontWeight.w500),
          ),
        ],
      ),
    );
  }

  Widget _buildPagosSection() {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.payments, color: Colors.green[700]),
                const SizedBox(width: 8),
                const Text(
                  'Historial de Pagos',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            if (_expensa!.pagos.isEmpty)
              Container(
                padding: const EdgeInsets.symmetric(vertical: 24),
                child: Center(
                  child: Column(
                    children: [
                      Icon(Icons.payment, size: 48, color: Colors.grey[400]),
                      const SizedBox(height: 8),
                      Text(
                        'Sin pagos registrados',
                        style: TextStyle(color: Colors.grey[600]),
                      ),
                    ],
                  ),
                ),
              )
            else
              ...(_expensa!.pagos.map((pago) => _buildPagoItem(pago))),
          ],
        ),
      ),
    );
  }

  Widget _buildPagoItem(Pago pago) {
    IconData metodoIcon;
    switch (pago.metodoPago) {
      case 'efectivo':
        metodoIcon = Icons.payments;
        break;
      case 'transferencia':
        metodoIcon = Icons.account_balance;
        break;
      case 'qr':
        metodoIcon = Icons.qr_code;
        break;
      case 'tarjeta':
        metodoIcon = Icons.credit_card;
        break;
      default:
        metodoIcon = Icons.payment;
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.green[50],
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.green[200]!),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.green[100],
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(metodoIcon, size: 20, color: Colors.green[700]),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _currencyFormat.format(pago.monto),
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Colors.green[700],
                      ),
                    ),
                    Text(
                      pago.metodoPagoDisplay,
                      style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                    ),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    _dateFormat.format(pago.fechaPago),
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
                      color: Colors.grey[700],
                    ),
                  ),
                  if (pago.numeroComprobante != null && pago.numeroComprobante!.isNotEmpty)
                    Text(
                      '#${pago.numeroComprobante}',
                      style: TextStyle(fontSize: 11, color: Colors.grey[500]),
                    ),
                ],
              ),
            ],
          ),
          if (pago.observaciones != null && pago.observaciones!.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(
              pago.observaciones!,
              style: TextStyle(
                fontSize: 13,
                fontStyle: FontStyle.italic,
                color: Colors.grey[600],
              ),
            ),
          ],
          if (pago.registradoPorNombre != null) ...[
            const SizedBox(height: 4),
            Text(
              'Registrado por: ${pago.registradoPorNombre}',
              style: TextStyle(fontSize: 11, color: Colors.grey[500]),
            ),
          ],
        ],
      ),
    );
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
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 8),
            Text(
              _error ?? 'Error desconocido',
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Colors.grey[600],
                  ),
            ),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: _cargarDetalle,
              icon: const Icon(Icons.refresh),
              label: const Text('Reintentar'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.green[700],
                foregroundColor: Colors.white,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
