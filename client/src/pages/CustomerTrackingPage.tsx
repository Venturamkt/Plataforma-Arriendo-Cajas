import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Calendar, Clock, Phone, Loader2, MapPin } from "lucide-react";
import { useLocation } from "wouter";

interface TrackingData {
  id: string;
  trackingCode: string;
  status: string;
  boxQuantity: number;
  totalAmount: string;
  deliveryDate: string;
  pickupDate: string;
  actualDeliveryDate?: string;
  actualPickupDate?: string;
  deliveryAddress: string;
  pickupAddress?: string;
  customerName: string;
  driverName?: string;
  createdAt: string;
}

export default function CustomerTrackingPage() {
  const [location] = useLocation();
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Extraer códigos de tracking de la URL /track/:trackingCode/:trackingToken
  const pathParts = location.split('/');
  const trackingCode = pathParts[2];
  const trackingToken = pathParts[3];

  useEffect(() => {
    if (trackingCode && trackingToken) {
      fetchTrackingData();
    } else {
      setError("Código de seguimiento inválido");
      setLoading(false);
    }
  }, [trackingCode, trackingToken]);

  const fetchTrackingData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/track/${trackingCode}/${trackingToken}`);
      
      if (!response.ok) {
        throw new Error(response.status === 404 ? 'Arriendo no encontrado' : 'Error al buscar el arriendo');
      }
      
      const data = await response.json();
      setTrackingData(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setTrackingData(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'entregada': return 'bg-green-100 text-green-800';
      case 'pendiente': return 'bg-yellow-100 text-yellow-800';
      case 'pagado': return 'bg-blue-100 text-blue-800';
      case 'retirada': return 'bg-orange-100 text-orange-800';
      case 'finalizada': return 'bg-gray-100 text-gray-800';
      case 'cancelada': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'entregada': return 'Entregada';
      case 'pendiente': return 'Pendiente';
      case 'pagado': return 'Pagado';
      case 'retirada': return 'Retirada';
      case 'finalizada': return 'Finalizada';
      case 'cancelada': return 'Cancelada';
      default: return status;
    }
  };

  // Calculate days remaining for rental
  const daysRemaining = trackingData && trackingData.pickupDate ? 
    Math.ceil((new Date(trackingData.pickupDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !trackingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-6 text-center">
            <Package className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Arriendo no encontrado</h2>
            <p className="text-gray-600 mb-4">
              {error || 'No pudimos encontrar un arriendo con este código de seguimiento.'}
            </p>
            <p className="text-sm text-gray-500">
              Código: <span className="font-mono font-medium">{trackingCode}</span>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple Header - Sin botón salir */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-4 py-4">
            <img src="/logo.png" alt="Arriendo Cajas" className="h-10" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Tu Arriendo
              </h1>
              <p className="text-sm text-gray-600">
                {trackingData.customerName}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Mismo diseño ultra simple del customer dashboard */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Current Rental - Ultra Simple Design */}
        <Card className="mb-8 border-l-4 border-l-green-500 bg-green-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package className="w-5 h-5 text-green-600" />
              Tu Arriendo Actual
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Badge className={`${getStatusColor(trackingData.status)} px-4 py-2 text-base font-semibold`}>
                  {getStatusText(trackingData.status)}
                </Badge>
                <span className="text-sm text-gray-600">
                  Código: {trackingData.trackingCode}
                </span>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Dirección:</p>
                <p className="font-medium text-sm">{trackingData.deliveryAddress}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-green-200">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Cajas</p>
                  <p className="font-semibold">{trackingData.boxQuantity}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Fecha de Entrega</p>
                  <p className="font-semibold text-sm">
                    {new Date(trackingData.deliveryDate).toLocaleDateString('es-CL', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Total</p>
                  <p className="font-semibold text-green-600">
                    ${parseInt(trackingData.totalAmount).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="pt-4">
              <div className="bg-blue-600 text-white px-4 py-3 rounded-lg text-center">
                <div className="flex items-center justify-center gap-2">
                  <Package className="w-4 h-4" />
                  <span className="font-medium">Ver Seguimiento Detallado</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card className="text-center">
            <CardContent className="py-6">
              <div className="text-2xl font-bold text-blue-600">{trackingData.boxQuantity}</div>
              <div className="text-sm text-gray-600">Cajas Activas</div>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="py-6">
              <div className="text-2xl font-bold text-green-600">1</div>
              <div className="text-sm text-gray-600">Arriendo Activo</div>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="py-6">
              <div className="text-2xl font-bold text-orange-600">
                {daysRemaining > 0 ? daysRemaining : 0}
              </div>
              <div className="text-sm text-gray-600">Días Restantes</div>
            </CardContent>
          </Card>
        </div>

        {/* Addresses Card */}
        {trackingData.pickupAddress && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="w-5 h-5 text-purple-600" />
                Direcciones
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Dirección de Entrega:</p>
                <p className="font-medium">{trackingData.deliveryAddress}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Dirección de Retiro:</p>
                <p className="font-medium">{trackingData.pickupAddress}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Help Section */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6 text-center">
            <h3 className="font-medium text-blue-900 mb-2">¿Necesitas ayuda?</h3>
            <div className="flex items-center justify-center gap-2 text-blue-700 mb-2">
              <Phone className="w-4 h-4" />
              <span>Llama al +56 9 8729 0995 o escribe a contacto@arriendocajas.cl</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}