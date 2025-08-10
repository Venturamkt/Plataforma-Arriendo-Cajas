import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  Truck, 
  BarChart3,
  QrCode,
  UserCog,
  ClipboardList,
  Mail
} from "lucide-react";
import { Link, useLocation } from "wouter";

interface SidebarProps {
  role: string;
}

export default function Sidebar({ role }: SidebarProps) {
  const [location] = useLocation();

  const adminNavItems = [
    { href: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/admin/inventory", icon: Package, label: "Inventario" },
    { href: "/admin/customers", icon: Users, label: "Clientes" },
    { href: "/admin/rental-status", icon: ClipboardList, label: "Estado Arriendos" },
    { href: "/admin/deliveries", icon: Truck, label: "Entregas" },
    { href: "/admin/emails", icon: Mail, label: "Emails" },
    { href: "/admin/reports", icon: BarChart3, label: "Reportes" },
    { href: "/admin/users", icon: UserCog, label: "Usuarios" },
  ];

  const driverNavItems = [
    { href: "/driver/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/driver/tasks", icon: Truck, label: "Tareas" },
    { href: "/driver/scan", icon: QrCode, label: "Escanear" },
  ];

  const customerNavItems = [
    { href: "/customer/dashboard", icon: LayoutDashboard, label: "Mi Cuenta" },
    { href: "/customer/rentals", icon: Package, label: "Mis Arriendos" },
  ];

  const getNavItems = () => {
    switch (role) {
      case 'admin':
        return adminNavItems;
      case 'driver':
        return driverNavItems;
      case 'customer':
        return customerNavItems;
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  return (
    <nav className="bg-brand-blue w-64 min-h-screen p-4 hidden lg:block">
      <div className="space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href || 
            (item.href !== "/admin/dashboard" && item.href !== "/driver/dashboard" && item.href !== "/customer/dashboard" && location.startsWith(item.href));
          
          return (
            <Link key={item.href} href={item.href}>
              <a className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-md font-medium transition-colors",
                isActive 
                  ? "text-white bg-white bg-opacity-20" 
                  : "text-blue-100 hover:text-white hover:bg-white hover:bg-opacity-10"
              )}>
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </a>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
