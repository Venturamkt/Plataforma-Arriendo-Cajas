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

// Función para formatear RUT automáticamente
function formatRut(rut: string): string {
  // Remove all non-numeric characters
  const cleanRut = rut.replace(/\D/g, '');
  
  if (cleanRut.length <= 1) return cleanRut;
  
  // Only format complete RUTs (8-9 digits)
  if (cleanRut.length < 8) return cleanRut;
  
  // Separate the main number from the check digit
  const mainNumber = cleanRut.slice(0, -1);
  const checkDigit = cleanRut.slice(-1);
  
  // Format the main number with dots
  let formatted = mainNumber.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  
  // Add the check digit with hyphen
  formatted += `-${checkDigit}`;
  
  return formatted;
}

// Función para formatear RUT en visualización (siempre con formato)
function displayFormattedRut(rut: string): string {
  if (!rut) return '';
  
  const cleanRut = rut.replace(/\D/g, '');
  if (cleanRut.length < 8) return rut; // Return as-is if too short
  
  const mainNumber = cleanRut.slice(0, -1);
  const checkDigit = cleanRut.slice(-1);
  
  const formatted = mainNumber.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${formatted}-${checkDigit}`;
}

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
  const [editingRental, setEditingRental] = useState<any | null>(null);
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    email: "",
    phone: "",
    rut: ""
  });
  const [formattedRut, setFormattedRut] = useState("");
  const [includeRental, setIncludeRental] = useState(false);
  const [showDriverDialog, setShowDriverDialog] = useState(false);
  const [selectedRental, setSelectedRental] = useState<any>(null);
  // Precios basados en tu tabla
  const getPriceByPeriod = (boxes: number, days: number) => {
    const priceTable: Record<number, Record<number, number>> = {
      7: {
        2: 2775,
        5: 6938,
        10: 13876,
        15: 20815
      },
      14: {
        2: 5551,
        5: 13876,
        10: 27753,
        15: 41629
      },
      30: {
        2: 11894,
        5: 29735,
        10: 59470,
        15: 89205
      }
    };
    
    // Si hay precio exacto, usarlo
    if (priceTable[days] && priceTable[days][boxes]) {
      return priceTable[days][boxes];
    }
    
    // Calcular precio proporcional basado en 7 días
    const basePrice7Days = priceTable[7];
    let baseBoxPrice = 0;
    
    if (boxes <= 2) baseBoxPrice = basePrice7Days[2] / 2;
    else if (boxes <= 5) baseBoxPrice = basePrice7Days[5] / 5;
    else if (boxes <= 10) baseBoxPrice = basePrice7Days[10] / 10;
    else baseBoxPrice = basePrice7Days[15] / 15;
    
    return Math.round(baseBoxPrice * boxes * (days / 7));
  };

  const getProductPriceByPeriod = (productName: string, days: number) => {
    const productPrices: Record<number, Record<string, number>> = {
      7: {
        "Carro plegable": 4165,
        "Base Móvil": 2083,
        "Kit 2 Bases móviles": 3124,
        "Correa Ratchet": 1041
      },
      14: {
        "Carro plegable": 8330,
        "Base Móvil": 4165,
        "Kit 2 Bases móviles": 6248,
        "Correa Ratchet": 2083
      },
      30: {
        "Carro plegable": 17850,
        "Base Móvil": 8925,
        "Kit 2 Bases móviles": 13388,
        "Correa Ratchet": 4463
      }
    };
    
    if (productPrices[days] && productPrices[days][productName]) {
      return productPrices[days][productName];
    }
    
    // Precio proporcional basado en 7 días
    const basePrice = productPrices[7][productName] || 0;
    return Math.round(basePrice * (days / 7));
  };

  const [newRental, setNewRental] = useState({
    boxQuantity: 2,
    rentalDays: 7,
    deliveryDate: "",
    deliveryAddress: "",
    pickupAddress: "",
    notes: "",
    boxSize: "mediano",
    customPrice: 2775, // Precio por defecto para 2 cajas por 7 días
    discount: 0,
    additionalProducts: [] as Array<{name: string, price: number, quantity: number}>
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
    refetchOnMount: true,
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

  const { data: drivers } = useQuery<any[]>({
    queryKey: ["/api/users"],
    retry: false,
    enabled: !!user,
  });

  const createCustomerMutation = useMutation({
    mutationFn: async (customerData: InsertCustomer) => {
      const response = await apiRequest("POST", "/api/customers", customerData);
      return await response.json();
    },
    onSuccess: (customer) => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      
      if (includeRental) {
        // Si se marcó incluir arriendo, abrir el diálogo de crear arriendo inmediatamente
        setSelectedCustomerForRental(customer);
        setShowRentalDialog(true);
        setShowNewCustomerDialog(false);
      } else {
        setShowNewCustomerDialog(false);
      }
      
      setNewCustomer({ name: "", email: "", phone: "", rut: "" });
      setFormattedRut("");
      setIncludeRental(false);
      toast({
        title: "Cliente creado",
        description: includeRental ? "Cliente creado. Ahora complete los datos del arriendo." : "El cliente ha sido creado exitosamente",
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

  const assignDriverMutation = useMutation({
    mutationFn: async ({ rentalId, driverId }: { rentalId: string; driverId: string }) => {
      const response = await apiRequest("PUT", `/api/rentals/${rentalId}/assign-driver`, { driverId });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rentals"] });
      setShowDriverDialog(false);
      setSelectedRental(null);
      toast({
        title: "Repartidor asignado",
        description: "El repartidor ha sido asignado exitosamente",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo asignar el repartidor",
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
      setNewCustomer({ name: "", email: "", phone: "", rut: "" });
      setFormattedRut("");
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

  const deleteCustomerMutation = useMutation({
    mutationFn: async (customerId: string) => {
      const response = await apiRequest("DELETE", `/api/customers/${customerId}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/rentals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      toast({
        title: "Cliente eliminado",
        description: "El cliente ha sido eliminado exitosamente",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar el cliente",
        variant: "destructive",
      });
    },
  });

  const updateRentalStatusMutation = useMutation({
    mutationFn: async ({ rentalId, status }: { rentalId: string; status: string }) => {
      const response = await apiRequest("PUT", `/api/rentals/${rentalId}`, { status });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rentals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/boxes"] });
      toast({
        title: "Estado actualizado",
        description: "El estado del arriendo ha sido actualizado",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado",
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
    setEditingRental(null); // Clear editing state for new rental
    setNewRental({
      boxSize: "mediano",
      boxQuantity: 2,
      rentalDays: 7,
      deliveryDate: "",
      deliveryAddress: customer.address || "",
      pickupAddress: customer.address || "",
      notes: "",
      customPrice: 2775,
      discount: 0,
      additionalProducts: []
    });
    setAvailabilityCheck(null);
    setShowRentalDialog(true);
  };

  const handleEditRental = (rental: any, customer: Customer) => {
    setSelectedCustomerForRental(customer);
    setEditingRental(rental);
    
    // Parse additional products if they exist
    let additionalProducts = [];
    try {
      additionalProducts = rental.additionalProducts ? JSON.parse(rental.additionalProducts) : [];
    } catch (e) {
      additionalProducts = [];
    }

    // Calculate rental days from delivery and return dates
    const deliveryDate = new Date(rental.deliveryDate);
    const returnDate = new Date(rental.returnDate);
    const diffTime = Math.abs(returnDate.getTime() - deliveryDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Populate form with existing rental data
    setNewRental({
      boxSize: "mediano",
      boxQuantity: rental.totalBoxes,
      rentalDays: diffDays,
      deliveryDate: rental.deliveryDate ? new Date(rental.deliveryDate).toISOString().split('T')[0] : "",
      deliveryAddress: rental.deliveryAddress || "",
      pickupAddress: rental.pickupAddress || "",
      notes: rental.notes || "",
      customPrice: parseFloat(rental.dailyRate) || 2775,
      discount: 0,
      additionalProducts: additionalProducts
    });
    
    setShowRentalDialog(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    const rutValue = customer.rut || "";
    setNewCustomer({
      name: customer.name,
      email: customer.email,
      phone: customer.phone || "",
      rut: rutValue
    });
    setFormattedRut(formatRut(rutValue));
    setShowEditDialog(true);
  };

  const handleRutChange = (value: string) => {
    const cleanValue = value.replace(/\D/g, '');
    if (cleanValue.length <= 9) {
      setNewCustomer({ ...newCustomer, rut: cleanValue });
      setFormattedRut(formatRut(cleanValue));
    }
  };

  const handleDeleteCustomer = (customer: any) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar al cliente ${customer.name}? Esta acción no se puede deshacer y eliminará también todos sus arriendos.`)) {
      deleteCustomerMutation.mutate(customer.id);
    }
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

    // Get available boxes by size (map frontend size names to database values)
    const sizeMapping = {
      'standard': 'medium',
      'mediano': 'medium', 
      'pequeño': 'small',
      'grande': 'large'
    };
    const dbSize = sizeMapping[newRental.boxSize as keyof typeof sizeMapping] || newRental.boxSize;
    const boxesBySize = boxes.filter(box => box.size === dbSize && box.status === 'available');
    
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
      const endpoint = editingRental ? `/api/rentals/${editingRental.id}` : "/api/rentals";
      const method = editingRental ? "PUT" : "POST";
      const response = await apiRequest(method, endpoint, rentalData);
      return await response.json();
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/rentals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      setShowRentalDialog(false);
      setEditingRental(null);
      setNewRental({
        boxQuantity: 2,
        rentalDays: 7,
        deliveryDate: "",
        deliveryAddress: "",
        pickupAddress: "",
        notes: "",
        boxSize: "mediano",
        customPrice: 2775,
        discount: 0,
        additionalProducts: []
      });
      
      if (editingRental) {
        // For updates, show simple success message
        toast({
          title: "✅ Arriendo actualizado",
          description: "Los cambios han sido guardados exitosamente",
        });
      } else {
        // For new rentals, show tracking code to admin
        const customer = selectedCustomerForRental;
        const rutDigits = customer?.rut ? customer.rut.slice(0, -1).slice(-4).padStart(4, '0') : "0000";
        const trackingUrl = `${window.location.origin}/track`;
        
        toast({
          title: "✅ Arriendo creado exitosamente",
          description: (
            <div className="space-y-2 text-sm">
              <p><strong>Código de seguimiento:</strong> {result.trackingCode}</p>
              <p><strong>RUT (últimos 4 dígitos):</strong> {rutDigits}</p>
              <p><strong>Enlace:</strong> <a href={trackingUrl} target="_blank" className="text-blue-600 underline">{trackingUrl}</a></p>
            </div>
          ),
        });
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: editingRental 
          ? "No se pudo actualizar el arriendo" 
          : "No se pudo crear el arriendo",
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

    const guaranteeAmount = newRental.boxQuantity * 2000; // $2,000 por caja
    const additionalTotal = newRental.additionalProducts.reduce((sum, product) => 
      sum + (product.price * product.quantity), 0);
    const rentalTotal = (newRental.customPrice || 2775) * (1 - (newRental.discount || 0) / 100);
    
    const requestData = {
      customerId: selectedCustomerForRental.id,
      totalBoxes: newRental.boxQuantity,
      dailyRate: (newRental.customPrice || 2775).toString(),
      totalAmount: (rentalTotal + additionalTotal).toString(),
      guaranteeAmount: guaranteeAmount.toString(),
      additionalProducts: JSON.stringify(newRental.additionalProducts),
      additionalProductsTotal: additionalTotal.toString(),
      deliveryDate: deliveryDate.toISOString(),
      returnDate: returnDate.toISOString(),
      deliveryAddress: newRental.deliveryAddress,
      pickupAddress: newRental.pickupAddress || newRental.deliveryAddress,
      notes: newRental.notes || "",
      status: "pendiente"
    };
    
    console.log("Frontend sending:", JSON.stringify(requestData, null, 2));
    
    createRentalMutation.mutate(requestData);

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

  const getCustomerActiveRentals = (customerId: string) => {
    if (!rentals) return [];
    return rentals.filter((rental: any) => 
      rental.customerId === customerId && 
      !['finalizado', 'cancelada'].includes(rental.status)
    );
  };

  const handleStatusChange = (rentalId: string, newStatus: string) => {
    updateRentalStatusMutation.mutate({ rentalId, status: newStatus });
  };

  const handleAssignDriver = (rental: any) => {
    setSelectedRental(rental);
    setShowDriverDialog(true);
  };

  const handleDriverAssignment = (driverId: string) => {
    if (selectedRental) {
      assignDriverMutation.mutate({ rentalId: selectedRental.id, driverId });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendiente': return 'bg-yellow-100 text-yellow-800';
      case 'pagada': return 'bg-blue-100 text-blue-800';
      case 'entregada': return 'bg-green-100 text-green-800';
      case 'retirada': return 'bg-purple-100 text-purple-800';
      case 'finalizado': return 'bg-gray-100 text-gray-800';
      case 'cancelada': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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
            <CardHeader className="p-4 md:p-6">
              <div className="flex flex-col gap-4">
                {/* Search Bar - Full width on mobile */}
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por nombre, email o teléfono..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-full"
                  />
                </div>
                
                {/* Actions Row */}
                <div className="flex flex-col sm:flex-row gap-3 justify-between">
                  {/* View Mode Toggle */}
                  <div className="flex items-center gap-2 w-fit">
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
                  
                  {/* Add Customer Button */}
                  <Dialog open={showNewCustomerDialog} onOpenChange={(open) => {
                    setShowNewCustomerDialog(open);
                    if (open) {
                      setNewCustomer({ name: "", email: "", phone: "", rut: "" });
                      setFormattedRut("");
                      setIncludeRental(false);
                    }
                  }}>
                    <DialogTrigger asChild>
                      <Button className="bg-brand-red hover:bg-brand-red text-white flex items-center gap-2 w-full sm:w-auto">
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
                          value={formattedRut}
                          onChange={(e) => handleRutChange(e.target.value)}
                          placeholder="12.345.678-9"
                          autoComplete="off"
                          maxLength={12}
                        />
                      </div>

                      
                      {/* Opción para crear arriendo inmediatamente */}
                      <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <input
                          type="checkbox"
                          id="includeRental"
                          checked={includeRental}
                          onChange={(e) => setIncludeRental(e.target.checked)}
                          className="rounded border-blue-300"
                        />
                        <Label htmlFor="includeRental" className="text-sm font-medium text-blue-800">
                          Crear arriendo inmediatamente después del cliente
                        </Label>
                      </div>
                      
                      <div className="flex gap-2 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setShowNewCustomerDialog(false);
                            setNewCustomer({ name: "", email: "", phone: "", rut: "" });
                            setFormattedRut("");
                            setIncludeRental(false);
                          }}
                          className="flex-1"
                        >
                          Cancelar
                        </Button>
                        <Button
                          type="submit"
                          disabled={createCustomerMutation.isPending}
                          className="flex-1 bg-brand-red hover:bg-brand-red text-white"
                        >
                          {createCustomerMutation.isPending ? "Creando..." : (includeRental ? "Crear Cliente + Arriendo" : "Crear Cliente")}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Rental Creation Dialog */}
          <Dialog open={showRentalDialog} onOpenChange={setShowRentalDialog}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingRental ? "Modificar Arriendo" : "Crear Nuevo Arriendo"}
                </DialogTitle>
                <DialogDescription>
                  Cliente: {selectedCustomerForRental?.name}
                  {editingRental && (
                    <span className="block text-sm text-blue-600 mt-1">
                      Código: {editingRental.trackingCode}
                    </span>
                  )}
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
                      <Label htmlFor="boxQuantity">Cantidad de Cajas</Label>
                      <Input
                        id="boxQuantity"
                        type="number"
                        min="1"
                        max="50"
                        value={newRental.boxQuantity}
                        onChange={(e) => {
                          const newQuantity = parseInt(e.target.value) || 1;
                          const newPrice = getPriceByPeriod(newQuantity, newRental.rentalDays);
                          setNewRental({ 
                            ...newRental, 
                            boxQuantity: newQuantity,
                            customPrice: newPrice
                          });
                        }}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="rentalDays">Días de Arriendo</Label>
                      <select
                        id="rentalDays"
                        value={newRental.rentalDays}
                        onChange={(e) => {
                          const newDays = parseInt(e.target.value);
                          const newPrice = getPriceByPeriod(newRental.boxQuantity, newDays);
                          // Actualizar precios de productos adicionales también
                          const updatedProducts = newRental.additionalProducts.map(product => ({
                            ...product,
                            price: getProductPriceByPeriod(product.name, newDays)
                          }));
                          setNewRental({ 
                            ...newRental, 
                            rentalDays: newDays,
                            customPrice: newPrice,
                            additionalProducts: updatedProducts
                          });
                        }}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        required
                      >
                        <option value={7}>7 días</option>
                        <option value={14}>14 días</option>
                        <option value={30}>30 días</option>
                      </select>
                    </div>
                    
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
                      <Label htmlFor="customPrice" className="text-sm font-medium">Precio Total del Arriendo (CLP) *</Label>
                      <Input
                        id="customPrice"
                        type="text"
                        value={newRental.customPrice}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9]/g, '');
                          setNewRental({ ...newRental, customPrice: parseInt(value) || 0 });
                        }}
                        placeholder="2775"
                        className="font-medium text-lg h-12 text-center"
                      />
                      <p className="text-xs text-gray-600 mt-1">
                        Precio total según tabla: {newRental.boxQuantity} cajas × {newRental.rentalDays} días
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="discount">Descuento (%)</Label>
                      <Input
                        id="discount"
                        type="number"
                        min="0"
                        max="100"
                        value={newRental.discount}
                        onChange={(e) => setNewRental({ ...newRental, discount: parseInt(e.target.value) || 0 })}
                        placeholder="0"
                      />
                    </div>
                  </div>

                  {/* Additional Products Section */}
                  <div className="space-y-4">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Productos Adicionales
                    </h4>
                    
                    {/* Quick Add Buttons */}
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600 mb-2">Productos disponibles (clic para agregar):</p>
                        <div className="flex flex-wrap gap-2">
                          {[
                            "Carro plegable",
                            "Base Móvil", 
                            "Kit 2 Bases móviles",
                            "Correa Ratchet"
                          ].map((productName) => (
                            <Button
                              key={productName}
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const productPrice = getProductPriceByPeriod(productName, newRental.rentalDays);
                                const existing = newRental.additionalProducts.find(p => p.name === productName);
                                if (existing) {
                                  // Increase quantity if already exists
                                  const updated = newRental.additionalProducts.map(p => 
                                    p.name === productName ? { ...p, quantity: p.quantity + 1 } : p
                                  );
                                  setNewRental({ ...newRental, additionalProducts: updated });
                                } else {
                                  // Add new product
                                  setNewRental({
                                    ...newRental,
                                    additionalProducts: [...newRental.additionalProducts, { 
                                      name: productName, 
                                      price: productPrice, 
                                      quantity: 1 
                                    }]
                                  });
                                }
                              }}
                              className="text-xs hover:bg-blue-50 hover:text-blue-700"
                            >
                              + {productName}
                            </Button>
                          ))}
                        </div>
                      </div>
                      
                      {newRental.additionalProducts.map((product, index) => (
                        <div key={index} className="grid grid-cols-12 gap-3 mb-3 items-end">
                          <div className="col-span-5">
                            <Label className="text-sm font-medium">Producto</Label>
                            <Input
                              placeholder="Ej: Candados, Etiquetas, etc."
                              value={product.name}
                              onChange={(e) => {
                                const updated = [...newRental.additionalProducts];
                                updated[index].name = e.target.value;
                                setNewRental({ ...newRental, additionalProducts: updated });
                              }}
                              className="w-full"
                            />
                          </div>
                          <div className="col-span-2">
                            <Label className="text-sm font-medium">Cant.</Label>
                            <Input
                              type="number"
                              min="1"
                              value={product.quantity}
                              onChange={(e) => {
                                const updated = [...newRental.additionalProducts];
                                updated[index].quantity = parseInt(e.target.value) || 1;
                                setNewRental({ ...newRental, additionalProducts: updated });
                              }}
                              className="w-full"
                            />
                          </div>
                          <div className="col-span-4">
                            <Label className="text-sm font-medium">Precio c/u</Label>
                            <Input
                              type="number"
                              min="0"
                              step="1"
                              value={product.price}
                              onChange={(e) => {
                                const updated = [...newRental.additionalProducts];
                                updated[index].price = parseInt(e.target.value) || 0;
                                setNewRental({ ...newRental, additionalProducts: updated });
                              }}
                              className="w-full font-medium"
                              placeholder="0"
                            />
                          </div>
                          <div className="col-span-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const updated = newRental.additionalProducts.filter((_, i) => i !== index);
                                setNewRental({ ...newRental, additionalProducts: updated });
                              }}
                              className="text-red-600 hover:text-red-700 w-full"
                            >
                              ✕
                            </Button>
                          </div>
                        </div>
                      ))}
                      
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setNewRental({
                            ...newRental,
                            additionalProducts: [...newRental.additionalProducts, { name: "", price: 0, quantity: 1 }]
                          });
                        }}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        + Producto Personalizado
                      </Button>
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
                    <h4 className="font-semibold mb-3">Resumen de Precio</h4>
                    <div className="text-sm space-y-2">
                      {/* Rental calculation */}
                      <div className="border-b pb-2">
                        <p className="font-medium text-blue-800">Arriendo de Cajas:</p>
                        <p>{newRental.boxQuantity} cajas por {newRental.rentalDays} días = ${(newRental.customPrice || 2775).toLocaleString()}</p>
                        {newRental.discount > 0 && (
                          <>
                            <p className="text-orange-600">Descuento aplicado: {newRental.discount}%</p>
                            <p className="line-through text-gray-500">Subtotal: ${(newRental.customPrice || 2775).toLocaleString()}</p>
                          </>
                        )}
                        <p className="font-medium">Subtotal Arriendo: ${Math.round((newRental.customPrice || 2775) * (1 - (newRental.discount || 0) / 100)).toLocaleString()}</p>
                      </div>

                      {/* Additional products */}
                      {newRental.additionalProducts.length > 0 && (
                        <div className="border-b pb-2">
                          <p className="font-medium text-green-800">Productos Adicionales:</p>
                          {newRental.additionalProducts.map((product, index) => (
                            <p key={index} className="text-xs">
                              {product.name}: {product.quantity} × ${product.price.toLocaleString()} = ${(product.quantity * product.price).toLocaleString()}
                            </p>
                          ))}
                          <p className="font-medium">Subtotal Productos: ${newRental.additionalProducts.reduce((sum, p) => sum + (p.price * p.quantity), 0).toLocaleString()}</p>
                        </div>
                      )}

                      {/* Guarantee */}
                      <div className="border-b pb-2">
                        <p className="font-medium text-purple-800">Garantía:</p>
                        <p>{newRental.boxQuantity} cajas × $2.000 = ${(newRental.boxQuantity * 2000).toLocaleString()}</p>
                        <p className="text-xs text-gray-600">*Se devuelve al finalizar el arriendo</p>
                      </div>

                      {/* Total */}
                      <div className="pt-2">
                        <p className="font-bold text-lg text-blue-900">
                          Total a Pagar: ${(
                            Math.round((newRental.customPrice || 2775) * (1 - (newRental.discount || 0) / 100)) +
                            newRental.additionalProducts.reduce((sum, p) => sum + (p.price * p.quantity), 0) +
                            (newRental.boxQuantity * 2000)
                          ).toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-600">
                          (Incluye ${(newRental.boxQuantity * 2000).toLocaleString()} de garantía)
                        </p>
                      </div>
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
                    {createRentalMutation.isPending 
                      ? (editingRental ? "Actualizando..." : "Creando...") 
                      : (editingRental ? "Actualizar Arriendo" : "Crear Arriendo")}
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
                  <div className="overflow-x-auto">
                    <TableComponent>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-32 sm:w-48">Cliente</TableHead>
                          <TableHead className="w-32 hidden md:table-cell">Contacto</TableHead>
                          <TableHead className="w-24 hidden lg:table-cell">Dirección</TableHead>
                          <TableHead className="text-center w-16 sm:w-20">Activos</TableHead>
                          <TableHead className="text-center w-16 sm:w-20">Total</TableHead>
                          <TableHead className="text-center w-24 sm:w-36">Estado</TableHead>
                          <TableHead className="text-center w-32 hidden xl:table-cell">Seguimiento</TableHead>
                          <TableHead className="text-center w-32 sm:w-48">Acciones</TableHead>
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
                                  <p className="text-sm text-gray-600">{displayFormattedRut(customer.rut || '')}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <div className="space-y-1">
                                <p className="text-sm">{customer.email}</p>
                                {customer.phone && (
                                  <p className="text-sm text-gray-600">{customer.phone}</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">
                              <p className="text-sm">{customer.address || "No especificada"}</p>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="text-sm font-bold text-brand-blue">{stats.active}</span>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="text-sm font-bold">{stats.total}</span>
                            </TableCell>
                            <TableCell className="text-center">
                              {(() => {
                                const activeRentals = getCustomerActiveRentals(customer.id);
                                if (activeRentals.length === 0) {
                                  return <Badge variant="outline">Sin arriendos activos</Badge>;
                                }
                                
                                // Show the most recent active rental
                                const mostRecentRental = activeRentals[0];
                                
                                return (
                                  <div className="space-y-1">
                                    <Select
                                      value={mostRecentRental.status}
                                      onValueChange={(newStatus) => handleStatusChange(mostRecentRental.id, newStatus)}
                                      disabled={updateRentalStatusMutation.isPending}
                                    >
                                      <SelectTrigger className="w-32 h-8 text-xs">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="pendiente">🟡 Pendiente</SelectItem>
                                        <SelectItem value="pagada">🔵 Pagada</SelectItem>
                                        <SelectItem value="entregada">🟢 Entregada</SelectItem>
                                        <SelectItem value="retirada">🟣 Retirada</SelectItem>
                                        <SelectItem value="finalizado">⚫ Finalizada</SelectItem>
                                        <SelectItem value="cancelada">🔴 Cancelada</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    {activeRentals.length > 1 && (
                                      <div className="text-xs text-gray-500">+{activeRentals.length - 1} más</div>
                                    )}
                                    
                                    {/* Show driver assignment for non-pending rentals */}
                                    {mostRecentRental.status !== 'pendiente' && (
                                      <div className="text-xs text-gray-600 mt-1">
                                        <div className="flex items-center gap-1">
                                          🚛
                                          {mostRecentRental.assignedDriver ? (
                                            <div className="flex items-center gap-1">
                                              <span className="text-green-600 font-medium">{mostRecentRental.driverName || mostRecentRental.assignedDriver}</span>
                                              <Button 
                                                size="sm" 
                                                variant="outline" 
                                                className="text-xs px-1 py-0 h-auto ml-1"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleAssignDriver(mostRecentRental);
                                                }}
                                              >
                                                Cambiar
                                              </Button>
                                            </div>
                                          ) : (
                                            <Button 
                                              size="sm" 
                                              variant="outline" 
                                              className="text-xs px-2 py-1 h-auto bg-orange-50 hover:bg-orange-100 text-orange-600 border-orange-200"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleAssignDriver(mostRecentRental);
                                              }}
                                            >
                                              Asignar
                                            </Button>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}
                            </TableCell>
                            <TableCell className="text-center hidden xl:table-cell">
                              {(() => {
                                const activeRentals = getCustomerActiveRentals(customer.id);
                                if (activeRentals.length === 0) {
                                  return <span className="text-gray-400">-</span>;
                                }
                                
                                // Show tracking info for the most recent active rental
                                const mostRecentRental = activeRentals[0];
                                const rutDigits = customer.rut ? customer.rut.slice(0, -1).slice(-4).padStart(4, '0') : "0000";
                                const trackingUrl = `${window.location.origin}/track/${rutDigits}/${mostRecentRental.trackingCode}`;
                                
                                return (
                                  <div className="bg-blue-50 p-2 rounded border text-left text-xs space-y-1">
                                    <div className="flex flex-col gap-1">
                                      <div>
                                        <span className="text-gray-600">Código:</span>
                                        <span className="font-mono text-blue-800 font-semibold ml-1">
                                          {mostRecentRental.trackingCode}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-gray-600">RUT:</span>
                                        <span className="font-mono text-gray-800 ml-1">{rutDigits}</span>
                                      </div>
                                    </div>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigator.clipboard.writeText(trackingUrl);
                                        // Simple feedback
                                        const btn = e.target as HTMLButtonElement;
                                        const originalText = btn.textContent;
                                        btn.textContent = "¡Copiado!";
                                        setTimeout(() => {
                                          btn.textContent = originalText;
                                        }, 1500);
                                      }}
                                      className="w-full bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs font-medium transition-colors"
                                    >
                                      Copiar Link
                                    </button>
                                  </div>
                                );
                              })()}
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex flex-col xl:flex-row gap-1 xl:gap-2">
                                {(() => {
                                  const activeRentals = getCustomerActiveRentals(customer.id);
                                  
                                  if (activeRentals.length === 0) {
                                    // Customer has no active rentals - show "New Rental" button
                                    return (
                                      <Button 
                                        size="sm" 
                                        className="bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1"
                                        onClick={() => handleCreateRental(customer)}
                                      >
                                        + Nuevo
                                      </Button>
                                    );
                                  } else {
                                    // Customer has active rentals - show "Modify Rental" button
                                    const mostRecentRental = activeRentals[0];
                                    return (
                                      <Button 
                                        size="sm" 
                                        className="bg-orange-600 hover:bg-orange-700 text-white text-xs px-2 py-1"
                                        onClick={() => handleEditRental(mostRecentRental, customer)}
                                      >
                                        Modificar
                                      </Button>
                                    );
                                  }
                                })()}
                                
                                {/* Show tracking info in actions for small screens */}
                                <div className="xl:hidden">
                                  {(() => {
                                    const activeRentals = getCustomerActiveRentals(customer.id);
                                    if (activeRentals.length > 0) {
                                      const mostRecentRental = activeRentals[0];
                                      const rutDigits = customer.rut ? customer.rut.slice(0, -1).slice(-4).padStart(4, '0') : "0000";
                                      const trackingUrl = `${window.location.origin}/track/${rutDigits}/${mostRecentRental.trackingCode}`;
                                      
                                      return (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            navigator.clipboard.writeText(trackingUrl);
                                            // Simple feedback
                                            const btn = e.target as HTMLButtonElement;
                                            const originalText = btn.textContent;
                                            btn.textContent = "¡Copiado!";
                                            setTimeout(() => {
                                              btn.textContent = originalText;
                                            }, 1500);
                                          }}
                                          className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs font-medium transition-colors"
                                        >
                                          📋 Link
                                        </button>
                                      );
                                    }
                                    return null;
                                  })()}
                                </div>

                                <Button 
                                  size="sm" 
                                  className="bg-gray-500 hover:bg-gray-600 text-white text-xs px-2 py-1"
                                  onClick={() => handleEditCustomer(customer)}
                                >
                                  Editar
                                </Button>
                                
                                <Button 
                                  size="sm" 
                                  className="bg-red-500 hover:bg-red-600 text-white text-xs px-2 py-1"
                                  onClick={() => handleDeleteCustomer(customer)}
                                  disabled={deleteCustomerMutation.isPending}
                                >
                                  {deleteCustomerMutation.isPending ? "..." : "🗑️"}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                    </TableComponent>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
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
                          
                          {/* Show driver assignment in card view for active rentals */}
                          {stats.active > 0 && (() => {
                            const activeRentals = getCustomerActiveRentals(customer.id);
                            if (activeRentals.length > 0) {
                              const mostRecentRental = activeRentals[0];
                              if (mostRecentRental.status !== 'pendiente') {
                                return (
                                  <div className="mt-2">
                                    <p className="text-xs text-gray-600 mb-1">Repartidor:</p>
                                    <div className="flex items-center gap-1">
                                      🚛
                                      {mostRecentRental.assignedDriver ? (
                                        <div className="flex items-center gap-2">
                                          <span className="text-sm text-green-600 font-medium">{mostRecentRental.driverName || mostRecentRental.assignedDriver}</span>
                                          <Button 
                                            size="sm" 
                                            variant="outline" 
                                            className="text-xs px-2 py-1 h-auto"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleAssignDriver(mostRecentRental);
                                            }}
                                          >
                                            Cambiar
                                          </Button>
                                        </div>
                                      ) : (
                                        <Button 
                                          size="sm" 
                                          variant="outline" 
                                          className="text-xs px-2 py-1 h-auto bg-orange-50 hover:bg-orange-100 text-orange-600 border-orange-200"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleAssignDriver(mostRecentRental);
                                          }}
                                        >
                                          Asignar
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                );
                              }
                            }
                            return null;
                          })()}
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
                    value={formattedRut}
                    onChange={(e) => handleRutChange(e.target.value)}
                    placeholder="12.345.678-9"
                    autoComplete="off"
                    maxLength={12}
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
      
      {/* Driver Assignment Dialog */}
      <Dialog open={showDriverDialog} onOpenChange={setShowDriverDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Asignar Repartidor</DialogTitle>
            <DialogDescription>
              Selecciona un repartidor para el arriendo {selectedRental?.id}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {drivers?.filter(user => user.role === 'driver').map((driver) => (
              <div key={driver.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                <div>
                  <p className="font-medium">{driver.firstName} {driver.lastName}</p>
                  <p className="text-sm text-gray-600">{driver.email}</p>
                </div>
                <Button
                  onClick={() => handleDriverAssignment(driver.id)}
                  disabled={assignDriverMutation.isPending}
                  className="bg-brand-red hover:bg-brand-red text-white"
                >
                  {assignDriverMutation.isPending ? "Asignando..." : "Asignar"}
                </Button>
              </div>
            ))}
            
            {drivers?.filter(user => user.role === 'driver').length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-600">No hay repartidores disponibles</p>
                <p className="text-sm text-gray-500 mt-2">
                  Agrega usuarios con rol de repartidor para poder asignar entregas
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
