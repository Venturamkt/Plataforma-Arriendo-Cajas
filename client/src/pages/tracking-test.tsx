import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Loader2, CheckCircle, XCircle, Clock, Package, Truck, MapPin } from "lucide-react";

interface RentalData {
  id: string;
  status: string;
  trackingCode: string;
  deliveryDate?: string;
  returnDate?: string;
  deliveryAddress?: string;
}

export function TrackingTest() {
  const [activeTest, setActiveTest] = useState<string | null>(null);

  // Lista de códigos de prueba disponibles
  const testCodes = [
    { rut: "5678", code: "IHNQQ9KB", description: "Test Principal - RUT genérico" },
    { rut: "5678", code: "G90AZYEG", description: "Test Alternativo 1" },
    { rut: "5678", code: "2OB1DQ4Q", description: "Test Alternativo 2" },
    { rut: "5678", code: "4N4HGCFI", description: "Test Alternativo 3" },
  ];

  const { data: trackingData, isLoading, error } = useQuery<RentalData>({
    queryKey: ['/api/track', activeTest],
    enabled: !!activeTest,
    staleTime: 30000,
    refetchInterval: false,
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pendiente': return <Clock className="h-4 w-4" />;
      case 'pagada': return <CheckCircle className="h-4 w-4" />;
      case 'entregada': return <Package className="h-4 w-4" />;
      case 'retirada': return <Truck className="h-4 w-4" />;
      case 'completada': return <CheckCircle className="h-4 w-4" />;
      case 'cancelada': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendiente': return 'secondary';
      case 'pagada': return 'default';
      case 'entregada': return 'default';
      case 'retirada': return 'default';
      case 'completada': return 'default';
      case 'cancelada': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pendiente': return 'Pendiente de Pago';
      case 'pagada': return 'Pagada - Lista para Entrega';
      case 'entregada': return 'Entregada al Cliente';
      case 'retirada': return 'Retirada por el Cliente';
      case 'completada': return 'Completada';
      case 'cancelada': return 'Cancelada';
      default: return status;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-red-50 p-4">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Panel de Pruebas - Sistema de Tracking
          </h1>
          <p className="text-gray-600 text-lg">
            Prueba el sistema de seguimiento con diferentes códigos
          </p>
        </div>

        {/* Test Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {testCodes.map((test) => (
            <Card key={`${test.rut}-${test.code}`} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <Button
                  onClick={() => setActiveTest(`${test.rut}/${test.code}`)}
                  variant={activeTest === `${test.rut}/${test.code}` ? "default" : "outline"}
                  className="w-full h-auto flex flex-col items-start p-4"
                  disabled={isLoading}
                >
                  <div className="font-bold text-left w-full">Código: {test.code}</div>
                  <div className="text-sm text-left w-full opacity-75">RUT: {test.rut}</div>
                  <div className="text-xs text-left w-full mt-1">{test.description}</div>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Loading State */}
        {isLoading && (
          <Card className="mb-6">
            <CardContent className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin mr-3" />
              <span>Consultando sistema de tracking...</span>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {error && (
          <Card className="mb-6 border-red-200">
            <CardHeader>
              <CardTitle className="text-red-700 flex items-center">
                <XCircle className="h-5 w-5 mr-2" />
                Error en la Consulta
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-600">
                {error instanceof Error ? error.message : 'Error desconocido'}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Esto puede indicar que el código no existe en la base de datos de producción.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Success State */}
        {trackingData && !isLoading && (
          <Card className="mb-6 border-green-200">
            <CardHeader>
              <CardTitle className="text-green-700 flex items-center">
                <CheckCircle className="h-5 w-5 mr-2" />
                Arriendo Encontrado
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Estado del Arriendo</label>
                  <div className="flex items-center mt-1">
                    <Badge variant={getStatusColor(trackingData.status)} className="flex items-center">
                      {getStatusIcon(trackingData.status)}
                      <span className="ml-1">{getStatusText(trackingData.status)}</span>
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Código de Tracking</label>
                  <p className="font-mono text-lg">{trackingData.trackingCode}</p>
                </div>
                
                {trackingData.deliveryDate && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Fecha de Entrega</label>
                    <p>{new Date(trackingData.deliveryDate).toLocaleDateString('es-CL')}</p>
                  </div>
                )}
                
                {trackingData.returnDate && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Fecha de Retiro</label>
                    <p>{new Date(trackingData.returnDate).toLocaleDateString('es-CL')}</p>
                  </div>
                )}
              </div>

              {trackingData.deliveryAddress && (
                <div>
                  <label className="text-sm font-medium text-gray-500 flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    Dirección de Entrega
                  </label>
                  <p className="mt-1">{trackingData.deliveryAddress}</p>
                </div>
              )}

              <div className="pt-4 border-t">
                <p className="text-sm text-green-600 font-medium">
                  ✅ Sistema de tracking funcionando correctamente
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Instrucciones de Prueba</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start">
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">1</div>
              <p>Haz clic en cualquiera de los códigos de prueba arriba</p>
            </div>
            <div className="flex items-start">
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">2</div>
              <p>El sistema consultará la base de datos en tiempo real</p>
            </div>
            <div className="flex items-start">
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">3</div>
              <p>Si muestra los datos, el sistema está funcionando correctamente</p>
            </div>
            <div className="flex items-start">
              <div className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">⚠️</div>
              <p className="text-red-600">Si da error, significa que la base de datos de producción necesita sincronización</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}