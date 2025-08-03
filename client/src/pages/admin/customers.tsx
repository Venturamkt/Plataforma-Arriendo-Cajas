import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import type { Customer } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Mail, Phone, MapPin, User } from "lucide-react";

export default function AdminCustomers() {
  const { toast } = useToast();
  const { user, isLoading } = useCurrentUser();
  const [searchQuery, setSearchQuery] = useState("");

  // Redirect to home if not authenticated
  useEffect(() => {
    if (isLoading) return;
    if (!user || user.type !== 'admin') {
      window.location.href = "/";
      return;
    }
  }, [user, isLoading]);

  const { data: customers, isLoading: customersLoading } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
    retry: false,
    enabled: !!user,
  });

  const { data: rentals } = useQuery<any[]>({
    queryKey: ["/api/rentals"],
    retry: false,
    enabled: !!user,
  });

  const filteredCustomers = customers?.filter((customer) => 
    searchQuery === "" || 
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Get rental stats for each customer
  const getCustomerStats = (customerId: string) => {
    if (!rentals) return { active: 0, total: 0, lastRental: null };
    
    const customerRentals = rentals.filter((rental: any) => rental.customerId === customerId);
    const activeRentals = customerRentals.filter((rental: any) => 
      ['pagada', 'entregada'].includes(rental.status)
    );
    
    return {
      active: activeRentals.length,
      total: customerRentals.length,
      lastRental: customerRentals.length > 0 ? customerRentals[0] : null
    };
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="flex">
        <Sidebar role={'admin'} />
        
        <main className="flex-1 p-4 lg:p-8 pb-20 lg:pb-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
              Gestión de Clientes
            </h1>
            <p className="text-gray-600">
              Base de datos completa de clientes y su historial de arriendos
            </p>
          </div>

          {/* Search and Actions */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por nombre, email o teléfono..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Button className="bg-brand-red hover:bg-brand-red text-white flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Nuevo Cliente
                </Button>
              </div>
            </CardHeader>
          </Card>

          {/* Customer Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {customersLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : filteredCustomers.length === 0 ? (
              <div className="col-span-full">
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <User className="h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No se encontraron clientes
                    </h3>
                    <p className="text-gray-600 text-center">
                      {searchQuery 
                        ? "Intenta ajustar tu búsqueda"
                        : "Comienza agregando clientes al sistema"
                      }
                    </p>
                  </CardContent>
                </Card>
              </div>
            ) : (
              filteredCustomers.map((customer: any) => {
                const stats = getCustomerStats(customer.id);
                const initials = customer.name.split(' ').map((n: string) => n[0]).join('').toUpperCase();
                
                return (
                  <Card key={customer.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      {/* Customer Header */}
                      <div className="flex items-center space-x-4 mb-4">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-brand-blue text-white">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{customer.name}</h3>
                          <p className="text-sm text-gray-600">{customer.email}</p>
                        </div>
                        {stats.active > 0 && (
                          <Badge className="bg-green-100 text-green-800">
                            Activo
                          </Badge>
                        )}
                      </div>

                      {/* Contact Info */}
                      <div className="space-y-2 mb-4">
                        {customer.phone && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Phone className="h-4 w-4 mr-2" />
                            {customer.phone}
                          </div>
                        )}
                        {customer.address && (
                          <div className="flex items-center text-sm text-gray-600">
                            <MapPin className="h-4 w-4 mr-2" />
                            {customer.address}
                          </div>
                        )}
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-brand-blue">{stats.active}</p>
                          <p className="text-xs text-gray-600">Arriendos Activos</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                          <p className="text-xs text-gray-600">Total Arriendos</p>
                        </div>
                      </div>

                      {/* Last Rental */}
                      {stats.lastRental && (
                        <div className="mb-4">
                          <p className="text-xs text-gray-600 mb-1">Último arriendo:</p>
                          <p className="text-sm text-gray-900">
                            {new Date(stats.lastRental.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1">
                          Ver Historial
                        </Button>
                        <Button size="sm" className="bg-brand-blue hover:bg-brand-blue text-white">
                          Editar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>

          {/* Summary */}
          {!customersLoading && filteredCustomers.length > 0 && (
            <Card className="mt-6">
              <CardContent className="p-4">
                <p className="text-sm text-gray-600">
                  Mostrando {filteredCustomers.length} de {customers?.length || 0} clientes
                </p>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
      
      <MobileNav role={'admin'} />
    </div>
  );
}
