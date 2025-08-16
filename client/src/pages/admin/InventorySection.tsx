import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Package2, 
  Search, 
  Settings,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Inventory } from "@shared/schema";

const STATUS_COLORS = {
  disponible: "bg-green-100 text-green-800",
  alquilada: "bg-yellow-100 text-yellow-800",
  mantenimiento: "bg-blue-100 text-blue-800",
  dañada: "bg-red-100 text-red-800"
};

const STATUS_LABELS = {
  disponible: "Disponible",
  alquilada: "Arrendada",
  mantenimiento: "Mantenimiento",
  dañada: "Dañada"
};

const TYPE_LABELS = {
  caja: "Caja",
  base_movil: "Base Móvil",
  carro_plegable: "Carro de Transporte",
  correa_amarre: "Cinta de Amarre"
};

const TYPE_ICONS = {
  caja: "📦",
  base_movil: "🔧",
  carro_plegable: "🛒",
  correa_amarre: "🔗"
};

export function InventorySection() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("todos");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState("todos");
  const itemsPerPage = 20;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Obtener inventario
  const { data: inventory = [], isLoading } = useQuery({
    queryKey: ["/api/inventory"],
    queryFn: async () => {
      const response = await fetch("/api/inventory");
      if (!response.ok) throw new Error("Error al cargar inventario");
      return response.json();
    }
  });

  // Filtrar inventario
  const filteredInventory = inventory.filter((item: Inventory) => {
    const matchesSearch = item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         TYPE_LABELS[item.type as keyof typeof TYPE_LABELS].toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = activeTab === "todos" || item.type === activeTab;
    const matchesStatus = filterStatus === "todos" || item.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  // Paginación
  const totalPages = Math.ceil(filteredInventory.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedInventory = filteredInventory.slice(startIndex, startIndex + itemsPerPage);

  // Reset página cuando cambian filtros
  const resetPagination = () => {
    setCurrentPage(1);
  };

  // Estadísticas del inventario
  const stats = {
    total: inventory.length,
    disponible: inventory.filter((item: Inventory) => item.status === "disponible").length,
    arrendada: inventory.filter((item: Inventory) => item.status === "alquilada").length,
    mantenimiento: inventory.filter((item: Inventory) => item.status === "mantenimiento").length,
    dañada: inventory.filter((item: Inventory) => item.status === "dañada").length
  };

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await fetch(`/api/inventory/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (!response.ok) throw new Error("Error al actualizar estado");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      toast({ title: "Estado actualizado correctamente" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Package2 className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Cargando inventario...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gestión de Inventario</h2>
          <p className="text-gray-600">Control total de cajas y accesorios</p>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Items</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.disponible}</div>
            <div className="text-sm text-gray-600">Disponibles</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.arrendada}</div>
            <div className="text-sm text-gray-600">Arrendadas</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.mantenimiento}</div>
            <div className="text-sm text-gray-600">Mantenimiento</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.dañada}</div>
            <div className="text-sm text-gray-600">Dañadas</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs por Categoría */}
      <Tabs value={activeTab} onValueChange={(value) => { setActiveTab(value); resetPagination(); }} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="todos">Todos ({inventory.length})</TabsTrigger>
          <TabsTrigger value="caja">📦 Cajas ({inventory.filter(i => i.type === 'caja').length})</TabsTrigger>
          <TabsTrigger value="base_movil">🔧 Bases ({inventory.filter(i => i.type === 'base_movil').length})</TabsTrigger>
          <TabsTrigger value="carro_plegable">🛒 Carros ({inventory.filter(i => i.type === 'carro_plegable').length})</TabsTrigger>
          <TabsTrigger value="correa_amarre">🔗 Cintas ({inventory.filter(i => i.type === 'correa_amarre').length})</TabsTrigger>
        </TabsList>

        {/* Filtros */}
        <Card className="mt-4">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Buscar por código</label>
                <Input
                  placeholder="CAJ001, BA001, CP001..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); resetPagination(); }}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Estado</label>
                <select
                  value={filterStatus}
                  onChange={(e) => { setFilterStatus(e.target.value); resetPagination(); }}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="todos">Todos los estados</option>
                  <option value="disponible">Disponible</option>
                  <option value="alquilada">Arrendada</option>
                  <option value="mantenimiento">Mantenimiento</option>
                  <option value="dañada">Dañada</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contenido por Tab */}
        <TabsContent value={activeTab} className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>
                {activeTab === "todos" ? "Todo el Inventario" : TYPE_LABELS[activeTab as keyof typeof TYPE_LABELS]} 
                ({filteredInventory.length} items)
              </CardTitle>
              
              {/* Paginación en header */}
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm">
                    Página {currentPage} de {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {filteredInventory.length === 0 ? (
                <div className="text-center py-8">
                  <Package2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No se encontraron items con los filtros actuales</p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Notas</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedInventory.map((item: Inventory) => (
                        <TableRow key={item.id} className="hover:bg-gray-50">
                          <TableCell>
                            <div className="font-bold text-base">{item.code}</div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{TYPE_ICONS[item.type as keyof typeof TYPE_ICONS]}</span>
                              <span className="text-sm font-medium">
                                {TYPE_LABELS[item.type as keyof typeof TYPE_LABELS]}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={STATUS_COLORS[item.status as keyof typeof STATUS_COLORS]}>
                              {STATUS_LABELS[item.status as keyof typeof STATUS_LABELS]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {item.notes ? (
                              <span className="text-sm text-gray-600">{item.notes}</span>
                            ) : (
                              <span className="text-xs text-gray-400">Sin notas</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const newStatus = item.status === "disponible" ? "mantenimiento" : "disponible";
                                updateStatusMutation.mutate({ id: item.id, status: newStatus });
                              }}
                              disabled={updateStatusMutation.isPending}
                            >
                              <Settings className="h-3 w-3 mr-1" />
                              {item.status === "disponible" ? "Mantenimiento" : "Disponible"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  {/* Paginación al final */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-sm text-gray-600">
                        Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, filteredInventory.length)} de {filteredInventory.length} items
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Anterior
                        </Button>
                        
                        {/* Números de página */}
                        <div className="flex gap-1">
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                            return (
                              <Button
                                key={pageNum}
                                variant={currentPage === pageNum ? "default" : "outline"}
                                size="sm"
                                onClick={() => setCurrentPage(pageNum)}
                                className="w-8 h-8 p-0"
                              >
                                {pageNum}
                              </Button>
                            );
                          })}
                        </div>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                        >
                          Siguiente
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}