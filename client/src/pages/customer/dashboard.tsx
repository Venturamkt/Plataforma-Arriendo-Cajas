import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, Calendar, Clock, Phone, LogOut, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

interface CurrentUser {
  id: string;
  name: string;
  email: string;
  type: string;
}

interface Rental {
  id: string;
  status: string;
  boxQuantity: number;
  totalAmount: string;
  deliveryDate: string;
  pickupDate: string;
  deliveryAddress: string;
  trackingCode: string;
}

export default function CustomerDashboard() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch current user
        const userResponse = await fetch('/api/auth/current', {
          credentials: 'include',
        });
        
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUser(userData.user);
          
          // If user exists, fetch rentals
          if (userData.user) {
            const rentalsResponse = await fetch('/api/customer/rentals', {
              credentials: 'include',
            });
            
            if (rentalsResponse.ok) {
              const rentalsData = await rentalsResponse.json();
              setRentals(rentalsData);
              console.log('Fetched rentals:', rentalsData.length);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      window.location.href = '/';
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Get only the latest rental for ultra-simple navigation
  const latestRental = rentals.length > 0 ? rentals[0] : null;
  const activeRentals = rentals.filter((r: any) => ['entregada', 'programada'].includes(r.status));
  const totalBoxes = activeRentals.reduce((sum: number, r: any) => sum + r.boxQuantity, 0);
  
  // Calculate days remaining for latest rental
  const daysRemaining = latestRental && latestRental.pickupDate ? 
    Math.ceil((new Date(latestRental.pickupDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;

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

  if (loading) {
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
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Salir
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Latest Rental - Ultra Simple */}
        {latestRental ? (
          <Card className="mb-8 border-2 border-green-200">
            <CardHeader className="bg-green-50 pb-4">
              <CardTitle className="text-xl text-green-800 flex items-center">
                <Package className="w-6 h-6 mr-2" />
                Tu Último Arriendo
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Status and Code */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge className={`${getStatusColor(latestRental.status)} text-lg px-4 py-2`}>
                      {getStatusText(latestRental.status)}
                    </Badge>
                    {latestRental.trackingCode && (
                      <span className="text-sm text-gray-600">
                        Código: <strong>{latestRental.trackingCode}</strong>
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Package className="w-4 h-4 text-gray-500 mr-2" />
                      <span className="text-lg"><strong>{latestRental.boxQuantity}</strong> cajas</span>
                    </div>
                    
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 text-gray-500 mr-2" />
                      <span>
                        {latestRental.deliveryDate ? 
                          new Date(latestRental.deliveryDate).toLocaleDateString('es-CL') : 'No programada'}
                      </span>
                    </div>
                    
                    {daysRemaining > 0 && (
                      <div className="flex items-center text-green-600">
                        <Clock className="w-4 h-4 mr-2" />
                        <span className="font-medium">{daysRemaining} días para retiro</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Address and Actions */}
                <div className="space-y-4">
                  <div>
                    <span className="text-sm text-gray-600">Dirección:</span>
                    <div className="font-medium">{latestRental.deliveryAddress || 'Por definir'}</div>
                  </div>
                  
                  <div>
                    <span className="text-sm text-gray-600">Total:</span>
                    <div className="text-2xl font-bold text-green-600">
                      ${parseInt(latestRental.totalAmount).toLocaleString()}
                    </div>
                  </div>
                  
                  {latestRental.trackingCode && latestRental.trackingToken && (
                    <Button 
                      onClick={() => window.open(`/track/${latestRental.trackingCode}/${latestRental.trackingToken}`, '_blank')}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      🔍 Ver Seguimiento Detallado
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-8">
            <CardContent className="p-8 text-center text-gray-500">
              <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg">No tienes arriendos registrados</p>
            </CardContent>
          </Card>
        )}

        {/* Quick Stats - Simple */}
        {rentals.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card className="p-4 text-center">
              <div className="text-lg font-bold text-gray-900">{totalBoxes}</div>
              <div className="text-xs text-gray-600">Cajas Activas</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-lg font-bold text-gray-900">{rentals.length}</div>
              <div className="text-xs text-gray-600">Total Arriendos</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-lg font-bold text-green-600">
                {daysRemaining > 0 ? daysRemaining : '-'}
              </div>
              <div className="text-xs text-gray-600">Días Restantes</div>
            </Card>
          </div>
        )}

        {/* Show All Rentals Button - Only if more than 1 */}
        {rentals.length > 1 && (
          <Card className="p-4 text-center mb-6">
            <Button 
              variant="outline" 
              onClick={() => {
                alert(`Tienes ${rentals.length} arriendos en total. Funcionalidad de historial completo próximamente.`);
              }}
              className="w-full"
            >
              Ver Todos los Arriendos ({rentals.length})
            </Button>
          </Card>
        )}

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