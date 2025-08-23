import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Calendar, MapPin, Truck, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { useLocation } from "wouter";

interface TrackingData {
  id: string;
  trackingCode: string;
  status: string;
  boxQuantity: number;
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

const statusBadgeConfig = {
  pendiente: { label: "Pendiente", color: "bg-yellow-100 text-yellow-800" },
  pagado: { label: "Pagado", color: "bg-blue-100 text-blue-800" },
  en_ruta: { label: "En Ruta", color: "bg-purple-100 text-purple-800" },
  entregada: { label: "Entregada", color: "bg-green-100 text-green-800" },
  retiro_programado: { label: "Retiro Programado", color: "bg-orange-100 text-orange-800" },
  retirada: { label: "Retirada", color: "bg-indigo-100 text-indigo-800" },
  finalizada: { label: "Finalizada", color: "bg-green-100 text-green-800" },
  cancelada: { label: "Cancelada", color: "bg-red-100 text-red-800" }
};

export default function TrackingPage() {
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pendiente':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'programada':
        return <Calendar className="h-5 w-5 text-blue-600" />;
      case 'en_ruta':
        return <Truck className="h-5 w-5 text-purple-600" />;
      case 'entregada':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'retiro_programado':
        return <Calendar className="h-5 w-5 text-orange-600" />;
      case 'retirada':
        return <CheckCircle className="h-5 w-5 text-indigo-600" />;
      case 'finalizada':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'cancelada':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Buscando tu arriendo...</p>
        </div>
      </div>
    );
  }

  if (error || !trackingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-red-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Arriendo no encontrado</h2>
            <p className="text-gray-600 mb-4">
              {error || 'No pudimos encontrar un arriendo con este código de seguimiento.'}
            </p>
            <p className="text-sm text-gray-500">
              Verifica tu código: <span className="font-mono font-medium">{trackingCode}</span>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-red-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Seguimiento de Arriendo</h1>
            <div className="flex items-center justify-center space-x-2">
              <Package className="h-5 w-5 text-red-600" />
              <span className="text-lg font-mono font-medium text-red-600">{trackingData.trackingCode}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Status Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {getStatusIcon(trackingData.status)}
              <span>Estado Actual</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Badge className={statusBadgeConfig[trackingData.status as keyof typeof statusBadgeConfig]?.color || "bg-gray-100 text-gray-800"}>
                {statusBadgeConfig[trackingData.status as keyof typeof statusBadgeConfig]?.label || trackingData.status}
              </Badge>
              <span className="text-sm text-gray-500">
                Arriendo creado el {formatDate(trackingData.createdAt)}
              </span>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="h-5 w-5 text-blue-600" />
                <span>Detalles del Arriendo</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-500">Cliente:</span>
                <p className="font-medium">{trackingData.customerName}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Cantidad de cajas:</span>
                <p className="font-medium">{trackingData.boxQuantity} cajas</p>
              </div>
              {trackingData.driverName && (
                <div>
                  <span className="text-sm font-medium text-gray-500">Repartidor asignado:</span>
                  <p className="font-medium flex items-center">
                    <Truck className="h-4 w-4 mr-1 text-green-600" />
                    {trackingData.driverName}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-green-600" />
                <span>Fechas Importantes</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-500">Fecha de entrega:</span>
                <p className="font-medium">{formatDate(trackingData.deliveryDate)}</p>
                {trackingData.actualDeliveryDate && (
                  <p className="text-sm text-green-600">✅ Entregado el {formatDate(trackingData.actualDeliveryDate)}</p>
                )}
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Fecha de retiro:</span>
                <p className="font-medium">{formatDate(trackingData.pickupDate)}</p>
                {trackingData.actualPickupDate && (
                  <p className="text-sm text-green-600">✅ Retirado el {formatDate(trackingData.actualPickupDate)}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Addresses */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-purple-600" />
                <span>Direcciones</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-500">Dirección de entrega:</span>
                <p className="font-medium">{trackingData.deliveryAddress}</p>
              </div>
              {trackingData.pickupAddress && (
                <div>
                  <span className="text-sm font-medium text-gray-500">Dirección de retiro:</span>
                  <p className="font-medium">{trackingData.pickupAddress}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Help Text */}
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="text-center">
              <h3 className="font-medium text-blue-900 mb-2">¿Necesitas ayuda?</h3>
              <p className="text-sm text-blue-700 mb-2">
                Si tienes preguntas sobre tu arriendo, contáctanos:
              </p>
              <div className="text-sm text-blue-600 space-y-1">
                <p>📞 Teléfono: +56 9 8729 0995</p>
                <p>✉️ Email: contacto@arriendocajas.cl</p>
                <p>💬 WhatsApp: +56 9 8729 0995</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}