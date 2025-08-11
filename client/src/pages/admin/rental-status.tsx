import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Package, Calendar, Truck, CheckCircle, Clock, XCircle, Edit3, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import type { Rental, Customer } from "@shared/schema";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";

const statusConfig = {
  pendiente: { label: "Pendiente", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  pagada: { label: "Pagada", color: "bg-blue-100 text-blue-800", icon: CheckCircle },
  entregada: { label: "Entregada", color: "bg-green-100 text-green-800", icon: Truck },
  retirada: { label: "Retirada", color: "bg-purple-100 text-purple-800", icon: Package },
  finalizado: { label: "Finalizada", color: "bg-gray-100 text-gray-800", icon: CheckCircle },
  cancelada: { label: "Cancelada", color: "bg-red-100 text-red-800", icon: XCircle },
};

export default function RentalStatus() {
  const { toast } = useToast();
  const { user, isLoading } = useCurrentUser();
  const [location] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedRental, setSelectedRental] = useState<Rental | null>(null);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [editingRental, setEditingRental] = useState<Rental | null>(null);
  
  // Extract customer filter from URL params
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const customerFilter = urlParams.get('customer');

  // Redirect to home if not authenticated
  useEffect(() => {
    if (isLoading) return;
    if (!user || user.type !== 'admin') {
      window.location.href = "/";
      return;
    }
  }, [user, isLoading]);

  // Fetch rentals
  const { data: rentals, isLoading: rentalsLoading } = useQuery<Rental[]>({
    queryKey: ["/api/rentals"],
    retry: false,
    enabled: !!user,
  });

  // Fetch customers for rental details
  const { data: customers } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  // Update rental status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ rentalId, status }: { rentalId: string; status: string }) => {
      console.log('Updating rental status:', { rentalId, status });
      const response = await fetch(`/api/rentals/${rentalId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        const error = await response.text();
        console.error('Failed to update status:', error);
        throw new Error("Failed to update status");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rentals"] });
      toast({ title: "Estado actualizado exitosamente" });
      setShowStatusDialog(false);
      setSelectedRental(null);
    },
    onError: () => {
      toast({ title: "Error al actualizar estado", variant: "destructive" });
    },
  });

  const handleStatusUpdate = () => {
    if (!selectedRental || !newStatus) return;
    updateStatusMutation.mutate({ rentalId: selectedRental.id, status: newStatus });
  };

  const openStatusDialog = (rental: Rental) => {
    setSelectedRental(rental);
    setNewStatus(rental.status || "");
    setShowStatusDialog(true);
  };

  // Filter rentals
  const filteredRentals = rentals?.filter(rental => {
    const customer = customers?.find(c => c.id === rental.customerId);
    const matchesSearch = !searchQuery || 
      customer?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer?.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rental.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || rental.status === statusFilter;
    const matchesCustomer = !customerFilter || rental.customerId === customerFilter;
    
    return matchesSearch && matchesStatus && matchesCustomer;
  }) || [];

  const getCustomerName = (customerId: string) => {
    return customers?.find(c => c.id === customerId)?.name || "Cliente no encontrado";
  };

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
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
          <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Estado de Arriendos</h1>
          <p className="text-gray-600 mt-1">
            {customerFilter 
              ? `Arriendos de ${customers?.find(c => c.id === customerFilter)?.name || 'cliente seleccionado'}` 
              : 'Gestiona y actualiza el estado de todos los arriendos'
            }
          </p>
        </div>
        {customerFilter && (
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/admin/rental-status'}
          >
            Ver todos los arriendos
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Buscar por cliente, email o ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-48">
              <Label htmlFor="status">Estado</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="pagada">Pagada</SelectItem>
                  <SelectItem value="entregada">Entregada</SelectItem>
                  <SelectItem value="retirada">Retirada</SelectItem>
                  <SelectItem value="finalizado">Finalizada</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rentals Table */}
      <Card>
        <CardHeader>
          <CardTitle>Arriendos ({filteredRentals.length})</CardTitle>
          <CardDescription>Lista de todos los arriendos con su estado actual</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredRentals.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No se encontraron arriendos</h3>
              <p className="text-gray-600">Intenta ajustar los filtros de búsqueda</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Cajas</TableHead>
                  <TableHead>Fecha Inicio</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRentals.map((rental) => {
                  const statusInfo = statusConfig[rental.status as keyof typeof statusConfig];
                  const StatusIcon = statusInfo?.icon || Clock;
                  
                  return (
                    <TableRow key={rental.id}>
                      <TableCell className="font-mono text-xs">
                        {rental.id.substring(0, 8)}...
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{getCustomerName(rental.customerId)}</p>
                          <p className="text-sm text-gray-500">
                            {rental.createdAt ? new Date(rental.createdAt).toLocaleDateString() : ""}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-gray-500" />
                          <span>{rental.totalBoxes} cajas</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span>{rental.deliveryDate ? new Date(rental.deliveryDate).toLocaleDateString() : "Sin fecha"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        ${Number(rental.totalAmount).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusInfo?.color || "bg-gray-100 text-gray-800"}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusInfo?.label || rental.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex gap-1 justify-center">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openStatusDialog(rental)}
                          >
                            <Edit3 className="h-4 w-4 mr-1" />
                            Estado
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingRental(rental)
                              setShowEditDialog(true)
                            }}
                            title="Editar arriendo completo"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

          </div>
        </main>
      </div>
      
      <MobileNav role={'admin'} />

      {/* Status Update Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cambiar Estado del Arriendo</DialogTitle>
            <DialogDescription>
              Cliente: {selectedRental ? getCustomerName(selectedRental.customerId) : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="new-status">Nuevo Estado</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendiente">🟡 Pendiente (Esperando pago)</SelectItem>
                  <SelectItem value="pagada">🔵 Pagada (Lista para entrega)</SelectItem>
                  <SelectItem value="entregada">🟢 Entregada (En uso por cliente)</SelectItem>
                  <SelectItem value="retirada">🟣 Retirada (Cajas recogidas)</SelectItem>
                  <SelectItem value="finalizado">⚫ Finalizada (Proceso completo)</SelectItem>
                  <SelectItem value="cancelada">🔴 Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status Workflow Guide */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Flujo de Estados:</h4>
              <div className="text-sm text-blue-700 space-y-1">
                <p>1. <strong>Pendiente</strong> → Cliente solicita arriendo</p>
                <p>2. <strong>Pagada</strong> → Cliente paga la cotización</p>
                <p>3. <strong>Entregada</strong> → Cajas entregadas al cliente</p>
                <p>4. <strong>Retirada</strong> → Cajas recogidas del cliente</p>
                <p>5. <strong>Finalizada</strong> → Proceso completado</p>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowStatusDialog(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleStatusUpdate}
                disabled={updateStatusMutation.isPending || !newStatus}
                className="flex-1 bg-brand-blue hover:bg-brand-blue text-white"
              >
                {updateStatusMutation.isPending ? "Actualizando..." : "Actualizar Estado"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Rental Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Arriendo Completo</DialogTitle>
            <DialogDescription>
              Cliente: {editingRental ? getCustomerName(editingRental.customerId) : ""} • ID: {editingRental?.id?.substring(0, 8)}...
            </DialogDescription>
          </DialogHeader>
          {editingRental && (
            <div className="space-y-6 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Cantidad de Cajas</Label>
                  <Input 
                    type="number" 
                    value={editingRental.totalBoxes} 
                    onChange={(e) => setEditingRental({
                      ...editingRental,
                      totalBoxes: parseInt(e.target.value) || 1
                    })}
                  />
                </div>
                <div>
                  <Label>Días de Arriendo (calculado)</Label>
                  <Input 
                    type="number" 
                    value={7}
                    disabled
                    className="bg-gray-100"
                  />
                  <p className="text-xs text-gray-500 mt-1">Los días se calculan automáticamente</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Fecha de Entrega</Label>
                  <Input 
                    type="date" 
                    value={editingRental.deliveryDate ? new Date(editingRental.deliveryDate).toISOString().split('T')[0] : ''} 
                    onChange={(e) => setEditingRental({
                      ...editingRental,
                      deliveryDate: new Date(e.target.value)
                    })}
                  />
                </div>
                <div>
                  <Label>Monto Total</Label>
                  <Input 
                    type="number" 
                    value={editingRental.totalAmount ? parseInt(editingRental.totalAmount.toString()) : 0} 
                    onChange={(e) => setEditingRental({
                      ...editingRental,
                      totalAmount: e.target.value
                    })}
                  />
                </div>
              </div>

              <div>
                <Label>Dirección de Entrega</Label>
                <Input 
                  value={editingRental.deliveryAddress || ''} 
                  onChange={(e) => setEditingRental({
                    ...editingRental,
                    deliveryAddress: e.target.value || null
                  })}
                />
              </div>

              <div>
                <Label>Dirección de Retiro</Label>
                <Input 
                  value={editingRental.pickupAddress || ''} 
                  onChange={(e) => setEditingRental({
                    ...editingRental,
                    pickupAddress: e.target.value
                  })}
                />
              </div>

              <div>
                <Label>Notas</Label>
                <Input 
                  value={editingRental.notes || ''} 
                  onChange={(e) => setEditingRental({
                    ...editingRental,
                    notes: e.target.value
                  })}
                />
              </div>

              <div>
                <Label>Estado</Label>
                <Select 
                  value={editingRental.status || 'pendiente'} 
                  onValueChange={(value) => setEditingRental({
                    ...editingRental,
                    status: value as any
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendiente">Pendiente</SelectItem>
                    <SelectItem value="pagada">Pagada</SelectItem>
                    <SelectItem value="entregada">Entregada</SelectItem>
                    <SelectItem value="retirada">Retirada</SelectItem>
                    <SelectItem value="finalizado">Finalizada</SelectItem>
                    <SelectItem value="cancelada">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowEditDialog(false)
                    setEditingRental(null)
                  }}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() => {
                    // TODO: Implement rental update mutation
                    toast({ title: "Funcionalidad en desarrollo", description: "La edición completa estará disponible pronto" })
                    setShowEditDialog(false)
                  }}
                  className="flex-1 bg-brand-blue hover:bg-blue-700 text-white"
                >
                  Actualizar Arriendo
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}