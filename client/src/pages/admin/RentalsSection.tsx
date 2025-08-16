import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Search, 
  Plus, 
  Eye, 
  Edit2, 
  Trash2, 
  Phone, 
  Mail, 
  MapPin,
  Filter,
  X,
  AlertCircle,
  CheckCircle,
  Clock,
  Package,
  Calendar,
  Truck,
  User,
  DollarSign
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Rental } from "@shared/schema";

interface RentalWithDetails extends Rental {
  customerName?: string;
  driverName?: string | null;
  remainingDays?: number | null;
  overdueAmount?: number;
}

const statusBadgeConfig = {
  pendiente: { color: "bg-yellow-500", label: "Pendiente" },
  programada: { color: "bg-blue-500", label: "Programada" },
  en_ruta: { color: "bg-purple-500", label: "En Ruta" },
  entregada: { color: "bg-green-500", label: "Entregada" },
  retiro_programado: { color: "bg-orange-500", label: "Retiro Programado" },
  retirada: { color: "bg-indigo-500", label: "Retirada" },
  finalizada: { color: "bg-gray-500", label: "Finalizada" },
  cancelada: { color: "bg-red-500", label: "Cancelada" }
};

const quickFilters = [
  { id: "pending", label: "Pendientes" },
  { id: "in_progress", label: "En progreso" },
  { id: "overdue", label: "Atrasados" },
  { id: "today_delivery", label: "Entrega hoy" },
  { id: "today_pickup", label: "Retiro hoy" },
  { id: "unpaid", label: "Sin pagar" }
];

