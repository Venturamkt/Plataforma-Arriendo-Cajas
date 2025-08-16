import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Truck, CheckCircle, XCircle, Calendar, MapPin } from "lucide-react";
import type { Driver, Rental } from "@shared/schema";

interface DriverAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rental: Rental | null;
}

export function DriverAssignmentDialog({ open, onOpenChange, rental }: DriverAssignmentDialogProps) {
  const [selectedDriverId, setSelectedDriverId] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Obtener repartidores activos
  const { data: drivers = [], isLoading: driversLoading } = useQuery({
    queryKey: ["/api/drivers"],
    queryFn: async () => {
      const response = await fetch("/api/drivers");
      if (!response.ok) throw new Error("Error al cargar repartidores");
      return response.json();
    }
  });

  const activeDrivers = drivers.filter((driver: Driver) => driver.isActive);

  // Asignar repartidor
  const assignDriverMutation = useMutation({
    mutationFn: async (data: { rentalId: string; driverId: string }) => {
      const response = await fetch(`/api/rentals/${data.rentalId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          driverId: data.driverId,
          status: "programada" 
        })
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al asignar repartidor");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rentals"] });
      toast({ 
        title: "Repartidor asignado", 
        description: "El arriendo ha sido programado con éxito" 
      });
      onOpenChange(false);
      setSelectedDriverId("");
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  });

  const handleAssign = () => {
    if (!rental || !selectedDriverId) {
      toast({ 
        title: "Error", 
        description: "Selecciona un repartidor", 
        variant: "destructive" 
      });
      return;
    }
    
    assignDriverMutation.mutate({
      rentalId: rental.id,
      driverId: selectedDriverId
    });
  };

  const formatDate = (date: string | Date | null) => {
    if (!date) return "No definida";
    return new Date(date).toLocaleDateString('es-CL');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Asignar Repartidor
          </DialogTitle>
        </DialogHeader>

        {rental && (
          <div className="space-y-4">
            {/* Información del arriendo */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <h3 className="font-semibold">Detalles del Arriendo</h3>
              <div className="text-sm space-y-1">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span>Entrega: {formatDate(rental.deliveryDate)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span>{rental.deliveryAddress || "Sin dirección"}</span>
                </div>
                <div>
                  <span className="font-medium">{rental.boxQuantity} cajas</span>
                </div>
              </div>
            </div>

            {/* Selector de repartidor */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Seleccionar Repartidor
              </label>
              <Select value={selectedDriverId} onValueChange={setSelectedDriverId}>
                <SelectTrigger>
                  <SelectValue placeholder="Elige un repartidor disponible" />
                </SelectTrigger>
                <SelectContent>
                  {driversLoading ? (
                    <div className="p-2 text-center text-sm text-gray-500">
                      Cargando repartidores...
                    </div>
                  ) : activeDrivers.length === 0 ? (
                    <div className="p-2 text-center text-sm text-gray-500">
                      No hay repartidores activos
                    </div>
                  ) : (
                    activeDrivers.map((driver: Driver) => (
                      <SelectItem key={driver.id} value={driver.id}>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>{driver.name}</span>
                          <Badge variant="outline" className="ml-auto">
                            Disponible
                          </Badge>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Acciones */}
            <div className="flex gap-2 pt-4">
              <Button 
                onClick={handleAssign}
                disabled={!selectedDriverId || assignDriverMutation.isPending}
                className="flex-1"
              >
                {assignDriverMutation.isPending ? "Asignando..." : "Asignar Repartidor"}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}