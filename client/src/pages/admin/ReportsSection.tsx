import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Download, FileSpreadsheet, TrendingUp, Users, Package, Truck, DollarSign } from "lucide-react";

const PRESET_RANGES = [
  { id: "7d", label: "Últimos 7 días", days: 7 },
  { id: "30d", label: "Últimos 30 días", days: 30 },
  { id: "90d", label: "Últimos 90 días", days: 90 },
  { id: "6m", label: "Últimos 6 meses", days: 180 },
  { id: "1y", label: "Último año", days: 365 },
  { id: "custom", label: "Rango personalizado", days: 0 }
];

const REPORT_TYPES = [
  {
    id: "financial",
    title: "Reporte Financiero",
    description: "Ingresos, pagos, deudas pendientes por período",
    icon: DollarSign,
    color: "text-green-600"
  },
  {
    id: "customers",
    title: "Reporte de Clientes",
    description: "Actividad de clientes, arriendos por cliente, historial",
    icon: Users,
    color: "text-blue-600"
  },
  {
    id: "inventory",
    title: "Reporte de Inventario",
    description: "Utilización de cajas, rotación, disponibilidad",
    icon: Package,
    color: "text-purple-600"
  },
  {
    id: "operations",
    title: "Reporte Operacional",
    description: "Entregas, retiros, performance de repartidores",
    icon: Truck,
    color: "text-orange-600"
  }
];

