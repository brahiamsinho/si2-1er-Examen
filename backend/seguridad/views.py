"""
Vistas para el módulo de seguridad
Incluye CRUD y procesamiento de IA
"""

from rest_framework import generics, status, permissions, viewsets, filters
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from django.utils import timezone
from datetime import datetime, timedelta
import json

from .models import (
    PersonaAutorizada,
    VehiculoAutorizado,
    RegistroAcceso,
    RegistroVehiculo,
    ConfiguracionSeguridad,
    AlertaSeguridad,
)
from .serializers import (
    PersonaAutorizadaSerializer,
    PersonaAutorizadaCreateSerializer,
    VehiculoAutorizadoSerializer,
    VehiculoAutorizadoCreateSerializer,
    RegistroAccesoSerializer,
    RegistroVehiculoSerializer,
    ConfiguracionSeguridadSerializer,
    AlertaSeguridadSerializer,
    ReconocimientoFacialSerializer,
    ReconocimientoPlacaSerializer,
    RespuestaReconocimientoSerializer,
)
from vehiculos.models import Vehiculo
from .ai_services import seguridad_ai
from users.decorators import requiere_permisos
from bitacora.utils import registrar_bitacora


class PersonaAutorizadaViewSet(viewsets.ModelViewSet):
    """CRUD para personas autorizadas"""

    queryset = PersonaAutorizada.objects.all()
    serializer_class = PersonaAutorizadaSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["tipo_acceso", "activo"]
    search_fields = ["nombre", "ci", "email"]
    ordering_fields = ["nombre", "fecha_registro"]
    ordering = ["nombre"]

    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return PersonaAutorizadaCreateSerializer
        return PersonaAutorizadaSerializer

    def list(self, request, *args, **kwargs):
        if not request.user.is_authenticated:
            return Response(
                {"detail": "No autenticado"}, status=status.HTTP_401_UNAUTHORIZED
            )
        if not request.user.tiene_permisos(["seguridad.ver_personas"]):
            return Response(
                {"detail": "Sin permisos"}, status=status.HTTP_403_FORBIDDEN
            )
        return super().list(request, *args, **kwargs)

    def create(self, request, *args, **kwargs):
        if not request.user.is_authenticated:
            return Response(
                {"detail": "No autenticado"}, status=status.HTTP_401_UNAUTHORIZED
            )
        if not request.user.tiene_permisos(["seguridad.crear_personas"]):
            return Response(
                {"detail": "Sin permisos"}, status=status.HTTP_403_FORBIDDEN
            )
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        if not request.user.is_authenticated:
            return Response(
                {"detail": "No autenticado"}, status=status.HTTP_401_UNAUTHORIZED
            )
        if not request.user.tiene_permisos(["seguridad.editar_personas"]):
            return Response(
                {"detail": "Sin permisos"}, status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        if not request.user.is_authenticated:
            return Response(
                {"detail": "No autenticado"}, status=status.HTTP_401_UNAUTHORIZED
            )
        if not request.user.tiene_permisos(["seguridad.eliminar_personas"]):
            return Response(
                {"detail": "Sin permisos"}, status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)


class VehiculoAutorizadoViewSet(viewsets.ModelViewSet):
    """CRUD para vehículos autorizados"""

    queryset = VehiculoAutorizado.objects.all()
    serializer_class = VehiculoAutorizadoSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["tipo_vehiculo", "activo"]
    search_fields = ["placa", "propietario", "marca", "modelo"]
    ordering_fields = ["placa", "fecha_registro"]
    ordering = ["placa"]

    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return VehiculoAutorizadoCreateSerializer
        return VehiculoAutorizadoSerializer

    def list(self, request, *args, **kwargs):
        if not request.user.is_authenticated:
            return Response(
                {"detail": "No autenticado"}, status=status.HTTP_401_UNAUTHORIZED
            )
        if not request.user.tiene_permisos(["seguridad.ver_vehiculos"]):
            return Response(
                {"detail": "Sin permisos"}, status=status.HTTP_403_FORBIDDEN
            )
        return super().list(request, *args, **kwargs)

    def create(self, request, *args, **kwargs):
        if not request.user.is_authenticated:
            return Response(
                {"detail": "No autenticado"}, status=status.HTTP_401_UNAUTHORIZED
            )
        if not request.user.tiene_permisos(["seguridad.crear_vehiculos"]):
            return Response(
                {"detail": "Sin permisos"}, status=status.HTTP_403_FORBIDDEN
            )
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        if not request.user.is_authenticated:
            return Response(
                {"detail": "No autenticado"}, status=status.HTTP_401_UNAUTHORIZED
            )
        if not request.user.tiene_permisos(["seguridad.editar_vehiculos"]):
            return Response(
                {"detail": "Sin permisos"}, status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        if not request.user.is_authenticated:
            return Response(
                {"detail": "No autenticado"}, status=status.HTTP_401_UNAUTHORIZED
            )
        if not request.user.tiene_permisos(["seguridad.eliminar_vehiculos"]):
            return Response(
                {"detail": "Sin permisos"}, status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)


class RegistroAccesoViewSet(viewsets.ReadOnlyModelViewSet):
    """Vista de solo lectura para registros de acceso"""

    queryset = RegistroAcceso.objects.all()
    serializer_class = RegistroAccesoSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["tipo_acceso", "resultado", "persona"]
    search_fields = ["persona__nombre", "persona__ci"]
    ordering_fields = ["fecha_hora", "confianza"]
    ordering = ["-fecha_hora"]

    def list(self, request, *args, **kwargs):
        if not request.user.is_authenticated:
            return Response(
                {"detail": "No autenticado"}, status=status.HTTP_401_UNAUTHORIZED
            )
        if not request.user.tiene_permisos(["seguridad.ver_registros_acceso"]):
            return Response(
                {"detail": "Sin permisos"}, status=status.HTTP_403_FORBIDDEN
            )
        return super().list(request, *args, **kwargs)


class RegistroVehiculoViewSet(viewsets.ReadOnlyModelViewSet):
    """Vista de solo lectura para registros de vehículos"""

    queryset = RegistroVehiculo.objects.all()
    serializer_class = RegistroVehiculoSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["resultado", "tipo_vehiculo", "vehiculo"]
    search_fields = ["placa", "vehiculo__propietario"]
    ordering_fields = ["fecha_hora", "confianza"]
    ordering = ["-fecha_hora"]

    def list(self, request, *args, **kwargs):
        if not request.user.is_authenticated:
            return Response(
                {"detail": "No autenticado"}, status=status.HTTP_401_UNAUTHORIZED
            )
        if not request.user.tiene_permisos(["seguridad.ver_registros_vehiculos"]):
            return Response(
                {"detail": "Sin permisos"}, status=status.HTTP_403_FORBIDDEN
            )
        return super().list(request, *args, **kwargs)


class AlertaSeguridadViewSet(viewsets.ModelViewSet):
    """CRUD para alertas de seguridad"""

    queryset = AlertaSeguridad.objects.all()
    serializer_class = AlertaSeguridadSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["tipo", "severidad", "resuelta"]
    search_fields = ["titulo", "descripcion"]
    ordering_fields = ["fecha_hora", "severidad"]
    ordering = ["-fecha_hora"]

    def list(self, request, *args, **kwargs):
        if not request.user.is_authenticated:
            return Response(
                {"detail": "No autenticado"}, status=status.HTTP_401_UNAUTHORIZED
            )
        if not request.user.tiene_permisos(["seguridad.ver_alertas"]):
            return Response(
                {"detail": "Sin permisos"}, status=status.HTTP_403_FORBIDDEN
            )
        return super().list(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        if not request.user.is_authenticated:
            return Response(
                {"detail": "No autenticado"}, status=status.HTTP_401_UNAUTHORIZED
            )
        if not request.user.tiene_permisos(["seguridad.resolver_alertas"]):
            return Response(
                {"detail": "Sin permisos"}, status=status.HTTP_403_FORBIDDEN
            )
        instance = self.get_object()
        if "resuelta" in request.data and request.data["resuelta"]:
            instance.fecha_resolucion = timezone.now()
            instance.resuelta_por = request.user
        return super().update(request, *args, **kwargs)


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
@requiere_permisos(["seguridad.procesar_reconocimiento_facial"])
def procesar_reconocimiento_facial(request):
    """Procesa reconocimiento facial y registra el acceso"""
    try:
        serializer = ReconocimientoFacialSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {
                    "exito": False,
                    "error": "Datos inválidos",
                    "detalles": serializer.errors,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        imagen = serializer.validated_data["imagen"]
        tipo_acceso = serializer.validated_data["tipo_acceso"]
        observaciones = serializer.validated_data.get("observaciones", "")

        # Leer imagen como bytes
        imagen_bytes = imagen.read()

        # Procesar con IA
        resultado_ia = seguridad_ai.procesar_reconocimiento_facial(
            imagen_bytes, tipo_acceso
        )

        if not resultado_ia["exito"]:
            # Crear registro de acceso fallido
            registro = RegistroAcceso.objects.create(
                tipo_acceso=tipo_acceso,
                resultado="fallido",
                confianza=0.0,
                foto_capturada=imagen,
                observaciones=f"Error IA: {resultado_ia.get('mensaje', 'Error desconocido')}",
            )

            # Generar alerta si es necesario
            if "no_autorizado" in resultado_ia.get("mensaje", "").lower():
                AlertaSeguridad.objects.create(
                    tipo="acceso_no_autorizado",
                    severidad="alta",
                    titulo="Intento de acceso no autorizado",
                    descripcion=f"Intento de {tipo_acceso} sin autorización",
                    registro_acceso=registro,
                )

            return Response(
                {
                    "exito": False,
                    "mensaje": resultado_ia.get("mensaje", "Error en reconocimiento"),
                    "registro_id": registro.id,
                    "alerta_generada": True,
                }
            )

        # Buscar persona en la base de datos
        try:
            persona = PersonaAutorizada.objects.get(id=resultado_ia["persona_id"])
        except PersonaAutorizada.DoesNotExist:
            return Response(
                {"exito": False, "mensaje": "Persona no encontrada en la base de datos"}
            )

        # Crear registro de acceso exitoso
        registro = RegistroAcceso.objects.create(
            persona=persona,
            tipo_acceso=tipo_acceso,
            resultado="exitoso",
            confianza=resultado_ia["confidence"],
            foto_capturada=imagen,
            observaciones=observaciones,
        )

        # Registrar en bitácora
        registrar_bitacora(
            usuario=request.user,
            accion="reconocimiento_facial",
            detalles=f"Acceso {tipo_acceso} de {persona.nombre}",
            objeto_id=registro.id,
        )

        return Response(
            {
                "exito": True,
                "mensaje": "Reconocimiento exitoso",
                "persona_detectada": PersonaAutorizadaSerializer(persona).data,
                "registro_id": registro.id,
                "confianza": resultado_ia["confidence"],
                "alerta_generada": False,
            }
        )

    except Exception as e:
        return Response(
            {"exito": False, "error": f"Error interno: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
@requiere_permisos(["seguridad.procesar_reconocimiento_placa"])
def procesar_reconocimiento_placa(request):
    """Procesa reconocimiento de placa y registra el vehículo"""
    try:
        serializer = ReconocimientoPlacaSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {
                    "exito": False,
                    "error": "Datos inválidos",
                    "detalles": serializer.errors,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        imagen = serializer.validated_data["imagen"]
        observaciones = serializer.validated_data.get("observaciones", "")

        # Leer imagen como bytes
        imagen_bytes = imagen.read()

        # Procesar con IA
        resultado_ia = seguridad_ai.procesar_reconocimiento_placa(imagen_bytes)

        if not resultado_ia["exito"]:
            # Crear registro de vehículo fallido
            registro = RegistroVehiculo.objects.create(
                placa="DESCONOCIDA",
                resultado="fallido",
                confianza=0.0,
                foto_capturada=imagen,
                observaciones=f"Error IA: {resultado_ia.get('mensaje', 'Error desconocido')}",
            )

            return Response(
                {
                    "exito": False,
                    "mensaje": resultado_ia.get("mensaje", "Error en reconocimiento"),
                    "placa_detectada": resultado_ia.get("placa", ""),
                    "registro_id": registro.id,
                    "alerta_generada": False,
                }
            )

        placa_detectada = resultado_ia["placa"]

        # Normalizar la placa detectada (mayúsculas, sin espacios ni guiones)
        placa_normalizada = placa_detectada.upper().strip().replace(' ', '').replace('-', '')

        # Buscar vehículo en la base de datos principal (módulo vehiculos)
        vehiculo_encontrado = None
        vehiculo_info = None
        try:
            # Buscar vehículo usando select_related para optimizar consultas
            vehiculo_encontrado = Vehiculo.objects.select_related(
                'residente', 
                'residente__usuario', 
                'unidad'
            ).get(
                Q(placa__iexact=placa_normalizada) | 
                Q(placa__iexact=placa_detectada)
            )
            
            # Preparar información detallada del vehículo (compatible con frontend)
            vehiculo_info = {
                'id': vehiculo_encontrado.id,
                'placa': vehiculo_encontrado.placa,
                'marca': vehiculo_encontrado.marca,
                'modelo': vehiculo_encontrado.modelo,
                'color': vehiculo_encontrado.color,
                'anio': vehiculo_encontrado.año,
                'tipo_vehiculo': vehiculo_encontrado.tipo,
                'foto_vehiculo': vehiculo_encontrado.foto_vehiculo.url if vehiculo_encontrado.foto_vehiculo else None,
                'estado': vehiculo_encontrado.estado,
                'fecha_registro': vehiculo_encontrado.fecha_registro.isoformat() if vehiculo_encontrado.fecha_registro else None,
            }
            
            # Agregar información del residente si existe
            # IMPORTANTE: El frontend TypeScript espera que si hay 'residente', 
            # también SIEMPRE exista 'residente.unidad'. Solo incluimos residente 
            # si tenemos AMBOS (residente Y unidad).
            if vehiculo_encontrado.residente and vehiculo_encontrado.unidad:
                # Obtener nombre y apellido del residente
                residente_usuario = vehiculo_encontrado.residente.usuario if hasattr(vehiculo_encontrado.residente, 'usuario') and vehiculo_encontrado.residente.usuario else None
                
                if residente_usuario:
                    nombre = residente_usuario.first_name or ''
                    apellido = residente_usuario.last_name or ''
                else:
                    # Fallback: usar el nombre completo del residente
                    nombre_completo = str(vehiculo_encontrado.residente)
                    partes = nombre_completo.split(' ', 1)
                    nombre = partes[0] if len(partes) > 0 else ''
                    apellido = partes[1] if len(partes) > 1 else ''
                
                vehiculo_info['residente'] = {
                    'id': vehiculo_encontrado.residente.id,
                    'nombre': nombre,
                    'apellido': apellido,
                    'ci': vehiculo_encontrado.residente.ci if hasattr(vehiculo_encontrado.residente, 'ci') else None,
                    'unidad': {
                        'numero_unidad': vehiculo_encontrado.unidad.numero if hasattr(vehiculo_encontrado.unidad, 'numero') else str(vehiculo_encontrado.unidad),
                        'bloque': vehiculo_encontrado.unidad.bloque if hasattr(vehiculo_encontrado.unidad, 'bloque') else None,
                    }
                }
            
            resultado = "exitoso"
            
        except Vehiculo.DoesNotExist:
            # Si no existe en el módulo vehiculos, buscar en VehiculoAutorizado (retrocompatibilidad)
            try:
                vehiculo_autorizado = VehiculoAutorizado.objects.get(placa=placa_detectada)
                resultado = "exitoso"
                vehiculo_info = VehiculoAutorizadoSerializer(vehiculo_autorizado).data
            except VehiculoAutorizado.DoesNotExist:
                resultado = "no_autorizado"
        except Vehiculo.MultipleObjectsReturned:
            # Si hay múltiples vehículos con la misma placa (no debería pasar por unique=True)
            vehiculo_encontrado = Vehiculo.objects.filter(
                Q(placa__iexact=placa_normalizada) | 
                Q(placa__iexact=placa_detectada)
            ).first()
            resultado = "exitoso"

        # Crear registro de vehículo
        registro = RegistroVehiculo.objects.create(
            placa=placa_detectada,
            vehiculo=None,  # RegistroVehiculo usa VehiculoAutorizado, no Vehiculo
            tipo_vehiculo=resultado_ia.get("vehiculos_detectados", [{}])[0].get(
                "tipo", "auto"
            )
            if resultado_ia.get("vehiculos_detectados")
            else "auto",
            resultado=resultado,
            confianza=resultado_ia["confidence"],
            foto_capturada=imagen,
            observaciones=observaciones,
            coordenadas_placa=resultado_ia.get("coordenadas", []),
            texto_detectado=resultado_ia.get("texto_completo", ""),
        )

        # Generar alerta si el vehículo no está autorizado
        alerta_generada = False
        if resultado == "no_autorizado":
            AlertaSeguridad.objects.create(
                tipo="vehiculo_no_autorizado",
                severidad="media",
                titulo="Vehículo no autorizado detectado",
                descripcion=f"Vehículo con placa {placa_detectada} no está autorizado",
                registro_vehiculo=registro,
            )
            alerta_generada = True

        # Registrar en bitácora
        registrar_bitacora(
            usuario=request.user,
            accion="reconocimiento_placa",
            detalles=f"Detección de placa {placa_detectada} - {resultado}",
            objeto_id=registro.id,
        )

        return Response(
            {
                "exito": True,
                "mensaje": f"Placa detectada: {placa_detectada}",
                "placa_detectada": placa_detectada,
                "vehiculo": vehiculo_info if vehiculo_encontrado else None,
                "esta_registrado": vehiculo_encontrado is not None,
                "vehiculo_activo": vehiculo_encontrado.esta_activo if vehiculo_encontrado else False,
                "registro_id": registro.id,
                "confianza": resultado_ia["confidence"],
                "alerta_generada": alerta_generada,
            }
        )

    except Exception as e:
        return Response(
            {"exito": False, "error": f"Error interno: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
@requiere_permisos(["seguridad.ver_estadisticas"])
def estadisticas_seguridad(request):
    """Obtiene estadísticas del sistema de seguridad"""
    try:
        # Filtros de fecha
        fecha_inicio = request.GET.get("fecha_inicio")
        fecha_fin = request.GET.get("fecha_fin")

        if fecha_inicio:
            fecha_inicio = datetime.fromisoformat(fecha_inicio)
        else:
            fecha_inicio = timezone.now() - timedelta(days=30)

        if fecha_fin:
            fecha_fin = datetime.fromisoformat(fecha_fin)
        else:
            fecha_fin = timezone.now()

        # Estadísticas de accesos
        accesos = RegistroAcceso.objects.filter(
            fecha_hora__range=[fecha_inicio, fecha_fin]
        )
        accesos_exitosos = accesos.filter(resultado="exitoso").count()
        accesos_fallidos = accesos.filter(resultado="fallido").count()
        accesos_no_autorizados = accesos.filter(resultado="no_autorizado").count()

        # Estadísticas de vehículos
        vehiculos = RegistroVehiculo.objects.filter(
            fecha_hora__range=[fecha_inicio, fecha_fin]
        )
        vehiculos_exitosos = vehiculos.filter(resultado="exitoso").count()
        vehiculos_fallidos = vehiculos.filter(resultado="fallido").count()
        vehiculos_no_autorizados = vehiculos.filter(resultado="no_autorizado").count()

        # Alertas
        alertas = AlertaSeguridad.objects.filter(
            fecha_hora__range=[fecha_inicio, fecha_fin]
        )
        alertas_resueltas = alertas.filter(resuelta=True).count()
        alertas_pendientes = alertas.filter(resuelta=False).count()

        # Actividad por hora
        actividad_por_hora = []
        for hora in range(24):
            count = accesos.filter(fecha_hora__hour=hora).count()
            actividad_por_hora.append({"hora": hora, "accesos": count})

        return Response(
            {
                "exito": True,
                "data": {
                    "periodo": {
                        "inicio": fecha_inicio.isoformat(),
                        "fin": fecha_fin.isoformat(),
                    },
                    "accesos": {
                        "total": accesos.count(),
                        "exitosos": accesos_exitosos,
                        "fallidos": accesos_fallidos,
                        "no_autorizados": accesos_no_autorizados,
                        "tasa_exito": round(
                            (accesos_exitosos / accesos.count() * 100), 2
                        )
                        if accesos.count() > 0
                        else 0,
                    },
                    "vehiculos": {
                        "total": vehiculos.count(),
                        "exitosos": vehiculos_exitosos,
                        "fallidos": vehiculos_fallidos,
                        "no_autorizados": vehiculos_no_autorizados,
                        "tasa_exito": round(
                            (vehiculos_exitosos / vehiculos.count() * 100), 2
                        )
                        if vehiculos.count() > 0
                        else 0,
                    },
                    "alertas": {
                        "total": alertas.count(),
                        "resueltas": alertas_resueltas,
                        "pendientes": alertas_pendientes,
                    },
                    "actividad_por_hora": actividad_por_hora,
                },
            }
        )

    except Exception as e:
        return Response(
            {"exito": False, "error": f"Error obteniendo estadísticas: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
