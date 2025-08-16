import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Button 
} from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Search,
  Plus,
  Edit,
  Trash2,
  CreditCard,
  Banknote,
  Smartphone,
  FileText,
  Download,
  Filter,
  CheckCircle,
  AlertCircle,
  Clock
} from "lucide-react";

// Types para payments
interface Payment {
  id: string;
  rentalId: string;
  amount: string;
  paymentMethod: string;
  paymentDate: string;
  status: string;
  notes?: string;
  customerName?: string;
  customerRut?: string;
  createdAt: string;
}

interface PaymentStats {
  totalRevenue: string;
  pendingPayments: string;
  completedPayments: number;
  averagePayment: string;
  revenueChange: number;
  paymentsThisPeriod: number;
}

// Filtros de rango de fecha
const DATE_RANGES = [
  { id: "7d", label: "Últimos 7 días", days: 7 },
  { id: "28d", label: "Últimos 28 días", days: 28 },
  { id: "30d", label: "Últimos 30 días", days: 30 },
  { id: "60d", label: "Últimos 60 días", days: 60 },
  { id: "90d", label: "Últimos 90 días", days: 90 },
  { id: "6m", label: "Últimos 6 meses", days: 180 },
  { id: "1y", label: "Último año", days: 365 },
  { id: "custom", label: "Personalizado", days: null }
];

const PAYMENT_METHODS = [
  { id: "efectivo", label: "Efectivo", icon: Banknote },
  { id: "transferencia", label: "Transferencia", icon: CreditCard },
  { id: "tarjeta", label: "Tarjeta", icon: CreditCard },
  { id: "webpay", label: "WebPay", icon: Smartphone }
];

const PAYMENT_STATUS = [
  { id: "completado", label: "Completado", color: "bg-green-100 text-green-800" },
  { id: "pendiente", label: "Pendiente", color: "bg-yellow-100 text-yellow-800" },
  { id: "fallido", label: "Fallido", color: "bg-red-100 text-red-800" }
];

