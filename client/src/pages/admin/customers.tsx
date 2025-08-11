import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { 
  Search, Plus, User, MapPin, Calendar, Package, Edit, Trash2, Grid3X3,
  Table as TableIcon, Eye, Phone, Mail, CheckCircle, AlertTriangle, 
  Download, QrCode, MessageSquare, Trash, ShoppingCart, Building2, UserPlus
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { apiRequest, queryClient } from "@/lib/queryClient"
import { useLocation } from "wouter"
import Header from "@/components/layout/header"
import Sidebar from "@/components/layout/sidebar"
import MobileNav from "@/components/layout/mobile-nav"

// Utility functions
const formatRut = (rut: string) => {
  if (!rut) return ""
  const cleaned = rut.replace(/[^0-9kK]/g, "")
  if (cleaned.length < 2) return cleaned
  
  const rutNumber = cleaned.slice(0, -1)
  const dv = cleaned.slice(-1)
  
  let formatted = rutNumber.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  return `${formatted}-${dv}`
}

const displayFormattedRut = (rut: string) => {
  if (!rut) return ""
  return formatRut(rut)
}

const Customers = () => {
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table')
  const [showNewCustomerDialog, setShowNewCustomerDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showRentalDialog, setShowRentalDialog] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<any>(null)
  const [selectedCustomerForRental, setSelectedCustomerForRental] = useState<any>(null)
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    email: "",
    phone: "",
    rut: ""
  })
  const [formattedRut, setFormattedRut] = useState("")
  const [includeRental, setIncludeRental] = useState(false)
  const [newRental, setNewRental] = useState({
    boxQuantity: 2,
    rentalDays: 7,
    deliveryDate: "",
    deliveryAddress: "",
    pickupAddress: "",
    notes: "",
    boxSize: "mediano",
    customPrice: 2775,
    discount: 0,
    additionalProducts: [] as Array<{name: string, price: number, quantity: number}>,
    manualPrice: false
  })

  const [newProduct, setNewProduct] = useState({
    name: "",
    price: 0,
    quantity: 1
  })
  const { toast } = useToast()
  const [, setLocation] = useLocation()

  // Check authentication - SIMPLIFIED FOR MOBILE COMPATIBILITY
  const { data: user, isLoading: userLoading, error: userError } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    refetchOnWindowFocus: false
  })

  // Don't redirect immediately - allow the page to load
  // useEffect(() => {
  //   if (!userLoading && !user) {
  //     setLocation("/auth")
  //   }
  // }, [user, userLoading, setLocation])

  // Fetch customers
  const { data: customers = [], isLoading: customersLoading } = useQuery({
    queryKey: ["/api/customers"],
  })

  // Fetch inventory to check box availability
  const { data: inventory = [] } = useQuery({
    queryKey: ["/api/inventory"],
  })

  // Create customer mutation
  const createCustomerMutation = useMutation({
    mutationFn: async (customer: any) => {
      const res = await apiRequest("POST", "/api/customers", customer)
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] })
      toast({
        title: "Cliente creado",
        description: "El cliente ha sido agregado exitosamente"
      })
      setShowNewCustomerDialog(false)
      setNewCustomer({ name: "", email: "", phone: "", rut: "" })
      setFormattedRut("")
      setIncludeRental(false)
      setNewRental({
        boxQuantity: 2,
        rentalDays: 7,
        deliveryDate: "",
        deliveryAddress: "",
        pickupAddress: "",
        notes: "",
        boxSize: "mediano",
        customPrice: 2775,
        discount: 0,
        additionalProducts: [],
        manualPrice: false
      })
      setNewProduct({ name: "", price: 0, quantity: 1 })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al crear el cliente",
        variant: "destructive"
      })
    }
  })

  // Update customer mutation
  const updateCustomerMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PUT", `/api/customers/${id}`, data)
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] })
      toast({
        title: "Cliente actualizado",
        description: "Los datos del cliente han sido actualizados"
      })
      setShowEditDialog(false)
      setEditingCustomer(null)
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al actualizar el cliente",
        variant: "destructive"
      })
    }
  })

  // Delete customer mutation
  const deleteCustomerMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/customers/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] })
      toast({
        title: "Cliente eliminado",
        description: "El cliente ha sido eliminado del sistema"
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al eliminar el cliente",
        variant: "destructive"
      })
    }
  })

  const filteredCustomers = (customers as any[]).filter((customer: any) =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (customer.phone && customer.phone.includes(searchQuery))
  )

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const customer = await createCustomerMutation.mutateAsync(newCustomer)
      
      if (includeRental && customer) {
        // Create rental for the new customer
        const rentalData = {
          ...newRental,
          customerId: customer.id,
          totalPrice: newRental.customPrice - (newRental.customPrice * newRental.discount / 100)
        }
        
        await createRentalMutation.mutateAsync(rentalData)
      }
    } catch (error) {
      console.error("Error creating customer:", error)
    }
  }

  // Create rental mutation
  const createRentalMutation = useMutation({
    mutationFn: async (rental: any) => {
      const res = await apiRequest("POST", "/api/rentals", rental)
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rentals"] })
      toast({
        title: "Arriendo creado",
        description: "El arriendo ha sido programado exitosamente"
      })
      setShowRentalDialog(false)
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al crear el arriendo",
        variant: "destructive"
      })
    }
  })

  // Pricing logic
  const getPriceByPeriod = (boxes: number, days: number) => {
    const priceTable: Record<number, Record<number, number>> = {
      7: { 2: 2775, 5: 6938, 10: 13876, 15: 20815 },
      14: { 2: 5551, 5: 13876, 10: 27753, 15: 41629 },
      30: { 2: 11894, 5: 29735, 10: 59470, 15: 89205 }
    }
    
    if (priceTable[days] && priceTable[days][boxes]) {
      return priceTable[days][boxes]
    }
    
    const basePrice7Days = priceTable[7]
    let baseBoxPrice = 0
    
    if (boxes <= 2) baseBoxPrice = basePrice7Days[2] / 2
    else if (boxes <= 5) baseBoxPrice = basePrice7Days[5] / 5
    else if (boxes <= 10) baseBoxPrice = basePrice7Days[10] / 10
    else baseBoxPrice = basePrice7Days[15] / 15
    
    return Math.round(baseBoxPrice * boxes * (days / 7))
  }

  // Check box availability
  const checkBoxAvailability = (quantity: number) => {
    const inventoryArray = Array.isArray(inventory) ? inventory : []
    const availableBoxes = inventoryArray.filter((box: any) => 
      box.status === 'available' || box.status === 'maintenance'
    ).length
    return availableBoxes >= quantity
  }

  // Update rental price when quantity or days change (only if not manual)
  useEffect(() => {
    if (!newRental.manualPrice) {
      const newPrice = getPriceByPeriod(newRental.boxQuantity, newRental.rentalDays)
      setNewRental(prev => ({ ...prev, customPrice: newPrice }))
    }
  }, [newRental.boxQuantity, newRental.rentalDays, newRental.manualPrice])

  // Get availability status for display
  const getAvailabilityStatus = (quantity: number) => {
    const isAvailable = checkBoxAvailability(quantity)
    const inventoryArray = Array.isArray(inventory) ? inventory : []
    const availableCount = inventoryArray.filter((box: any) => box.status === 'available').length
    return {
      available: isAvailable,
      message: isAvailable ? 
        `${quantity} cajas disponibles` : 
        `Solo ${availableCount} cajas disponibles`,
      className: isAvailable ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'
    }
  }

  const handleEditCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingCustomer) {
      await updateCustomerMutation.mutateAsync({
        id: editingCustomer.id,
        data: editingCustomer
      })
    }
  }

  const handleDeleteCustomer = async (id: number) => {
    if (confirm("¿Estás seguro de que quieres eliminar este cliente?")) {
      await deleteCustomerMutation.mutateAsync(id)
    }
  }

  const handleRutChange = (value: string, isEditing = false) => {
    const formatted = formatRut(value)
    if (isEditing && editingCustomer) {
      setEditingCustomer({ ...editingCustomer, rut: formatted })
    } else {
      setFormattedRut(formatted)
      setNewCustomer({ ...newCustomer, rut: formatted })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="flex">
        <Sidebar role="admin" />
        
        <main className="flex-1 p-4 lg:p-8 pb-20 lg:pb-8">
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              Gestión de Clientes
            </h1>
            <p className="text-gray-600 text-sm md:text-base">
              Base de datos completa de clientes y su historial de arriendos
            </p>
          </div>

      {/* Search and Actions - Mobile Optimized */}
      <Card className="mb-6">
        <CardHeader className="p-4 md:p-6">
          <div className="flex flex-col gap-4">
            {/* Search Bar - Full width on mobile */}
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nombre, email o teléfono..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
            
            {/* Actions Row */}
            <div className="flex flex-col sm:flex-row gap-3 justify-between">
              {/* View Mode Toggle */}
              <div className="flex items-center gap-2 w-fit">
                <Button
                  variant={viewMode === 'cards' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('cards')}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'table' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                >
                  <TableIcon className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Add Customer Button */}
              <Dialog open={showNewCustomerDialog} onOpenChange={setShowNewCustomerDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-brand-red hover:bg-red-700 text-white flex items-center gap-2 w-full sm:w-auto">
                    <Plus className="h-4 w-4" />
                    Nuevo Cliente
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-full max-w-md mx-4 sm:mx-auto max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Crear Nuevo Cliente</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateCustomer} className="space-y-4">
                    <div>
                      <Label htmlFor="name">Nombre *</Label>
                      <Input
                        id="name"
                        value={newCustomer.name}
                        onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                        placeholder="Nombre completo"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newCustomer.email}
                        onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                        placeholder="correo@ejemplo.com"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Teléfono</Label>
                      <Input
                        id="phone"
                        value={newCustomer.phone}
                        onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                        placeholder="+56 9 1234 5678"
                      />
                    </div>
                    <div>
                      <Label htmlFor="rut">RUT</Label>
                      <Input
                        id="rut"
                        value={formattedRut}
                        onChange={(e) => handleRutChange(e.target.value)}
                        placeholder="12345678-9"
                      />
                    </div>

                    {/* Toggle for rental scheduling */}
                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="include-rental">¿Agendar cajas ahora?</Label>
                          <p className="text-sm text-muted-foreground">Programa el arriendo al crear el cliente</p>
                        </div>
                        <Switch
                          id="include-rental"
                          checked={includeRental}
                          onCheckedChange={setIncludeRental}
                        />
                      </div>
                    </div>

                    {/* Rental details (when enabled) */}
                    {includeRental && (
                      <div className="space-y-4 border-t pt-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="box-quantity">Cantidad de cajas</Label>
                            <Select
                              value={newRental.boxQuantity.toString()}
                              onValueChange={(value) => setNewRental(prev => ({ ...prev, boxQuantity: parseInt(value) }))}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="2">2 cajas</SelectItem>
                                <SelectItem value="5">5 cajas</SelectItem>
                                <SelectItem value="10">10 cajas</SelectItem>
                                <SelectItem value="15">15 cajas</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="rental-days">Días de arriendo</Label>
                            <div className="flex gap-2">
                              <Select
                                value={[7, 14, 30].includes(newRental.rentalDays) ? newRental.rentalDays.toString() : 'custom'}
                                onValueChange={(value) => {
                                  if (value === 'custom') {
                                    setNewRental(prev => ({ ...prev, rentalDays: 1 }))
                                  } else {
                                    setNewRental(prev => ({ ...prev, rentalDays: parseInt(value) }))
                                  }
                                }}
                              >
                                <SelectTrigger className="flex-1">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="7">7 días</SelectItem>
                                  <SelectItem value="14">14 días</SelectItem>
                                  <SelectItem value="30">30 días</SelectItem>
                                  <SelectItem value="custom">Otro...</SelectItem>
                                </SelectContent>
                              </Select>
                              {![7, 14, 30].includes(newRental.rentalDays) && (
                                <Input
                                  type="number"
                                  placeholder="Días"
                                  min="1"
                                  value={newRental.rentalDays}
                                  className="w-20"
                                  onChange={(e) => setNewRental(prev => ({ ...prev, rentalDays: parseInt(e.target.value) || 1 }))}
                                />
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor="delivery-date">Fecha de entrega</Label>
                          <Input
                            id="delivery-date"
                            type="date"
                            value={newRental.deliveryDate}
                            onChange={(e) => setNewRental(prev => ({ ...prev, deliveryDate: e.target.value }))}
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="delivery-address">Dirección de entrega</Label>
                          <Textarea
                            id="delivery-address"
                            value={newRental.deliveryAddress}
                            onChange={(e) => setNewRental(prev => ({ ...prev, deliveryAddress: e.target.value }))}
                            placeholder="Dirección completa de entrega..."
                            rows={2}
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="pickup-address">Dirección de retiro</Label>
                          <Textarea
                            id="pickup-address"
                            value={newRental.pickupAddress}
                            onChange={(e) => setNewRental(prev => ({ ...prev, pickupAddress: e.target.value }))}
                            placeholder="Dirección completa de retiro (opcional si es la misma)..."
                            rows={2}
                          />
                        </div>

                        {/* Availability Status */}
                        <div className={`p-3 rounded-lg border ${getAvailabilityStatus(newRental.boxQuantity).className}`}>
                          <div className="flex items-center gap-2">
                            {getAvailabilityStatus(newRental.boxQuantity).available ? (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            ) : (
                              <AlertTriangle className="h-5 w-5 text-red-600" />
                            )}
                            <Label className="font-medium">
                              {getAvailabilityStatus(newRental.boxQuantity).message}
                            </Label>
                          </div>
                        </div>

                        {/* Manual Price Toggle */}
                        <div className="flex items-center justify-between">
                          <Label htmlFor="manual-price">Precio manual</Label>
                          <Switch
                            id="manual-price"
                            checked={newRental.manualPrice}
                            onCheckedChange={(checked) => setNewRental(prev => ({ ...prev, manualPrice: checked }))}
                          />
                        </div>

                        {/* Price Display/Input */}
                        <div className="bg-gray-50 p-3 rounded-lg">
                          {newRental.manualPrice ? (
                            <div>
                              <Label htmlFor="custom-price" className="text-sm text-gray-600">Precio personalizado</Label>
                              <Input
                                id="custom-price"
                                type="number"
                                value={newRental.customPrice}
                                onChange={(e) => setNewRental(prev => ({ ...prev, customPrice: parseInt(e.target.value) || 0 }))}
                                placeholder="Precio en pesos"
                                className="mt-1"
                              />
                            </div>
                          ) : (
                            <Label className="text-lg font-semibold">Precio calculado: ${newRental.customPrice.toLocaleString('es-CL')}</Label>
                          )}
                        </div>

                        {/* Additional Products Section */}
                        <div className="border-t pt-4">
                          <Label className="text-base font-medium">Productos Adicionales</Label>
                          
                          {/* Quick Product Buttons */}
                          <div className="mt-2 grid grid-cols-2 gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setNewRental(prev => ({
                                  ...prev,
                                  additionalProducts: [...prev.additionalProducts, { name: "Carrito plegable", price: 15000, quantity: 1 }]
                                }))
                              }}
                            >
                              Carrito plegable - $15.000
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setNewRental(prev => ({
                                  ...prev,
                                  additionalProducts: [...prev.additionalProducts, { name: "Base móvil", price: 8000, quantity: 1 }]
                                }))
                              }}
                            >
                              Base móvil - $8.000
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setNewRental(prev => ({
                                  ...prev,
                                  additionalProducts: [...prev.additionalProducts, { name: "Kit 2 bases móviles", price: 15000, quantity: 1 }]
                                }))
                              }}
                            >
                              Kit 2 bases móviles - $15.000
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setNewRental(prev => ({
                                  ...prev,
                                  additionalProducts: [...prev.additionalProducts, { name: "Correa Ratchet", price: 5000, quantity: 1 }]
                                }))
                              }}
                            >
                              Correa Ratchet - $5.000
                            </Button>
                          </div>

                          {/* Custom Product Form */}
                          <div className="mt-4 p-3 bg-gray-50 rounded">
                            <Label className="text-sm font-medium">Producto personalizado</Label>
                            <div className="mt-2 grid grid-cols-3 gap-2">
                              <Input
                                placeholder="Nombre del producto"
                                value={newProduct.name}
                                onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                              />
                              <Input
                                type="number"
                                placeholder="Precio"
                                value={newProduct.price || ""}
                                onChange={(e) => setNewProduct(prev => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
                              />
                              <div className="flex gap-1">
                                <Input
                                  type="number"
                                  placeholder="Cant."
                                  min="1"
                                  value={newProduct.quantity}
                                  onChange={(e) => setNewProduct(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                                  className="flex-1"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    if (newProduct.name && newProduct.price > 0) {
                                      setNewRental(prev => ({
                                        ...prev,
                                        additionalProducts: [...prev.additionalProducts, newProduct]
                                      }))
                                      setNewProduct({ name: "", price: 0, quantity: 1 })
                                    }
                                  }}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>

                          {/* Products List */}
                          {newRental.additionalProducts.length > 0 && (
                            <div className="mt-3 space-y-2">
                              {newRental.additionalProducts.map((product, index) => (
                                <div key={index} className="flex items-center justify-between bg-white p-2 rounded border">
                                  <span className="text-sm">
                                    {product.quantity}x {product.name} - ${product.price.toLocaleString('es-CL')}
                                  </span>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setNewRental(prev => ({
                                        ...prev,
                                        additionalProducts: prev.additionalProducts.filter((_, i) => i !== index)
                                      }))
                                    }}
                                  >
                                    <Trash className="h-4 w-4 text-red-500" />
                                  </Button>
                                </div>
                              ))}
                              <div className="text-right text-sm font-medium">
                                Total productos: ${newRental.additionalProducts.reduce((sum, p) => sum + (p.price * p.quantity), 0).toLocaleString('es-CL')}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex gap-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowNewCustomerDialog(false)
                          setIncludeRental(false)
                        }}
                        className="flex-1"
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        disabled={createCustomerMutation.isPending || (includeRental && !checkBoxAvailability(newRental.boxQuantity))}
                        className="flex-1 bg-brand-red hover:bg-red-700 text-white disabled:opacity-50"
                      >
                        {createCustomerMutation.isPending ? "Creando..." : (includeRental ? "Crear y Agendar" : "Crear Cliente")}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Edit Customer Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="w-full max-w-md mx-4 sm:mx-auto max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditCustomer} className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Nombre *</Label>
              <Input
                id="edit-name"
                value={editingCustomer?.name || ""}
                onChange={(e) => setEditingCustomer({ ...editingCustomer, name: e.target.value })}
                placeholder="Nombre completo"
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-email">Email *</Label>
              <Input
                id="edit-email"
                type="email"
                value={editingCustomer?.email || ""}
                onChange={(e) => setEditingCustomer({ ...editingCustomer, email: e.target.value })}
                placeholder="correo@ejemplo.com"
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-phone">Teléfono</Label>
              <Input
                id="edit-phone"
                value={editingCustomer?.phone || ""}
                onChange={(e) => setEditingCustomer({ ...editingCustomer, phone: e.target.value })}
                placeholder="+56 9 1234 5678"
              />
            </div>
            <div>
              <Label htmlFor="edit-rut">RUT</Label>
              <Input
                id="edit-rut"
                value={editingCustomer?.rut || ""}
                onChange={(e) => handleRutChange(e.target.value, true)}
                placeholder="12345678-9"
              />
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowEditDialog(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={updateCustomerMutation.isPending}
                className="flex-1 bg-brand-blue hover:bg-blue-700 text-white"
              >
                {updateCustomerMutation.isPending ? "Actualizando..." : "Actualizar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Customer Display */}
      {viewMode === 'table' ? (
        <Card>
          <CardHeader>
            <CardTitle>Clientes Registrados</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredCustomers.length === 0 ? (
              <div className="text-center py-8">
                <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No se encontraron clientes
                </h3>
                <p className="text-gray-600">
                  {searchQuery 
                    ? "Intenta ajustar tu búsqueda"
                    : "Comienza agregando clientes al sistema"
                  }
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-48">Cliente</TableHead>
                      <TableHead className="min-w-32 hidden md:table-cell">Contacto</TableHead>
                      <TableHead className="min-w-24 hidden lg:table-cell">Dirección</TableHead>
                      <TableHead className="text-center min-w-20">Activos</TableHead>
                      <TableHead className="text-center min-w-20">Total</TableHead>
                      <TableHead className="text-center min-w-24">Estado</TableHead>
                      <TableHead className="text-center min-w-32">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCustomers.map((customer: any) => {
                      const initials = customer.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()
                      
                      return (
                        <TableRow key={customer.id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-brand-blue text-white text-xs">
                                  {initials}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{customer.name}</p>
                                <p className="text-sm text-gray-600">{customer.rut}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <div className="space-y-1">
                              <p className="text-sm">{customer.email}</p>
                              {customer.phone && (
                                <p className="text-sm text-gray-600">{customer.phone}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <p className="text-sm">{customer.address || "No especificada"}</p>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="text-sm font-bold text-brand-blue">0</span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="text-sm font-bold">0</span>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary">
                              Sin arriendos
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => {
                                  setEditingCustomer(customer)
                                  setShowEditDialog(true)
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-red-600"
                                onClick={() => handleDeleteCustomer(customer.id)}
                                disabled={deleteCustomerMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        // Cards view for mobile
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map((customer: any) => {
            const initials = customer.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()
            
            return (
              <Card key={customer.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-brand-blue text-white">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-semibold">{customer.name}</h3>
                      <p className="text-sm text-gray-600">{customer.rut}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="truncate">{customer.email}</span>
                    </div>
                    {customer.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span>{customer.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="truncate">{customer.address || "No especificada"}</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center mt-4 pt-3 border-t">
                    <div className="text-sm">
                      <span className="font-semibold text-brand-blue">0</span> activos
                      <span className="text-gray-500"> / </span>
                      <span className="font-semibold">0</span> total
                    </div>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setEditingCustomer(customer)
                          setShowEditDialog(true)
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-600"
                        onClick={() => handleDeleteCustomer(customer.id)}
                        disabled={deleteCustomerMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
        </main>
      </div>
    </div>
  )
}

export default Customers