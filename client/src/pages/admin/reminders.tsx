import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Clock, Mail, Send, Calendar, AlertTriangle, CheckCircle } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";

export default function Reminders() {
  const [selectedDays, setSelectedDays] = useState(7);
  const { toast } = useToast();

  // Get upcoming reminders
  const { data: upcomingReminders, isLoading } = useQuery({
    queryKey: ["/api/reminders/upcoming", selectedDays],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/reminders/upcoming?days=${selectedDays}`);
      return await response.json();
    },
  });

  // Check and send reminders manually
  const checkRemindersMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/reminders/check");
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reminders/upcoming"] });
      toast({
        title: "Recordatorios procesados",
        description: "Se enviaron todos los recordatorios pendientes",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudieron procesar los recordatorios",
        variant: "destructive",
      });
    },
  });

  // Send test reminder
  const sendTestReminderMutation = useMutation({
    mutationFn: async (rentalId: string) => {
      const response = await apiRequest("POST", `/api/reminders/test/${rentalId}`);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Recordatorio enviado",
        description: "El recordatorio de prueba fue enviado exitosamente",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo enviar el recordatorio de prueba",
        variant: "destructive",
      });
    },
  });

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDaysColor = (days: number) => {
    if (days <= 0) return "bg-red-500";
    if (days <= 1) return "bg-orange-500";
    if (days <= 3) return "bg-yellow-500";
    return "bg-blue-500";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar role="admin" />
        <div className="flex-1 p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Clock className="h-8 w-8 text-orange-600" />
        <div>
          <h1 className="text-3xl font-bold">Recordatorios de Devolución</h1>
          <p className="text-gray-600">Gestión automática de recordatorios 2 días antes del vencimiento</p>
        </div>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Control de Recordatorios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex items-center gap-2">
              <label htmlFor="days" className="text-sm font-medium">Mostrar próximos:</label>
              <select
                id="days"
                value={selectedDays}
                onChange={(e) => setSelectedDays(parseInt(e.target.value))}
                className="px-3 py-1 border rounded-md text-sm"
              >
                <option value={3}>3 días</option>
                <option value={7}>7 días</option>
                <option value={14}>14 días</option>
                <option value={30}>30 días</option>
              </select>
            </div>
            
            <Button
              onClick={() => checkRemindersMutation.mutate()}
              disabled={checkRemindersMutation.isPending}
              className="bg-orange-600 hover:bg-orange-700"
            >
              <Mail className="h-4 w-4 mr-2" />
              {checkRemindersMutation.isPending ? "Procesando..." : "Enviar Recordatorios Pendientes"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Reminders */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Próximos Recordatorios
            {upcomingReminders && (
              <Badge variant="outline">
                {upcomingReminders.length} arriendos
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">
              Cargando recordatorios...
            </div>
          ) : !upcomingReminders || upcomingReminders.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay recordatorios pendientes</h3>
              <p className="text-gray-500">Todos los clientes están al día con sus arriendos.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>Cajas</TableHead>
                    <TableHead>Fecha Devolución</TableHead>
                    <TableHead>Días Restantes</TableHead>
                    <TableHead>Recordatorio</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {upcomingReminders.map((item: any) => (
                    <TableRow key={item.rental.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{item.customer?.name || 'Sin nombre'}</div>
                          <div className="text-sm text-gray-500">{item.customer?.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {item.rental.trackingCode}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {item.rental.totalBoxes}
                      </TableCell>
                      <TableCell>
                        {formatDate(item.returnDate)}
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-white ${getDaysColor(item.daysUntilReturn)}`}>
                          {item.daysUntilReturn === 0 ? "Hoy" : 
                           item.daysUntilReturn === 1 ? "1 día" :
                           `${item.daysUntilReturn} días`}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {item.daysUntilReminder === 0 ? (
                            <Badge className="bg-orange-500 text-white">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Enviar hoy
                            </Badge>
                          ) : item.daysUntilReminder === 1 ? (
                            <Badge variant="outline">
                              En 1 día
                            </Badge>
                          ) : (
                            <Badge variant="outline">
                              En {item.daysUntilReminder} días
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => sendTestReminderMutation.mutate(item.rental.id)}
                          disabled={sendTestReminderMutation.isPending}
                          className="text-xs"
                        >
                          <Send className="h-3 w-3 mr-1" />
                          Test
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Information */}
      <Card>
        <CardHeader>
          <CardTitle>¿Cómo funcionan los recordatorios?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center flex-shrink-0">
                1
              </div>
              <div>
                <p className="font-medium">Cálculo automático</p>
                <p className="text-gray-600">El sistema calcula la fecha de devolución: fecha de entrega + días de arriendo</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center flex-shrink-0">
                2
              </div>
              <div>
                <p className="font-medium">Recordatorio automático</p>
                <p className="text-gray-600">2 días antes de la fecha de devolución se envía un email recordatorio</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center flex-shrink-0">
                3
              </div>
              <div>
                <p className="font-medium">Lista de preparación</p>
                <p className="text-gray-600">El email incluye instrucciones para limpiar y preparar las cajas</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
        </div>
      </div>
    </div>
  );
}