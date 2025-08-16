import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Package2, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  AlertCircle,
  CheckCircle,
  Settings,
  QrCode
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
  const [filterType, setFilterType] = useState<string>("todos");
  const [filterStatus, setFilterStatus] = useState<string>("todos");
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
    const matchesType = filterType === "todos" || item.type === filterType;
    const matchesStatus = filterStatus === "todos" || item.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

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

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="h-5 w-5 mr-2" />
            Filtros y Búsqueda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Buscar por código</label>
              <Input
                placeholder="CAJ001, BA001, CP001..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Tipo</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="todos">Todos los tipos</option>
                <option value="caja">Cajas</option>
                <option value="base_movil">Bases Móviles</option>
                <option value="carro_plegable">Carros de Transporte</option>
                <option value="correa_amarre">Cintas de Amarre</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Estado</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
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

      {/* Inventario por Categorías */}
      {["caja", "base_movil", "carro_plegable", "correa_amarre"].map((categoryType) => {
        const categoryItems = filteredInventory.filter((item: Inventory) => item.type === categoryType);
        const categoryStats = {
          total: categoryItems.length,
          disponible: categoryItems.filter(item => item.status === "disponible").length,
          arrendada: categoryItems.filter(item => item.status === "alquilada").length,
          mantenimiento: categoryItems.filter(item => item.status === "mantenimiento").length,
          dañada: categoryItems.filter(item => item.status === "dañada").length
        };

        if (categoryItems.length === 0 && filterType !== "todos" && filterType !== categoryType) {
          return null;
        }

        return (
          <Card key={categoryType}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">{TYPE_ICONS[categoryType as keyof typeof TYPE_ICONS]}</span>
                {TYPE_LABELS[categoryType as keyof typeof TYPE_LABELS]} ({categoryItems.length} items)
              </CardTitle>
              <div className="flex gap-4 text-sm">
                <span className="text-green-600">Disponibles: {categoryStats.disponible}</span>
                <span className="text-yellow-600">Arrendadas: {categoryStats.arrendada}</span>
                <span className="text-blue-600">Mantenimiento: {categoryStats.mantenimiento}</span>
                <span className="text-red-600">Dañadas: {categoryStats.dañada}</span>
              </div>
            </CardHeader>
            <CardContent>
              {categoryItems.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-gray-500">No hay items de esta categoría con los filtros actuales</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Notas</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categoryItems.map((item: Inventory) => (
                      <TableRow key={item.id} className="hover:bg-gray-50">
                        <TableCell>
                          <div className="font-bold text-base">{item.code}</div>
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
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}