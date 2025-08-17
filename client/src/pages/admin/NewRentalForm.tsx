import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  ArrowLeft, 
  Package2, 
  Calendar, 
  Clock, 
  DollarSign, 
  MapPin, 
  User, 
  Truck,
  ShoppingCart,
  AlertCircle,
  CheckCircle,
  Plus,
  X,
  Zap
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { 
  formatCurrency, 
  calculateGuarantee, 
  calculateReturnDate, 
  calculateTotalAmount,
  BOX_QUANTITY_SHORTCUTS,
  RENTAL_DAYS_SHORTCUTS,
  ADDITIONAL_PRODUCTS
} from "@/utils/pricing";
import { mockInventoryCheck, type InventoryCheck } from "@/utils/inventory";

export default function NewRentalForm() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    customerId: "",
    driverId: "",
    boxQuantity: "",
    rentalDays: "",
    pricePerDay: "1000",
    guaranteeAmount: "",
    totalAmount: "",
    paidAmount: "",
    deliveryDate: "",
    pickupDate: "",
    deliveryAddress: "",
    pickupAddress: "",
    notes: "",
    status: "pendiente",
    additionalProducts: [] as {name: string, quantity: number, price: number}[]
  });

  const [inventoryStatus, setInventoryStatus] = useState<InventoryCheck | null>(null);
  const [showAdditionalProducts, setShowAdditionalProducts] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // Función para recalcular valores automáticamente
  const recalculateFormData = (data: any) => {
    const boxQuantity = parseInt(data.boxQuantity) || 0;
    const rentalDays = parseInt(data.rentalDays) || 0;
    const pricePerDay = parseFloat(data.pricePerDay) || 0;
    
    const guaranteeAmount = calculateGuarantee(boxQuantity);
    const totalAmount = calculateTotalAmount(boxQuantity, rentalDays, pricePerDay, data.additionalProducts);
    
    let pickupDate = "";
    if (data.deliveryDate && rentalDays > 0) {
      pickupDate = calculateReturnDate(data.deliveryDate, rentalDays);
    }
    
    return {
      ...data,
      guaranteeAmount: guaranteeAmount.toString(),
      totalAmount: totalAmount.toString(),
      pickupDate
    };
  };

  // Verificar inventario cuando cambian cantidades o fechas
  useEffect(() => {
    if (formData.boxQuantity && formData.deliveryDate && formData.pickupDate) {
      const boxQuantity = parseInt(formData.boxQuantity);
      if (boxQuantity > 0) {
        const status = mockInventoryCheck(boxQuantity, formData.deliveryDate, formData.pickupDate);
        setInventoryStatus(status);
      }
    } else {
      setInventoryStatus(null);
    }
  }, [formData.boxQuantity, formData.deliveryDate, formData.pickupDate]);

  // Fetch customers for dropdown
  const { data: customers = [] } = useQuery({
    queryKey: ["/api/customers"],
    queryFn: async () => {
      const response = await fetch("/api/customers");
      if (!response.ok) throw new Error("Error al cargar clientes");
      return response.json();
    }
  });

  // Fetch drivers for dropdown
  const { data: drivers = [] } = useQuery({
    queryKey: ["/api/drivers"],
    queryFn: async () => {
      const response = await fetch("/api/drivers");
      if (!response.ok) throw new Error("Error al cargar repartidores");
      return response.json();
    }
  });

  // Create rental mutation
  const createRentalMutation = useMutation({
    mutationFn: async (rentalData: any) => {
      const response = await fetch("/api/rentals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rentalData)
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al crear arriendo");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Éxito", description: "Arriendo creado correctamente" });
      // Invalidar múltiples queries relacionadas
      queryClient.invalidateQueries({ queryKey: ["/api/rentals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      // Redirigir inmediatamente
      setTimeout(() => {
        setLocation("/admin?tab=arriendos");
      }, 1000);
    },
    onError: (error: any) => {
      console.error("Error creating rental:", error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  // Funciones para shortcuts
  const setBoxQuantityShortcut = (quantity: number) => {
    const updatedData = recalculateFormData({ ...formData, boxQuantity: quantity.toString() });
    setFormData(updatedData);
  };

  const setRentalDaysShortcut = (days: number) => {
    const updatedData = recalculateFormData({ ...formData, rentalDays: days.toString() });
    setFormData(updatedData);
  };

  // Funciones para productos adicionales
  const addAdditionalProduct = (product: {name: string, price: number}) => {
    const newProduct = { ...product, quantity: 1 };
    const updatedProducts = [...formData.additionalProducts, newProduct];
    const updatedData = recalculateFormData({ ...formData, additionalProducts: updatedProducts });
    setFormData(updatedData);
  };

  const updateAdditionalProduct = (index: number, field: 'quantity' | 'price', value: number) => {
    const updatedProducts = [...formData.additionalProducts];
    updatedProducts[index] = { ...updatedProducts[index], [field]: value };
    const updatedData = recalculateFormData({ ...formData, additionalProducts: updatedProducts });
    setFormData(updatedData);
  };

  const removeAdditionalProduct = (index: number) => {
    const updatedProducts = formData.additionalProducts.filter((_, i) => i !== index);
    const updatedData = recalculateFormData({ ...formData, additionalProducts: updatedProducts });
    setFormData(updatedData);
  };

  const handleSubmit = () => {
    createRentalMutation.mutate({
      ...formData,
      boxQuantity: parseInt(formData.boxQuantity),
      rentalDays: parseInt(formData.rentalDays),
      pricePerDay: formData.pricePerDay, // Mantener como string
      guaranteeAmount: formData.guaranteeAmount, // Mantener como string
      totalAmount: formData.totalAmount, // Mantener como string
      paidAmount: formData.paidAmount || "0", // Mantener como string
      deliveryDate: formData.deliveryDate || null,
      pickupDate: formData.pickupDate || null,
      driverId: formData.driverId || null // Convertir string vacío a null
    });
  };

  const isStepValid = (step: number) => {
    switch (step) {
      case 1:
        return formData.customerId && formData.boxQuantity && formData.rentalDays;
      case 2:
        return formData.deliveryDate && formData.deliveryAddress;
      case 3:
        return true; // Review step
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => setLocation("/admin")}
            className="mb-4 text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al Dashboard
          </Button>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Nuevo Arriendo</h1>
            <p className="text-gray-600">Crea un nuevo arriendo de cajas de forma rápida y sencilla</p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex justify-center">
            <div className="flex items-center space-x-4">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep >= step 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {step}
                  </div>
                  <div className="ml-3 text-sm font-medium text-gray-900">
                    {step === 1 && "Detalles"}
                    {step === 2 && "Entrega"}
                    {step === 3 && "Resumen"}
                  </div>
                  {step < 3 && (
                    <div className={`ml-4 w-16 h-1 ${
                      currentStep > step ? 'bg-blue-600' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Step Content */}
        <Card className="shadow-xl border-0">
          <CardContent className="p-8">
            {currentStep === 1 && (
              <div className="space-y-8">
                <div className="text-center mb-6">
                  <Package2 className="h-12 w-12 text-blue-600 mx-auto mb-3" />
                  <h2 className="text-2xl font-bold text-gray-900">Detalles del Arriendo</h2>
                  <p className="text-gray-600">Configura las cantidades y duración</p>
                </div>

                {/* Cliente */}
                <div className="space-y-3">
                  <Label className="text-lg font-medium flex items-center">
                    <User className="h-5 w-5 mr-2 text-blue-600" />
                    Cliente *
                  </Label>
                  <Select value={formData.customerId} onValueChange={(value) => setFormData(prev => ({ ...prev, customerId: value }))}>
                    <SelectTrigger className="h-12 text-lg">
                      <SelectValue placeholder="Seleccionar cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{customer.name}</span>
                            <span className="text-sm text-gray-500">{customer.rut}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Cantidad de Cajas */}
                <div className="space-y-3">
                  <Label className="text-lg font-medium flex items-center">
                    <Package2 className="h-5 w-5 mr-2 text-blue-600" />
                    Cantidad de Cajas *
                  </Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    {BOX_QUANTITY_SHORTCUTS.map(quantity => (
                      <Button
                        key={quantity}
                        type="button"
                        variant={formData.boxQuantity === quantity.toString() ? "default" : "outline"}
                        size="lg"
                        onClick={() => setBoxQuantityShortcut(quantity)}
                        className="h-16 text-lg font-medium"
                      >
                        <div className="flex flex-col">
                          <span>{quantity}</span>
                          <span className="text-xs opacity-70">cajas</span>
                        </div>
                      </Button>
                    ))}
                  </div>
                  <Input
                    type="number"
                    value={formData.boxQuantity}
                    onChange={(e) => {
                      const updatedData = recalculateFormData({ ...formData, boxQuantity: e.target.value });
                      setFormData(updatedData);
                    }}
                    placeholder="Cantidad personalizada"
                    className="h-12 text-lg"
                  />
                </div>

                {/* Días de Arriendo */}
                <div className="space-y-3">
                  <Label className="text-lg font-medium flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                    Días de Arriendo *
                  </Label>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {RENTAL_DAYS_SHORTCUTS.map(days => (
                      <Button
                        key={days}
                        type="button"
                        variant={formData.rentalDays === days.toString() ? "default" : "outline"}
                        size="lg"
                        onClick={() => setRentalDaysShortcut(days)}
                        className="h-16 text-lg font-medium"
                      >
                        <div className="flex flex-col">
                          <span>{days}</span>
                          <span className="text-xs opacity-70">días</span>
                        </div>
                      </Button>
                    ))}
                  </div>
                  <Input
                    type="number"
                    value={formData.rentalDays}
                    onChange={(e) => {
                      const updatedData = recalculateFormData({ ...formData, rentalDays: e.target.value });
                      setFormData(updatedData);
                    }}
                    placeholder="Días personalizados"
                    className="h-12 text-lg"
                  />
                </div>



                {/* Precio Total Manual */}
                <div className="space-y-3">
                  <Label className="text-lg font-medium flex items-center">
                    <DollarSign className="h-5 w-5 mr-2 text-orange-600" />
                    Precio Total del Arriendo
                  </Label>
                  <Input
                    type="number"
                    value={formData.totalAmount || ""}
                    onChange={(e) => {
                      // Usar directamente el valor total ingresado
                      const totalPrice = e.target.value;
                      const boxes = parseInt(formData.boxQuantity) || 1;
                      const days = parseInt(formData.rentalDays) || 1;
                      const pricePerDay = parseFloat(totalPrice) / (boxes * days);
                      
                      // No usar recalculateFormData para evitar sobrescribir el total manual
                      setFormData({ 
                        ...formData, 
                        totalAmount: totalPrice,
                        pricePerDay: !isNaN(pricePerDay) ? pricePerDay.toString() : "0"
                      });
                    }}
                    placeholder="150000"
                    className="h-12 text-lg border-orange-200 bg-orange-50"
                  />
                  <p className="text-sm text-orange-600">Precio total manual para {formData.boxQuantity} cajas por {formData.rentalDays} días</p>
                </div>

                {/* Productos Adicionales */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-lg font-medium flex items-center">
                      <ShoppingCart className="h-5 w-5 mr-2 text-purple-600" />
                      Productos Adicionales
                    </Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAdditionalProducts(!showAdditionalProducts)}
                    >
                      {showAdditionalProducts ? "Ocultar" : "Agregar"}
                    </Button>
                  </div>

                  {showAdditionalProducts && (
                    <div className="space-y-4 p-4 border border-purple-200 rounded-lg bg-purple-50">
                      <div className="grid grid-cols-2 gap-3">
                        {ADDITIONAL_PRODUCTS.map((product, index) => (
                          <Button
                            key={index}
                            type="button"
                            variant="outline"
                            size="lg"
                            onClick={() => addAdditionalProduct(product)}
                            className="h-auto py-3 flex flex-col"
                          >
                            <span className="font-medium">{product.name}</span>
                            <span className="text-sm text-gray-500">{formatCurrency(product.price.toString())}/día</span>
                          </Button>
                        ))}
                      </div>

                      {formData.additionalProducts.length > 0 && (
                        <div className="space-y-2">
                          <Label className="font-medium">Productos Seleccionados:</Label>
                          {formData.additionalProducts.map((product, index) => (
                            <div key={index} className="flex items-center gap-3 p-3 bg-white rounded border">
                              <span className="flex-1">{product.name}</span>
                              <div className="flex items-center gap-2">
                                <Label className="text-sm">Cantidad:</Label>
                                <Input
                                  type="number"
                                  value={product.quantity}
                                  onChange={(e) => updateAdditionalProduct(index, 'quantity', parseInt(e.target.value) || 1)}
                                  className="w-20 h-8"
                                  min="1"
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <Label className="text-sm">Precio:</Label>
                                <Input
                                  type="number"
                                  value={product.price}
                                  onChange={(e) => updateAdditionalProduct(index, 'price', parseFloat(e.target.value) || 0)}
                                  className="w-24 h-8"
                                />
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeAdditionalProduct(index)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Resumen de Precios */}
                {formData.boxQuantity && formData.rentalDays && (
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-6">
                      <h3 className="text-lg font-medium mb-4 flex items-center text-blue-800">
                        <Zap className="h-5 w-5 mr-2" />
                        Cálculo Automático
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Garantía</p>
                          <p className="text-lg font-semibold text-blue-800">
                            {formatCurrency(formData.guaranteeAmount || "0")}
                          </p>
                          <p className="text-xs text-gray-500">$2.000 por caja</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Precio del Arriendo</p>
                          <p className="text-lg font-semibold text-blue-800">
                            {formatCurrency((parseInt(formData.boxQuantity) * parseInt(formData.rentalDays) * parseFloat(formData.pricePerDay)).toString())}
                          </p>
                          <p className="text-xs text-gray-500">Precio manual establecido</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Total</p>
                          <p className="text-2xl font-bold text-blue-800">
                            {formatCurrency(formData.totalAmount || "0")}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formData.additionalProducts.length > 0 && "Incluye productos adicionales"}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-8">
                <div className="text-center mb-6">
                  <MapPin className="h-12 w-12 text-blue-600 mx-auto mb-3" />
                  <h2 className="text-2xl font-bold text-gray-900">Información de Entrega</h2>
                  <p className="text-gray-600">Configura fechas y direcciones</p>
                </div>

                {/* Fechas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="text-lg font-medium flex items-center">
                      <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                      Fecha de Entrega *
                    </Label>
                    <Input
                      type="date"
                      value={formData.deliveryDate}
                      onChange={(e) => {
                        const updatedData = recalculateFormData({ ...formData, deliveryDate: e.target.value });
                        setFormData(updatedData);
                      }}
                      className="h-12 text-lg"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="text-lg font-medium flex items-center">
                      <Clock className="h-5 w-5 mr-2 text-green-600" />
                      Fecha de Retiro (Sugerida)
                    </Label>
                    <Input
                      type="date"
                      value={formData.pickupDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, pickupDate: e.target.value }))}
                      className="h-12 text-lg border-green-200 bg-green-50"
                    />
                    <p className="text-sm text-green-600">Sugerida automáticamente, pero puedes modificarla</p>
                  </div>
                </div>

                {/* Verificación de Inventario */}
                {inventoryStatus && (
                  <Card className={`border-2 ${
                    inventoryStatus.severity === 'success' ? 'border-green-200 bg-green-50' :
                    inventoryStatus.severity === 'warning' ? 'border-yellow-200 bg-yellow-50' :
                    'border-red-200 bg-red-50'
                  }`}>
                    <CardContent className="p-4">
                      <div className="flex items-center">
                        {inventoryStatus.severity === 'success' ? (
                          <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
                        ) : (
                          <AlertCircle className="h-6 w-6 text-yellow-600 mr-3" />
                        )}
                        <p className={`font-medium ${
                          inventoryStatus.severity === 'success' ? 'text-green-800' :
                          inventoryStatus.severity === 'warning' ? 'text-yellow-800' :
                          'text-red-800'
                        }`}>
                          {inventoryStatus.message}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Direcciones */}
                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label className="text-lg font-medium flex items-center">
                      <MapPin className="h-5 w-5 mr-2 text-blue-600" />
                      Dirección de Entrega *
                    </Label>
                    <Textarea
                      value={formData.deliveryAddress}
                      onChange={(e) => setFormData(prev => ({ ...prev, deliveryAddress: e.target.value }))}
                      placeholder="Av. Providencia 123, Providencia, Santiago"
                      className="min-h-[80px] text-lg"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="text-lg font-medium flex items-center">
                      <MapPin className="h-5 w-5 mr-2 text-gray-600" />
                      Dirección de Retiro (Opcional)
                    </Label>
                    <Textarea
                      value={formData.pickupAddress}
                      onChange={(e) => setFormData(prev => ({ ...prev, pickupAddress: e.target.value }))}
                      placeholder="Si es diferente a la dirección de entrega"
                      className="min-h-[80px] text-lg"
                    />
                    <p className="text-sm text-gray-500">Dejar vacío para usar la misma dirección de entrega</p>
                  </div>
                </div>

                {/* Repartidor */}
                <div className="space-y-3">
                  <Label className="text-lg font-medium flex items-center">
                    <Truck className="h-5 w-5 mr-2 text-blue-600" />
                    Repartidor (Opcional)
                  </Label>
                  <Select value={formData.driverId} onValueChange={(value) => setFormData(prev => ({ ...prev, driverId: value }))}>
                    <SelectTrigger className="h-12 text-lg">
                      <SelectValue placeholder="Se asignará automáticamente" />
                    </SelectTrigger>
                    <SelectContent>
                      {drivers.map((driver: any) => (
                        <SelectItem key={driver.id} value={driver.id}>
                          {driver.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-500">Se asignará automáticamente cuando el arriendo esté programado</p>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-8">
                <div className="text-center mb-6">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
                  <h2 className="text-2xl font-bold text-gray-900">Resumen del Arriendo</h2>
                  <p className="text-gray-600">Revisa todos los detalles antes de crear</p>
                </div>

                {/* Resumen completo */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <User className="h-5 w-5 mr-2" />
                        Cliente
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="font-medium">
                        {customers.find(c => c.id === formData.customerId)?.name || 'Cliente seleccionado'}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Package2 className="h-5 w-5 mr-2" />
                        Detalles
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p>{formData.boxQuantity} cajas por {formData.rentalDays} días</p>
                      <p className="text-sm text-gray-500">Arriendo completo</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Calendar className="h-5 w-5 mr-2" />
                        Fechas
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p>Entrega: {new Date(formData.deliveryDate).toLocaleDateString('es-CL')}</p>
                      <p>Retiro: {new Date(formData.pickupDate).toLocaleDateString('es-CL')}</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-blue-50 border-blue-200">
                    <CardHeader>
                      <CardTitle className="flex items-center text-blue-800">
                        <DollarSign className="h-5 w-5 mr-2" />
                        Total
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold text-blue-800">
                        {formatCurrency(formData.totalAmount)}
                      </p>
                      <p className="text-sm text-gray-600">
                        Incluye garantía de {formatCurrency(formData.guaranteeAmount)}
                        {formData.additionalProducts.length > 0 && " + productos adicionales"}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Notas */}
                <div className="space-y-3">
                  <Label className="text-lg font-medium">Notas Adicionales</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Instrucciones especiales, horarios preferidos, etc."
                    className="min-h-[100px] text-lg"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={() => currentStep > 1 ? setCurrentStep(currentStep - 1) : setLocation("/admin")}
            size="lg"
            className="px-8"
          >
            {currentStep === 1 ? "Cancelar" : "Anterior"}
          </Button>

          {currentStep < 3 ? (
            <Button
              onClick={() => setCurrentStep(currentStep + 1)}
              disabled={!isStepValid(currentStep)}
              size="lg"
              className="px-8"
            >
              Siguiente
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={createRentalMutation.isPending}
              size="lg"
              className="px-8 bg-green-600 hover:bg-green-700"
            >
              {createRentalMutation.isPending ? "Creando..." : "Crear Arriendo"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}