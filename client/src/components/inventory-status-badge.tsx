import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface InventoryStatusBadgeProps {
  status: "available" | "no_disponible" | "maintenance" | "damaged";
  className?: string;
}

const statusConfig = {
  available: { label: "Disponible", className: "bg-green-100 text-green-800" },
  no_disponible: { label: "No Disponible", className: "bg-blue-100 text-blue-800" },
  maintenance: { label: "Mantenimiento", className: "bg-yellow-100 text-yellow-800" },
  damaged: { label: "Dañada", className: "bg-red-100 text-red-800" },
};

export default function InventoryStatusBadge({ status, className }: InventoryStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.available;
  
  return (
    <Badge 
      variant="secondary"
      className={cn(config.className, className)}
    >
      {config.label}
    </Badge>
  );
}