import React, { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useLocation } from 'wouter'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  Calendar,
  Mail,
  Phone,
  MapPin,
  Grid3X3,
  List,
  Download,
  Calculator,
  ShoppingCart,
  Package,
  RefreshCw
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { apiRequest, queryClient } from '@/lib/queryClient'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import Header from '@/components/layout/header'
import Sidebar from '@/components/layout/sidebar'
import MobileNav from '@/components/layout/mobile-nav'

// Types
interface Customer {
  id: string
  name: string
  email: string
  phone?: string
  rut: string
  address?: string
  createdAt: string
}

interface Rental {
  id: string
  customerId: string
  totalBoxes: number
  rentalDays: number
  totalAmount: string
  guaranteeAmount: string
  additionalProducts: string
  additionalProductsTotal: string
  deliveryDate: string
  returnDate: string | null
  deliveryAddress: string
  pickupAddress: string
  notes: string
  status: string
  trackingCode: string
  assignedDriver: string | null
  assignedBoxCodes: string[] | null
  masterCode: string | null
  createdAt: string
  updatedAt: string
  driverName?: string | null
  driverEmail?: string | null
}

interface NewCustomer {
  name: string
  email: string
  phone: string
  rut: string
}

interface NewRental {
  boxQuantity: number
  rentalDays: number
  deliveryDate: string
  pickupDate: string
  deliveryAddress: string
  pickupAddress: string
  notes: string
  customPrice: number
  discount: number
  additionalProducts: Array<{
    name: string
    price: number
    quantity: number
    manualPrice?: boolean
    originalPrice?: number
  }>
  manualPrice: boolean
}

