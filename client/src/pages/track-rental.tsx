import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Package, MapPin, Calendar, Clock, CheckCircle2, Truck, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Rental {
  id: string;
  status: string;
  totalBoxes: number;
  dailyRate: string;
  totalAmount: string;
  guaranteeAmount: string;
  additionalProducts?: string;
  additionalProductsTotal: string;
  deliveryDate: string;
  returnDate?: string;
  deliveryAddress: string;
  pickupAddress?: string;
  notes?: string;
  trackingCode?: string;
}

function formatRut(rut: string): string {
  // Remove all non-numeric characters
  const cleanRut = rut.replace(/\D/g, '');
  
  if (cleanRut.length <= 1) return cleanRut;
  
  // Only format complete RUTs (8-9 digits)
  if (cleanRut.length < 8) return cleanRut;
  
  // Separate the main number from the check digit
  const mainNumber = cleanRut.slice(0, -1);
  const checkDigit = cleanRut.slice(-1);
  
  // Format the main number with dots
  let formatted = mainNumber.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  
  // Add the check digit with hyphen
  formatted += `-${checkDigit}`;
  
  return formatted;
}

function extractRutDigits(rut: string): string {
  // Remove all non-numeric characters
  const cleanRut = rut.replace(/\D/g, '');
  
  if (cleanRut.length < 5) return '';
  
  // Get the last 4 digits before the check digit
  // For 162209396, we want 0939 (digits 5-8 from the end, excluding check digit)
  const withoutCheckDigit = cleanRut.slice(0, -1);
  const last4 = withoutCheckDigit.slice(-4);
  return last4.padStart(4, '0');
}

