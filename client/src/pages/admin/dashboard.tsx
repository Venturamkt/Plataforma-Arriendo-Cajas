import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import type { Box, Customer, Rental } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import MetricCard from "@/components/metric-card";
import StatusChart from "@/components/status-chart";
import RecentActivity from "@/components/recent-activity";
import QuickActions from "@/components/quick-actions";
import { Package, Clock, DollarSign, Users, Calendar, ChevronDown } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format, subDays, subMonths } from "date-fns";
import { es } from "date-fns/locale";

// Date range presets
const dateRangePresets = [
  { label: "Últimos 7 días", value: "7d", days: 7 },
  { label: "Últimos 14 días", value: "14d", days: 14 },
  { label: "Últimos 28 días", value: "28d", days: 28 },
  { label: "Últimos 30 días", value: "30d", days: 30 },
  { label: "Últimos 90 días", value: "90d", days: 90 },
  { label: "Personalizado", value: "custom", days: null },
];

export default function AdminDashboard() {
  const { toast } = useToast();
  const { user, isLoading } = useCurrentUser();
  const [, setLocation] = useLocation();
  
  // Date range state
  const [selectedRange, setSelectedRange] = useState("30d");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  
  // Calculate date range based on selection
  const getDateRange = () => {
    const now = new Date();
    if (selectedRange === "custom") {
      return {
        startDate: customStartDate ? new Date(customStartDate) : subDays(now, 30),
        endDate: customEndDate ? new Date(customEndDate) : now,
      };
    }
    const preset = dateRangePresets.find(p => p.value === selectedRange);
    const days = preset?.days || 30;
    return {
      startDate: subDays(now, days),
      endDate: now,
    };
  };

  // Wait for authentication to load, then check permissions
  useEffect(() => {
    if (isLoading) return; // Still loading
    
    if (!user) {
      // No user found, redirect to login
      window.location.href = "/";
      return;
    }
    
    if (user.type !== 'admin') {
      toast({
        title: "Acceso Denegado",
        description: "No tienes permisos de administrador",
        variant: "destructive",
      });
      window.location.href = "/";
      return;
    }
  }, [user, isLoading, toast]);

  interface DashboardMetrics {
    activeBoxes: number;
    pendingDeliveries: number;
    monthlyRevenue: number;
    activeCustomers: number;
    statusCounts: Record<string, number>;
  }

  // Fetch real data from the database with date filtering
  const { startDate, endDate } = getDateRange();
  const { data: dashboardMetrics, refetch } = useQuery<DashboardMetrics>({
    queryKey: ["/api/dashboard/metrics", selectedRange, customStartDate, customEndDate],
    queryFn: async () => {
      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });
      const response = await fetch(`/api/dashboard/metrics?${params}`);
      if (!response.ok) throw new Error('Failed to fetch metrics');
      return response.json();
    },
    retry: false,
    enabled: !!user,
  });

  const metrics = dashboardMetrics || {
    activeBoxes: 0,
    pendingDeliveries: 0,
    monthlyRevenue: 0,
    activeCustomers: 0,
    statusCounts: {
      entregada: 0,
      pendiente: 0,
      pagada: 0,
      retirada: 0,
      finalizado: 0
    }
  };

  // Show loading while checking authentication
  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue"></div>
      </div>
    );
  }

  // Prepare status chart data
  const statusData = Object.entries(metrics.statusCounts).map(([status, count]) => {
    const total = Object.values(metrics.statusCounts).reduce((sum: number, val: number) => sum + val, 0);
    const colorMap: Record<string, string> = {
      'entregada': 'bg-green-500',
      'pagada': 'bg-brand-blue',
      'pendiente': 'bg-yellow-500',
      'retirada': 'bg-gray-500',
      'cancelada': 'bg-brand-red',
      'finalizado': 'bg-purple-500',
      'available': 'bg-blue-200',
    };
    
    return {
      status: status === 'rented' ? 'Arrendadas' : status,
      count: count as number,
      color: colorMap[status] || 'bg-gray-400',
      percentage: total > 0 ? ((count as number) / total) * 100 : 0,
    };
  }).filter(item => item.count > 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="flex">
        <Sidebar role={'admin'} />
        
        <main className="flex-1 p-4 lg:p-8 pb-20 lg:pb-8">
          {/* Dashboard Header */}
          <div className="mb-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                Dashboard Administrativo
              </h1>
              <p className="text-gray-600">
                Resumen general del sistema de arriendo de cajas
              </p>
            </div>
            
            {/* Date Range Selector */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Select value={selectedRange} onValueChange={(value) => {
                setSelectedRange(value);
                if (value !== "custom") {
                  setShowCustomPicker(false);
                }
              }}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {dateRangePresets.map((preset) => (
                    <SelectItem key={preset.value} value={preset.value}>
                      {preset.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {selectedRange === "custom" && (
                <Popover open={showCustomPicker} onOpenChange={setShowCustomPicker}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full sm:w-auto">
                      <Calendar className="h-4 w-4 mr-2" />
                      {customStartDate && customEndDate ? 
                        `${format(new Date(customStartDate), 'dd/MM', { locale: es })} - ${format(new Date(customEndDate), 'dd/MM', { locale: es })}` :
                        "Seleccionar fechas"
                      }
                      <ChevronDown className="h-4 w-4 ml-2" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-4">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="startDate">Fecha inicio</Label>
                        <Input
                          id="startDate"
                          type="date"
                          value={customStartDate}
                          onChange={(e) => setCustomStartDate(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="endDate">Fecha fin</Label>
                        <Input
                          id="endDate"
                          type="date"
                          value={customEndDate}
                          onChange={(e) => setCustomEndDate(e.target.value)}
                        />
                      </div>
                      <Button 
                        onClick={() => setShowCustomPicker(false)}
                        className="w-full"
                      >
                        Aplicar
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
              
              <Button 
                variant="outline" 
                onClick={async () => {
                  try {
                    const response = await fetch('/api/rentals/reset-test-data', { method: 'DELETE' });
                    const data = await response.json();
                    
                    if (response.ok) {
                      const message = data.deletedCount > 0 
                        ? `Se eliminaron ${data.deletedCount} registros de prueba exitosamente`
                        : data.orphanBoxesCleaned > 0 
                        ? `Se liberaron ${data.orphanBoxesCleaned} cajas huérfanas exitosamente`
                        : "Sistema limpio - no había datos de prueba";
                      
                      toast({
                        title: "Datos reseteados",
                        description: message,
                      });
                      refetch();
                      // Also refresh other data
                      window.location.reload();
                    } else {
                      toast({
                        title: "Error",
                        description: data.message || "No se pudieron resetear los datos",
                        variant: "destructive",
                      });
                    }
                  } catch (error) {
                    toast({
                      title: "Error",
                      description: "No se pudieron resetear los datos",
                      variant: "destructive",
                    });
                  }
                }}
                className="text-red-600 hover:text-red-700"
              >
                Resetear datos
              </Button>
            </div>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
            <MetricCard
              title="Cajas Activas"
              value={metrics.activeBoxes}
              icon={Package}
              iconColor="bg-box-blue"
            />
            
            <MetricCard
              title="Entregas Pendientes"
              value={metrics.pendingDeliveries}
              icon={Clock}
              iconColor="bg-yellow-100"
            />
            
            <MetricCard
              title="Ingresos del Período"
              value={formatCurrency(metrics.monthlyRevenue)}
              icon={DollarSign}
              iconColor="bg-green-100"
            />
            
            <MetricCard
              title="Clientes Activos"
              value={metrics.activeCustomers}
              icon={Users}
              iconColor="bg-purple-100"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Status Chart */}
            <StatusChart 
              data={statusData}
              onViewAll={() => setLocation("/admin/inventory")}
            />

            {/* Recent Activity */}
            <RecentActivity 
              onViewAll={() => setLocation("/admin/reports")}
            />
          </div>

          {/* Quick Actions */}
          <QuickActions
            onNewRental={() => setLocation("/admin/new-rental")}
            onViewReports={() => setLocation("/admin/reports")}
            onManageCustomers={() => setLocation("/admin/customers")}
            onSearch={(query) => {
              if (query) {
                toast({
                  title: "Búsqueda",
                  description: `Buscando: ${query}`,
                });
              }
            }}
          />
        </main>
      </div>
      
      <MobileNav role={'admin'} />
    </div>
  );
}
