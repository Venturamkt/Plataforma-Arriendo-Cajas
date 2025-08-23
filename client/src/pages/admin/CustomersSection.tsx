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
  Package
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Customer } from "@shared/schema";
import { useRutInput, validateRut } from "@/lib/rutUtils";
import { CheckCircle2, AlertTriangle } from "lucide-react";

interface CustomerWithStats extends Customer {
  rentalsText?: string;
  lastRentalStatus?: string;
  debtAmount?: number;
}



const quickFilters = [
  { id: "active_rentals", label: "Con arriendos activos" },
  { id: "with_debt", label: "Con saldo" },
  { id: "overdue", label: "En mora" },
  { id: "no_driver", label: "Sin repartidor" },
  { id: "pickup_week", label: "Con retiro esta semana" }
];

export default function CustomersSection() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showCustomerDetail, setShowCustomerDetail] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithStats | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    rut: "",
    email: "",
    phone: "+56",
    mainAddress: "",
    secondaryAddress: "",
    notes: ""
  });

  // Hook para manejo de RUT con formateo automático
  const rutInput = useRutInput(formData.rut);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch customers
  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["/api/customers"],
    queryFn: async () => {
      const response = await fetch("/api/customers");
      if (!response.ok) throw new Error("Error al cargar clientes");
      const data = await response.json();
      
      // Agregar datos simulados para la demo
      return data.map((customer: Customer) => ({
        ...customer,
        rentalsText: `${customer.activeRentals || 0} activos / ${customer.totalRentals || 0} total`,
        lastRentalStatus: (customer.activeRentals || 0) > 0 ? "entregada" : "pendiente",
        debtAmount: parseFloat(customer.currentDebt || "0")
      }));
    }
  });

  // Create customer mutation
  const createCustomerMutation = useMutation({
    mutationFn: async (customerData: any) => {
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customerData)
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al crear cliente");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({ title: "Cliente creado con éxito", variant: "default" });
      setShowCreateDialog(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  // Update customer mutation
  const updateCustomerMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await fetch(`/api/customers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al actualizar cliente");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({ title: "Cliente actualizado con éxito", variant: "default" });
      setShowEditDialog(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  // Delete customer mutation
  const deleteCustomerMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/customers/${id}`, { method: "DELETE" });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al eliminar cliente");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({ title: "Cliente eliminado con éxito", variant: "default" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });



  const resetForm = () => {
    setFormData({
      name: "",
      rut: "",
      email: "",
      phone: "+56",
      mainAddress: "",
      secondaryAddress: "",
      notes: ""
    });
    rutInput.setValue(""); // Reset RUT input
  };

  const handleCreateCustomer = () => {
    // Usar el RUT formateado y validado
    const submitData = {
      ...formData,
      rut: rutInput.value || formData.rut
    };
    
    // Validar RUT antes de enviar
    if (rutInput.validation && !rutInput.validation.isValid) {
      toast({
        title: "RUT inválido",
        description: "Por favor ingresa un RUT válido",
        variant: "destructive"
      });
      return;
    }
    
    createCustomerMutation.mutate(submitData);
  };

  const handleUpdateCustomer = () => {
    if (selectedCustomer) {
      // Usar el RUT formateado y validado
      const submitData = {
        ...formData,
        rut: rutInput.value || formData.rut
      };
      
      // Validar RUT antes de enviar
      if (rutInput.validation && !rutInput.validation.isValid) {
        toast({
          title: "RUT inválido",
          description: "Por favor ingresa un RUT válido",
          variant: "destructive"
        });
        return;
      }
      
      updateCustomerMutation.mutate({ id: selectedCustomer.id, data: submitData });
    }
  };

  const handleEditCustomer = (customer: CustomerWithStats) => {
    setSelectedCustomer(customer);
    setFormData({
      name: customer.name,
      rut: customer.rut,
      email: customer.email,
      phone: customer.phone || "+56",
      mainAddress: customer.mainAddress || "",
      secondaryAddress: customer.secondaryAddress || "",
      notes: customer.notes || ""
    });
    rutInput.setValue(customer.rut);
    setShowEditDialog(true);
  };

  const handleDeleteCustomer = (customer: CustomerWithStats) => {
    if ((customer.activeRentals || 0) > 0 || (customer.debtAmount || 0) > 0) {
      toast({ 
        title: "No se puede eliminar", 
        description: "El cliente tiene arriendos activos o deuda pendiente",
        variant: "destructive" 
      });
      return;
    }
    
    if (confirm(`¿Estás seguro de eliminar al cliente ${customer.name}?`)) {
      deleteCustomerMutation.mutate(customer.id);
    }
  };

  const toggleFilter = (filterId: string) => {
    setActiveFilters(prev => 
      prev.includes(filterId) 
        ? prev.filter(f => f !== filterId)
        : [...prev, filterId]
    );
  };



  const filteredCustomers = customers.filter((customer: CustomerWithStats) => {
    // Search filter
    const searchMatch = searchTerm === "" || 
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.rut.includes(searchTerm) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.phone && customer.phone.includes(searchTerm));

    if (!searchMatch) return false;

    // Quick filters
    for (const filter of activeFilters) {
      switch (filter) {
        case "active_rentals":
          if ((customer.activeRentals || 0) === 0) return false;
          break;
        case "with_debt":
          if ((customer.debtAmount || 0) <= 0) return false;
          break;
        case "overdue":
          // Simulamos mora basada en deuda > 0
          if ((customer.debtAmount || 0) <= 0) return false;
          break;
        case "no_driver":
          // Esta lógica se implementaría con datos reales de arriendos
          break;
        case "pickup_week":
          // Esta lógica se implementaría con datos reales de fechas
          break;
      }
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Clientes</h1>
        <Button onClick={() => setShowCreateDialog(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Cliente
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
                placeholder="Buscar por nombre, RUT, email o teléfono..."
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

      {/* Customers Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">Cargando clientes...</div>
          ) : filteredCustomers.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {searchTerm || activeFilters.length > 0 ? "No se encontraron clientes" : "No hay clientes registrados"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contacto</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RUT</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Arriendos</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deuda</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCustomers.map((customer: CustomerWithStats) => (
                    <tr key={customer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{customer.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <a href={`tel:${customer.phone}`} className="text-blue-600 hover:text-blue-800">
                            <Phone className="h-4 w-4" />
                          </a>
                          <a href={`mailto:${customer.email}`} className="text-blue-600 hover:text-blue-800">
                            <Mail className="h-4 w-4" />
                          </a>
                          <span className="text-sm text-gray-600">{customer.phone}</span>
                        </div>
                        <div className="text-sm text-gray-500">{customer.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {customer.rut}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button 
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          onClick={() => {
                            setSelectedCustomer(customer);
                            setShowCustomerDetail(true);
                          }}
                        >
                          {customer.rentalsText}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${(customer.debtAmount || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          ${(customer.debtAmount || 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedCustomer(customer);
                              setShowCustomerDetail(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditCustomer(customer)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCustomer(customer)}
                            disabled={(customer.activeRentals || 0) > 0 || (customer.debtAmount || 0) > 0}
                          >
                            <Trash2 className="h-4 w-4" />
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

      {/* Create Customer Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Cliente</DialogTitle>
            <DialogDescription>
              Ingresa los datos del cliente. Los campos marcados con * son obligatorios.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre/Razón Social *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Empresa ABC Ltda."
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="rut">RUT *</Label>
              <div className="relative">
                <Input
                  id="rut"
                  value={rutInput.value}
                  onChange={(e) => {
                    rutInput.setValue(e.target.value);
                    setFormData(prev => ({ ...prev, rut: e.target.value }));
                  }}
                  placeholder="12.345.678-9"
                  className={`pr-10 ${
                    rutInput.validation === null 
                      ? '' 
                      : rutInput.validation.isValid 
                        ? 'border-green-500 focus:border-green-500' 
                        : 'border-red-500 focus:border-red-500'
                  }`}
                />
                {rutInput.validation && (
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    {rutInput.validation.isValid ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                )}
              </div>
              {rutInput.validation && !rutInput.validation.isValid && rutInput.value.length > 2 && (
                <p className="text-sm text-red-500">
                  RUT inválido. Dígito verificador correcto: {rutInput.validation.verifierDigit}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="contacto@empresa.cl"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+56912345678"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateCustomer}
              disabled={!formData.name || !formData.rut || !formData.email || !formData.phone || createCustomerMutation.isPending}
            >
              {createCustomerMutation.isPending ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Customer Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
            <DialogDescription>
              Modifica los datos del cliente.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nombre/Razón Social *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-rut">RUT *</Label>
              <div className="relative">
                <Input
                  id="edit-rut"
                  value={rutInput.value}
                  onChange={(e) => {
                    rutInput.setValue(e.target.value);
                    setFormData(prev => ({ ...prev, rut: e.target.value }));
                  }}
                  placeholder="12.345.678-9"
                  className={`pr-10 ${
                    rutInput.validation === null 
                      ? '' 
                      : rutInput.validation.isValid 
                        ? 'border-green-500 focus:border-green-500' 
                        : 'border-red-500 focus:border-red-500'
                  }`}
                />
                {rutInput.validation && (
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    {rutInput.validation.isValid ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                )}
              </div>
              {rutInput.validation && !rutInput.validation.isValid && rutInput.value.length > 2 && (
                <p className="text-sm text-red-500">
                  RUT inválido. Dígito verificador correcto: {rutInput.validation.verifierDigit}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email *</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Teléfono *</Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="edit-mainAddress">Dirección Principal</Label>
              <Input
                id="edit-mainAddress"
                value={formData.mainAddress}
                onChange={(e) => setFormData(prev => ({ ...prev, mainAddress: e.target.value }))}
                placeholder="Av. Providencia 1234, Providencia"
              />
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="edit-secondaryAddress">Dirección Secundaria</Label>
              <Input
                id="edit-secondaryAddress"
                value={formData.secondaryAddress}
                onChange={(e) => setFormData(prev => ({ ...prev, secondaryAddress: e.target.value }))}
                placeholder="Dirección alternativa (opcional)"
              />
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="edit-notes">Notas</Label>
              <Textarea
                id="edit-notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Información adicional sobre el cliente..."
                rows={3}
              />
            </div>

          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleUpdateCustomer}
              disabled={!formData.name || !formData.rut || !formData.email || !formData.phone || updateCustomerMutation.isPending}
            >
              {updateCustomerMutation.isPending ? "Actualizando..." : "Actualizar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Customer Detail Dialog */}
      <Dialog open={showCustomerDetail} onOpenChange={setShowCustomerDetail}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Ficha de Cliente</span>
              {selectedCustomer && (
                <div className="flex items-center space-x-2">
                  {(selectedCustomer.debtAmount || 0) > 0 && (
                    <Badge variant="destructive">Deuda: ${(selectedCustomer.debtAmount || 0).toLocaleString()}</Badge>
                  )}
                  {(selectedCustomer.activeRentals || 0) > 0 && (
                    <Badge variant="default">{selectedCustomer.activeRentals || 0} arriendos activos</Badge>
                  )}
                </div>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {selectedCustomer && (
            <div className="space-y-6">
              {/* Customer Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{selectedCustomer.name}</CardTitle>
                  <CardDescription>
                    RUT: {selectedCustomer.rut} | Email: {selectedCustomer.email} | Teléfono: {selectedCustomer.phone}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedCustomer.mainAddress && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span>{selectedCustomer.mainAddress}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Alerts */}
              {((selectedCustomer.debtAmount || 0) > 0 || (selectedCustomer.activeRentals || 0) > 0) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <AlertCircle className="h-5 w-5 mr-2 text-yellow-600" />
                      Alertas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {(selectedCustomer.debtAmount || 0) > 0 && (
                      <div className="flex items-center space-x-2 text-red-600">
                        <AlertCircle className="h-4 w-4" />
                        <span>Saldo pendiente: ${(selectedCustomer.debtAmount || 0).toLocaleString()}</span>
                      </div>
                    )}
                    {(selectedCustomer.activeRentals || 0) > 0 && (
                      <div className="flex items-center space-x-2 text-blue-600">
                        <Package className="h-4 w-4" />
                        <span>{selectedCustomer.activeRentals || 0} arriendos activos con cajas en terreno</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2">
                <Button className="bg-green-600 hover:bg-green-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Nuevo Arriendo
                </Button>
                <Button variant="outline" onClick={() => window.open(`tel:${selectedCustomer.phone}`)}>
                  <Phone className="h-4 w-4 mr-2" />
                  Llamar
                </Button>
                <Button variant="outline" onClick={() => window.open(`mailto:${selectedCustomer.email}`)}>
                  <Mail className="h-4 w-4 mr-2" />
                  Enviar Correo
                </Button>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">{selectedCustomer.totalRentals}</div>
                    <div className="text-sm text-gray-600">Total Arriendos</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{selectedCustomer.activeRentals || 0}</div>
                    <div className="text-sm text-gray-600">Arriendos Activos</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className={`text-2xl font-bold ${(selectedCustomer.debtAmount || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      ${(selectedCustomer.debtAmount || 0).toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">Saldo Actual</div>
                  </CardContent>
                </Card>
              </div>

              {/* Activity Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Resumen de Actividad</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="text-sm text-gray-600">Cliente desde</span>
                    <span className="font-medium">Enero 2024</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="text-sm text-gray-600">Último arriendo</span>
                    <span className="font-medium">15 Ago 2024</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="text-sm text-gray-600">Estado general</span>
                    <Badge className="bg-green-500 text-white">Cliente activo</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Next Steps */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Próximas Acciones</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-600">
                    Para ver detalles específicos de arriendos (cantidad de cajas, días, fechas de entrega y retiro), ve a la sección <strong>Arriendos</strong> en el menú lateral.
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>


    </div>
  );
}