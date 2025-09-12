import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Calendar, 
  Users, 
  Package, 
  Truck, 
  DollarSign, 
  BarChart3, 
  Settings, 
  Home,
  Menu,
  X,
  AlertTriangle,
  TrendingUp,
  Clock,
  CheckCircle,
  Mail
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CustomersSection from "./admin/CustomersSection";
import RentalsSection from "./admin/RentalsSection";
import NewRentalForm from "./admin/NewRentalForm";
import { InventorySection } from "./admin/InventorySection";
import { DriversSection } from "./admin/DriversSection";
import PaymentsSection from "./admin/PaymentsSection";
import ReportsSection from "./admin/ReportsSection";
import CalendarSection from "./admin/CalendarSectionNew";
import ConfigurationSection from "./admin/ConfigurationSection";
import EmailsSection from "./admin/EmailsSection";
import CompanyLogo from "@/components/CompanyLogo";

const sidebarItems = [
  { id: "dashboard", label: "Dashboard", icon: Home },
  { id: "customers", label: "Clientes", icon: Users },
  { id: "rentals", label: "Arriendos", icon: Package },
  { id: "inventory", label: "Inventario", icon: Package },
  { id: "drivers", label: "Repartidores", icon: Truck },
  { id: "payments", label: "Pagos / Finanzas", icon: DollarSign },
  { id: "emails", label: "Emails", icon: Mail },
  { id: "reports", label: "Reportes", icon: BarChart3 },
  { id: "calendar", label: "Calendario", icon: Calendar },
  { id: "configuration", label: "Configuración", icon: Settings },
];

export default function AdminDashboard() {
  const [activeSection, setActiveSection] = useState("dashboard");
  
  // Detectar parámetros de URL para navegación directa
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    if (tab) {
      setActiveSection(tab);
      // Limpiar URL después de navegación
      window.history.replaceState({}, '', '/admin');
    }
  }, []);
  
  // Función para cambiar sección con parámetros
  const changeSection = (section: string, params?: any) => {
    setActiveSection(section);
  };

  // Hacer la función disponible globalmente para los componentes hijos
  useEffect(() => {
    (window as any).changeSection = changeSection;
    return () => {
      delete (window as any).changeSection;
    };
  }, []);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [period, setPeriod] = useState("today");

  // Obtener datos reales del dashboard desde la API
  const { data: dashboardData, isLoading: dashboardLoading, error: dashboardError } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    refetchInterval: 30000, // Actualizar cada 30 segundos
  });

  // Valores por defecto mientras cargan los datos
  const defaultDashboardData = {
    rentals: { active: 0, new: 0, completed: 0, programmed: 0, total: 0 },
    inventory: { available: 0, reserved: 0, inField: 0, maintenance: 0, total: 0 },
    finance: { pendingBalance: 0, customersInDebt: 0 },
    todayTasks: { deliveries: 0, pickups: 0 },
    alerts: { rentalsWithoutDriver: 0, lowStock: 0 },
    counters: { customers: 0, drivers: 0, inventory: 0 }
  };

  const stats = dashboardData || defaultDashboardData;

  const renderDashboard = () => {
    if (dashboardLoading) {
      return (
        <div className="space-y-6">
          <div className="flex justify-center items-center min-h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Cargando dashboard...</p>
            </div>
          </div>
        </div>
      );
    }

    return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Hoy</SelectItem>
            <SelectItem value="week">Esta semana</SelectItem>
            <SelectItem value="month">Este mes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Arriendos Activos</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.rentals.active}</div>
            <p className="text-xs text-muted-foreground">En terreno actualmente</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nuevos Arriendos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.rentals.new}</div>
            <p className="text-xs text-muted-foreground">Hoy</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cajas Disponibles</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inventory.available}</div>
            <p className="text-xs text-muted-foreground">de {stats.inventory.total} total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Pendiente</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.finance.pendingBalance.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{stats.finance.customersInDebt} clientes</p>
          </CardContent>
        </Card>
      </div>

      {/* Tareas de Hoy */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Entregas de Hoy</CardTitle>
            <CardDescription>{stats.todayTasks.deliveries} confirmadas</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.todayTasks.deliveries > 0 ? (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">No hay datos de entregas específicas disponibles</p>
                <p className="text-xs text-gray-500">Ve a la sección Arriendos para ver todos los arriendos confirmados</p>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-gray-600">No hay entregas confirmadas para hoy</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Retiros de Hoy</CardTitle>
            <CardDescription>{stats.todayTasks.pickups} programados</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.todayTasks.pickups > 0 ? (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">No hay datos de retiros específicos disponibles</p>
                <p className="text-xs text-gray-500">Ve a la sección Arriendos para ver todos los retiros programados</p>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-gray-600">No hay retiros programados para hoy</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alertas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            Alertas del Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Alerta de arriendos sin repartidor */}
            {stats.alerts.rentalsWithoutDriver > 0 && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-50 text-yellow-800">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span>{stats.alerts.rentalsWithoutDriver} arriendos sin repartidor asignado</span>
              </div>
            )}
            
            {/* Alerta de stock bajo */}
            {stats.alerts.lowStock > 0 && stats.inventory.available < 20 && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 text-red-800">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span>Stock bajo: quedan {stats.inventory.available} items disponibles</span>
              </div>
            )}
            
            {/* Mensaje cuando no hay alertas */}
            {stats.alerts.rentalsWithoutDriver === 0 && stats.inventory.available >= 20 && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 text-green-800">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Sistema funcionando correctamente - Sin alertas</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
  };

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return renderDashboard();
      case "customers":
        return <CustomersSection />;
      case "rentals":
        return <RentalsSection />;
      case "new-rental":
        return <NewRentalForm />;
      case "inventory":
        return <InventorySection />;
      case "drivers":
        return <DriversSection />;
      case "payments":
        return <PaymentsSection />;
      case "reports":
        return <ReportsSection />;
      case "calendar":
        return <CalendarSection />;
      case "configuration":
        return <ConfigurationSection />;
      case "emails":
        return <EmailsSection />;
      case "settings":
        return <div className="p-8 text-center"><h2 className="text-2xl">Configuración - En desarrollo</h2></div>;
      default:
        return renderDashboard();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-4 border-b">
            <CompanyLogo />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveSection(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg transition-colors ${
                    activeSection === item.id
                      ? 'bg-blue-100 text-blue-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Header */}
        <header className="bg-white shadow-sm border-b h-16 flex items-center justify-between px-4 lg:px-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Portal Administrador</span>
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">A</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {renderContent()}
        </main>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}