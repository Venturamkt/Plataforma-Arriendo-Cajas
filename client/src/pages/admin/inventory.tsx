import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import type { Box, InsertBox } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import BoxStatusBadge from "@/components/box-status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, Plus, QrCode, Package } from "lucide-react";
import BarcodeScanner from "@/components/barcode-scanner";

export default function AdminInventory() {
  const { toast } = useToast();
  const { user, isLoading } = useCurrentUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showScanner, setShowScanner] = useState(false);
  const [showNewBoxDialog, setShowNewBoxDialog] = useState(false);
  const [newBox, setNewBox] = useState({
    barcode: "",
    size: "mediano",
    condition: "nuevo",
    status: "available"
  });

  // Redirect to home if not authenticated
  useEffect(() => {
    if (isLoading) return;
    if (!user || user.type !== 'admin') {
      window.location.href = "/";
      return;
    }
  }, [user, isLoading]);

  const { data: boxes, isLoading: boxesLoading } = useQuery<Box[]>({
    queryKey: ["/api/boxes", statusFilter !== "all" ? `?status=${statusFilter}` : ""],
    retry: false,
    enabled: !!user,
  });

  const handleScanSuccess = (barcode: string) => {
    setShowScanner(false);
    setSearchQuery(barcode);
  };

  // Create box mutation
  const createBoxMutation = useMutation({
    mutationFn: async (boxData: InsertBox) => {
      const response = await apiRequest("POST", "/api/boxes", boxData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/boxes"] });
      setShowNewBoxDialog(false);
      setNewBox({
        barcode: "",
        size: "mediano", 
        condition: "nuevo",
        status: "available"
      });
      toast({
        title: "Caja creada",
        description: "La nueva caja se ha agregado al inventario correctamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error al crear caja",
        description: error.message || "Hubo un problema al agregar la caja",
        variant: "destructive",
      });
    },
  });

  const handleCreateBox = () => {
    if (!newBox.barcode.trim()) {
      toast({
        title: "Error de validación",
        description: "El código de barras es obligatorio",
        variant: "destructive",
      });
      return;
    }

    // Map frontend values to schema enum values
    const sizeMapping = {
      "pequeño": "small",
      "mediano": "medium", 
      "grande": "large"
    };
    
    const conditionMapping = {
      "nuevo": "excellent",
      "usado": "good",
      "dañado": "needs_repair"
    };

    createBoxMutation.mutate({
      barcode: newBox.barcode.trim(),
      size: sizeMapping[newBox.size as keyof typeof sizeMapping] as "small" | "medium" | "large",
      condition: conditionMapping[newBox.condition as keyof typeof conditionMapping] as "excellent" | "good" | "fair" | "needs_repair",
      status: "available"
    });
  };

  const generateBarcode = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const barcode = `CJ${timestamp}${random}`;
    setNewBox({ ...newBox, barcode });
  };

  const filteredBoxes = boxes?.filter((box) => 
    searchQuery === "" || 
    box.barcode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    box.id.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue"></div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <Header />
        
        <div className="flex">
          <Sidebar role={'admin'} />
          
          <main className="flex-1 p-4 lg:p-8 pb-20 lg:pb-8">
            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                Inventario de Cajas
              </h1>
              <p className="text-gray-600">
                Gestiona el inventario completo de cajas plásticas
              </p>
            </div>

            {/* Filters and Actions */}
            <Card className="mb-6">
              <CardHeader>
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex flex-col sm:flex-row gap-4 flex-1">
                    {/* Search */}
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Buscar por código de barras o ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    
                    {/* Status Filter */}
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full sm:w-48">
                        <SelectValue placeholder="Filtrar por estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los estados</SelectItem>
                        <SelectItem value="available">Disponible</SelectItem>
                        <SelectItem value="pendiente">Pendiente</SelectItem>
                        <SelectItem value="pagada">Pagada</SelectItem>
                        <SelectItem value="entregada">Entregada</SelectItem>
                        <SelectItem value="retirada">Retirada</SelectItem>
                        <SelectItem value="finalizado">Finalizado</SelectItem>
                        <SelectItem value="cancelada">Cancelada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setShowScanner(true)}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <QrCode className="h-4 w-4" />
                      Escanear
                    </Button>
                    <Dialog open={showNewBoxDialog} onOpenChange={setShowNewBoxDialog}>
                      <DialogTrigger asChild>
                        <Button className="bg-brand-red hover:bg-brand-red text-white flex items-center gap-2">
                          <Plus className="h-4 w-4" />
                          Nueva Caja
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Agregar Nueva Caja</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="barcode">Código de Barras</Label>
                            <div className="flex gap-2">
                              <Input
                                id="barcode"
                                placeholder="Ej: CJ001234567"
                                value={newBox.barcode}
                                onChange={(e) => setNewBox({ ...newBox, barcode: e.target.value })}
                                className="flex-1"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                onClick={generateBarcode}
                                className="px-3"
                              >
                                Generar
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="size">Tamaño</Label>
                            <Select 
                              value={newBox.size} 
                              onValueChange={(value) => setNewBox({ ...newBox, size: value })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pequeño">Pequeño</SelectItem>
                                <SelectItem value="mediano">Mediano (60x40 cms)</SelectItem>
                                <SelectItem value="grande">Grande</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="condition">Condición</Label>
                            <Select 
                              value={newBox.condition} 
                              onValueChange={(value) => setNewBox({ ...newBox, condition: value })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="nuevo">Nuevo</SelectItem>
                                <SelectItem value="usado">Usado</SelectItem>
                                <SelectItem value="dañado">Dañado</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="flex gap-2 pt-4">
                            <Button
                              variant="outline"
                              onClick={() => setShowNewBoxDialog(false)}
                              className="flex-1"
                            >
                              Cancelar
                            </Button>
                            <Button
                              onClick={handleCreateBox}
                              disabled={createBoxMutation.isPending}
                              className="flex-1 bg-brand-red hover:bg-brand-red text-white"
                            >
                              {createBoxMutation.isPending ? "Creando..." : "Crear Caja"}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Inventory Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {boxesLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-6 bg-gray-200 rounded mb-3"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </CardContent>
                  </Card>
                ))
              ) : filteredBoxes.length === 0 ? (
                <div className="col-span-full">
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Package className="h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        No se encontraron cajas
                      </h3>
                      <p className="text-gray-600 text-center">
                        {searchQuery || statusFilter !== "all" 
                          ? "Intenta ajustar tus filtros de búsqueda"
                          : "Comienza agregando cajas al inventario"
                        }
                      </p>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                filteredBoxes.map((box) => (
                  <Card key={box.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-sm text-gray-600">Código</p>
                          <p className="font-semibold text-gray-900">{box.barcode}</p>
                        </div>
                        <BoxStatusBadge status={box.status} />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Tamaño:</span>
                          <span className="text-sm font-medium capitalize">{box.size}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Condición:</span>
                          <span className="text-sm font-medium capitalize">{box.condition}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Actualizado:</span>
                          <span className="text-sm text-gray-500">
                            {new Date(box.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1">
                          Ver Historial
                        </Button>
                        <Button size="sm" className="bg-brand-blue hover:bg-brand-blue text-white">
                          Editar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Summary */}
            {!boxesLoading && filteredBoxes.length > 0 && (
              <Card className="mt-6">
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600">
                    Mostrando {filteredBoxes.length} de {boxes?.length || 0} cajas
                    {statusFilter !== "all" && ` con estado "${statusFilter}"`}
                  </p>
                </CardContent>
              </Card>
            )}
          </main>
        </div>
        
        <MobileNav role={'admin'} />
      </div>

      {showScanner && (
        <BarcodeScanner
          onScan={handleScanSuccess}
          onClose={() => setShowScanner(false)}
        />
      )}
    </>
  );
}
