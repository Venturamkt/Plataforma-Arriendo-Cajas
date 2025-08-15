import { useState, useEffect } from "react"
import { useQuery, useMutation } from "@tanstack/react-query"
import { queryClient, apiRequest } from "@/lib/queryClient"
import { useCurrentUser } from "@/hooks/useCurrentUser"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/hooks/use-toast"
import { Trash2, Edit, Plus, Search, RefreshCw } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Header from "@/components/layout/header"
import Sidebar from "@/components/layout/sidebar"
import MobileNav from "@/components/layout/mobile-nav"
import { useLocation } from "wouter"

interface Customer {
  id: string
  name: string
  email: string
  phone: string
  rut: string
  address?: string
  createdAt: string
  updatedAt: string
}

interface Rental {
  id: string
  customerId: string
  status: 'pendiente' | 'pagada' | 'entregada' | 'retirada' | 'finalizado' | 'cancelada'
  totalBoxes: number
  totalAmount: string
  trackingCode: string | null
  createdAt: string
  updatedAt: string
}

export default function CustomersPageNew() {
  const { user, isLoading } = useCurrentUser()
  const [, setLocation] = useLocation()
  const [search, setSearch] = useState("")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [selectedRental, setSelectedRental] = useState<Rental | null>(null)
  const [showRentalDialog, setShowRentalDialog] = useState(false)

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
    refetchInterval: 5000, // Refresh every 5 seconds
  })

  const { data: rentals = [], refetch: refetchRentals } = useQuery<Rental[]>({
    queryKey: ["/api/rentals"],
    refetchInterval: 5000,
  })

  // Manual refresh
  const handleManualRefresh = async () => {
    await refetchCustomers()
    await refetchRentals()
    toast({
      title: "Datos actualizados",
      description: "Los datos se han actualizado desde el servidor"
    })
  }

  // Create customer mutation
  const createCustomerMutation = useMutation({
    mutationFn: async (data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => {
      const res = await apiRequest("POST", "/api/customers", data)
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] })
      toast({ title: "Cliente creado exitosamente" })
      setShowCreateDialog(false)
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: error.message || "Error al crear cliente",
        variant: "destructive" 
      })
    }
  })

  // Update customer mutation
  const updateCustomerMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: Partial<Customer> }) => {
      const res = await apiRequest("PUT", `/api/customers/${id}`, data)
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] })
      toast({ title: "Cliente actualizado exitosamente" })
      setShowEditDialog(false)
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

  // Delete customer mutation
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

  // Update rental mutation
  const updateRentalMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: { status: string } }) => {
      const res = await apiRequest("PUT", `/api/rentals/${id}`, data)
      return res.json()
    },
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ["/api/rentals"] })
      queryClient.removeQueries({ queryKey: ["/api/customers"] })
      queryClient.invalidateQueries({ queryKey: ["/api/rentals"] })
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] })
      toast({ title: "Arriendo actualizado exitosamente" })
      setShowRentalDialog(false)
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

  // Filter customers
  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(search.toLowerCase()) ||
    customer.email.toLowerCase().includes(search.toLowerCase()) ||
    customer.rut.toLowerCase().includes(search.toLowerCase())
  )

  // Get rentals for customer
  const getCustomerRentals = (customerId: string) => {
    return rentals.filter(rental => rental.customerId === customerId)
  }

  // Get status color
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
        <Input
          placeholder="Nombre completo"
          value={formData.name}
          onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
          required
        />
        <Input
          placeholder="Email"
          type="email"
          value={formData.email}
          onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
          required
        />
        <Input
          placeholder="RUT"
          value={formData.rut}
          onChange={e => setFormData(prev => ({ ...prev, rut: e.target.value }))}
          required
        />
        <Input
          placeholder="Teléfono"
          value={formData.phone}
          onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
          required
        />
        <Input
          placeholder="Dirección (opcional)"
          value={formData.address}
          onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
        />
        <Button type="submit" className="w-full">
          {customer ? 'Actualizar Cliente' : 'Crear Cliente'}
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
        <Sidebar />
        <MobileNav />
        <main className="flex-1 p-6">
          <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Clientes</h1>
          <p className="text-gray-600">Base de datos completa de clientes y su historial de arriendos</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleManualRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear Nuevo Cliente</DialogTitle>
              </DialogHeader>
              <CustomerForm 
                onSubmit={(data) => createCustomerMutation.mutate(data)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-gray-400" />
        <Input
          placeholder="Buscar por nombre, email o teléfono..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
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
              const activeRentals = customerRentals.filter(r => 
                ['pendiente', 'pagada', 'entregada', 'retirada'].includes(r.status)
              )
              const lastRental = customerRentals[0]

              return (
                <TableRow key={customer.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{customer.name}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{customer.email}</div>
                      <div className="text-gray-500">{customer.phone}</div>
                    </div>
                  </TableCell>
                  <TableCell>{customer.rut}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{activeRentals.length} activos / {customerRentals.length} total</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {lastRental && (
                      <Badge 
                        className={`text-white ${getStatusColor(lastRental.status)}`}
                        onClick={() => {
                          setSelectedRental(lastRental)
                          setShowRentalDialog(true)
                        }}
                      >
                        {lastRental.status}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">Asignar repartidor</Button>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedCustomer(customer)
                          setShowEditDialog(true)
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteCustomerMutation.mutate(customer.id)}
                        className="text-red-600 hover:text-red-800"
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

      {/* Edit Customer Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
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

      {/* Edit Rental Dialog */}
      <Dialog open={showRentalDialog} onOpenChange={setShowRentalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambiar Estado del Arriendo</DialogTitle>
          </DialogHeader>
          {selectedRental && (
            <div className="space-y-4">
              <div>
                <p><strong>Código de seguimiento:</strong> {selectedRental.trackingCode}</p>
                <p><strong>Estado actual:</strong> {selectedRental.status}</p>
                <p><strong>Total cajas:</strong> {selectedRental.totalBoxes}</p>
              </div>
              <Select
                onValueChange={(value) => {
                  updateRentalMutation.mutate({
                    id: selectedRental.id,
                    data: { status: value }
                  })
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar nuevo estado" />
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
        </DialogContent>
      </Dialog>
          </div>
        </main>
      </div>
    </div>
  )
}