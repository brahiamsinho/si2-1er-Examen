import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import AdminPage from "../pages/admin/admin.page";
import AdminLoginPage from "@/pages/auth/AdminLoginPage";
import ProtectedRoute from "@/app/auth/ProtectedRoute";
import PermisosCRUD from "../pages/admin/usuarios/roles-permisos/permiso";
import RolForm from "../pages/admin/usuarios/roles-permisos/rol";
import BitacoraPage from "@/pages/admin/bitacora.page";
import PersonalPage from "../pages/admin/personal/personal.page";
import ResidentesPage from "../pages/admin/residentes/residentes.page";
import UsuariosPage from "../pages/admin/usuarios/users.page";
import NotificacionesPage from "../pages/admin/notificaciones/notificaciones.page";
import UnidadesPage from "../pages/admin/unidades/unidades.page";
import AccountSettingsPage from "./auth/account-settings.page";
import AreasComunesPage from "@/pages/admin/areas-comunes/areas-comunes.page";
import ReservasPage from "@/pages/admin/reservas/reservas.page";
import InventarioPage from "@/pages/admin/inventario/inventario.page";
import SeguridadSimplePage from "@/pages/admin/seguridad/seguridad-simple.page";
import ReconocimientoFacialPage from "@/pages/admin/reconocimiento-facial.page";
import MultasPage from "@/pages/admin/multas/multas.page";
import PagosPage from "@/pages/admin/pagos/pagos.page";
import VehiculosPage from "@/pages/admin/vehiculos/vehiculos.page";

export default function AppRouter() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/admin" replace />} />
        {/* Rutas protegidas de administración */}
        <Route
          path="/admin/permisos"
          element={
            <ProtectedRoute requireAdmin={true}>
              <PermisosCRUD />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/roles"
          element={
            <ProtectedRoute requireAdmin={true}>
              <RolForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/bitacora"
          element={
            <ProtectedRoute requireAdmin={true}>
              <BitacoraPage />
            </ProtectedRoute>
          }
        />
        {/* auth */}
        {/* Ya no hay login/registro de cliente en web: redirigir a /admin */}
        <Route path="/login" element={<Navigate to="/admin" replace />} />
        <Route path="/register" element={<Navigate to="/admin" replace />} />
        <Route
          path="/email-verification"
          element={<Navigate to="/admin" replace />}
        />
        <Route
          path="/code-verification"
          element={<Navigate to="/admin" replace />}
        />

        {/* admin */}
        <Route path="/admin" element={<AdminLoginPage />} />
        <Route
          path="/admin/home"
          element={
            <ProtectedRoute requireAdmin={true}>
              <AdminPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/residentes"
          element={
            <ProtectedRoute requireAdmin={true}>
              <ResidentesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/personal"
          element={
            <ProtectedRoute requireAdmin={true}>
              <PersonalPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/usuarios"
          element={
            <ProtectedRoute requireAdmin={true}>
              <UsuariosPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/notificaciones"
          element={
            <ProtectedRoute requireAdmin={true}>
              <NotificacionesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/mantenimiento"
          element={
            <ProtectedRoute requireAdmin={true}>
              <div>Mantenimiento (por implementar)</div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/unidades"
          element={
            <ProtectedRoute requireAdmin={true}>
              <UnidadesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/multas"
          element={
            <ProtectedRoute requireAdmin={true}>
              <MultasPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/pagos"
          element={
            <ProtectedRoute requireAdmin={true}>
              <PagosPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/vehiculos"
          element={
            <ProtectedRoute requireAdmin={true}>
              <VehiculosPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/areas-comunes"
          element={
            <ProtectedRoute requireAdmin={true}>
              <AreasComunesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/reservas"
          element={
            <ProtectedRoute requireAdmin={true}>
              <ReservasPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/inventario"
          element={
            <ProtectedRoute requireAdmin={true}>
              <InventarioPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/seguridad"
          element={
            <ProtectedRoute requireAdmin={true}>
              <SeguridadSimplePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/reconocimiento-facial"
          element={
            <ProtectedRoute requireAdmin={true}>
              <ReconocimientoFacialPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/ventas"
          element={
            <ProtectedRoute requireAdmin={true}>
              <div>Ventas (por implementar)</div>
            </ProtectedRoute>
          }
        />

        {/* rutas de usuario ya no aplican en web; mantener settings solo para admin */}
        <Route
          path="/profile/edit"
          element={
            <ProtectedRoute requireAdmin={true}>
              <AccountSettingsPage />
            </ProtectedRoute>
          }
        />

        {/* catch-all: redirigir al login de admin */}
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </Router>
  );
}
