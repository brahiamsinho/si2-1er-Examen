from rest_framework import viewsets, status, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django_filters.rest_framework import DjangoFilterBackend
from django.db import models
from django.utils import timezone
from bitacora.utils import registrar_bitacora
from users.permissions import CanManageResidentes, IsOwnerOrAdmin
from .models import Residente
from .serializers import (
    ResidenteSerializer,
    ResidenteCreateSerializer,
    ResidenteUpdateSerializer
)


class ResidenteViewSet(viewsets.ModelViewSet):
    """ViewSet para el CRUD de residentes"""

    queryset = Residente.objects.all()
    serializer_class = ResidenteSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    # Campos válidos para filtrado/búsqueda/ordenamiento
    filterset_fields = ["estado", "tipo", "usuario", "unidad_habitacional"]
    search_fields = ["nombre", "apellido", "email", "ci", "unidad_habitacional"]
    ordering_fields = ["nombre", "fecha_creacion", "fecha_ingreso", "unidad_habitacional"]
    ordering = ["-fecha_creacion"]

    def get_serializer_class(self):
        """Retorna el serializer apropiado según la acción"""
        if self.action == "create":
            return ResidenteCreateSerializer
        elif self.action in ["update", "partial_update"]:
            return ResidenteUpdateSerializer
        return ResidenteSerializer

    def get_queryset(self):
        """Filtra el queryset según los permisos del usuario"""
        queryset = super().get_queryset()

        # Si el usuario no tiene permisos para gestionar residentes, solo puede ver su propio perfil
        if not self.request.user.tiene_permiso("gestionar_residentes"):
            # Para la relación OneToOne en reversa, acceder al atributo puede lanzar DoesNotExist
            try:
                residente_profile = self.request.user.residente_profile
            except Residente.DoesNotExist:
                return queryset.none()
            else:
                return queryset.filter(id=residente_profile.id)

        return queryset.select_related("usuario")

    def perform_create(self, serializer):
        """Crear un nuevo residente"""
        if not self.request.user.tiene_permiso("gestionar_residentes"):
            raise permissions.PermissionDenied(
                "No tienes permisos para crear residentes"
            )

        residente = serializer.save()

        # Registrar en bitácora
        registrar_bitacora(
            request=self.request,
            usuario=self.request.user,
            accion="Crear",
            descripcion=f"Se creó el residente {residente.nombre_completo}",
            modulo="RESIDENTES",
        )

    def perform_update(self, serializer):
        """Actualizar un residente"""
        if not self.request.user.tiene_permiso("gestionar_residentes"):
            raise permissions.PermissionDenied(
                "No tienes permisos para actualizar residentes"
            )

        residente = serializer.save()

        # Registrar en bitácora
        registrar_bitacora(
            request=self.request,
            usuario=self.request.user,
            accion="Actualizar",
            descripcion=f"Se actualizó el residente {residente.nombre_completo}",
            modulo="RESIDENTES",
        )

    def perform_destroy(self, instance):
        """Eliminar un residente"""
        if not self.request.user.tiene_permiso("gestionar_residentes"):
            raise permissions.PermissionDenied(
                "No tienes permisos para eliminar residentes"
            )

        nombre_residente = instance.nombre_completo
        instance.delete()

        # Registrar en bitácora
        registrar_bitacora(
            request=self.request,
            usuario=self.request.user,
            accion="Eliminar",
            descripcion=f"Se eliminó el residente {nombre_residente}",
            modulo="RESIDENTES",
        )

    @action(detail=False, methods=["get"])
    def estadisticas(self, request):
        """Estadísticas de residentes"""
        if not request.user.tiene_permiso("gestionar_residentes"):
            return Response(
                {"error": "No tienes permisos para ver estadísticas"},
                status=status.HTTP_403_FORBIDDEN,
            )

        queryset = self.get_queryset()

        stats = {
            'total': queryset.count(),
            'activos': queryset.filter(estado='activo').count(),
            'inactivos': queryset.filter(estado='inactivo').count(),
            'suspendidos': queryset.filter(estado='suspendido').count(),
            'en_proceso': queryset.filter(estado='en_proceso').count(),
            'por_tipo': dict(queryset.values('tipo').annotate(
                count=models.Count('id')
            ).values_list('tipo', 'count')),
            'nuevos_este_mes': queryset.filter(
                fecha_creacion__gte=timezone.now().replace(day=1)
            ).count(),
        }

        return Response(stats)

    @action(detail=False, methods=["get"])
    def disponibles_para_usuario(self, request):
        """Lista residentes disponibles para vincular con usuarios"""
        if not request.user.tiene_permiso("gestionar_usuarios"):
            return Response(
                {"error": "No tienes permisos para ver residentes disponibles"},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Residentes que no tienen usuario vinculado
        residentes_disponibles = Residente.objects.filter(
            usuario__isnull=True
        ).values(
            'id',
            'nombre',
            'apellido',
            'email',
            'ci',
            'telefono',
            'unidad_habitacional'
        )
        
        return Response(list(residentes_disponibles))

    @action(detail=False, methods=["get"])
    def por_unidad(self, request):
        """Lista residentes por unidad habitacional"""
        unidad = request.query_params.get('unidad')
        
        if not unidad:
            return Response(
                {"error": "Debe especificar la unidad habitacional"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        queryset = Residente.objects.filter(unidad_habitacional=unidad)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def mi_perfil(self, request):
        """Obtiene el perfil del residente del usuario autenticado"""
        try:
            # Buscar el residente asociado al usuario actual
            residente = Residente.objects.get(usuario=request.user)
            serializer = self.get_serializer(residente)
            return Response(serializer.data)
        except Residente.DoesNotExist:
            return Response(
                {"error": "No se encontró un perfil de residente para este usuario"},
                status=status.HTTP_404_NOT_FOUND,
            )
        except Exception as e:
            return Response(
                {"error": f"Error al obtener perfil: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )