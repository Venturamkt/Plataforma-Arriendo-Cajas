import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useToast } from '@/hooks/use-toast'
import { Customer, Rental } from '@shared/schema'

// Components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

// Icons
import { Plus, Search, Edit, ChevronDown, ChevronRight, Calendar, Package } from 'lucide-react'

// Layout Components
import Header from '@/components/layout/header'
import Sidebar from '@/components/layout/sidebar'

// Price and Utility Functions
const formatPrice = (amount: number): string => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(amount)
}

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'pendiente': return 'bg-yellow-500'
    case 'pagada': return 'bg-blue-600' 
    case 'entregada': return 'bg-green-600'
    case 'retirada': return 'bg-purple-600'
    case 'finalizado': return 'bg-gray-600'
    case 'cancelada': return 'bg-red-600'
    default: return 'bg-gray-500'
  }
}

const getStatusText = (status: string): string => {
  switch (status) {
    case 'pendiente': return 'Pendiente'
    case 'pagada': return 'Pagada' 
    case 'entregada': return 'Entregada'
    case 'retirada': return 'Retirada'
    case 'finalizado': return 'Finalizado'
    case 'cancelada': return 'Cancelada'
    default: return status
  }
}

const calculatePrice = (boxes: number, days: number): number => {
  const baseBoxPrice = 2000
  return Math.round(baseBoxPrice * boxes * (days / 7))
}

const getAvailableBoxes = (delivery: string, returnDate: string): number => {
  // Simple calculation - in real app this would check database
  return Math.max(0, 35 - Math.floor(Math.random() * 10))
}

