import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Mail, Eye, Settings, Send } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";

const statusOptions = [
  { value: "pagada", label: "📝 Pagada", color: "bg-blue-500" },
  { value: "entregada", label: "📦 Entregada", color: "bg-green-500" },
  { value: "recordatorio", label: "⏰ Recordatorio", color: "bg-orange-500" },
  { value: "retirada", label: "📤 Retirada", color: "bg-yellow-500" },
  { value: "finalizado", label: "✅ Finalizado", color: "bg-purple-500" },
  { value: "cancelada", label: "❌ Cancelada", color: "bg-red-500" }
];

export default function EmailPreview() {
  const [selectedStatus, setSelectedStatus] = useState("pagada");
  const [previewData, setPreviewData] = useState({
    customerName: "María González",
    totalBoxes: 5,
    deliveryDate: "15 de Enero, 2025",
    deliveryAddress: "Av. Providencia 1234, Providencia, Santiago",
    totalAmount: 13876,
    guaranteeAmount: 10000,
    trackingCode: "ABC12345"
  });
  const [testEmail, setTestEmail] = useState("");

  const { toast } = useToast();

  // Get email preview
  const { data: emailPreview, isLoading } = useQuery({
    queryKey: ["/api/email/preview", selectedStatus, previewData],
    queryFn: async () => {
      const response = await apiRequest("POST", "/api/email/preview", {
        status: selectedStatus,
        sampleData: previewData
      });
      return await response.text();
    },
  });

  // Check email configuration
  const { data: emailConfig } = useQuery({
    queryKey: ["/api/email/config"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/email/config");
      return await response.json();
    },
  });

  // Send test email
  const sendTestEmailMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/email/test", {
        to: testEmail,
        status: selectedStatus,
        sampleData: previewData
      });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Email de prueba enviado",
        description: `Se envió el email de prueba a ${testEmail}`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo enviar el email de prueba",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role="admin" />
      <div className="flex-1 p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Mail className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">Plantillas de Email</h1>
          <p className="text-gray-600">Previsualiza y prueba los emails automáticos</p>
        </div>
      </div>

      {/* Email Configuration Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Estado de Configuración
          </CardTitle>
        </CardHeader>
        <CardContent>
          {emailConfig ? (
            <div className="flex items-center gap-2">
              <Badge variant={emailConfig.configured ? "default" : "destructive"}>
                {emailConfig.configured ? "✅ Configurado" : "❌ No Configurado"}
              </Badge>
              <span className="text-sm text-gray-600">
                {emailConfig.configured 
                  ? "Los emails se enviarán automáticamente al cambiar estados"
                  : "Necesitas configurar EMAIL_USER y EMAIL_PASS en las variables de entorno"
                }
              </span>
            </div>
          ) : (
            <div className="text-gray-500">Verificando configuración...</div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Configuración de Vista Previa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Status Selection */}
            <div>
              <Label htmlFor="status">Estado del Email</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un estado" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sample Data */}
            <div className="space-y-3">
              <Label>Datos de Ejemplo</Label>
              
              <div>
                <Label htmlFor="customerName" className="text-xs">Nombre del Cliente</Label>
                <Input
                  id="customerName"
                  value={previewData.customerName}
                  onChange={(e) => setPreviewData({...previewData, customerName: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="totalBoxes" className="text-xs">Cajas</Label>
                  <Input
                    id="totalBoxes"
                    type="number"
                    value={previewData.totalBoxes}
                    onChange={(e) => setPreviewData({...previewData, totalBoxes: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <Label htmlFor="trackingCode" className="text-xs">Código</Label>
                  <Input
                    id="trackingCode"
                    value={previewData.trackingCode}
                    onChange={(e) => setPreviewData({...previewData, trackingCode: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="deliveryDate" className="text-xs">Fecha de Entrega</Label>
                <Input
                  id="deliveryDate"
                  value={previewData.deliveryDate}
                  onChange={(e) => setPreviewData({...previewData, deliveryDate: e.target.value})}
                />
              </div>

              <div>
                <Label htmlFor="deliveryAddress" className="text-xs">Dirección</Label>
                <Textarea
                  id="deliveryAddress"
                  value={previewData.deliveryAddress}
                  onChange={(e) => setPreviewData({...previewData, deliveryAddress: e.target.value})}
                  className="min-h-[60px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="totalAmount" className="text-xs">Total ($)</Label>
                  <Input
                    id="totalAmount"
                    type="number"
                    value={previewData.totalAmount}
                    onChange={(e) => setPreviewData({...previewData, totalAmount: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <Label htmlFor="guaranteeAmount" className="text-xs">Garantía ($)</Label>
                  <Input
                    id="guaranteeAmount"
                    type="number"
                    value={previewData.guaranteeAmount}
                    onChange={(e) => setPreviewData({...previewData, guaranteeAmount: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>
            </div>

            {/* Test Email */}
            {emailConfig?.configured && (
              <div className="pt-4 border-t">
                <Label htmlFor="testEmail">Enviar Email de Prueba</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="testEmail"
                    type="email"
                    placeholder="tu@email.com"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                  />
                  <Button
                    onClick={() => sendTestEmailMutation.mutate()}
                    disabled={!testEmail || sendTestEmailMutation.isPending}
                    size="sm"
                  >
                    <Send className="h-4 w-4 mr-1" />
                    {sendTestEmailMutation.isPending ? "..." : "Enviar"}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Vista Previa del Email
              <Badge variant="outline">
                {statusOptions.find(s => s.value === selectedStatus)?.label}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">
                Cargando vista previa...
              </div>
            ) : emailPreview ? (
              <div className="border rounded-lg">
                <iframe
                  srcDoc={emailPreview}
                  className="w-full h-96 border-0"
                  title="Email Preview"
                />
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No se pudo cargar la vista previa
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Email Templates List */}
      <Card>
        <CardHeader>
          <CardTitle>Plantillas Disponibles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {statusOptions.map((status) => (
              <div
                key={status.value}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedStatus === status.value 
                    ? "border-blue-500 bg-blue-50" 
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => setSelectedStatus(status.value)}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-3 h-3 rounded-full ${status.color}`} />
                  <span className="font-medium">{status.label}</span>
                </div>
                <div className="text-sm text-gray-600">
                  {status.value === "pagada" && "Confirmación de pago con link de seguimiento"}
                  {status.value === "entregada" && "Notificación de entrega exitosa"}
                  {status.value === "recordatorio" && "Recordatorio 2 días antes de vencimiento"}
                  {status.value === "retirada" && "Confirmación de retiro de cajas"}
                  {status.value === "finalizado" && "Arriendo completado y devolución de garantía"}
                  {status.value === "cancelada" && "Cancelación y proceso de reembolso"}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}