// Utility functions
const formatRut = (rut: string): string => {
  const cleanRut = rut.replace(/[^0-9kK]/g, '')
  if (cleanRut.length < 2) return cleanRut
  
  const body = cleanRut.slice(0, -1)
  const dv = cleanRut.slice(-1)
  
  const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${formattedBody}-${dv}`
}

const formatPrice = (price: string | number): string => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0
  }).format(numPrice)
}

const getPriceByPeriod = (boxes: number, days: number): number => {
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

const parseAdditionalProducts = (products: any): any[] => {
  try {
    if (typeof products === 'string') {
      return JSON.parse(products)
    }
    return Array.isArray(products) ? products : []
  } catch {
    return []
  }
}

export default function CustomersPageNew() {
  const { user, isLoading } = useCurrentUser()
  const [, setLocation] = useLocation()
  
  // State management
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [showCreateCustomerDialog, setShowCreateCustomerDialog] = useState(false)
  const [showEditCustomerDialog, setShowEditCustomerDialog] = useState(false)
  const [showCreateRentalDialog, setShowCreateRentalDialog] = useState(false)
  const [showEditRentalDialog, setShowEditRentalDialog] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [selectedRental, setSelectedRental] = useState<Rental | null>(null)

  // Auth check
  useEffect(() => {
    if (isLoading) return
    if (!user) {
      window.location.href = "/"
      return
    }
    if (user.type !== 'admin') {
      window.location.href = "/"
      return
    }
  }, [user, isLoading])

  // Fetch data
  const { data: customers = [], isLoading: customersLoading, refetch: refetchCustomers } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
    refetchInterval: 5000,
  })

  const { data: rentals = [], refetch: refetchRentals } = useQuery<Rental[]>({
    queryKey: ["/api/rentals"],
    refetchInterval: 5000,
  })

  const { data: drivers = [] } = useQuery({
    queryKey: ["/api/drivers"],
    refetchInterval: 5000,
  })

  // Manual refresh
  const handleManualRefresh = () => {
    refetchCustomers()
    refetchRentals()
    toast({
      title: "Datos actualizados",
      description: "Los datos se han actualizado desde el servidor"
    })
  }



  // Mutations
  const createCustomerMutation = useMutation({
    mutationFn: async (data: NewCustomer) => {
      const res = await apiRequest("POST", "/api/customers", data)
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] })
      toast({ title: "Cliente creado exitosamente" })
      setShowCreateCustomerDialog(false)
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: error.message || "Error al crear cliente",
        variant: "destructive" 
      })
    }
  })

  const updateCustomerMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: Partial<Customer> }) => {
      const res = await apiRequest("PUT", `/api/customers/${id}`, data)
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] })
      toast({ title: "Cliente actualizado exitosamente" })
      setShowEditCustomerDialog(false)
      setSelectedCustomer(null)
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: error.message || "Error al actualizar cliente",
        variant: "destructive" 
      })
    }
  })

  const deleteCustomerMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/customers/${id}`)
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] })
      toast({ title: "Cliente eliminado exitosamente" })
    },
    onError: (error) => {
      toast({ 
        title: "Error al eliminar", 
        description: error.message || "No se pudo eliminar el cliente",
        variant: "destructive" 
      })
    }
  })

  const createRentalMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/rentals", data)
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rentals"] })
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] })
      toast({ title: "Arriendo creado exitosamente" })
      setShowCreateRentalDialog(false)
      setSelectedCustomer(null)
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: error.message || "Error al crear arriendo",
        variant: "destructive" 
      })
    }
  })

  const updateRentalMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: any }) => {
      const res = await apiRequest("PUT", `/api/rentals/${id}`, data)
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rentals"] })
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] })
      toast({ title: "Arriendo actualizado exitosamente" })
      setShowEditRentalDialog(false)
      setSelectedRental(null)
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: error.message || "Error al actualizar arriendo",
        variant: "destructive" 
      })
    }
  })

  // Data processing
  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.rut.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getCustomerRentals = (customerId: string) => {
    return rentals.filter(rental => rental.customerId === customerId)
  }

  const getActiveRentals = (customerId: string) => {
    return getCustomerRentals(customerId).filter(rental => 
      ['pendiente', 'pagada', 'entregada', 'retirada'].includes(rental.status)
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendiente': return 'bg-yellow-500'
      case 'pagada': return 'bg-blue-500'
      case 'entregada': return 'bg-green-500'
      case 'retirada': return 'bg-purple-500'
      case 'finalizado': return 'bg-gray-500'
      case 'cancelada': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      'pendiente': 'Pendiente',
      'pagada': 'Pagada',
      'entregada': 'Entregada',
      'retirada': 'Retirada',
      'finalizado': 'Finalizado',
      'cancelada': 'Cancelada'
    }
    return statusMap[status] || status
  }

  // Component functions
  const CustomerForm = ({ customer, onSubmit }: { 
    customer?: Customer | null, 
    onSubmit: (data: any) => void 
  }) => {
    const [formData, setFormData] = useState({
      name: customer?.name || '',
      email: customer?.email || '',
      phone: customer?.phone || '',
      rut: customer?.rut || '',
      address: customer?.address || ''
    })

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault()
      onSubmit(formData)
    }

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Nombre completo</Label>
          <Input
            id="name"
            placeholder="Nombre completo"
            value={formData.name}
            onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            placeholder="email@ejemplo.com"
            type="email"
            value={formData.email}
            onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="rut">RUT</Label>
          <Input
            id="rut"
            placeholder="12.345.678-9"
            value={formData.rut}
            onChange={e => setFormData(prev => ({ ...prev, rut: formatRut(e.target.value) }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="phone">Teléfono</Label>
          <Input
            id="phone"
            placeholder="+56 9 1234 5678"
            value={formData.phone}
            onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="address">Dirección</Label>
          <Input
            id="address"
            placeholder="Dirección completa (opcional)"
            value={formData.address}
            onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
          />
        </div>
        <Button type="submit" className="w-full" disabled={createCustomerMutation.isPending || updateCustomerMutation.isPending}>
          {customer ? 'Actualizar Cliente' : 'Crear Cliente'}
        </Button>
      </form>
    )
  }

  const RentalForm = ({ rental, customerId, onSubmit }: { 
    rental?: Rental | null, 
    customerId?: string,
    onSubmit: (data: any) => void 
  }) => {
    const [formData, setFormData] = useState({
      customerId: customerId || rental?.customerId || '',
      totalBoxes: rental?.totalBoxes || 5,
      deliveryDate: rental?.deliveryDate ? new Date(rental.deliveryDate).toISOString().split('T')[0] : '',
      returnDate: rental?.returnDate ? new Date(rental.returnDate).toISOString().split('T')[0] : '',
      deliveryAddress: rental?.deliveryAddress || '',
      pickupAddress: rental?.pickupAddress || '',
      notes: rental?.notes || '',
      status: rental?.status || 'pendiente',
      manualPrice: false,
      customPrice: 0,
      discount: 0,
      additionalProducts: parseAdditionalProducts(rental?.additionalProducts || '[]')
    })

    const [calculatedPrice, setCalculatedPrice] = useState(0)
    const [rentalDays, setRentalDays] = useState(7)
    const [showAddProductDialog, setShowAddProductDialog] = useState(false)
    const [newProduct, setNewProduct] = useState({ name: '', price: 0, quantity: 1 })

    useEffect(() => {
      if (formData.deliveryDate && formData.returnDate) {
        const delivery = new Date(formData.deliveryDate)
        const returnDate = new Date(formData.returnDate)
        const diffTime = Math.abs(returnDate.getTime() - delivery.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        setRentalDays(diffDays)
        
        if (!formData.manualPrice) {
          const price = getPriceByPeriod(formData.totalBoxes, diffDays)
          setCalculatedPrice(price)
          setFormData(prev => ({ ...prev, customPrice: price }))
        }
      }
    }, [formData.deliveryDate, formData.returnDate, formData.totalBoxes, formData.manualPrice])

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault()
      
      const basePrice = formData.manualPrice ? formData.customPrice : calculatedPrice
      const discountAmount = (basePrice * formData.discount) / 100
      const finalPrice = basePrice - discountAmount
      
      const rentalData = {
        ...formData,
        totalAmount: finalPrice,
        guaranteeAmount: formData.totalBoxes * 2000, // $2,000 per box
        additionalProducts: JSON.stringify(formData.additionalProducts),
        additionalProductsTotal: formData.additionalProducts.reduce((sum, product) => sum + (product.price * product.quantity), 0),
        deliveryDate: new Date(formData.deliveryDate).toISOString(),
        returnDate: formData.returnDate ? new Date(formData.returnDate).toISOString() : null,
        rentalDays: rentalDays,
        discount: formData.discount
      }
      
      onSubmit(rentalData)
    }

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="totalBoxes">Cantidad de Cajas</Label>
            <Input
              id="totalBoxes"
              type="number"
              min="1"
              max="50"
              value={formData.totalBoxes}
              onChange={e => setFormData(prev => ({ ...prev, totalBoxes: parseInt(e.target.value) }))}
              required
            />
          </div>
          <div>
            <Label htmlFor="status">Estado</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="pagada">Pagada</SelectItem>
                <SelectItem value="entregada">Entregada</SelectItem>
                <SelectItem value="retirada">Retirada</SelectItem>
                <SelectItem value="finalizado">Finalizado</SelectItem>
                <SelectItem value="cancelada">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="deliveryDate">Fecha de Entrega</Label>
            <Input
              id="deliveryDate"
              type="date"
              value={formData.deliveryDate}
              onChange={e => setFormData(prev => ({ ...prev, deliveryDate: e.target.value }))}
              required
            />
          </div>
          <div>
            <Label htmlFor="returnDate">Fecha de Retiro</Label>
            <Input
              id="returnDate"
              type="date"
              value={formData.returnDate}
              onChange={e => setFormData(prev => ({ ...prev, returnDate: e.target.value }))}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="deliveryAddress">Dirección de Entrega</Label>
          <Textarea
            id="deliveryAddress"
            placeholder="Dirección completa de entrega"
            value={formData.deliveryAddress}
            onChange={e => setFormData(prev => ({ ...prev, deliveryAddress: e.target.value }))}
          />
        </div>

        <div>
          <Label htmlFor="pickupAddress">Dirección de Retiro</Label>
          <Textarea
            id="pickupAddress"
            placeholder="Dirección completa de retiro"
            value={formData.pickupAddress}
            onChange={e => setFormData(prev => ({ ...prev, pickupAddress: e.target.value }))}
          />
        </div>

        <div>
          <Label htmlFor="notes">Notas Adicionales</Label>
          <Textarea
            id="notes"
            placeholder="Observaciones, instrucciones especiales, etc."
            value={formData.notes}
            onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          />
        </div>

        {/* Productos Adicionales */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <Label>Productos Adicionales</Label>
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={() => setShowAddProductDialog(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Agregar Producto
            </Button>
          </div>
          
          {formData.additionalProducts.length > 0 && (
            <div className="space-y-2 mb-4">
              {formData.additionalProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-gray-500">
                      {formatPrice(product.price)} × {product.quantity} = {formatPrice(product.price * product.quantity)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        additionalProducts: prev.additionalProducts.filter((_, i) => i !== index)
                      }))
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Add Product Dialog */}
          <Dialog open={showAddProductDialog} onOpenChange={setShowAddProductDialog}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Agregar Producto</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="productName">Nombre del Producto</Label>
                  <Input
                    id="productName"
                    value={newProduct.name}
                    onChange={e => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ej: Candado, Etiquetas, etc."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="productPrice">Precio</Label>
                    <Input
                      id="productPrice"
                      type="number"
                      min="0"
                      value={newProduct.price}
                      onChange={e => setNewProduct(prev => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="productQuantity">Cantidad</Label>
                    <Input
                      id="productQuantity"
                      type="number"
                      min="1"
                      value={newProduct.quantity}
                      onChange={e => setNewProduct(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                    />
                  </div>
                </div>
                <Button 
                  onClick={() => {
                    if (newProduct.name && newProduct.price > 0) {
                      setFormData(prev => ({
                        ...prev,
                        additionalProducts: [...prev.additionalProducts, newProduct]
                      }))
                      setNewProduct({ name: '', price: 0, quantity: 1 })
                      setShowAddProductDialog(false)
                    }
                  }}
                  className="w-full"
                >
                  Agregar Producto
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Descuento */}
        <div>
          <Label htmlFor="discount">Descuento (%)</Label>
          <Input
            id="discount"
            type="number"
            min="0"
            max="100"
            value={formData.discount}
            onChange={e => setFormData(prev => ({ ...prev, discount: parseInt(e.target.value) || 0 }))}
          />
        </div>

        {/* Pricing Section */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="manualPrice"
              checked={formData.manualPrice}
              onCheckedChange={(checked) => {
                setFormData(prev => ({ 
                  ...prev, 
                  manualPrice: checked as boolean,
                  customPrice: checked ? prev.customPrice : calculatedPrice
                }))
              }}
            />
            <Label htmlFor="manualPrice">Precio manual</Label>
          </div>

          {formData.manualPrice && (
            <div>
              <Label htmlFor="customPrice">Precio Personalizado</Label>
              <Input
                id="customPrice"
                type="number"
                min="0"
                value={formData.customPrice}
                onChange={e => setFormData(prev => ({ ...prev, customPrice: parseInt(e.target.value) || 0 }))}
              />
            </div>
          )}

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p><strong>Período:</strong> {rentalDays} días</p>
                <p><strong>Precio base:</strong> {formatPrice(formData.manualPrice ? formData.customPrice : calculatedPrice)}</p>
                {formData.discount > 0 && (
                  <p><strong>Descuento:</strong> -{formData.discount}%</p>
                )}
              </div>
              <div>
                <p><strong>Productos adicionales:</strong> {formatPrice(formData.additionalProducts.reduce((sum, p) => sum + (p.price * p.quantity), 0))}</p>
                <p><strong>Garantía:</strong> {formatPrice(formData.totalBoxes * 2000)}</p>
                {(() => {
                  const basePrice = formData.manualPrice ? formData.customPrice : calculatedPrice
                  const discountAmount = (basePrice * formData.discount) / 100
                  const finalPrice = basePrice - discountAmount
                  const additionalTotal = formData.additionalProducts.reduce((sum, p) => sum + (p.price * p.quantity), 0)
                  const guaranteeTotal = formData.totalBoxes * 2000
                  return (
                    <p className="font-bold"><strong>Total:</strong> {formatPrice(finalPrice + additionalTotal + guaranteeTotal)}</p>
                  )
                })()}
              </div>
            </div>
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={createRentalMutation.isPending || updateRentalMutation.isPending}>
          {rental ? 'Actualizar Arriendo' : 'Crear Arriendo'}
        </Button>
      </form>
    )
  }

  if (customersLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="animate-spin h-8 w-8" />
      </div>
    )
  }

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="animate-spin h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar role="admin" />
        <MobileNav role="admin" />
        <main className="flex-1 p-6">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Gestión de Clientes</h1>
                <p className="text-gray-600">Base de datos completa de clientes y su historial de arriendos</p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <Button onClick={handleManualRefresh} variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Actualizar
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {/* Export functionality */}}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Descargar Historial
                </Button>
                <Button onClick={() => setShowCreateCustomerDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Cliente
                </Button>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex items-center space-x-2 flex-1 max-w-md">
                <Search className="h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nombre, email o teléfono..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Customers Table */}
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>RUT</TableHead>
                    <TableHead>Arriendos</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Repartidor</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => {
                    const customerRentals = getCustomerRentals(customer.id)
                    const activeRentals = getActiveRentals(customer.id)
                    const lastRental = customerRentals[0]

                    return (
                      <TableRow key={customer.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback>
                                {customer.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="font-medium">{customer.name}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm space-y-1">
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3 text-gray-400" />
                              {customer.email}
                            </div>
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3 text-gray-400" />
                              {customer.phone}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{formatRut(customer.rut)}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{activeRentals.length} activos / {customerRentals.length} total</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {lastRental && (
                            <Badge 
                              className={`text-white ${getStatusColor(lastRental.status)} cursor-pointer`}
                              onClick={() => {
                                setSelectedRental(lastRental)
                                setShowEditRentalDialog(true)
                              }}
                            >
                              {getStatusText(lastRental.status)}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => {
                            setSelectedCustomer(customer)
                            setShowCreateRentalDialog(true)
                          }}>Asignar repartidor</Button>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedCustomer(customer)
                                setShowCreateRentalDialog(true)
                              }}
                              title="Crear arriendo"
                            >
                              <ShoppingCart className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedCustomer(customer)
                                setShowEditCustomerDialog(true)
                              }}
                              title="Editar cliente"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteCustomerMutation.mutate(customer.id)}
                              className="text-red-600 hover:text-red-800"
                              title="Eliminar cliente"
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
            </Card>

            {/* Create Customer Dialog */}
            <Dialog open={showCreateCustomerDialog} onOpenChange={setShowCreateCustomerDialog}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Crear Nuevo Cliente</DialogTitle>
                </DialogHeader>
                <CustomerForm 
                  onSubmit={(data) => createCustomerMutation.mutate(data)}
                />
              </DialogContent>
            </Dialog>

            {/* Edit Customer Dialog */}
            <Dialog open={showEditCustomerDialog} onOpenChange={setShowEditCustomerDialog}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Editar Cliente</DialogTitle>
                </DialogHeader>
                {selectedCustomer && (
                  <CustomerForm 
                    customer={selectedCustomer}
                    onSubmit={(data) => updateCustomerMutation.mutate({ 
                      id: selectedCustomer.id, 
                      data 
                    })}
                  />
                )}
              </DialogContent>
            </Dialog>

            {/* Create Rental Dialog */}
            <Dialog open={showCreateRentalDialog} onOpenChange={setShowCreateRentalDialog}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Crear Nuevo Arriendo</DialogTitle>
                </DialogHeader>
                {selectedCustomer && (
                  <RentalForm 
                    customerId={selectedCustomer.id}
                    onSubmit={(data) => createRentalMutation.mutate(data)}
                  />
                )}
              </DialogContent>
            </Dialog>

            {/* Edit Rental Dialog */}
            <Dialog open={showEditRentalDialog} onOpenChange={setShowEditRentalDialog}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Editar Arriendo</DialogTitle>
                </DialogHeader>
                {selectedRental && (
                  <RentalForm 
                    rental={selectedRental}
                    onSubmit={(data) => updateRentalMutation.mutate({
                      id: selectedRental.id,
                      data
                    })}
                  />
                )}
              </DialogContent>
            </Dialog>
          </div>
        </main>
      </div>
    </div>
  )
}