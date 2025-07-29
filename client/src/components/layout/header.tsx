import { Button } from "@/components/ui/button";
import { Package, Bell, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function Header() {
  const { user } = useAuth();

  const handleLogout = () => {
    window.location.href = "/api/logout";
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

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-box-blue mr-4" />
            <h1 className="text-xl font-bold text-brand-blue">Arriendo Cajas</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-2 text-sm text-gray-600">
              <span>{user?.firstName} {user?.lastName}</span>
              <span className="text-brand-red font-medium">
                {user?.role && getRoleLabel(user.role)}
              </span>
            </div>
            
            <Button variant="ghost" size="sm" className="p-2 text-gray-400 hover:text-gray-600">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-brand-red rounded-full"></span>
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
