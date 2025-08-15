import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, QrCode, Package, Search, CheckCircle, AlertCircle, Scan, Copy } from 'lucide-react';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import Sidebar from '@/components/layout/sidebar';
import MobileNav from '@/components/layout/mobile-nav';
import type { Rental } from '@shared/schema';

function BoxCodesPage() {
  const [scanCode, setScanCode] = useState('');
  const [searchRental, setSearchRental] = useState('');
  const { toast } = useToast();

  const { data: rentals, isLoading: rentalsLoading } = useQuery<Rental[]>({
    queryKey: ['/api/rentals']
  });

  const { data: inventory } = useQuery<any[]>({
    queryKey: ['/api/inventory']
  });

  // Scan master code mutation
  const scanMutation = useMutation({
    mutationFn: async (masterCode: string) => {
      const response = await fetch(`/api/scan/master/${masterCode}`, {
        method: 'POST'
      });
      if (!response.ok) {
        throw new Error('Código maestro no encontrado');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Escaneo exitoso',
        description: `Se encontró el arriendo ${data.rentalId} con ${data.boxCount} cajas`
      });
      queryClient.invalidateQueries({ queryKey: ['/api/rentals'] });
    },
    onError: (error) => {
      toast({
        title: 'Error de escaneo',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const handleScan = () => {
    if (!scanCode.trim()) {
      toast({
        title: 'Error',
        description: 'Por favor ingresa un código para escanear',
        variant: 'destructive'
      });
      return;
    }
    scanMutation.mutate(scanCode.trim());
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copiado',
      description: 'Código copiado al portapapeles'
    });
  };

  const rentalsWithCodes = rentals?.filter(r => r.assignedBoxCodes && r.masterCode) || [];
  const paidRentals = rentals?.filter(r => r.status === 'pagada' && r.assignedBoxCodes) || [];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role="admin" />
      <div className="flex-1">
        <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Sistema de Códigos de Cajas</h1>
        <p className="text-gray-600">
          Gestiona códigos individuales y maestros para el seguimiento y escaneo masivo de cajas
        </p>
      </div>

      <Tabs defaultValue="scan" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="scan">Escanear Códigos</TabsTrigger>
          <TabsTrigger value="assigned">Códigos Asignados</TabsTrigger>
          <TabsTrigger value="master">Códigos Maestros</TabsTrigger>
          <TabsTrigger value="inventory">Inventario</TabsTrigger>
        </TabsList>

        <TabsContent value="scan" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scan className="h-5 w-5" />
                Escaneo de Códigos Maestros
              </CardTitle>
              <CardDescription>
                Escanea un código maestro para ver todas las cajas de un arriendo de una vez
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="scan-input">Código Maestro</Label>
                  <Input
                    id="scan-input"
                    value={scanCode}
                    onChange={(e) => setScanCode(e.target.value)}
                    placeholder="Ej: 0939-TR123456"
                    onKeyDown={(e) => e.key === 'Enter' && handleScan()}
                  />
                </div>
                <div className="flex items-end">
                  <Button 
                    onClick={handleScan}
                    disabled={scanMutation.isPending}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {scanMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Escaneando...
                      </>
                    ) : (
                      <>
                        <QrCode className="mr-2 h-4 w-4" />
                        Escanear
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Los códigos maestros combinan los últimos 4 dígitos del RUT del cliente con el código de seguimiento (Ej: 0939-TR123456)
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assigned" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Arriendos con Códigos Asignados</CardTitle>
              <CardDescription>
                Lista de arriendos que tienen códigos de cajas asignados
              </CardDescription>
            </CardHeader>
            <CardContent>
              {rentalsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <div className="space-y-4">
                  {paidRentals.map((rental) => (
                    <Card key={rental.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-semibold">Arriendo #{rental.id.slice(0, 8)}</h3>
                            <p className="text-sm text-gray-600">
                              Estado: <Badge variant={rental.status === 'pagada' ? 'default' : 'secondary'}>{rental.status}</Badge>
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">Cajas: {rental.totalBoxes}</p>
                            <p className="text-sm text-gray-600">Código: {rental.trackingCode}</p>
                          </div>
                        </div>

                        {rental.masterCode && (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-yellow-800">Código Maestro</p>
                                <p className="text-lg font-mono text-yellow-900">{rental.masterCode}</p>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => copyToClipboard(rental.masterCode || '')}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}

                        {rental.assignedBoxCodes && rental.assignedBoxCodes.length > 0 && (
                          <div>
                            <p className="text-sm font-medium mb-2">Códigos de Cajas Asignadas:</p>
                            <div className="grid grid-cols-3 gap-2">
                              {rental.assignedBoxCodes.map((code, index) => (
                                <div key={index} className="bg-gray-100 rounded px-3 py-1 text-sm font-mono">
                                  {code}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}

                  {paidRentals.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Package className="mx-auto h-12 w-12 mb-4 opacity-50" />
                      <p>No hay arriendos con códigos asignados</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="master" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Códigos Maestros Activos</CardTitle>
              <CardDescription>
                Lista de todos los códigos maestros generados para escaneo masivo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código Maestro</TableHead>
                    <TableHead>Arriendo</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Cajas</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rentalsWithCodes.map((rental) => (
                    <TableRow key={rental.id}>
                      <TableCell className="font-mono font-medium">
                        {rental.masterCode}
                      </TableCell>
                      <TableCell>#{rental.id.slice(0, 8)}</TableCell>
                      <TableCell>{rental.customerId}</TableCell>
                      <TableCell>{rental.totalBoxes}</TableCell>
                      <TableCell>
                        <Badge variant={rental.status === 'pagada' ? 'default' : 'secondary'}>
                          {rental.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(rental.masterCode || '')}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {rentalsWithCodes.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <QrCode className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>No hay códigos maestros generados</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Estado del Inventario</CardTitle>
              <CardDescription>
                Resumen del inventario de cajas por estado
              </CardDescription>
            </CardHeader>
            <CardContent>
              {inventory && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-medium text-green-800">Disponibles</span>
                    </div>
                    <p className="text-2xl font-bold text-green-900 mt-1">
                      {inventory.filter(box => box.status === 'available').length}
                    </p>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">Rentadas</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-900 mt-1">
                      {inventory.filter(box => box.status === 'rented').length}
                    </p>
                  </div>

                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-orange-600" />
                      <span className="text-sm font-medium text-orange-800">Mantenimiento</span>
                    </div>
                    <p className="text-2xl font-bold text-orange-900 mt-1">
                      {inventory.filter(box => box.status === 'maintenance').length}
                    </p>
                  </div>

                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                      <span className="text-sm font-medium text-red-800">Dañadas</span>
                    </div>
                    <p className="text-2xl font-bold text-red-900 mt-1">
                      {inventory.filter(box => box.status === 'damaged').length}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
        </div>
      </div>
      <MobileNav role="admin" />
    </div>
  );
}

export default BoxCodesPage;