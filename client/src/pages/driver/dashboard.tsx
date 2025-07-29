import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Truck, MapPin, Clock, CheckCircle, XCircle, Package, LogOut, AlertTriangle } from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function DriverDashboard() {
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [taskStatus, setTaskStatus] = useState('');
  const [observations, setObservations] = useState('');

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      return response.json();
    },
    onSuccess: () => {
      window.location.href = '/';
    },
  });

  const completeTaskMutation = useMutation({
    mutationFn: async (data: { taskId: string; status: string; observations: string }) => {
      const response = await fetch('/api/tasks/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Error al completar tarea');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Tarea completada",
        description: "La tarea se ha actualizado correctamente",
      });
      setIsDialogOpen(false);
      setObservations('');
      setTaskStatus('');
      // Refresh page or update state here
      window.location.reload();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo completar la tarea",
        variant: "destructive",
      });
    },
  });

  const handleCompleteTask = (taskId: string, taskType: string) => {
    const task = todayTasks.find(t => t.id === taskId);
    setSelectedTask(task);
    setTaskStatus(taskType === 'delivery' ? 'entregada' : 'retirada');
    setIsDialogOpen(true);
  };

  const openGoogleMaps = (address: string) => {
    const encodedAddress = encodeURIComponent(address);
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
    window.open(mapsUrl, '_blank');
  };

  const submitTaskCompletion = () => {
    if (!taskStatus) {
      toast({
        title: "Estado requerido",
        description: "Selecciona el estado de la tarea",
        variant: "destructive",
      });
      return;
    }

    completeTaskMutation.mutate({
      taskId: selectedTask?.id,
      status: taskStatus,
      observations: observations.trim(),
    });
  };

  // Mock data for demo
  const todayTasks = [
    {
      id: '1',
      type: 'delivery',
      customer: 'María González',
      address: 'Av. Providencia 1234, Providencia', // DESTINO: Dirección del cliente
      origin: 'Bodega Central, Av. Industrial 1234, Quilicura', // ORIGEN: Desde donde se recogen las cajas
      boxes: 5,
      status: 'pending',
      time: '09:00',
      phone: '+56912345678'
    },
    {
      id: '2',
      type: 'pickup',
      customer: 'Pedro Martínez',
      address: 'Las Condes 567, Las Condes', // ORIGEN: Dirección del cliente (donde se retiran)
      destination: 'Bodega Central, Av. Industrial 1234, Quilicura', // DESTINO: Donde se llevan las cajas
      boxes: 3,
      status: 'completed',
      time: '11:30',
      phone: '+56987654321'
    },
    {
      id: '3',
      type: 'delivery',
      customer: 'Ana López',
      address: 'San Miguel 890, San Miguel', // DESTINO: Dirección del cliente
      origin: 'Bodega Central, Av. Industrial 1234, Quilicura', // ORIGEN: Desde donde se recogen las cajas
      boxes: 8,
      status: 'pending',
      time: '14:00',
      phone: '+56911223344'
    }
  ];

  const getTaskIcon = (type: string) => {
    return type === 'delivery' ? (
      <Package className="w-4 h-4" />
    ) : (
      <Truck className="w-4 h-4" />
    );
  };

  const getTaskColor = (type: string) => {
    return type === 'delivery' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800';
  };

  const getStatusIcon = (status: string) => {
    return status === 'completed' ? (
      <CheckCircle className="w-5 h-5 text-green-600" />
    ) : (
      <Clock className="w-5 h-5 text-orange-600" />
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <img src="/logo.png" alt="Arriendo Cajas" className="h-10" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Portal Repartidor
                </h1>
                <p className="text-sm text-gray-600">
                  Hola, {user?.firstName} {user?.lastName}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Salir
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Summary Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <Package className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">2</div>
              <div className="text-sm text-gray-600">Entregas Pendientes</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <Truck className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">1</div>
              <div className="text-sm text-gray-600">Retiros Pendientes</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <CheckCircle className="w-8 h-8 text-orange-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">1</div>
              <div className="text-sm text-gray-600">Completadas Hoy</div>
            </CardContent>
          </Card>
        </div>

        {/* Today's Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Tareas de Hoy - {new Date().toLocaleDateString('es-CL')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {todayTasks.map((task) => (
                <div key={task.id} className="border rounded-lg p-4 bg-white">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(task.status)}
                      <Badge className={getTaskColor(task.type)}>
                        {getTaskIcon(task.type)}
                        <span className="ml-1">
                          {task.type === 'delivery' ? 'Entrega' : 'Retiro'}
                        </span>
                      </Badge>
                      <span className="font-medium">{task.time}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{task.boxes} cajas</div>
                      <div className="text-sm text-gray-600">
                        {task.status === 'completed' ? 'Completado' : 'Pendiente'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <span className="font-medium">{task.customer}</span>
                      <span className="ml-2 text-sm text-blue-600">{task.phone}</span>
                    </div>
                    
                    {task.type === 'delivery' ? (
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center text-gray-600">
                          <span className="text-xs font-medium text-green-600 mr-2">DESDE:</span>
                          <span>{task.origin}</span>
                        </div>
                        <div className="flex items-center text-gray-900">
                          <MapPin className="w-4 h-4 mr-2 text-red-600" />
                          <span className="font-medium">ENTREGAR EN: {task.address}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center text-gray-900">
                          <MapPin className="w-4 h-4 mr-2 text-blue-600" />
                          <span className="font-medium">RETIRAR DE: {task.address}</span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <span className="text-xs font-medium text-green-600 mr-2">LLEVAR A:</span>
                          <span>{task.destination}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {task.status === 'pending' && (
                    <div className="flex space-x-2 mt-4">
                      <Button 
                        size="sm" 
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleCompleteTask(task.id, task.type)}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Completar
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => openGoogleMaps(task.address)}
                      >
                        <MapPin className="w-4 h-4 mr-2" />
                        Ver Mapa
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6 mt-6">
          <Card>
            <CardContent className="p-6 text-center">
              <Package className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="font-medium mb-2">Escanear Código</h3>
              <p className="text-sm text-gray-600 mb-4">
                Escanea el código de barras de las cajas
              </p>
              <Button className="w-full">
                Abrir Escáner
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <XCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
              <h3 className="font-medium mb-2">Reportar Incidencia</h3>
              <p className="text-sm text-gray-600 mb-4">
                Reporta problemas durante la entrega
              </p>
              <Button variant="outline" className="w-full">
                Crear Reporte
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Task Completion Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Completar Tarea</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {selectedTask && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="font-medium">{selectedTask.customer}</div>
                  <div className="text-sm text-gray-600">{selectedTask.address}</div>
                  <div className="text-sm text-gray-600">{selectedTask.boxes} cajas</div>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="status">Estado de la tarea</Label>
                <Select value={taskStatus} onValueChange={setTaskStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entregada">✅ Entregada exitosamente</SelectItem>
                    <SelectItem value="retirada">📦 Retirada exitosamente</SelectItem>
                    <SelectItem value="no_entregada">❌ No se pudo entregar</SelectItem>
                    <SelectItem value="no_retirada">❌ No se pudo retirar</SelectItem>
                    <SelectItem value="incidencia">⚠️ Incidencia durante entrega</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="observations">Observaciones</Label>
                <Textarea
                  id="observations"
                  placeholder="Ej: Cajas entregadas sin problemas, Nadie atendió la puerta, Cajas dañadas, etc."
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex space-x-2">
                <Button
                  onClick={submitTaskCompletion}
                  disabled={completeTaskMutation.isPending}
                  className="flex-1"
                >
                  {completeTaskMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Confirmar
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={completeTaskMutation.isPending}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}