export default function TrackRental() {
  const params = useParams();
  const [rawRut, setRawRut] = useState("");
  const [formattedRut, setFormattedRut] = useState("");
  const [rutDigits, setRutDigits] = useState("");
  const [trackingCode, setTrackingCode] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const handleRutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const cleanValue = value.replace(/\D/g, '');
    
    // Limit to 9 digits (8 + 1 check digit)
    if (cleanValue.length <= 9) {
      setRawRut(cleanValue);
      setFormattedRut(formatRut(cleanValue));
      
      // If user enters exactly 4 digits, use them directly as rutDigits
      if (cleanValue.length === 4) {
        setRutDigits(cleanValue);
      } else {
        setRutDigits(extractRutDigits(cleanValue));
      }
    }
  };

  // Auto-populate from URL parameters if present
  useEffect(() => {
    if (params.rut && params.code) {
      setRutDigits(params.rut);
      setTrackingCode(params.code);
      setIsSearching(true);
    }
  }, [params.rut, params.code]);

  const { data: rental, error, isLoading } = useQuery<Rental>({
    queryKey: ["/api/track", rutDigits, trackingCode],
    queryFn: () => fetch(`/api/track/${rutDigits}/${trackingCode}`).then(res => {
      if (!res.ok) throw new Error('No encontrado');
      return res.json();
    }),
    enabled: rutDigits.length === 4 && trackingCode.length >= 6,
    retry: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rawRut.length < 4 && rutDigits.length < 4) {
      alert("Ingresa al menos los últimos 4 dígitos de tu RUT");
      return;
    }
    if (trackingCode.length < 6) {
      alert("El código de seguimiento debe tener al menos 6 caracteres");
      return;
    }
    setIsSearching(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pendiente": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "pagada": return "bg-blue-100 text-blue-800 border-blue-200";
      case "entregada": return "bg-green-100 text-green-800 border-green-200";
      case "retirada": return "bg-purple-100 text-purple-800 border-purple-200";
      case "finalizado": return "bg-gray-100 text-gray-800 border-gray-200";
      case "cancelada": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pendiente": return "Pendiente de Pago";
      case "pagada": return "Pagado - Preparando Entrega";
      case "entregada": return "Cajas Entregadas";
      case "retirada": return "Cajas Retiradas";
      case "finalizado": return "Arriendo Finalizado";
      case "cancelada": return "Cancelado";
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pendiente": return <Clock className="h-4 w-4" />;
      case "pagada": return <Package className="h-4 w-4" />;
      case "entregada": return <CheckCircle2 className="h-4 w-4" />;
      case "retirada": return <Truck className="h-4 w-4" />;
      case "finalizado": return <CheckCircle2 className="h-4 w-4" />;
      case "cancelada": return <ArrowRight className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-4 lg:py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 lg:mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
            Seguimiento de Arriendo
          </h1>
          <p className="text-gray-600">
            Ingresa tus datos para ver el estado de tu arriendo de cajas
          </p>
        </div>

        {/* Search Form */}
        {!params.rut && !params.code && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-brand-blue" />
                Buscar mi Arriendo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="rut">RUT completo</Label>
                <Input
                  id="rut"
                  type="text"
                  maxLength={12}
                  value={formattedRut}
                  onChange={handleRutChange}
                  placeholder="12.345.678-9"
                  className="text-center text-lg tracking-wider"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck="false"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Ingresa tu RUT completo o solo los últimos 4 dígitos antes del guión
                </p>
              </div>

              <div>
                <Label htmlFor="trackingCode">Código de Seguimiento</Label>
                <Input
                  id="trackingCode"
                  type="text"
                  value={trackingCode}
                  onChange={(e) => setTrackingCode(e.target.value.toUpperCase())}
                  placeholder="ABC123XYZ"
                  className="text-center text-lg tracking-wider"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Este código te fue enviado al crear el arriendo
                </p>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-brand-blue hover:bg-brand-blue/90"
                disabled={isLoading || (rawRut.length < 4 && rutDigits.length < 4) || trackingCode.length < 6}
              >
                {isLoading ? "Buscando..." : "Buscar Arriendo"}
              </Button>
            </form>
          </CardContent>
        </Card>
        )}

        {/* Auto-search message for direct links */}
        {params.rut && params.code && (
          <div className="text-center mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800">
                Buscando arriendo con RUT terminado en <strong>{params.rut}</strong> y código <strong>{params.code}</strong>
              </p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>
              <strong>No se encontró ningún arriendo con estos datos.</strong>
              <br />
              <br />
              Verifica que hayas ingresado:
              <br />
              • Tu RUT completo (ejemplo: 16.220.939-6)
              <br />
              • El código de seguimiento exacto (8 caracteres, ejemplo: HO2RLARR)
              <br />
              <br />
              Si el problema persiste, contacta a: <strong>jalarcon@arriendocajas.cl</strong>
            </AlertDescription>
          </Alert>
        )}

        {/* Rental Details */}
        {rental && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Detalles del Arriendo</span>
                <div className={`px-3 py-1 rounded-full border text-sm font-medium flex items-center gap-2 ${getStatusColor(rental.status)}`}>
                  {getStatusIcon(rental.status)}
                  {getStatusText(rental.status)}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Package className="h-5 w-5 text-brand-blue" />
                  <div>
                    <p className="text-sm text-gray-500">Cantidad de Cajas</p>
                    <p className="font-semibold">{rental.totalBoxes} cajas</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-brand-blue" />
                  <div>
                    <p className="text-sm text-gray-500">Fecha de Entrega</p>
                    <p className="font-semibold">
                      {format(new Date(rental.deliveryDate), "dd 'de' MMMM, yyyy", { locale: es })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-brand-blue" />
                  <div>
                    <p className="text-sm text-gray-500">Fecha de Retiro</p>
                    <p className="font-semibold">
                      {rental.returnDate 
                        ? format(new Date(rental.returnDate), "dd 'de' MMMM, yyyy", { locale: es })
                        : "Por definir"
                      }
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Package className="h-5 w-5 text-brand-blue" />
                  <div>
                    <p className="text-sm text-gray-500">Total Arriendo</p>
                    <p className="font-semibold text-lg">${Number(rental.totalAmount).toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Package className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-sm text-gray-500">Garantía</p>
                    <p className="font-semibold">${Number(rental.guaranteeAmount).toLocaleString()}</p>
                    <p className="text-xs text-gray-500">Se devuelve al finalizar</p>
                  </div>
                </div>
              </div>

              {/* Addresses */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-brand-blue mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">Dirección de Entrega</p>
                    <p className="font-medium">{rental.deliveryAddress}</p>
                  </div>
                </div>

                {rental.pickupAddress && rental.pickupAddress !== rental.deliveryAddress && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-brand-blue mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">Dirección de Retiro</p>
                      <p className="font-medium">{rental.pickupAddress}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Status Timeline */}
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Estado del Arriendo</h4>
                <div className="space-y-2">
                  {['pendiente', 'pagada', 'entregada', 'retirada', 'finalizado'].map((status, index) => {
                    const isCompleted = ['pendiente', 'pagada', 'entregada', 'retirada', 'finalizado'].indexOf(rental.status) >= index;
                    const isCurrent = rental.status === status;
                    
                    return (
                      <div key={status} className={`flex items-center gap-3 p-2 rounded-lg ${
                        isCurrent ? 'bg-blue-50 border border-blue-200' : 
                        isCompleted ? 'bg-green-50' : 'bg-gray-50'
                      }`}>
                        <div className={`w-3 h-3 rounded-full ${
                          isCurrent ? 'bg-blue-500' :
                          isCompleted ? 'bg-green-500' : 'bg-gray-300'
                        }`} />
                        <span className={`text-sm ${
                          isCurrent ? 'font-semibold text-blue-900' :
                          isCompleted ? 'text-green-700' : 'text-gray-500'
                        }`}>
                          {getStatusText(status)}
                        </span>
                        {isCurrent && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full ml-auto">
                            Estado Actual
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Additional Products */}
              {rental.additionalProducts && JSON.parse(rental.additionalProducts).length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-2">Productos Adicionales</h4>
                  <div className="bg-green-50 p-3 rounded-lg">
                    {JSON.parse(rental.additionalProducts).map((product: any, index: number) => (
                      <div key={index} className="flex justify-between items-center py-1">
                        <span className="text-sm">{product.name} x{product.quantity}</span>
                        <span className="font-medium">${(product.price * product.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                    <div className="border-t mt-2 pt-2 flex justify-between font-semibold">
                      <span>Total Productos:</span>
                      <span>${Number(rental.additionalProductsTotal).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              {rental.notes && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-2">Notas Adicionales</h4>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{rental.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}