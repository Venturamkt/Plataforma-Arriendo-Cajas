import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { 
  Search, Plus, User, MapPin, Calendar, Package, Edit, Edit2, Trash2, Grid3X3,
  Table as TableIcon, Eye, Phone, Mail, CheckCircle, AlertTriangle, 
  Download, QrCode, MessageSquare, Trash, ShoppingCart, Building2, UserPlus,
  ShieldCheck, Calculator
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
  
  // Rental editing state
  const [selectedRental, setSelectedRental] = useState(null)
  const [showRentalDialog, setShowRentalDialog] = useState(false)
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table')
  const [showNewCustomerDialog, setShowNewCustomerDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
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
    pickupDate: "",
    deliveryAddress: "",
    pickupAddress: "",
    notes: "",
    boxSize: "mediano",
    customPrice: 2775,
    discount: 0,
    additionalProducts: [] as Array<{name: string, price: number, quantity: number, manualPrice?: boolean, originalPrice?: number}>,
    manualPrice: false
  })

  // Calculate pickup date automatically when delivery date or rental days change
  useEffect(() => {
    if (newRental.deliveryDate && newRental.rentalDays) {
      const deliveryDate = new Date(newRental.deliveryDate);
      const pickupDate = new Date(deliveryDate);
      pickupDate.setDate(deliveryDate.getDate() + newRental.rentalDays);
      const pickupDateStr = pickupDate.toISOString().split('T')[0];
      
      setNewRental(prev => ({
        ...prev,
        pickupDate: pickupDateStr
      }));
    }
  }, [newRental.deliveryDate, newRental.rentalDays])
  const { toast } = useToast()
  const [, setLocation] = useLocation()

  // Download rental history function
  const handleDownloadHistory = () => {
    try {
      // Prepare data for CSV
      const rentalHistory = Array.isArray(rentals) ? rentals : []
      const customersMap = Array.isArray(customers) ? customers.reduce((acc: any, c: any) => {
        acc[c.id] = c
        return acc
      }, {}) : {}

      // Create CSV headers
      const headers = [
        'Fecha Creación',
        'Cliente',
        'RUT',
        'Email',
        'Teléfono',
        'Cantidad Cajas',
        'Días Arriendo',
        'Fecha Entrega',
        'Dirección Entrega',
        'Dirección Retiro',
        'Estado',
        'Monto Total',
        'Garantía',
        'Código Seguimiento',
        'Productos Adicionales',
        'Notas'
      ]

      // Create CSV rows
      const rows = rentalHistory.map((rental: any) => {
        const customer = customersMap[rental.customerId] || {}
        
        // Parse additional products safely
        let additionalProductsText = ''
        try {
          if (rental.additionalProducts) {
            let parsedProducts = []
            if (typeof rental.additionalProducts === 'string') {
              const parsed = JSON.parse(rental.additionalProducts)
              parsedProducts = Array.isArray(parsed) ? parsed : []
            } else if (Array.isArray(rental.additionalProducts)) {
              parsedProducts = rental.additionalProducts
            }
            additionalProductsText = parsedProducts.map((p: any) => 
              `${p.name} x${p.quantity || 1} ($${p.price.toLocaleString()})`
            ).join('; ')
          }
        } catch (error) {
          additionalProductsText = 'Error al procesar'
        }

        return [
          new Date(rental.createdAt || '').toLocaleDateString('es-CL'),
          customer.name || 'N/A',
          customer.rut || 'N/A',
          customer.email || 'N/A',
          customer.phone || 'N/A',
          rental.boxQuantity || 0,
          rental.rentalDays || 0,
          new Date(rental.deliveryDate || '').toLocaleDateString('es-CL'),
          rental.deliveryAddress || 'N/A',
          rental.pickupAddress || rental.deliveryAddress || 'N/A',
          rental.status || 'N/A',
          `$${(rental.totalAmount || 0).toLocaleString()}`,
          `$${(rental.guaranteeAmount || 0).toLocaleString()}`,
          rental.trackingCode || 'N/A',
          additionalProductsText || 'Ninguno',
          rental.notes || 'N/A'
        ]
      })

      // Combine headers and rows
      const csvContent = [headers, ...rows]
        .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n')

      // Create and download file
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
        description: `Se descargó el histórico de ${rentalHistory.length} arriendos`
      })
    } catch (error) {
      console.error('Error downloading history:', error)
      toast({
        title: "Error en descarga",
        description: "No se pudo descargar el histórico",
        variant: "destructive"
      })
    }
  }

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

  // Fetch rentals to calculate customer status
  const { data: rentals = [] } = useQuery({
    queryKey: ["/api/rentals"],
  })

  // Fetch drivers for assignment
  const { data: drivers = [] } = useQuery({
    queryKey: ["/api/drivers"],
  })

  // Fetch inventory to check box availability
  const { data: inventory = [], isLoading: inventoryLoading, error: inventoryError } = useQuery({
    queryKey: ["/api/inventory"],
    refetchInterval: 5000,
    retry: 1
  })

  // Debug inventory connection
  console.log('Inventory state:', { 
    inventory, 
    inventoryLoading, 
    inventoryError: inventoryError?.message,
    isArray: Array.isArray(inventory),
    length: Array.isArray(inventory) ? inventory.length : 0
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
        additionalProducts: [] as Array<{name: string, price: number, quantity: number, manualPrice?: boolean, originalPrice?: number}>,
        manualPrice: false
      })
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

  // Update rental status mutation
  const updateRentalStatusMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { status: string } }) => {
      const res = await apiRequest("PUT", `/api/rentals/${id}`, data)
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rentals"] })
      toast({
        title: "Estado actualizado",
        description: "El estado del arriendo ha sido actualizado y se ha enviado notificación por email"
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al actualizar el estado",
        variant: "destructive"
      })
    }
  })

  // Update rental driver mutation
  const updateRentalDriverMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { assignedDriver: string | null } }) => {
      const res = await apiRequest("PUT", `/api/rentals/${id}`, data)
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rentals"] })
      toast({
        title: "Conductor actualizado",
        description: "El conductor ha sido asignado al arriendo"
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al asignar conductor",
        variant: "destructive"
      })
    }
  })

  // Comprehensive rental update mutation
  const updateRentalMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: any }) => {
      const response = await apiRequest("PUT", `/api/rentals/${id}`, data)
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rentals"] })
      toast({
        title: "Arriendo actualizado",
        description: "Los cambios han sido guardados exitosamente.",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error al guardar",
        description: "No se pudieron guardar los cambios del arriendo.",
        variant: "destructive",
      })
    },
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
          customerId: customer.id,
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
          status: "pendiente"
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

  // Get customer's most recent rental
  const getCustomerRental = (customerId: number) => {
    const customerRentals = (rentals as any[]).filter(
      (rental: any) => rental.customerId === customerId
    )
    return customerRentals.length > 0 
      ? customerRentals.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
      : null
  }

  // Check box availability
  const checkBoxAvailability = (quantity: number) => {
    const inventoryArray = Array.isArray(inventory) ? inventory : []
    const availableBoxes = inventoryArray.filter((box: any) => 
      box.status === 'available' || box.status === 'maintenance'
    ).length
    return availableBoxes >= quantity
  }

  // Get customer rental information
  const getCustomerRentalInfo = (customerId: string) => {
    const customerRentals = Array.isArray(rentals) ? rentals.filter((r: any) => r.customerId === customerId) : []
    const activeRentals = customerRentals.filter((r: any) => 
      r.status && ['pendiente', 'pagada', 'entregada', 'retirada'].includes(r.status)
    )
    const totalRentals = customerRentals.length || 0
    
    // Calculate total amount from numeric totalAmount
    const totalSpent = customerRentals.reduce((sum: number, rental: any) => {
      const amount = typeof rental.totalAmount === 'string' 
        ? parseInt(rental.totalAmount) || 0
        : rental.totalAmount || 0
      return sum + amount
    }, 0)
    
    // Determine status based on active rentals or most recent rental
    let status = 'Sin arriendos activos'
    let statusColor = 'secondary'
    let mostRecentRental = null
    
    if (activeRentals.length > 0) {
      mostRecentRental = activeRentals.sort((a: any, b: any) => 
        new Date(b.deliveryDate).getTime() - new Date(a.deliveryDate).getTime()
      )[0]
    } else {
      // If no active rentals, look for most recent rental including finalizado
      const allRentals = customerRentals.sort((a: any, b: any) => 
        new Date(b.deliveryDate).getTime() - new Date(a.deliveryDate).getTime()
      )
      if (allRentals.length > 0) {
        mostRecentRental = allRentals[0]
      }
    }
    
    if (mostRecentRental) {
      const statusMap: Record<string, { label: string; color: string }> = {
        pendiente: { label: 'Pendiente', color: 'outline' },
        pagada: { label: 'Pagada', color: 'default' },
        entregada: { label: 'Entregada', color: 'secondary' },
        retirada: { label: 'Retirada', color: 'destructive' },
        finalizado: { label: 'Finalizado', color: 'default' }
      }
      
      const statusInfo = statusMap[mostRecentRental.status as string]
      if (statusInfo) {
        status = statusInfo.label
        statusColor = statusInfo.color
      }
    }
    
    return {
      active: activeRentals.length || 0,
      total: totalRentals,
      totalSpent,
      status,
      statusColor,
      mostRecentStatus: mostRecentRental?.status || null,
      mostRecentRentalId: mostRecentRental?.id || null
    }
  }

  // Update rental price when quantity or days change (only if not manual)
  useEffect(() => {
    if (!newRental.manualPrice) {
      const newPrice = getPriceByPeriod(newRental.boxQuantity, newRental.rentalDays)
      setNewRental(prev => ({ ...prev, customPrice: newPrice }))
    }
  }, [newRental.boxQuantity, newRental.rentalDays, newRental.manualPrice])

  // Handle status change from customers table
  const handleStatusChangeFromCustomers = async (customerId: string, newStatus: string) => {
    console.log(`Attempting to change status to: ${newStatus} for customer: ${customerId}`)
    
    // Find the most recent rental for this customer (including all statuses)
    const customerRentals = Array.isArray(rentals) ? rentals.filter((r: any) => r.customerId === customerId) : []
    console.log(`Found ${customerRentals.length} rentals for customer`)
    
    if (customerRentals.length === 0) {
      console.log('No rentals found for customer')
      return
    }

    // Get the most recent rental (sort by delivery date)
    const mostRecentRental = customerRentals.sort((a: any, b: any) => 
      new Date(b.deliveryDate).getTime() - new Date(a.deliveryDate).getTime()
    )[0]

    console.log(`Most recent rental ID: ${mostRecentRental.id}, current status: ${mostRecentRental.status}`)

    try {
      const response = await fetch(`/api/rentals/${mostRecentRental.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`API Error: ${response.status} - ${errorText}`)
        throw new Error(`Failed to update status: ${response.status}`)
      }

      console.log(`Successfully updated status to: ${newStatus}`)

      // Refresh both customers and rentals data
      queryClient.invalidateQueries({ queryKey: ["/api/rentals"] })
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] })
      
      toast({
        title: "Estado actualizado",
        description: `Estado del arriendo cambiado a ${newStatus}`
      })
    } catch (error) {
      console.error('Error updating status:', error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado",
        variant: "destructive"
      })
    }
  }

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
      setNewCustomer({ ...newCustomer, rut: formatted })
      setFormattedRut(formatted)
    }
  }

  // Open rental dialog for editing
  const handleEditRental = (customerId: number) => {
    const rental = getCustomerRental(customerId)
    if (rental) {
      setSelectedRental(rental)
      setShowRentalDialog(true)
    }
  }

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
              
              {/* Actions Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button 
                  onClick={handleDownloadHistory}
                  variant="outline"
                  className="flex items-center gap-2 w-full sm:w-auto"
                >
                  <Download className="h-4 w-4" />
                  Descargar Histórico
                </Button>
                <Dialog open={showNewCustomerDialog} onOpenChange={setShowNewCustomerDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-brand-red hover:bg-red-700 text-white flex items-center gap-2 w-full sm:w-auto">
                      <Plus className="h-4 w-4" />
                      Nuevo Cliente
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="w-full max-w-2xl mx-4 sm:mx-auto max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Crear Nuevo Cliente</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateCustomer} className="space-y-6">
                      {/* Customer Information Section */}
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <User className="h-5 w-5 text-blue-600" />
                        Información del Cliente
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="name" className="text-sm font-medium text-gray-700">Nombre completo *</Label>
                          <Input
                            id="name"
                            value={newCustomer.name}
                            onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                            placeholder="Ej: Juan Pérez González"
                            className="mt-1"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email *</Label>
                          <Input
                            id="email"
                            type="email"
                            value={newCustomer.email}
                            onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                            placeholder="juan@ejemplo.com"
                            className="mt-1"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="phone" className="text-sm font-medium text-gray-700">Teléfono</Label>
                          <Input
                            id="phone"
                            value={newCustomer.phone}
                            onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                            placeholder="+56 9 1234 5678"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="rut" className="text-sm font-medium text-gray-700">RUT</Label>
                          <Input
                            id="rut"
                            value={formattedRut}
                            onChange={(e) => handleRutChange(e.target.value)}
                            placeholder="12.345.678-9"
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Rental Toggle Section */}
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border border-green-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-green-600" />
                            ¿Agendar cajas ahora?
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">Programa el arriendo directamente al crear el cliente</p>
                        </div>
                        <Switch
                          id="include-rental"
                          checked={includeRental}
                          onCheckedChange={setIncludeRental}
                          className="data-[state=checked]:bg-green-600"
                        />
                      </div>
                    </div>

                    {/* Rental Details Section */}
                    {includeRental && (
                      <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg border border-purple-200 space-y-6">
                        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                          <Package className="h-5 w-5 text-purple-600" />
                          Detalles del Arriendo
                        </h3>
                        
                        {/* Quantity and Days */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="box-quantity" className="text-sm font-medium text-gray-700">Cantidad de cajas</Label>
                            <div className="flex gap-2 mt-1">
                              <Select
                                value={[2, 5, 10, 15].includes(newRental.boxQuantity) ? newRental.boxQuantity.toString() : 'custom'}
                                onValueChange={(value) => {
                                  if (value === 'custom') {
                                    setNewRental(prev => ({ ...prev, boxQuantity: 1 }))
                                  } else {
                                    setNewRental(prev => ({ ...prev, boxQuantity: parseInt(value) }))
                                  }
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
                                  <SelectItem value="custom">Manual</SelectItem>
                                </SelectContent>
                              </Select>
                              {![2, 5, 10, 15].includes(newRental.boxQuantity) && (
                                <Input
                                  type="number"
                                  placeholder="Cantidad"
                                  min="1"
                                  value={newRental.boxQuantity}
                                  className="w-24"
                                  onChange={(e) => setNewRental(prev => ({ ...prev, boxQuantity: parseInt(e.target.value) || 1 }))}
                                />
                              )}
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="rental-days" className="text-sm font-medium text-gray-700">Días de arriendo</Label>
                            <div className="flex gap-2 mt-1">
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
                                  <SelectItem value="custom">Personalizado</SelectItem>
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
                        
                        {/* Delivery and Pickup Dates */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="delivery-date" className="text-sm font-medium text-gray-700">Fecha de entrega</Label>
                            <Input
                              id="delivery-date"
                              type="date"
                              value={newRental.deliveryDate}
                              onChange={(e) => setNewRental(prev => ({ ...prev, deliveryDate: e.target.value }))}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="pickup-date" className="text-sm font-medium text-gray-700">
                              Fecha de devolución
                              <span className="text-xs text-gray-500 ml-1">(auto-calculada, editable)</span>
                            </Label>
                            <Input
                              id="pickup-date"
                              type="date"
                              value={newRental.pickupDate}
                              onChange={(e) => setNewRental(prev => ({ ...prev, pickupDate: e.target.value }))}
                              className="mt-1"
                            />
                          </div>
                        </div>
                        
                        {/* Addresses */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="delivery-address" className="text-sm font-medium text-gray-700">Dirección de entrega</Label>
                            <Textarea
                              id="delivery-address"
                              value={newRental.deliveryAddress}
                              onChange={(e) => setNewRental(prev => ({ ...prev, deliveryAddress: e.target.value }))}
                              placeholder="Calle, número, comuna, ciudad..."
                              rows={3}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="pickup-address" className="text-sm font-medium text-gray-700">Dirección de retiro</Label>
                            <Textarea
                              id="pickup-address"
                              value={newRental.pickupAddress}
                              onChange={(e) => setNewRental(prev => ({ ...prev, pickupAddress: e.target.value }))}
                              placeholder="Si es diferente a la entrega..."
                              rows={3}
                              className="mt-1"
                            />
                          </div>
                        </div>

                        {/* Price, Availability, and Guarantee */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                          {/* Availability Status */}
                          <div className={`p-4 rounded-lg border-2 ${getAvailabilityStatus(newRental.boxQuantity).className}`}>
                            <div className="flex items-center gap-3">
                              {getAvailabilityStatus(newRental.boxQuantity).available ? (
                                <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
                              ) : (
                                <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0" />
                              )}
                              <div>
                                <div className="font-semibold text-sm">
                                  {getAvailabilityStatus(newRental.boxQuantity).available ? 'Disponible' : 'Sin Stock'}
                                </div>
                                <div className="text-sm">
                                  {getAvailabilityStatus(newRental.boxQuantity).message}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Price with manual option */}
                          <div className="p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
                            <div className="flex items-center justify-between mb-3">
                              <Label className="text-sm font-medium text-gray-700">Precio</Label>
                              <div className="flex items-center gap-2">
                                <Label htmlFor="manual-price" className="text-xs text-gray-600">Manual</Label>
                                <Switch
                                  id="manual-price"
                                  checked={newRental.manualPrice || false}
                                  onCheckedChange={(checked) => setNewRental(prev => ({ ...prev, manualPrice: checked }))}
                                />
                              </div>
                            </div>
                            {newRental.manualPrice ? (
                              <Input
                                type="number"
                                value={newRental.customPrice}
                                onChange={(e) => setNewRental(prev => ({ ...prev, customPrice: parseInt(e.target.value) || 0 }))}
                                placeholder="Precio personalizado"
                                className="text-lg font-semibold"
                              />
                            ) : (
                              <div className="text-2xl font-bold text-green-600">
                                ${newRental.customPrice.toLocaleString('es-CL')}
                              </div>
                            )}
                          </div>

                          {/* Guarantee Information */}
                          <div className="p-4 bg-amber-50 rounded-lg border-2 border-amber-200">
                            <div className="flex items-center gap-2 mb-2">
                              <ShieldCheck className="h-5 w-5 text-amber-600" />
                              <Label className="text-sm font-medium text-amber-800">Garantía</Label>
                            </div>
                            <div className="text-lg font-bold text-amber-700">
                              ${(newRental.boxQuantity * 2000).toLocaleString('es-CL')}
                            </div>
                            <div className="text-xs text-amber-600">
                              $2.000 por caja ({newRental.boxQuantity} cajas)
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Se devuelve al finalizar
                            </div>
                          </div>
                        </div>
                        
                        {/* Products Section */}
                        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 p-6 rounded-lg border border-orange-200">
                          <h4 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
                            <ShoppingCart className="h-5 w-5 text-orange-600" />
                            Productos Adicionales
                          </h4>
                          
                          {/* Quick Product Buttons */}
                          <div className="grid grid-cols-2 gap-3 mb-4">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-auto p-3 justify-start text-left"
                              onClick={() => {
                                setNewRental(prev => ({
                                  ...prev,
                                  additionalProducts: [...prev.additionalProducts, { name: "Carrito plegable", price: 15000, quantity: 1, originalPrice: 15000, manualPrice: false }]
                                }))
                              }}
                            >
                              <div>
                                <div className="font-medium">Carrito plegable</div>
                                <div className="text-xs text-green-600">$15.000</div>
                              </div>
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-auto p-3 justify-start text-left"
                              onClick={() => {
                                setNewRental(prev => ({
                                  ...prev,
                                  additionalProducts: [...prev.additionalProducts, { name: "Base móvil", price: 8000, quantity: 1, originalPrice: 8000, manualPrice: false }]
                                }))
                              }}
                            >
                              <div>
                                <div className="font-medium">Base móvil</div>
                                <div className="text-xs text-green-600">$8.000</div>
                              </div>
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-auto p-3 justify-start text-left"
                              onClick={() => {
                                setNewRental(prev => ({
                                  ...prev,
                                  additionalProducts: [...prev.additionalProducts, { name: "Kit 2 bases móviles", price: 15000, quantity: 1, originalPrice: 15000, manualPrice: false }]
                                }))
                              }}
                            >
                              <div>
                                <div className="font-medium">Kit 2 bases móviles</div>
                                <div className="text-xs text-green-600">$15.000</div>
                              </div>
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-auto p-3 justify-start text-left"
                              onClick={() => {
                                setNewRental(prev => ({
                                  ...prev,
                                  additionalProducts: [...prev.additionalProducts, { name: "Correa Ratchet", price: 5000, quantity: 1, originalPrice: 5000, manualPrice: false }]
                                }))
                              }}
                            >
                              <div>
                                <div className="font-medium">Correa Ratchet</div>
                                <div className="text-xs text-green-600">$5.000</div>
                              </div>
                            </Button>
                          </div>

                          {/* Products List */}
                          {newRental.additionalProducts.length > 0 && (
                            <div className="space-y-2">
                              <Label className="text-sm font-medium text-gray-700">Productos agregados:</Label>
                              {newRental.additionalProducts.map((product, index) => (
                                <div key={index} className="bg-white p-3 rounded-lg border space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">
                                      {product.quantity}x {product.name}
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
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <Label className="text-xs text-gray-600">Precio manual</Label>
                                      <Switch
                                        checked={product.manualPrice || false}
                                        onCheckedChange={(checked) => {
                                          setNewRental(prev => ({
                                            ...prev,
                                            additionalProducts: prev.additionalProducts.map((p, i) => 
                                              i === index 
                                                ? { ...p, manualPrice: checked, price: checked ? p.price : (p.originalPrice || p.price) }
                                                : p
                                            )
                                          }))
                                        }}
                                      />
                                    </div>
                                    {product.manualPrice ? (
                                      <Input
                                        type="number"
                                        value={product.price}
                                        onChange={(e) => {
                                          setNewRental(prev => ({
                                            ...prev,
                                            additionalProducts: prev.additionalProducts.map((p, i) => 
                                              i === index ? { ...p, price: parseInt(e.target.value) || 0 } : p
                                            )
                                          }))
                                        }}
                                        className="w-24 text-sm"
                                        placeholder="Precio"
                                      />
                                    ) : (
                                      <span className="text-sm font-semibold text-green-600">
                                        ${product.price.toLocaleString('es-CL')}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                              {newRental.additionalProducts.length > 0 && (
                                <div className="text-right p-2 bg-green-50 rounded border border-green-200">
                                  <span className="text-sm font-semibold text-green-700">
                                    Total productos: ${newRental.additionalProducts.reduce((sum, p) => sum + (p.price * p.quantity), 0).toLocaleString('es-CL')}
                                  </span>
                                </div>
                              )}
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
                      const rentalInfo = getCustomerRentalInfo(customer.id)
                      
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
                            <span className="text-sm font-bold text-brand-blue">{rentalInfo.active}</span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="text-sm font-bold">{rentalInfo.total}</span>
                          </TableCell>
                          <TableCell className="text-center">
                            {rentalInfo.total > 0 ? (
                              <Select 
                                value={rentalInfo.mostRecentStatus || ""}
                                onValueChange={(newStatus) => handleStatusChangeFromCustomers(customer.id, newStatus)}
                              >
                                <SelectTrigger className="w-auto h-auto p-1 border-0 bg-transparent">
                                  <Badge variant={rentalInfo.statusColor as any} className="cursor-pointer">
                                    {rentalInfo.status}
                                  </Badge>
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
                            ) : (
                              <Badge variant="secondary">
                                Sin arriendos activos
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button 
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingCustomer(customer);
                                  setShowEditDialog(true);
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
                                onClick={() => handleDeleteCustomer(customer.id)}
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
                    {(() => {
                      const rentalInfo = getCustomerRentalInfo(customer.id)
                      return (
                        <>
                          <div className="text-sm">
                            <span className="font-semibold text-brand-blue">{rentalInfo.active}</span> activos
                            <span className="text-gray-500"> / </span>
                            <span className="font-semibold">{rentalInfo.total}</span> total
                          </div>
                          <div className="flex gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setLocation(`/admin/customers`)}
                              title="Ver arriendos del cliente"
                            >
                              <Package className="h-4 w-4" />
                            </Button>
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
                              onClick={() => handleDeleteCustomer(customer.id)}
                              disabled={deleteCustomerMutation.isPending}
                              title="Eliminar cliente"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </>
                      )
                    })()}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Edit Rental Dialog - Same as New Customer Creation */}
      <Dialog open={showRentalDialog} onOpenChange={setShowRentalDialog}>
        <DialogContent className="w-full max-w-2xl mx-4 sm:mx-auto max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Arriendo</DialogTitle>
          </DialogHeader>
          {selectedRental && (
            <div className="space-y-6">
            {/* Cliente Information */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                Cliente
              </h3>
              <p className="text-lg font-medium">{(customers as any[])?.find((c: any) => c.id === selectedRental.customerId)?.name || 'Cliente no encontrado'}</p>
            </div>

            {/* Rental Details Section */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg border border-purple-200 space-y-6">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Package className="h-5 w-5 text-purple-600" />
                Detalles del Arriendo
              </h3>
              
              {/* Quantity and Days */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-box-quantity" className="text-sm font-medium text-gray-700">Cantidad de cajas</Label>
                  <div className="flex gap-2 mt-1">
                    <Select
                      value={[2, 5, 10, 15].includes(selectedRental.boxQuantity) ? selectedRental.boxQuantity.toString() : 'custom'}
                      onValueChange={(value) => {
                        if (value === 'custom') {
                          setSelectedRental({ ...selectedRental as any, boxQuantity: 1 })
                        } else {
                          setSelectedRental({ ...selectedRental as any, boxQuantity: parseInt(value) })
                        }
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
                        <SelectItem value="custom">Manual</SelectItem>
                      </SelectContent>
                    </Select>
                    {![2, 5, 10, 15].includes(selectedRental.boxQuantity) && (
                      <Input
                        type="number"
                        placeholder="Cantidad"
                        min="1"
                        value={selectedRental.boxQuantity}
                        className="w-24"
                        onChange={(e) => setSelectedRental({ ...selectedRental as any, boxQuantity: parseInt(e.target.value) || 1 })}
                      />
                    )}
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit-rental-days" className="text-sm font-medium text-gray-700">Días de arriendo</Label>
                  <div className="flex gap-2 mt-1">
                    <Select
                      value={[7, 14, 30].includes(selectedRental.rentalDays) ? selectedRental.rentalDays.toString() : 'custom'}
                      onValueChange={(value) => {
                        const days = value === 'custom' ? 1 : parseInt(value)
                        const newPickupDate = selectedRental.deliveryDate ? 
                          new Date(new Date(selectedRental.deliveryDate).getTime() + (days - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : 
                          selectedRental.pickupDate
                        setSelectedRental({ 
                          ...selectedRental as any, 
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
                    {![7, 14, 30].includes(selectedRental.rentalDays) && (
                      <Input
                        type="number"
                        placeholder="Días"
                        min="1"
                        max="90"
                        value={selectedRental.rentalDays}
                        className="w-24"
                        onChange={(e) => {
                          const days = parseInt(e.target.value) || 1
                          const newPickupDate = selectedRental.deliveryDate ? 
                            new Date(new Date(selectedRental.deliveryDate).getTime() + (days - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : 
                            selectedRental.pickupDate
                          setSelectedRental({ 
                            ...selectedRental as any, 
                            rentalDays: days,
                            pickupDate: newPickupDate
                          })
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>
            
              {/* Delivery Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-delivery-date" className="text-sm font-medium text-gray-700">Fecha de Entrega</Label>
                  <Input
                    id="edit-delivery-date"
                    type="date"
                    value={selectedRental.deliveryDate ? new Date(selectedRental.deliveryDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => {
                      const newDeliveryDate = e.target.value
                      const days = selectedRental.rentalDays || 7
                      const newPickupDate = new Date(new Date(newDeliveryDate).getTime() + (days - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                      setSelectedRental({ 
                        ...selectedRental as any, 
                        deliveryDate: newDeliveryDate,
                        pickupDate: newPickupDate
                      })
                    }}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-pickup-date" className="text-sm font-medium text-gray-700">Fecha de Retiro</Label>
                  <Input
                    id="edit-pickup-date"
                    type="date"
                    value={selectedRental.pickupDate ? new Date(selectedRental.pickupDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => setSelectedRental({ ...selectedRental as any, pickupDate: e.target.value })}
                    className="mt-1 bg-blue-50"
                  />
                  <p className="text-xs text-blue-600 mt-1">
                    Se calcula automáticamente sumando los días de arriendo a la fecha de entrega
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="edit-delivery-address" className="text-sm font-medium text-gray-700">Dirección de Entrega</Label>
                <textarea
                  id="edit-delivery-address"
                  className="w-full p-2 border border-gray-300 rounded-md min-h-[80px] mt-1"
                  value={selectedRental.deliveryAddress || ''}
                  onChange={(e) => setSelectedRental({ ...selectedRental as any, deliveryAddress: e.target.value })}
                  placeholder="Calle, número, comuna, ciudad..."
                />
              </div>

              <div>
                <Label htmlFor="edit-pickup-address" className="text-sm font-medium text-gray-700">Dirección de Retiro</Label>
                <textarea
                  id="edit-pickup-address"
                  className="w-full p-2 border border-gray-300 rounded-md min-h-[80px] mt-1"
                  value={selectedRental.pickupAddress || ''}
                  onChange={(e) => setSelectedRental({ ...selectedRental as any, pickupAddress: e.target.value })}
                  placeholder="Si es diferente a la entrega..."
                />
              </div>
            </div>

            {/* Additional Products */}
            <div className="bg-gradient-to-r from-orange-50 to-yellow-50 p-6 rounded-lg border border-orange-200 space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-orange-600" />
                Productos Adicionales
              </h3>
              <div className="space-y-3">
                {[
                  { name: 'Carrito plegable', defaultPrice: 15000 },
                  { name: 'Base móvil', defaultPrice: 8000 },
                  { name: 'Kit 2 bases móviles', defaultPrice: 15000 },
                  { name: 'Correa Ratchet', defaultPrice: 5000 }
                ].map((product) => {
                  const parsedProducts = (() => {
                    if (!selectedRental.additionalProducts) return [];
                    if (Array.isArray(selectedRental.additionalProducts)) {
                      return selectedRental.additionalProducts;
                    }
                    if (typeof selectedRental.additionalProducts === 'string') {
                      try {
                        const parsed = JSON.parse(selectedRental.additionalProducts);
                        return Array.isArray(parsed) ? parsed : [];
                      } catch {
                        return [];
                      }
                    }
                    return [];
                  })();
                  
                  const isSelected = parsedProducts.some((p: any) => 
                    typeof p === 'string' ? p === product.name : p.name === product.name
                  ) || false
                  
                  const currentProduct = parsedProducts.find((p: any) => 
                    typeof p === 'string' ? p === product.name : p.name === product.name
                  )
                  
                  const currentPrice = typeof currentProduct === 'object' ? currentProduct.price : product.defaultPrice
                  
                  return (
                    <div key={product.name} className="flex items-center gap-3 p-3 bg-white rounded border">
                      <input
                        type="checkbox"
                        className="w-4 h-4"
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            const newProducts = parsedProducts.filter((p: any) => 
                              typeof p === 'string' ? p !== product.name : p.name !== product.name
                            )
                            newProducts.push({ name: product.name, price: product.defaultPrice, quantity: 1 })
                            setSelectedRental({ ...selectedRental as any, additionalProducts: newProducts })
                          } else {
                            const newProducts = parsedProducts.filter((p: any) => 
                              typeof p === 'string' ? p !== product.name : p.name !== product.name
                            )
                            setSelectedRental({ ...selectedRental as any, additionalProducts: newProducts })
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
                            step="1000"
                            value={currentPrice}
                            onChange={(e) => {
                              const newPrice = parseInt(e.target.value) || 0
                              const newProducts = parsedProducts.map((p: any) => {
                                if ((typeof p === 'string' ? p : p.name) === product.name) {
                                  return { name: product.name, price: newPrice, quantity: 1 }
                                }
                                return p
                              })
                              setSelectedRental({ ...selectedRental as any, additionalProducts: newProducts })
                            }}
                            className="w-24 h-8 text-sm"
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Price Summary */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border border-green-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Calculator className="h-5 w-5 text-green-600" />
                Resumen de Costos
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>Arriendo ({selectedRental.boxQuantity} cajas × {selectedRental.rentalDays} días):</span>
                  <span className="font-medium">${getPriceByPeriod(selectedRental.boxQuantity, selectedRental.rentalDays).toLocaleString('es-CL')}</span>
                </div>
                
                {(() => {
                  const parsedProducts = (() => {
                    if (!selectedRental.additionalProducts) return [];
                    if (Array.isArray(selectedRental.additionalProducts)) {
                      return selectedRental.additionalProducts;
                    }
                    if (typeof selectedRental.additionalProducts === 'string') {
                      try {
                        const parsed = JSON.parse(selectedRental.additionalProducts);
                        return Array.isArray(parsed) ? parsed : [];
                      } catch {
                        return [];
                      }
                    }
                    return [];
                  })();
                  
                  return parsedProducts.length > 0 && (
                    <>
                      {parsedProducts.map((product: any, index: number) => (
                        <div key={index} className="flex justify-between items-center text-sm">
                          <span>{typeof product === 'string' ? product : product.name}:</span>
                          <span>${(typeof product === 'object' ? product.price : 0).toLocaleString('es-CL')}</span>
                        </div>
                      ))}
                    </>
                  )
                })()}
                
                <div className="flex justify-between items-center border-t pt-2">
                  <span className="font-bold text-blue-600">Garantía ({selectedRental.boxQuantity} cajas):</span>
                  <span className="font-bold text-blue-600">${(selectedRental.boxQuantity * 2000).toLocaleString('es-CL')}</span>
                </div>
                
                <div className="flex justify-between items-center border-t pt-2">
                  <span className="text-lg font-bold">Total a pagar:</span>
                  <span className="text-xl font-bold text-green-600">
                    ${(() => {
                      const rentalAmount = getPriceByPeriod(selectedRental.boxQuantity, selectedRental.rentalDays)
                      const guaranteeAmount = selectedRental.boxQuantity * 2000
                      const additionalProductsTotal = (() => {
                        const parsedProducts = (() => {
                          if (!selectedRental.additionalProducts) return [];
                          if (Array.isArray(selectedRental.additionalProducts)) {
                            return selectedRental.additionalProducts;
                          }
                          if (typeof selectedRental.additionalProducts === 'string') {
                            try {
                              const parsed = JSON.parse(selectedRental.additionalProducts);
                              return Array.isArray(parsed) ? parsed : [];
                            } catch {
                              return [];
                            }
                          }
                          return [];
                        })();
                        
                        return parsedProducts.reduce((sum: number, product: any) => {
                          const price = typeof product === 'object' ? product.price : 0;
                          return sum + price;
                        }, 0);
                      })()
                      return (rentalAmount + guaranteeAmount + additionalProductsTotal).toLocaleString('es-CL')
                    })()}
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
                        totalBoxes: selectedRental.boxQuantity,
                        dailyRate: (selectedRental.manualPrice ? selectedRental.customPrice : getPriceByPeriod(selectedRental.boxQuantity, selectedRental.rentalDays)).toString(),
                        totalAmount: (selectedRental.manualPrice ? selectedRental.customPrice : getPriceByPeriod(selectedRental.boxQuantity, selectedRental.rentalDays)).toString(),
                        guaranteeAmount: (selectedRental.boxQuantity * 2000).toString(),
                        additionalProducts: JSON.stringify(selectedRental.additionalProducts || []),
                        additionalProductsTotal: (selectedRental.additionalProducts || []).reduce((sum: number, product: any) => sum + (product.price * product.quantity), 0).toString(),
                        deliveryDate: new Date(selectedRental.deliveryDate),
                        returnDate: selectedRental.pickupDate ? new Date(selectedRental.pickupDate) : null,
                        deliveryAddress: selectedRental.deliveryAddress,
                        pickupAddress: selectedRental.pickupAddress || selectedRental.deliveryAddress,
                        notes: selectedRental.notes
                      }
                    })
                    setShowRentalDialog(false)
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

        </main>
      </div>
    </div>
  )
}

export default Customers
