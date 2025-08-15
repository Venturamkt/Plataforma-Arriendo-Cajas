import { useState, useEffect } from 'react'
import { useLocation } from 'wouter'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { apiRequest, queryClient } from '@/lib/queryClient'
import { useToast } from '@/hooks/use-toast'

// UI Components
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'

// Icons
import { Plus, Search, RefreshCw, Edit, Trash2, Eye, Calendar, Package, ChevronDown, ChevronRight } from 'lucide-react'

// Layout Components
import Header from '@/components/layout/header'
import Sidebar from '@/components/layout/sidebar'
import MobileNav from '@/components/layout/mobile-nav'

// Types
interface Customer {
  id: string
  name: string
  email: string
  phone: string
  rut: string
  address?: string
  createdAt?: string
}

interface Rental {
  id: string
  customerId: string
  totalBoxes: number
  deliveryDate: string
  returnDate?: string
  rentalDays: number
  dailyRate: number
  totalAmount: number
  guaranteeAmount: number
  status: string
  deliveryAddress: string
  pickupAddress: string
  notes?: string
  additionalProducts?: string
  driverId?: string
  trackingCode?: string
}

interface Driver {
  id: string
  name: string
  email: string
  phone: string
}

interface Box {
  id: string
  barcode: string
  status: string
}

