import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/pago.dart';
import '../services/pago_service.dart';
import 'detalle_expensa_screen.dart';

class FinanzasScreen extends StatefulWidget {
  const FinanzasScreen({super.key});

  @override
  State<FinanzasScreen> createState() => _FinanzasScreenState();
}

class _FinanzasScreenState extends State<FinanzasScreen> with SingleTickerProviderStateMixin {
  final PagoService _pagoService = PagoService();
  final _currencyFormat = NumberFormat.currency(locale: 'es_BO', symbol: 'Bs.');
  
  List<ExpensaResumen> _expensas = [];
  ResumenFinanciero? _resumen;
  bool _isLoading = true;
  String? _error;
  
  late TabController _tabController;
  String _filtroActual = 'todas';

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _tabController.addListener(_onTabChanged);
    _cargarExpensas();
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
        _filtroActual = 'pagadas';
        break;
    }
    setState(() {});
  }

  Future<void> _cargarExpensas() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    final response = await _pagoService.getMisExpensas();

    setState(() {
      _isLoading = false;
      if (response.success && response.data != null) {
        _expensas = response.data!;
        _resumen = _pagoService.calcularResumen(_expensas);
      } else {
        _error = response.error;
      }
    });
  }

  List<ExpensaResumen> get _expensasFiltradas {
    switch (_filtroActual) {
      case 'pendientes':
        return _expensas.where((e) => e.estado != 'pagado').toList();
      case 'pagadas':
        return _expensas.where((e) => e.estado == 'pagado').toList();
      default:
        return _expensas;
    }
  }

  void _navegarADetalle(ExpensaResumen expensa) async {
    final result = await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => DetalleExpensaScreen(expensaId: expensa.id),
      ),
    );

    if (result == true) {
      _cargarExpensas();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Mis Finanzas'),
        backgroundColor: Colors.green[700],
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _cargarExpensas,
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: Colors.white,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white70,
          tabs: const [
            Tab(text: 'Todas'),
            Tab(text: 'Pendientes'),
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
      onRefresh: _cargarExpensas,
      child: CustomScrollView(
        slivers: [
          // Resumen financiero
          if (_resumen != null)
            SliverToBoxAdapter(
              child: _buildResumenCard(),
            ),
          
          // Lista de expensas
          _expensasFiltradas.isEmpty
              ? SliverFillRemaining(child: _buildEmptyWidget())
              : SliverPadding(
                  padding: const EdgeInsets.all(16),
                  sliver: SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (context, index) {
                        final expensa = _expensasFiltradas[index];
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: _buildExpensaCard(expensa),
                        );
                      },
                      childCount: _expensasFiltradas.length,
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
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [Colors.green[600]!, Colors.green[800]!],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.green.withOpacity(0.3),
            blurRadius: 8,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Resumen de Cuenta',
            style: TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: _buildResumenItem(
                  'Saldo Pendiente',
                  _currencyFormat.format(_resumen!.totalPendiente),
                  Icons.account_balance_wallet,
                  _resumen!.totalPendiente > 0 ? Colors.red[100]! : Colors.green[100]!,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildResumenItem(
                  'Total Pagado',
                  _currencyFormat.format(_resumen!.totalPagado),
                  Icons.check_circle,
                  Colors.white,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _buildResumenChip(
                  '${_resumen!.expensasPendientes} pendientes',
                  Colors.orange[100]!,
                  Colors.orange[800]!,
                ),
              ),
              const SizedBox(width: 8),
              if (_resumen!.expensasVencidas > 0)
                Expanded(
                  child: _buildResumenChip(
                    '${_resumen!.expensasVencidas} vencidas',
                    Colors.red[100]!,
                    Colors.red[800]!,
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildResumenItem(String label, String value, IconData icon, Color valueColor) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, color: Colors.white70, size: 16),
            const SizedBox(width: 4),
            Text(
              label,
              style: const TextStyle(
                color: Colors.white70,
                fontSize: 12,
              ),
            ),
          ],
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: TextStyle(
            color: valueColor,
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
      ],
    );
  }

  Widget _buildResumenChip(String label, Color bgColor, Color textColor) {
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
          fontWeight: FontWeight.w500,
        ),
        textAlign: TextAlign.center,
      ),
    );
  }

  Widget _buildExpensaCard(ExpensaResumen expensa) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: expensa.estaVencida
            ? BorderSide(color: Colors.red[300]!, width: 1.5)
            : BorderSide.none,
      ),
      child: InkWell(
        onTap: () => _navegarADetalle(expensa),
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header con periodo y estado
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          expensa.mesNombre,
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Text(
                          'Unidad: ${expensa.unidadCodigo}',
                          style: TextStyle(
                            fontSize: 13,
                            color: Colors.grey[600],
                          ),
                        ),
                      ],
                    ),
                  ),
                  _buildEstadoChip(expensa.estado, expensa.estadoDisplay, expensa.estaVencida),
                ],
              ),
              
              const SizedBox(height: 12),
              
              // Barra de progreso de pago
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Pagado: ${_currencyFormat.format(expensa.montoPagado)}',
                        style: TextStyle(
                          fontSize: 13,
                          color: Colors.grey[600],
                        ),
                      ),
                      Text(
                        'Total: ${_currencyFormat.format(expensa.montoTotal)}',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                          color: Colors.grey[800],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(4),
                    child: LinearProgressIndicator(
                      value: expensa.porcentajePagado,
                      backgroundColor: Colors.grey[200],
                      valueColor: AlwaysStoppedAnimation<Color>(
                        expensa.estado == 'pagado' 
                            ? Colors.green 
                            : expensa.estaVencida 
                                ? Colors.red 
                                : Colors.orange,
                      ),
                      minHeight: 6,
                    ),
                  ),
                ],
              ),
              
              const SizedBox(height: 12),
              
              // Footer con saldo y vencimiento
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  if (expensa.saldoPendiente > 0)
                    Text(
                      'Saldo: ${_currencyFormat.format(expensa.saldoPendiente)}',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: expensa.estaVencida ? Colors.red : Colors.orange[700],
                      ),
                    )
                  else
                    const Text(
                      '✓ Pagado completo',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                        color: Colors.green,
                      ),
                    ),
                  Row(
                    children: [
                      Icon(
                        Icons.calendar_today,
                        size: 14,
                        color: expensa.estaVencida ? Colors.red : Colors.grey[500],
                      ),
                      const SizedBox(width: 4),
                      Text(
                        DateFormat('dd/MM/yyyy').format(expensa.fechaVencimiento),
                        style: TextStyle(
                          fontSize: 12,
                          color: expensa.estaVencida ? Colors.red : Colors.grey[600],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              
              if (expensa.estaVencida)
                Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.red[50],
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.warning, size: 14, color: Colors.red[700]),
                        const SizedBox(width: 4),
                        Text(
                          'Vencida',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.red[700],
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildEstadoChip(String estado, String display, bool vencida) {
    Color bgColor;
    Color textColor;
    
    if (vencida && estado != 'pagado') {
      bgColor = Colors.red[100]!;
      textColor = Colors.red[800]!;
    } else {
      switch (estado) {
        case 'pagado':
          bgColor = Colors.green[100]!;
          textColor = Colors.green[800]!;
          break;
        case 'pagado_parcial':
          bgColor = Colors.blue[100]!;
          textColor = Colors.blue[800]!;
          break;
        case 'pendiente':
          bgColor = Colors.orange[100]!;
          textColor = Colors.orange[800]!;
          break;
        case 'vencido':
          bgColor = Colors.red[100]!;
          textColor = Colors.red[800]!;
          break;
        default:
          bgColor = Colors.grey[100]!;
          textColor = Colors.grey[800]!;
      }
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        display,
        style: TextStyle(
          color: textColor,
          fontSize: 12,
          fontWeight: FontWeight.w500,
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
            Icon(
              Icons.error_outline,
              size: 64,
              color: Colors.red[300],
            ),
            const SizedBox(height: 16),
            Text(
              'Error al cargar finanzas',
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
              onPressed: _cargarExpensas,
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

  Widget _buildEmptyWidget() {
    String mensaje;
    switch (_filtroActual) {
      case 'pendientes':
        mensaje = 'No tienes expensas pendientes';
        break;
      case 'pagadas':
        mensaje = 'No tienes expensas pagadas';
        break;
      default:
        mensaje = 'No tienes expensas registradas';
    }

    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.receipt_long,
            size: 64,
            color: Colors.grey[400],
          ),
          const SizedBox(height: 16),
          Text(
            mensaje,
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  color: Colors.grey[600],
                ),
          ),
          const SizedBox(height: 8),
          Text(
            'Las expensas aparecerán aquí cuando se generen',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Colors.grey[500],
                ),
          ),
        ],
      ),
    );
  }
}
