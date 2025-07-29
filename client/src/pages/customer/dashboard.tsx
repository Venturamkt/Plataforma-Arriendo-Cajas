import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import BoxStatusBadge from "@/components/box-status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Package, 
  Calendar, 
  MapPin, 
  Clock, 
  DollarSign,
  AlertCircle,
  CheckCircle,
  FileText,
  Bell,
  Star
} from "lucide-react";

export default function CustomerDashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Find customer record for current user
  const { data: customers } = useQuery({
    queryKey: ["/api/customers"],
    retry: false,
    enabled: isAuthenticated,
  });

  const currentCustomer = customers?.find((customer: any) => customer.userId === user?.id);

  const { data: rentals, isLoading: rentalsLoading } = useQuery({
    queryKey: ["/api/rentals", currentCustomer?.id ? `?customerId=${currentCustomer.id}` : ""],
    retry: false,
    enabled: isAuthenticated && !!currentCustomer?.id,
  });

  const { data: boxes } = useQuery({
    queryKey: ["/api/boxes"],
    retry: false,
    enabled: isAuthenticated,
  });

  // Calculate rental statistics
  const getRentalStats = () => {
    if (!rentals) return { active: 0, total: 0, completed: 0, totalSpent: 0 };
    
    const active = rentals.filter((rental: any) => 
      ['pagada', 'entregada'].includes(rental.status)
    ).length;
    
    const completed = rentals.filter((rental: any) => 
      rental.status === 'finalizado'
    ).length;
    
    const totalSpent = rentals.reduce((sum: number, rental: any) => 
      sum + (parseFloat(rental.totalAmount) || 0), 0
    );
    
    return {
      active,
      total: rentals.length,
      completed,
      totalSpent
    };
  };

  // Get days remaining for active rentals
  const getDaysRemaining = (rental: any) => {
    if (!rental.endDate) return null;
    
    const endDate = new Date(rental.endDate);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  // Get rental boxes details
  const getRentalBoxes = (rentalId: string) => {
    if (!boxes) return [];
    return boxes.filter((box: any) => 
      // This would need to be properly linked through rental_boxes table
      box.status === 'entregada' // Simplified for demo
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(amount);
  };

  const stats = getRentalStats();
  const activeRentals = rentals?.filter((rental: any) => 
    ['pagada', 'entregada'].includes(rental.status)
  ) || [];
  
  const recentRentals = rentals?.slice(0, 5) || [];

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue"></div>
      </div>
    );
  }

  if (!currentCustomer) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <Card className="w-full max-w-md mx-4">
            <CardContent className="pt-6">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Perfil de Cliente No Encontrado
                </h2>
                <p className="text-gray-600 mb-4">
                  No se encontró un perfil de cliente asociado a tu cuenta. 
                  Contacta al administrador para crear tu perfil.
                </p>
                <Button className="bg-brand-blue hover:bg-brand-blue text-white">
                  Contactar Soporte
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="flex">
        <Sidebar role={user.role || 'customer'} />
        
        <main className="flex-1 p-4 lg:p-8 pb-20 lg:pb-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
              Mi Cuenta
            </h1>
            <p className="text-gray-600">
              Gestiona tus arriendos y revisa el estado de tus cajas
            </p>
          </div>

          {/* Welcome Card */}
          <Card className="mb-8 bg-gradient-to-r from-brand-blue to-box-blue text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold mb-2">
                    ¡Hola, {currentCustomer.name}!
                  </h2>
                  <p className="text-blue-100">
                    Tienes {stats.active} arriendo{stats.active !== 1 ? 's' : ''} activo{stats.active !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="text-center">
                  <div className="bg-white bg-opacity-20 rounded-full p-4">
                    <Package className="h-8 w-8" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center mb-3">
                  <div className="bg-green-100 p-3 rounded-full">
                    <Package className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
                <p className="text-sm text-gray-600">Arriendos Activos</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center mb-3">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-sm text-gray-600">Total Arriendos</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center mb-3">
                  <div className="bg-purple-100 p-3 rounded-full">
                    <CheckCircle className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
                <p className="text-sm text-gray-600">Completados</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center mb-3">
                  <div className="bg-yellow-100 p-3 rounded-full">
                    <DollarSign className="h-6 w-6 text-yellow-600" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats.totalSpent)}
                </p>
                <p className="text-sm text-gray-600">Total Gastado</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Active Rentals */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-brand-blue" />
                  Arriendos Activos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activeRentals.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No tienes arriendos activos</p>
                    <Button className="mt-4 bg-brand-red hover:bg-brand-red text-white">
                      Nuevo Arriendo
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeRentals.map((rental: any) => {
                      const daysRemaining = getDaysRemaining(rental);
                      const isExpiringSoon = daysRemaining !== null && daysRemaining <= 3;
                      
                      return (
                        <div key={rental.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <p className="font-semibold text-gray-900">
                                Arriendo #{rental.id.slice(-6)}
                              </p>
                              <p className="text-sm text-gray-600">
                                {rental.totalBoxes} caja{rental.totalBoxes !== 1 ? 's' : ''}
                              </p>
                            </div>
                            <BoxStatusBadge status={rental.status} />
                          </div>
                          
                          {daysRemaining !== null && (
                            <div className="mb-3">
                              <div className="flex items-center justify-between text-sm mb-1">
                                <span>Días restantes</span>
                                <span className={isExpiringSoon ? 'text-red-600 font-medium' : 'text-gray-600'}>
                                  {daysRemaining > 0 ? `${daysRemaining} días` : 'Vencido'}
                                </span>
                              </div>
                              <Progress 
                                value={daysRemaining > 0 ? Math.max(0, Math.min(100, (daysRemaining / 30) * 100)) : 0}
                                className="h-2"
                              />
                              {isExpiringSoon && (
                                <div className="flex items-center gap-1 mt-2 text-sm text-red-600">
                                  <AlertCircle className="h-4 w-4" />
                                  <span>Arriendo próximo a vencer</span>
                                </div>
                              )}
                            </div>
                          )}
                          
                          {rental.deliveryAddress && (
                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                              <MapPin className="h-4 w-4" />
                              <span>{rental.deliveryAddress}</span>
                            </div>
                          )}
                          
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="flex-1">
                              Ver Detalles
                            </Button>
                            {rental.status === 'entregada' && (
                              <Button size="sm" className="bg-brand-blue hover:bg-brand-blue text-white">
                                Solicitar Retiro
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-brand-blue" />
                  Historial Reciente
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentRentals.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No hay historial de arriendos</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentRentals.map((rental: any) => (
                      <div key={rental.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            Arriendo #{rental.id.slice(-6)}
                          </p>
                          <p className="text-sm text-gray-600">
                            {new Date(rental.createdAt).toLocaleDateString('es-CL')} • {rental.totalBoxes} caja{rental.totalBoxes !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <div className="text-right">
                          <BoxStatusBadge status={rental.status} />
                          <p className="text-sm text-gray-600 mt-1">
                            {formatCurrency(parseFloat(rental.totalAmount) || 0)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Customer Satisfaction */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-brand-blue" />
                ¿Cómo ha sido tu experiencia?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <p className="text-gray-600 mb-2">
                    Tu opinión nos ayuda a mejorar nuestro servicio
                  </p>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star} 
                        className="h-6 w-6 text-yellow-400 fill-current cursor-pointer hover:text-yellow-500"
                      />
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline">
                    Dejar Comentario
                  </Button>
                  <Button className="bg-brand-red hover:bg-brand-red text-white">
                    Contactar Soporte
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
      
      <MobileNav role={user.role || 'customer'} />
    </div>
  );
}
