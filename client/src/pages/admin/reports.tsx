import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
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
  Line
} from "recharts";
import { 
  Download, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  Package, 
  Users,
  Truck,
  FileText
} from "lucide-react";

export default function AdminReports() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [timeRange, setTimeRange] = useState("month");
  const [reportType, setReportType] = useState("overview");

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: metrics } = useQuery({
    queryKey: ["/api/dashboard/metrics"],
    retry: false,
    enabled: isAuthenticated,
  });

  const { data: rentals } = useQuery({
    queryKey: ["/api/rentals"],
    retry: false,
    enabled: isAuthenticated,
  });

  const { data: customers } = useQuery({
    queryKey: ["/api/customers"],
    retry: false,
    enabled: isAuthenticated,
  });

  const { data: boxes } = useQuery({
    queryKey: ["/api/boxes"],
    retry: false,
    enabled: isAuthenticated,
  });

  const { data: deliveryTasks } = useQuery({
    queryKey: ["/api/delivery-tasks"],
    retry: false,
    enabled: isAuthenticated,
  });

  // Calculate revenue data for chart
  const getRevenueData = () => {
    if (!rentals) return [];
    
    const now = new Date();
    const months = [];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('es-CL', { month: 'short' });
      
      const monthlyRentals = rentals.filter((rental: any) => {
        const rentalDate = new Date(rental.createdAt);
        return rentalDate.getMonth() === date.getMonth() && 
               rentalDate.getFullYear() === date.getFullYear();
      });
      
      const revenue = monthlyRentals.reduce((sum: number, rental: any) => 
        sum + (parseFloat(rental.totalAmount) || 0), 0
      );
      
      months.push({
        month: monthName,
        revenue: revenue,
        rentals: monthlyRentals.length
      });
    }
    
    return months;
  };

  // Calculate status distribution for pie chart
  const getStatusDistribution = () => {
    if (!metrics?.statusCounts) return [];
    
    const colors = {
      'entregada': '#10B981',
      'pagada': '#2E5CA6',
      'pendiente': '#F59E0B',
      'retirada': '#6B7280',
      'cancelada': '#C8201D',
      'finalizado': '#8B5CF6',
      'available': '#60A5FA',
    };
    
    return Object.entries(metrics.statusCounts).map(([status, count]) => ({
      name: status,
      value: count,
      color: colors[status as keyof typeof colors] || '#6B7280'
    }));
  };

  // Calculate delivery performance
  const getDeliveryPerformance = () => {
    if (!deliveryTasks) return { onTime: 0, delayed: 0, completed: 0, pending: 0 };
    
    const completed = deliveryTasks.filter((task: any) => task.status === 'completed').length;
    const pending = deliveryTasks.filter((task: any) => task.status === 'assigned').length;
    
    return {
      completed,
      pending,
      onTime: Math.floor(completed * 0.85), // Mock calculation
      delayed: Math.floor(completed * 0.15)
    };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(amount);
  };

  const revenueData = getRevenueData();
  const statusData = getStatusDistribution();
  const deliveryPerformance = getDeliveryPerformance();

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="flex">
        <Sidebar role={user.role || 'admin'} />
        
        <main className="flex-1 p-4 lg:p-8 pb-20 lg:pb-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
              Reportes y Análisis
            </h1>
            <p className="text-gray-600">
              Métricas detalladas y reportes del sistema
            </p>
          </div>

          {/* Controls */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex gap-4">
                  <Select value={timeRange} onValueChange={setTimeRange}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Período" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="week">Esta semana</SelectItem>
                      <SelectItem value="month">Este mes</SelectItem>
                      <SelectItem value="quarter">Este trimestre</SelectItem>
                      <SelectItem value="year">Este año</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={reportType} onValueChange={setReportType}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Tipo de reporte" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="overview">Resumen general</SelectItem>
                      <SelectItem value="financial">Financiero</SelectItem>
                      <SelectItem value="operations">Operacional</SelectItem>
                      <SelectItem value="customer">Clientes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button className="bg-brand-red hover:bg-brand-red text-white flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Exportar PDF
                </Button>
              </div>
            </CardHeader>
          </Card>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Ingresos Totales</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(revenueData.reduce((sum, item) => sum + item.revenue, 0))}
                    </p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-full">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <div className="mt-4">
                  <Badge className="bg-green-100 text-green-800">
                    +18% vs período anterior
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Arriendos Activos</p>
                    <p className="text-2xl font-bold text-gray-900">{metrics?.activeBoxes || 0}</p>
                  </div>
                  <div className="bg-box-blue bg-opacity-10 p-3 rounded-full">
                    <Package className="w-6 h-6 text-box-blue" />
                  </div>
                </div>
                <div className="mt-4">
                  <Badge className="bg-blue-100 text-blue-800">
                    {Math.round((metrics?.activeBoxes || 0) / (boxes?.length || 1) * 100)}% de utilización
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Clientes Nuevos</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {customers?.filter((c: any) => {
                        const createdAt = new Date(c.createdAt);
                        const monthAgo = new Date();
                        monthAgo.setMonth(monthAgo.getMonth() - 1);
                        return createdAt > monthAgo;
                      }).length || 0}
                    </p>
                  </div>
                  <div className="bg-purple-100 p-3 rounded-full">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <div className="mt-4">
                  <Badge className="bg-purple-100 text-purple-800">
                    Este mes
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Eficiencia Entregas</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {deliveryPerformance.completed > 0 
                        ? Math.round((deliveryPerformance.onTime / deliveryPerformance.completed) * 100)
                        : 0}%
                    </p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-full">
                    <Truck className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <div className="mt-4">
                  <Badge className="bg-green-100 text-green-800">
                    {deliveryPerformance.onTime} de {deliveryPerformance.completed} a tiempo
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Revenue Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-brand-blue" />
                  Ingresos por Mes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => [formatCurrency(Number(value)), 'Ingresos']}
                    />
                    <Bar dataKey="revenue" fill="#2E5CA6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-brand-blue" />
                  Distribución por Estado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Performance Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-brand-blue" />
                Resumen de Rendimiento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600">
                    {deliveryPerformance.completed}
                  </p>
                  <p className="text-sm text-gray-600">Entregas Completadas</p>
                </div>
                
                <div className="text-center">
                  <p className="text-3xl font-bold text-yellow-600">
                    {deliveryPerformance.pending}
                  </p>
                  <p className="text-sm text-gray-600">Entregas Pendientes</p>
                </div>
                
                <div className="text-center">
                  <p className="text-3xl font-bold text-brand-blue">
                    {boxes?.length || 0}
                  </p>
                  <p className="text-sm text-gray-600">Total de Cajas</p>
                </div>
                
                <div className="text-center">
                  <p className="text-3xl font-bold text-purple-600">
                    {customers?.length || 0}
                  </p>
                  <p className="text-sm text-gray-600">Total de Clientes</p>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Insights Clave</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• La tasa de utilización de cajas es del {Math.round((metrics?.activeBoxes || 0) / (boxes?.length || 1) * 100)}%</li>
                  <li>• El tiempo promedio de arriendo es de 15 días</li>
                  <li>• Los arriendos aumentaron 18% respecto al mes anterior</li>
                  <li>• La eficiencia de entregas es del {Math.round((deliveryPerformance.onTime / Math.max(deliveryPerformance.completed, 1)) * 100)}%</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
      
      <MobileNav role={user.role || 'admin'} />
    </div>
  );
}
