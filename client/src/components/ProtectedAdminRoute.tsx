import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
}

export default function ProtectedAdminRoute({ children }: ProtectedAdminRouteProps) {
  const [, setLocation] = useLocation();
  
  const { data: authData, isLoading, error } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  // Mientras está cargando
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-blue-50">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-red-600" />
          <p className="mt-2 text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  // Si hay error o no está autenticado
  if (error || !authData || !(authData as any).user) {
    setLocation("/admin/login");
    return null;
  }

  const user = (authData as any).user;

  // Si no es admin
  if (user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-blue-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800">Acceso Denegado</h1>
          <p className="mt-2 text-gray-600">No tienes permisos para acceder a esta área.</p>
        </div>
      </div>
    );
  }

  // Si todo está bien, mostrar el contenido
  return <>{children}</>;
}