// Customer Card Component
function CustomerCard({ 
  customer, 
  rentals, 
  activeRentals, 
  onEdit, 
  onCreateRental, 
  onEditRental,
}: {
  customer: Customer
  rentals: Rental[]
  activeRentals: Rental[]
  onEdit: () => void
  onCreateRental: () => void
  onEditRental: (rental: Rental) => void
}) {
  const [expanded, setExpanded] = useState(false)
  
  return (
    <Card className="overflow-hidden">
      {/* Customer Header */}
      <div 
        className="p-4 bg-gray-50 border-b cursor-pointer hover:bg-gray-100 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {expanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{customer.name}</h3>
              <div className="text-sm text-gray-600">
                <span className="font-mono bg-gray-200 px-2 py-1 rounded">{customer.rut}</span>
                <span className="ml-3">{customer.email}</span>
                <span className="ml-3">{customer.phone || ''}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="text-right text-sm">
              <div className="text-gray-600">
                Total: {rentals.length} arriendos
              </div>
              {activeRentals.length > 0 && (
                <div className="text-blue-600 font-medium">
                  {activeRentals.length} activos
                </div>
              )}
            </div>
            
            <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); onEdit() }}>
              <Edit className="h-4 w-4" />
            </Button>
            
            <Button 
              variant="default" 
              size="sm"
              onClick={(e) => { e.stopPropagation(); onCreateRental() }}
              className="bg-[#2E5CA6] hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-1" />
              Arriendo
            </Button>
          </div>
        </div>
      </div>

      {/* Expanded Content - Rentals */}
      {expanded && (
        <div className="p-4">
          {rentals.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No hay arriendos registrados</p>
          ) : (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 mb-3">Historial de Arriendos</h4>
              {rentals
                .sort((a, b) => new Date(b.deliveryDate).getTime() - new Date(a.deliveryDate).getTime())
                .slice(0, 10)
                .map((rental) => (
                  <div key={rental.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Badge className={`${getStatusColor(rental.status)} text-white`}>
                        {getStatusText(rental.status)}
                      </Badge>
                      
                      <div className="text-sm">
                        <div className="font-medium">
                          {rental.totalBoxes} cajas × {Math.ceil((new Date(rental.returnDate || rental.deliveryDate).getTime() - new Date(rental.deliveryDate).getTime()) / (1000 * 60 * 60 * 24)) || 7} días
                        </div>
                        <div className="text-gray-600">
                          {new Date(rental.deliveryDate).toLocaleDateString('es-CL')}
                          {rental.returnDate && ` - ${new Date(rental.returnDate).toLocaleDateString('es-CL')}`}
                        </div>
                      </div>
                      
                      <div className="text-sm">
                        <div className="font-medium">{formatPrice(parseInt(rental.totalAmount))}</div>
                        {rental.guaranteeAmount && (
                          <div className="text-gray-600">
                            + {formatPrice(parseInt(rental.guaranteeAmount))} garantía
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {rental.trackingCode && (
                        <Badge variant="outline" className="text-xs">
                          {rental.trackingCode}
                        </Badge>
                      )}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); onEditRental(rental) }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              
              {rentals.length > 10 && (
                <p className="text-gray-500 text-center text-sm">
                  Y {rentals.length - 10} arriendos más...
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

// Customer Form Component
function CustomerForm({ 
  customer, 
  onSubmit, 
  isLoading 
}: { 
  customer?: Customer | null
  onSubmit: (data: any) => void
  isLoading: boolean
}) {
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
          type="email"
          placeholder="email@ejemplo.com"
          value={formData.email}
          onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
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
        />
      </div>

      <div>
        <Label htmlFor="rut">RUT</Label>
        <Input
          id="rut"
          placeholder="12.345.678-9"
          value={formData.rut}
          onChange={e => setFormData(prev => ({ ...prev, rut: e.target.value }))}
        />
      </div>

      <div>
        <Label htmlFor="address">Dirección</Label>
        <Textarea
          id="address"
          placeholder="Dirección completa"
          value={formData.address}
          onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Guardando...' : customer ? 'Actualizar Cliente' : 'Crear Cliente'}
      </Button>
    </form>
  )
}

// Rental Form Component
function RentalForm({ 
  customerId, 
  rental, 
  customers, 
  drivers,
  onSubmit, 
  isLoading 
}: {
  customerId?: string
  rental?: Rental | null
  customers: Customer[]
  drivers: any[]
  onSubmit: (data: any) => void
  isLoading: boolean
}) {
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
    customPrice: rental?.totalAmount ? parseInt(rental.totalAmount.toString()) : 0,
    discount: 0,
    additionalProducts: rental?.additionalProducts 
      ? (typeof rental.additionalProducts === 'string' 
          ? JSON.parse(rental.additionalProducts) 
          : rental.additionalProducts) 
      : [] as any[]
  })

  // Predefined products
  const predefinedProducts = [
    { name: 'Carrito plegable', price: 3000 },
    { name: 'Base móvil', price: 2000 },
    { name: 'Kit 2 bases móviles', price: 3500 },
    { name: 'Correa Ratchet', price: 500 }
  ]

  // Calculations
  const rentalDays = formData.deliveryDate && formData.returnDate
    ? Math.max(1, Math.ceil((new Date(formData.returnDate).getTime() - new Date(formData.deliveryDate).getTime()) / (1000 * 60 * 60 * 24)))
    : 7

  const basePrice = calculatePrice(formData.totalBoxes, rentalDays)
  const finalPrice = formData.manualPrice ? formData.customPrice : basePrice
  const additionalProductsTotal = formData.additionalProducts.reduce((sum: number, p: any) => sum + (p.price * p.quantity), 0)
  const discountAmount = finalPrice * (formData.discount / 100)
  const totalAmount = Math.round(finalPrice - discountAmount + additionalProductsTotal)
  const guaranteeAmount = formData.totalBoxes * 2000

  const availableBoxes = getAvailableBoxes(formData.deliveryDate, formData.returnDate)

  const addPredefinedProduct = (product: { name: string, price: number }) => {
    const existing = formData.additionalProducts.find(p => p.name === product.name)
    if (existing) {
      setFormData(prev => ({
        ...prev,
        additionalProducts: prev.additionalProducts.map((p: any) => 
          p.name === product.name ? { ...p, quantity: p.quantity + 1 } : p
        )
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        additionalProducts: [...prev.additionalProducts, { ...product, quantity: 1 }]
      }))
    }
  }

  const updateProductQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      setFormData(prev => ({
        ...prev,
        additionalProducts: prev.additionalProducts.filter((_: any, i: number) => i !== index)
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        additionalProducts: prev.additionalProducts.map((p: any, i: number) => 
          i === index ? { ...p, quantity } : p
        )
      }))
    }
  }

  const updateProductPrice = (index: number, price: number) => {
    setFormData(prev => ({
      ...prev,
      additionalProducts: prev.additionalProducts.map((p: any, i: number) => 
        i === index ? { ...p, price } : p
      )
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const submitData = {
      ...formData,
      totalBoxes: formData.totalBoxes,
      rentalDays: rentalDays,
      dailyRate: (finalPrice / rentalDays).toString(),
      totalAmount: totalAmount.toString(),
      guaranteeAmount: guaranteeAmount.toString(),
      additionalProductsTotal: additionalProductsTotal.toString(),
      additionalProducts: JSON.stringify(formData.additionalProducts),
      customPrice: formData.customPrice.toString(),
      discount: formData.discount
    }
    
    onSubmit(submitData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Cliente */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h3 className="text-blue-800 font-semibold mb-3">Cliente</h3>
        <Select
          value={formData.customerId}
          onValueChange={(value) => setFormData(prev => ({ ...prev, customerId: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar cliente" />
          </SelectTrigger>
          <SelectContent>
            {customers.map((customer) => (
              <SelectItem key={customer.id} value={customer.id}>
                {customer.name} - {customer.rut}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Fechas y Cantidad */}
      <div className="bg-red-50 p-4 rounded-lg border border-red-200">
        <h3 className="text-[#C8201D] font-semibold mb-3">Fechas y Cantidad</h3>
        
        {/* Shortcut Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
          {[
            { boxes: 5, days: 7 }, { boxes: 10, days: 7 },
            { boxes: 15, days: 7 }, { boxes: 15, days: 14 }
          ].map(({ boxes, days }) => (
            <Button
              key={`${boxes}-${days}`}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const delivery = new Date()
                const returnDate = new Date()
                returnDate.setDate(delivery.getDate() + days)
                
                setFormData(prev => ({
                  ...prev,
                  totalBoxes: boxes,
                  deliveryDate: delivery.toISOString().split('T')[0],
                  returnDate: returnDate.toISOString().split('T')[0]
                }))
              }}
            >
              {boxes} cajas × {days} días
            </Button>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-4">
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
            <Label htmlFor="returnDate">Fecha de Devolución</Label>
            <Input
              id="returnDate"
              type="date"
              value={formData.returnDate}
              onChange={e => setFormData(prev => ({ ...prev, returnDate: e.target.value }))}
            />
          </div>
          
          <div>
            <Label htmlFor="totalBoxes">Cantidad de Cajas</Label>
            <Input
              id="totalBoxes"
              type="number"
              min="1"
              value={formData.totalBoxes}
              onChange={e => setFormData(prev => ({ ...prev, totalBoxes: parseInt(e.target.value) || 1 }))}
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              Disponibles: {availableBoxes} cajas
            </p>
          </div>
        </div>
      </div>

      {/* Direcciones */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="deliveryAddress">Dirección de Entrega</Label>
          <Input
            id="deliveryAddress"
            placeholder="Dirección completa de entrega"
            value={formData.deliveryAddress}
            onChange={e => setFormData(prev => ({ ...prev, deliveryAddress: e.target.value }))}
          />
        </div>
        
        <div>
          <Label htmlFor="pickupAddress">Dirección de Retiro</Label>
          <Input
            id="pickupAddress"
            placeholder="Dirección completa de retiro"
            value={formData.pickupAddress}
            onChange={e => setFormData(prev => ({ ...prev, pickupAddress: e.target.value }))}
          />
        </div>
      </div>

      {/* Estado (solo en edición) */}
      {rental && (
        <div>
          <Label htmlFor="status">Estado del Arriendo</Label>
          <Select
            value={formData.status}
            onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}
          >
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
      )}

      {/* Productos Adicionales */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-3">Productos Adicionales</h3>
        
        {/* Predefined Products Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
          {predefinedProducts.map((product) => (
            <Button
              key={product.name}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addPredefinedProduct(product)}
            >
              <Plus className="h-4 w-4 mr-1" />
              {product.name}
            </Button>
          ))}
        </div>

        {/* Added Products List */}
        {formData.additionalProducts.length > 0 && (
          <div className="space-y-2">
            {formData.additionalProducts.map((product: any, index: number) => (
              <div key={index} className="flex items-center gap-2 p-2 bg-white rounded border">
                <span className="flex-1 text-sm">{product.name}</span>
                <Input
                  type="number"
                  value={product.quantity}
                  onChange={e => updateProductQuantity(index, parseInt(e.target.value) || 0)}
                  className="w-16 h-8"
                  min="0"
                />
                <Input
                  type="number"
                  value={product.price}
                  onChange={e => updateProductPrice(index, parseInt(e.target.value) || 0)}
                  className="w-20 h-8"
                  min="0"
                />
                <span className="text-sm font-medium w-20 text-right">
                  {formatPrice(product.price * product.quantity)}
                </span>
              </div>
            ))}
            <div className="text-right font-medium text-green-600">
              Total productos: {formatPrice(additionalProductsTotal)}
            </div>
          </div>
        )}
      </div>

      {/* Precio Manual */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="manualPrice"
          checked={formData.manualPrice}
          onCheckedChange={(checked) => setFormData(prev => ({ 
            ...prev, 
            manualPrice: !!checked,
            customPrice: checked ? basePrice : 0
          }))}
        />
        <Label htmlFor="manualPrice">Precio manual</Label>
        {formData.manualPrice && (
          <Input
            type="number"
            value={formData.customPrice}
            onChange={e => setFormData(prev => ({ ...prev, customPrice: parseInt(e.target.value) || 0 }))}
            className="w-32"
            placeholder="Precio"
          />
        )}
      </div>

      {/* Notas */}
      <div>
        <Label htmlFor="notes">Notas Adicionales</Label>
        <Textarea
          id="notes"
          placeholder="Observaciones, instrucciones especiales, etc."
          value={formData.notes}
          onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
        />
      </div>

      {/* Resumen de Precios */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h3 className="text-blue-800 font-semibold mb-2">Resumen del Arriendo</h3>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span>{formData.totalBoxes} cajas × {rentalDays} días</span>
            <span>{formatPrice(finalPrice)}</span>
          </div>
          {additionalProductsTotal > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Productos adicionales</span>
              <span>{formatPrice(additionalProductsTotal)}</span>
            </div>
          )}
          {formData.discount > 0 && (
            <div className="flex justify-between text-red-600">
              <span>Descuento ({formData.discount}%)</span>
              <span>-{formatPrice(discountAmount)}</span>
            </div>
          )}
          <hr className="my-2" />
          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span>{formatPrice(totalAmount)}</span>
          </div>
          <div className="flex justify-between text-orange-600 font-medium">
            <span>Garantía ({formData.totalBoxes} × $2.000)</span>
            <span>{formatPrice(guaranteeAmount)}</span>
          </div>
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Guardando...' : rental ? 'Actualizar Arriendo' : 'Crear Arriendo'}
      </Button>
    </form>
  )
}

export default function CustomersFinalPage() {
  const { user, isLoading } = useCurrentUser()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  
  // Dialog states
  const [showCreateCustomer, setShowCreateCustomer] = useState(false)
  const [showEditCustomer, setShowEditCustomer] = useState(false)
  const [showCreateRental, setShowCreateRental] = useState(false)
  const [showEditRental, setShowEditRental] = useState(false)
  
  // Selected items
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [selectedRental, setSelectedRental] = useState<Rental | null>(null)

  // Queries
  const { data: customers = [], isLoading: loadingCustomers } = useQuery<Customer[]>({
    queryKey: ['/api/customers'],
    enabled: !!user
  })

  const { data: rentals = [] } = useQuery<Rental[]>({
    queryKey: ['/api/rentals'],
    enabled: !!user
  })

  const { data: drivers = [] } = useQuery({
    queryKey: ['/api/drivers'],
    enabled: !!user
  })

  // Mutations
  const createCustomerMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Failed to create customer')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/customers'] })
      toast({ title: "Cliente creado exitosamente" })
      setShowCreateCustomer(false)
    },
  })

  const updateCustomerMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await fetch(`/api/customers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Failed to update customer')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/customers'] })
      toast({ title: "Cliente actualizado exitosamente" })
      setShowEditCustomer(false)
      setSelectedCustomer(null)
    },
  })

  const createRentalMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/rentals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Failed to create rental')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/rentals'] })
      toast({ title: "Arriendo creado exitosamente" })
      // Don't close dialog - keep form open for continued use
    },
  })

  const updateRentalMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await fetch(`/api/rentals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Failed to update rental')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/rentals'] })
      toast({ title: "Arriendo actualizado exitosamente" })
      // Don't close dialog - keep form open
    },
  })

  // Filter customers
  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.rut?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Helper functions
  const getCustomerRentals = (customerId: string) => 
    rentals.filter(rental => rental.customerId === customerId)

  const getActiveRentals = (customerId: string) => 
    rentals.filter(rental => 
      rental.customerId === customerId && 
      ['pendiente', 'pagada', 'entregada', 'retirada'].includes(rental.status)
    )

  if (isLoading || loadingCustomers) {
    return <div className="flex justify-center items-center h-screen">Cargando...</div>
  }

  if (!user || user.role !== 'admin') {
    return <div className="flex justify-center items-center h-screen">Acceso denegado</div>
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar role={user?.role || 'admin'} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold text-gray-900">Gestión de Clientes</h1>
              <Button 
                onClick={() => setShowCreateCustomer(true)}
                className="bg-[#2E5CA6] hover:bg-blue-700"
              >
                <Plus className="h-5 w-5 mr-2" />
                Nuevo Cliente
              </Button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar clientes por nombre, email o RUT..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-[#2E5CA6]">{customers.length}</div>
                  <p className="text-sm text-gray-600">Total Clientes</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-green-600">{rentals.filter(r => ['entregada', 'retirada'].includes(r.status)).length}</div>
                  <p className="text-sm text-gray-600">Arriendos Activos</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-[#C8201D]">{rentals.filter(r => r.status === 'pendiente').length}</div>
                  <p className="text-sm text-gray-600">Pendientes</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-gray-600">{rentals.length}</div>
                  <p className="text-sm text-gray-600">Total Arriendos</p>
                </CardContent>
              </Card>
            </div>

            {/* Customers Cards */}
            <div className="grid gap-6">
              {filteredCustomers.map((customer) => {
                const customerRentals = getCustomerRentals(customer.id)
                const activeRentals = getActiveRentals(customer.id)
                
                return (
                  <CustomerCard 
                    key={customer.id}
                    customer={customer}
                    rentals={customerRentals}
                    activeRentals={activeRentals}
                    onEdit={() => {
                      setSelectedCustomer(customer)
                      setShowEditCustomer(true)
                    }}
                    onCreateRental={() => {
                      setSelectedCustomer(customer)
                      setShowCreateRental(true)
                    }}
                    onEditRental={(rental) => {
                      setSelectedRental(rental)
                      setShowEditRental(true)
                    }}
                  />
                )
              })}
            </div>
          </div>
        </main>
      </div>

      {/* Dialogs */}
      <Dialog open={showCreateCustomer} onOpenChange={setShowCreateCustomer}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Nuevo Cliente</DialogTitle>
          </DialogHeader>
          <CustomerForm 
            onSubmit={(data) => createCustomerMutation.mutate(data)}
            isLoading={createCustomerMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showEditCustomer} onOpenChange={setShowEditCustomer}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
          </DialogHeader>
          <CustomerForm 
            customer={selectedCustomer}
            onSubmit={(data) => updateCustomerMutation.mutate({ id: selectedCustomer!.id, data })}
            isLoading={updateCustomerMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showCreateRental} onOpenChange={setShowCreateRental}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Arriendo</DialogTitle>
          </DialogHeader>
          <RentalForm 
            customerId={selectedCustomer?.id}
            customers={customers}
            drivers={drivers}
            onSubmit={(data) => createRentalMutation.mutate(data)}
            isLoading={createRentalMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showEditRental} onOpenChange={setShowEditRental}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Arriendo</DialogTitle>
          </DialogHeader>
          <RentalForm 
            rental={selectedRental}
            customers={customers}
            drivers={drivers}
            onSubmit={(data) => updateRentalMutation.mutate({ id: selectedRental!.id, data })}
            isLoading={updateRentalMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}