export default function RentalsSection() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showRentalDetail, setShowRentalDetail] = useState(false);
  const [selectedRental, setSelectedRental] = useState<RentalWithDetails | null>(null);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [statusChangeData, setStatusChangeData] = useState<{rentalId: string, newStatus: string} | null>(null);
  const [formData, setFormData] = useState({
    customerId: "",
    driverId: "",
    boxQuantity: "",
    totalAmount: "",
    paidAmount: "",
    deliveryDate: "",
    pickupDate: "",
    deliveryAddress: "",
    pickupAddress: "",
    notes: "",
    status: "pendiente"
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch rentals
  const { data: rentals = [], isLoading } = useQuery({
    queryKey: ["/api/rentals"],
    queryFn: async () => {
      const response = await fetch("/api/rentals");
      if (!response.ok) throw new Error("Error al cargar arriendos");
      const data = await response.json();
      
      // Agregar datos calculados
      return data.map((rental: Rental) => ({
        ...rental,
        customerName: "Cliente Ejemplo", // En producción vendría de la relación
        driverName: rental.driverId ? "Repartidor Asignado" : null,
        remainingDays: rental.pickupDate ? 
          Math.ceil((new Date(rental.pickupDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null,
        overdueAmount: parseFloat(rental.totalAmount || "0") - parseFloat(rental.paidAmount || "0")
      }));
    }
  });

  // Fetch customers for dropdown
  const { data: customers = [] } = useQuery({
    queryKey: ["/api/customers"],
    queryFn: async () => {
      const response = await fetch("/api/customers");
      if (!response.ok) throw new Error("Error al cargar clientes");
      return response.json();
    }
  });

  // Fetch drivers for dropdown
  const { data: drivers = [] } = useQuery({
    queryKey: ["/api/drivers"],
    queryFn: async () => {
      const response = await fetch("/api/drivers");
      if (!response.ok) throw new Error("Error al cargar repartidores");
      return response.json();
    }
  });

  // Create rental mutation
  const createRentalMutation = useMutation({
    mutationFn: async (rentalData: any) => {
      const response = await fetch("/api/rentals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rentalData)
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al crear arriendo");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rentals"] });
      toast({ title: "Arriendo creado con éxito", variant: "default" });
      setShowCreateDialog(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  // Update rental mutation
  const updateRentalMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await fetch(`/api/rentals/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al actualizar arriendo");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rentals"] });
      toast({ title: "Arriendo actualizado con éxito", variant: "default" });
      setShowEditDialog(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({rentalId, status}: {rentalId: string, status: string}) => {
      const response = await fetch(`/api/rentals/${rentalId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al actualizar estado");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rentals"] });
      toast({ title: "Estado actualizado con éxito", variant: "default" });
      setShowStatusDialog(false);
      setStatusChangeData(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const resetForm = () => {
    setFormData({
      customerId: "",
      driverId: "",
      boxQuantity: "",
      totalAmount: "",
      paidAmount: "",
      deliveryDate: "",
      pickupDate: "",
      deliveryAddress: "",
      pickupAddress: "",
      notes: "",
      status: "pendiente"
    });
  };

  const handleCreateRental = () => {
    createRentalMutation.mutate({
      ...formData,
      boxQuantity: parseInt(formData.boxQuantity),
      totalAmount: formData.totalAmount,
      paidAmount: formData.paidAmount || "0",
      deliveryDate: formData.deliveryDate || null,
      pickupDate: formData.pickupDate || null
    });
  };

  const handleEditRental = (rental: RentalWithDetails) => {
    setSelectedRental(rental);
    setFormData({
      customerId: rental.customerId,
      driverId: rental.driverId || "",
      boxQuantity: rental.boxQuantity.toString(),
      totalAmount: rental.totalAmount || "",
      paidAmount: rental.paidAmount || "",
      deliveryDate: rental.deliveryDate ? new Date(rental.deliveryDate).toISOString().split('T')[0] : "",
      pickupDate: rental.pickupDate ? new Date(rental.pickupDate).toISOString().split('T')[0] : "",
      deliveryAddress: rental.deliveryAddress || "",
      pickupAddress: rental.pickupAddress || "",
      notes: rental.notes || "",
      status: rental.status || "pendiente"
    });
    setShowEditDialog(true);
  };

  const handleUpdateRental = () => {
    if (selectedRental) {
      updateRentalMutation.mutate({ 
        id: selectedRental.id, 
        data: {
          ...formData,
          boxQuantity: parseInt(formData.boxQuantity),
          deliveryDate: formData.deliveryDate || null,
          pickupDate: formData.pickupDate || null
        }
      });
    }
  };

  const handleStatusChange = (rentalId: string, newStatus: string) => {
    setStatusChangeData({ rentalId, newStatus });
    setShowStatusDialog(true);
  };

  const confirmStatusChange = () => {
    if (statusChangeData) {
      // Actualizar localmente para feedback inmediato
      queryClient.setQueryData(["/api/rentals"], (old: RentalWithDetails[] | undefined) => {
        if (!old) return old;
        return old.map(rental => 
          rental.id === statusChangeData.rentalId 
            ? { 
                ...rental, 
                status: statusChangeData.newStatus,
                // Si se marca como programada, mostrar que se asignará un repartidor
                driverName: statusChangeData.newStatus === "programada" ? "Asignando repartidor..." : rental.driverName
              }
            : rental
        );
      });

      updateStatusMutation.mutate({
        rentalId: statusChangeData.rentalId,
        status: statusChangeData.newStatus
      });
    }
  };

  const toggleFilter = (filterId: string) => {
    setActiveFilters(prev => 
      prev.includes(filterId) 
        ? prev.filter(f => f !== filterId)
        : [...prev, filterId]
    );
  };

  const filteredRentals = rentals.filter((rental: RentalWithDetails) => {
    // Search filter
    const searchMatch = searchTerm === "" || 
      (rental.customerName && rental.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      rental.id.includes(searchTerm) ||
      (rental.deliveryAddress && rental.deliveryAddress.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!searchMatch) return false;

    // Quick filters
    for (const filter of activeFilters) {
      switch (filter) {
        case "pending":
          if (!["pendiente", "programada"].includes(rental.status)) return false;
          break;
        case "in_progress":
          if (!["en_ruta", "entregada", "retiro_programado"].includes(rental.status)) return false;
          break;
        case "overdue":
          if (!rental.remainingDays || rental.remainingDays > 0) return false;
          break;
        case "today_delivery":
          if (!rental.deliveryDate || new Date(rental.deliveryDate).toDateString() !== new Date().toDateString()) return false;
          break;
        case "today_pickup":
          if (!rental.pickupDate || new Date(rental.pickupDate).toDateString() !== new Date().toDateString()) return false;
          break;
        case "unpaid":
          if (parseFloat(rental.paidAmount || "0") >= parseFloat(rental.totalAmount || "0")) return false;
          break;
      }
    }

    return true;
  });

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(parseInt(amount));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Arriendos</h1>
        <Button onClick={() => setShowCreateDialog(true)} className="bg-green-600 hover:bg-green-700">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Arriendo
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por cliente, ID de arriendo o dirección..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Quick Filters */}
            <div className="flex flex-wrap gap-2">
              {quickFilters.map(filter => (
                <button
                  key={filter.id}
                  onClick={() => toggleFilter(filter.id)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    activeFilters.includes(filter.id)
                      ? 'bg-blue-100 text-blue-800 border border-blue-300'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filter.label}
                  {activeFilters.includes(filter.id) && (
                    <X className="h-3 w-3 ml-1 inline" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rentals Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">Cargando arriendos...</div>
          ) : filteredRentals.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {searchTerm || activeFilters.length > 0 ? "No se encontraron arriendos" : "No hay arriendos registrados"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cajas</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fechas</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pago</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Repartidor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRentals.map((rental: RentalWithDetails) => (
                    <tr key={rental.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{rental.customerName}</div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {rental.deliveryAddress?.substring(0, 30)}...
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Package className="h-4 w-4 mr-2 text-blue-600" />
                          <span className="font-medium">{rental.boxQuantity}</span>
                        </div>
                        {rental.remainingDays !== null && rental.remainingDays !== undefined && (
                          <div className={`text-sm ${rental.remainingDays < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                            {rental.remainingDays < 0 ? `${Math.abs(rental.remainingDays)} días atrasado` : 
                             rental.remainingDays === 0 ? 'Retiro hoy' : 
                             `${rental.remainingDays} días restantes`}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {rental.deliveryDate && (
                          <div className="flex items-center mb-1">
                            <Calendar className="h-3 w-3 mr-1 text-green-600" />
                            <span>Entrega: {formatDate(rental.deliveryDate.toString())}</span>
                          </div>
                        )}
                        {rental.pickupDate && (
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1 text-orange-600" />
                            <span>Retiro: {formatDate(rental.pickupDate.toString())}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="relative inline-block">
                          <select
                            value={rental.status || "pendiente"}
                            onChange={(e) => handleStatusChange(rental.id, e.target.value)}
                            className={`appearance-none px-3 py-1 pr-8 rounded text-xs font-medium text-white border-none cursor-pointer outline-none ${statusBadgeConfig[(rental.status || "pendiente") as keyof typeof statusBadgeConfig]?.color}`}
                          >
                            <option value="pendiente" className="text-black bg-white">Pendiente</option>
                            <option value="programada" className="text-black bg-white">Programada</option>
                            <option value="en_ruta" className="text-black bg-white">En Ruta</option>
                            <option value="entregada" className="text-black bg-white">Entregada</option>
                            <option value="retiro_programado" className="text-black bg-white">Retiro Programado</option>
                            <option value="retirada" className="text-black bg-white">Retirada</option>
                            <option value="finalizada" className="text-black bg-white">Finalizada</option>
                            <option value="cancelada" className="text-black bg-white">Cancelada</option>
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                            <svg className="w-3 h-3 fill-white" viewBox="0 0 20 20">
                              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                            </svg>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <div className="font-medium">{formatCurrency(rental.totalAmount || "0")}</div>
                          <div className={`${parseFloat(rental.paidAmount || "0") >= parseFloat(rental.totalAmount || "0") ? 'text-green-600' : 'text-red-600'}`}>
                            Pagado: {formatCurrency(rental.paidAmount || "0")}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {rental.driverName ? (
                          <div className="flex items-center">
                            <Truck className="h-4 w-4 mr-2 text-blue-600" />
                            <span className="text-sm">{rental.driverName}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Sin asignar</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedRental(rental);
                              setShowRentalDetail(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditRental(rental)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Rental Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Arriendo</DialogTitle>
            <DialogDescription>
              Completa todos los detalles del arriendo de cajas.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customer">Cliente *</Label>
              <Select value={formData.customerId} onValueChange={(value) => setFormData(prev => ({ ...prev, customerId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cliente" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer: any) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name} - {customer.rut}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="driver">Repartidor</Label>
              <Select value={formData.driverId} onValueChange={(value) => setFormData(prev => ({ ...prev, driverId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar repartidor (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {drivers.map((driver: any) => (
                    <SelectItem key={driver.id} value={driver.id}>
                      {driver.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="boxQuantity">Cantidad de Cajas *</Label>
              <Input
                id="boxQuantity"
                type="number"
                value={formData.boxQuantity}
                onChange={(e) => setFormData(prev => ({ ...prev, boxQuantity: e.target.value }))}
                placeholder="15"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalAmount">Monto Total *</Label>
              <Input
                id="totalAmount"
                value={formData.totalAmount}
                onChange={(e) => setFormData(prev => ({ ...prev, totalAmount: e.target.value }))}
                placeholder="75000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paidAmount">Monto Pagado</Label>
              <Input
                id="paidAmount"
                value={formData.paidAmount}
                onChange={(e) => setFormData(prev => ({ ...prev, paidAmount: e.target.value }))}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deliveryDate">Fecha de Entrega</Label>
              <Input
                id="deliveryDate"
                type="date"
                value={formData.deliveryDate}
                onChange={(e) => setFormData(prev => ({ ...prev, deliveryDate: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pickupDate">Fecha de Retiro</Label>
              <Input
                id="pickupDate"
                type="date"
                value={formData.pickupDate}
                onChange={(e) => setFormData(prev => ({ ...prev, pickupDate: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="programada">Programada</SelectItem>
                  <SelectItem value="en_ruta">En Ruta</SelectItem>
                  <SelectItem value="entregada">Entregada</SelectItem>
                  <SelectItem value="retiro_programado">Retiro Programado</SelectItem>
                  <SelectItem value="retirada">Retirada</SelectItem>
                  <SelectItem value="finalizada">Finalizada</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="deliveryAddress">Dirección de Entrega *</Label>
              <Input
                id="deliveryAddress"
                value={formData.deliveryAddress}
                onChange={(e) => setFormData(prev => ({ ...prev, deliveryAddress: e.target.value }))}
                placeholder="Av. Providencia 123, Santiago"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="pickupAddress">Dirección de Retiro</Label>
              <Input
                id="pickupAddress"
                value={formData.pickupAddress}
                onChange={(e) => setFormData(prev => ({ ...prev, pickupAddress: e.target.value }))}
                placeholder="Misma dirección de entrega (opcional)"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Notas del Arriendo</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Instrucciones especiales, horarios preferidos, etc."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateRental}
              disabled={!formData.customerId || !formData.boxQuantity || !formData.totalAmount || !formData.deliveryAddress || createRentalMutation.isPending}
            >
              {createRentalMutation.isPending ? "Creando..." : "Crear Arriendo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Change Confirmation Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Cambio de Estado</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de cambiar el estado del arriendo a "{statusChangeData?.newStatus && statusBadgeConfig[statusChangeData.newStatus as keyof typeof statusBadgeConfig]?.label}"?
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">Este cambio generará las siguientes acciones automáticas:</p>
                  <ul className="mt-2 space-y-1">
                    <li>• Cliente será notificado por email y SMS</li>
                    <li>• {statusChangeData?.newStatus === "programada" ? "Se asignará automáticamente un repartidor disponible" : "Repartidor recibirá actualización si está asignado"}</li>
                    <li>• Se actualizará el estado del inventario de cajas</li>
                    <li>• Se registrará en el historial de actividades</li>
                  </ul>
                </div>
              </div>
            </div>
            
            {statusChangeData?.newStatus === "programada" && (
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-start space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div className="text-sm text-green-800">
                    <p className="font-medium">Asignación Automática de Repartidor</p>
                    <p className="mt-1">El sistema seleccionará automáticamente un repartidor activo disponible con menos arriendos asignados para garantizar una distribución equitativa del trabajo.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={confirmStatusChange}
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending ? "Actualizando..." : "Confirmar Cambio"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}