// Helper Functions
const formatRut = (rut: string): string => {
  const cleaned = rut.replace(/[^0-9kK]/g, '')
  if (cleaned.length < 2) return cleaned
  const body = cleaned.slice(0, -1)
  const dv = cleaned.slice(-1)
  const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${formattedBody}-${dv}`
}

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0
  }).format(price)
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
  
  // Calculate based on base prices
  const basePrice7Days = priceTable[7]
  let baseBoxPrice = 0
  
  if (boxes <= 2) baseBoxPrice = basePrice7Days[2] / 2
  else if (boxes <= 5) baseBoxPrice = basePrice7Days[5] / 5
  else if (boxes <= 10) baseBoxPrice = basePrice7Days[10] / 10
  else baseBoxPrice = basePrice7Days[15] / 15
  
  return Math.round(baseBoxPrice * boxes * (days / 7))
}

// Customer Card Component
function CustomerCard({ 
  customer, 
  rentals, 
  activeRentals, 
  onEdit, 
  onCreateRental, 
  onEditRental,
  getStatusColor,
  getStatusText,
  formatPrice
}: {
  customer: Customer
  rentals: Rental[]
  activeRentals: Rental[]
  onEdit: () => void
  onCreateRental: () => void
  onEditRental: (rental: Rental) => void
  getStatusColor: (status: string) => string
  getStatusText: (status: string) => string
  formatPrice: (amount: number) => string
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
                <span className="ml-3">{customer.phone}</span>
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
              className="bg-blue-600 hover:bg-blue-700"
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
                .slice(0, 10) // Show last 10 rentals
                .map((rental) => (
                  <div key={rental.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Badge className={`${getStatusColor(rental.status)} text-white`}>
                        {getStatusText(rental.status)}
                      </Badge>
                      
                      <div className="text-sm">
                        <div className="font-medium">
                          {rental.totalBoxes} cajas × {rental.rentalDays || 0} días
                        </div>
                        <div className="text-gray-600">
                          {new Date(rental.deliveryDate).toLocaleDateString('es-CL')}
                          {rental.returnDate && ` - ${new Date(rental.returnDate).toLocaleDateString('es-CL')}`}
                        </div>
                      </div>
                      
                      <div className="text-sm">
                        <div className="font-medium">{formatPrice(parseInt(rental.totalAmount.toString()))}</div>
                        {rental.guaranteeAmount && (
                          <div className="text-gray-600">
                            + {formatPrice(parseInt(rental.guaranteeAmount.toString()))} garantía
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
                      
                      {/* Quick Status Selector */}
                      <Select
                        value={rental.status}
                        onValueChange={async (value) => {
                          // Update rental status directly via API
                          try {
                            const response = await fetch(`/api/rentals/${rental.id}`, {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ status: value })
                            })
                            
                            if (response.ok) {
                              // Reload rentals to show updated status
                              window.location.reload()
                            }
                          } catch (error) {
                            console.error('Error updating status:', error)
                          }
                        }}
                      >
                        <SelectTrigger className="w-32 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pendiente">🟡 Pendiente</SelectItem>
                          <SelectItem value="pagada">🟢 Pagada</SelectItem>
                          <SelectItem value="entregada">🔵 Entregada</SelectItem>
                          <SelectItem value="retirada">🟣 Retirada</SelectItem>
                          <SelectItem value="completada">✅ Completada</SelectItem>
                          <SelectItem value="cancelada">🔴 Cancelada</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditRental(rental)}
                        title="Editar arriendo completo"
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

export default function CustomersCleanPage() {
  const { user, isLoading } = useCurrentUser()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')
  
  // Dialog states
  const [showCreateCustomer, setShowCreateCustomer] = useState(false)
  const [showEditCustomer, setShowEditCustomer] = useState(false)
  const [showCreateRental, setShowCreateRental] = useState(false)
  const [showEditRental, setShowEditRental] = useState(false)
  
  // Selected items
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [selectedRental, setSelectedRental] = useState<Rental | null>(null)

  // Auth check
  useEffect(() => {
    if (isLoading) return
    if (!user || user.type !== 'admin') {
      window.location.href = "/"
    }
  }, [user, isLoading])

  // Data fetching
  const { data: customers = [], refetch: refetchCustomers } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
    refetchInterval: 5000
  })

  const { data: rentals = [], refetch: refetchRentals } = useQuery<Rental[]>({
    queryKey: ["/api/rentals"],
    refetchInterval: 5000
  })

  const { data: drivers = [] } = useQuery<Driver[]>({
    queryKey: ["/api/drivers"],
    refetchInterval: 5000
  })

  const { data: inventory = [] } = useQuery<Box[]>({
    queryKey: ["/api/boxes/"],
    refetchInterval: 5000
  })

  // Calculate available boxes
  const getAvailableBoxes = (deliveryDate: string, returnDate: string): number => {
    if (!deliveryDate || !returnDate || !inventory.length) return 0
    
    const totalBoxes = inventory.filter(box => box.status === 'available').length
    
    // Check for overlapping rentals
    const delivery = new Date(deliveryDate)
    const returnD = new Date(returnDate)
    
    const overlappingRentals = rentals.filter(rental => {
      if (['cancelada', 'completada'].includes(rental.status)) return false
      
      const rDelivery = new Date(rental.deliveryDate)
      const rReturn = rental.returnDate ? new Date(rental.returnDate) : 
        new Date(rDelivery.getTime() + (rental.rentalDays * 24 * 60 * 60 * 1000))
      
      return delivery <= rReturn && returnD >= rDelivery
    })
    
    const boxesInUse = overlappingRentals.reduce((sum, rental) => sum + rental.totalBoxes, 0)
    return Math.max(0, totalBoxes - boxesInUse)
  }

  // Mutations
  const createCustomerMutation = useMutation({
    mutationFn: async (data: Omit<Customer, 'id'>) => {
      const res = await apiRequest("POST", "/api/customers", data)
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] })
      toast({ title: "Cliente creado exitosamente" })
      setShowCreateCustomer(false)
    },
    onError: (error: any) => {
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
      setShowEditCustomer(false)
      setSelectedCustomer(null)
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Error al actualizar cliente",
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
      // Keep dialog open for more rentals
    },
    onError: (error: any) => {
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
      // Keep dialog open for continued editing
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Error al actualizar arriendo",
        variant: "destructive" 
      })
    }
  })

  // Filter customers
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
      case 'completada': return 'bg-gray-500'
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
      'completada': 'Completada',
      'cancelada': 'Cancelada'
    }
    return statusMap[status] || status
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
                <Button 
                  onClick={() => {
                    refetchCustomers()
                    refetchRentals()
                    toast({ title: "Datos actualizados" })
                  }} 
                  variant="outline" 
                  size="sm"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Actualizar
                </Button>
                <Button onClick={() => setShowCreateCustomer(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Cliente
                </Button>
              </div>
            </div>

            {/* Search */}
            <div className="flex items-center space-x-2 max-w-md">
              <Search className="h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nombre, email o RUT..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-2 mb-4">
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('table')}
              >
                <Eye className="h-4 w-4 mr-2" />
                Vista Tabla
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Export functionality
                  toast({ title: "Exportando historial de clientes..." })
                }}
              >
                Descargar Historial
              </Button>
              <Button onClick={() => setShowCreateCustomer(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Cliente
              </Button>
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
                    const hasActiveRentals = activeRentals.length > 0
                    const mostRecentRental = customerRentals
                      .sort((a, b) => new Date(b.deliveryDate).getTime() - new Date(a.deliveryDate).getTime())[0]
                    
                    return (
                      <TableRow key={customer.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              <div className="h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                                {customer.name.charAt(0).toUpperCase()}
                              </div>
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{customer.name}</div>
                              <div className="text-sm text-gray-500">
                                Cliente desde {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString('es-CL') : 'N/A'}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="text-sm">
                            <div className="text-gray-900">{customer.email}</div>
                            {customer.phone && (
                              <div className="text-gray-500">{customer.phone}</div>
                            )}
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                            {customer.rut || 'Sin RUT'}
                          </span>
                        </TableCell>
                        
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">
                              {hasActiveRentals ? `${activeRentals.length} activos` : '0 activos'} / {customerRentals.length} total
                            </div>
                            {hasActiveRentals && (
                              <div className="text-blue-600">
                                {activeRentals.reduce((sum, rental) => sum + (rental.totalBoxes || 0), 0)} cajas
                              </div>
                            )}
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          {hasActiveRentals ? (
                            <Badge className="bg-green-500 text-white">
                              entregada
                            </Badge>
                          ) : (
                            <Badge variant="outline">
                              sin arriendos
                            </Badge>
                          )}
                        </TableCell>
                        
                        <TableCell>
                          <div className="text-sm text-gray-500">
                            {mostRecentRental?.driverId ? (
                              <div>
                                <div>Asignar repartidor</div>
                                <div className="text-blue-600">Sin asignar</div>
                              </div>
                            ) : (
                              'Sin asignar'
                            )}
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedCustomer(customer)
                                setShowEditCustomer(true)
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedCustomer(customer)
                                setShowCreateRental(true)
                              }}
                            >
                              <Calendar className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                // Delete customer logic
                                if (confirm('¿Está seguro de eliminar este cliente?')) {
                                  toast({ title: 'Cliente eliminado' })
                                }
                              }}
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
              
              {filteredCustomers.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">No se encontraron clientes</p>
                </div>
              )}
            </Card>
          </div>
        </main>
      </div>

      {/* Create Customer Dialog */}
      <Dialog open={showCreateCustomer} onOpenChange={setShowCreateCustomer}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Cliente</DialogTitle>
            <DialogDescription>
              Complete los datos del nuevo cliente para agregarlo al sistema.
            </DialogDescription>
          </DialogHeader>
          <CustomerForm 
            onSubmit={(data) => createCustomerMutation.mutate(data)}
            isLoading={createCustomerMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Customer Dialog */}
      <Dialog open={showEditCustomer} onOpenChange={setShowEditCustomer}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
            <DialogDescription>
              Modifique los datos del cliente seleccionado.
            </DialogDescription>
          </DialogHeader>
          <CustomerForm 
            customer={selectedCustomer}
            onSubmit={(data) => updateCustomerMutation.mutate({ 
              id: selectedCustomer!.id, 
              data 
            })}
            isLoading={updateCustomerMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Create Rental Dialog */}
      <Dialog open={showCreateRental} onOpenChange={setShowCreateRental}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Arriendo</DialogTitle>
            <DialogDescription>
              Complete los datos del nuevo arriendo de cajas para el cliente seleccionado.
            </DialogDescription>
          </DialogHeader>
          <RentalForm 
            customerId={selectedCustomer?.id}
            customers={customers}
            drivers={drivers}
            getAvailableBoxes={getAvailableBoxes}
            onSubmit={(data) => createRentalMutation.mutate(data)}
            isLoading={createRentalMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Rental Dialog */}
      <Dialog open={showEditRental} onOpenChange={setShowEditRental}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Arriendo</DialogTitle>
            <DialogDescription>
              Modifique los datos del arriendo seleccionado.
            </DialogDescription>
          </DialogHeader>
          <RentalForm 
            rental={selectedRental}
            customers={customers}
            drivers={drivers}
            getAvailableBoxes={getAvailableBoxes}
            onSubmit={(data) => updateRentalMutation.mutate({ 
              id: selectedRental!.id, 
              data 
            })}
            isLoading={updateRentalMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
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
        <Label htmlFor="address">Dirección (opcional)</Label>
        <Input
          id="address"
          placeholder="Dirección completa"
          value={formData.address}
          onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Guardando...' : (customer ? 'Actualizar Cliente' : 'Crear Cliente')}
      </Button>
    </form>
  )
}

// Rental Form Component
function RentalForm({ 
  rental, 
  customerId, 
  customers, 
  drivers,
  getAvailableBoxes,
  onSubmit, 
  isLoading 
}: { 
  rental?: Rental | null
  customerId?: string
  customers: Customer[]
  drivers: Driver[]
  getAvailableBoxes: (delivery: string, returnDate: string) => number
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

  const [calculatedPrice, setCalculatedPrice] = useState(0)
  const [rentalDays, setRentalDays] = useState(7)
  const [showAddProductDialog, setShowAddProductDialog] = useState(false)
  const [newProduct, setNewProduct] = useState({ name: '', price: 0, quantity: 1 })
  
  // Calculate rental days and price
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

  // Shortcuts
  const applyShortcut = (boxes: number, days: number) => {
    const today = new Date()
    const deliveryDate = new Date(today)
    const returnDate = new Date(today)
    returnDate.setDate(today.getDate() + days)
    
    setFormData(prev => ({
      ...prev,
      totalBoxes: boxes,
      deliveryDate: deliveryDate.toISOString().split('T')[0],
      returnDate: returnDate.toISOString().split('T')[0]
    }))
  }

  const availableBoxes = formData.deliveryDate && formData.returnDate 
    ? getAvailableBoxes(formData.deliveryDate, formData.returnDate)
    : 0

  const additionalProductsTotal = formData.additionalProducts.reduce(
    (sum: number, product: any) => sum + (product.price * product.quantity), 0
  )

  const finalPrice = formData.manualPrice ? formData.customPrice : calculatedPrice
  const discountAmount = finalPrice * (formData.discount / 100)
  const totalAmount = Math.round(finalPrice - discountAmount + additionalProductsTotal)
  const guaranteeAmount = formData.totalBoxes * 2000

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
    
    // Don't reset form data - keep everything for continued editing
    // Form will stay open with current data intact
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Customer Selection */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <Label className="text-lg font-semibold text-blue-800 mb-4 block">Cliente</Label>
        <Select
          value={formData.customerId}
          onValueChange={(value) => setFormData(prev => ({ ...prev, customerId: value }))}
          required
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

      {/* Status Selection - Only show when editing */}
      {rental && (
        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
          <Label className="text-lg font-semibold text-orange-800 mb-4 block">Estado del Arriendo</Label>
          <Select
            value={formData.status || rental.status}
            onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pendiente">🟡 Pendiente</SelectItem>
              <SelectItem value="pagada">🟢 Pagada</SelectItem>
              <SelectItem value="entregada">🔵 Entregada</SelectItem>
              <SelectItem value="retirada">🟣 Retirada</SelectItem>
              <SelectItem value="completada">✅ Completada</SelectItem>
              <SelectItem value="cancelada">🔴 Cancelada</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-orange-600 mt-2">
            Cambiar el estado enviará automáticamente un email de notificación al cliente.
          </p>
        </div>
      )}

      {/* Date and Quantity Section */}
      <div className="bg-red-50 p-4 rounded-lg border border-red-200">
        <Label className="text-lg font-semibold text-red-800 mb-4 block">Fechas y Cantidad</Label>
        
        {/* Quick Shortcuts */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
          {[
            { boxes: 5, days: 7, label: '5 cajas × 7 días' },
            { boxes: 10, days: 7, label: '10 cajas × 7 días' },
            { boxes: 15, days: 7, label: '15 cajas × 7 días' },
            { boxes: 15, days: 14, label: '15 cajas × 14 días' }
          ].map((shortcut, index) => (
            <Button
              key={index}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => applyShortcut(shortcut.boxes, shortcut.days)}
              className="text-xs"
            >
              {shortcut.label}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              required
            />
          </div>
          
          <div>
            <Label htmlFor="totalBoxes">Cantidad de Cajas</Label>
            <Input
              id="totalBoxes"
              type="number"
              min="1"
              max={availableBoxes || 100}
              value={formData.totalBoxes}
              onChange={e => setFormData(prev => ({ ...prev, totalBoxes: parseInt(e.target.value) || 1 }))}
              required
            />
            <p className="text-sm text-gray-600 mt-1">
              Disponibles: {availableBoxes} cajas
            </p>
          </div>
        </div>
      </div>

      {/* Addresses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="deliveryAddress">Dirección de Entrega</Label>
          <Input
            id="deliveryAddress"
            placeholder="Dirección completa de entrega"
            value={formData.deliveryAddress}
            onChange={e => setFormData(prev => ({ ...prev, deliveryAddress: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="pickupAddress">Dirección de Retiro</Label>
          <Input
            id="pickupAddress"
            placeholder="Dirección completa de retiro"
            value={formData.pickupAddress}
            onChange={e => setFormData(prev => ({ ...prev, pickupAddress: e.target.value }))}
            required
          />
        </div>
      </div>

      {/* Status (for editing) */}
      {rental && (
        <div>
          <Label htmlFor="status">Estado del Arriendo</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pendiente">Pendiente</SelectItem>
              <SelectItem value="pagada">Pagada</SelectItem>
              <SelectItem value="entregada">Entregada</SelectItem>
              <SelectItem value="retirada">Retirada</SelectItem>
              <SelectItem value="completada">Completada</SelectItem>
              <SelectItem value="cancelada">Cancelada</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Notes */}
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
      <div className="bg-gray-50 p-4 rounded-lg border">
        <div className="flex justify-between items-center mb-4">
          <Label className="text-base font-semibold">Productos Adicionales</Label>
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

        {/* Productos Predefinidos */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
          {[
            { name: 'Carrito plegable', price: 15000 },
            { name: 'Base móvil', price: 8000 },
            { name: 'Kit 2 bases móviles', price: 15000 },
            { name: 'Correa Ratchet', price: 3000 },
          ].map((product, index) => (
            <Button
              key={index}
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                const exists = formData.additionalProducts.find((p: any) => p.name === product.name)
                if (!exists) {
                  setFormData(prev => ({
                    ...prev,
                    additionalProducts: [...prev.additionalProducts, { ...product, quantity: 1 }]
                  }))
                }
              }}
              className="text-xs bg-white hover:bg-blue-50 border text-left p-2 h-auto flex flex-col items-start"
            >
              <span className="font-medium">{product.name}</span>
              <span className="text-gray-500">{formatPrice(product.price)}</span>
            </Button>
          ))}
        </div>
        
        {/* Lista de Productos Agregados */}
        {formData.additionalProducts.length > 0 && (
          <div className="space-y-2 mb-4">
            {formData.additionalProducts.map((product: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white rounded border">
                <div className="flex-1">
                  <span className="font-medium">{product.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="text"
                    value={product.price.toString()}
                    onChange={e => {
                      const value = e.target.value.replace(/[^0-9]/g, '')
                      const newProducts = [...formData.additionalProducts]
                      newProducts[index] = { ...product, price: parseInt(value) || 0 }
                      setFormData(prev => ({ ...prev, additionalProducts: newProducts }))
                    }}
                    className="w-20 text-center"
                    placeholder="0"
                  />
                  <span>×</span>
                  <Input
                    type="text"
                    value={product.quantity.toString()}
                    onChange={e => {
                      const value = e.target.value.replace(/[^0-9]/g, '')
                      const newProducts = [...formData.additionalProducts]
                      newProducts[index] = { ...product, quantity: parseInt(value) || 1 }
                      setFormData(prev => ({ ...prev, additionalProducts: newProducts }))
                    }}
                    className="w-16 text-center"
                    placeholder="1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const newProducts = formData.additionalProducts.filter((_: any, i: number) => i !== index)
                      setFormData(prev => ({ ...prev, additionalProducts: newProducts }))
                    }}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Total de productos adicionales */}
        {additionalProductsTotal > 0 && (
          <div className="bg-blue-50 p-3 rounded border text-right">
            <span className="font-medium text-blue-800">
              Total productos adicionales: {formatPrice(additionalProductsTotal)}
            </span>
          </div>
        )}
      </div>

      {/* Pricing Section */}
      <div className="bg-green-50 p-6 rounded-lg border border-green-200">
        <Label className="text-lg font-semibold text-green-800 mb-4 block">Configuración de Precios</Label>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
            <Label htmlFor="manualPrice" className="font-medium">Precio manual</Label>
          </div>

          {formData.manualPrice && (
            <div>
              <Label htmlFor="customPrice" className="text-sm font-medium">Precio Personalizado</Label>
              <Input
                id="customPrice"
                type="number"
                min="0"
                value={formData.customPrice}
                onChange={e => setFormData(prev => ({ ...prev, customPrice: parseInt(e.target.value) || 0 }))}
                placeholder="25000"
                className="mt-1"
              />
            </div>
          )}
        </div>

        <div>
          <Label htmlFor="discount">Descuento (%)</Label>
          <Input
            id="discount"
            type="number"
            min="0"
            max="100"
            value={formData.discount}
            onChange={e => setFormData(prev => ({ ...prev, discount: parseInt(e.target.value) || 0 }))}
            placeholder="10"
          />
        </div>

        {/* Price Summary */}
        <div className="bg-white p-4 rounded-lg border shadow-sm mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <p className="flex justify-between">
                <span className="font-medium">Período:</span> 
                <span>{rentalDays} días</span>
              </p>
              <p className="flex justify-between">
                <span className="font-medium">Precio base:</span> 
                <span>{formatPrice(finalPrice)}</span>
              </p>
              {formData.discount > 0 && (
                <p className="flex justify-between text-red-600">
                  <span className="font-medium">Descuento ({formData.discount}%):</span> 
                  <span>-{formatPrice(discountAmount)}</span>
                </p>
              )}
              <p className="flex justify-between">
                <span className="font-medium">Garantía ({formData.totalBoxes} cajas):</span> 
                <span>{formatPrice(guaranteeAmount)}</span>
              </p>
            </div>
            <div className="space-y-2">
              <p className="flex justify-between text-lg font-bold text-green-700">
                <span>Total Arriendo:</span> 
                <span>{formatPrice(totalAmount)}</span>
              </p>
              <p className="flex justify-between text-lg font-bold text-blue-700">
                <span>Total + Garantía:</span> 
                <span>{formatPrice(totalAmount + guaranteeAmount)}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <Button 
        type="submit" 
        className="w-full py-3 text-lg font-semibold bg-blue-600 hover:bg-blue-700" 
        disabled={isLoading}
      >
        {isLoading ? '⏳ Procesando...' : (rental ? '📝 Actualizar Arriendo' : '🎯 Crear Arriendo')}
      </Button>

      {/* Dialog para agregar productos personalizados */}
      <Dialog open={showAddProductDialog} onOpenChange={setShowAddProductDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Agregar Producto Personalizado</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="productName">Nombre del Producto</Label>
              <Input
                id="productName"
                placeholder="Ej: Candado extra, Cinta adhesiva..."
                value={newProduct.name}
                onChange={e => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="productPrice">Precio</Label>
                <Input
                  id="productPrice"
                  type="text"
                  value={newProduct.price.toString()}
                  onChange={e => {
                    const value = e.target.value.replace(/[^0-9]/g, '')
                    setNewProduct(prev => ({ ...prev, price: parseInt(value) || 0 }))
                  }}
                  placeholder="20000"
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
    </form>
  )
}