import React, { useEffect, useState } from "react";
import AdminLayout from "@/app/layout/admin-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  Building2,
  Car,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  CalendarCheck,
  Brain,
  ScanFace,
  RefreshCw,
  FileWarning,
  BadgeDollarSign,
  CircleDollarSign,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { getDashboardStats } from "@/services/dashboard.api";
import type { DashboardStats } from "@/types/dashboard";
import { useToast } from "@/hooks/use-toast";

// Colores para los gráficos
const COLORS = ["#10B981", "#F59E0B", "#EF4444", "#6366F1", "#EC4899", "#14B8A6"];
const ESTADO_COLORS = {
  Pagadas: "#10B981",
  Pendientes: "#F59E0B",
  Parciales: "#6366F1",
  Vencidas: "#EF4444",
};

// Formatear moneda
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("es-BO", {
    style: "currency",
    currency: "BOB",
  }).format(value);
};

// Componente de KPI Card
interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  variant?: "default" | "success" | "warning" | "danger";
}

const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendValue,
  variant = "default",
}) => {
  const variantStyles: Record<string, string> = {
    default: "bg-white border-slate-200",
    success: "bg-emerald-50 border-emerald-200",
    warning: "bg-amber-50 border-amber-200",
    danger: "bg-red-50 border-red-200",
  };

  const iconStyles: Record<string, string> = {
    default: "bg-slate-100 text-slate-600",
    success: "bg-emerald-100 text-emerald-600",
    warning: "bg-amber-100 text-amber-600",
    danger: "bg-red-100 text-red-600",
  };

  return (
    <Card className={`${variantStyles[variant]} border`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
            {trend && trendValue && (
              <div className="flex items-center gap-1 text-xs">
                {trend === "up" ? (
                  <TrendingUp className="h-3 w-3 text-emerald-500" />
                ) : trend === "down" ? (
                  <TrendingDown className="h-3 w-3 text-red-500" />
                ) : null}
                <span
                  className={
                    trend === "up"
                      ? "text-emerald-500"
                      : trend === "down"
                      ? "text-red-500"
                      : "text-slate-500"
                  }
                >
                  {trendValue}
                </span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-full ${iconStyles[variant]}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Componente Loading Skeleton
const DashboardSkeleton: React.FC = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-32 w-full" />
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Skeleton className="h-80 w-full" />
      <Skeleton className="h-80 w-full" />
    </div>
  </div>
);

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDashboardStats();
      setStats(data);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Error al cargar estadísticas";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold">Dashboard</h1>
              <p className="text-muted-foreground">
                Resumen general del condominio
              </p>
            </div>
          </div>
          <DashboardSkeleton />
        </div>
      </AdminLayout>
    );
  }

  if (error || !stats) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="flex flex-col items-center justify-center h-96 gap-4">
            <AlertTriangle className="h-12 w-12 text-red-500" />
            <p className="text-lg font-medium">Error al cargar el dashboard</p>
            <Button onClick={loadStats} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reintentar
            </Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Resumen general del condominio
            </p>
          </div>
          <Button onClick={loadStats} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>

        {/* KPIs Principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Residentes Activos"
            value={stats.kpis.residentes.activos}
            subtitle={`de ${stats.kpis.residentes.total} registrados`}
            icon={<Users className="h-5 w-5" />}
          />
          <KPICard
            title="Unidades Ocupadas"
            value={stats.kpis.unidades.ocupadas}
            subtitle={`${stats.kpis.unidades.tasa_ocupacion}% ocupación`}
            icon={<Building2 className="h-5 w-5" />}
            variant="success"
          />
          <KPICard
            title="Vehículos Registrados"
            value={stats.kpis.vehiculos}
            icon={<Car className="h-5 w-5" />}
          />
          <KPICard
            title="Reservas Pendientes"
            value={stats.kpis.reservas_pendientes}
            icon={<CalendarCheck className="h-5 w-5" />}
            variant={stats.kpis.reservas_pendientes > 5 ? "warning" : "default"}
          />
        </div>

        {/* Sección Financiera */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Ingresos del Mes"
            value={formatCurrency(stats.finanzas.ingresos_mes)}
            icon={<DollarSign className="h-5 w-5" />}
            variant="success"
          />
          <KPICard
            title="Tasa de Cobro"
            value={`${stats.finanzas.tasa_cobro}%`}
            subtitle="de expensas emitidas"
            icon={<CircleDollarSign className="h-5 w-5" />}
            variant={stats.finanzas.tasa_cobro >= 80 ? "success" : "warning"}
          />
          <KPICard
            title="Monto Pendiente"
            value={formatCurrency(stats.finanzas.monto_pendiente)}
            subtitle={`${stats.finanzas.expensas.pendientes} expensas`}
            icon={<BadgeDollarSign className="h-5 w-5" />}
            variant="warning"
          />
          <KPICard
            title="Expensas Vencidas"
            value={stats.finanzas.expensas.vencidas}
            icon={<FileWarning className="h-5 w-5" />}
            variant={stats.finanzas.expensas.vencidas > 0 ? "danger" : "default"}
          />
        </div>

        {/* Morosidad Alert */}
        {stats.morosidad.tasa_morosidad > 10 && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <div>
                  <p className="font-medium text-red-700">
                    Alerta de Morosidad
                  </p>
                  <p className="text-sm text-red-600">
                    {stats.morosidad.unidades_morosas} unidades con pagos vencidos (
                    {stats.morosidad.tasa_morosidad}% de morosidad)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Gráficos Principales */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Ingresos por Mes */}
          <Card>
            <CardHeader>
              <CardTitle>Ingresos Mensuales</CardTitle>
              <CardDescription>Últimos 6 meses</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats.graficos.ingresos_por_mes}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis
                    tickFormatter={(value) =>
                      `Bs${(value / 1000).toFixed(0)}k`
                    }
                  />
                  <Tooltip
                    formatter={(value: number) => [
                      formatCurrency(value),
                      "Ingresos",
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="ingresos"
                    stroke="#10B981"
                    strokeWidth={2}
                    dot={{ fill: "#10B981" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Estado de Expensas */}
          <Card>
            <CardHeader>
              <CardTitle>Estado de Expensas</CardTitle>
              <CardDescription>Distribución por estado de pago</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats.graficos.expensas_por_estado}
                    dataKey="cantidad"
                    nameKey="estado"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ estado, percent }) =>
                      `${estado}: ${(percent * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {stats.graficos.expensas_por_estado.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          ESTADO_COLORS[
                            entry.estado as keyof typeof ESTADO_COLORS
                          ] || COLORS[index % COLORS.length]
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Segunda fila de gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Multas por Mes */}
          <Card>
            <CardHeader>
              <CardTitle>Multas Registradas</CardTitle>
              <CardDescription>Últimos 6 meses</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.graficos.multas_por_mes}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="cantidad" fill="#EF4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Multas por Tipo */}
          <Card>
            <CardHeader>
              <CardTitle>Multas por Tipo</CardTitle>
              <CardDescription>Distribución de infracciones</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats.graficos.multas_por_tipo}
                    dataKey="cantidad"
                    nameKey="tipo"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ tipo, cantidad }) => `${tipo}: ${cantidad}`}
                    labelLine={false}
                  >
                    {stats.graficos.multas_por_tipo.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Estadísticas IA y Reservas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* IA Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-500" />
                Reconocimiento IA
              </CardTitle>
              <CardDescription>Estadísticas de identificación</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <ScanFace className="h-5 w-5 text-purple-600" />
                  <span className="font-medium">Facial</span>
                </div>
                <Badge variant="secondary">
                  {stats.ia.reconocimientos_faciales} registros
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Car className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">Placas</span>
                </div>
                <Badge variant="secondary">
                  {stats.ia.reconocimientos_placas} registros
                </Badge>
              </div>
              {(stats.ia.mes_actual.exitosos > 0 ||
                stats.ia.mes_actual.fallidos > 0) && (
                <div className="pt-2 border-t">
                  <p className="text-sm text-muted-foreground mb-2">
                    Este mes:
                  </p>
                  <div className="flex gap-2">
                    <Badge className="bg-emerald-100 text-emerald-700">
                      {stats.ia.mes_actual.exitosos} exitosos
                    </Badge>
                    <Badge className="bg-red-100 text-red-700">
                      {stats.ia.mes_actual.fallidos} fallidos
                    </Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Deudores */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Top Deudores
              </CardTitle>
              <CardDescription>Unidades con mayor deuda</CardDescription>
            </CardHeader>
            <CardContent>
              {stats.morosidad.top_deudores.length > 0 ? (
                <div className="space-y-3">
                  {stats.morosidad.top_deudores.map((deudor, index) => (
                    <div
                      key={deudor.unidad__id}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-50"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-500">
                          #{index + 1}
                        </span>
                        <span className="font-medium">
                          {deudor.unidad__codigo}
                        </span>
                      </div>
                      <Badge
                        variant="destructive"
                        className="bg-red-100 text-red-700"
                      >
                        {formatCurrency(deudor.deuda_total)}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay unidades con deuda
                </p>
              )}
            </CardContent>
          </Card>

          {/* Reservas por Área */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarCheck className="h-5 w-5 text-emerald-500" />
                Reservas por Área
              </CardTitle>
              <CardDescription>Áreas más solicitadas</CardDescription>
            </CardHeader>
            <CardContent>
              {stats.graficos.reservas_por_area.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart
                    data={stats.graficos.reservas_por_area}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis
                      dataKey="area_comun__nombre"
                      type="category"
                      width={100}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip />
                    <Bar dataKey="total" fill="#10B981" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay reservas registradas
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Resumen de Multas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KPICard
            title="Total Multas"
            value={stats.multas.total}
            subtitle={`${stats.multas.pendientes} pendientes`}
            icon={<FileWarning className="h-5 w-5" />}
          />
          <KPICard
            title="Multas Cobradas"
            value={formatCurrency(stats.multas.monto_cobrado)}
            icon={<DollarSign className="h-5 w-5" />}
            variant="success"
          />
          <KPICard
            title="Multas Pendientes"
            value={formatCurrency(stats.multas.monto_pendiente)}
            icon={<AlertTriangle className="h-5 w-5" />}
            variant={stats.multas.monto_pendiente > 0 ? "warning" : "default"}
          />
        </div>
      </div>
    </AdminLayout>
  );
};

export default DashboardPage;
