import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, Plus, Truck, Clock, MapPin, CheckCircle, XCircle, Calendar } from "lucide-react";

export default function AdminDeliveries() {
  const { toast } = useToast();
  const { user, isLoading } = useCurrentUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  // Redirect to home if not authenticated
  useEffect(() => {
    if (isLoading) return;
    if (!user || user.type !== 'admin') {
      window.location.href = "/";
      return;
    }
  }, [user, isLoading]);

  const { data: deliveryTasks, isLoading: tasksLoading } = useQuery({
    queryKey: ["/api/delivery-tasks"],
    retry: false,
    enabled: !!user,
  });

  const { data: rentals } = useQuery({
    queryKey: ["/api/rentals"],
    retry: false,
    enabled: !!user,
  });

  const { data: customers } = useQuery({
    queryKey: ["/api/customers"],
    retry: false,
    enabled: !!user,
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, data }: { taskId: string; data: any }) => {
      await apiRequest("PUT", `/api/delivery-tasks/${taskId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/delivery-tasks"] });
      toast({
        title: "Tarea actualizada",
        description: "El estado de la tarea ha sido actualizado exitosamente",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: "No se pudo actualizar la tarea",
        variant: "destructive",
      });
    },
  });

  // Helper functions
  const getRentalInfo = (rentalId: string) => {
    return rentals?.find((rental: any) => rental.id === rentalId);
  };

  const getCustomerInfo = (customerId: string) => {
    return customers?.find((customer: any) => customer.id === customerId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "assigned":
        return "bg-yellow-100 text-yellow-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "assigned":
        return "Asignada";
      case "in_progress":
        return "En Progreso";
      case "completed":
        return "Completada";
      case "failed":
        return "Fallida";
      default:
        return status;
    }
  };

  const getTypeLabel = (type: string) => {
    return type === "delivery" ? "Entrega" : "Retiro";
  };

  const filteredTasks = deliveryTasks?.filter((task: any) => {
    const rental = getRentalInfo(task.rentalId);
    const customer = rental ? getCustomerInfo(rental.customerId) : null;
    
    const matchesSearch = searchQuery === "" || 
      customer?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rental?.deliveryAddress?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || task.status === statusFilter;
    const matchesType = typeFilter === "all" || task.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  }) || [];

  const handleStatusUpdate = (taskId: string, newStatus: string) => {
    const updateData: any = { status: newStatus };
    if (newStatus === "completed") {
      updateData.completedAt = new Date().toISOString();
    }
    updateTaskMutation.mutate({ taskId, data: updateData });
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
        <Sidebar role={user.role || 'admin'} />
        
        <main className="flex-1 p-4 lg:p-8 pb-20 lg:pb-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
              Gestión de Entregas
            </h1>
            <p className="text-gray-600">
              Control de tareas de entrega y retiro de cajas
            </p>
          </div>

          {/* Filters and Actions */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex flex-col sm:flex-row gap-4 flex-1">
                  {/* Search */}
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar por cliente, dirección o ID..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  {/* Filters */}
                  <div className="flex gap-2">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="assigned">Asignada</SelectItem>
                        <SelectItem value="in_progress">En Progreso</SelectItem>
                        <SelectItem value="completed">Completada</SelectItem>
                        <SelectItem value="failed">Fallida</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="delivery">Entrega</SelectItem>
                        <SelectItem value="pickup">Retiro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Button className="bg-brand-red hover:bg-brand-red text-white flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Nueva Tarea
                </Button>
              </div>
            </CardHeader>
          </Card>

          {/* Tasks Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {tasksLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                      <div className="h-6 bg-gray-200 rounded w-20"></div>
                    </div>
                    <div className="space-y-3">
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : filteredTasks.length === 0 ? (
              <div className="col-span-full">
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Truck className="h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No se encontraron tareas
                    </h3>
                    <p className="text-gray-600 text-center">
                      {searchQuery || statusFilter !== "all" || typeFilter !== "all"
                        ? "Intenta ajustar tus filtros de búsqueda"
                        : "No hay tareas de entrega programadas"
                      }
                    </p>
                  </CardContent>
                </Card>
              </div>
            ) : (
              filteredTasks.map((task: any) => {
                const rental = getRentalInfo(task.rentalId);
                const customer = rental ? getCustomerInfo(rental.customerId) : null;
                
                return (
                  <Card key={task.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      {/* Task Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${task.type === 'delivery' ? 'bg-green-100' : 'bg-blue-100'}`}>
                            <Truck className={`h-4 w-4 ${task.type === 'delivery' ? 'text-green-600' : 'text-blue-600'}`} />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {getTypeLabel(task.type)}
                            </h3>
                            <p className="text-sm text-gray-600">#{task.id.slice(-8)}</p>
                          </div>
                        </div>
                        <Badge className={getStatusColor(task.status)}>
                          {getStatusLabel(task.status)}
                        </Badge>
                      </div>

                      {/* Customer Info */}
                      {customer && (
                        <div className="flex items-center gap-3 mb-4">
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
                      )}

                      {/* Task Details */}
                      <div className="space-y-3 mb-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4" />
                          <span>
                            Programada: {new Date(task.scheduledDate).toLocaleDateString('es-CL')} a las {new Date(task.scheduledDate).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        
                        {rental?.deliveryAddress && (
                          <div className="flex items-start gap-2 text-sm text-gray-600">
                            <MapPin className="h-4 w-4 mt-0.5" />
                            <span>{rental.deliveryAddress}</span>
                          </div>
                        )}
                        
                        {task.completedAt && (
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span>
                              Completada: {new Date(task.completedAt).toLocaleDateString('es-CL')}
                            </span>
                          </div>
                        )}
                        
                        {task.notes && (
                          <div className="bg-gray-50 p-3 rounded-md">
                            <p className="text-sm text-gray-700">{task.notes}</p>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        {task.status === "assigned" && (
                          <>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleStatusUpdate(task.id, "in_progress")}
                              disabled={updateTaskMutation.isPending}
                            >
                              Iniciar
                            </Button>
                            <Button 
                              size="sm" 
                              className="bg-brand-red hover:bg-brand-red text-white"
                              onClick={() => handleStatusUpdate(task.id, "failed")}
                              disabled={updateTaskMutation.isPending}
                            >
                              Marcar Fallida
                            </Button>
                          </>
                        )}
                        
                        {task.status === "in_progress" && (
                          <>
                            <Button 
                              size="sm" 
                              className="bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => handleStatusUpdate(task.id, "completed")}
                              disabled={updateTaskMutation.isPending}
                            >
                              Completar
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleStatusUpdate(task.id, "failed")}
                              disabled={updateTaskMutation.isPending}
                            >
                              Marcar Fallida
                            </Button>
                          </>
                        )}
                        
                        {(task.status === "completed" || task.status === "failed") && (
                          <Button size="sm" variant="outline" className="flex-1">
                            Ver Detalles
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>

          {/* Summary */}
          {!tasksLoading && filteredTasks.length > 0 && (
            <Card className="mt-6">
              <CardContent className="p-4">
                <p className="text-sm text-gray-600">
                  Mostrando {filteredTasks.length} de {deliveryTasks?.length || 0} tareas
                  {(statusFilter !== "all" || typeFilter !== "all") && " con filtros aplicados"}
                </p>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
      
      <MobileNav role={user.role || 'admin'} />
    </div>
  );
}
