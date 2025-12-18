import React from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';
import { MoreHorizontal, Edit, Trash2, Eye, Home } from 'lucide-react';
import type { Residente } from '@/types';

interface ResidenteTableProps {
  data: Residente[];
  loading: boolean;
  onEdit: (item: Residente) => void;
  onDelete: (item: Residente) => void;
  onView?: (item: Residente) => void;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function ResidenteTable({ 
  data, 
  loading, 
  onEdit, 
  onDelete, 
  onView,
  page,
  totalPages,
  onPageChange
}: ResidenteTableProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getStatusBadge = (estado: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      'activo': 'default',
      'inactivo': 'secondary',
      'suspendido': 'destructive',
      'en_proceso': 'outline',
    };

    const labels: Record<string, string> = {
      'activo': 'Activo',
      'inactivo': 'Inactivo',
      'suspendido': 'Suspendido',
      'en_proceso': 'En Proceso',
    };

    return (
      <Badge variant={variants[estado] || 'outline'}>
        {labels[estado] || estado}
      </Badge>
    );
  };

  const getTipoBadge = (tipo: string) => {
    const variants: Record<string, "default" | "secondary"> = {
      'propietario': 'default',
      'inquilino': 'secondary',
    };

    const labels: Record<string, string> = {
      'propietario': 'Propietario',
      'inquilino': 'Inquilino',
    };

    return (
      <Badge variant={variants[tipo] || 'outline'}>
        {labels[tipo] || tipo}
      </Badge>
    );
  };

  const getUnidadBadge = (unidad: string) => {
    return (
      <Badge variant="outline" className="font-mono">
        <Home className="h-3 w-3 mr-1" />
        {unidad}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-gray-200 animate-pulse rounded" />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No se encontraron residentes registrados
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Foto</TableHead>
              <TableHead>Nombre Completo</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>CI</TableHead>
              <TableHead>Unidad Habitacional</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Fecha de Ingreso</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((residente) => (
              <TableRow key={residente.id}>
                <TableCell>
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={residente.foto_perfil || undefined} alt={residente.nombre_completo} />
                    <AvatarFallback>
                      {residente.nombre.charAt(0)}{residente.apellido.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </TableCell>
                <TableCell className="font-medium">
                  {residente.nombre} {residente.apellido}
                </TableCell>
                <TableCell>{residente.email}</TableCell>
                <TableCell>{residente.telefono}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-mono">
                    {residente.ci}
                  </Badge>
                </TableCell>
                <TableCell>{getUnidadBadge(residente.unidad_habitacional)}</TableCell>
                <TableCell>{getTipoBadge(residente.tipo)}</TableCell>
                <TableCell>
                  <div className="text-sm">{formatDate(residente.fecha_ingreso)}</div>
                </TableCell>
                <TableCell>{getStatusBadge(residente.estado)}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {onView && (
                        <DropdownMenuItem onClick={() => onView(residente)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Ver detalles
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => onEdit(residente)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => onDelete(residente)}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Paginación */}
      <div className="flex justify-center mt-4">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => page > 1 && onPageChange(page - 1)}
                size="default"
                className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
            
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const pageNumber = i + 1;
              const isActive = pageNumber === page;
              
              return (
                <PaginationItem key={pageNumber}>
                  <PaginationLink
                    onClick={() => onPageChange(pageNumber)}
                    isActive={isActive}
                    size="icon"
                    className="cursor-pointer"
                  >
                    {pageNumber}
                  </PaginationLink>
                </PaginationItem>
              );
            })}
            
            {totalPages > 5 && (
              <>
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink
                    onClick={() => onPageChange(totalPages)}
                    isActive={page === totalPages}
                    size="icon"
                    className="cursor-pointer"
                  >
                    {totalPages}
                  </PaginationLink>
                </PaginationItem>
              </>
            )}
            
            <PaginationItem>
              <PaginationNext 
                onClick={() => page < totalPages && onPageChange(page + 1)}
                size="default"
                className={page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </>
  );
}
