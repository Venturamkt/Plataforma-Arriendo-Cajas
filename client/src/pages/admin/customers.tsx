import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { 
  Search, Plus, User, MapPin, Calendar, Package, Edit, Trash2, Grid3X3,
  Table as TableIcon, Eye, Phone, Mail, CheckCircle, AlertTriangle, 
  Download, QrCode, MessageSquare, Trash, ShoppingCart
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

// Mock initial data
const initialCustomers = [
  {
    id: 1,
    name: "María González",
    email: "maria.gonzalez@email.com",
    phone: "+56 9 1234 5678",
    rut: "12345678-9",
    address: "Av. Providencia 1234, Santiago"
  }
]

const Customers = () => {
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table')
  const [showNewCustomerDialog, setShowNewCustomerDialog] = useState(false)
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    email: "",
    phone: "",
    rut: ""
  })
  const { toast } = useToast()

  // Simulate customers query
  const customers = initialCustomers
  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone.includes(searchQuery)
  )

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault()
    // Simulate create
    toast({
      title: "Cliente creado",
      description: `${newCustomer.name} ha sido agregado exitosamente`
    })
    setShowNewCustomerDialog(false)
    setNewCustomer({ name: "", email: "", phone: "", rut: "" })
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
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
                <DialogContent className="w-full max-w-md mx-4 sm:mx-auto">
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
                        value={newCustomer.rut}
                        onChange={(e) => setNewCustomer({ ...newCustomer, rut: e.target.value })}
                        placeholder="12345678-9"
                      />
                    </div>
                    
                    <div className="flex gap-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowNewCustomerDialog(false)}
                        className="flex-1"
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1 bg-brand-red hover:bg-red-700 text-white"
                      >
                        Crear Cliente
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
      </Card>

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
                    {filteredCustomers.map((customer) => {
                      const initials = customer.name.split(' ').map(n => n[0]).join('').toUpperCase()
                      
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
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="text-red-600">
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
          {filteredCustomers.map((customer) => {
            const initials = customer.name.split(' ').map(n => n[0]).join('').toUpperCase()
            
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
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-600">
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
    </div>
  )
}

export default Customers