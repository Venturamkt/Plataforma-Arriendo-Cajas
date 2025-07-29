import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface StatusData {
  status: string;
  count: number;
  color: string;
  percentage: number;
}

interface StatusChartProps {
  data: StatusData[];
  title?: string;
  onViewAll?: () => void;
}

const statusLabels: Record<string, string> = {
  'entregada': 'Entregadas',
  'pagada': 'Pagadas',
  'pendiente': 'Pendientes',
  'retirada': 'Retiradas',
  'cancelada': 'Canceladas',
  'finalizado': 'Finalizadas',
  'available': 'Disponibles',
};

export default function StatusChart({ data, title = "Estado de Cajas", onViewAll }: StatusChartProps) {
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
          {data.map((item) => (
            <div key={item.status} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 ${item.color} rounded-full`}></div>
                <span className="text-sm text-gray-600">
                  {statusLabels[item.status] || item.status}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-900">{item.count}</span>
                <div className="w-20 bg-gray-200 rounded-full h-2">
                  <div 
                    className={`${item.color} h-2 rounded-full`} 
                    style={{ width: `${item.percentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
