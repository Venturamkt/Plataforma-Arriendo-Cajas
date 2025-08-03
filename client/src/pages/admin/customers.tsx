import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import type { Customer, InsertCustomer, Box } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table as TableComponent, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Mail, Phone, MapPin, User, Package, Calendar, AlertTriangle, CheckCircle, Grid3X3, Table } from "lucide-react";

export default function AdminCustomers() {
  const { toast } = useToast();
  const { user, isLoading } = useCurrentUser();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewCustomerDialog, setShowNewCustomerDialog] = useState(false);
  const [showRentalDialog, setShowRentalDialog] = useState(false);
  const [selectedCustomerForRental, setSelectedCustomerForRental] = useState<Customer | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    rut: ""
  });
  const [newRental, setNewRental] = useState({
    boxQuantity: 1,
    rentalDays: 7,
    deliveryDate: "",
    deliveryAddress: "",
    pickupAddress: "",
    notes: "",
    boxSize: "mediano"
  });
  const [availabilityCheck, setAvailabilityCheck] = useState<{
    available: number;
    total: number;
    conflicts: any[];
    canRent: boolean;
  } | null>(null);

  // Redirect to home if not authenticated
  useEffect(() => {
    if (isLoading) return;
    if (!user || user.type !== 'admin') {
      window.location.href = "/";
      return;
    }
  }, [user, isLoading]);

  const { data: customers, isLoading: customersLoading } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
    retry: false,
    enabled: !!user,
  });

  const { data: rentals } = useQuery<any[]>({
    queryKey: ["/api/rentals"],
    retry: false,
    enabled: !!user,
  });

  const { data: boxes } = useQuery<Box[]>({
    queryKey: ["/api/boxes"],
    retry: false,
    enabled: !!user,
  });

  const createCustomerMutation = useMutation({
    mutationFn: async (customerData: InsertCustomer) => {
      const response = await apiRequest("POST", "/api/customers", customerData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      setShowNewCustomerDialog(false);
      setNewCustomer({ name: "", email: "", phone: "", address: "", rut: "" });
      toast({
        title: "Cliente creado",
        description: "El cliente ha sido creado exitosamente",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo crear el cliente",
        variant: "destructive",
      });
    },
  });

  const updateCustomerMutation = useMutation({
    mutationFn: async (customerData: typeof newCustomer) => {
      const response = await apiRequest("PUT", `/api/customers/${editingCustomer?.id}`, customerData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      setShowEditDialog(false);
      setEditingCustomer(null);
      setNewCustomer({ name: "", email: "", phone: "", address: "", rut: "" });
      toast({
        title: "Cliente actualizado",
        description: "El cliente ha sido actualizado exitosamente",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el cliente",
        variant: "destructive",
      });
    },
  });

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.name || !newCustomer.email) {
      toast({
        title: "Campos requeridos",
        description: "Nombre y email son obligatorios",
        variant: "destructive",
      });
      return;
    }
    createCustomerMutation.mutate(newCustomer);
  };

  const handleCreateRental = (customer: Customer) => {
    setSelectedCustomerForRental(customer);
    setNewRental({
      boxSize: "standard",
      boxQuantity: 1,
      rentalDays: 7,
      deliveryDate: "",
      deliveryAddress: customer.address || "",
      pickupAddress: customer.address || "",
      notes: ""
    });
    setShowRentalDialog(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setNewCustomer({
      name: customer.name,
      email: customer.email,
      phone: customer.phone || "",
      address: customer.address || "",
      rut: customer.rut || ""
    });
    setShowEditDialog(true);
  };

  const handleEditCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.name || !newCustomer.email) {
      toast({ title: "Por favor completa los campos requeridos", variant: "destructive" });
      return;
    }
    updateCustomerMutation.mutate(newCustomer);
  };

  // Check availability when rental details change
  const checkAvailability = async () => {
    if (!newRental.deliveryDate || !newRental.boxQuantity || !boxes) {
      setAvailabilityCheck(null);
      return;
    }

    const deliveryDate = new Date(newRental.deliveryDate);
    const returnDate = new Date(deliveryDate);
    returnDate.setDate(returnDate.getDate() + newRental.rentalDays);

    // Get available boxes by size
    const boxesBySize = boxes.filter(box => box.size === newRental.boxSize);
    
    // Check conflicts with existing rentals
    const conflicts = rentals?.filter(rental => {
      if (rental.status === 'cancelada' || rental.status === 'finalizado') return false;
      
      const rentalStart = new Date(rental.deliveryDate);
      const rentalEnd = new Date(rental.returnDate);
      
      // Check if dates overlap
      return (deliveryDate <= rentalEnd && returnDate >= rentalStart);
    }) || [];

    const conflictingBoxes = conflicts.reduce((count, rental) => {
      return count + (rental.boxQuantity || 0);
    }, 0);

    const availableBoxes = boxesBySize.length - conflictingBoxes;
    const canRent = availableBoxes >= newRental.boxQuantity;

    setAvailabilityCheck({
      available: availableBoxes,
      total: boxesBySize.length,
      conflicts,
      canRent
    });
  };

  // Run availability check when rental details change
  useEffect(() => {
    if (showRentalDialog) {
      checkAvailability();
    }
  }, [newRental.deliveryDate, newRental.boxQuantity, newRental.rentalDays, newRental.boxSize, showRentalDialog]);

  const createRentalMutation = useMutation({
    mutationFn: async (rentalData: any) => {
      const response = await apiRequest("POST", "/api/rentals", rentalData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rentals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      setShowRentalDialog(false);
      setNewRental({
        boxQuantity: 1,
        rentalDays: 7,
        deliveryDate: "",
        deliveryAddress: "",
        pickupAddress: "",
        notes: "",
        boxSize: "mediano"
      });
      toast({
        title: "Arriendo creado",
        description: "El arriendo ha sido creado exitosamente",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo crear el arriendo",
        variant: "destructive",
      });
    },
  });

  const handleCreateRentalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerForRental || !newRental.deliveryDate || !newRental.deliveryAddress) {
      toast({
        title: "Campos requeridos",
        description: "Complete todos los campos obligatorios",
        variant: "destructive",
      });
      return;
    }

    if (!availabilityCheck?.canRent) {
      toast({
        title: "Sin disponibilidad",
        description: "No hay suficientes cajas disponibles para las fechas seleccionadas",
        variant: "destructive",
      });
      return;
    }

    const deliveryDate = new Date(newRental.deliveryDate);
    const returnDate = new Date(deliveryDate);
    returnDate.setDate(returnDate.getDate() + newRental.rentalDays);

    createRentalMutation.mutate({
      customerId: selectedCustomerForRental.id,
      totalBoxes: newRental.boxQuantity,
      dailyRate: 2000,
      totalAmount: newRental.boxQuantity * newRental.rentalDays * 2000,
      startDate: deliveryDate.toISOString(),
      endDate: returnDate.toISOString(),
      deliveryAddress: newRental.deliveryAddress,
      notes: newRental.notes || "",
      status: "pendiente"
    });
  };

  const filteredCustomers = customers?.filter((customer) => 
    searchQuery === "" || 
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Get rental stats for each customer
  const getCustomerStats = (customerId: string) => {
    if (!rentals) return { active: 0, total: 0, lastRental: null };
    
    const customerRentals = rentals.filter((rental: any) => rental.customerId === customerId);
    const activeRentals = customerRentals.filter((rental: any) => 
      ['pagada', 'entregada'].includes(rental.status)
    );
    
    return {
      active: activeRentals.length,
      total: customerRentals.length,
      lastRental: customerRentals.length > 0 ? customerRentals[0] : null
    };
  };

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
        <Sidebar role={'admin'} />
        
        <main className="flex-1 p-4 lg:p-8 pb-20 lg:pb-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
              Gestión de Clientes
            </h1>
            <p className="text-gray-600">
              Base de datos completa de clientes y su historial de arriendos
            </p>
          </div>

          {/* Search and Actions */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por nombre, email o teléfono..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === 'cards' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('cards')}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'table' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('table')}
                  >
                    <Table className="h-4 w-4" />
                  </Button>
                </div>
                
                <Dialog open={showNewCustomerDialog} onOpenChange={setShowNewCustomerDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-brand-red hover:bg-brand-red text-white flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Nuevo Cliente
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Crear Nuevo Cliente</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateCustomer} className="space-y-4">
                      <div>
                        <Label htmlFor="name">Nombre *</Label>
                        <Input
                          id="name"
                          value={newCustomer.name}
                          onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                          placeholder="Nombre completo"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={newCustomer.email}
                          onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                          placeholder="correo@ejemplo.com"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Teléfono</Label>
                        <Input
                          id="phone"
                          value={newCustomer.phone}
                          onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                          placeholder="+56 9 1234 5678"
                        />
                      </div>
                      <div>
                        <Label htmlFor="rut">RUT</Label>
                        <Input
                          id="rut"
                          value={newCustomer.rut}
                          onChange={(e) => setNewCustomer({ ...newCustomer, rut: e.target.value })}
                          placeholder="12.345.678-9"
                        />
                      </div>
                      <div>
                        <Label htmlFor="address">Dirección</Label>
                        <Input
                          id="address"
                          value={newCustomer.address}
                          onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                          placeholder="Dirección completa"
                        />
                      </div>
                      <div className="flex gap-2 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowNewCustomerDialog(false)}
                          className="flex-1"
                        >
                          Cancelar
                        </Button>
                        <Button
                          type="submit"
                          disabled={createCustomerMutation.isPending}
                          className="flex-1 bg-brand-red hover:bg-brand-red text-white"
                        >
                          {createCustomerMutation.isPending ? "Creando..." : "Crear Cliente"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
          </Card>

          {/* Rental Creation Dialog */}
          <Dialog open={showRentalDialog} onOpenChange={setShowRentalDialog}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Crear Nuevo Arriendo</DialogTitle>
                <DialogDescription>
                  Cliente: {selectedCustomerForRental?.name}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateRentalSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Box Configuration */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Configuración de Cajas
                    </h3>
                    
                    <div>
                      <Label htmlFor="boxSize">Tamaño de Caja *</Label>
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-blue-600" />
                          <span className="font-medium text-blue-900">Caja Estándar (60x40 cm)</span>
                        </div>
                        <p className="text-sm text-blue-700 mt-1">Único tamaño disponible actualmente</p>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="boxQuantity">Cantidad de Cajas *</Label>
                      <Input
                        id="boxQuantity"
                        type="number"
                        min="1"
                        value={newRental.boxQuantity}
                        onChange={(e) => setNewRental({ ...newRental, boxQuantity: parseInt(e.target.value) || 1 })}
                        placeholder="1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="rentalDays">Días de Arriendo *</Label>
                      <Input
                        id="rentalDays"
                        type="number"
                        min="1"
                        value={newRental.rentalDays}
                        onChange={(e) => setNewRental({ ...newRental, rentalDays: parseInt(e.target.value) || 7 })}
                        placeholder="7"
                      />
                    </div>
                  </div>

                  {/* Dates and Addresses */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Fechas y Direcciones
                    </h3>
                    
                    <div>
                      <Label htmlFor="deliveryDate">Fecha de Entrega *</Label>
                      <Input
                        id="deliveryDate"
                        type="date"
                        value={newRental.deliveryDate}
                        onChange={(e) => setNewRental({ ...newRental, deliveryDate: e.target.value })}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>

                    <div>
                      <Label htmlFor="deliveryAddress">Dirección de Entrega *</Label>
                      <Textarea
                        id="deliveryAddress"
                        value={newRental.deliveryAddress}
                        onChange={(e) => setNewRental({ ...newRental, deliveryAddress: e.target.value })}
                        placeholder="Dirección completa de entrega"
                        className="min-h-[60px]"
                      />
                    </div>

                    <div>
                      <Label htmlFor="pickupAddress">Dirección de Retiro</Label>
                      <Textarea
                        id="pickupAddress"
                        value={newRental.pickupAddress}
                        onChange={(e) => setNewRental({ ...newRental, pickupAddress: e.target.value })}
                        placeholder="Dirección de retiro (si es diferente)"
                        className="min-h-[60px]"
                      />
                    </div>
                  </div>
                </div>

                {/* Availability Check */}
                {availabilityCheck && (
                  <div className={`p-4 rounded-lg border ${
                    availabilityCheck.canRent 
                      ? "bg-green-50 border-green-200" 
                      : "bg-red-50 border-red-200"
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      {availabilityCheck.canRent ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                      )}
                      <h4 className="font-semibold">
                        {availabilityCheck.canRent ? "Disponible" : "Sin Disponibilidad"}
                      </h4>
                    </div>
                    <div className="text-sm">
                      <p>
                        <strong>Cajas disponibles:</strong> {availabilityCheck.available} de {availabilityCheck.total} 
                        ({newRental.boxSize})
                      </p>
                      <p>
                        <strong>Solicitadas:</strong> {newRental.boxQuantity} cajas
                      </p>
                      {availabilityCheck.conflicts.length > 0 && (
                        <p className="mt-2">
                          <strong>Conflictos encontrados:</strong> {availabilityCheck.conflicts.length} arriendos activos
                        </p>
                      )}
                      {!availabilityCheck.canRent && (
                        <p className="text-red-600 mt-2">
                          No hay suficientes cajas disponibles para las fechas seleccionadas.
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Price Calculation */}
                {newRental.boxQuantity && newRental.rentalDays && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-semibold mb-2">Resumen de Precio</h4>
                    <div className="text-sm space-y-1">
                      <p>{newRental.boxQuantity} cajas × {newRental.rentalDays} días × $2.000 = ${(newRental.boxQuantity * newRental.rentalDays * 2000).toLocaleString()}</p>
                      <p className="font-semibold text-lg">Total: ${(newRental.boxQuantity * newRental.rentalDays * 2000).toLocaleString()}</p>
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div>
                  <Label htmlFor="notes">Notas Adicionales</Label>
                  <Textarea
                    id="notes"
                    value={newRental.notes}
                    onChange={(e) => setNewRental({ ...newRental, notes: e.target.value })}
                    placeholder="Instrucciones especiales, comentarios..."
                    className="min-h-[80px]"
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowRentalDialog(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={createRentalMutation.isPending || !availabilityCheck?.canRent}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    {createRentalMutation.isPending ? "Creando..." : "Crear Arriendo"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Customer Display */}
          {viewMode === 'table' ? (
            <Card>
              <CardHeader>
                <CardTitle>Clientes Registrados</CardTitle>
              </CardHeader>
              <CardContent>
                {customersLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue"></div>
                  </div>
                ) : filteredCustomers.length === 0 ? (
                  <div className="text-center py-8">
                    <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No se encontraron clientes
                    </h3>
                    <p className="text-gray-600">
                      {searchQuery 
                        ? "Intenta ajustar tu búsqueda"
                        : "Comienza agregando clientes al sistema"
                      }
                    </p>
                  </div>
                ) : (
                  <TableComponent>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Contacto</TableHead>
                        <TableHead>Dirección</TableHead>
                        <TableHead className="text-center">Arriendos Activos</TableHead>
                        <TableHead className="text-center">Total Arriendos</TableHead>
                        <TableHead className="text-center">Estado</TableHead>
                        <TableHead className="text-center">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCustomers.map((customer: any) => {
                        const stats = getCustomerStats(customer.id);
                        const initials = customer.name.split(' ').map((n: string) => n[0]).join('').toUpperCase();
                        
                        return (
                          <TableRow key={customer.id}>
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="bg-brand-blue text-white text-xs">
                                    {initials}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">{customer.name}</p>
                                  <p className="text-sm text-gray-600">{customer.rut}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <p className="text-sm">{customer.email}</p>
                                {customer.phone && (
                                  <p className="text-sm text-gray-600">{customer.phone}</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <p className="text-sm">{customer.address || "No especificada"}</p>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="text-lg font-bold text-brand-blue">{stats.active}</span>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="text-lg font-bold">{stats.total}</span>
                            </TableCell>
                            <TableCell className="text-center">
                              {stats.active > 0 ? (
                                <Badge className="bg-green-100 text-green-800">Activo</Badge>
                              ) : (
                                <Badge variant="outline">Inactivo</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-center gap-2">
                                <Button size="sm" variant="outline">
                                  Historial
                                </Button>
                                <Button 
                                  size="sm" 
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                  onClick={() => handleCreateRental(customer)}
                                >
                                  Arriendo
                                </Button>
                                <Button 
                                  size="sm" 
                                  className="bg-brand-blue hover:bg-brand-blue text-white"
                                  onClick={() => handleEditCustomer(customer)}
                                >
                                  Editar
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </TableComponent>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {customersLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : filteredCustomers.length === 0 ? (
              <div className="col-span-full">
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <User className="h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No se encontraron clientes
                    </h3>
                    <p className="text-gray-600 text-center">
                      {searchQuery 
                        ? "Intenta ajustar tu búsqueda"
                        : "Comienza agregando clientes al sistema"
                      }
                    </p>
                  </CardContent>
                </Card>
              </div>
            ) : (
              filteredCustomers.map((customer: any) => {
                const stats = getCustomerStats(customer.id);
                const initials = customer.name.split(' ').map((n: string) => n[0]).join('').toUpperCase();
                
                return (
                  <Card key={customer.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      {/* Customer Header */}
                      <div className="flex items-center space-x-4 mb-4">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-brand-blue text-white">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{customer.name}</h3>
                          <p className="text-sm text-gray-600">{customer.email}</p>
                        </div>
                        {stats.active > 0 && (
                          <Badge className="bg-green-100 text-green-800">
                            Activo
                          </Badge>
                        )}
                      </div>

                      {/* Contact Info */}
                      <div className="space-y-2 mb-4">
                        {customer.phone && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Phone className="h-4 w-4 mr-2" />
                            {customer.phone}
                          </div>
                        )}
                        {customer.address && (
                          <div className="flex items-center text-sm text-gray-600">
                            <MapPin className="h-4 w-4 mr-2" />
                            {customer.address}
                          </div>
                        )}
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-brand-blue">{stats.active}</p>
                          <p className="text-xs text-gray-600">Arriendos Activos</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                          <p className="text-xs text-gray-600">Total Arriendos</p>
                        </div>
                      </div>

                      {/* Last Rental */}
                      {stats.lastRental && (
                        <div className="mb-4">
                          <p className="text-xs text-gray-600 mb-1">Último arriendo:</p>
                          <p className="text-sm text-gray-900">
                            {new Date(stats.lastRental.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1">
                          Ver Historial
                        </Button>
                        <Button 
                          size="sm" 
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => handleCreateRental(customer)}
                        >
                          Nuevo Arriendo
                        </Button>
                        <Button 
                          size="sm" 
                          className="bg-brand-blue hover:bg-brand-blue text-white"
                          onClick={() => handleEditCustomer(customer)}
                        >
                          Editar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
            </div>
          )}

          {/* Edit Customer Dialog */}
          <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Editar Cliente</DialogTitle>
                <DialogDescription>
                  Actualiza la información del cliente
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleEditCustomerSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="edit-name">Nombre Completo *</Label>
                  <Input
                    id="edit-name"
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                    placeholder="Nombre completo"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-email">Email *</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                    placeholder="correo@ejemplo.com"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-rut">RUT</Label>
                  <Input
                    id="edit-rut"
                    value={newCustomer.rut}
                    onChange={(e) => setNewCustomer({ ...newCustomer, rut: e.target.value })}
                    placeholder="12.345.678-9"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-phone">Teléfono</Label>
                  <Input
                    id="edit-phone"
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                    placeholder="+56 9 1234 5678"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-address">Dirección</Label>
                  <Input
                    id="edit-address"
                    value={newCustomer.address}
                    onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                    placeholder="Dirección completa"
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowEditDialog(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateCustomerMutation.isPending}
                    className="flex-1 bg-brand-blue hover:bg-brand-blue text-white"
                  >
                    {updateCustomerMutation.isPending ? "Actualizando..." : "Actualizar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Summary */}
          {!customersLoading && filteredCustomers.length > 0 && (
            <Card className="mt-6">
              <CardContent className="p-4">
                <p className="text-sm text-gray-600">
                  Mostrando {filteredCustomers.length} de {customers?.length || 0} clientes
                </p>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
      
      <MobileNav role={'admin'} />
    </div>
  );
}
