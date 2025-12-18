"""
Vistas del Dashboard Administrativo.
Consolida estadísticas de todos los módulos del sistema.
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from django.db.models import Count, Sum, Q, Avg
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal

from pagos.models import Expensa, Pago
from multas.models import Multa
from residentes.models import Residente
from unidades.models import UnidadHabitacional
from reservas.models import Reserva
from vehiculos.models import Vehiculo
from bitacora.models import Bitacora


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    """
    Endpoint consolidado de estadísticas para el dashboard administrativo.
    GET /api/dashboard/stats/
    
    Retorna:
    - KPIs principales (residentes, unidades, morosidad, ingresos)
    - Estadísticas de pagos/expensas
    - Estadísticas de multas
    - Estadísticas de reservas
    - Estadísticas de IA (reconocimientos)
    - Datos para gráficos temporales
    """
    hoy = timezone.now().date()
    inicio_mes = hoy.replace(day=1)
    hace_12_meses = hoy - timedelta(days=365)
    
    # ==================== KPIs PRINCIPALES ====================
    
    # Residentes
    total_residentes = Residente.objects.count()
    residentes_activos = Residente.objects.filter(estado='activo').count()
    
    # Unidades
    total_unidades = UnidadHabitacional.objects.count()
    unidades_ocupadas = UnidadHabitacional.objects.filter(estado='ocupado').count()
    tasa_ocupacion = (unidades_ocupadas / total_unidades * 100) if total_unidades > 0 else 0
    
    # Vehículos
    total_vehiculos = Vehiculo.objects.filter(estado='activo').count()
    
    # ==================== FINANZAS ====================
    
    # Expensas del mes actual
    expensas_mes = Expensa.objects.filter(
        fecha_emision__year=hoy.year,
        fecha_emision__month=hoy.month
    )
    
    # Totales de expensas
    total_expensas = Expensa.objects.count()
    expensas_pendientes = Expensa.objects.filter(estado='pendiente').count()
    expensas_vencidas = Expensa.objects.filter(
        estado__in=['pendiente', 'pagado_parcial'],
        fecha_vencimiento__lt=hoy
    ).count()
    
    # Montos
    monto_total_emitido = Expensa.objects.aggregate(
        total=Sum('monto_total')
    )['total'] or Decimal('0.00')
    
    monto_total_cobrado = Expensa.objects.aggregate(
        total=Sum('monto_pagado')
    )['total'] or Decimal('0.00')
    
    monto_pendiente = monto_total_emitido - monto_total_cobrado
    
    # Tasa de cobro
    tasa_cobro = (float(monto_total_cobrado) / float(monto_total_emitido) * 100) if monto_total_emitido > 0 else 0
    
    # Ingresos del mes
    ingresos_mes = Pago.objects.filter(
        fecha_pago__year=hoy.year,
        fecha_pago__month=hoy.month
    ).aggregate(total=Sum('monto'))['total'] or Decimal('0.00')
    
    # ==================== MOROSIDAD ====================
    
    # Unidades morosas (con al menos una expensa vencida)
    unidades_morosas = Expensa.objects.filter(
        estado__in=['pendiente', 'pagado_parcial'],
        fecha_vencimiento__lt=hoy
    ).values('unidad').distinct().count()
    
    tasa_morosidad = (unidades_morosas / total_unidades * 100) if total_unidades > 0 else 0
    
    # Top 5 unidades con mayor deuda
    deudas_por_unidad = Expensa.objects.filter(
        estado__in=['pendiente', 'pagado_parcial']
    ).values('unidad__codigo', 'unidad__id').annotate(
        deuda_total=Sum('monto_total') - Sum('monto_pagado')
    ).order_by('-deuda_total')[:5]
    
    # ==================== MULTAS ====================
    
    total_multas = Multa.objects.count()
    multas_pendientes = Multa.objects.filter(estado='pendiente').count()
    multas_pagadas = Multa.objects.filter(estado='pagado').count()
    
    monto_multas_pendiente = Multa.objects.filter(
        estado='pendiente'
    ).aggregate(
        total=Sum('monto')
    )['total'] or Decimal('0.00')
    
    monto_multas_cobrado = Multa.objects.filter(
        estado='pagado'
    ).aggregate(
        total=Sum('monto')
    )['total'] or Decimal('0.00')
    
    # Multas por tipo
    multas_por_tipo = []
    for tipo_key, tipo_label in Multa.TIPO_CHOICES:
        count = Multa.objects.filter(tipo=tipo_key).count()
        if count > 0:
            multas_por_tipo.append({
                'tipo': tipo_label,
                'cantidad': count
            })
    
    # ==================== RESERVAS ====================
    
    total_reservas = Reserva.objects.count()
    reservas_pendientes = Reserva.objects.filter(estado='pendiente').count()
    reservas_mes = Reserva.objects.filter(
        fecha_reserva__year=hoy.year,
        fecha_reserva__month=hoy.month
    ).count()
    
    # Reservas por área común (top 5)
    reservas_por_area = Reserva.objects.values(
        'area_comun__nombre'
    ).annotate(
        total=Count('id')
    ).order_by('-total')[:5]
    
    # ==================== ESTADÍSTICAS DE IA ====================
    
    # Obtener de bitácora los eventos de reconocimiento
    reconocimientos_faciales = Bitacora.objects.filter(
        accion__icontains='reconocimiento facial'
    ).count()
    
    reconocimientos_placas = Bitacora.objects.filter(
        accion__icontains='placa'
    ).count()
    
    # Intentar obtener estadísticas más detalladas si están disponibles
    try:
        # Reconocimientos exitosos vs fallidos del mes
        reconocimientos_mes = Bitacora.objects.filter(
            fecha__gte=inicio_mes,
            accion__icontains='reconocimiento'
        )
        ia_exitosos = reconocimientos_mes.filter(
            Q(detalle__icontains='exitoso') | Q(detalle__icontains='identificado')
        ).count()
        ia_fallidos = reconocimientos_mes.filter(
            Q(detalle__icontains='fallido') | Q(detalle__icontains='no identificado')
        ).count()
    except Exception:
        ia_exitosos = 0
        ia_fallidos = 0
    
    # ==================== DATOS PARA GRÁFICOS ====================
    
    # Ingresos últimos 6 meses
    ingresos_por_mes = []
    for i in range(6):
        fecha = hoy - timedelta(days=30*i)
        total = Pago.objects.filter(
            fecha_pago__year=fecha.year,
            fecha_pago__month=fecha.month
        ).aggregate(total=Sum('monto'))['total'] or 0
        ingresos_por_mes.append({
            'mes': fecha.strftime('%b %Y'),
            'ingresos': float(total)
        })
    ingresos_por_mes.reverse()
    
    # Expensas por estado
    expensas_por_estado = [
        {'estado': 'Pagadas', 'cantidad': Expensa.objects.filter(estado='pagado').count()},
        {'estado': 'Pendientes', 'cantidad': Expensa.objects.filter(estado='pendiente').count()},
        {'estado': 'Parciales', 'cantidad': Expensa.objects.filter(estado='pagado_parcial').count()},
        {'estado': 'Vencidas', 'cantidad': expensas_vencidas},
    ]
    
    # Multas últimos 6 meses
    multas_por_mes = []
    for i in range(6):
        fecha = hoy - timedelta(days=30*i)
        count = Multa.objects.filter(
            fecha_emision__year=fecha.year,
            fecha_emision__month=fecha.month
        ).count()
        multas_por_mes.append({
            'mes': fecha.strftime('%b %Y'),
            'cantidad': count
        })
    multas_por_mes.reverse()
    
    # ==================== RESPUESTA CONSOLIDADA ====================
    
    return Response({
        # KPIs principales
        'kpis': {
            'residentes': {
                'total': total_residentes,
                'activos': residentes_activos,
            },
            'unidades': {
                'total': total_unidades,
                'ocupadas': unidades_ocupadas,
                'tasa_ocupacion': round(tasa_ocupacion, 1),
            },
            'vehiculos': total_vehiculos,
            'reservas_pendientes': reservas_pendientes,
        },
        
        # Finanzas
        'finanzas': {
            'monto_emitido': float(monto_total_emitido),
            'monto_cobrado': float(monto_total_cobrado),
            'monto_pendiente': float(monto_pendiente),
            'tasa_cobro': round(tasa_cobro, 1),
            'ingresos_mes': float(ingresos_mes),
            'expensas': {
                'total': total_expensas,
                'pendientes': expensas_pendientes,
                'vencidas': expensas_vencidas,
            }
        },
        
        # Morosidad
        'morosidad': {
            'unidades_morosas': unidades_morosas,
            'tasa_morosidad': round(tasa_morosidad, 1),
            'top_deudores': list(deudas_por_unidad),
        },
        
        # Multas
        'multas': {
            'total': total_multas,
            'pendientes': multas_pendientes,
            'pagadas': multas_pagadas,
            'monto_pendiente': float(monto_multas_pendiente),
            'monto_cobrado': float(monto_multas_cobrado),
            'por_tipo': multas_por_tipo,
        },
        
        # Reservas
        'reservas': {
            'total': total_reservas,
            'pendientes': reservas_pendientes,
            'mes_actual': reservas_mes,
            'por_area': list(reservas_por_area),
        },
        
        # IA
        'ia': {
            'reconocimientos_faciales': reconocimientos_faciales,
            'reconocimientos_placas': reconocimientos_placas,
            'mes_actual': {
                'exitosos': ia_exitosos,
                'fallidos': ia_fallidos,
            }
        },
        
        # Datos para gráficos
        'graficos': {
            'ingresos_por_mes': ingresos_por_mes,
            'expensas_por_estado': expensas_por_estado,
            'multas_por_mes': multas_por_mes,
            'multas_por_tipo': multas_por_tipo,
            'reservas_por_area': list(reservas_por_area),
        }
    })
