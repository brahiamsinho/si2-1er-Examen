import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import CondominiumIcon from "./app-logo";
import {
  BarChart3,
  Users,
  UserCog,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  BookOpen,
  Home,
  Bell,
  LandPlot,
  WavesLadder,
  ClipboardList,
  Camera,
  Shield,
  Calendar,
  AlertCircle,
  DollarSign,
  Car,
} from "lucide-react";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface ModuleItem {
  id: string;
  name: string;
  icon: React.ElementType;
  route?: string;
  submodules?: ModuleItem[];
}

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function Sidebar({ collapsed, setCollapsed }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  const [expandedModules, setExpandedModules] = useState<string[]>([]);

  // Función para verificar si una ruta está activa
  const isRouteActive = (route?: string) => {
    if (!route) return false;

    // Caso especial para dashboard
    if (route === "/admin/dashboard") {
      return currentPath === "/admin/dashboard" || currentPath === "/admin";
    }
    // Para otras rutas, verificar si la ruta actual comienza con la ruta del módulo
    return currentPath.startsWith(route);
  };

  // Función para comprobar si un módulo o sus submódulos están activos
  const isModuleActive = (module: ModuleItem): boolean => {
    if (module.route && isRouteActive(module.route)) return true;

    if (module.submodules) {
      return module.submodules.some(
        (submodule) =>
          (submodule.route && isRouteActive(submodule.route)) ||
          (submodule.submodules && isModuleActive(submodule))
      );
    }

    return false;
  };

  // Función para alternar la expansión de un módulo
  const toggleExpand = (moduleId: string) => {
    setExpandedModules((prev) =>
      prev.includes(moduleId)
        ? prev.filter((id) => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  // Función para verificar si un módulo está expandido
  const isExpanded = (moduleId: string) => expandedModules.includes(moduleId);

  const sidebarModules: ModuleItem[] = [
    {
      id: "dashboard",
      name: "Dashboard",
      icon: BarChart3,
      route: "/admin/dashboard",
    },
    {
      id: "usuarios-sistema",
      name: "Usuarios y Seguridad",
      icon: ShieldCheck,
      submodules: [
        {
          id: "permisos",
          name: "Permisos",
          icon: ShieldCheck,
          route: "/admin/permisos",
        },
        { id: "roles", name: "Roles", icon: Users, route: "/admin/roles" },
        {
          id: "usuarios",
          name: "Usuarios",
          icon: Users,
          route: "/admin/usuarios",
        },
      ],
    },
    {
      id: "administracion-interna",
      name: "Administración Interna",
      icon: UserCog,
      submodules: [
        {
          id: "personal",
          name: "Personal",
          icon: Users,
          route: "/admin/personal",
        },
        {
          id: "residentes",
          name: "Residentes",
          icon: Users,
          route: "/admin/residentes",
        },
        {
          id: "unidades",
          name: "Unidades Habitacionales",
          icon: Home,
          route: "/admin/unidades",
        },
        {
          id: "multas",
          name: "Multas",
          icon: AlertCircle,
          route: "/admin/multas",
        },
        {
          id: "pagos",
          name: "Pagos/Expensas",
          icon: DollarSign,
          route: "/admin/pagos",
        },
        {
          id: "vehiculos",
          name: "Vehículos",
          icon: Car,
          route: "/admin/vehiculos",
        },
      ],
    },
    {
      id: "areas-comunes",
      name: "Áreas Comunes",
      icon: LandPlot,
      submodules: [
        {
          id: "areas-comunes",
          name: "Áreas Comunes",
          icon: WavesLadder,
          route: "/admin/areas-comunes",
        },
        {
          id: "reservas",
          name: "Reservas",
          icon: Calendar,
          route: "/admin/reservas",
        },
        {
          id: "inventario",
          name: "Inventario",
          icon: ClipboardList,
          route: "/admin/inventario",
        },
      ],
    },
    {
      id: "notificaciones",
      name: "Notificaciones",
      icon: Bell,
      route: "/admin/notificaciones",
    },
    {
      id: "bitacora",
      name: "Bitácora",
      icon: BookOpen,
      route: "/admin/bitacora",
    },
    {
      id: "seguridad",
      name: "Seguridad",
      icon: Shield,
      submodules: [
        {
          id: "seguridad-general",
          name: "Seguridad General",
          icon: ShieldCheck,
          route: "/admin/seguridad",
        },
        {
          id: "reconocimiento-facial",
          name: "Reconocimiento Facial",
          icon: Camera,
          route: "/admin/reconocimiento-facial",
        },
      ],
    },
  ];

  return (
    <aside
      className={`h-full bg-sky-100 relative border-r border-gray-200 transition-all duration-300 ${
        collapsed ? "w-[64px]" : "w-[320px]"
      }`}
    >
      <div
        className={`p-6 flex flex-col h-full ${
          collapsed ? "items-center px-2" : ""
        }`}
      >
        <div
          className={`flex items-center gap-2 mb-6 ${
            collapsed ? "justify-center" : ""
          }`}
        >
          {!collapsed && (
            <Link
              to="/admin/home"
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <CondominiumIcon className="w-8 h-8" />
              <span className="text-lg font-bold text-blue-700">
                Smart Condominium
              </span>
            </Link>
          )}
          {collapsed && (
            <button
              className="w-8 h-8 bg-white border border-gray-300 rounded-lg flex items-center justify-center shadow transition-all duration-300"
              onClick={() => setCollapsed(false)}
              aria-label="Expandir sidebar"
            >
              <ChevronRight className="w-5 h-5 text-blue-700" />
            </button>
          )}
        </div>
        <nav className={`space-y-2 flex-1 ${collapsed ? "w-full" : ""}`}>
          {sidebarModules.map((module) => (
            <div key={module.id} className="flex flex-col">
              {/* Elemento principal del módulo */}
              <button
                onClick={() => {
                  if (module.submodules?.length) {
                    toggleExpand(module.id);
                  } else if (module.route) {
                    navigate(module.route);
                  }
                }}
                className={`w-full flex items-center px-2 py-2 text-sm rounded-lg text-left transition-colors ${
                  isModuleActive(module)
                    ? "bg-blue-400 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <module.icon
                  className={collapsed ? "w-6 h-6 mx-auto" : "w-5 h-5 mr-3"}
                />

                {!collapsed && (
                  <>
                    <span className="flex-1">{module.name}</span>
                    {module.submodules?.length ? (
                      isExpanded(module.id) ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )
                    ) : null}
                  </>
                )}
              </button>

              {/* Submódulos, solo visibles cuando no está colapsado y el módulo está expandido */}
              {!collapsed &&
                module.submodules?.length &&
                isExpanded(module.id) && (
                  <div className="ml-5 mt-1 space-y-1 border-l-2 border-gray-200 pl-3">
                    {module.submodules.map((submodule) => (
                      <button
                        key={submodule.id}
                        onClick={() =>
                          submodule.route && navigate(submodule.route)
                        }
                        className={`w-full flex items-center px-2 py-1.5 text-sm rounded-md text-left transition-colors ${
                          submodule.route && isRouteActive(submodule.route)
                            ? "bg-blue-300 text-white"
                            : "text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        <submodule.icon className="w-4 h-4 mr-2" />
                        <span>{submodule.name}</span>
                      </button>
                    ))}
                  </div>
                )}

              {/* Mostrar indicadores de submódulos cuando está colapsado */}
              {collapsed && module.submodules?.length && (
                <div className="flex justify-center">
                  <div className="w-1 h-1 bg-gray-400 rounded-full mt-1"></div>
                </div>
              )}
            </div>
          ))}
        </nav>
        {!collapsed && (
          <button
            className="absolute top-4 right-2 w-8 h-8 bg-white border border-gray-300 rounded-lg flex items-center justify-center shadow transition-all duration-300"
            onClick={() => setCollapsed(true)}
            aria-label="Contraer sidebar"
          >
            <ChevronLeft className="w-5 h-5 text-blue-700" />
          </button>
        )}
      </div>
    </aside>
  );
}
