import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, Calendar, Clock, Phone, LogOut } from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";

export default function CustomerDashboard() {
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
  const rentals = [
    {
      id: '1',
      status: 'entregada',
      boxes: 5,
      deliveryDate: '2025-01-25',
      daysRemaining: 10,
      totalAmount: 15000,
      originAddress: 'Bodega Central, Av. Industrial 1234, Quilicura',
      destinationAddress: 'Oficina Cliente, Av. Providencia 567, Providencia'
    },
    {
      id: '2',
      status: 'pendiente',
      boxes: 3,
      deliveryDate: '2025-01-30',
      daysRemaining: null,
      totalAmount: 9000,
      originAddress: 'Bodega Central, Av. Industrial 1234, Quilicura',
      destinationAddress: 'Sucursal Norte, Las Condes 890, Las Condes'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'entregada': return 'bg-green-100 text-green-800';
      case 'pendiente': return 'bg-yellow-100 text-yellow-800';
      case 'retirada': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'entregada': return 'Entregado';
      case 'pendiente': return 'Pendiente';
      case 'retirada': return 'Para Retirar';
      default: return status;
    }
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
                  Mis Arriendos
                </h1>
                <p className="text-sm text-gray-600">
                  Bienvenido, {user?.name || user?.email}
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
              <div className="text-2xl font-bold text-gray-900">5</div>
              <div className="text-sm text-gray-600">Cajas Activas</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <Calendar className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">10</div>
              <div className="text-sm text-gray-600">Días Restantes</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <Clock className="w-8 h-8 text-orange-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">2</div>
              <div className="text-sm text-gray-600">Arriendos Totales</div>
            </CardContent>
          </Card>
        </div>

        {/* Rentals List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="w-5 h-5 mr-2" />
              Historial de Arriendos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {rentals.map((rental) => (
                <div key={rental.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center space-x-3">
                      <Badge className={getStatusColor(rental.status)}>
                        {getStatusText(rental.status)}
                      </Badge>
                      <span className="font-medium">Arriendo #{rental.id}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">${rental.totalAmount.toLocaleString()}</div>
                      <div className="text-sm text-gray-600">Total</div>
                    </div>
                  </div>
                  
                  <div className="space-y-3 text-sm">
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <span className="text-gray-600">Cajas:</span>
                        <span className="ml-2 font-medium">{rental.boxes} unidades</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Entrega:</span>
                        <span className="ml-2 font-medium">{rental.deliveryDate}</span>
                      </div>
                      {rental.daysRemaining && (
                        <div>
                          <span className="text-gray-600">Días restantes:</span>
                          <span className="ml-2 font-medium text-green-600">{rental.daysRemaining}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2 pt-2 border-t border-gray-200">
                      <div>
                        <span className="text-gray-600 text-xs">Origen:</span>
                        <div className="text-sm">{rental.originAddress}</div>
                      </div>
                      <div>
                        <span className="text-gray-600 text-xs">Destino:</span>
                        <div className="text-sm font-medium">{rental.destinationAddress}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Contact Info */}
        <Card className="mt-6">
          <CardContent className="p-6">
            <div className="flex items-center text-center justify-center">
              <Phone className="w-5 h-5 text-blue-600 mr-3" />
              <div>
                <div className="font-medium">¿Necesitas ayuda?</div>
                <div className="text-sm text-gray-600">
                  Llama al <span className="font-medium text-blue-600">+56 9 1234 5678</span> o 
                  escribe a <span className="font-medium text-blue-600">contacto@arriendocajas.cl</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}