export default function PaymentsSection() {
  const { toast } = useToast();
  
  // Estados
  const [selectedDateRange, setSelectedDateRange] = useState("30d");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    rentalId: "",
    amount: "",
    paymentMethod: "",
    paymentDate: new Date().toISOString().split('T')[0],
    status: "completado",
    notes: ""
  });

  // Calcular rango de fechas
  const dateRange = useMemo(() => {
    if (selectedDateRange === "custom") {
      return {
        start: customStartDate || null,
        end: customEndDate || null
      };
    }
    
    const range = DATE_RANGES.find(r => r.id === selectedDateRange);
    if (!range?.days) return { start: null, end: null };
    
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - range.days);
    
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  }, [selectedDateRange, customStartDate, customEndDate]);

  // Queries
  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['/api/payments', dateRange, statusFilter, methodFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dateRange.start) params.append('startDate', dateRange.start);
      if (dateRange.end) params.append('endDate', dateRange.end);
      if (statusFilter && statusFilter !== "all") params.append('status', statusFilter);
      if (methodFilter && methodFilter !== "all") params.append('method', methodFilter);
      
      const response = await fetch(`/api/payments?${params}`);
      if (!response.ok) throw new Error('Error loading payments');
      return response.json();
    }
  });

  const { data: stats } = useQuery({
    queryKey: ['/api/payments/stats', dateRange],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dateRange.start) params.append('startDate', dateRange.start);
      if (dateRange.end) params.append('endDate', dateRange.end);
      
      const response = await fetch(`/api/payments/stats?${params}`);
      if (!response.ok) throw new Error('Error loading payment stats');
      return response.json();
    }
  });

  const { data: rentals = [] } = useQuery({
    queryKey: ['/api/rentals'],
    queryFn: async () => {
      const response = await fetch('/api/rentals');
      if (!response.ok) throw new Error('Error loading rentals');
      return response.json();
    }
  });

  // Mutations
  const savePaymentMutation = useMutation({
    mutationFn: async (paymentData: any) => {
      const url = editingPayment ? `/api/payments/${editingPayment.id}` : "/api/payments";
      const method = editingPayment ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al guardar pago");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payments/stats"] });
      toast({ 
        title: editingPayment ? "Pago actualizado" : "Pago registrado",
        description: "El pago se ha guardado correctamente"
      });
      closeDialog();
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  });

  const deletePaymentMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/payments/${id}`, { method: "DELETE" });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al eliminar pago");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payments/stats"] });
      toast({ title: "Pago eliminado correctamente" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  });

  // Funciones
  const formatCurrency = (amount: string) => {
    const num = parseFloat(amount || "0");
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(num);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL');
  };

  const openDialog = (payment?: any) => {
    if (payment) {
      setEditingPayment(payment);
      setFormData({
        rentalId: payment.rentalId,
        amount: payment.amount,
        method: payment.method,
        paymentMethod: payment.method, // Compatibilidad
        paymentDate: new Date().toISOString().split('T')[0], // Usar fecha actual para edición
        status: "completado", // Default
        notes: payment.notes || ""
      });
    } else {
      setEditingPayment(null);
      setFormData({
        rentalId: "",
        amount: "",
        method: "efectivo",
        paymentMethod: "efectivo", // Mantener compatibilidad
        paymentDate: new Date().toISOString().split('T')[0],
        status: "completado",
        notes: ""
      });
    }
    setShowPaymentDialog(true);
  };

  const closeDialog = () => {
    setShowPaymentDialog(false);
    setEditingPayment(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    savePaymentMutation.mutate(formData);
  };

  const handleDelete = (payment: Payment) => {
    if (window.confirm(`¿Estás seguro de eliminar este pago de ${formatCurrency(payment.amount)}?`)) {
      deletePaymentMutation.mutate(payment.id);
    }
  };

  // Filtrar pagos
  const filteredPayments = useMemo(() => {
    return payments.filter((payment: Payment) => {
      const matchesSearch = !searchTerm || 
        payment.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.customerRut?.includes(searchTerm) ||
        payment.id.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesSearch;
    });
  }, [payments, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Header con filtros de fecha */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Pagos / Finanzas</h2>
          <p className="text-gray-600 mt-1">Gestión de pagos y análisis financiero</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
          <Select value={selectedDateRange} onValueChange={setSelectedDateRange}>
            <SelectTrigger className="w-full sm:w-48">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DATE_RANGES.map(range => (
                <SelectItem key={range.id} value={range.id}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {selectedDateRange === "custom" && (
            <div className="flex gap-2">
              <Input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                placeholder="Fecha inicio"
                className="w-40"
              />
              <Input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                placeholder="Fecha fin"
                className="w-40"
              />
            </div>
          )}
          
          <Button onClick={() => openDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Registrar Pago
          </Button>
        </div>
      </div>

      {/* KPIs */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Ingresos Totales</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
                  {stats.revenueChange !== 0 && (
                    <p className={`text-xs flex items-center ${stats.revenueChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {stats.revenueChange > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                      {Math.abs(stats.revenueChange)}% vs período anterior
                    </p>
                  )}
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pagos Pendientes</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats.pendingPayments)}</p>
                  <p className="text-xs text-gray-500">Dinero por cobrar</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pagos Completados</p>
                  <p className="text-2xl font-bold">{stats.completedPayments}</p>
                  <p className="text-xs text-gray-500">{stats.paymentsThisPeriod} en este período</p>
                </div>
                <CheckCircle className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pago Promedio</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats.averagePayment)}</p>
                  <p className="text-xs text-gray-500">Por transacción</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros y búsqueda */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por cliente, RUT o ID de pago..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  {PAYMENT_STATUS.map(status => (
                    <SelectItem key={status.id} value={status.id}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={methodFilter} onValueChange={setMethodFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Método" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los métodos</SelectItem>
                  {PAYMENT_METHODS.map(method => (
                    <SelectItem key={method.id} value={method.id}>
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de pagos */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">Cargando pagos...</div>
          ) : filteredPayments.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {searchTerm || (statusFilter && statusFilter !== "all") || (methodFilter && methodFilter !== "all") ? "No se encontraron pagos" : "No hay pagos registrados"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Método</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPayments.map((payment: any) => {
                    const methodLabel = payment.method === "efectivo" ? "Efectivo" : 
                                       payment.method === "transferencia" ? "Transferencia" : 
                                       payment.method === "tarjeta" ? "Tarjeta" : payment.method;
                    
                    return (
                      <tr key={payment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">Cliente</div>
                          <div className="text-sm text-gray-500">ID: {payment.customerId?.slice(0, 8)}...</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-lg font-semibold text-gray-900">{formatCurrency(payment.amount)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <CreditCard className="h-4 w-4 mr-2 text-gray-500" />
                            <span className="text-sm">{methodLabel}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs rounded-full font-medium bg-green-100 text-green-800">
                            Completado
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(payment.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDialog(payment)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(payment.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog para crear/editar pago */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingPayment ? "Editar Pago" : "Registrar Nuevo Pago"}
            </DialogTitle>
            <DialogDescription>
              {editingPayment ? "Modifica los detalles del pago" : "Registra un nuevo pago recibido"}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="rental">Arriendo</Label>
              <Select 
                value={formData.rentalId} 
                onValueChange={(value) => {
                  const selectedRental = rentals.find((r: any) => r.id === value);
                  const pendingAmount = selectedRental ? 
                    (parseFloat(selectedRental.totalAmount) - parseFloat(selectedRental.paidAmount || "0")).toString() : "";
                  
                  setFormData({
                    ...formData, 
                    rentalId: value,
                    amount: pendingAmount,
                    method: formData.paymentMethod || "efectivo"
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar arriendo" />
                </SelectTrigger>
                <SelectContent>
                  {rentals.map((rental: any) => {
                    const pendingAmount = parseFloat(rental.totalAmount) - parseFloat(rental.paidAmount || "0");
                    return (
                      <SelectItem key={rental.id} value={rental.id}>
                        {rental.customerName} - Total: {formatCurrency(rental.totalAmount)} 
                        {pendingAmount > 0 && (
                          <span className="text-red-600 ml-2">(Pendiente: {formatCurrency(pendingAmount.toString())})</span>
                        )}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {formData.rentalId && (
                <p className="text-xs text-gray-600 mt-1">
                  El monto se auto-completó con el saldo pendiente del arriendo
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="amount">Monto</Label>
              <Input
                id="amount"
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                placeholder="150000"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Se auto-completa al seleccionar arriendo. Puedes modificarlo si es un pago parcial.
              </p>
            </div>

            <div>
              <Label htmlFor="method">Método de Pago</Label>
              <Select value={formData.method || formData.paymentMethod} onValueChange={(value) => setFormData({...formData, method: value, paymentMethod: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar método" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="efectivo">Efectivo</SelectItem>
                  <SelectItem value="transferencia">Transferencia</SelectItem>
                  <SelectItem value="tarjeta">Tarjeta</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="paymentDate">Fecha de Pago</Label>
              <Input
                id="paymentDate"
                type="date"
                value={formData.paymentDate}
                onChange={(e) => setFormData({...formData, paymentDate: e.target.value})}
                required
              />
            </div>

            <div>
              <Label htmlFor="status">Estado</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_STATUS.map(status => (
                    <SelectItem key={status.id} value={status.id}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="notes">Notas (opcional)</Label>
              <Input
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Notas adicionales sobre el pago"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                type="submit" 
                disabled={savePaymentMutation.isPending}
                className="flex-1"
              >
                {savePaymentMutation.isPending ? "Guardando..." : editingPayment ? "Actualizar" : "Registrar"}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={closeDialog}
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}