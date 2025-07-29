import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Truck, MapPin, Clock, CheckCircle, XCircle, Package, LogOut } from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useMutation } from "@tanstack/react-query";

export default function DriverDashboard() {
  const { user } = useCurrentUser();

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      return response.json();
    },
    onSuccess: () => {
      window.location.href = '/';
    },
  });

  // Mock data for demo
  const todayTasks = [
    {
      id: '1',
      type: 'delivery',
      customer: 'María González',
      address: 'Av. Providencia 1234, Providencia',
      boxes: 5,
      status: 'pending',
      time: '09:00',
      phone: '+56912345678'
    },
    {
      id: '2',
      type: 'pickup',
      customer: 'Pedro Martínez',
      address: 'Las Condes 567, Las Condes',
      boxes: 3,
      status: 'completed',
      time: '11:30',
      phone: '+56987654321'
    },
    {
      id: '3',
      type: 'delivery',
      customer: 'Ana López',
      address: 'San Miguel 890, San Miguel',
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
                    <div className="flex items-center text-gray-600">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span className="text-sm">{task.address}</span>
                    </div>
                  </div>
                  
                  {task.status === 'pending' && (
                    <div className="flex space-x-2 mt-4">
                      <Button size="sm" className="bg-green-600 hover:bg-green-700">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Completar
                      </Button>
                      <Button size="sm" variant="outline">
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
      </div>
    </div>
  );
}