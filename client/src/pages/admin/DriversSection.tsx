import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Truck, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Phone,
  Mail,
  User,
  CheckCircle,
  XCircle,
  TrendingUp
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Driver } from "@shared/schema";

export function DriversSection() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showDriverForm, setShowDriverForm] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    isActive: true
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Obtener repartidores
  const { data: drivers = [], isLoading } = useQuery({
    queryKey: ["/api/drivers"],
    queryFn: async () => {
      const response = await fetch("/api/drivers");
      if (!response.ok) throw new Error("Error al cargar repartidores");
      return response.json();
    }
  });

  // Filtrar repartidores
  const filteredDrivers = drivers.filter((driver: Driver) => 
    driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.phone.includes(searchTerm)
  );

  // Estadísticas de repartidores
  const stats = {
    total: drivers.length,
    active: drivers.filter((d: Driver) => d.isActive).length,
    inactive: drivers.filter((d: Driver) => !d.isActive).length
  };

  // Crear/actualizar repartidor
  const saveDriverMutation = useMutation({
    mutationFn: async (driverData: any) => {
      const url = editingDriver ? `/api/drivers/${editingDriver.id}` : "/api/drivers";
      const method = editingDriver ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(driverData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al guardar repartidor");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/drivers"] });
      toast({ 
        title: editingDriver ? "Repartidor actualizado" : "Repartidor creado",
        description: "Los datos se guardaron correctamente"
      });
      closeForm();
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  });

  // Eliminar repartidor
  const deleteDriverMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/drivers/${id}`, { method: "DELETE" });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al eliminar repartidor");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/drivers"] });
      toast({ title: "Repartidor eliminado correctamente" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  });

  const openForm = (driver?: Driver) => {
    if (driver) {
      setEditingDriver(driver);
      setFormData({
        name: driver.name,
        email: driver.email,
        phone: driver.phone,
        isActive: driver.isActive ?? true
      });
    } else {
      setEditingDriver(null);
      setFormData({
        name: "",
        email: "",
        phone: "",
        isActive: true
      });
    }
    setShowDriverForm(true);
  };

  const closeForm = () => {
    setShowDriverForm(false);
    setEditingDriver(null);
    setFormData({
      name: "",
      email: "",
      phone: "",
      isActive: true
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim()) {
      toast({ 
        title: "Error", 
        description: "Todos los campos son requeridos", 
        variant: "destructive" 
      });
      return;
    }
    saveDriverMutation.mutate(formData);
  };

  const handleDelete = (driver: Driver) => {
    if (window.confirm(`¿Estás seguro de eliminar al repartidor ${driver.name}?`)) {
      deleteDriverMutation.mutate(driver.id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Truck className="h-8 w-8 animate-pulse mx-auto mb-2" />
          <p>Cargando repartidores...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gestión de Repartidores</h2>
          <p className="text-gray-600">Administra el equipo de reparto y asignaciones</p>
        </div>
        <Button 
          onClick={() => openForm()} 
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Repartidor
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Repartidores</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <div className="text-sm text-gray-600">Activos</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.inactive}</div>
            <div className="text-sm text-gray-600">Inactivos</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="h-5 w-5 mr-2" />
            Buscar Repartidores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Buscar por nombre, email o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </CardContent>
      </Card>

      {/* Lista de Repartidores */}
      <Card>
        <CardHeader>
          <CardTitle>
            Repartidores ({filteredDrivers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredDrivers.length === 0 ? (
            <div className="text-center py-8">
              <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                {searchTerm ? "No se encontraron repartidores con ese criterio" : "No hay repartidores registrados"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Repartidor</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha de Registro</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDrivers.map((driver: Driver) => (
                  <TableRow key={driver.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-full">
                          <User className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-semibold">{driver.name}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-3 w-3 text-gray-400" />
                          {driver.email}
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-3 w-3 text-gray-400" />
                          {driver.phone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={driver.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                        {driver.isActive ? (
                          <><CheckCircle className="h-3 w-3 mr-1" /> Activo</>
                        ) : (
                          <><XCircle className="h-3 w-3 mr-1" /> Inactivo</>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {driver.createdAt ? new Date(driver.createdAt).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openForm(driver)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(driver)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Formulario de Repartidor */}
      <Dialog open={showDriverForm} onOpenChange={setShowDriverForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingDriver ? "Editar Repartidor" : "Nuevo Repartidor"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Nombre completo</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Juan Pérez"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Email</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="juan@ejemplo.com"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Teléfono</label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="+56912345678"
                required
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                className="rounded"
              />
              <label htmlFor="isActive" className="text-sm font-medium">
                Repartidor activo
              </label>
            </div>
            <div className="flex gap-2 pt-4">
              <Button 
                type="submit" 
                disabled={saveDriverMutation.isPending}
                className="flex-1"
              >
                {saveDriverMutation.isPending ? "Guardando..." : editingDriver ? "Actualizar" : "Crear"}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={closeForm}
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}