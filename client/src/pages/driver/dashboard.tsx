import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import BarcodeScanner from "@/components/barcode-scanner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { 
  Truck, 
  Package, 
  MapPin, 
  Clock, 
  CheckCircle, 
  XCircle, 
  QrCode,
  Calendar,
  AlertTriangle,
  Navigation,
  Phone
} from "lucide-react";

export default function DriverDashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [showScanner, setShowScanner] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [notes, setNotes] = useState("");

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

  const { data: deliveryTasks, isLoading: tasksLoading } = useQuery({
    queryKey: ["/api/delivery-tasks"],
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

  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, data }: { taskId: string; data: any }) => {
      await apiRequest("PUT", `/api/delivery-tasks/${taskId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/delivery-tasks"] });
      setSelectedTask(null);
      setNotes("");
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

  const createMovementMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("POST", "/api/box-movements", data);
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
      console.error("Error creating box movement:", error);
    },
  });

  // Helper functions
  const getRentalInfo = (rentalId: string) => {
    return rentals?.find((rental: any) => rental.id === rentalId);
  };

  const getCustomerInfo = (customerId: string) => {
    return customers?.find((customer: any) => customer.id === customerId);
  };

  const getTasksForToday = () => {
    if (!deliveryTasks) return [];
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return deliveryTasks.filter((task: any) => {
      const taskDate = new Date(task.scheduledDate);
      return taskDate >= today && taskDate < tomorrow;
    });
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

  const handleStatusUpdate = (taskId: string, newStatus: string) => {
    const updateData: any = { 
      status: newStatus,
      notes: notes || undefined
    };
    
    if (newStatus === "completed") {
      updateData.completedAt = new Date().toISOString();
    }
    
    updateTaskMutation.mutate({ taskId, data: updateData });
  };

  const handleScanSuccess = (barcode: string) => {
    setShowScanner(false);
    
    // Create a box movement for scanning
    createMovementMutation.mutate({
      boxId: barcode, // This would need to be resolved from barcode to box ID
      action: "scanned",
      notes: `Escaneado por repartidor: ${user?.firstName} ${user?.lastName}`,
      location: "En ruta"
    });
    
    toast({
      title: "Código escaneado",
      description: `Código ${barcode} registrado exitosamente`,
    });
  };

  const todayTasks = getTasksForToday();
  const pendingTasks = todayTasks.filter(task => task.status === "assigned");
  const inProgressTasks = todayTasks.filter(task => task.status === "in_progress");
  const completedTasks = todayTasks.filter(task => task.status === "completed");

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue"></div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <Header />
        
        <div className="flex">
          <Sidebar role={user.role || 'driver'} />
          
          <main className="flex-1 p-4 lg:p-8 pb-20 lg:pb-8">
            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                Panel de Repartidor
              </h1>
              <p className="text-gray-600">
                Gestiona tus entregas y retiros del día
              </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Calendar className="h-8 w-8 text-brand-blue" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{todayTasks.length}</p>
                  <p className="text-sm text-gray-600">Tareas del Día</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Clock className="h-8 w-8 text-yellow-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{pendingTasks.length}</p>
                  <p className="text-sm text-gray-600">Pendientes</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Truck className="h-8 w-8 text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{inProgressTasks.length}</p>
                  <p className="text-sm text-gray-600">En Progreso</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{completedTasks.length}</p>
                  <p className="text-sm text-gray-600">Completadas</p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Acciones Rápidas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    onClick={() => setShowScanner(true)}
                    className="bg-box-blue hover:bg-box-blue text-white flex items-center gap-2"
                  >
                    <QrCode className="h-4 w-4" />
                    Escanear Código
                  </Button>
                  
                  <Button 
                    variant="outline"
                    className="flex items-center gap-2"
                    onClick={() => {
                      toast({
                        title: "Reportar Incidencia",
                        description: "Funcionalidad en desarrollo",
                      });
                    }}
                  >
                    <AlertTriangle className="h-4 w-4" />
                    Reportar Incidencia
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Today's Tasks */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-brand-blue" />
                  Tareas de Hoy
                </CardTitle>
              </CardHeader>
              <CardContent>
                {tasksLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="animate-pulse p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div className="h-4 bg-gray-200 rounded w-24"></div>
                          <div className="h-6 bg-gray-200 rounded w-20"></div>
                        </div>
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-200 rounded"></div>
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : todayTasks.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No tienes tareas para hoy
                    </h3>
                    <p className="text-gray-600">
                      Disfruta tu día libre o consulta tareas futuras
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {todayTasks.map((task: any) => {
                      const rental = getRentalInfo(task.rentalId);
                      const customer = rental ? getCustomerInfo(rental.customerId) : null;
                      
                      return (
                        <div key={task.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                          {/* Task Header */}
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-full ${task.type === 'delivery' ? 'bg-green-100' : 'bg-blue-100'}`}>
                                <Truck className={`h-4 w-4 ${task.type === 'delivery' ? 'text-green-600' : 'text-blue-600'}`} />
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900">
                                  {getTypeLabel(task.type)} #{task.id.slice(-6)}
                                </h3>
                                <p className="text-sm text-gray-600">
                                  {new Date(task.scheduledDate).toLocaleTimeString('es-CL', { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}
                                </p>
                              </div>
                            </div>
                            <Badge className={getStatusColor(task.status)}>
                              {getStatusLabel(task.status)}
                            </Badge>
                          </div>

                          {/* Customer Info */}
                          {customer && (
                            <div className="flex items-center gap-3 mb-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-brand-blue text-white text-sm">
                                  {customer.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">{customer.name}</p>
                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                  <span className="flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    {customer.phone || "Sin teléfono"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Address */}
                          {rental?.deliveryAddress && (
                            <div className="flex items-start gap-2 mb-3 text-sm text-gray-600">
                              <MapPin className="h-4 w-4 mt-0.5" />
                              <span>{rental.deliveryAddress}</span>
                            </div>
                          )}

                          {/* Notes */}
                          {task.notes && (
                            <div className="bg-gray-50 p-3 rounded-md mb-3">
                              <p className="text-sm text-gray-700">{task.notes}</p>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex gap-2">
                            {task.status === "assigned" && (
                              <>
                                <Button 
                                  size="sm" 
                                  onClick={() => setSelectedTask(task)}
                                  className="bg-brand-blue hover:bg-brand-blue text-white"
                                >
                                  Iniciar
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => {
                                    // Open maps
                                    if (rental?.deliveryAddress) {
                                      const address = encodeURIComponent(rental.deliveryAddress);
                                      window.open(`https://maps.google.com/maps?q=${address}`, '_blank');
                                    }
                                  }}
                                >
                                  <Navigation className="h-4 w-4 mr-1" />
                                  Navegar
                                </Button>
                              </>
                            )}
                            
                            {task.status === "in_progress" && (
                              <>
                                <Button 
                                  size="sm" 
                                  onClick={() => setSelectedTask(task)}
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                  Completar
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => setSelectedTask(task)}
                                >
                                  Reportar Problema
                                </Button>
                              </>
                            )}
                            
                            {task.status === "completed" && (
                              <Badge className="bg-green-100 text-green-800">
                                ✓ Completada a las {task.completedAt ? new Date(task.completedAt).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) : ''}
                              </Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </main>
        </div>
        
        <MobileNav role={user.role || 'driver'} />
      </div>

      {/* Task Action Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>
                {selectedTask.status === "assigned" ? "Iniciar Tarea" : "Completar Tarea"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-medium">{getTypeLabel(selectedTask.type)}</p>
                <p className="text-sm text-gray-600">#{selectedTask.id.slice(-6)}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comentarios (opcional)
                </label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Agregar observaciones sobre la tarea..."
                  rows={3}
                />
              </div>
              
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSelectedTask(null);
                    setNotes("");
                  }}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                
                {selectedTask.status === "assigned" && (
                  <Button 
                    onClick={() => handleStatusUpdate(selectedTask.id, "in_progress")}
                    disabled={updateTaskMutation.isPending}
                    className="flex-1 bg-brand-blue hover:bg-brand-blue text-white"
                  >
                    Iniciar
                  </Button>
                )}
                
                {selectedTask.status === "in_progress" && (
                  <>
                    <Button 
                      onClick={() => handleStatusUpdate(selectedTask.id, "failed")}
                      disabled={updateTaskMutation.isPending}
                      variant="outline"
                      className="flex-1"
                    >
                      Reportar Problema
                    </Button>
                    <Button 
                      onClick={() => handleStatusUpdate(selectedTask.id, "completed")}
                      disabled={updateTaskMutation.isPending}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                      Completar
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Barcode Scanner */}
      {showScanner && (
        <BarcodeScanner
          onScan={handleScanSuccess}
          onClose={() => setShowScanner(false)}
        />
      )}
    </>
  );
}