export default function ReportsSection() {
  const [selectedRange, setSelectedRange] = useState("30d");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedReport, setSelectedReport] = useState("financial");
  const [isExporting, setIsExporting] = useState(false);

  // Calcular fechas basado en el rango seleccionado
  const dateRange = useMemo(() => {
    if (selectedRange === "custom") {
      return { startDate, endDate };
    }
    
    const range = PRESET_RANGES.find(r => r.id === selectedRange);
    if (!range || range.days === 0) return { startDate: "", endDate: "" };
    
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - range.days);
    
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    };
  }, [selectedRange, startDate, endDate]);

  // Queries para datos de reportes
  const { data: financialData, isLoading: loadingFinancial } = useQuery({
    queryKey: ["/api/reports/financial", dateRange.startDate, dateRange.endDate],
    queryFn: async () => {
      if (!dateRange.startDate || !dateRange.endDate) return null;
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        type: "financial"
      });
      const response = await fetch(`/api/reports?${params}`);
      if (!response.ok) throw new Error('Error loading financial report');
      return response.json();
    },
    enabled: !!dateRange.startDate && !!dateRange.endDate
  });

  const { data: customersData, isLoading: loadingCustomers } = useQuery({
    queryKey: ["/api/reports/customers", dateRange.startDate, dateRange.endDate],
    queryFn: async () => {
      if (!dateRange.startDate || !dateRange.endDate) return null;
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        type: "customers"
      });
      const response = await fetch(`/api/reports?${params}`);
      if (!response.ok) throw new Error('Error loading customers report');
      return response.json();
    },
    enabled: !!dateRange.startDate && !!dateRange.endDate
  });

  const { data: inventoryData, isLoading: loadingInventory } = useQuery({
    queryKey: ["/api/reports/inventory", dateRange.startDate, dateRange.endDate],
    queryFn: async () => {
      if (!dateRange.startDate || !dateRange.endDate) return null;
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        type: "inventory"
      });
      const response = await fetch(`/api/reports?${params}`);
      if (!response.ok) throw new Error('Error loading inventory report');
      return response.json();
    },
    enabled: !!dateRange.startDate && !!dateRange.endDate
  });

  const { data: operationsData, isLoading: loadingOperations } = useQuery({
    queryKey: ["/api/reports/operations", dateRange.startDate, dateRange.endDate],
    queryFn: async () => {
      if (!dateRange.startDate || !dateRange.endDate) return null;
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        type: "operations"
      });
      const response = await fetch(`/api/reports?${params}`);
      if (!response.ok) throw new Error('Error loading operations report');
      return response.json();
    },
    enabled: !!dateRange.startDate && !!dateRange.endDate
  });

  const formatCurrency = (amount: string | number) => {
    const num = parseFloat(amount?.toString() || "0");
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(num);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL');
  };

  const exportToExcel = async () => {
    if (!dateRange.startDate || !dateRange.endDate) return;
    
    setIsExporting(true);
    try {
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        type: selectedReport,
        format: "excel"
      });
      
      const response = await fetch(`/api/reports/export?${params}`);
      if (!response.ok) throw new Error('Error al exportar reporte');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte_${selectedReport}_${dateRange.startDate}_${dateRange.endDate}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const getCurrentData = () => {
    switch (selectedReport) {
      case "financial": return financialData;
      case "customers": return customersData;
      case "inventory": return inventoryData;
      case "operations": return operationsData;
      default: return null;
    }
  };

  const isLoading = () => {
    switch (selectedReport) {
      case "financial": return loadingFinancial;
      case "customers": return loadingCustomers;
      case "inventory": return loadingInventory;
      case "operations": return loadingOperations;
      default: return false;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Reportes</h2>
          <p className="text-gray-600">Genera reportes detallados y exporta datos para análisis</p>
        </div>
        <Button 
          onClick={exportToExcel}
          disabled={isExporting || !dateRange.startDate || !dateRange.endDate}
          className="flex items-center gap-2"
        >
          {isExporting ? (
            <>Exportando...</>
          ) : (
            <>
              <FileSpreadsheet className="h-4 w-4" />
              Exportar a Excel
            </>
          )}
        </Button>
      </div>

      {/* Configuración de reportes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Configuración del Reporte
          </CardTitle>
          <CardDescription>
            Selecciona el tipo de reporte y el rango de fechas para generar análisis detallados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Tipo de reporte */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {REPORT_TYPES.map((type) => {
              const Icon = type.icon;
              return (
                <Card 
                  key={type.id} 
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedReport === type.id 
                      ? 'ring-2 ring-blue-500 bg-blue-50' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedReport(type.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <Icon className={`h-8 w-8 ${type.color}`} />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm">{type.title}</h3>
                        <p className="text-xs text-gray-600 mt-1">{type.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Rango de fechas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="range">Rango de tiempo</Label>
              <Select value={selectedRange} onValueChange={setSelectedRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRESET_RANGES.map(range => (
                    <SelectItem key={range.id} value={range.id}>
                      {range.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedRange === "custom" && (
              <>
                <div>
                  <Label htmlFor="startDate">Fecha inicio</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">Fecha fin</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>

          {dateRange.startDate && dateRange.endDate && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Período seleccionado:</strong> {formatDate(dateRange.startDate)} - {formatDate(dateRange.endDate)}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contenido del reporte */}
      {dateRange.startDate && dateRange.endDate && (
        <Card>
          <CardHeader>
            <CardTitle>
              {REPORT_TYPES.find(t => t.id === selectedReport)?.title}
            </CardTitle>
            <CardDescription>
              Datos del {formatDate(dateRange.startDate)} al {formatDate(dateRange.endDate)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading() ? (
              <div className="text-center py-8">Generando reporte...</div>
            ) : (
              <ReportContent 
                type={selectedReport} 
                data={getCurrentData()} 
                formatCurrency={formatCurrency}
                formatDate={formatDate}
              />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Componente para mostrar el contenido específico de cada reporte
function ReportContent({ type, data, formatCurrency, formatDate }: any) {
  if (!data) {
    return <div className="text-center py-8 text-gray-500">No hay datos para mostrar</div>;
  }

  switch (type) {
    case "financial":
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Ingresos Totales</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(data.totalRevenue || 0)}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Pagos Recibidos</p>
                    <p className="text-2xl font-bold">{data.paymentsCount || 0}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Pago Promedio</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(data.averagePayment || 0)}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>
          
          {data.dailyRevenue && (
            <div>
              <h3 className="font-semibold mb-3">Ingresos por día</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-3 text-left">Fecha</th>
                      <th className="p-3 text-left">Ingresos</th>
                      <th className="p-3 text-left">Pagos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.dailyRevenue.map((day: any, index: number) => (
                      <tr key={index} className="border-b">
                        <td className="p-3">{formatDate(day.date)}</td>
                        <td className="p-3 font-medium">{formatCurrency(day.revenue)}</td>
                        <td className="p-3">{day.payments}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      );

    case "customers":
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Clientes Activos</p>
                    <p className="text-2xl font-bold">{data.activeCustomers || 0}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Nuevos Clientes</p>
                    <p className="text-2xl font-bold">{data.newCustomers || 0}</p>
                  </div>
                  <Users className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Arriendos Totales</p>
                    <p className="text-2xl font-bold">{data.totalRentals || 0}</p>
                  </div>
                  <Package className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {data.topCustomers && (
            <div>
              <h3 className="font-semibold mb-3">Top 10 Clientes por Ingresos</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-3 text-left">Cliente</th>
                      <th className="p-3 text-left">RUT</th>
                      <th className="p-3 text-left">Arriendos</th>
                      <th className="p-3 text-left">Total Pagado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topCustomers.map((customer: any, index: number) => (
                      <tr key={index} className="border-b">
                        <td className="p-3 font-medium">{customer.name}</td>
                        <td className="p-3">{customer.rut}</td>
                        <td className="p-3">{customer.rentals}</td>
                        <td className="p-3 font-medium">{formatCurrency(customer.totalPaid)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      );

    default:
      return (
        <div className="text-center py-8 text-gray-500">
          <p>Reporte en desarrollo</p>
          <p className="text-sm mt-2">Este tipo de reporte estará disponible próximamente</p>
        </div>
      );
  }
}