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

const emptyActivities: Activity[] = [];

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
  activities = emptyActivities, 
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
        <div className="text-center py-8 text-gray-500">
          <p className="text-sm">No hay actividad reciente</p>
          <p className="text-xs mt-1">Las actividades aparecerán aquí cuando comiences a usar el sistema</p>
        </div>
      </CardContent>
    </Card>
  );
}
