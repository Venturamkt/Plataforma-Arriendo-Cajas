import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Loader2, CheckCircle, XCircle, Database, AlertTriangle } from "lucide-react";

interface RentalData {
  id: string;
  status: string;
  trackingCode: string;
  deliveryDate?: string;
  returnDate?: string;
  deliveryAddress?: string;
}

export function ProductionTest() {
  const [currentEnvironment, setCurrentEnvironment] = useState<string>("development");
  const [activeTest, setActiveTest] = useState<string | null>(null);

  useEffect(() => {
    // Detectar si estamos en producción o desarrollo
    const hostname = window.location.hostname;
    if (hostname.includes('arriendocajas.cl')) {
      setCurrentEnvironment("production");
    }
  }, []);

  // Lista de códigos de tracking conocidos de diferentes épocas
  const testCodes = [
    { rut: "5678", code: "IHNQQ9KB", description: "Código reciente con RUT genérico", era: "Actual" },
    { rut: "5678", code: "G90AZYEG", description: "Código alternativo reciente", era: "Actual" },
    { rut: "0939", code: "IHNQQ9KB", description: "Mismo código con RUT anterior", era: "Anterior" },
    { rut: "2209", code: "IHNQQ9KB", description: "Variante RUT anterior", era: "Anterior" },
  ];

  const { data: trackingData, isLoading, error } = useQuery<RentalData>({
    queryKey: ['/api/track', activeTest],
    enabled: !!activeTest,
    staleTime: 30000,
    refetchInterval: false,
  });

  const testApiConnectivity = async () => {
    try {
      const response = await fetch('/api/health');
      return response.ok;
    } catch {
      return false;
    }
  };

  const { data: apiHealth } = useQuery({
    queryKey: ['api-health'],
    queryFn: testApiConnectivity,
    staleTime: 60000,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-red-50 p-4">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Diagnóstico de Ambiente
          </h1>
          <div className="flex items-center justify-center gap-4 mb-4">
            <Badge variant={currentEnvironment === "production" ? "destructive" : "default"} className="text-lg px-4 py-2">
              <Database className="h-4 w-4 mr-2" />
              {currentEnvironment === "production" ? "Producción" : "Desarrollo"}
            </Badge>
            <Badge variant={apiHealth ? "default" : "destructive"} className="text-lg px-4 py-2">
              {apiHealth ? <CheckCircle className="h-4 w-4 mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
              API {apiHealth ? "Conectada" : "Desconectada"}
            </Badge>
          </div>
          <p className="text-gray-600 text-lg">
            Prueba diferentes códigos para identificar qué registros existen en este ambiente
          </p>
        </div>

        {/* Environment Warning */}
        {currentEnvironment === "production" && (
          <Card className="mb-6 border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="text-orange-700 flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Ambiente de Producción Detectado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-orange-600">
                Estás probando en el ambiente de producción. Los resultados mostrarán qué datos están realmente disponibles en la base de datos en vivo.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Test Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {testCodes.map((test) => (
            <Card key={`${test.rut}-${test.code}-${test.era}`} className="cursor-pointer hover:shadow-md transition-shadow">
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
                  <Badge variant={test.era === "Actual" ? "default" : "secondary"} className="mt-2">
                    Era: {test.era}
                  </Badge>
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
              <span>Consultando base de datos de {currentEnvironment}...</span>
            </CardContent>
          </Card>
        )}

        {/* Error State - Not Found */}
        {error && (
          <Card className="mb-6 border-red-200">
            <CardHeader>
              <CardTitle className="text-red-700 flex items-center">
                <XCircle className="h-5 w-5 mr-2" />
                Registro No Encontrado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-600 mb-4">
                Este código no existe en la base de datos de {currentEnvironment}.
              </p>
              {currentEnvironment === "production" && (
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-red-700 font-medium mb-2">Posibles causas en producción:</p>
                  <ul className="text-red-600 text-sm space-y-1">
                    <li>• El registro tiene un RUT diferente (datos anteriores sin actualizar)</li>
                    <li>• El backend no se ha desplegado con los cambios recientes</li>
                    <li>• La base de datos no está sincronizada con desarrollo</li>
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Success State */}
        {trackingData && !isLoading && (
          <Card className="mb-6 border-green-200">
            <CardHeader>
              <CardTitle className="text-green-700 flex items-center">
                <CheckCircle className="h-5 w-5 mr-2" />
                ¡Registro Encontrado en {currentEnvironment}!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Estado</label>
                  <div className="flex items-center mt-1">
                    <Badge className="flex items-center">
                      <span>{trackingData.status}</span>
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Código</label>
                  <p className="font-mono text-lg">{trackingData.trackingCode}</p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-green-600 font-medium">
                  ✅ Este código funciona correctamente en {currentEnvironment}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Interpretación de Resultados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="font-medium text-green-700">Si encuentra registros:</h4>
                <ul className="text-sm text-green-600 space-y-1">
                  <li>• El sistema está funcionando correctamente</li>
                  <li>• La base de datos tiene los datos esperados</li>
                  <li>• El tracking funciona para ese código específico</li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium text-red-700">Si NO encuentra registros:</h4>
                <ul className="text-sm text-red-600 space-y-1">
                  <li>• Los datos no existen en esta base de datos</li>
                  <li>• Puede ser un RUT diferente al esperado</li>
                  <li>• Necesita sincronización/deployment</li>
                </ul>
              </div>
            </div>

            {currentEnvironment === "production" && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-blue-700 font-medium mb-2">Recomendación para Producción:</p>
                <p className="text-blue-600 text-sm">
                  Si los códigos fallan en producción pero funcionan en desarrollo, 
                  necesitas hacer un deployment para sincronizar la base de datos.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}