import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/multa.dart';
import '../services/multa_service.dart';
import 'detalle_multa_screen.dart';

class MultasScreen extends StatefulWidget {
  const MultasScreen({super.key});

  @override
  State<MultasScreen> createState() => _MultasScreenState();
}

class _MultasScreenState extends State<MultasScreen> with SingleTickerProviderStateMixin {
  final MultaService _multaService = MultaService();
  final _currencyFormat = NumberFormat.currency(locale: 'es_BO', symbol: 'Bs.');
  
  List<Multa> _multas = [];
  ResumenMultas? _resumen;
  bool _isLoading = true;
  String? _error;
  
  late TabController _tabController;
  String _filtroActual = 'todas';

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _tabController.addListener(_onTabChanged);
    _cargarMultas();
  }

  @override
  void dispose() {
    _tabController.removeListener(_onTabChanged);
    _tabController.dispose();
    super.dispose();
  }

  void _onTabChanged() {
    if (_tabController.indexIsChanging) return;
    
    switch (_tabController.index) {
      case 0:
        _filtroActual = 'todas';
        break;
      case 1:
        _filtroActual = 'pendientes';
        break;
      case 2:
        _filtroActual = 'vencidas';
        break;
      case 3:
        _filtroActual = 'pagadas';
        break;
    }
    setState(() {});
  }

  Future<void> _cargarMultas() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    final response = await _multaService.getMisMultas();

    setState(() {
      _isLoading = false;
      if (response.success && response.data != null) {
        _multas = response.data!;
        _resumen = _multaService.calcularResumen(_multas);
      } else {
        _error = response.error;
      }
    });
  }

  List<Multa> get _multasFiltradas {
    switch (_filtroActual) {
      case 'pendientes':
        return _multas.where((m) => m.estado == 'pendiente' && !m.estaVencida).toList();
      case 'vencidas':
        return _multas.where((m) => m.estaVencida).toList();
      case 'pagadas':
        return _multas.where((m) => m.estado == 'pagado').toList();
      default:
        return _multas;
    }
  }

  void _navegarADetalle(Multa multa) async {
    final result = await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => DetalleMultaScreen(multaId: multa.id),
      ),
    );

    if (result == true) {
      _cargarMultas();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Mis Multas'),
        backgroundColor: Colors.red[700],
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _cargarMultas,
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: Colors.white,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white70,
          isScrollable: true,
          tabs: const [
            Tab(text: 'Todas'),
            Tab(text: 'Pendientes'),
            Tab(text: 'Vencidas'),
            Tab(text: 'Pagadas'),
          ],
        ),
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
      onRefresh: _cargarMultas,
      child: CustomScrollView(
        slivers: [
          // Resumen de multas
          if (_resumen != null)
            SliverToBoxAdapter(
              child: _buildResumenCard(),
            ),
          
          // Lista de multas
          _multasFiltradas.isEmpty
              ? SliverFillRemaining(child: _buildEmptyWidget())
              : SliverPadding(
                  padding: const EdgeInsets.all(16),
                  sliver: SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (context, index) {
                        final multa = _multasFiltradas[index];
                        return _buildMultaCard(multa);
                      },
                      childCount: _multasFiltradas.length,
                    ),
                  ),
                ),
        ],
      ),
    );
  }

  Widget _buildResumenCard() {
    return Container(
      margin: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [Colors.red[700]!, Colors.red[500]!],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.red.withOpacity(0.3),
            blurRadius: 8,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.gavel, color: Colors.white, size: 28),
                const SizedBox(width: 12),
                const Text(
                  'Resumen de Multas',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(
                  child: _buildResumenItem(
                    'Pendiente',
                    _currencyFormat.format(_resumen!.montoTotalPendiente),
                    Icons.pending_actions,
                  ),
                ),
                Container(
                  width: 1,
                  height: 50,
                  color: Colors.white24,
                ),
                Expanded(
                  child: _buildResumenItem(
                    'Pagado',
                    _currencyFormat.format(_resumen!.montoTotalPagado),
                    Icons.check_circle,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            const Divider(color: Colors.white24),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                _buildChip('${_resumen!.totalMultas} Total', Colors.white24),
                _buildChip('${_resumen!.pendientes} Pendientes', Colors.orange[300]!),
                _buildChip('${_resumen!.vencidas} Vencidas', Colors.red[300]!),
                _buildChip('${_resumen!.pagadas} Pagadas', Colors.green[300]!),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildResumenItem(String label, String valor, IconData icon) {
    return Column(
      children: [
        Icon(icon, color: Colors.white70, size: 24),
        const SizedBox(height: 8),
        Text(
          valor,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: TextStyle(
            color: Colors.white.withOpacity(0.8),
            fontSize: 12,
          ),
        ),
      ],
    );
  }

  Widget _buildChip(String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        label,
        style: const TextStyle(
          color: Colors.white,
          fontSize: 12,
          fontWeight: FontWeight.w500,
        ),
      ),
    );
  }

  Widget _buildMultaCard(Multa multa) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: multa.estaVencida
            ? BorderSide(color: Colors.red[400]!, width: 2)
            : BorderSide.none,
      ),
      child: InkWell(
        onTap: () => _navegarADetalle(multa),
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header: Tipo y Estado
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Row(
                      children: [
                        _buildTipoIcon(multa.tipo),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            multa.tipoDisplay,
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ),
                  _buildEstadoChip(multa),
                ],
              ),
              const SizedBox(height: 12),
              
              // Descripción
              Text(
                multa.descripcion,
                style: TextStyle(
                  color: Colors.grey[600],
                  fontSize: 14,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 12),
              
              // Fechas
              Row(
                children: [
                  Icon(Icons.calendar_today, size: 14, color: Colors.grey[500]),
                  const SizedBox(width: 4),
                  Text(
                    'Emitida: ${DateFormat('dd/MM/yyyy').format(multa.fechaEmision)}',
                    style: TextStyle(
                      color: Colors.grey[600],
                      fontSize: 12,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Icon(
                    Icons.event_busy,
                    size: 14,
                    color: multa.estaVencida ? Colors.red[500] : Colors.grey[500],
                  ),
                  const SizedBox(width: 4),
                  Text(
                    'Vence: ${DateFormat('dd/MM/yyyy').format(multa.fechaVencimiento)}',
                    style: TextStyle(
                      color: multa.estaVencida ? Colors.red[500] : Colors.grey[600],
                      fontSize: 12,
                      fontWeight: multa.estaVencida ? FontWeight.bold : FontWeight.normal,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              
              // Monto
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  if (multa.tieneRecargo)
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Monto: ${_currencyFormat.format(multa.monto)}',
                          style: TextStyle(
                            color: Colors.grey[600],
                            fontSize: 12,
                            decoration: TextDecoration.lineThrough,
                          ),
                        ),
                        Text(
                          '+ Mora: ${_currencyFormat.format(multa.recargoMora)}',
                          style: TextStyle(
                            color: Colors.red[600],
                            fontSize: 12,
                          ),
                        ),
                      ],
                    )
                  else
                    const SizedBox.shrink(),
                  Text(
                    _currencyFormat.format(multa.montoTotal),
                    style: TextStyle(
                      color: multa.estado == 'pagado' ? Colors.green[700] : Colors.red[700],
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
              
              // Indicador de vencida
              if (multa.estaVencida && multa.estado == 'pendiente')
                Container(
                  margin: const EdgeInsets.only(top: 12),
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: Colors.red[50],
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.red[200]!),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.warning_amber, size: 16, color: Colors.red[700]),
                      const SizedBox(width: 6),
                      Text(
                        'Vencida hace ${multa.diasVencimiento.abs()} días',
                        style: TextStyle(
                          color: Colors.red[700],
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTipoIcon(String tipo) {
    IconData icon;
    Color color;
    
    switch (tipo) {
      case 'ruido':
        icon = Icons.volume_up;
        color = Colors.purple[400]!;
        break;
      case 'estacionamiento':
        icon = Icons.local_parking;
        color = Colors.blue[400]!;
        break;
      case 'area_comun':
        icon = Icons.meeting_room;
        color = Colors.teal[400]!;
        break;
      case 'pago_atrasado':
        icon = Icons.payment;
        color = Colors.orange[400]!;
        break;
      case 'dano_propiedad':
        icon = Icons.handyman;
        color = Colors.red[400]!;
        break;
      case 'incumplimiento':
        icon = Icons.rule;
        color = Colors.amber[600]!;
        break;
      default:
        icon = Icons.report_problem;
        color = Colors.grey[400]!;
    }
    
    return Container(
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Icon(icon, color: color, size: 20),
    );
  }

  Widget _buildEstadoChip(Multa multa) {
    Color bgColor;
    Color textColor;
    String label;
    
    if (multa.estaVencida && multa.estado == 'pendiente') {
      bgColor = Colors.red[100]!;
      textColor = Colors.red[700]!;
      label = 'VENCIDA';
    } else {
      switch (multa.estado) {
        case 'pendiente':
          bgColor = Colors.orange[100]!;
          textColor = Colors.orange[700]!;
          label = 'Pendiente';
          break;
        case 'pagado':
          bgColor = Colors.green[100]!;
          textColor = Colors.green[700]!;
          label = 'Pagado';
          break;
        case 'cancelado':
          bgColor = Colors.grey[200]!;
          textColor = Colors.grey[600]!;
          label = 'Cancelado';
          break;
        case 'en_disputa':
          bgColor = Colors.purple[100]!;
          textColor = Colors.purple[700]!;
          label = 'En disputa';
          break;
        default:
          bgColor = Colors.grey[200]!;
          textColor = Colors.grey[600]!;
          label = multa.estadoDisplay;
      }
    }
    
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: textColor,
          fontSize: 12,
          fontWeight: FontWeight.bold,
        ),
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
              'Error al cargar multas',
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
              onPressed: _cargarMultas,
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

  Widget _buildEmptyWidget() {
    String mensaje;
    IconData icon;
    
    switch (_filtroActual) {
      case 'pendientes':
        mensaje = 'No tienes multas pendientes\n¡Excelente!';
        icon = Icons.celebration;
        break;
      case 'vencidas':
        mensaje = 'No tienes multas vencidas\n¡Muy bien!';
        icon = Icons.thumb_up;
        break;
      case 'pagadas':
        mensaje = 'No hay multas pagadas registradas';
        icon = Icons.history;
        break;
      default:
        mensaje = 'No tienes multas registradas\n¡Felicidades!';
        icon = Icons.emoji_events;
    }
    
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 64, color: Colors.green[300]),
            const SizedBox(height: 16),
            Text(
              mensaje,
              style: TextStyle(
                fontSize: 16,
                color: Colors.grey[600],
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
