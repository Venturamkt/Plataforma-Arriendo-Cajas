import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useCurrentUser } from "@/hooks/useCurrentUser";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search, User, Package, Calendar, MapPin, DollarSign, ArrowLeft, Calculator } from "lucide-react";

export default function NewRental() {
  const { toast } = useToast();
  const { user, isLoading } = useCurrentUser();
  const [, setLocation] = useLocation();
  
  // Form state
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerSelect, setShowCustomerSelect] = useState(false);
  const [selectedBoxes, setSelectedBoxes] = useState<any[]>([]);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [rentalDays, setRentalDays] = useState("7");
  const [useManualPrice, setUseManualPrice] = useState(false);
  const [manualBoxPrice, setManualBoxPrice] = useState("");
  
  // New customer form state
  const [showNewCustomerDialog, setShowNewCustomerDialog] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    email: "",
    phone: "",
    rut: "",
    address: ""
  });

  // Redirect to home if not authenticated
  useEffect(() => {
    if (isLoading) return;
    if (!user || user.type !== 'admin') {
      window.location.href = "/";
      return;
    }
  }, [user, isLoading]);

  const { data: customers } = useQuery({
    queryKey: ["/api/customers"],
    retry: false,
    enabled: !!user,
  });

  const { data: availableBoxes } = useQuery({
    queryKey: ["/api/boxes"],
    retry: false,
    enabled: !!user,
  });

  const createRentalMutation = useMutation({
    mutationFn: async (rentalData: any) => {
      const response = await apiRequest("POST", "/api/rentals", rentalData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rentals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/boxes"] });
      toast({
        title: "Arriendo creado",
        description: "El arriendo ha sido creado exitosamente",
      });
      setLocation("/admin/dashboard");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo crear el arriendo",
        variant: "destructive",
      });
    },
  });

  const createCustomerMutation = useMutation({
    mutationFn: async (customerData: any) => {
      const response = await apiRequest("POST", "/api/customers", customerData);
      return await response.json();
    },
    onSuccess: (createdCustomer) => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      setSelectedCustomer(createdCustomer);
      setShowNewCustomerDialog(false);
      setNewCustomer({ name: "", email: "", phone: "", rut: "", address: "" });
      toast({
        title: "Cliente creado exitosamente",
        description: "Ahora puedes continuar creando el arriendo",
      });
    },
    onError: () => {
      toast({
        title: "Error al crear cliente",
        description: "No se pudo crear el cliente",
        variant: "destructive",
      });
    },
  });

  const filteredCustomers = Array.isArray(customers) ? customers.filter((customer: any) =>
    customer.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    customer.email.toLowerCase().includes(customerSearch.toLowerCase())
  ) : [];

  const filteredBoxes = Array.isArray(availableBoxes) ? availableBoxes.filter((box: any) => 
    box.status === 'available'
  ) : [];

  const handleAddBox = (box: any) => {
    if (!selectedBoxes.find(b => b.id === box.id)) {
      setSelectedBoxes([...selectedBoxes, box]);
    }
  };

  const handleRemoveBox = (boxId: string) => {
    setSelectedBoxes(selectedBoxes.filter(box => box.id !== boxId));
  };

  const calculateTotal = () => {
    if (useManualPrice && manualBoxPrice) {
      const pricePerBox = parseInt(manualBoxPrice.replace(/[^\d]/g, '')) || 0;
      const days = parseInt(rentalDays) || 1;
      return selectedBoxes.length * pricePerBox * days;
    }
    const boxTotal = selectedBoxes.reduce((sum, box) => sum + (box.dailyRate || 1000), 0);
    const days = parseInt(rentalDays) || 1;
    return boxTotal * days;
  };

  const handleSubmit = () => {
    if (!selectedCustomer) {
      toast({
        title: "Cliente requerido",
        description: "Selecciona un cliente para el arriendo",
        variant: "destructive",
      });
      return;
    }

    if (selectedBoxes.length === 0) {
      toast({
        title: "Cajas requeridas",
        description: "Selecciona al menos una caja para el arriendo",
        variant: "destructive",
      });
      return;
    }

    if (!deliveryDate || !deliveryAddress) {
      toast({
        title: "Datos de entrega requeridos",
        description: "Completa la fecha y dirección de entrega",
        variant: "destructive",
      });
      return;
    }

    const totalAmount = calculateTotal();
    const dailyRate = useManualPrice && manualBoxPrice 
      ? parseInt(manualBoxPrice.replace(/[^\d]/g, '')) || 0
      : totalAmount / parseInt(rentalDays) / selectedBoxes.length;

    const rentalData = {
      customerId: selectedCustomer.id,
      totalBoxes: selectedBoxes.length,
      dailyRate: dailyRate,
      totalAmount: totalAmount,
      deliveryDate: deliveryDate,
      deliveryAddress,
      notes,
      status: 'pendiente'
    };

    createRentalMutation.mutate(rentalData);
  };

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.name || !newCustomer.email) {
      toast({
        title: "Datos requeridos",
        description: "El nombre y email son obligatorios",
        variant: "destructive",
      });
      return;
    }
    createCustomerMutation.mutate(newCustomer);
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
            <div className="flex items-center gap-4 mb-4">
              <Button 
                variant="outline" 
                onClick={() => setLocation("/admin/dashboard")}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver
              </Button>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                  Nuevo Arriendo
                </h1>
                <p className="text-gray-600">
                  Crea un nuevo arriendo de cajas
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Customer Selection */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-brand-blue" />
                  Seleccionar Cliente
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!selectedCustomer ? (
                  <div className="space-y-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Buscar cliente por nombre o email..."
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    
                    <div className="max-h-60 overflow-y-auto space-y-2">
                      {filteredCustomers.length > 0 ? (
                        filteredCustomers.map((customer: any) => (
                          <div
                            key={customer.id}
                            className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                            onClick={() => setSelectedCustomer(customer)}
                          >
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-brand-blue text-white text-sm">
                                  {customer.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-gray-900">{customer.name}</p>
                                <p className="text-sm text-gray-600">{customer.email}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center p-6 text-gray-500">
                          <p className="mb-4">No se encontraron clientes</p>
                          <Dialog open={showNewCustomerDialog} onOpenChange={setShowNewCustomerDialog}>
                            <DialogTrigger asChild>
                              <Button className="bg-brand-blue hover:bg-brand-blue text-white">
                                <Plus className="h-4 w-4 mr-2" />
                                Crear Nuevo Cliente
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
                                    className="flex-1 bg-brand-blue hover:bg-brand-blue text-white"
                                  >
                                    {createCustomerMutation.isPending ? "Creando..." : "Crear Cliente"}
                                  </Button>
                                </div>
                              </form>
                            </DialogContent>
                          </Dialog>
                        </div>
                      )}
                    </div>
                    
                    {/* Botón para crear cliente siempre visible */}
                    {filteredCustomers.length > 0 && (
                      <div className="pt-4 border-t">
                        <Dialog open={showNewCustomerDialog} onOpenChange={setShowNewCustomerDialog}>
                          <DialogTrigger asChild>
                            <Button variant="outline" className="w-full">
                              <Plus className="h-4 w-4 mr-2" />
                              Crear Nuevo Cliente
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
                                  className="flex-1 bg-brand-blue hover:bg-brand-blue text-white"
                                >
                                  {createCustomerMutation.isPending ? "Creando..." : "Crear Cliente"}
                                </Button>
                              </div>
                            </form>
                          </DialogContent>
                        </Dialog>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-brand-blue text-white">
                          {selectedCustomer.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-gray-900">{selectedCustomer.name}</p>
                        <p className="text-sm text-gray-600">{selectedCustomer.email}</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedCustomer(null)}
                    >
                      Cambiar
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  Resumen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Cajas seleccionadas:</span>
                  <span className="font-medium">{selectedBoxes.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Días de arriendo:</span>
                  <span className="font-medium">{rentalDays}</span>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-green-600">${calculateTotal().toLocaleString()}</span>
                  </div>
                </div>
                
                <Button 
                  onClick={handleSubmit}
                  disabled={!selectedCustomer || selectedBoxes.length === 0 || createRentalMutation.isPending}
                  className="w-full bg-brand-red hover:bg-brand-red text-white"
                >
                  {createRentalMutation.isPending ? "Creando..." : "Crear Arriendo"}
                </Button>
              </CardContent>
            </Card>

            {/* Box Selection */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-brand-blue" />
                  Seleccionar Cajas ({selectedBoxes.length} seleccionadas)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-80 overflow-y-auto">
                  {filteredBoxes.map((box: any) => (
                    <div
                      key={box.id}
                      className="p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium">{box.barcode}</p>
                        <Badge className="bg-green-100 text-green-800">
                          {box.size}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        ${(box.dailyRate || 1000).toLocaleString()}/día
                      </p>
                      <Button
                        size="sm"
                        onClick={() => handleAddBox(box)}
                        disabled={selectedBoxes.find(b => b.id === box.id)}
                        className="w-full"
                      >
                        {selectedBoxes.find(b => b.id === box.id) ? "Seleccionada" : "Seleccionar"}
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Selected Boxes */}
                {selectedBoxes.length > 0 && (
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3">Cajas Seleccionadas:</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedBoxes.map((box) => (
                        <Badge
                          key={box.id}
                          className="bg-brand-blue text-white flex items-center gap-1"
                        >
                          {box.barcode}
                          <button
                            onClick={() => handleRemoveBox(box.id)}
                            className="ml-1 hover:bg-blue-700 rounded-full p-0.5"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Delivery Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-brand-blue" />
                  Detalles de Entrega
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="rentalDays">Días de arriendo</Label>
                  <Select value={rentalDays} onValueChange={setRentalDays}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 días</SelectItem>
                      <SelectItem value="14">14 días</SelectItem>
                      <SelectItem value="30">30 días</SelectItem>
                      <SelectItem value="60">60 días</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Manual Pricing Option */}
                <div className="border-t pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="manualPricing" className="text-sm font-medium">
                      Precio manual por caja/día
                    </Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="manualPricing"
                        checked={useManualPrice}
                        onChange={(e) => {
                          setUseManualPrice(e.target.checked);
                          if (!e.target.checked) {
                            setManualBoxPrice("");
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <label htmlFor="manualPricing" className="text-sm">
                        Activar
                      </label>
                    </div>
                  </div>
                  
                  {useManualPrice && (
                    <div>
                      <Label htmlFor="manualBoxPrice">Precio por caja por día (CLP)</Label>
                      <Input
                        id="manualBoxPrice"
                        type="text"
                        placeholder="1,000"
                        value={manualBoxPrice}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^\d]/g, '');
                          const formattedValue = value ? parseInt(value).toLocaleString('es-CL') : '';
                          setManualBoxPrice(formattedValue);
                        }}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Este precio se aplicará por cada caja por día
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="deliveryDate">Fecha de entrega</Label>
                  <Input
                    id="deliveryDate"
                    type="datetime-local"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>

                <div>
                  <Label htmlFor="deliveryAddress">Dirección de entrega</Label>
                  <Textarea
                    id="deliveryAddress"
                    placeholder="Ingresa la dirección completa..."
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Notas (opcional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Instrucciones especiales..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Summary Card with Guarantee Info */}
            {selectedBoxes.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-brand-blue" />
                    Resumen del Arriendo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span>Cajas seleccionadas:</span>
                    <span className="font-medium">{selectedBoxes.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Días de arriendo:</span>
                    <span className="font-medium">{rentalDays} días</span>
                  </div>
                  {useManualPrice && manualBoxPrice && (
                    <div className="flex justify-between text-blue-600">
                      <span>Precio manual por caja/día:</span>
                      <span className="font-medium">${parseInt(manualBoxPrice.replace(/[^\d]/g, '')).toLocaleString('es-CL')}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Total arriendo:</span>
                    <span className="font-medium">${calculateTotal().toLocaleString('es-CL')}</span>
                  </div>
                  <div className="border-t pt-3 mt-3">
                    <div className="flex justify-between text-amber-600">
                      <span>Garantía (${(2000).toLocaleString('es-CL')} por caja):</span>
                      <span className="font-bold">${(selectedBoxes.length * 2000).toLocaleString('es-CL')}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      La garantía se reembolsa cuando las cajas sean devueltas en las mismas condiciones
                    </p>
                  </div>
                  <div className="border-t pt-3 mt-3">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total a cobrar:</span>
                      <span>${(calculateTotal() + selectedBoxes.length * 2000).toLocaleString('es-CL')}</span>
                    </div>
                  </div>
                  <Button 
                    onClick={handleSubmit}
                    disabled={createRentalMutation.isPending || !selectedCustomer || selectedBoxes.length === 0 || !deliveryDate || !deliveryAddress}
                    className="w-full mt-4 bg-brand-blue hover:bg-brand-blue/90"
                  >
                    {createRentalMutation.isPending ? "Creando..." : "Crear Arriendo"}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
      
      <MobileNav role={'admin'} />
    </div>
  );
}