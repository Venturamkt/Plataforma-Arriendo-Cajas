import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, QrCode, BarChart3, Users, Search } from "lucide-react";
import { useState } from "react";
import BarcodeScanner from "./barcode-scanner";

interface QuickActionsProps {
  onNewRental?: () => void;
  onViewReports?: () => void;
  onManageCustomers?: () => void;
  onSearch?: (query: string) => void;
}

export default function QuickActions({
  onNewRental,
  onViewReports,
  onManageCustomers,
  onSearch
}: QuickActionsProps) {
  const [showScanner, setShowScanner] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    onSearch?.(value);
  };

  const handleScanSuccess = (barcode: string) => {
    setShowScanner(false);
    handleSearch(barcode);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Acciones Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Button 
              onClick={onNewRental}
              className="flex items-center justify-center space-x-2 bg-brand-red hover:bg-brand-red text-white"
            >
              <Plus className="w-5 h-5" />
              <span>Nuevo Arriendo</span>
            </Button>
            
            <Button 
              onClick={() => setShowScanner(true)}
              className="flex items-center justify-center space-x-2 bg-box-blue hover:bg-box-blue text-white"
            >
              <QrCode className="w-5 h-5" />
              <span>Escanear Código</span>
            </Button>
            
            <Button 
              onClick={onViewReports}
              className="flex items-center justify-center space-x-2 bg-brand-blue hover:bg-brand-blue text-white"
            >
              <BarChart3 className="w-5 h-5" />
              <span>Ver Reportes</span>
            </Button>
            
            <Button 
              onClick={onManageCustomers}
              className="flex items-center justify-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white"
            >
              <Users className="w-5 h-5" />
              <span>Gestionar Clientes</span>
            </Button>
          </div>
          
          {/* Search Bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              type="text"
              placeholder="Buscar por cliente, código de barras o estado..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 focus:ring-brand-blue focus:border-brand-blue"
            />
          </div>
        </CardContent>
      </Card>

      {showScanner && (
        <BarcodeScanner
          onScan={handleScanSuccess}
          onClose={() => setShowScanner(false)}
        />
      )}
    </>
  );
}
