import { useEffect } from "react";
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
import { Package, Clock, DollarSign, Users } from "lucide-react";
import { useLocation } from "wouter";

export default function AdminDashboard() {
  const { toast } = useToast();
  const { user, isLoading } = useCurrentUser();
  const [, setLocation] = useLocation();

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

  // Fetch real data from the database
  const { data: dashboardMetrics } = useQuery<DashboardMetrics>({
    queryKey: ["/api/dashboard/metrics"],
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
      status,
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
          <div className="mb-8">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
              Dashboard Administrativo
            </h1>
            <p className="text-gray-600">
              Resumen general del sistema de arriendo de cajas
            </p>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
            <MetricCard
              title="Cajas Activas"
              value={metrics.activeBoxes}
              icon={Package}
              iconColor="bg-box-blue"
              change="+12% desde el mes pasado"
              changeType="positive"
            />
            
            <MetricCard
              title="Entregas Pendientes"
              value={metrics.pendingDeliveries}
              icon={Clock}
              iconColor="bg-yellow-100"
              change="Para hoy"
              changeType="neutral"
            />
            
            <MetricCard
              title="Ingresos del Mes"
              value={formatCurrency(metrics.monthlyRevenue)}
              icon={DollarSign}
              iconColor="bg-green-100"
              change="+18% vs mes anterior"
              changeType="positive"
            />
            
            <MetricCard
              title="Clientes Activos"
              value={metrics.activeCustomers}
              icon={Users}
              iconColor="bg-purple-100"
              change="Con arriendos vigentes"
              changeType="neutral"
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
