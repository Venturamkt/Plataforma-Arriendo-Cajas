import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  Truck,
  QrCode
} from "lucide-react";
import { Link, useLocation } from "wouter";

interface MobileNavProps {
  role: string;
}

export default function MobileNav({ role }: MobileNavProps) {
  const [location] = useLocation();

  const getNavItems = () => {
    switch (role) {
      case 'admin':
        return [
          { href: "/", icon: LayoutDashboard, label: "Dashboard" },
          { href: "/admin/inventory", icon: Package, label: "Inventario" },
          { href: "/admin/customers", icon: Users, label: "Clientes" },
          { href: "/admin/deliveries", icon: Truck, label: "Entregas" },
        ];
      case 'driver':
        return [
          { href: "/", icon: LayoutDashboard, label: "Dashboard" },
          { href: "/driver/tasks", icon: Truck, label: "Tareas" },
          { href: "/driver/scan", icon: QrCode, label: "Escanear" },
        ];
      case 'customer':
        return [
          { href: "/", icon: LayoutDashboard, label: "Mi Cuenta" },
          { href: "/customer/rentals", icon: Package, label: "Arriendos" },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-brand-blue border-t border-blue-400 px-4 py-2 z-40">
      <div className="flex justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href || 
            (item.href !== "/" && location.startsWith(item.href));
          
          return (
            <Link key={item.href} href={item.href}>
              <a className={cn(
                "flex flex-col items-center p-2 transition-colors",
                isActive ? "text-white" : "text-blue-200"
              )}>
                <Icon className="w-6 h-6" />
                <span className="text-xs mt-1">{item.label}</span>
              </a>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
