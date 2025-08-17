import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, Calendar, Clock, Phone, LogOut, Loader2 } from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";


export default function CustomerDashboard() {
  const { user, isLoading: userLoading } = useCurrentUser();

  // Fetch customer rentals
  const { data: rentals = [], isLoading: rentalsLoading } = useQuery({
    queryKey: ['/api/customer/rentals'],
    enabled: !!user,
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      return response.json();
    },
    onSuccess: () => {
      window.location.href = '/';
    },
  });

  // Calculate stats from real data
  const activeRentals = rentals.filter((r: any) => ['entregada', 'programada'].includes(r.status));
  const totalBoxes = activeRentals.reduce((sum: number, r: any) => sum + r.boxQuantity, 0);
  const nearestPickup = activeRentals.find((r: any) => r.pickupDate);
  const daysUntilPickup = nearestPickup ? 
    Math.ceil((new Date(nearestPickup.pickupDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'entregada': return 'bg-green-100 text-green-800';
      case 'pendiente': return 'bg-yellow-100 text-yellow-800';
      case 'programada': return 'bg-blue-100 text-blue-800';
      case 'retirada': return 'bg-orange-100 text-orange-800';
      case 'finalizada': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'entregada': return 'Entregada';
      case 'pendiente': return 'Pendiente';
      case 'programada': return 'Programada';
      case 'retirada': return 'Retirada';
      case 'finalizada': return 'Finalizada';
      default: return status;
    }
  };

  if (userLoading || rentalsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

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
              <div className="text-2xl font-bold text-gray-900">{totalBoxes}</div>
              <div className="text-sm text-gray-600">Cajas Activas</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <Calendar className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{daysUntilPickup > 0 ? daysUntilPickup : '-'}</div>
              <div className="text-sm text-gray-600">Días para Retiro</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <Clock className="w-8 h-8 text-orange-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{rentals.length}</div>
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
              {rentals.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No tienes arriendos registrados</p>
                </div>
              ) : (
                rentals.map((rental: any) => (
                  <div key={rental.id} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center space-x-3">
                        <Badge className={getStatusColor(rental.status)}>
                          {getStatusText(rental.status)}
                        </Badge>
                        <span className="font-medium">
                          {rental.trackingCode ? `Código: ${rental.trackingCode}` : `Arriendo #${rental.id.slice(0, 8)}`}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg">${parseInt(rental.totalAmount).toLocaleString()}</div>
                        <div className="text-sm text-gray-600">Total</div>
                      </div>
                    </div>
                    
                    <div className="space-y-3 text-sm">
                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <span className="text-gray-600">Cajas:</span>
                          <span className="ml-2 font-medium">{rental.boxQuantity} unidades</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Entrega:</span>
                          <span className="ml-2 font-medium">
                            {rental.deliveryDate ? new Date(rental.deliveryDate).toLocaleDateString('es-CL') : 'No programada'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Retiro:</span>
                          <span className="ml-2 font-medium">
                            {rental.pickupDate ? new Date(rental.pickupDate).toLocaleDateString('es-CL') : 'No programado'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-2 pt-2 border-t border-gray-200">
                        <div>
                          <span className="text-gray-600 text-xs">Dirección de entrega:</span>
                          <div className="text-sm font-medium">{rental.deliveryAddress || 'Por definir'}</div>
                        </div>
                        {rental.driverName && (
                          <div>
                            <span className="text-gray-600 text-xs">Repartidor:</span>
                            <div className="text-sm">{rental.driverName}</div>
                          </div>
                        )}
                        {rental.trackingCode && rental.trackingToken && (
                          <div className="pt-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => window.open(`/track/${rental.trackingCode}/${rental.trackingToken}`, '_blank')}
                            >
                              🔍 Ver Seguimiento
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
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