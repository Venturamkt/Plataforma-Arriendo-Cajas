import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import type { User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Users, Mail, UserCheck, Crown, Truck } from "lucide-react";

export default function UserManagement() {
  const { toast } = useToast();
  const { user, isLoading } = useCurrentUser();
  const [searchQuery, setSearchQuery] = useState("");

  // Redirect to home if not authenticated or not admin
  useEffect(() => {
    if (isLoading) return;
    if (!user || user.type !== 'admin') {
      window.location.href = "/";
      return;
    }
  }, [user, isLoading]);

  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
    retry: false,
    enabled: !!user,
  });

  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const response = await fetch(`/api/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      if (!response.ok) throw new Error('Failed to update user role');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Rol actualizado",
        description: "El rol del usuario ha sido actualizado exitosamente",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el rol del usuario",
        variant: "destructive",
      });
    },
  });

  const filteredUsers = users?.filter((u) => 
    searchQuery === "" || 
    u.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="h-4 w-4" />;
      case 'driver':
        return <Truck className="h-4 w-4" />;
      case 'customer':
        return <UserCheck className="h-4 w-4" />;
      default:
        return <UserCheck className="h-4 w-4" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'driver':
        return 'Repartidor';
      case 'customer':
        return 'Cliente';
      default:
        return role;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'driver':
        return 'bg-blue-100 text-blue-800';
      case 'customer':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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
              Gestión de Usuarios
            </h1>
            <p className="text-gray-600">
              Administra los roles y permisos de los usuarios del sistema
            </p>
          </div>

          {/* Search and Filters */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar usuarios por nombre o email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Users Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {usersLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))
            ) : filteredUsers.length === 0 ? (
              <div className="col-span-full">
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Users className="h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No se encontraron usuarios
                    </h3>
                    <p className="text-gray-600 text-center">
                      {searchQuery 
                        ? "Intenta ajustar tu búsqueda"
                        : "No hay usuarios registrados en el sistema"
                      }
                    </p>
                  </CardContent>
                </Card>
              </div>
            ) : (
              filteredUsers.map((u) => (
                <Card key={u.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarFallback>
                            {u.firstName?.charAt(0)}{u.lastName?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {u.firstName} {u.lastName}
                          </h3>
                          <div className="flex items-center text-sm text-gray-600">
                            <Mail className="h-3 w-3 mr-1" />
                            {u.email}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Rol actual:</span>
                        <Badge className={`${getRoleBadgeColor(u.role || 'customer')} flex items-center gap-1`}>
                          {getRoleIcon(u.role || 'customer')}
                          {getRoleLabel(u.role || 'customer')}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Cambiar rol:
                        </label>
                        <Select 
                          value={u.role || 'customer'} 
                          onValueChange={(newRole) => {
                            updateUserRoleMutation.mutate({ 
                              userId: u.id, 
                              role: newRole 
                            });
                          }}
                          disabled={updateUserRoleMutation.isPending}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="customer">Cliente</SelectItem>
                            <SelectItem value="driver">Repartidor</SelectItem>
                            <SelectItem value="admin">Administrador</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Summary */}
          {!usersLoading && filteredUsers.length > 0 && (
            <Card className="mt-6">
              <CardContent className="p-4">
                <p className="text-sm text-gray-600">
                  Mostrando {filteredUsers.length} de {users?.length || 0} usuarios
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