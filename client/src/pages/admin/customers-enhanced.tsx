import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { apiRequest, queryClient } from '@/lib/queryClient'
import { useToast } from '@/hooks/use-toast'

// UI Components
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Alert, AlertDescription } from '@/components/ui/alert'

// Icons
import { 
  Plus, Search, RefreshCw, Edit, Trash2, Eye, Calendar, Package, 
  MapPin, DollarSign, Activity, AlertTriangle, CheckCircle, 
  Phone, Mail, User, Home, CreditCard, Clock, TrendingUp 
} from 'lucide-react'

// Layout Components
import Header from '@/components/layout/header'
import Sidebar from '@/components/layout/sidebar'
import MobileNav from '@/components/layout/mobile-nav'

// Form handling
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

// Enhanced Types
interface Customer {
  id: string
  name: string
  email: string
  phone?: string
  rut?: string
  businessType?: string
  billingNotes?: string
  contactPreference?: 'email' | 'phone' | 'whatsapp'
  deliveryAddress?: string
  pickupAddress?: string
  currentBalance?: string
  lastTransactionDate?: string
  totalRentals?: number
  activeRentals?: number
  createdAt: string
  updatedAt?: string
}

interface CustomerAddress {
  id: string
  customerId: string
  type: 'delivery' | 'pickup' | 'billing'
  address: string
  isPrimary: boolean
  notes?: string
  createdAt: string
  updatedAt?: string
}

interface CustomerActivity {
  id: string
  customerId: string
  type: string
  description: string
  metadata?: string
  performedBy?: string
  relatedRentalId?: string
  createdAt: string
}

interface CustomerPayment {
  id: string
  customerId: string
  rentalId?: string
  type: 'payment' | 'charge' | 'adjustment'
  amount: string
  description: string
  dueDate?: string
  paidDate?: string
  status: 'pending' | 'paid' | 'overdue' | 'cancelled'
  createdAt: string
  updatedAt?: string
}

interface InventoryValidation {
  available: number
  alternatives?: { quantity: number; date: Date }[]
}

// Form schemas
const customerSchema = z.object({
  name: z.string().min(1, 'Nombre es requerido'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
  rut: z.string().optional(),
  businessType: z.string().optional(),
  billingNotes: z.string().optional(),
  contactPreference: z.enum(['email', 'phone', 'whatsapp']).default('email'),
  deliveryAddress: z.string().optional(),
  pickupAddress: z.string().optional()
})

const addressSchema = z.object({
  type: z.enum(['delivery', 'pickup', 'billing']),
  address: z.string().min(1, 'Dirección es requerida'),
  isPrimary: z.boolean().default(false),
  notes: z.string().optional()
})

const paymentSchema = z.object({
  type: z.enum(['payment', 'charge', 'adjustment']),
  amount: z.string().min(1, 'Monto es requerido'),
  description: z.string().min(1, 'Descripción es requerida'),
  dueDate: z.string().optional()
})

const rentalSchema = z.object({
  totalBoxes: z.number().min(1, 'Debe especificar al menos 1 caja'),
  deliveryDate: z.string().min(1, 'Fecha de entrega es requerida'),
  returnDate: z.string().optional(),
  rentalDays: z.number().min(1, 'Días de arriendo es requerido'),
  dailyRate: z.number().min(0, 'Tarifa diaria debe ser positiva'),
  guaranteeAmount: z.number().min(0, 'Garantía debe ser positiva'),
  deliveryAddress: z.string().min(1, 'Dirección de entrega es requerida'),
  pickupAddress: z.string().optional(),
  notes: z.string().optional(),
  additionalProducts: z.string().optional()
})

// Format helpers
const formatPrice = (price: string | number): string => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0
  }).format(numPrice)
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('es-CL')
}

const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleString('es-CL')
}

