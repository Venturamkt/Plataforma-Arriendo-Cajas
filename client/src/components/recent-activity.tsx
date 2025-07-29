import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, DollarSign, Plus, ArrowLeft } from "lucide-react";

interface Activity {
  id: string;
  type: "delivery" | "payment" | "reservation" | "return";
  title: string;
  description: string;
  timestamp: string;
}

interface RecentActivityProps {
  activities?: Activity[];
  title?: string;
  onViewAll?: () => void;
}

const mockActivities: Activity[] = [
  {
    id: "1",
    type: "delivery",
    title: "Caja CJ-001247 entregada",
    description: "Cliente: María González - hace 15 min",
    timestamp: "15 min ago"
  },
  {
    id: "2",
    type: "payment",
    title: "Pago confirmado - $45.000",
    description: "Pedido #ARR-2024-089 - hace 32 min",
    timestamp: "32 min ago"
  },
  {
    id: "3",
    type: "reservation",
    title: "Nueva reserva creada",
    description: "Cliente: Carlos Rodríguez - hace 1 hora",
    timestamp: "1 hour ago"
  },
  {
    id: "4",
    type: "return",
    title: "Cajas retiradas y limpiadas",
    description: "6 cajas listas para nuevo arriendo - hace 2 horas",
    timestamp: "2 hours ago"
  }
];

const getActivityIcon = (type: string) => {
  switch (type) {
    case "delivery":
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    case "payment":
      return <DollarSign className="w-4 h-4 text-blue-600" />;
    case "reservation":
      return <Plus className="w-4 h-4 text-yellow-600" />;
    case "return":
      return <ArrowLeft className="w-4 h-4 text-gray-600" />;
    default:
      return <CheckCircle className="w-4 h-4 text-gray-600" />;
  }
};

const getActivityBgColor = (type: string) => {
  switch (type) {
    case "delivery":
      return "bg-green-100";
    case "payment":
      return "bg-blue-100";
    case "reservation":
      return "bg-yellow-100";
    case "return":
      return "bg-gray-100";
    default:
      return "bg-gray-100";
  }
};

export default function RecentActivity({ 
  activities = mockActivities, 
  title = "Actividad Reciente", 
  onViewAll 
}: RecentActivityProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">{title}</CardTitle>
          {onViewAll && (
            <Button variant="ghost" onClick={onViewAll} className="text-brand-blue hover:text-blue-700">
              Ver Todo
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div 
              key={activity.id} 
              className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md"
            >
              <div className={`${getActivityBgColor(activity.type)} p-2 rounded-full`}>
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                <p className="text-xs text-gray-500">{activity.description}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
