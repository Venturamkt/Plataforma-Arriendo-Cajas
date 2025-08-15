import React, { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useLocation } from 'wouter'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
  Package
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { apiRequest, queryClient } from '@/lib/queryClient'
import Header from '@/components/layout/header'
import Sidebar from '@/components/layout/sidebar'

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
  createdAt: string
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
    if (!products) return []
    if (Array.isArray(products)) return products
    if (typeof products === 'string') {
      const parsed = JSON.parse(products)
      return Array.isArray(parsed) ? parsed : []
    }
    return []
  } catch {
    return []
  }
}

export default function Customers() {
  const [, setLocation] = useLocation()
  
  // State
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table')
  const [showNewCustomerDialog, setShowNewCustomerDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showRentalDialog, setShowRentalDialog] = useState(false)
  const [includeRental, setIncludeRental] = useState(false)
  
  const [newCustomer, setNewCustomer] = useState<NewCustomer>({
    name: '', email: '', phone: '', rut: ''
  })
  
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [selectedRental, setSelectedRental] = useState<any>(null)
  const [showCustomerDetails, setShowCustomerDetails] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [showDriverEditDialog, setShowDriverEditDialog] = useState(false)
  const [editingDriverRental, setEditingDriverRental] = useState<any>(null)
  
  const [newRental, setNewRental] = useState<NewRental>({
    boxQuantity: 2,
    rentalDays: 7,
    deliveryDate: '',
    pickupDate: '',
    deliveryAddress: '',
    pickupAddress: '',
    notes: '',
    customPrice: 2775,
    discount: 0,
    additionalProducts: [],
    manualPrice: false
  })

  // Queries
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false
  })

  const { data: customers = [], isLoading: customersLoading } = useQuery<Customer[]>({
    queryKey: ["/api/customers"]
  })

  const { data: rentals = [] } = useQuery<Rental[]>({
    queryKey: ["/api/rentals"]
  })

  const { data: drivers = [] } = useQuery({
    queryKey: ["/api/drivers"]
  })

  const { data: inventory = [] } = useQuery({
    queryKey: ["/api/inventory"],
    refetchInterval: 5000
  })

  // Mutations
  const createCustomerMutation = useMutation({
    mutationFn: async (customer: NewCustomer) => {
      const res = await apiRequest("POST", "/api/customers", customer)
      return res.json()
    },
    onSuccess: (createdCustomer) => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] })
      toast({
        title: "Cliente creado",
        description: "El cliente ha sido agregado exitosamente"
      })
      
      if (includeRental) {
        createRentalForCustomer(createdCustomer.id)
      } else {
        resetNewCustomerForm()
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el cliente",
        variant: "destructive"
      })
    }
  })

  const updateCustomerMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: Partial<Customer> }) => {
      const res = await apiRequest("PATCH", `/api/customers/${id}`, data)
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
        description: error.message || "No se pudo actualizar el cliente",
        variant: "destructive"
      })
    }
  })

  const deleteCustomerMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/customers/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] })
      toast({
        title: "Cliente eliminado",
        description: "El cliente ha sido eliminado exitosamente"
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el cliente",
        variant: "destructive"
      })
    }
  })

  const createRentalMutation = useMutation({
    mutationFn: async (rental: any) => {
      const res = await apiRequest("POST", "/api/rentals", rental)
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rentals"] })
      toast({
        title: "Arriendo creado",
        description: "El arriendo ha sido creado exitosamente"
      })
      resetNewCustomerForm()
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el arriendo",
        variant: "destructive"
      })
    }
  })

  const updateDriverMutation = useMutation({
    mutationFn: async ({ rentalId, driverId }: { rentalId: string, driverId: string }) => {
      const res = await apiRequest("PUT", `/api/rentals/${rentalId}/assign-driver`, { driverId })
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rentals"] })
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] })
      toast({
        title: "Repartidor asignado",
        description: "El repartidor ha sido asignado exitosamente"
      })
      setShowDriverEditDialog(false)
      setEditingDriverRental(null)
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo asignar el repartidor",
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
      toast({
        title: "Arriendo actualizado",
        description: "El arriendo ha sido actualizado exitosamente"
      })
      setShowRentalDialog(false)
      setSelectedRental(null)
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el arriendo",
        variant: "destructive"
      })
    }
  })

  // Helper functions
  const resetNewCustomerForm = () => {
    setShowNewCustomerDialog(false)
    setNewCustomer({ name: '', email: '', phone: '', rut: '' })
    setIncludeRental(false)
    setNewRental({
      boxQuantity: 2,
      rentalDays: 7,
      deliveryDate: '',
      pickupDate: '',
      deliveryAddress: '',
      pickupAddress: '',
      notes: '',
      customPrice: 2775,
      discount: 0,
      additionalProducts: [],
      manualPrice: false
    })
  }

  const createRentalForCustomer = async (customerId: string) => {
    const rentalData = {
      customerId,
      totalBoxes: newRental.boxQuantity,
      dailyRate: (newRental.manualPrice ? newRental.customPrice : getPriceByPeriod(newRental.boxQuantity, newRental.rentalDays)).toString(),
      totalAmount: (newRental.manualPrice ? newRental.customPrice : getPriceByPeriod(newRental.boxQuantity, newRental.rentalDays)).toString(),
      guaranteeAmount: (newRental.boxQuantity * 2000).toString(),
      additionalProducts: JSON.stringify(newRental.additionalProducts),
      additionalProductsTotal: newRental.additionalProducts.reduce((sum, product) => sum + (product.price * product.quantity), 0).toString(),
      deliveryDate: new Date(newRental.deliveryDate),
      returnDate: newRental.pickupDate ? new Date(newRental.pickupDate) : null,
      deliveryAddress: newRental.deliveryAddress,
      pickupAddress: newRental.pickupAddress || newRental.deliveryAddress,
      notes: newRental.notes,
      status: 'pendiente'
    }

    await createRentalMutation.mutateAsync(rentalData)
  }

  const getCustomerRental = (customerId: string): Rental | null => {
    const customerRentals = rentals.filter((rental: Rental) => rental.customerId === customerId)
    return customerRentals.length > 0 
      ? customerRentals.sort((a: Rental, b: Rental) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
      : null
  }

  const getCustomerRentalInfo = (customerId: string) => {
    const customerRentals = rentals.filter((r: Rental) => r.customerId === customerId)
    const activeRentals = customerRentals.filter((r: Rental) => 
      r.status && ['pendiente', 'pagada', 'entregada', 'retirada'].includes(r.status)
    )
    
    const totalSpent = customerRentals.reduce((sum: number, rental: Rental) => {
      const amount = typeof rental.totalAmount === 'string' 
        ? parseInt(rental.totalAmount) || 0
        : 0
      return sum + amount
    }, 0)

    // Get latest active rental for driver info
    const latestActiveRental = activeRentals.length > 0 
      ? activeRentals.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] 
      : null

    return {
      active: activeRentals.length,
      total: customerRentals.length,
      totalSpent,
      status: activeRentals.length > 0 ? activeRentals[0].status : 'Sin arriendos activos',
      driverName: latestActiveRental?.driverName || null,
      driverEmail: latestActiveRental?.driverEmail || null
    }
  }

  const handleEditRental = (customerId: string) => {
    const rental = getCustomerRental(customerId)
    if (rental) {
      const parsedAdditionalProducts = parseAdditionalProducts(rental.additionalProducts)
      
      setSelectedRental({
        ...rental,
        additionalProducts: parsedAdditionalProducts,
        boxQuantity: rental.totalBoxes || 2,
        rentalDays: rental.rentalDays || 7
      })
      setShowRentalDialog(true)
    }
  }

  const checkBoxAvailability = (quantity: number) => {
    const inventoryArray = Array.isArray(inventory) ? inventory : []
    const availableBoxes = inventoryArray.filter((box: any) => 
      box.status === 'available' || box.status === 'maintenance'
    ).length
    return availableBoxes >= quantity
  }

  const handleRutChange = (value: string, isEditing = false) => {
    const formatted = formatRut(value)
    if (isEditing && editingCustomer) {
      setEditingCustomer({ ...editingCustomer, rut: formatted })
    } else {
      setNewCustomer({ ...newCustomer, rut: formatted })
    }
  }

  const filteredCustomers = customers.filter((customer: Customer) =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (customer.phone && customer.phone.includes(searchQuery))
  )

  const downloadHistory = async () => {
    try {
      const customersMap = customers.reduce((acc: any, customer: any) => {
        acc[customer.id] = customer
        return acc
      }, {})

      const headers = [
        'Fecha Creación', 'Cliente', 'RUT', 'Email', 'Teléfono',
        'Cantidad Cajas', 'Días Arriendo', 'Fecha Entrega', 'Dirección Entrega',
        'Dirección Retiro', 'Estado', 'Monto Total', 'Garantía',
        'Código Seguimiento', 'Productos Adicionales', 'Notas'
      ]

      const rows = rentals.map((rental: Rental) => {
        const customer = customersMap[rental.customerId] || {}
        const additionalProducts = parseAdditionalProducts(rental.additionalProducts)
        const additionalProductsText = additionalProducts.length > 0 
          ? additionalProducts.map((p: any) => `${p.name} x${p.quantity || 1} ($${p.price.toLocaleString()})`).join('; ')
          : 'Ninguno'

        return [
          new Date(rental.createdAt || '').toLocaleDateString('es-CL'),
          customer.name || 'N/A',
          customer.rut || 'N/A',
          customer.email || 'N/A',
          customer.phone || 'N/A',
          rental.totalBoxes || 0,
          rental.rentalDays || 0,
          new Date(rental.deliveryDate || '').toLocaleDateString('es-CL'),
          rental.deliveryAddress || 'N/A',
          rental.pickupAddress || rental.deliveryAddress || 'N/A',
          rental.status || 'N/A',
          `$${(parseInt(rental.totalAmount) || 0).toLocaleString()}`,
          `$${(parseInt(rental.guaranteeAmount) || 0).toLocaleString()}`,
          rental.trackingCode || 'N/A',
          additionalProductsText,
          rental.notes || 'N/A'
        ]
      })

      const csvContent = [headers, ...rows]
        .map(row => row.map((cell: any) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n')

      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `historico_arriendos_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Descarga completada",
        description: `Se descargó el histórico de ${rentals.length} arriendos`
      })
    } catch (error) {
      toast({
        title: "Error en descarga",
        description: "No se pudo descargar el histórico",
        variant: "destructive"
      })
    }
  }

  // Loading state
  if (userLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-red mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    )
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

          {/* Search and Actions */}
          <Card className="mb-6">
            <CardHeader className="p-4 md:p-6">
              <div className="flex flex-col gap-4">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por nombre, email o teléfono..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-full"
                  />
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 justify-between">
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
                      <List className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={downloadHistory}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Descargar Histórico
                    </Button>
                    <Button
                      onClick={() => setShowNewCustomerDialog(true)}
                      className="bg-brand-red hover:bg-red-700 text-white"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Nuevo Cliente
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Customer List */}
          {customersLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-red mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando clientes...</p>
            </div>
          ) : viewMode === 'table' ? (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Contacto</TableHead>
                        <TableHead>RUT</TableHead>
                        <TableHead>Arriendos</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Repartidor</TableHead>
                        <TableHead className="text-center">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCustomers.map((customer: Customer) => {
                        const rentalInfo = getCustomerRentalInfo(customer.id)
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
                                <button 
                                  className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer"
                                  onClick={() => {
                                    setSelectedCustomer(customer)
                                    setShowCustomerDetails(true)
                                  }}
                                >
                                  {customer.name}
                                </button>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="text-sm">{customer.email}</div>
                                {customer.phone && (
                                  <div className="text-sm text-gray-500">{customer.phone}</div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{customer.rut}</TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <span className="font-semibold text-brand-blue">{rentalInfo.active}</span> activos
                                <span className="text-gray-500"> / </span>
                                <span className="font-semibold">{rentalInfo.total}</span> total
                              </div>
                            </TableCell>
                            <TableCell>
                              {rentalInfo.active > 0 ? (
                                <Badge variant="default" className="bg-green-100 text-green-800">
                                  {rentalInfo.status}
                                </Badge>
                              ) : (
                                <Badge variant="secondary">
                                  Sin arriendos activos
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {(() => {
                                // Get the latest rental with driver assignment
                                const latestRental = rentals
                                  .filter((r: Rental) => r.customerId === customer.id && r.assignedDriver)
                                  .sort((a: Rental, b: Rental) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
                                
                                if (latestRental?.assignedDriver) {
                                  return (
                                    <div className="flex items-center space-x-3">
                                      <div className="flex-1">
                                        <div className="flex items-center space-x-2">
                                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                            <span className="text-xs font-semibold text-green-700">
                                              {latestRental.assignedDriver.split(' ').map(n => n[0]).join('')}
                                            </span>
                                          </div>
                                          <div>
                                            <div className="font-medium text-gray-900 text-sm">{latestRental.assignedDriver}</div>
                                            <div className="text-xs text-gray-500 font-mono">
                                              {latestRental.masterCode || 'Sin código'}
                                            </div>
                                          </div>
                                        </div>
                                        <button
                                          className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                                          onClick={() => {
                                            const rental = getCustomerRental(customer.id)
                                            setEditingDriverRental(rental)
                                            setShowDriverEditDialog(true)
                                          }}
                                        >
                                          Cambiar repartidor
                                        </button>
                                      </div>
                                    </div>
                                  );
                                } else if (rentalInfo.active > 0) {
                                  return (
                                    <div className="flex items-center space-x-3">
                                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                        <span className="text-xs text-gray-500">?</span>
                                      </div>
                                      <div>
                                        <button
                                          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                                          onClick={() => {
                                            const rental = getCustomerRental(customer.id)
                                            setEditingDriverRental(rental)
                                            setShowDriverEditDialog(true)
                                          }}
                                        >
                                          Asignar repartidor
                                        </button>
                                        <div className="text-xs text-gray-400">Sin asignar</div>
                                      </div>
                                    </div>
                                  );
                                } else {
                                  return <span className="text-gray-400 text-sm">Sin arriendos activos</span>;
                                }
                              })()}
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
                                  title="Editar cliente"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                {rentalInfo.total > 0 && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleEditRental(customer.id)}
                                    title="Editar arriendo"
                                    className="text-blue-600"
                                  >
                                    <Calendar className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-red-600"
                                  onClick={() => {
                                    if (confirm("¿Estás seguro de que quieres eliminar este cliente?")) {
                                      deleteCustomerMutation.mutate(customer.id)
                                    }
                                  }}
                                  disabled={deleteCustomerMutation.isPending}
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
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Cards view for mobile */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCustomers.map((customer: Customer) => {
                const rentalInfo = getCustomerRentalInfo(customer.id)
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
                      </div>
                      
                      <div className="flex justify-between items-center mt-4 pt-3 border-t">
                        <div className="text-sm">
                          <span className="font-semibold text-brand-blue">{rentalInfo.active}</span> activos
                          <span className="text-gray-500"> / </span>
                          <span className="font-semibold">{rentalInfo.total}</span> total
                        </div>
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setEditingCustomer(customer)
                              setShowEditDialog(true)
                            }}
                            title="Editar cliente"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          {rentalInfo.total > 0 && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEditRental(customer.id)}
                              title="Editar arriendo"
                              className="text-blue-600"
                            >
                              <Calendar className="h-4 w-4" />
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-600"
                            onClick={() => {
                              if (confirm("¿Estás seguro de que quieres eliminar este cliente?")) {
                                deleteCustomerMutation.mutate(customer.id)
                              }
                            }}
                            disabled={deleteCustomerMutation.isPending}
                            title="Eliminar cliente"
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

          {/* New Customer Dialog */}
          <Dialog open={showNewCustomerDialog} onOpenChange={setShowNewCustomerDialog}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nuevo Cliente</DialogTitle>
              </DialogHeader>
              
              <form onSubmit={async (e) => {
                e.preventDefault()
                await createCustomerMutation.mutateAsync(newCustomer)
              }} className="space-y-6">
                {/* Customer Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nombre completo *</Label>
                    <Input
                      id="name"
                      value={newCustomer.name}
                      onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                      placeholder="Ej: Juan Pérez García"
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="rut">RUT *</Label>
                    <Input
                      id="rut"
                      value={newCustomer.rut}
                      onChange={(e) => handleRutChange(e.target.value)}
                      placeholder="Ej: 12.345.678-9"
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newCustomer.email}
                      onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                      placeholder="Ej: juan@email.com"
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input
                      id="phone"
                      value={newCustomer.phone}
                      onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                      placeholder="Ej: +56987654321"
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Include Rental Option */}
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="includeRental"
                    checked={includeRental}
                    onChange={(e) => setIncludeRental(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="includeRental">Crear arriendo inmediatamente</Label>
                </div>

                {/* Rental Form (conditional) */}
                {includeRental && (
                  <div className="space-y-6 border-t pt-6">
                    <h3 className="text-lg font-semibold">Detalles del Arriendo</h3>
                    
                    {/* Quick Settings */}
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <Label className="text-sm font-medium text-gray-700">Configuraciones rápidas</Label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                        {[
                          { boxes: 10, days: 7, label: "10 cajas - 7 días" },
                          { boxes: 15, days: 7, label: "15 cajas - 7 días" },
                          { boxes: 10, days: 14, label: "10 cajas - 14 días" },
                          { boxes: 15, days: 14, label: "15 cajas - 14 días" }
                        ].map((preset) => (
                          <Button
                            key={`${preset.boxes}-${preset.days}`}
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setNewRental({
                                ...newRental,
                                boxQuantity: preset.boxes,
                                rentalDays: preset.days
                              })
                            }}
                            className="text-xs"
                          >
                            {preset.label}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Manual Controls */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Cantidad de cajas</Label>
                        <div className="flex gap-2 mt-1">
                          <Select
                            value={[2, 5, 10, 15].includes(newRental.boxQuantity) ? newRental.boxQuantity.toString() : 'custom'}
                            onValueChange={(value) => {
                              const boxes = value === 'custom' ? 1 : parseInt(value)
                              // Validate inventory availability
                              const availableBoxes = inventory?.filter(box => box.status === 'available').length || 0;
                              if (boxes > availableBoxes) {
                                toast({
                                  title: "Inventario insuficiente",
                                  description: `Solo hay ${availableBoxes} cajas disponibles, pero necesitas ${boxes}`,
                                  variant: "destructive"
                                });
                                return;
                              }
                              setNewRental({ ...newRental, boxQuantity: boxes })
                            }}
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="2">2 cajas</SelectItem>
                              <SelectItem value="5">5 cajas</SelectItem>
                              <SelectItem value="10">10 cajas</SelectItem>
                              <SelectItem value="15">15 cajas</SelectItem>
                              <SelectItem value="custom">Personalizado</SelectItem>
                            </SelectContent>
                          </Select>
                          {![2, 5, 10, 15].includes(newRental.boxQuantity) && (
                            <Input
                              type="number"
                              placeholder="Cantidad"
                              min="1"
                              value={newRental.boxQuantity}
                              className="w-24"
                              onChange={(e) => setNewRental({ ...newRental, boxQuantity: parseInt(e.target.value) || 1 })}
                            />
                          )}
                        </div>
                      </div>
                      <div>
                        <Label>Días de arriendo</Label>
                        <div className="flex gap-2 mt-1">
                          <Select
                            value={[7, 14, 30].includes(newRental.rentalDays) ? newRental.rentalDays.toString() : 'custom'}
                            onValueChange={(value) => {
                              const days = value === 'custom' ? 1 : parseInt(value)
                              const newPickupDate = newRental.deliveryDate ? 
                                new Date(new Date(newRental.deliveryDate).getTime() + (days - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : 
                                newRental.pickupDate
                              setNewRental({ 
                                ...newRental, 
                                rentalDays: days,
                                pickupDate: newPickupDate
                              })
                            }}
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="7">7 días</SelectItem>
                              <SelectItem value="14">14 días</SelectItem>
                              <SelectItem value="30">30 días</SelectItem>
                              <SelectItem value="custom">Personalizado</SelectItem>
                            </SelectContent>
                          </Select>
                          {![7, 14, 30].includes(newRental.rentalDays) && (
                            <Input
                              type="number"
                              placeholder="Días"
                              min="1"
                              max="90"
                              value={newRental.rentalDays}
                              className="w-24"
                              onChange={(e) => {
                                const days = parseInt(e.target.value) || 1
                                const newPickupDate = newRental.deliveryDate ? 
                                  new Date(new Date(newRental.deliveryDate).getTime() + (days - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : 
                                  newRental.pickupDate
                                
                                // Validate inventory availability
                                const availableBoxes = inventory?.filter(box => box.status === 'available').length || 0;
                                if (newRental.boxQuantity > availableBoxes) {
                                  toast({
                                    title: "Inventario insuficiente",
                                    description: `Solo hay ${availableBoxes} cajas disponibles, pero necesitas ${newRental.boxQuantity}`,
                                    variant: "destructive"
                                  });
                                  return;
                                }
                                
                                setNewRental({ 
                                  ...newRental, 
                                  rentalDays: days,
                                  pickupDate: newPickupDate
                                })
                              }}
                            />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="delivery-date">Fecha de entrega</Label>
                        <Input
                          id="delivery-date"
                          type="date"
                          value={newRental.deliveryDate}
                          onChange={(e) => {
                            const newPickupDate = e.target.value ? 
                              new Date(new Date(e.target.value).getTime() + (newRental.rentalDays - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : 
                              ''
                            setNewRental({ 
                              ...newRental, 
                              deliveryDate: e.target.value,
                              pickupDate: newPickupDate
                            })
                          }}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="pickup-date">Fecha de retiro</Label>
                        <Input
                          id="pickup-date"
                          type="date"
                          value={newRental.pickupDate}
                          onChange={(e) => setNewRental({ ...newRental, pickupDate: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                    </div>

                    {/* Addresses */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="delivery-address">Dirección de entrega</Label>
                        <Input
                          id="delivery-address"
                          value={newRental.deliveryAddress}
                          onChange={(e) => setNewRental({ ...newRental, deliveryAddress: e.target.value })}
                          placeholder="Dirección completa de entrega"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="pickup-address">Dirección de retiro</Label>
                        <Input
                          id="pickup-address"
                          value={newRental.pickupAddress}
                          onChange={(e) => setNewRental({ ...newRental, pickupAddress: e.target.value })}
                          placeholder="Si es diferente a la entrega..."
                          className="mt-1"
                        />
                      </div>
                    </div>

                    {/* Additional Products */}
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <Label className="text-sm font-medium text-gray-700">Productos adicionales</Label>
                      <div className="space-y-3 mt-2">
                        {[
                          { name: 'Carrito plegable', defaultPrice: 15000 },
                          { name: 'Base móvil', defaultPrice: 8000 },
                          { name: 'Kit 2 bases móviles', defaultPrice: 15000 },
                          { name: 'Correa Ratchet', defaultPrice: 5000 }
                        ].map((product) => {
                          const isSelected = newRental.additionalProducts.some(p => p.name === product.name)
                          const currentProduct = newRental.additionalProducts.find(p => p.name === product.name)
                          const currentPrice = currentProduct ? currentProduct.price : product.defaultPrice
                          
                          return (
                            <div key={product.name} className="flex items-center gap-3 p-3 bg-white rounded border">
                              <input
                                type="checkbox"
                                className="w-4 h-4"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setNewRental({
                                      ...newRental,
                                      additionalProducts: [...newRental.additionalProducts.filter(p => p.name !== product.name), 
                                        { name: product.name, price: product.defaultPrice, quantity: 1 }]
                                    })
                                  } else {
                                    setNewRental({
                                      ...newRental,
                                      additionalProducts: newRental.additionalProducts.filter(p => p.name !== product.name)
                                    })
                                  }
                                }}
                              />
                              <div className="flex-1">
                                <span className="font-medium">{product.name}</span>
                              </div>
                              {isSelected && (
                                <div className="flex items-center gap-2">
                                  <span className="text-sm">$</span>
                                  <Input
                                    type="number"
                                    min="0"
                                    value={currentPrice}
                                    onChange={(e) => {
                                      const newPrice = parseInt(e.target.value) || 0
                                      setNewRental({
                                        ...newRental,
                                        additionalProducts: newRental.additionalProducts.map(p => 
                                          p.name === product.name ? { ...p, price: newPrice } : p
                                        )
                                      })
                                    }}
                                    className="w-24 h-8 text-sm"
                                    placeholder="Precio"
                                  />
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Manual Pricing Option */}
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4">
                      <div className="flex items-center gap-2 mb-3">
                        <input
                          type="checkbox"
                          id="manual-pricing"
                          className="w-4 h-4"
                          checked={newRental.manualPrice || false}
                          onChange={(e) => {
                            setNewRental({
                              ...newRental,
                              manualPrice: e.target.checked,
                              customPrice: e.target.checked ? 
                                (newRental.customPrice || getPriceByPeriod(newRental.boxQuantity, newRental.rentalDays)) : 
                                undefined
                            })
                          }}
                        />
                        <Label htmlFor="manual-pricing" className="font-medium text-blue-700">
                          💰 Precio manual por caja/día
                        </Label>
                      </div>
                      
                      {newRental.manualPrice && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm">Precio personalizado total</Label>
                            <Input
                              type="number"
                              min="0"
                              value={newRental.customPrice || ''}
                              onChange={(e) => {
                                const price = parseInt(e.target.value) || 0
                                setNewRental({
                                  ...newRental,
                                  customPrice: price
                                })
                              }}
                              className="mt-1"
                              placeholder="Ej: 50000"
                            />
                          </div>
                          <div>
                            <Label className="text-sm">Precio automático (referencia)</Label>
                            <div className="mt-1 p-2 bg-gray-100 rounded border text-sm">
                              ${getPriceByPeriod(newRental.boxQuantity, newRental.rentalDays).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Price Summary */}
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <Calculator className="h-5 w-5 text-green-600" />
                        Resumen de Costos
                      </h3>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span>Arriendo ({newRental.boxQuantity} cajas × {newRental.rentalDays} días):</span>
                          <span className="font-medium">
                            ${(newRental.manualPrice && newRental.customPrice ? 
                              newRental.customPrice : 
                              getPriceByPeriod(newRental.boxQuantity, newRental.rentalDays)
                            ).toLocaleString()}
                            {newRental.manualPrice && <span className="text-blue-600 text-xs ml-1">(manual)</span>}
                          </span>
                        </div>
                        
                        {newRental.additionalProducts.map((product, index) => (
                          <div key={index} className="flex justify-between items-center text-sm">
                            <span>{product.name}:</span>
                            <span>${product.price.toLocaleString()}</span>
                          </div>
                        ))}
                        
                        <div className="flex justify-between items-center border-t pt-2">
                          <span className="font-bold text-blue-600">Garantía ({newRental.boxQuantity} cajas):</span>
                          <span className="font-bold text-blue-600">${(newRental.boxQuantity * 2000).toLocaleString()}</span>
                        </div>
                        
                        <div className="flex justify-between items-center border-t pt-2">
                          <span className="text-lg font-bold">Total a pagar:</span>
                          <span className="text-xl font-bold text-green-600">
                            ${(
                              (newRental.manualPrice && newRental.customPrice ? 
                                newRental.customPrice : 
                                getPriceByPeriod(newRental.boxQuantity, newRental.rentalDays)) + 
                              (newRental.boxQuantity * 2000) +
                              newRental.additionalProducts.reduce((sum, product) => sum + product.price, 0)
                            ).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Form Actions */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetNewCustomerForm}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={createCustomerMutation.isPending || createRentalMutation.isPending}
                    className="flex-1 bg-brand-red hover:bg-red-700 text-white"
                  >
                    {createCustomerMutation.isPending || createRentalMutation.isPending 
                      ? 'Creando...' 
                      : includeRental 
                        ? 'Crear Cliente y Arriendo' 
                        : 'Crear Cliente'
                    }
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Edit Customer Dialog */}
          <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Editar Cliente</DialogTitle>
              </DialogHeader>
              
              {editingCustomer && (
                <form onSubmit={async (e) => {
                  e.preventDefault()
                  await updateCustomerMutation.mutateAsync({
                    id: editingCustomer.id,
                    data: editingCustomer
                  })
                }} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-name">Nombre completo</Label>
                      <Input
                        id="edit-name"
                        value={editingCustomer.name}
                        onChange={(e) => setEditingCustomer({ ...editingCustomer, name: e.target.value })}
                        required
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-rut">RUT</Label>
                      <Input
                        id="edit-rut"
                        value={editingCustomer.rut}
                        onChange={(e) => handleRutChange(e.target.value, true)}
                        required
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-email">Email</Label>
                      <Input
                        id="edit-email"
                        type="email"
                        value={editingCustomer.email}
                        onChange={(e) => setEditingCustomer({ ...editingCustomer, email: e.target.value })}
                        required
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-phone">Teléfono</Label>
                      <Input
                        id="edit-phone"
                        value={editingCustomer.phone || ''}
                        onChange={(e) => setEditingCustomer({ ...editingCustomer, phone: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
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
                      className="flex-1 bg-brand-red hover:bg-red-700 text-white"
                    >
                      {updateCustomerMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
                    </Button>
                  </div>
                </form>
              )}
            </DialogContent>
          </Dialog>

          {/* Edit Rental Dialog - Complete Form like Creation Form */}
          <Dialog open={showRentalDialog} onOpenChange={setShowRentalDialog}>
            <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Editar Arriendo</DialogTitle>
              </DialogHeader>
              
              {selectedRental && (
                <div className="space-y-6">
                  {/* Customer Info (read-only) */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Información del Cliente</h3>
                    {(() => {
                      const customer = customers.find((c: Customer) => c.id === selectedRental.customerId)
                      return customer ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div><strong>Nombre:</strong> {customer.name}</div>
                          <div><strong>RUT:</strong> {customer.rut}</div>
                          <div><strong>Email:</strong> {customer.email}</div>
                          <div><strong>Teléfono:</strong> {customer.phone || 'No especificado'}</div>
                        </div>
                      ) : <div>Cliente no encontrado</div>
                    })()}
                  </div>

                  {/* Driver and Box Information */}
                  {(selectedRental.driverId || selectedRental.assignedBoxCodes) && (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Información de Entrega</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        {selectedRental.driverId && (
                          <div>
                            <strong>Repartidor Asignado:</strong> {selectedRental.assignedDriver || 'Sin asignar'}
                          </div>
                        )}
                        {selectedRental.masterCode && (
                          <div>
                            <strong>Código Maestro:</strong> 
                            <Badge variant="outline" className="ml-2 font-mono">{selectedRental.masterCode}</Badge>
                          </div>
                        )}
                        {selectedRental.assignedBoxCodes && selectedRental.assignedBoxCodes.length > 0 && (
                          <div className="md:col-span-2">
                            <strong>Cajas Asignadas ({selectedRental.assignedBoxCodes.length}):</strong>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                              {selectedRental.assignedBoxCodes.map((code: string, index: number) => (
                                <Badge key={index} variant="secondary" className="font-mono text-xs">
                                  {code}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Status Selection */}
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <Label className="text-sm font-medium text-gray-700">Estado del Arriendo</Label>
                    <Select 
                      value={selectedRental.status} 
                      onValueChange={(value) => setSelectedRental({ ...selectedRental, status: value })}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Seleccionar estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pendiente">🟡 Pendiente (Esperando pago)</SelectItem>
                        <SelectItem value="pagada">🔵 Pagada (Lista para entrega)</SelectItem>
                        <SelectItem value="entregada">🟢 Entregada (En uso por cliente)</SelectItem>
                        <SelectItem value="retirada">🟣 Retirada (Cajas recogidas)</SelectItem>
                        <SelectItem value="finalizado">⚫ Finalizada (Proceso completo)</SelectItem>
                        <SelectItem value="cancelada">🔴 Cancelada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Rental Details */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Cantidad de cajas</Label>
                        <Input
                          type="number"
                          min="1"
                          value={selectedRental.boxQuantity}
                          onChange={(e) => {
                            const newQuantity = parseInt(e.target.value) || 1
                            setSelectedRental({ 
                              ...selectedRental, 
                              boxQuantity: newQuantity
                            })
                          }}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Días de arriendo</Label>
                        <Select 
                          value={selectedRental.rentalDays.toString()}
                          onValueChange={(value) => setSelectedRental({ 
                            ...selectedRental, 
                            rentalDays: parseInt(value) 
                          })}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="7">7 días</SelectItem>
                            <SelectItem value="14">14 días</SelectItem>
                            <SelectItem value="30">30 días</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Fecha de entrega</Label>
                        <Input
                          type="date"
                          value={selectedRental.deliveryDate ? selectedRental.deliveryDate.split('T')[0] : ''}
                          onChange={(e) => setSelectedRental({ 
                            ...selectedRental, 
                            deliveryDate: e.target.value 
                          })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Fecha de retiro</Label>
                        <Input
                          type="date"
                          value={selectedRental.returnDate ? selectedRental.returnDate.split('T')[0] : ''}
                          onChange={(e) => setSelectedRental({ 
                            ...selectedRental, 
                            returnDate: e.target.value 
                          })}
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Dirección de entrega</Label>
                        <Input
                          value={selectedRental.deliveryAddress}
                          onChange={(e) => setSelectedRental({ 
                            ...selectedRental, 
                            deliveryAddress: e.target.value 
                          })}
                          className="mt-1"
                          placeholder="Dirección completa de entrega"
                        />
                      </div>
                      <div>
                        <Label>Dirección de retiro</Label>
                        <Input
                          value={selectedRental.pickupAddress}
                          onChange={(e) => setSelectedRental({ 
                            ...selectedRental, 
                            pickupAddress: e.target.value 
                          })}
                          className="mt-1"
                          placeholder="Dirección completa de retiro"
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Notas adicionales</Label>
                      <textarea
                        className="w-full p-2 border border-gray-300 rounded-md min-h-[80px] mt-1"
                        value={selectedRental.notes || ''}
                        onChange={(e) => setSelectedRental({ 
                          ...selectedRental, 
                          notes: e.target.value 
                        })}
                        placeholder="Instrucciones especiales, referencias, etc."
                      />
                    </div>
                  </div>

                  {/* Box Pricing - Editable */}
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <Label className="text-sm font-medium text-gray-700 mb-3 block">Precio de Cajas</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-xs text-gray-600">Precio calculado automático</Label>
                        <div className="text-lg font-semibold text-green-600">
                          ${getPriceByPeriod(selectedRental.boxQuantity, selectedRental.rentalDays).toLocaleString('es-CL')}
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-600">Precio manual</Label>
                        <Input
                          type="number"
                          min="0"
                          value={selectedRental.customPrice || getPriceByPeriod(selectedRental.boxQuantity, selectedRental.rentalDays)}
                          onChange={(e) => {
                            const newPrice = parseInt(e.target.value) || 0
                            setSelectedRental({ 
                              ...selectedRental, 
                              customPrice: newPrice,
                              manualPrice: true
                            })
                          }}
                          className="mt-1"
                          placeholder="Precio personalizado"
                        />
                      </div>
                      <div className="flex items-end">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedRental({ 
                              ...selectedRental, 
                              customPrice: getPriceByPeriod(selectedRental.boxQuantity, selectedRental.rentalDays),
                              manualPrice: false
                            })
                          }}
                          className="mb-1"
                        >
                          Usar precio automático
                        </Button>
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      {selectedRental.manualPrice ? 
                        "💰 Usando precio manual" : 
                        "🤖 Usando precio automático basado en cantidad y días"
                      }
                    </div>
                  </div>

                  {/* Additional Products - Fully Editable */}
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <Label className="text-sm font-medium text-gray-700">Productos adicionales</Label>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          const newProduct = { name: 'Nuevo Producto', price: 0, quantity: 1 }
                          setSelectedRental({ 
                            ...selectedRental, 
                            additionalProducts: [...(selectedRental.additionalProducts || []), newProduct] 
                          })
                        }}
                        className="bg-orange-600 hover:bg-orange-700"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Agregar
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      {selectedRental.additionalProducts?.map((product: any, index: number) => (
                        <div key={index} className="grid grid-cols-12 gap-2 p-3 bg-white rounded border">
                          {/* Product Name */}
                          <div className="col-span-4">
                            <Input
                              placeholder="Nombre del producto"
                              value={product.name || ''}
                              onChange={(e) => {
                                const newProducts = [...selectedRental.additionalProducts]
                                newProducts[index] = { ...newProducts[index], name: e.target.value }
                                setSelectedRental({ ...selectedRental, additionalProducts: newProducts })
                              }}
                              className="text-sm"
                            />
                          </div>
                          
                          {/* Price */}
                          <div className="col-span-3">
                            <div className="relative">
                              <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">$</span>
                              <Input
                                type="number"
                                min="0"
                                placeholder="Precio"
                                value={product.price || ''}
                                onChange={(e) => {
                                  const newProducts = [...selectedRental.additionalProducts]
                                  newProducts[index] = { ...newProducts[index], price: parseInt(e.target.value) || 0 }
                                  setSelectedRental({ ...selectedRental, additionalProducts: newProducts })
                                }}
                                className="pl-6 text-sm"
                              />
                            </div>
                          </div>
                          
                          {/* Quantity */}
                          <div className="col-span-2">
                            <Input
                              type="number"
                              min="1"
                              placeholder="Cant."
                              value={product.quantity || 1}
                              onChange={(e) => {
                                const newProducts = [...selectedRental.additionalProducts]
                                newProducts[index] = { ...newProducts[index], quantity: parseInt(e.target.value) || 1 }
                                setSelectedRental({ ...selectedRental, additionalProducts: newProducts })
                              }}
                              className="text-sm"
                            />
                          </div>
                          
                          {/* Total */}
                          <div className="col-span-2 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-600">
                              ${((product.price || 0) * (product.quantity || 1)).toLocaleString()}
                            </span>
                          </div>
                          
                          {/* Delete Button */}
                          <div className="col-span-1 flex items-center justify-center">
                            <Button 
                              type="button"
                              size="sm" 
                              variant="destructive"
                              onClick={() => {
                                const newProducts = [...selectedRental.additionalProducts]
                                newProducts.splice(index, 1)
                                setSelectedRental({ ...selectedRental, additionalProducts: newProducts })
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      
                      {(!selectedRental.additionalProducts || selectedRental.additionalProducts.length === 0) && (
                        <div className="text-center py-4 text-gray-500 text-sm">
                          No hay productos adicionales. Haz clic en "Agregar" para añadir uno.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Price Summary */}
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Calculator className="h-5 w-5 text-green-600" />
                      Resumen de Costos
                    </h3>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span>Arriendo ({selectedRental.boxQuantity} cajas × {selectedRental.rentalDays} días):</span>
                        <span className="font-medium">
                          ${getPriceByPeriod(selectedRental.boxQuantity, selectedRental.rentalDays).toLocaleString()}
                        </span>
                      </div>
                      
                      {selectedRental.additionalProducts?.map((product: any, index: number) => (
                        <div key={index} className="flex justify-between items-center text-sm">
                          <span>{product.name} x{product.quantity || 1}:</span>
                          <span>${((product.price || 0) * (product.quantity || 1)).toLocaleString()}</span>
                        </div>
                      ))}
                      
                      <div className="flex justify-between items-center border-t pt-2">
                        <span className="font-bold text-blue-600">Garantía ({selectedRental.boxQuantity} cajas):</span>
                        <span className="font-bold text-blue-600">${(selectedRental.boxQuantity * 2000).toLocaleString()}</span>
                      </div>
                      
                      <div className="flex justify-between items-center border-t pt-2">
                        <span className="text-lg font-bold">Total a pagar:</span>
                        <span className="text-xl font-bold text-green-600">
                          ${(
                            getPriceByPeriod(selectedRental.boxQuantity, selectedRental.rentalDays) + 
                            (selectedRental.boxQuantity * 2000) +
                            (selectedRental.additionalProducts || []).reduce((sum: number, product: any) => sum + ((product.price || 0) * (product.quantity || 1)), 0)
                          ).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowRentalDialog(false)}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={async () => {
                        try {
                          await updateRentalMutation.mutateAsync({
                            id: selectedRental.id,
                            data: {
                              status: selectedRental.status,
                              totalBoxes: selectedRental.boxQuantity,
                              dailyRate: getPriceByPeriod(selectedRental.boxQuantity, selectedRental.rentalDays).toString(),
                              totalAmount: getPriceByPeriod(selectedRental.boxQuantity, selectedRental.rentalDays).toString(),
                              guaranteeAmount: (selectedRental.boxQuantity * 2000).toString(),
                              additionalProducts: JSON.stringify(selectedRental.additionalProducts || []),
                              additionalProductsTotal: (selectedRental.additionalProducts || []).reduce((sum: number, product: any) => sum + (product.price || 0), 0).toString(),
                              deliveryDate: new Date(selectedRental.deliveryDate),
                              returnDate: selectedRental.returnDate ? new Date(selectedRental.returnDate) : null,
                              deliveryAddress: selectedRental.deliveryAddress,
                              pickupAddress: selectedRental.pickupAddress || selectedRental.deliveryAddress,
                              notes: selectedRental.notes
                            }
                          })
                        } catch (error) {
                          console.error("Error updating rental:", error)
                        }
                      }}
                      disabled={updateRentalMutation.isPending}
                      className="flex-1 bg-brand-red hover:bg-red-700 text-white"
                    >
                      {updateRentalMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Customer Details Dialog */}
          {selectedCustomer && (
            <Dialog open={showCustomerDetails} onOpenChange={setShowCustomerDetails}>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>Detalles del Cliente</DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  {/* Customer Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Nombre</Label>
                      <p className="text-lg">{selectedCustomer.name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">RUT</Label>
                      <p className="text-lg">{selectedCustomer.rut}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Email</Label>
                      <p className="text-lg">{selectedCustomer.email}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Teléfono</Label>
                      <p className="text-lg">{selectedCustomer.phone || 'No especificado'}</p>
                    </div>
                  </div>

                  {/* Active Rental Info */}
                  {(() => {
                    const rental = getCustomerRental(selectedCustomer.id)
                    if (!rental) return <p className="text-gray-500">No tiene arriendos activos</p>
                    
                    return (
                      <div>
                        <h3 className="text-lg font-semibold mb-3">Arriendo Activo</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                          <div>
                            <Label>Estado</Label>
                            <p className="font-medium">{rental.status}</p>
                          </div>
                          <div>
                            <Label>Cajas</Label>
                            <p className="font-medium">{rental.totalBoxes}</p>
                          </div>
                          <div>
                            <Label>Código de Seguimiento</Label>
                            <p className="font-medium font-mono">{rental.trackingCode}</p>
                          </div>
                          <div>
                            <Label>Repartidor</Label>
                            <p className="font-medium">{rental.assignedDriver || 'Sin asignar'}</p>
                          </div>
                          <div>
                            <Label>Código Maestro</Label>
                            <p className="font-medium font-mono">{rental.masterCode || 'Sin generar'}</p>
                          </div>
                          <div className="col-span-full">
                            <Label>Códigos de Cajas Asignadas</Label>
                            {rental.assignedBoxCodes ? (
                              <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                  {rental.assignedBoxCodes.map((code: string, index: number) => (
                                    <div key={index} className="text-xs font-mono bg-white px-2 py-1 rounded border">
                                      {code}
                                    </div>
                                  ))}
                                </div>
                                <p className="text-xs text-gray-600 mt-2">
                                  Total: {rental.assignedBoxCodes.length} cajas asignadas
                                </p>
                              </div>
                            ) : (
                              <p className="text-gray-500 text-sm">No hay códigos de cajas asignados</p>
                            )}
                          </div>
                          <div>
                            <Label>Dirección de Entrega</Label>
                            <p className="font-medium">{rental.deliveryAddress}</p>
                          </div>
                          <div>
                            <Label>Total</Label>
                            <p className="font-medium">${rental.totalAmount}</p>
                          </div>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              </DialogContent>
            </Dialog>
          )}

          {/* Driver Edit Dialog */}
          {editingDriverRental && (
            <Dialog open={showDriverEditDialog} onOpenChange={setShowDriverEditDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Asignar Repartidor</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Repartidor Actual</Label>
                    <p className="text-sm text-gray-600">
                      {editingDriverRental.assignedDriver || 'Sin asignar'}
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="driver-select">Nuevo Repartidor</Label>
                    <Select onValueChange={(driverId) => {
                      updateDriverMutation.mutate({
                        rentalId: editingDriverRental.id,
                        driverId
                      })
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar repartidor..." />
                      </SelectTrigger>
                      <SelectContent>
                        {drivers.map((driver: any) => (
                          <SelectItem key={driver.id} value={driver.id}>
                            {`${driver.firstName} ${driver.lastName}`} - {driver.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowDriverEditDialog(false)
                        setEditingDriverRental(null)
                      }}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </main>
      </div>
    </div>
  )
}