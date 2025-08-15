import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import type { Box, InsertBox } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import InventoryStatusBadge from "@/components/inventory-status-badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Search, Plus, QrCode, Package, Grid3X3, List, Filter } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BarcodeScanner from "@/components/barcode-scanner";

export default function AdminInventory() {
  const { toast } = useToast();
  const { user, isLoading } = useCurrentUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [sortBy, setSortBy] = useState<"barcode" | "status" | "condition" | "createdAt">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showScanner, setShowScanner] = useState(false);
  const [showNewBoxDialog, setShowNewBoxDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingBox, setEditingBox] = useState<Box | null>(null);
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
    // Formato estándar: AC + año (2 dígitos) + mes + día + número secuencial (4 dígitos)
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const sequence = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    
    // AC = Arriendo Cajas
    const barcode = `AC${year}${month}${day}${sequence}`;
    setNewBox({ ...newBox, barcode });
  };

  // Update box mutation
  const updateBoxMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertBox> }) => {
      const response = await apiRequest("PUT", `/api/boxes/${id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/boxes"] });
      setShowEditDialog(false);
      setEditingBox(null);
      toast({
        title: "Caja actualizada",
        description: "Los cambios se han guardado correctamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error al actualizar caja",
        description: error.message || "Hubo un problema al actualizar la caja",
        variant: "destructive",
      });
    },
  });

  const handleEditBox = (box: Box) => {
    setEditingBox(box);
    setShowEditDialog(true);
  };

  const handleUpdateBox = () => {
    if (!editingBox) return;

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

    // Reverse mapping for display
    const currentDisplaySize = editingBox.size === 'medium' ? 'mediano' : 
                               editingBox.size === 'small' ? 'pequeño' : 'grande';
    const currentDisplayCondition = editingBox.condition === 'excellent' ? 'nuevo' : 
                                    editingBox.condition === 'good' ? 'usado' : 'dañado';

    updateBoxMutation.mutate({
      id: editingBox.id,
      data: {
        barcode: editingBox.barcode,
        size: sizeMapping[currentDisplaySize as keyof typeof sizeMapping] as "small" | "medium" | "large",
        condition: conditionMapping[currentDisplayCondition as keyof typeof conditionMapping] as "excellent" | "good" | "fair" | "needs_repair"
      }
    });
  };

  // Filter and sort boxes
  const filteredAndSortedBoxes = (() => {
    if (!boxes) return [];
    
    // Filter by search query
    let filtered = boxes.filter((box) => 
      searchQuery === "" || 
      box.barcode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      box.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(box => box.status === statusFilter);
    }
    
    // Sort
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'barcode':
          aValue = a.barcode || '';
          bValue = b.barcode || '';
          break;
        case 'status':
          aValue = a.status || '';
          bValue = b.status || '';
          break;
        case 'condition':
          const conditionOrder = { excellent: 4, good: 3, fair: 2, needs_repair: 1 };
          aValue = conditionOrder[a.condition as keyof typeof conditionOrder] || 0;
          bValue = conditionOrder[b.condition as keyof typeof conditionOrder] || 0;
          break;
        case 'createdAt':
        default:
          aValue = new Date(a.createdAt || '').getTime();
          bValue = new Date(b.createdAt || '').getTime();
          break;
      }
      
      if (typeof aValue === 'string') {
        return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });
    
    return filtered;
  })();

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

            {/* Tabs */}
            <Tabs defaultValue="boxes" className="mb-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="boxes" className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Cajas
                </TabsTrigger>
                <TabsTrigger value="codes" className="flex items-center gap-2">
                  <QrCode className="h-4 w-4" />
                  Códigos de Cajas
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="boxes">
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
                        <SelectItem value="available">🟢 Disponible</SelectItem>
                        <SelectItem value="rented">🔵 Arrendadas</SelectItem>
                        <SelectItem value="maintenance">🟡 Mantenimiento</SelectItem>
                        <SelectItem value="damaged">🔴 Con Problemas</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    {/* Sort */}
                    <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
                      const [field, order] = value.split('-');
                      setSortBy(field as typeof sortBy);
                      setSortOrder(order as typeof sortOrder);
                    }}>
                      <SelectTrigger className="w-full sm:w-48">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Ordenar por" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="createdAt-desc">Más recientes</SelectItem>
                        <SelectItem value="createdAt-asc">Más antiguos</SelectItem>
                        <SelectItem value="barcode-asc">Código A-Z</SelectItem>
                        <SelectItem value="barcode-desc">Código Z-A</SelectItem>
                        <SelectItem value="status-asc">Estado A-Z</SelectItem>
                        <SelectItem value="condition-desc">Mejor condición</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* View Toggle and Action Buttons */}
                  <div className="flex items-center gap-2">
                    {/* View Toggle */}
                    <div className="flex border rounded-lg p-1">
                      <Button
                        variant={viewMode === 'grid' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('grid')}
                        className="px-3"
                      >
                        <Grid3X3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={viewMode === 'list' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('list')}
                        className="px-3"
                      >
                        <List className="h-4 w-4" />
                      </Button>
                    </div>
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
                                placeholder="Ej: AC25010912345"
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
                            <p className="text-xs text-gray-500">
                              Formato: AC + año + mes + día + secuencial (13 dígitos total)
                            </p>
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

            {/* Inventory Content */}
            {viewMode === 'grid' ? (
              /* Grid View */
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
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
                ) : filteredAndSortedBoxes.length === 0 ? (
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
                  filteredAndSortedBoxes.map((box) => (
                    <Card key={box.id || `box-${Math.random()}`} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between mb-2">
                          <InventoryStatusBadge status={box.status as "available" | "no_disponible" | "maintenance" | "damaged"} />
                        </div>
                        
                        <div className="mb-3">
                          <p className="text-xs text-gray-600">Código</p>
                          <p className="text-sm font-semibold text-gray-900 truncate">{box.barcode}</p>
                        </div>
                        
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Tamaño:</span>
                            <span className="font-medium">60x40 cms</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Condición:</span>
                            <span className="font-medium">
                              {box.condition === 'excellent' ? 'Excelente' : 
                               box.condition === 'good' ? 'Buena' :
                               box.condition === 'fair' ? 'Regular' : 'Necesita reparación'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="mt-3 flex gap-1">
                          <Button size="sm" variant="outline" className="flex-1 text-xs px-2">
                            Historial
                          </Button>
                          <Button 
                            size="sm" 
                            onClick={() => handleEditBox(box)}
                            className="flex-1 text-xs px-2 bg-brand-blue hover:bg-brand-blue text-white"
                          >
                            Editar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            ) : (
              /* List View */
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Estado</TableHead>
                      <TableHead>Código</TableHead>
                      <TableHead>Tamaño</TableHead>
                      <TableHead>Condición</TableHead>
                      <TableHead>Fecha Creación</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {boxesLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                          <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                          <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                          <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                          <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                          <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                        </TableRow>
                      ))
                    ) : filteredAndSortedBoxes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12">
                          <div className="flex flex-col items-center">
                            <Package className="h-12 w-12 text-gray-400 mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                              No se encontraron cajas
                            </h3>
                            <p className="text-gray-600">
                              {searchQuery || statusFilter !== "all" 
                                ? "Intenta ajustar tus filtros de búsqueda"
                                : "Comienza agregando cajas al inventario"
                              }
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredAndSortedBoxes.map((box) => (
                        <TableRow key={box.id}>
                          <TableCell>
                            <InventoryStatusBadge status={box.status as "available" | "no_disponible" | "maintenance" | "damaged"} />
                          </TableCell>
                          <TableCell className="font-mono text-sm">{box.barcode}</TableCell>
                          <TableCell>
                            <span className="text-sm">
                              {box.size === 'small' ? 'Pequeño' : 
                               box.size === 'medium' ? 'Mediano (60x40)' : 'Grande'} 
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={
                              box.condition === 'excellent' ? 'bg-green-100 text-green-800' :
                              box.condition === 'good' ? 'bg-blue-100 text-blue-800' :
                              box.condition === 'fair' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }>
                              {box.condition === 'excellent' ? 'Excelente' : 
                               box.condition === 'good' ? 'Buena' :
                               box.condition === 'fair' ? 'Regular' : 'Necesita reparación'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {box.createdAt ? new Date(box.createdAt).toLocaleDateString() : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button size="sm" variant="outline" className="text-xs">
                                Historial
                              </Button>
                              <Button 
                                size="sm" 
                                onClick={() => handleEditBox(box)}
                                className="text-xs bg-brand-blue hover:bg-brand-blue text-white"
                              >
                                Editar
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </Card>
            )}

            {/* Summary */}
            {!boxesLoading && filteredAndSortedBoxes.length > 0 && (
              <Card className="mt-6">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <p className="text-sm text-gray-600">
                      Mostrando {filteredAndSortedBoxes.length} de {boxes?.length || 0} cajas
                      {statusFilter !== "all" && ` con estado "${statusFilter}"`}
                    </p>
                    
                    {/* Quick Stats */}
                    <div className="flex gap-4 text-xs">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Disponible: {boxes?.filter(b => b.status === 'available').length || 0}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span>No Disponible: {boxes?.filter(b => b.status === 'no_disponible').length || 0}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <span>Mantenimiento: {boxes?.filter(b => b.status === 'maintenance').length || 0}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
              </TabsContent>
              
              <TabsContent value="codes">
                <Card>
                  <CardHeader>
                    <CardTitle>Códigos de Cajas</CardTitle>
                    <CardDescription>
                      Gestión de códigos de barras y códigos maestros para arriendos
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <QrCode className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Funcionalidad de códigos de cajas disponible aquí</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </div>
      
      <MobileNav role="admin" />

      {showScanner && (
        <BarcodeScanner
          onScan={handleScanSuccess}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* Edit Box Dialog */}
      {editingBox && (
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Caja</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-barcode">Código de Barras</Label>
                <Input
                  id="edit-barcode"
                  value={editingBox.barcode}
                  onChange={(e) => setEditingBox({ ...editingBox, barcode: e.target.value })}
                  placeholder="Código de barras"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-size">Tamaño</Label>
                <Select 
                  value={editingBox.size === 'medium' ? 'mediano' : editingBox.size === 'small' ? 'pequeño' : 'grande'} 
                  onValueChange={(value) => {
                    const sizeMap = { 'pequeño': 'small', 'mediano': 'medium', 'grande': 'large' };
                    setEditingBox({ ...editingBox, size: sizeMap[value as keyof typeof sizeMap] as any });
                  }}
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
                <Label htmlFor="edit-condition">Condición</Label>
                <Select 
                  value={editingBox.condition === 'excellent' ? 'nuevo' : editingBox.condition === 'good' ? 'usado' : 'dañado'} 
                  onValueChange={(value) => {
                    const conditionMap = { 'nuevo': 'excellent', 'usado': 'good', 'dañado': 'needs_repair' };
                    setEditingBox({ ...editingBox, condition: conditionMap[value as keyof typeof conditionMap] as any });
                  }}
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
                  onClick={() => {
                    setShowEditDialog(false);
                    setEditingBox(null);
                  }}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleUpdateBox}
                  disabled={updateBoxMutation.isPending}
                  className="flex-1 bg-brand-blue hover:bg-brand-blue text-white"
                >
                  {updateBoxMutation.isPending ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
