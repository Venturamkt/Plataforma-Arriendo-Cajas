import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface BoxStatusBadgeProps {
  status: string;
  className?: string;
}

const statusConfig = {
  'available': {
    label: 'Disponible',
    variant: 'secondary' as const,
    className: 'bg-gray-100 text-gray-800'
  },
  'pendiente': {
    label: 'Pendiente',
    variant: 'secondary' as const,
    className: 'bg-yellow-100 text-yellow-800'
  },
  'pagada': {
    label: 'Pagada',
    variant: 'secondary' as const,
    className: 'bg-blue-100 text-blue-800'
  },
  'entregada': {
    label: 'Entregada',
    variant: 'secondary' as const,
    className: 'bg-green-100 text-green-800'
  },
  'retirada': {
    label: 'Retirada',
    variant: 'secondary' as const,
    className: 'bg-purple-100 text-purple-800'
  },
  'finalizado': {
    label: 'Finalizado',
    variant: 'secondary' as const,
    className: 'bg-gray-100 text-gray-800'
  },
  'cancelada': {
    label: 'Cancelada',
    variant: 'destructive' as const,
    className: 'bg-red-100 text-red-800'
  }
};

export default function BoxStatusBadge({ status, className }: BoxStatusBadgeProps) {
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.available;
  
  return (
    <Badge 
      variant={config.variant}
      className={cn(config.className, className)}
    >
      {config.label}
    </Badge>
  );
}