// Components
function CustomerDetailsView({ customer }: { customer: Customer }) {
  const { toast } = useToast()
  
  // Customer addresses
  const { data: addresses = [] } = useQuery({
    queryKey: [`/api/customers/${customer.id}/addresses`],
    enabled: !!customer.id
  })
  
  // Customer activities
  const { data: activities = [] } = useQuery({
    queryKey: [`/api/customers/${customer.id}/activities`],
    enabled: !!customer.id
  })
  
  // Customer payments
  const { data: payments = [] } = useQuery({
    queryKey: [`/api/customers/${customer.id}/payments`],
    enabled: !!customer.id
  })
  
  // Customer balance
  const { data: balanceData } = useQuery({
    queryKey: [`/api/customers/${customer.id}/balance`],
    enabled: !!customer.id
  })
  
  // Customer rentals
  const { data: rentals = [] } = useQuery({
    queryKey: [`/api/customers/${customer.id}/rentals`],
    enabled: !!customer.id
  })

  const balance = balanceData?.balance || 0
  const hasDebt = balance > 0
  const activeRentalsCount = rentals.filter((r: any) => 
    ['pendiente', 'pagada', 'entregada', 'retirada'].includes(r.status)
  ).length

  return (
    <div className="space-y-6">
      {/* Customer Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <DollarSign className="h-5 w-5 mr-2" />
              Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${hasDebt ? 'text-red-600' : 'text-green-600'}`}>
              {formatPrice(balance)}
            </div>
            <p className="text-sm text-gray-600">
              {hasDebt ? 'Cuenta pendiente' : 'Al día'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Package className="h-5 w-5 mr-2" />
              Arriendos Activos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {activeRentalsCount}
            </div>
            <p className="text-sm text-gray-600">
              Total: {rentals.length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Cliente desde
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">
              {formatDate(customer.createdAt)}
            </div>
            <p className="text-sm text-gray-600">
              {Math.floor((Date.now() - new Date(customer.createdAt).getTime()) / (1000 * 60 * 60 * 24))} días
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different sections */}
      <Tabs defaultValue="info" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="info">Información</TabsTrigger>
          <TabsTrigger value="addresses">Direcciones</TabsTrigger>
          <TabsTrigger value="rentals">Arriendos</TabsTrigger>
          <TabsTrigger value="payments">Pagos</TabsTrigger>
          <TabsTrigger value="activity">Actividad</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Información del Cliente</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-500">Nombre</Label>
                <p className="text-lg">{customer.name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Email</Label>
                <p className="flex items-center">
                  <Mail className="h-4 w-4 mr-2" />
                  {customer.email}
                </p>
              </div>
              {customer.phone && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Teléfono</Label>
                  <p className="flex items-center">
                    <Phone className="h-4 w-4 mr-2" />
                    {customer.phone}
                  </p>
                </div>
              )}
              {customer.rut && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">RUT</Label>
                  <p className="font-mono">{customer.rut}</p>
                </div>
              )}
              {customer.businessType && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Giro</Label>
                  <p>{customer.businessType}</p>
                </div>
              )}
              <div>
                <Label className="text-sm font-medium text-gray-500">Preferencia de contacto</Label>
                <p className="capitalize">{customer.contactPreference || 'email'}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="addresses" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Direcciones</h3>
            <AddAddressDialog customerId={customer.id} />
          </div>
          <div className="grid gap-4">
            {addresses.map((address: CustomerAddress) => (
              <Card key={address.id}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={address.isPrimary ? 'default' : 'secondary'}>
                          {address.type}
                        </Badge>
                        {address.isPrimary && (
                          <Badge variant="outline">Principal</Badge>
                        )}
                      </div>
                      <p className="flex items-start">
                        <MapPin className="h-4 w-4 mr-2 mt-1 flex-shrink-0" />
                        {address.address}
                      </p>
                      {address.notes && (
                        <p className="text-sm text-gray-600 mt-2">{address.notes}</p>
                      )}
                    </div>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="rentals" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Arriendos</h3>
            <CreateRentalDialog customer={customer} />
          </div>
          <div className="grid gap-4">
            {rentals.map((rental: any) => (
              <Card key={rental.id}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge className={getStatusColor(rental.status)}>
                      {getStatusText(rental.status)}
                    </Badge>
                    <div className="text-sm text-gray-600">
                      {formatDate(rental.deliveryDate)}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Cajas y duración</p>
                      <p className="font-medium">{rental.totalBoxes} cajas × {rental.rentalDays} días</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Monto total</p>
                      <p className="font-medium">{formatPrice(rental.totalAmount)}</p>
                    </div>
                    {rental.trackingCode && (
                      <div>
                        <p className="text-sm text-gray-500">Código de seguimiento</p>
                        <p className="font-mono">{rental.trackingCode}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Historial de Pagos</h3>
            <AddPaymentDialog customerId={customer.id} />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment: CustomerPayment) => (
                <TableRow key={payment.id}>
                  <TableCell>{formatDate(payment.createdAt)}</TableCell>
                  <TableCell>
                    <Badge variant={payment.type === 'payment' ? 'default' : 'secondary'}>
                      {payment.type === 'payment' ? 'Pago' : payment.type === 'charge' ? 'Cargo' : 'Ajuste'}
                    </Badge>
                  </TableCell>
                  <TableCell>{payment.description}</TableCell>
                  <TableCell className={payment.type === 'payment' ? 'text-green-600' : 'text-red-600'}>
                    {payment.type === 'payment' ? '-' : '+'}{formatPrice(payment.amount)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={payment.status === 'paid' ? 'default' : 'destructive'}>
                      {payment.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <h3 className="text-lg font-semibold">Línea de Tiempo</h3>
          <div className="space-y-3">
            {activities.map((activity: CustomerActivity) => (
              <Card key={activity.id}>
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="font-medium">{activity.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {activity.type.replace('_', ' ')}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {formatDateTime(activity.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Helper functions for rental status
function getStatusColor(status: string): string {
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

function getStatusText(status: string): string {
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

// Dialog components
function AddAddressDialog({ customerId }: { customerId: string }) {
  const [open, setOpen] = useState(false)
  const { toast } = useToast()
  
  const form = useForm<z.infer<typeof addressSchema>>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      type: 'delivery',
      isPrimary: false
    }
  })

  const mutation = useMutation({
    mutationFn: async (data: z.infer<typeof addressSchema>) => {
      const res = await apiRequest('POST', `/api/customers/${customerId}/addresses`, data)
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/customers/${customerId}/addresses`] })
      toast({ title: 'Dirección agregada exitosamente' })
      setOpen(false)
      form.reset()
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Error al agregar dirección',
        variant: 'destructive'
      })
    }
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Agregar Dirección
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva Dirección</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(data => mutation.mutate(data))} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de dirección</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="delivery">Entrega</SelectItem>
                      <SelectItem value="pickup">Retiro</SelectItem>
                      <SelectItem value="billing">Facturación</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dirección</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas (opcional)</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

function AddPaymentDialog({ customerId }: { customerId: string }) {
  const [open, setOpen] = useState(false)
  const { toast } = useToast()
  
  const form = useForm<z.infer<typeof paymentSchema>>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      type: 'payment'
    }
  })

  const mutation = useMutation({
    mutationFn: async (data: z.infer<typeof paymentSchema>) => {
      const res = await apiRequest('POST', `/api/customers/${customerId}/payments`, data)
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/customers/${customerId}/payments`] })
      queryClient.invalidateQueries({ queryKey: [`/api/customers/${customerId}/balance`] })
      toast({ title: 'Pago registrado exitosamente' })
      setOpen(false)
      form.reset()
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Error al registrar pago',
        variant: 'destructive'
      })
    }
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Registrar Pago
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar Pago/Cargo</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(data => mutation.mutate(data))} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="payment">Pago recibido</SelectItem>
                      <SelectItem value="charge">Cargo aplicado</SelectItem>
                      <SelectItem value="adjustment">Ajuste</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monto</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

function CreateRentalDialog({ customer }: { customer: Customer }) {
  const [open, setOpen] = useState(false)
  const [inventoryValidation, setInventoryValidation] = useState<InventoryValidation | null>(null)
  const { toast } = useToast()
  
  const form = useForm<z.infer<typeof rentalSchema>>({
    resolver: zodResolver(rentalSchema),
    defaultValues: {
      totalBoxes: 2,
      rentalDays: 7,
      deliveryAddress: customer.deliveryAddress || ''
    }
  })

  const validateInventoryMutation = useMutation({
    mutationFn: async (data: { totalBoxes: number; deliveryDate: string; returnDate?: string }) => {
      const res = await apiRequest('POST', '/api/inventory/validate', data)
      return res.json()
    },
    onSuccess: (data) => {
      setInventoryValidation(data)
    }
  })

  const createRentalMutation = useMutation({
    mutationFn: async (data: z.infer<typeof rentalSchema>) => {
      const res = await apiRequest('POST', '/api/rentals', {
        ...data,
        customerId: customer.id,
        status: 'pendiente'
      })
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/customers/${customer.id}/rentals`] })
      toast({ title: 'Arriendo creado exitosamente' })
      setOpen(false)
      form.reset()
      setInventoryValidation(null)
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Error al crear arriendo',
        variant: 'destructive'
      })
    }
  })

  const handleValidateInventory = () => {
    const values = form.getValues()
    if (values.totalBoxes && values.deliveryDate) {
      validateInventoryMutation.mutate({
        totalBoxes: values.totalBoxes,
        deliveryDate: values.deliveryDate,
        returnDate: values.returnDate
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Arriendo
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nuevo Arriendo para {customer.name}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(data => createRentalMutation.mutate(data))} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="totalBoxes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cantidad de cajas</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" onChange={e => {
                        field.onChange(parseInt(e.target.value))
                        setInventoryValidation(null)
                      }} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="rentalDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Días de arriendo</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" onChange={e => field.onChange(parseInt(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="deliveryDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de entrega</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" onChange={e => {
                        field.onChange(e.target.value)
                        setInventoryValidation(null)
                      }} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="returnDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de retiro (opcional)</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleValidateInventory}
                disabled={validateInventoryMutation.isPending}
              >
                {validateInventoryMutation.isPending ? 'Validando...' : 'Validar Inventario'}
              </Button>
            </div>

            {inventoryValidation && (
              <Alert className={inventoryValidation.available >= form.watch('totalBoxes') ? 'border-green-500' : 'border-yellow-500'}>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {inventoryValidation.available >= form.watch('totalBoxes') ? (
                    <span className="text-green-700">
                      ✓ Inventario disponible: {inventoryValidation.available} cajas
                    </span>
                  ) : (
                    <div>
                      <span className="text-yellow-700">
                        ⚠ Solo {inventoryValidation.available} cajas disponibles para estas fechas
                      </span>
                      {inventoryValidation.alternatives && inventoryValidation.alternatives.length > 0 && (
                        <div className="mt-2">
                          <p className="font-medium">Alternativas sugeridas:</p>
                          {inventoryValidation.alternatives.map((alt, index) => (
                            <p key={index} className="text-sm">
                              • {alt.quantity} cajas disponibles el {formatDate(alt.date.toString())}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            <FormField
              control={form.control}
              name="deliveryAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dirección de entrega</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={createRentalMutation.isPending || (inventoryValidation && inventoryValidation.available < form.watch('totalBoxes'))}
              >
                {createRentalMutation.isPending ? 'Creando...' : 'Crear Arriendo'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

// Main component
export default function EnhancedCustomersPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [showCreateCustomer, setShowCreateCustomer] = useState(false)
  const [filters, setFilters] = useState({
    hasDebt: false,
    hasActiveRentals: false
  })

  const { user, isLoading } = useCurrentUser()
  const { toast } = useToast()

  // Data fetching
  const { data: customers = [], refetch: refetchCustomers } = useQuery({
    queryKey: ['/api/customers'],
    enabled: !!user
  })

  // Customer search with filters
  const { data: filteredCustomers = [] } = useQuery({
    queryKey: ['/api/customers/search', { ...filters, search: searchTerm }],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters.hasDebt) params.append('hasDebt', 'true')
      if (filters.hasActiveRentals) params.append('hasActiveRentals', 'true')
      if (searchTerm) params.append('search', searchTerm)
      
      const res = await apiRequest('GET', `/api/customers/search?${params}`)
      return res.json()
    },
    enabled: !!user && (searchTerm.length > 0 || filters.hasDebt || filters.hasActiveRentals)
  })

  const displayCustomers = (searchTerm.length > 0 || filters.hasDebt || filters.hasActiveRentals) 
    ? filteredCustomers 
    : customers

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="animate-spin h-8 w-8" />
      </div>
    )
  }

  if (selectedCustomer) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex">
          <Sidebar role="admin" />
          <MobileNav role="admin" />
          <main className="flex-1 p-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Button 
                    variant="outline" 
                    onClick={() => setSelectedCustomer(null)}
                    className="mb-4"
                  >
                    ← Volver a clientes
                  </Button>
                  <h1 className="text-3xl font-bold text-gray-900">{selectedCustomer.name}</h1>
                  <p className="text-gray-600">{selectedCustomer.email}</p>
                </div>
                <Button onClick={() => setSelectedCustomer(null)} variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  Editar Cliente
                </Button>
              </div>
              <CustomerDetailsView customer={selectedCustomer} />
            </div>
          </main>
        </div>
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
                <h1 className="text-3xl font-bold text-gray-900">Gestión de Clientes Avanzada</h1>
                <p className="text-gray-600">
                  Sistema completo de gestión con seguimiento de pagos, direcciones y actividad
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <Button 
                  onClick={() => {
                    refetchCustomers()
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

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center space-x-2 flex-1 max-w-md">
                <Search className="h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nombre, email, RUT o teléfono..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant={filters.hasDebt ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilters(prev => ({ ...prev, hasDebt: !prev.hasDebt }))}
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Con deuda
                </Button>
                <Button
                  variant={filters.hasActiveRentals ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilters(prev => ({ ...prev, hasActiveRentals: !prev.hasActiveRentals }))}
                >
                  <Package className="h-4 w-4 mr-2" />
                  Arriendos activos
                </Button>
              </div>
            </div>

            {/* Customers Grid */}
            <div className="grid gap-4">
              {displayCustomers.map((customer: Customer) => (
                <Card key={customer.id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div 
                        className="flex items-center space-x-4 flex-1" 
                        onClick={() => setSelectedCustomer(customer)}
                      >
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">{customer.name}</h3>
                          <div className="text-sm text-gray-600 space-y-1">
                            <div className="flex items-center gap-4">
                              {customer.rut && (
                                <span className="font-mono bg-gray-200 px-2 py-1 rounded">
                                  {customer.rut}
                                </span>
                              )}
                              <span className="flex items-center">
                                <Mail className="h-4 w-4 mr-1" />
                                {customer.email}
                              </span>
                              {customer.phone && (
                                <span className="flex items-center">
                                  <Phone className="h-4 w-4 mr-1" />
                                  {customer.phone}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          {customer.currentBalance && parseFloat(customer.currentBalance) > 0 && (
                            <Badge variant="destructive">
                              Debe {formatPrice(customer.currentBalance)}
                            </Badge>
                          )}
                          
                          {customer.activeRentals && customer.activeRentals > 0 && (
                            <Badge variant="default">
                              {customer.activeRentals} activos
                            </Badge>
                          )}
                          
                          <div className="text-right text-sm text-gray-500">
                            <div>Total arriendos: {customer.totalRentals || 0}</div>
                            <div>Cliente desde: {formatDate(customer.createdAt)}</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedCustomer(customer)
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            // Edit customer logic
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {displayCustomers.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No se encontraron clientes</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}