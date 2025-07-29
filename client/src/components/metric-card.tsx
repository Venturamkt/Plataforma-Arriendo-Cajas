import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
}

export default function MetricCard({ 
  title, 
  value, 
  icon: Icon, 
  iconColor, 
  change, 
  changeType = "neutral" 
}: MetricCardProps) {
  const getChangeColor = () => {
    switch (changeType) {
      case "positive":
        return "text-green-600";
      case "negative":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
          <div className={`${iconColor} bg-opacity-10 p-3 rounded-full`}>
            <Icon className={`w-6 h-6 ${iconColor.replace('bg-', 'text-')}`} />
          </div>
        </div>
        {change && (
          <div className="mt-4">
            <span className={`text-sm font-medium ${getChangeColor()}`}>
              {change}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
